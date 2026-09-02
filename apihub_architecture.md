# ApiHub — Production-Scalable Architecture Guide

> A Postman-clone built with **React 19 (Vite)** · **Express 5** · **Prisma** · **PostgreSQL** · **JWT Auth**

---

## 1. Monorepo Root Structure

```
ApiHub/
├── client/                     # React SPA (Vite)
├── server/                     # Express API
├── prisma/                     # DB schema + migrations (shared at root or inside server/)
├── packages/                   # Shared code (types, constants, validation schemas)
│   └── shared/
│       ├── src/
│       │   ├── types/          # TypeScript interfaces shared client ↔ server
│       │   ├── constants/      # HTTP methods, status codes, limits
│       │   └── validators/     # Zod/Joi schemas used on both sides
│       ├── package.json
│       └── index.js
├── .env.example
├── .gitignore
├── docker-compose.yml          # Postgres + optional Redis
├── package.json                # Root workspace config
└── README.md
```

> [!TIP]
> Use npm/pnpm **workspaces** so `client`, `server`, and `packages/shared` can import from each other without symlink hacks.

---

## 2. Server Folder Structure

This is the heart of scalability. Each **domain** is a self-contained module.

```
server/
├── src/
│   ├── server.js               # Entry point — bootstraps Express app
│   ├── app.js                  # Express app factory (middleware, routes, error handler)
│   │
│   ├── config/
│   │   ├── index.js            # Central config (reads .env, exports constants)
│   │   ├── db.js               # Prisma client singleton
│   │   └── cors.js             # CORS whitelist
│   │
│   ├── modules/                # ★ Feature-based modules (the scalable pattern)
│   │   ├── auth/
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.validation.js    # Zod/Joi schemas for signup/login
│   │   │   └── auth.test.js
│   │   │
│   │   ├── user/
│   │   │   ├── user.routes.js
│   │   │   ├── user.controller.js
│   │   │   ├── user.service.js
│   │   │   └── user.test.js
│   │   │
│   │   ├── collection/
│   │   │   ├── collection.routes.js
│   │   │   ├── collection.controller.js
│   │   │   ├── collection.service.js
│   │   │   ├── collection.validation.js
│   │   │   └── collection.test.js
│   │   │
│   │   ├── request/
│   │   │   ├── request.routes.js
│   │   │   ├── request.controller.js
│   │   │   ├── request.service.js
│   │   │   ├── request.validation.js
│   │   │   └── request.test.js
│   │   │
│   │   ├── history/
│   │   │   ├── history.routes.js
│   │   │   ├── history.controller.js
│   │   │   ├── history.service.js
│   │   │   └── history.test.js
│   │   │
│   │   └── environment/
│   │       ├── environment.routes.js
│   │       ├── environment.controller.js
│   │       ├── environment.service.js
│   │       ├── environment.validation.js
│   │       └── environment.test.js
│   │
│   ├── middleware/
│   │   ├── authenticate.js     # JWT verification → req.user
│   │   ├── validate.js         # Generic Zod/Joi validation middleware
│   │   ├── errorHandler.js     # Central async error handler
│   │   ├── rateLimiter.js      # Per-user rate limiting
│   │   └── notFound.js         # 404 catch-all
│   │
│   ├── utils/
│   │   ├── ApiError.js         # Custom error class with statusCode
│   │   ├── ApiResponse.js      # Consistent { success, data, message } wrapper
│   │   ├── asyncHandler.js     # try/catch wrapper for async route handlers
│   │   ├── jwt.js              # signToken / verifyToken helpers
│   │   ├── httpClient.js       # Axios instance for proxying user requests
│   │   └── variableParser.js   # {{var}} substitution engine
│   │
│   └── routes/
│       └── index.js            # Master router — imports all module routes
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.js                 # Dev seed data
│   └── migrations/
│
├── tests/
│   ├── setup.js                # Test DB, global fixtures
│   └── integration/            # Full route-level tests
│
├── .env
├── .env.example
├── nodemon.json
└── package.json
```

### Why This Pattern?

| Concern | How it's handled |
|---|---|
| **Adding a new feature** | Create a new folder in `modules/`, add routes to the master router. Zero changes to existing files. |
| **Testing in isolation** | Each module has its own `.test.js`. Service layer is pure logic — easy to unit test without Express. |
| **Team scaling** | Two devs can work on `collection/` and `history/` without merge conflicts. |
| **Swapping DB** | All Prisma calls live in `.service.js` files. Swap the ORM, touch nothing else. |

