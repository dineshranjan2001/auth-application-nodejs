# Application Setup and Startup Guide

## 1. Project Overview

This project uses **Node.js, Express 5, PostgreSQL, and Prisma ORM 7** to provide the backend foundation for an authentication application.

The application follows a modular structure with separate responsibilities for configuration, routes, controllers, services, repositories, and middleware.

## 2. Technology Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express 5 | Backend web framework |
| PostgreSQL | Relational database |
| Prisma ORM 7 | Database access and migrations |
| `@prisma/adapter-pg` | PostgreSQL driver adapter |
| `pg` | PostgreSQL driver |
| Helmet | HTTP security headers |
| CORS | Cross-origin request configuration |
| Cookie Parser | Parse cookies from incoming requests |
| Express Rate Limit | Protect APIs against excessive requests |
| dotenv | Environment variable management |
| bcrypt | Password hashing |
| jsonwebtoken | JWT access-token generation and verification |

## 3. Prerequisites

Before starting the application, ensure the following are installed:

- Node.js (use a supported LTS release).
- npm.
- PostgreSQL.
- A database created for this project.

Verify the installed versions:

```bash
node --version
npm --version
```

## 4. Project Structure

A suggested project structure:

```text
auth-project/
│
├── generated/
│   └── prisma/
│
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── src/
│   ├── config/
│   │   └── prisma.js
│   │
│   ├── controllers/
|   |   
|   ├── enums/
|   |
│   │
│   ├── middlewares/
│   │   └── errorhandler.middleware.js
│   │
│   ├── repositories/
│   │
│   ├── routes/
│   │   └── auth.route.js
│   │
│   ├── services/
│   │
│   ├── utils/
│   │
│   ├── app.js
│   └── server.js
│
├── .env
├── .gitignore
├── package.json
├── package-lock.json
└── prisma.config.ts
```

## 5. Environment Configuration

Create a `.env` file in the project root.

```env
NODE_ENV=development

PORT=8000

FRONTEND_URL=http://localhost:5173

DATABASE_URL="postgresql://postgres:password@localhost:5432/auth_project?schema=public"

JWT_ACCESS_SECRET=your_access_token_secret
JWT_ACCESS_EXPIRES_IN=10m

REFRESH_TOKEN_EXPIRES_IN=30d
```

Update the PostgreSQL username, password, host, port, and database name according to your local configuration.

**Important:** Never commit `.env` files or real secrets to Git.

## 6. Prisma 7 Configuration

Prisma 7 uses a separate configuration file for database connection configuration.

### 6.1 Prisma schema

File: `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}
```

Define your application models inside this schema.

### 6.2 Prisma configuration

File: `prisma.config.ts`

```ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

The database URL is configured here rather than directly inside the Prisma schema's datasource block.

### 6.3 Prisma Client initialization

File: `src/config/prisma.js`

```js
import "dotenv/config";

import { PrismaClient } from "../../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
    adapter,
});

export default prisma;
```

This initializes Prisma Client using the PostgreSQL driver adapter.

## 7. Application Configuration

File: `src/app.js`

The application configuration is responsible for creating the Express application and registering its middleware and routes.

```js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.route.js";
import { errorHandler } from "./middlewares/errorhandler.middleware.js";

const app = express();

app.use(helmet());

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));

app.use(express.json());

app.use(cookieParser());

app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
}));

app.use("/api/v1/auth", authRoutes);

// Protected example API
// app.get("/api/v1/profile", authenticate, (req, res) => {
//     res.status(200).json({
//         success: true,
//         data: {
//             userId: req.auth?.userId,
//         },
//     });
// });

app.use(errorHandler);

export default app;
```

### Middleware execution order

The middleware is registered in the following order:

1. **Helmet:** Adds security-related HTTP response headers.
2. **CORS:** Allows requests from the configured frontend origin and enables credentials.
3. **Express JSON:** Parses incoming JSON request bodies.
4. **Cookie Parser:** Makes incoming cookies available through `req.cookies`.
5. **Rate Limiter:** Restricts excessive incoming requests.
6. **Authentication Routes:** Registers authentication endpoints.
7. **Error Handler:** Handles errors forwarded through Express middleware.

**Rate-limiting note:** Your current configuration applies the limit globally to all requests handled by this Express application. Consider separate limits for login, registration, and refresh endpoints as your application grows. The current limit is 10 requests per 15 minutes per client IP.

## 8. Server Startup

File: `src/server.js`

The server entry point is responsible for loading environment variables and starting the HTTP server.

For a Prisma-backed application, use the following version to verify the database connection before accepting requests:

```js
import "dotenv/config";

