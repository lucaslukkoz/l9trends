# L9Trends - Multi-Provider Email Dashboard

## 1. Project Overview

A full-stack web application that allows users to authenticate via Gmail OAuth, connect multiple email accounts (Gmail OAuth2 and IMAP/SMTP), and manage their emails from a unified dashboard interface. Email synchronization for IMAP accounts runs asynchronously via BullMQ background workers.

### Core Capabilities

- Gmail OAuth2 authentication (sign in with Google)
- Multi-provider email support: Gmail OAuth2 + IMAP/SMTP
- Multiple email accounts per user
- Background email sync via BullMQ queue workers
- Incremental IMAP sync using UIDs
- Inbox browsing with Redis-cached email lists
- Single email viewing with cached content
- Email composition and sending (Gmail API or SMTP)
- Reply and forward emails with threading support (In-Reply-To, References headers)
- CC and BCC support in all compose flows
- Email deletion with cache invalidation
- Connected email account management (add/remove via Settings page)
- Dockerized development environment with hot-reload via bind mounts

---

## 2. System Architecture

### Component Diagram

```
┌──────────────────────────┐
│   Browser / Next.js      │
│   (localhost:3000)        │
└──────────┬───────────────┘
           │ HTTP (REST JSON)
           v
┌──────────────────────────┐
│   Express Backend API    │
│   (localhost:3001)        │
└──┬────┬────┬────┬────────┘
   │    │    │    │
   v    │    v    v
┌──────┐│┌───────┐┌──────────────┐
│MySQL │││ Redis ││ Google Gmail  │
│:3306 │││ :6379 ││ API (OAuth2) │
└──────┘│└───┬───┘└──────────────┘
        │    │
        │    │ BullMQ
        v    v
┌──────────────────────────┐
│   Background Worker      │
│   (email-sync)           │
└──────┬───────────────────┘
       │
       v
┌──────────────────┐
│ IMAP/SMTP Servers│
│ (Terra, Yahoo,   │
│  custom domains) │
└──────────────────┘
```

### Data Flow

1. Frontend sends all API requests to `http://localhost:3001/api/...`.
2. Backend validates JWT from `Authorization: Bearer <token>` header via middleware.
3. For **Gmail** operations, backend retrieves the user's stored OAuth2 tokens from `email_accounts`, refreshes if expired, then calls the Gmail API directly.
4. For **IMAP** operations, emails are pre-synced to the local `emails` table by the background worker. The API reads from MySQL.
5. Redis sits as a read-through cache for both providers.
6. Write operations (send, delete) execute directly (Gmail API or SMTP/IMAP), then invalidate relevant Redis keys.
7. IMAP email sync is queued via BullMQ and processed by a dedicated worker service.

### Provider Abstraction

Both Gmail and IMAP providers implement a unified `IEmailProvider` interface:
- `listMessages(pageToken?, maxResults?)` → `EmailListDTO`
- `getMessage(messageId)` → `EmailDetailDTO`
- `sendMessage(to, subject, body)` → `{ messageId, threadId }`
- `trashMessage(messageId)` → `void`

A factory function (`getEmailProvider`) returns the correct adapter based on `account.provider`.

### Docker Network

All five services (frontend, backend, worker, mysql, redis) share a single Docker bridge network called `l9trends-network`. Services reference each other by container name.

---

## 3. Folder Structure