---

## 3. Client Folder Structure

```
client/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx                # ReactDOM.createRoot
│   ├── App.jsx                 # Router + global providers
│   │
│   ├── assets/                 # Static images, icons, fonts
│   │
│   ├── styles/
│   │   ├── index.css           # CSS reset + design tokens (CSS custom properties)
│   │   ├── components.css      # Shared component styles
│   │   └── utilities.css       # Utility classes
│   │
│   ├── config/
│   │   ├── api.js              # Axios instance, base URL, interceptors
│   │   └── constants.js        # HTTP methods, content types, etc.
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useRequest.js       # Build + send request logic
│   │   ├── useCollections.js
│   │   ├── useHistory.js
│   │   ├── useEnvironments.js
│   │   └── useDebounce.js
│   │
│   ├── stores/                 # Zustand stores
│   │   ├── authStore.js
│   │   ├── requestStore.js     # Active request builder state
│   │   ├── collectionStore.js
│   │   ├── historyStore.js
│   │   ├── environmentStore.js
│   │   └── uiStore.js          # Sidebar state, active tabs, panels
│   │
│   ├── services/               # API call functions (thin wrappers around axios)
│   │   ├── authService.js
│   │   ├── collectionService.js
│   │   ├── requestService.js
│   │   ├── historyService.js
│   │   └── environmentService.js
│   │
│   ├── components/             # Reusable UI primitives
│   │   ├── ui/                 # Design-system atoms
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Tabs.jsx
│   │   │   ├── Dropdown.jsx
│   │   │   ├── Spinner.jsx
│   │   │   └── Toast.jsx
│   │   │
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx           # Main 3-pane layout (sidebar + request + response)
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   └── ResizablePanels.jsx
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── SignupForm.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   │
│   │   ├── request-builder/            # ★ Core feature
│   │   │   ├── RequestBuilder.jsx      # Container: method + URL + send
│   │   │   ├── MethodSelector.jsx
│   │   │   ├── UrlBar.jsx
│   │   │   ├── ParamsEditor.jsx        # Key-value table for query params
│   │   │   ├── HeadersEditor.jsx       # Key-value table for headers
│   │   │   ├── BodyEditor.jsx          # Toggle JSON / form-data / raw
│   │   │   ├── JsonEditor.jsx          # Monaco editor wrapper
│   │   │   └── KeyValueTable.jsx       # Shared component for params/headers
│   │   │
│   │   ├── response-viewer/
│   │   │   ├── ResponseViewer.jsx      # Container: status + time + tabs
│   │   │   ├── ResponseBody.jsx        # Pretty-printed JSON / raw
│   │   │   ├── ResponseHeaders.jsx
│   │   │   └── StatusBadge.jsx
│   │   │
│   │   ├── collections/
│   │   │   ├── CollectionTree.jsx      # Recursive tree with drag & drop
│   │   │   ├── CollectionNode.jsx      # Single node (folder or request)
│   │   │   ├── CreateCollectionModal.jsx
│   │   │   └── CollectionContextMenu.jsx
│   │   │
│   │   ├── history/
│   │   │   ├── HistoryList.jsx
│   │   │   ├── HistoryItem.jsx
│   │   │   └── HistorySearch.jsx
│   │   │
│   │   └── environments/
│   │       ├── EnvironmentSelector.jsx
│   │       ├── EnvironmentEditor.jsx
│   │       └── VariableRow.jsx
│   │
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── SignupPage.jsx
│   │   ├── DashboardPage.jsx          # Main workspace (post-login)
│   │   └── NotFoundPage.jsx
│   │
│   └── utils/
│       ├── variableSubstitution.js    # Client-side {{var}} resolver
│       ├── formatters.js              # JSON prettify, time formatting
│       └── validators.js              # Client-side form validation
│
├── index.html
├── vite.config.js
└── package.json
```

---

## 4. Database Schema (Prisma)

This is the "interview-worthy" part. Pay close attention to the **self-referencing FK** on `Collection`.

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── AUTH ────────────────────────────────────────────

model User {
  id            String         @id @default(uuid())
  email         String         @unique
  name          String
  passwordHash  String
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  collections   Collection[]
  histories     History[]
  environments  Environment[]

  @@map("users")
}

// ─── COLLECTIONS (self-referencing tree) ────────────

