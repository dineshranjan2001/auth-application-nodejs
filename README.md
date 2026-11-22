# Authentication System – Access Token & Refresh Token Rotation

## 1. Overview

This document describes the authentication and session-management flow implemented using Node.js, Express.js, PostgreSQL, and Prisma ORM.

The authentication system uses:

- **Access Token:** JWT-based authentication for accessing protected APIs.
- **Refresh Token:** Secure, opaque token used to generate new access tokens.
- **Refresh Token Rotation:** Every successful refresh operation generates a new refresh token and invalidates the previous one.
- **Reuse Detection:** Detects attempts to reuse an already-consumed refresh token and revokes the associated session.
- **Session Management:** Maintains individual user sessions with device and request information.
- **HTTP-only Cookies:** Stores refresh tokens securely in browser cookies.
- **Centralized Error Handling:** Handles application errors through a common error-handling middleware.

### Technology Stack

| Technology | Purpose |
|---|---|
| Node.js | Backend runtime |
| Express.js | REST API framework |
| JavaScript (ES Modules) | Application development |
| PostgreSQL | Relational database |
| Prisma ORM | Database access and transactions |
| JWT | Access-token generation and verification |
| bcrypt | Password hashing |
| crypto | Secure refresh-token generation and hashing |
| cookie-parser | Reading refresh-token cookies |

---

## 2. Authentication Architecture

The authentication system follows a layered architecture:

```text
Client (Browser / Postman)
          |
          v
     Express Server
          |
          v
       Routes
          |
          v
    Middleware Layer
    - Request Validation
    - Authentication
    - Rate Limiting
          |
          v
      Controller
          |
          v
       Service
          |
          v
      Repository
          |
          v
      Prisma ORM
          |
          v
      PostgreSQL
```

### Responsibilities

| Layer | Responsibility |
|---|---|
| Routes | Defines authentication endpoints |
| Middleware | Handles authentication, validation, and request processing |
| Controller | Handles HTTP requests and responses |
| Service | Implements authentication and session business logic |
| Repository | Handles database operations |
| Utils | Provides reusable functions for tokens, cookies, and other operations |
| Error Handler | Handles application errors centrally |

---

## 3. Database Design

The authentication system maintains three primary entities:

1. User
2. Session
3. RefreshToken

### 3.1 User

Stores user account information.

| Field | Description |
|---|---|
| id | Unique user identifier |
| name | User name |
| email | Unique email address |
| passwordHash | Hashed password |
| isActive | Indicates whether the account is active |
| createdAt | Account creation timestamp |
| updatedAt | Last account update timestamp |

### 3.2 Session

Stores individual login sessions for each user.

| Field | Description |
|---|---|
| id | Unique session identifier |
| userId | Associated user identifier |
| deviceInfo | Device information |
| ipAddress | Client IP address |
| userAgent | Client user-agent information |
| expiresAt | Session expiration timestamp |
| lastUsedAt | Last successful refresh timestamp |
| revokedAt | Session revocation timestamp |
| createdAt | Session creation timestamp |

**Important field behavior:**

- `lastUsedAt` is initialized during login.
- `lastUsedAt` is updated after successful refresh-token rotation.
- `lastUsedAt` is not updated during refresh-token reuse detection.
- `lastUsedAt` is not updated during logout or logout-all.
- `revokedAt` records when a session is terminated.

### 3.3 RefreshToken

Stores refresh-token records and their rotation history.

| Field | Description |
|---|---|
| id | Unique refresh-token identifier |
| sessionId | Associated session identifier |
| tokenHash | SHA-256 hash of the refresh token |
| expiresAt | Refresh-token expiration timestamp |
| consumedAt | Timestamp when the token was successfully consumed |
| revokedAt | Timestamp when the token was revoked |
| replacedById | Reference to the replacement refresh token |
| createdAt | Token creation timestamp |

**Security consideration:** Raw refresh tokens are never stored in the database. Only their hashes are stored.

---

## 4. Application Startup

The application initializes the required middleware and infrastructure before accepting requests.

### Startup sequence

1. Load environment variables.
2. Initialize the Express application.
3. Configure JSON parsing.
4. Configure cookie-parser.
5. Configure CORS and trusted proxy settings where required.
6. Register API routes.
7. Register the 404 handler.
8. Register the global error handler.
9. Connect to PostgreSQL through Prisma.
10. Start the HTTP server.

### Required middleware

```js
app.use(express.json());
app.use(cookieParser());
```

If the application is behind a trusted reverse proxy, configure Express `trust proxy` according to the actual deployment topology. Do not blindly trust arbitrary forwarded headers.