```
L9Trends/
├── project.md
├── docker-compose.yml
├── .env.example
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── keys/
│   │   ├── private.key                    # RSA private key (auto-generated, gitignored)
│   │   └── public.key                     # RSA public key (auto-generated, gitignored)
│   └── src/
│       ├── app.ts                          # Express app setup (cors, json parser, routes)
│       ├── server.ts                       # API entry point: listen on port, sync DB
│       ├── worker.ts                       # Worker entry point: starts BullMQ worker (no Express)
│       │
│       ├── auth/
│       │   └── jwtService.ts              # RS256 key management, signToken, verifyToken
│       │
│       ├── config/
│       │   ├── database.ts                 # Sequelize instance & connection config
│       │   ├── redis.ts                    # Redis client setup (ioredis)
│       │   ├── env.ts                      # Validated environment variables
│       │   └── google.ts                   # Google OAuth2 client factory
│       │
│       ├── controllers/
│       │   ├── auth.controller.ts          # me (user profile)
│       │   ├── gmail.controller.ts         # connect, callback, getEmails, etc. (legacy)
│       │   └── account.controller.ts       # listAccounts, addImap, removeAccount, emails, sync
│       │
│       ├── services/
│       │   ├── auth.service.ts             # findOrCreateFromGmail, getUserProfile
│       │   ├── gmail.service.ts            # Gmail-specific service (legacy, kept for backward compat)
│       │   ├── email.service.ts            # Unified email service (provider-agnostic)
│       │   ├── account.service.ts          # Account management (add/remove/list)
│       │   └── cache.service.ts            # get/set/invalidate helpers wrapping Redis
│       │
│       ├── models/
│       │   ├── index.ts                    # Model registry & associations
│       │   ├── User.ts                     # User model
│       │   ├── GmailToken.ts              # GmailToken model (legacy, backward compat)
│       │   ├── EmailAccount.ts            # Multi-provider email account model
│       │   ├── Email.ts                   # Stored email messages (synced from IMAP)
│       │   └── EmailAttachment.ts         # Email attachment metadata
│       │
│       ├── routes/
│       │   ├── index.ts                    # Root router: mounts auth + gmail + accounts
│       │   ├── auth.routes.ts              # /api/auth/*
│       │   ├── gmail.routes.ts             # /api/gmail/* (legacy)
│       │   └── account.routes.ts           # /api/accounts/* (multi-provider)
│       │
│       ├── middlewares/
│       │   ├── authenticate.ts             # JWT verification middleware
│       │   ├── errorHandler.ts             # Global error handler
│       │   └── validate.ts                 # Request body validation (zod schemas)
│       │
│       ├── providers/
│       │   ├── email.interface.ts          # IEmailProvider interface + DTOs
│       │   ├── email.factory.ts            # Provider factory (gmail/imap)
│       │   ├── gmail/
│       │   │   ├── client.ts               # OAuth2 client per user (legacy)
│       │   │   ├── auth.ts                 # generateAuthUrl, exchangeCodeForTokens
│       │   │   ├── adapter.ts              # GmailAdapter implements IEmailProvider
│       │   │   └── messages.ts             # Gmail API operations
│       │   └── imap/
│       │       ├── client.ts               # ImapFlow connection factory
│       │       ├── adapter.ts              # ImapAdapter implements IEmailProvider
│       │       ├── messages.ts             # IMAP read from DB, SMTP send, IMAP delete
│       │       └── sync.ts                 # Incremental IMAP sync logic (UID-based)
│       │
│       ├── queues/
│       │   └── email-sync.queue.ts         # BullMQ queue: enqueue, schedule, remove sync jobs
│       │
│       ├── workers/
│       │   └── email-sync.worker.ts        # BullMQ worker: processes IMAP sync jobs
│       │
│       ├── scripts/
│       │   └── migrate-gmail-tokens.ts     # One-time migration: GmailToken → EmailAccount
│       │
│       └── utils/
│           ├── encryption.ts               # AES-256 encrypt/decrypt for tokens at rest
│           ├── errors.ts                   # Custom error classes
│           └── pagination.ts               # pageToken / nextPageToken helpers
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── next.config.js
    ├── postcss.config.js
    └── src/
        ├── app/
        │   ├── layout.tsx                  # Root layout (AuthProvider, global styles)
        │   ├── page.tsx                    # Landing / redirect to dashboard
        │   ├── login/
        │   │   └── page.tsx
        │   ├── register/
        │   │   └── page.tsx
        │   ├── dashboard/
        │   │   ├── layout.tsx              # Authenticated layout (AccountProvider)
        │   │   ├── page.tsx                # Inbox list view (multi-account)
        │   │   ├── [emailId]/
        │   │   │   └── page.tsx            # Single email view
        │   │   └── add-account/
        │   │       └── page.tsx            # Add IMAP account form
        │   ├── compose/
        │   │   └── page.tsx                # Compose new email
        │   └── gmail/
        │       └── callback/
        │           └── page.tsx            # OAuth callback landing
        │
        ├── components/
        │   ├── EmailList.tsx
        │   ├── EmailItem.tsx
        │   ├── EmailView.tsx
        │   ├── EmailPreview.tsx            # Split-panel email preview
        │   ├── ComposeForm.tsx
        │   ├── Navbar.tsx
        │   ├── Sidebar.tsx                 # Includes AccountSelector
        │   ├── AccountSelector.tsx         # Multi-account switcher
        │   └── ProtectedRoute.tsx
        │
        ├── lib/
        │   ├── api.ts                      # Axios wrapper with JWT interceptor
        │   └── auth.ts                     # Token storage helpers (localStorage)
        │
        ├── hooks/
        │   ├── useAuth.ts
        │   ├── useEmails.ts                # Account-scoped email operations
        │   └── useAccounts.ts              # Account CRUD operations
        │
        ├── context/
        │   ├── AuthContext.tsx
        │   └── AccountContext.tsx          # Active account state management
        │
        ├── types/
        │   ├── auth.ts
        │   ├── email.ts
        │   └── account.ts                 # EmailAccount, AddImapAccountData
        │
        └── styles/
            └── globals.css                 # Tailwind directives + frosted glass utilities
```