model Collection {
  id            String         @id @default(uuid())
  name          String
  description   String?

  // ★ Self-referencing FK — enables infinite nesting
  parentId      String?
  parent        Collection?    @relation("CollectionTree", fields: [parentId], references: [id], onDelete: Cascade)
  children      Collection[]   @relation("CollectionTree")

  // Sibling ordering within the same parent
  sortOrder     Int            @default(0)

  userId        String
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  requests      SavedRequest[]

  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@index([userId, parentId])
  @@index([parentId, sortOrder])
  @@map("collections")
}

// ─── SAVED REQUESTS ─────────────────────────────────

model SavedRequest {
  id            String         @id @default(uuid())
  name          String
  method        String         // GET, POST, PUT, PATCH, DELETE, etc.
  url           String
  headers       Json?          // [{ key, value, enabled }]
  params        Json?          // [{ key, value, enabled }]
  bodyType      String?        // "json" | "form-data" | "raw" | "none"
  body          Json?          // Actual body content
  sortOrder     Int            @default(0)

  collectionId  String
  collection    Collection     @relation(fields: [collectionId], references: [id], onDelete: Cascade)

  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@index([collectionId, sortOrder])
  @@map("saved_requests")
}

// ─── HISTORY ────────────────────────────────────────

model History {
  id            String         @id @default(uuid())

  // Request snapshot
  method        String
  url           String
  headers       Json?
  params        Json?
  bodyType      String?
  body          Json?

  // Response snapshot
  statusCode    Int?
  responseTime  Int?           // milliseconds
  responseHeaders Json?
  responseBody  Json?
  responseSize  Int?           // bytes

  userId        String
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt     DateTime       @default(now())

  @@index([userId, createdAt(sort: Desc)])
  @@index([userId, method])
  @@map("histories")
}

// ─── ENVIRONMENTS ───────────────────────────────────

model Environment {
  id            String         @id @default(uuid())
  name          String         // "Production", "Staging", "Local"
  isActive      Boolean        @default(false)

  variables     EnvironmentVariable[]

  userId        String
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@unique([userId, name])
  @@map("environments")
}

model EnvironmentVariable {
  id              String       @id @default(uuid())
  key             String       // "baseUrl"
  value           String       // "https://api.example.com"
  enabled         Boolean      @default(true)

  environmentId   String
  environment     Environment  @relation(fields: [environmentId], references: [id], onDelete: Cascade)

  @@unique([environmentId, key])
  @@map("environment_variables")
}
```

### Key Schema Decisions

| Decision | Rationale |
|---|---|
| **Self-referencing `Collection.parentId`** | Allows `Collection → Sub-Collection → Sub-Sub-Collection → ...` with a single table. `parentId = null` means root-level. |
| **`sortOrder` on Collections & Requests** | Enables drag-and-drop reordering without rewriting IDs. Siblings share a parent; order by `sortOrder ASC`. |
| **`onDelete: Cascade` everywhere** | Delete a user → everything goes. Delete a collection → children + requests go. Clean and predictable. |
| **JSON columns for headers/params/body** | These are arbitrary-length key-value lists. Normalizing them into rows would be overkill and slow for reads. |
| **Separate `EnvironmentVariable` table** | Unlike headers, you query variables by key for substitution. A normalized table lets you `@@unique([environmentId, key])`. |
| **History stores full snapshots** | History entries are immutable. If a user edits a saved request, the history still shows what was *actually sent*. |

---

## 5. API Versioning Strategy

### URL-Based Versioning (Recommended for this project)

```
/api/v1/auth/signup
/api/v1/auth/login
/api/v1/collections
/api/v1/collections/:id/requests
/api/v1/requests/:id/send
/api/v1/history
/api/v1/environments
```

**Implementation in `server/src/routes/index.js`:**

```javascript
const express = require('express');
const router = express.Router();

// Version 1 routes
const authRoutes        = require('../modules/auth/auth.routes');
const collectionRoutes  = require('../modules/collection/collection.routes');
const requestRoutes     = require('../modules/request/request.routes');
const historyRoutes     = require('../modules/history/history.routes');
const environmentRoutes = require('../modules/environment/environment.routes');

router.use('/v1/auth',         authRoutes);
router.use('/v1/collections',  collectionRoutes);
router.use('/v1/requests',     requestRoutes);
router.use('/v1/history',      historyRoutes);
router.use('/v1/environments', environmentRoutes);

// When v2 comes:
// router.use('/v2/auth', authRoutesV2);