### Environment configuration

Example environment variables:

```env
NODE_ENV=development
PORT=8000

DATABASE_URL="postgresql://user:password@localhost:5432/auth_db"

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRES_IN=10m

ACCESS_TOKEN_ISSUER=my-api
ACCESS_TOKEN_AUDIENCE=my-frontend
```

Use strong, independently generated secrets in production. Never commit real secrets to source control.

### Database initialization

```bash
npx prisma generate
npx prisma migrate dev
```

For production deployments, apply committed migrations using:

```bash
npx prisma migrate deploy
```

Start the application using the appropriate project script, for example:

```bash
npm run dev
```

---

## 5. User Registration Flow

**Endpoint:** `POST /api/v1/auth/register`

Registration creates a new user account.

### Request

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "StrongPassword@123"
}
```

### Processing flow

1. Client sends registration details.
2. Validation middleware validates the request.
3. Controller forwards validated data to the authentication service.
4. Service checks whether the email already exists.
5. Password is hashed using bcrypt.
6. Repository creates the user record.
7. API returns a successful registration response.

### Response

```json
{
  "success": true,
  "message": "User registered successfully",
  "statusCode": 201,
  "data": {
    "id": "user-uuid",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Note:** Registration does not automatically create a session or issue tokens in this implementation. The user must log in separately.

---

## 6. Login Flow

**Endpoint:** `POST /api/v1/auth/login`

Login authenticates the user and creates a new session.

### Request

```json
{
  "email": "john@example.com",
  "password": "StrongPassword@123"
}
```

### Processing flow

1. Client submits email and password.
2. Validation middleware validates the request.
3. Service retrieves the user using the email.
4. Service verifies the account status.
5. bcrypt compares the supplied password with the stored password hash.
6. If credentials are valid, a new session is created.
7. Device information, IP address, and user-agent information are captured.
8. An access token is generated.
9. A cryptographically secure refresh token is generated.
10. The refresh token is hashed and stored in the database.
11. The session and refresh-token records are created within a database transaction.
12. The raw refresh token is sent through an HTTP-only cookie.
13. The access token is returned in the response body.

### Session metadata

```js
{
  deviceInfo,
  ipAddress: req.ip,
  userAgent: req.get("user-agent")
}
```

The IP address depends on the network connection and correctly configured trusted proxies.

### Access-token payload

Example:

```json
{
  "sub": "user-uuid",
  "sid": "session-uuid",
  "iat": 1795000000,
  "exp": 1795000600
}
```

- `sub`: User identifier.
- `sid`: Session identifier.
- `iat`: Issued-at timestamp.
- `exp`: Expiration timestamp.

### Response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "access-token"
  }
}
```

The refresh token is not returned in the JSON response. It is stored in an HTTP-only cookie.

---

## 7. Refresh Cookie Configuration

The refresh token is stored in an HTTP-only cookie.

### Cookie options

```js
{
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/api/v1/auth",
  maxAge: 30 * 24 * 60 * 60 * 1000
}
```

| Option | Purpose |
|---|---|
| httpOnly | Prevents JavaScript from directly accessing the cookie |
| secure | Sends the cookie only over HTTPS when enabled |
| sameSite | Helps protect against cross-site request forgery |
| path | Defines the URL paths receiving the cookie |
| maxAge | Defines the cookie lifetime in milliseconds |

### Reusable cookie utility

The cookie utility exposes two functions:

```js
setRefreshTokenCookie(res, refreshToken, options);
clearRefreshTokenCookie(res, options);
```

Example:

```js
setRefreshTokenCookie(res, result.refreshToken, {
  path: "/api/v1/auth",
  maxAge: 30 * 24 * 60 * 60 * 1000
});
```

To clear the cookie:

```js
clearRefreshTokenCookie(res, {
  path: "/api/v1/auth"
});
```

**Important:** The same cookie path and domain configuration must be used when setting and clearing the cookie. The cookie lifetime should also be consistent with the actual session expiration policy.

---

## 8. Access Token Authentication

Protected APIs require a valid access token.

### Processing flow

1. Client sends a request with the access token in the Authorization header.
2. Authentication middleware extracts the Bearer token.
3. JWT signature and expiration are verified.
4. The middleware extracts the user ID and session ID.
5. The corresponding session is checked in the database.
6. The middleware verifies that:
   - The session exists.
   - The session is not revoked.
   - The session has not expired.
   - The user account is active.
7. If all checks pass, the request continues to the controller.

### Request header

```http
Authorization: Bearer <access-token>
```

### Authentication failure scenarios

| Scenario | Expected result |
|---|---|
| Missing access token | 401 Unauthorized |
| Invalid JWT | 401 Unauthorized |
| Expired JWT | 401 Unauthorized |
| Session revoked | 401 Unauthorized |
| Session expired | 401 Unauthorized |
| Inactive user | 401 Unauthorized |

Unexpected database or infrastructure failures should be passed to the global error handler rather than incorrectly converted into 401 responses.

---

## 9. Refresh Token Rotation Flow

**Endpoint:** `POST /api/v1/auth/refresh`

Refresh-token rotation generates a new refresh token whenever a valid refresh token is used.

### Processing flow

1. Client sends a refresh request.
2. Browser automatically includes the refresh-token cookie when its cookie rules permit.
3. Controller extracts the refresh token from the cookie.
4. Service hashes the received refresh token.
5. Repository searches for the matching token hash.
6. Service retrieves the associated session.
7. A new refresh token is generated.
8. A database transaction begins.
9. The associated session row is locked to serialize concurrent refresh operations.
10. The session and old refresh-token records are re-read inside the transaction.
11. The service verifies that the session and token are valid.
12. The old refresh token is marked as consumed.
13. A new refresh-token record is created.
14. The old token's `replacedById` is updated.
15. Session `lastUsedAt` is updated.
16. The transaction commits.
17. A new access token is generated.
18. The new refresh token is sent through the HTTP-only cookie.
19. The new access token is returned in the response body.

### Rotation example

```text
Initial state:

