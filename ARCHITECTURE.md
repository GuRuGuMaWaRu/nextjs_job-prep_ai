# Architecture Overview

This document gives a quick overhead view of the app structure and request flow.

## System Diagram

```mermaid
flowchart TD
    U[Browser / Client] --> M[proxy.ts middleware]
    M -->|Public route| R[App Router in app/]
    M -->|Private route + session cookie| R
    M -->|No valid session| SI[/sign-in]

    R --> L[Route layout and page components]
    L --> SA[Server Actions in core/features/*/actions.ts]
    L --> API[API Routes in app/api/ai/*]

    SA --> SV[Service layer core/features/*/service.ts]
    API --> SV
    SV --> DAL[DAL/DB layer core/features/*/dal.ts and db.ts]
    DAL --> DR[Drizzle ORM core/drizzle/db.ts]
    DR --> PG[(PostgreSQL)]

    SV --> AUTH[Auth/session helpers core/features/auth/*]
    ENV[Env validation core/data/env/server.ts] --> DR
    ENV --> AUTH
```

Some Markdown previews do not render Mermaid blocks. If that happens, use the plain-text fallback below.

```text
Browser / Client
  -> proxy.ts middleware
     -> (public route) App Router in app/
     -> (private + session cookie) App Router in app/
     -> (no valid session) /sign-in

App Router in app/
  -> Route layout + page components
  -> Server Actions in core/features/*/actions.ts
  -> API Routes in app/api/ai/*

Server Actions / API Routes
  -> Service layer in core/features/*/service.ts
  -> DAL/DB layer in core/features/*/dal.ts + db.ts
  -> Drizzle ORM in core/drizzle/db.ts
  -> PostgreSQL

Cross-cutting:
  - Auth/session helpers in core/features/auth/*
  - Env validation in core/data/env/server.ts
```

## Directory Overhead

- `app/` - Next.js App Router pages, layouts, and route handlers.
- `app/api/ai/` - AI-specific HTTP route handlers.
- `core/features/` - Feature modules with action/service/dal/db layering.
- `core/components/` - Shared reusable UI components.
- `core/drizzle/` - Database schema, migrations, and ORM client.
- `core/data/env/` - Runtime environment validation for server/client values.
- `proxy.ts` - Cross-cutting request gate for auth and protection.

## Layer Responsibilities

- **UI layer (`app/`, `core/components/`)**: renders pages/forms and triggers server work.
- **Entry layer (`actions.ts`, API routes)**: validates input and maps request shape.
- **Business layer (`service.ts`)**: enforces rules, ownership, plan checks, and orchestration.
- **Data layer (`dal.ts`, `db.ts`, `core/drizzle/`)**: performs queries and persistence.
- **Cross-cutting (`auth`, `env`, `proxy.ts`)**: session, cookies, security, and config safety.

## Typical Request Flow

1. User opens a page or submits a form.
2. `proxy.ts` decides whether to continue or redirect.
3. Page/layout loads and calls a server action or API endpoint.
4. Feature service executes business logic.
5. DAL/DB code writes/reads through Drizzle.
6. Data returns to page/API response and updates the UI.