---

## 4. Database Schema

### Table: `users`

| Column     | Type           | Constraints                     |
|------------|----------------|---------------------------------|
| id         | INT UNSIGNED   | PK, AUTO_INCREMENT              |
| name       | VARCHAR(255)   | NOT NULL                        |
| email      | VARCHAR(255)   | NOT NULL, UNIQUE                |
| created_at | DATETIME       | NOT NULL, DEFAULT NOW           |
| updated_at | DATETIME       | NOT NULL, DEFAULT NOW ON UPDATE |

### Table: `gmail_tokens` (legacy — kept for backward compatibility)

| Column        | Type           | Constraints                     |
|---------------|----------------|---------------------------------|
| id            | INT UNSIGNED   | PK, AUTO_INCREMENT              |
| user_id       | INT UNSIGNED   | FK → users.id, NOT NULL, UNIQUE |
| access_token  | TEXT           | NOT NULL (AES-256 encrypted)    |
| refresh_token | TEXT           | NOT NULL (AES-256 encrypted)    |
| expires_at    | DATETIME       | NOT NULL                        |
| gmail_email   | VARCHAR(255)   | NOT NULL                        |
| created_at    | DATETIME       | NOT NULL, DEFAULT NOW           |
| updated_at    | DATETIME       | NOT NULL, DEFAULT NOW ON UPDATE |

### Table: `email_accounts` (multi-provider)