Session S1
   |
   └── Refresh Token RT-1 (Active)

Successful refresh:

RT-1
 |
 ├── consumedAt = current timestamp
 ├── replacedById = RT-2
 |
 └── RT-2 (Active)

Next successful refresh:

RT-2
 |
 ├── consumedAt = current timestamp
 ├── replacedById = RT-3
 |
 └── RT-3 (Active)
```

Only the latest refresh token should be usable for the session.

### Response

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new-access-token"
  }
}
```

The new refresh token is delivered through the updated HTTP-only cookie.

---

## 10. Refresh Token Reuse Detection

Reuse detection protects the authentication system when an already-consumed refresh token is presented again.

### Example scenario

```text
Initial state:

RT-1 = Active

First refresh request:

RT-1 -> Consumed
RT-2 -> Created

Second request using RT-1:

RT-1 -> Already Consumed
```

The second request indicates possible refresh-token reuse.

### Processing flow

1. A request arrives with an old refresh token.
2. Service hashes the received token.
3. The token record is found in the database.
4. Service identifies that the token has already been consumed.
5. The associated session is revoked.
6. All refresh tokens belonging to that session are revoked.
7. Session revocation is committed successfully.
8. A refresh-token reuse error is thrown outside the transaction.
9. The global error handler identifies the error code.
10. The refresh-token cookie is cleared.
11. The client receives an authentication failure response.

### Reuse detection diagram

```text
             Refresh RT-1
                  |
                  v
          Validate RT-1
                  |
                  v
           Is it consumed?
              /       \
            No         Yes
            |           |
            v           v
       Rotate token   Reuse detected
            |           |
            v           v
       Create RT-2   Revoke session
            |           |
            v           v
       Update lastUsedAt  Revoke all
            |             refresh tokens
            v                 |
       Commit transaction     v
            |             Commit transaction
            v                 |
       Return new tokens      v
                         Throw application error
                               |
                               v
                       Clear refresh cookie
```

**Important implementation detail:** The reuse-detection error must be thrown after the transaction commits. Throwing it inside the transaction would roll back the session and token revocation operations.

### Session behavior during reuse detection

| Field | Behavior |
|---|---|
| lastUsedAt | Remains unchanged |
| revokedAt | Updated |
| Refresh-token records | Revoked |
| Session status | Revoked |

---

## 11. Concurrent Refresh Requests

Concurrent refresh requests must be handled carefully.

Example:

```text
Request A                    Request B
    |                            |
    |------ RT-1 --------------->|
    |                            |
    | Acquire session lock       |
    |                            |
    | Mark RT-1 consumed         |
    | Create RT-2                |
    |                            |
    | Commit transaction         |
    |                            |
    |                       Acquire session lock
    |                            |
    |                       Read RT-1
    |                            |
    |                       RT-1 consumed
    |                            |
    |                       Detect reuse
    |                            |
    |                       Revoke session
    |                            |
    |                       Commit transaction
```

The session-row lock serializes refresh operations for the same session.