module.exports = router;
```

**In `app.js`:**

```javascript
const routes = require('./routes');
app.use('/api', routes);
// All routes are now under /api/v1/...
```

---

## 6. Phased Build Plan (Versioned Releases)

### v0.1 — Auth Foundation 🔐

> **Non-negotiable. Everything else depends on this.**

| Task | Details |
|---|---|
| User model + migration | email, passwordHash, name |
| `POST /api/v1/auth/signup` | Validate → hash password (bcryptjs) → create user → return JWT |
| `POST /api/v1/auth/login` | Validate → compare hash → return JWT |
| `authenticate` middleware | Verify JWT → attach `req.user` → reject 401 |
| Client: Login/Signup pages | Forms → call API → store token in Zustand + localStorage |
| Client: `ProtectedRoute` | Redirect to `/login` if no token |
| Client: Axios interceptor | Auto-attach `Authorization: Bearer <token>` to every request |

```
Milestone: User can sign up, log in, and access the dashboard.
```

---

### v0.2 — Request Builder + Proxy 🚀

> **The core value prop.**

| Task | Details |
|---|---|
| `POST /api/v1/requests/send` | Accept `{ method, url, headers, params, bodyType, body }` → proxy via axios → return `{ status, time, headers, body }` |
| Client: `RequestBuilder` | Method selector + URL bar + Send button |
| Client: `ParamsEditor` | Key-value table, auto-sync with URL query string |
| Client: `HeadersEditor` | Key-value table with enable/disable toggles |
| Client: `BodyEditor` | Tab between JSON (Monaco) / Form-data / Raw |
| Client: `ResponseViewer` | Status badge + response time + body (pretty JSON) + headers tab |
| Client: `AppLayout` | 3-pane layout with `react-resizable-panels` |

```
Milestone: User can build and send any REST request, see response in real time.
```

> [!IMPORTANT]
> **Why proxy through the server?** Browser CORS blocks direct cross-origin requests. Your server acts as a proxy — it has no CORS restrictions. This is exactly how Postman's web client works.

---

### v0.3 — Collections & Saved Requests 📁

> **The interview-worthy DB problem.**

| Task | Details |
|---|---|
| Collection model + migration | Self-referencing FK, `sortOrder` |
| SavedRequest model + migration | FK to Collection, `sortOrder` |
| `CRUD /api/v1/collections` | Create, read (tree), update, delete (cascade) |
| `GET /api/v1/collections/tree` | Return full nested tree for the user (recursive query or app-level tree builder) |
| `CRUD /api/v1/collections/:id/requests` | Save a request into a collection |
| `PATCH /api/v1/collections/:id/reorder` | Update `sortOrder` for siblings |
| Client: `CollectionTree` | Recursive component rendering folders + requests |
| Client: Click a saved request → load into builder | Populate `requestStore` from saved data |
| Client: "Save" button on request builder | Modal → pick/create collection → save |

```
Milestone: User can organize requests in nested folders and re-run saved requests.
```

---

### v0.4 — History 📜

| Task | Details |
|---|---|
| History model + migration | Immutable request + response snapshots |
| Auto-log on send | After proxying a request, write to `History` |
| `GET /api/v1/history` | Paginated, filterable by method, searchable by URL |
| Client: `HistoryList` | Scrollable list, grouped by date |
| Client: `HistorySearch` | Filter by method dropdown + URL search |
| Client: Click history entry → load into builder | Re-run old requests easily |

```
Milestone: Every sent request is logged and browsable.
```

---

### v0.5 — Environments & Variable Substitution 🌍

| Task | Details |
|---|---|
| Environment + Variable models | Named sets, `@@unique([environmentId, key])` |
| `CRUD /api/v1/environments` | Create/edit/delete environments + variables |
| `PATCH /api/v1/environments/:id/activate` | Set `isActive = true`, deactivate others |
| Variable substitution engine | Replace `{{key}}` in URL, headers, and body before sending |
| Client: `EnvironmentSelector` | Dropdown in header to switch active environment |
| Client: `EnvironmentEditor` | Modal/panel to manage variables |
| Client: Syntax highlighting for `{{variables}}` | Highlight resolved vs. unresolved in URL bar |

```
Milestone: User can define {{baseUrl}}, switch environments, and all requests auto-resolve variables.
```

---

## 7. Key API Endpoints Summary

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/signup` | ❌ | Register new user |
| `POST` | `/api/v1/auth/login` | ❌ | Login, receive JWT |
| `GET` | `/api/v1/auth/me` | ✅ | Get current user profile |