| Column           | Type                          | Constraints                     |
|------------------|-------------------------------|---------------------------------|
| id               | INT UNSIGNED                  | PK, AUTO_INCREMENT              |
| user_id          | INT UNSIGNED                  | FK → users.id, NOT NULL         |
| provider         | ENUM('gmail','imap')          | NOT NULL                        |
| email            | VARCHAR(255)                  | NOT NULL                        |
| display_name     | VARCHAR(255)                  | NULL                            |
| is_active        | BOOLEAN                       | DEFAULT true                    |
| access_token     | TEXT                          | NULL (AES-256, Gmail only)      |
| refresh_token    | TEXT                          | NULL (AES-256, Gmail only)      |
| token_expires_at | DATETIME                      | NULL (Gmail only)               |
| imap_host        | VARCHAR(255)                  | NULL (IMAP only)                |
| imap_port        | INT                           | NULL (IMAP only)                |
| smtp_host        | VARCHAR(255)                  | NULL (IMAP only)                |
| smtp_port        | INT                           | NULL (IMAP only)                |
| imap_user        | VARCHAR(255)                  | NULL (AES-256, IMAP only)       |
| imap_password    | TEXT                          | NULL (AES-256, IMAP only)       |
| use_tls          | BOOLEAN                       | DEFAULT true                    |
| last_sync_uid    | INT UNSIGNED                  | NULL                            |
| last_sync_at     | DATETIME                      | NULL                            |
| sync_status      | ENUM('idle','syncing','error')| DEFAULT 'idle'                  |
| sync_error       | TEXT                          | NULL                            |
| created_at       | DATETIME                      | NOT NULL, DEFAULT NOW           |
| updated_at       | DATETIME                      | NOT NULL, DEFAULT NOW ON UPDATE |

### Table: `emails` (synced messages, primarily for IMAP)

| Column          | Type           | Constraints                               |
|-----------------|----------------|-------------------------------------------|
| id              | INT UNSIGNED   | PK, AUTO_INCREMENT                        |
| account_id      | INT UNSIGNED   | FK → email_accounts.id, NOT NULL, CASCADE |
| message_uid     | VARCHAR(255)   | NOT NULL                                  |
| thread_id       | VARCHAR(255)   | NULL                                      |
| from_address    | VARCHAR(255)   | NOT NULL                                  |
| to_address      | VARCHAR(255)   | NULL                                      |
| subject         | VARCHAR(500)   | NULL                                      |
| snippet         | VARCHAR(500)   | NULL                                      |
| body_html       | MEDIUMTEXT     | NULL                                      |
| body_text       | MEDIUMTEXT     | NULL                                      |
| date            | DATETIME       | NOT NULL                                  |
| is_read         | BOOLEAN        | DEFAULT false                             |
| labels          | JSON           | NULL                                      |
| has_attachments | BOOLEAN        | DEFAULT false                             |
| created_at      | DATETIME       | NOT NULL, DEFAULT NOW                     |
| updated_at      | DATETIME       | NOT NULL, DEFAULT NOW ON UPDATE           |

UNIQUE INDEX on `(account_id, message_uid)` — prevents duplicate sync.

### Table: `email_attachments`

| Column    | Type           | Constraints                       |
|-----------|----------------|-----------------------------------|
| id        | INT UNSIGNED   | PK, AUTO_INCREMENT                |
| email_id  | INT UNSIGNED   | FK → emails.id, NOT NULL, CASCADE |
| filename  | VARCHAR(255)   | NOT NULL                          |
| mime_type | VARCHAR(255)   | NOT NULL                          |
| size      | INT UNSIGNED   | DEFAULT 0                         |
| created_at| DATETIME       | NOT NULL, DEFAULT NOW             |
| updated_at| DATETIME       | NOT NULL, DEFAULT NOW ON UPDATE   |

### Relationships

- `users` 1:N `email_accounts` via `email_accounts.user_id` (CASCADE)
- `email_accounts` 1:N `emails` via `emails.account_id` (CASCADE)
- `emails` 1:N `email_attachments` via `email_attachments.email_id` (CASCADE)
- `users` 1:1 `gmail_tokens` (legacy, backward compat)

### Model Notes

- Use `underscored: true` so Sequelize maps camelCase to snake_case columns
- All credentials (OAuth tokens, IMAP passwords) encrypted with AES-256-GCM using `ENCRYPTION_KEY`
- Encryption/decryption handled in `utils/encryption.ts`

---

## 5. JWT Authentication (RS256)

### Overview

Authentication uses asymmetric JWT tokens signed with RSA keys (RS256 algorithm):
- **`backend/keys/private.key`** — used to sign tokens (kept secret)
- **`backend/keys/public.key`** — used to verify tokens