**Important:** Strict reuse detection can interpret a legitimate duplicate concurrent request as token reuse. The frontend should coordinate refresh requests, ideally across tabs as well as within a single tab. A retry or grace-period policy should only be introduced after carefully considering its security implications.

---

## 12. Logout – Current Session

**Endpoint:** `POST /api/v1/auth/logout`

Logout terminates the current session.

### Processing flow

1. Client sends the logout request.
2. Controller reads the refresh-token cookie.
3. Service hashes the token and identifies its associated session.
4. The session is revoked.
5. All refresh tokens belonging to the session are revoked.
6. The database transaction commits.
7. The refresh-token cookie is cleared.
8. The API returns a successful logout response.

### Session updates

| Field | Action |
|---|---|
| revokedAt | Updated |
| lastUsedAt | Unchanged |
| Refresh-token records | Revoked |

Logout should be idempotent according to the API contract: repeating a logout request should not restore or otherwise modify a terminated session.

---

## 13. Logout All Sessions

**Endpoint:** `POST /api/v1/auth/logout-all`

Logout-all terminates every active session belonging to the authenticated user.

### Processing flow

1. Client sends the logout-all request with a valid access token.
2. Authentication middleware verifies the access token and session.
3. Controller obtains the authenticated user ID.
4. Service identifies all sessions belonging to that user.
5. Active sessions are revoked.
6. All associated refresh tokens are revoked.
7. The database transaction commits.
8. The current refresh-token cookie is cleared.
9. The API returns a successful response.

### Session updates

| Field | Action |
|---|---|
| revokedAt | Updated for active sessions |
| lastUsedAt | Unchanged |
| Refresh-token records | Revoked |

**Important:** Logout-all must revoke every session for the authenticated user, not only the current session. Since access tokens are checked against session status, subsequent protected requests using those sessions will fail.

---

## 14. Centralized Error Handling

The application uses a custom `AppError` class and a centralized global error handler.

### AppError

```js
class AppError extends Error {
  constructor(
    message,
    statusCode = 500,
    code = ERROR_CODES.INTERNAL_SERVER_ERROR
  ) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
```

### Error codes

| Error Code | HTTP Status | Description |
|---|---:|---|
| REFRESH_TOKEN_REQUIRED | 401 | Refresh token cookie is missing |
| REFRESH_TOKEN_INVALID | 401 | Refresh token is invalid |
| REFRESH_TOKEN_EXPIRED | 401 | Refresh token has expired |
| REFRESH_TOKEN_REUSED | 401 | Previously consumed refresh token was reused |
| SESSION_REVOKED | 401 | Associated session has been revoked |
| UNAUTHORIZED | 401 | Authentication is required |
| FORBIDDEN | 403 | User does not have permission |
| VALIDATION_ERROR | 400 | Request validation failed |
| RESOURCE_NOT_FOUND | 404 | Requested resource does not exist |
| RESOURCE_ALREADY_EXISTS | 409 | Resource already exists |
| INTERNAL_SERVER_ERROR | 500 | Unexpected application or server error |

### Cookie clearing in the global error handler

The global error handler clears the refresh-token cookie only for relevant refresh-token authentication failures.

It should not clear the cookie for database failures, network failures, or unexpected server errors.

Example:

```js
const refreshTokenErrorCodes = new Set([
  ERROR_CODES.REFRESH_TOKEN_REQUIRED,
  ERROR_CODES.REFRESH_TOKEN_INVALID,
  ERROR_CODES.REFRESH_TOKEN_EXPIRED,
  ERROR_CODES.REFRESH_TOKEN_REUSED,
  ERROR_CODES.SESSION_REVOKED,
]);
```

The refresh route's cookie-clearing behavior should be scoped to the refresh endpoint, rather than applying to unrelated routes that happen to use the same error code.

---

## 15. API Endpoint Summary

| Method | Endpoint | Authentication | Purpose |
|---|---|---|---|
| POST | `/api/v1/auth/register` | No | Register a user |
| POST | `/api/v1/auth/login` | No | Authenticate user and create session |
| POST | `/api/v1/auth/refresh` | Refresh cookie | Generate new access and refresh tokens |
| POST | `/api/v1/auth/logout` | Refresh cookie | Revoke current session |
| POST | `/api/v1/auth/logout-all` | Access token | Revoke all user sessions |

---

## 16. Postman Testing Guide

### 16.1 Registration

**Request:**

