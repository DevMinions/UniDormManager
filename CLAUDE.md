# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UniDormManager is a dormitory management system (宿舍管理系统) with two sub-projects: a Go backend and a React web admin frontend.

## Repository Structure

- **UniDormManagerServer/** — Go 1.23+ backend (Gin framework, PostgreSQL via pgx, optional Redis cache)
- **UniDormManagerWeb/** — React 19 + TypeScript + Vite web admin panel
- **scripts/** — SQL migration and seed data scripts (one-off / fixes)
- **tests/** — API + E2E test harnesses (audit_api.py, audit_web.js)
- **docs/** — Long-form documentation and audit reports

## Build & Run Commands

### Backend
```bash
cd UniDormManagerServer
go mod download
go run main.go
```

### Backend tests
```bash
cd UniDormManagerServer && go test ./...          # all tests
cd UniDormManagerServer && go test -v ./store/... # single package
```

### Web Frontend
```bash
cd UniDormManagerWeb
npm install
npm run dev        # dev server on port 3000
npm run build      # production build
npm run test:run   # vitest
```

### Docker (full stack)
```bash
make up            # start postgres + redis + backend + frontend
make down          # stop all services
make rebuild       # rebuild and restart
make logs          # tail all logs
make logs-backend  # tail backend logs only
```

### Seed test data
```bash
docker compose exec -T postgres psql -U postgres -d unidorm < scripts/seed_test_data.sql
```

### Audit / regression harnesses
```bash
# Backend integration: hits 36 endpoints, validates auth/RBAC/pagination/CRUD
BASE=http://localhost:8082 python3 tests/audit_api.py

# Web E2E: Playwright + system google-chrome, login + key pages smoke
node tests/audit_web.js
```

## Architecture

### Backend (Gin + PostgreSQL)

The backend follows a **handler → store → database** layered pattern:

- **handlers/** — HTTP request handlers, one file per domain (e.g., `students.go`, `repairs.go`)
- **store/** — Data access abstraction with optional Redis caching. `interface.go` defines the store interface; `store_db.go` implements it. Cache is enabled via `USE_CACHE=true`.
- **database/** — Low-level PostgreSQL connection management; `createTables` auto-runs on startup (idempotent CREATE TABLE IF NOT EXISTS + ALTER ADD COLUMN IF NOT EXISTS for in-place upgrades)
- **models/** — Shared data structs (User, Student, Room, Building, RepairRequest, Inspection, etc.)
- **middleware/** — Auth (JWT via `golang-jwt`), CORS, RBAC permission checks
- **migrations/** — SQL files; not currently auto-applied (the Go `createTables` is the source of truth)
- **utils/query_builder.go** — Composes paginated queries with filter/sort. `Where(cond, args...)` already appends args; do NOT also call `qb.args = append(...)` manually (this was bug B6/B6b).

**Auth flow**: JWT-based. Login via `/api/auth/login`. Tokens checked by auth middleware; permissions enforced by RBAC middleware per route.

**RBAC**: Roles and permissions seeded in `database/init_auth_data.go`. `role-system-admin` automatically gets every row in `permissions` table via a wildcard `INSERT ... SELECT FROM permissions`. When adding a route with `middleware.RequirePermission("foo:bar")`, you MUST also add a `('perm-foo-bar', 'foo:bar', ...)` row to `init_auth_data.go`.

**Default admin**: On first start, `initDefaultAdmin` generates a random 16-char password (or uses `ADMIN_INITIAL_PASSWORD` env if set) and prints it to the startup log ONCE. Subsequent restarts don't reset existing admin passwords.

**API routes** are all registered in `main.go` under `/api/` prefix. Most CRUD endpoints follow: `GET /api/{resource}`, `POST /api/{resource}`, `PUT /api/{resource}/:id`, `DELETE /api/{resource}/:id`. Paginated endpoints accept `page` and `pageSize` (not `size`).

**Monitoring**: Prometheus metrics at `/metrics`; health at `/health`.

### Web Frontend (React 19 + Vite)

- HashRouter with nested routes in `App.tsx`
- **pages/** — One component per admin page (Students, RoomManagement, AccessLogs, Inspections, etc.)
- **hooks/usePaginatedData.ts** — Generic paginated fetch hook with `error` state; each page reads `state.error` and renders an error banner
- **services/api.ts** — Centralized API client (fetch + JWT). Base URL: `import.meta.env.VITE_API_URL || '/api'`
- **contexts/AuthContext** — Authentication state
- UI: Tailwind CSS + Lucide React icons + Recharts for dashboard charts

## CI/CD

GitHub Actions workflow at `.github/workflows/ci-cd.yml`:
- Triggers on push to main/master/develop/dev
- Backend job: `go test ./...` + build + Docker image
- Frontend job: `npm install` + `npm run test:run` + `npm run build` + Docker image
- Security: Trivy filesystem scan
- Publish: pushes images to ghcr.io on non-PR events

## Key Environment Variables (Backend)

| Variable | Purpose |
|----------|---------|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSLMODE` | PostgreSQL connection |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` | Redis connection |
| `USE_CACHE` | Enable Redis caching (`true`/`false`) |
| `JWT_SECRET` | JWT signing key (must be >= 32 chars in production) |
| `ADMIN_INITIAL_PASSWORD` | Optional. Fix the first-startup admin password instead of using a random one. |
| `APP_ENV` | Environment (`development`/`production`) |
| `APP_PORT` / `PORT` | Server port (default 8080) |

## Git Workflow

```
feature/* → dev → master
```

Commit messages use conventional commits in Chinese or English: `feat:`, `fix:`, `refactor:`, `docs:`, `style:`, `test:`, `chore:`.

## Notes

- The repository was open-sourced from a private monorepo that also contained a WeChat Mini Program and a UniApp client; both were removed before publication because they were incomplete. Git history retains them if you need to reference past work.
- The audit report at `docs/AUDIT_REPORT_2026-05-28.md` and the harnesses at `tests/audit_api.py` / `tests/audit_web.js` are the source of truth for "what works"; keep them green when changing handlers or schemas.
- Go code should follow the conventions in `.cursor/rules/golang.mdc` (if present): use standard library patterns, proper error handling, and input validation.