Keys are auto-generated on first server startup if they don't exist. The `keys/` directory is gitignored.

### Token Flow

1. User authenticates via Gmail OAuth → backend calls `signToken({ id, email })` with the private key
2. Frontend stores JWT in localStorage, sends as `Authorization: Bearer <token>` on every request
3. `authenticate` middleware verifies the token using the public key
4. Decoded payload `{ id, email }` is attached to `req.user`

### Implementation Files

- **`backend/src/auth/jwtService.ts`** — `ensureKeys()`, `signToken()`, `verifyToken()`
- **`backend/src/middlewares/authenticate.ts`** — Express middleware using `verifyToken()`
- **`backend/src/services/auth.service.ts`** — uses `signToken()` when creating/authenticating users

### Security

- Algorithm: RS256 (2048-bit RSA)
- Token expiration: 7 days (configurable via `JWT_EXPIRES_IN` env var)
- Private key never leaves the server or appears in API responses
- Keys generated with `crypto.generateKeyPairSync()` — no external dependencies

---

## 6. API Design

All endpoints prefixed with `/api`. JSON request/response bodies.

### 5.1 Auth Endpoints

#### GET `/api/auth/me`

- **Auth:** Bearer JWT
- **200:** `{ id, name, email, gmailConnected, gmailEmail, accounts: EmailAccount[] }`
- **Errors:** 401

### 5.2 Gmail OAuth Endpoints (legacy, still functional)

#### GET `/api/gmail/connect`

- **Description:** Returns Google OAuth2 authorization URL
- **200:** `{ url: string }`

#### GET `/api/gmail/callback?code=<auth_code>`

- **Description:** Exchanges auth code for tokens, creates EmailAccount + GmailToken
- **Success:** 302 redirect to frontend callback
- **Errors:** 400 (missing code), 500 (token exchange failure)

### 5.3 Account Endpoints (multi-provider)

All require `Authorization: Bearer <jwt>`.

#### GET `/api/accounts`

- **200:** `{ accounts: EmailAccount[] }`

#### POST `/api/accounts/imap`

- **Description:** Add IMAP/SMTP email account. Tests connection before saving.
- **Body:** `{ email, displayName?, imapHost, imapPort, smtpHost, smtpPort, username, password, useTls? }`
- **201:** `EmailAccount` object
- **Errors:** 400 (validation), 502 (IMAP connection failed)

#### DELETE `/api/accounts/:accountId`

- **200:** `{ message: "Account removed successfully" }`
- **Errors:** 404

#### GET `/api/accounts/:accountId/emails?pageToken=<string>&maxResults=<number>`

- **Description:** Lists emails for account (cached). Gmail: calls API. IMAP: reads from DB.
- **200:** `{ emails: EmailSummary[], nextPageToken: string | null, resultSizeEstimate: number }`

#### GET `/api/accounts/:accountId/emails/:emailId`

- **Description:** Fetches full email content (cached)
- **200:** `EmailDetail` object

#### POST `/api/accounts/:accountId/emails/send`

- **Description:** Sends email via Gmail API or SMTP. Invalidates inbox cache.
- **Body:** `{ to: string, subject: string, body: string }`
- **201:** `{ messageId: string, threadId: string }`

#### DELETE `/api/accounts/:accountId/emails/:emailId`

- **Description:** Trashes email. Invalidates cache.
- **200:** `{ message: "Email deleted successfully" }`

#### POST `/api/accounts/:accountId/sync`

- **Description:** Triggers manual IMAP sync (enqueues BullMQ job)
- **200:** `{ message: "Sync job enqueued" }`

---

## 7. Gmail OAuth2 Flow

### Authorization Flow