import app from "./app.js";
import prisma from "./config/prisma.js";

const PORT = process.env.PORT || 8000;

const startServer = async () => {
    try {
        await prisma.$connect();

        console.log("Database connected successfully");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Application startup failed:", error);

        await prisma.$disconnect();

        process.exit(1);
    }
};

startServer();
```

**Why connect before listening?**

- Verifies database connectivity during application startup.
- Prevents the server from accepting requests when the database is unavailable.
- Makes startup failures easier to identify.
- Ensures the application is ready to use its database when it begins accepting requests.

The original `app.listen()` implementation is sufficient for starting Express, but it does not explicitly verify the database connection first.

## 9. Package Scripts

Recommended scripts for your existing `package.json`:

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "prisma:init": "npx prisma init --datasource-provider postgresql --output ../generated/prisma",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:generate": "prisma generate",
    "db:reset": "prisma migrate reset"
  }
}
```

### Script descriptions

| Command | Description |
|---|---|
| `npm run dev` | Starts the application using Nodemon |
| `npm start` | Starts the application |
| `npm run prisma:init` | Initializes Prisma configuration |
| `npm run db:migrate -- --name init` | Creates and applies a development migration |
| `npm run db:generate` | Generates Prisma Client |
| `npm run db:deploy` | Applies pending migrations in production |
| `npm run db:reset` | Resets the development database |

Use `db:reset` carefully because it resets the database and can delete existing data.

## 10. Initial Application Setup

Follow these steps when setting up the project for the first time.

### Step 1: Install dependencies

```bash
npm install
```

### Step 2: Configure environment variables

Create `.env` and configure:

- PostgreSQL connection string.
- Frontend origin.
- JWT secrets.
- Application port.

### Step 3: Generate Prisma Client

```bash
npm run db:generate
```

### Step 4: Create database migration

```bash
npm run db:migrate -- --name init
```

### Step 5: Start the application

```bash
npm run dev
```

## 11. Application Startup Flow

The application startup process follows this sequence:

```text
Start Application
       |
       v
Load Environment Variables
       |
       v
Import Express Application
       |
       v
Initialize Prisma Client
       |
       v
Connect to PostgreSQL
       |
       v
Database Connection Successful?
       |
       +------ No ------> Log Error and Exit
       |
       v
Start Express HTTP Server
       |
       v
Application Ready
```

## 12. API Base URL

Once the application starts successfully:

```text
http://localhost:8000
```

Authentication APIs are available under:

```text
http://localhost:8000/api/v1/auth
```

For example:

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/auth/register` | Register a new user |
| POST | `/api/v1/auth/login` | Authenticate a user |
| POST | `/api/v1/auth/refresh` | Rotate refresh token |
| POST | `/api/v1/auth/logout` | Log out current session |
| POST | `/api/v1/auth/logout-all` | Log out from all sessions |

The exact endpoints depend on the routes registered in `auth.route.js`.

## 13. Production Considerations

Before deploying the application:

- Set `NODE_ENV=production`.
- Use a production PostgreSQL database.
- Keep secrets in a secure environment-variable manager.
- Configure CORS with the actual frontend origin.
- Use HTTPS for production.
- Configure secure refresh-token cookie settings.
- Apply production migrations using `prisma migrate deploy`.
- Run `prisma generate` as part of the deployment process when required.
- Use `npm ci` for reproducible dependency installation when deploying from a committed lockfile.
- Configure graceful shutdown to close the HTTP server and disconnect Prisma.
- Configure rate limits according to endpoint sensitivity and expected traffic.

**CORS and cookies:** Since your application uses `credentials: true`, the frontend must send credentialed requests. The frontend origin must be an explicit origin, not `*`. Cookie `SameSite` and `Secure` settings must also match your frontend/backend deployment topology.

---

## Conclusion

The application follows a modular Express architecture with Prisma 7 as the database access layer.

The `app.js` file configures Express middleware and routes, while `server.js` handles environment loading, database connectivity, and HTTP server startup. This separation keeps application configuration independent from the server lifecycle and makes the project easier to maintain and extend.