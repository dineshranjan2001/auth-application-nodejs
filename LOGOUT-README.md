



### Logout Scenarios and Expected Behavior

| Scenario | Session Count | Active Refresh Token Count | Result |
|---|---:|---:|---|
| Normal logout | 1 | 1 | `true` |
| Multiple refresh tokens | 1 | 3 | `true` |
| Already logged out | 0 | 0 | `false` |
| Session exists, but all refresh tokens are already revoked | 1 | 0 | `true` |
| Session does not exist | 0 | 0 | `false` |

**Note:** The logout operation returns `true` when an active session is successfully revoked. It returns `false` when no active session exists. All active refresh tokens associated with the session are revoked within the same database transaction.