1. **User clicks "Connect Gmail"** on the frontend dashboard.
2. **Frontend calls `GET /api/gmail/connect`**. Backend builds a Google OAuth2 URL with:
   - `client_id` from env `GOOGLE_CLIENT_ID`
   - `redirect_uri`: `http://localhost:3001/api/gmail/callback`
   - `scope`: `https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify`
   - `access_type`: `offline` (to receive refresh_token)
   - `prompt`: `consent` (forces consent screen so refresh_token is always returned)
   - `state`: encrypted userId for CSRF protection and user identification on callback
3. **Backend returns** `{ url: "https://accounts.google.com/o/oauth2/v2/auth?..." }`.
4. **Frontend redirects** via `window.location.href = url`.
5. **User authorizes** on Google consent screen.
6. **Google redirects** to `http://localhost:3001/api/gmail/callback?code=AUTH_CODE&state=...`.
7. **Backend callback handler:**
   - Extracts `code` and `state` from query params
   - Verifies `state` to identify the user
   - Calls `oauth2Client.getToken(code)` to exchange for `{ access_token, refresh_token, expiry_date }`
   - Calls Gmail API `users.getProfile` to get connected Gmail address
   - Encrypts `access_token` and `refresh_token` with AES-256-GCM
   - Upserts into `gmail_tokens` table
   - Redirects to `http://localhost:3000/dashboard?gmail=connected`
8. **Frontend detects** `gmail=connected` query param and refreshes user state.

### Token Refresh Flow

Handled transparently in `providers/gmail/auth.ts`:

1. Before every Gmail API call, check `gmail_tokens.expires_at`.
2. If expires within 5 minutes, trigger refresh.
3. Call `oauth2Client.setCredentials({ refresh_token })` then `oauth2Client.getAccessToken()`.
4. Google returns new `access_token` and `expiry_date`.
5. Encrypt new access_token and update `gmail_tokens` row.
6. Proceed with the original API call.

### Error Handling

- If refresh fails with `invalid_grant`: refresh token revoked → delete `gmail_tokens` row → return 403 with `{ error: "GMAIL_REAUTH_REQUIRED" }` → frontend shows "Reconnect Gmail" prompt.

---

## 8. Redis Caching Strategy

### Client

`ioredis` package connecting to `redis://redis:6379` inside Docker. Also used by BullMQ for job queues.

### Key Schema

| Key Pattern                              | Value                     | TTL  |
|------------------------------------------|---------------------------|------|
| `inbox:{accountId}:{pageToken\|"first"}` | JSON string of email list | 120s |
| `email:{accountId}:{emailId}`            | JSON string of full email | 600s |

Note: Keys are now scoped by `accountId` (not userId) to support multi-account.

### Read-Through Cache Logic

```typescript
async function getCachedOrFetch<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  const data = await fetcher();
  await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  return data;
}
```

### Invalidation Rules

| Action       | Keys Invalidated                                                |
|--------------|-----------------------------------------------------------------|
| Send email   | All `inbox:{accountId}:*` keys                                 |
| Delete email | All `inbox:{accountId}:*` keys + `email:{accountId}:{emailId}` |
| Reconnect    | All `inbox:{accountId}:*` keys + all `email:{accountId}:*`     |

### Invalidation Implementation

Use `redis.scan` with MATCH pattern (cursor-based). Never use `KEYS` in production.

```typescript
async function invalidatePattern(pattern: string): Promise<void> {
  let cursor = '0';
  do {
    const [nextCursor, keys] = await redis.scan(
      cursor, 'MATCH', pattern, 'COUNT', 100
    );
    cursor = nextCursor;
    if (keys.length > 0) await redis.del(...keys);
  } while (cursor !== '0');
}
```

### TTL Rationale

- **Inbox (120s):** Inboxes change frequently. 2-minute TTL balances freshness against Gmail API quota limits.
- **Single email (600s):** Email content rarely changes. 10 minutes is safe.

---

## 9. IMAP/SMTP Integration

### Connection Flow

1. User fills the "Add IMAP Account" form (host, port, credentials).
2. Backend tests the IMAP connection to validate credentials.
3. If connection succeeds, credentials are encrypted and stored in `email_accounts`.
4. A `imap-full-sync` BullMQ job is enqueued for initial email sync.
5. A recurring sync job is scheduled (every 5 minutes).