### Collections
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/collections/tree` | ✅ | Full nested tree for user |
| `POST` | `/api/v1/collections` | ✅ | Create collection/folder |
| `PATCH` | `/api/v1/collections/:id` | ✅ | Rename, move (change `parentId`) |
| `DELETE` | `/api/v1/collections/:id` | ✅ | Delete collection + children (cascade) |
| `PATCH` | `/api/v1/collections/:id/reorder` | ✅ | Reorder siblings |

### Saved Requests
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/collections/:id/requests` | ✅ | List requests in collection |
| `POST` | `/api/v1/collections/:id/requests` | ✅ | Save new request |
| `PATCH` | `/api/v1/requests/:id` | ✅ | Update saved request |
| `DELETE` | `/api/v1/requests/:id` | ✅ | Delete saved request |

### Request Execution
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/requests/send` | ✅ | Proxy a request, auto-log to history |

### History
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/history` | ✅ | Paginated list, `?method=GET&search=api&page=1` |
| `GET` | `/api/v1/history/:id` | ✅ | Single history entry detail |
| `DELETE` | `/api/v1/history` | ✅ | Clear all history |

### Environments
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/environments` | ✅ | List all environments |
| `POST` | `/api/v1/environments` | ✅ | Create environment + variables |
| `PATCH` | `/api/v1/environments/:id` | ✅ | Update name, variables |
| `DELETE` | `/api/v1/environments/:id` | ✅ | Delete environment |
| `PATCH` | `/api/v1/environments/:id/activate` | ✅ | Set as active environment |

---

## 8. Code Patterns & Conventions

### Controller → Service → Prisma (3-Layer Architecture)

```
Route → Controller → Service → Prisma
         (HTTP)      (Logic)   (DB)
```

**Rule**: Controllers never touch Prisma directly. Services never touch `req` or `res`.

```javascript
// collection.controller.js
const collectionService = require('./collection.service');
const { asyncHandler } = require('../../utils/asyncHandler');
const { ApiResponse }  = require('../../utils/ApiResponse');

exports.getTree = asyncHandler(async (req, res) => {
  const tree = await collectionService.getTreeByUser(req.user.id);
  res.json(new ApiResponse(200, tree, 'Collection tree fetched'));
});
```

```javascript
// collection.service.js
const prisma = require('../../config/db');

exports.getTreeByUser = async (userId) => {
  const flat = await prisma.collection.findMany({
    where: { userId },
    include: { requests: true },
    orderBy: { sortOrder: 'asc' },
  });
  return buildTree(flat);  // Convert flat list → nested tree in JS
};
```

### Consistent API Responses

```javascript
// Success
{ "success": true, "statusCode": 200, "data": { ... }, "message": "..." }

// Error
{ "success": false, "statusCode": 400, "message": "Validation failed", "errors": [...] }
```

### Environment Variable Substitution

```javascript
// utils/variableParser.js
function substituteVariables(text, variables) {
  if (!text || !variables) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const variable = variables.find(v => v.key === key && v.enabled);
    return variable ? variable.value : match; // Leave unresolved as-is
  });
}
```

---

## 9. Non-Negotiable Quality Gates

| Gate | Tool | When |
|---|---|---|
| Input validation on every endpoint | Zod + `validate` middleware | Before controller runs |
| JWT on every protected route | `authenticate` middleware | Before controller runs |
| Ownership checks | Service layer | Every read/write checks `userId` match |
| Error handling | `asyncHandler` + `errorHandler` | Wraps every route, catches all throws |
| Rate limiting | `express-rate-limit` | On auth routes (prevent brute force) |
| Password hashing | bcryptjs (12 rounds) | On signup, never store plain text |
| SQL injection protection | Prisma parameterized queries | Built-in, never raw SQL |

---

## 10. File Naming Conventions

| Pattern | Example | Meaning |
|---|---|---|
| `module.layer.js` | `auth.controller.js` | Server module file |
| `PascalCase.jsx` | `RequestBuilder.jsx` | React component |
| `camelCase.js` | `authStore.js` | Zustand store / hook / util |
| `UPPER_CASE` | `JWT_SECRET` | Environment variables |
| `kebab-case` | `prisma migrate dev` | CLI commands |

---

> [!CAUTION]
> **Don't skip v0.1 (Auth)**. Every subsequent feature needs `req.user.id` to scope data. Without auth, you'll either hard-code a user ID (tech debt) or build everything without multi-user support and rewrite later.