```http
POST /api/v1/auth/register
Content-Type: application/json
```

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "StrongPassword@123"
}
```

Expected: `201 Created`.

### 16.2 Login

**Request:**

```http
POST /api/v1/auth/login
Content-Type: application/json
```

```json
{
  "email": "john@example.com",
  "password": "StrongPassword@123"
}
```

Expected:

- Access token returned in the response.
- Refresh token stored in the Postman cookie manager.
- New session and refresh-token records created in PostgreSQL.

### 16.3 Protected API

**Request header:**

```http
Authorization: Bearer <access-token>
```

Expected: Request succeeds if the token, user, and session are valid.

### 16.4 Refresh token

**Request:**

```http
POST /api/v1/auth/refresh
```

Expected:

- Previous refresh token becomes consumed.
- New refresh token is stored in the database.
- New refresh-token cookie is returned.
- New access token is returned in the response.

### 16.5 Reuse detection

To test reuse detection:

1. Login and obtain RT-1.
2. Refresh using RT-1 and obtain RT-2.
3. Manually send the old RT-1 again.
4. Verify that reuse is detected.
5. Verify that the associated session is revoked.
6. Verify that all refresh tokens for that session are revoked.
7. Verify that the response clears the refresh-token cookie.

### 16.6 Logout

Send a logout request with the refresh-token cookie.

Expected:

- Current session is revoked.
- Associated refresh tokens are revoked.
- Refresh-token cookie is cleared.

### 16.7 Logout all

Send the logout-all request with a valid access token.

Expected:

- All sessions belonging to the user are revoked.
- All associated refresh tokens are revoked.
- Current refresh-token cookie is cleared.

---

## 17. Expected Session and Token Behavior

| Scenario | Session count | Refresh-token count | Expected result |
|---|---:|---:|---|
| Normal login | 1 | 1 | Session created |
| Successful refresh | 1 | 2 | Old token consumed, new token active |
| Multiple refreshes | 1 | Multiple | Only latest token active |
| Refresh-token reuse | 1 | Multiple | Session and all associated tokens revoked |
| Normal logout | 1 | 1 | Session and token revoked |
| Logout with multiple refresh tokens | 1 | 3 | Session and all tokens revoked |
| Already logged out | 0 | 0 | No active session to revoke |
| Session exists, tokens already revoked | 1 | 0 | Session can still be marked revoked |
| Logout-all | Multiple | Multiple | All user sessions and associated tokens revoked |

Counts in this table represent records retained for audit/history, not necessarily active records. Consumed and revoked token records should be retained for the required reuse-detection and audit period.

---

## 18. Security Considerations

The following security measures are important for production deployment:

1. **Password Security:** Store passwords only as secure password hashes using bcrypt or an appropriate password-hashing algorithm.
2. **Refresh Token Security:** Generate cryptographically secure opaque refresh tokens.
3. **Token Storage:** Store only refresh-token hashes in the database.
4. **Token Rotation:** Issue a new refresh token after every successful refresh.
5. **Reuse Detection:** Revoke the associated session when a consumed refresh token is reused.
6. **Database Transactions:** Perform token rotation and session revocation atomically.
7. **Concurrency Control:** Serialize refresh requests for the same session.
8. **Cookie Security:** Use HTTP-only and secure cookies in production.
9. **CSRF Protection:** Configure appropriate CSRF defenses based on the frontend/backend deployment and cookie SameSite policy.
10. **Rate Limiting:** Apply rate limits to login, registration, and refresh endpoints.
11. **Input Validation:** Validate request bodies before processing.
12. **Secret Management:** Store JWT secrets in environment variables or a secure secret-management system.
13. **Session Expiration:** Enforce session and refresh-token expiration at the database/service level.
14. **Error Handling:** Avoid exposing internal database errors, stack traces, or sensitive authentication details to clients.

---

## 19. Important Implementation Notes

- Access tokens are short-lived and used for protected API requests.
- Refresh tokens are long-lived and stored in HTTP-only cookies.
- Refresh tokens are rotated after successful use.
- Consumed refresh-token records must remain available for reuse detection.
- A reused refresh token results in revocation of its associated session.
- Logout revokes only the current session.
- Logout-all revokes all sessions belonging to the authenticated user.
- `lastUsedAt` represents successful refresh activity in the current implementation.
- `revokedAt` represents session termination.
- Cookie-setting and cookie-clearing utilities should use consistent cookie identity options.
- Unexpected infrastructure failures must not automatically clear valid refresh cookies.

---

## 20. Conclusion

This authentication implementation provides a session-based authentication lifecycle with JWT access tokens and rotating opaque refresh tokens.

It includes secure password handling, device-aware sessions, refresh-token hashing, token rotation, reuse detection, concurrent refresh protection, individual logout, logout-all, and centralized error handling.

The design aims to provide secure session management while keeping authentication logic separated into maintainable application layers.s