### Incremental Sync (UID-based)

IMAP UIDs are monotonically increasing within a mailbox:

1. Worker connects to IMAP server using `imapflow`.
2. Opens INBOX, searches for `UID > lastSyncUid`.
3. If first sync (`lastSyncUid` is null), fetches last 200 messages.
4. Fetches headers + body for each message.
5. Parses with `mailparser` (simpleParser).
6. Inserts into `emails` table (unique index prevents duplicates).
7. Updates `email_accounts.last_sync_uid` to highest UID fetched.

### SMTP Sending

Emails are sent via `nodemailer` using the account's SMTP settings:
- Host, port, TLS from `email_accounts`
- Credentials decrypted from `imap_user` and `imap_password`

### Reading Emails (IMAP accounts)

Unlike Gmail (which reads from API), IMAP emails are served from the local `emails` table. The `ImapAdapter.listMessages()` queries MySQL with offset-based pagination.

---

## 10. BullMQ Queue Architecture

### Queue: `email-sync`

Uses the same Redis instance. Job types:

| Job Name         | Data              | Purpose                        | Retries |
|------------------|-------------------|--------------------------------|---------|
| `imap-sync`      | `{ accountId }`   | Incremental sync (UID-based)   | 3       |
| `imap-full-sync` | `{ accountId }`   | Initial full sync (last 200)   | 3       |

### Worker Configuration

- **Concurrency:** 3 (processes 3 jobs simultaneously)
- **Rate limiter:** max 10 jobs per 60 seconds
- **Backoff:** exponential, starting at 5 seconds
- **Cleanup:** keeps last 100 completed, 200 failed jobs

### Recurring Jobs

Each IMAP account gets a repeatable job every 5 minutes via BullMQ's `repeat` option. Removed when account is deleted.

### Worker Entrypoint

`backend/src/worker.ts` — connects to DB, syncs models, starts the BullMQ worker. Runs as a separate Docker service (same image, different command).

### Sync State Tracking

`email_accounts.sync_status` tracks: `idle` → `syncing` → `idle` (or `error`). `sync_error` stores the last error message. `last_sync_at` records successful sync time.

---

## 11. Development Roadmap

### Phase 1: Project Scaffolding & Infrastructure

- Create `docker-compose.yml` with 4 services: backend, frontend, mysql, redis
- Configure bind mounts for hot-reload (`./backend:/app`, `./frontend:/app`)
- Backend Dockerfile: Node 20 Alpine, `npm install`, `npx ts-node-dev src/server.ts`
- Frontend Dockerfile: Node 20 Alpine, `npm install`, `npm run dev`
- MySQL with persistent volume and init environment variables
- Redis with default config
- Create `.env.example` files
- Validate `docker compose up` starts all services

### Phase 2: Backend Foundation

- Initialize Express app with TypeScript, cors, helmet, express-json
- Set up Sequelize with MySQL connection (`config/database.ts`)
- Create `User` and `GmailToken` models with associations
- Implement `utils/encryption.ts` (AES-256-GCM)
- Implement `utils/errors.ts` (custom error classes)
- Implement `middlewares/errorHandler.ts`
- Implement `middlewares/validate.ts` (zod-based validation)
- Set up Redis client (`config/redis.ts`)
- Set up route mounting in `app.ts` and `routes/index.ts`

### Phase 3: Authentication

- Implement `auth.service.ts`: user creation, credential validation, JWT generation (7d expiry)
- Implement `auth.controller.ts`: register, login, me
- Implement `middlewares/authenticate.ts`: JWT verify, attach `req.user`
- Wire up `auth.routes.ts`

### Phase 4: Gmail OAuth2 Integration

- Set up Google Cloud project, enable Gmail API, create OAuth2 credentials
- Implement `config/google.ts`
- Implement `providers/gmail/client.ts`: OAuth2 client factory
- Implement `providers/gmail/auth.ts`: generateAuthUrl, getTokensFromCode, refreshAccessToken
- Implement connect and callback handlers in `gmail.controller.ts`
- Wire up routes

### Phase 5: Gmail Operations

- Implement `providers/gmail/messages.ts`: listMessages, getMessage, sendMessage, trashMessage
- Implement `cache.service.ts`: getCachedOrFetch, invalidatePattern
- Implement `gmail.service.ts`: fetchInbox, fetchEmail, sendEmail, deleteEmail with caching
- Implement remaining `gmail.controller.ts` handlers
- Wire up all gmail routes

### Phase 6: Frontend - Auth Pages

- Initialize Next.js with TypeScript and Tailwind
- Create `AuthContext` with JWT storage in localStorage
- Create `lib/api.ts` with Bearer token interceptor
- Build Login and Register pages
- Build `ProtectedRoute` / authenticated layout
- Build Navbar with user info and logout

### Phase 7: Frontend - Dashboard & Email Views

- Dashboard page: "Connect Gmail" button, email list
- `EmailList` and `EmailItem` components
- Single email view at `/dashboard/[emailId]`
- Compose page with form (to, subject, body)
- Gmail OAuth callback page
- Delete action with confirmation dialog
- Loading, error, and empty states

### Phase 8: IMAP/SMTP Multi-Provider Support

- Create `EmailAccount`, `Email`, `EmailAttachment` models
- Implement `IEmailProvider` interface and provider factory
- Implement `GmailAdapter` wrapping existing Gmail code
- Implement IMAP provider: client, messages, adapter, sync
- Implement BullMQ queue and worker for background email sync
- Add worker Docker service
- Create account-scoped API routes (`/api/accounts/...`)
- Create unified `email.service.ts` using provider factory
- Frontend: AccountSelector, add IMAP account page, account-scoped hooks

### Phase 9: Polish & Error Handling

- Toast notifications for success/error
- Gmail reauth flow (403 → reconnect prompt)
- IMAP connection error handling and retry
- Inbox pagination with nextPageToken
- Responsive design with Tailwind

---

## 12. Environment Variables

### Backend `.env`

```
PORT=3001
NODE_ENV=development

DB_HOST=mysql
DB_PORT=3306
DB_NAME=l9trends
DB_USER=root
DB_PASSWORD=rootpassword

REDIS_HOST=redis
REDIS_PORT=6379

JWT_EXPIRES_IN=7d
# JWT keys auto-generated at backend/keys/ (RS256, no secret needed)

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/gmail/callback

ENCRYPTION_KEY=your-32-byte-hex-encryption-key
```

### Frontend `.env.local`

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## 13. Docker Compose Structure

```yaml
version: "3.8"

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: l9trends
    ports:
      - "3307:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - l9trends-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - l9trends-network

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - mysql
      - redis
    env_file:
      - ./backend/.env
    networks:
      - l9trends-network

  worker:
    build: ./backend
    command: ["npx", "ts-node-dev", "--respawn", "--transpile-only", "src/worker.ts"]
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - mysql
      - redis
    env_file:
      - ./backend/.env
    networks:
      - l9trends-network

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    env_file:
      - ./frontend/.env.local
    networks:
      - l9trends-network

volumes:
  mysql_data:

networks:
  l9trends-network:
    driver: bridge
```

### Key Docker Details

- **5 services:** mysql, redis, backend, worker, frontend
- **Worker service** uses the same backend image but runs `src/worker.ts` instead of `src/server.ts`
- **Bind mounts** (`./backend:/app`) enable hot-reload during development
- **Anonymous volume** `/app/node_modules` prevents host node_modules from overwriting container's
- **`depends_on`** ensures MySQL and Redis start before backend and worker
- All services share the `l9trends-network` bridge network
- MySQL exposed on host port 3307 (to avoid conflicts with local MySQL)
