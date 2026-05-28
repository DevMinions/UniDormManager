# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UniDormManager is a dormitory management system (宿舍管理系统) with four sub-projects: a Go backend, a React web frontend, a native WeChat Mini Program, and a UniApp cross-platform client.

## Repository Structure

- **UniDormManagerServer/** — Go 1.23+ backend (Gin framework, PostgreSQL via pgx, optional Redis cache)
- **UniDormManagerWeb/** — React 19 + TypeScript + Vite web admin panel
- **UniDormManagerMini/** — Native WeChat Mini Program (vanilla JS)
- **UniDormManager-UniApp/** — Vue 3 + UniApp cross-platform client (H5, WeChat mini-app, mobile)
- **scripts/** — SQL migration and seed data scripts
- **tests/** — Bash-based API tests and Playwright E2E tests

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
```

### UniApp
```bash
cd UniDormManager-UniApp
npm install
npm run dev        # H5 dev
npm run build:h5   # H5 production build
npm run build:mp-weixin  # WeChat mini-app build
```

### Docker (full stack)
```bash
make up            # start all services
make down          # stop all services
make rebuild       # rebuild and restart
make logs          # tail all logs
make logs-backend  # tail backend logs only
```

### Seed test data
```bash
docker compose exec -T postgres psql -U postgres -d unidorm < scripts/seed_test_data.sql
```

## Architecture

### Backend (Gin + PostgreSQL)

The backend follows a **handler → store → database** layered pattern:

- **handlers/** — HTTP request handlers, one file per domain (e.g., `student_handler.go`, `repair_handler.go`)
- **store/** — Data access abstraction with optional Redis caching. `interface.go` defines the store interface; `store_db.go` implements it. Cache is enabled via `USE_CACHE=true` env var.
- **database/** — Low-level PostgreSQL connection management and query optimization
- **models/** — Shared data structs used across layers (User, Student, Room, Building, RepairRequest, etc.)
- **middleware/** — Auth (JWT via `golang-jwt`), CORS, RBAC permission checks
- **migrations/** — SQL schema files auto-loaded by Docker on init

**Auth flow**: JWT-based. Login via `/api/auth/login` or WeChat mini-app via `/api/auth/wechat/login`. Tokens checked by auth middleware; permissions enforced by RBAC middleware per route.

**API routes** are all registered in `main.go` under `/api/` prefix. Most CRUD endpoints follow the pattern: `GET /api/{resource}`, `POST /api/{resource}`, `PUT /api/{resource}/:id`, `DELETE /api/{resource}/:id`. Paginated endpoints accept query params for page/size.

**Monitoring**: Prometheus metrics exposed at `/metrics`.

### Web Frontend (React 19 + Vite)

- Uses HashRouter with nested routes defined in `App.tsx`
- **pages/** — One component per admin page
- **services/api.ts** — Centralized API client using fetch with JWT auth headers
- **contexts/AuthContext** — Authentication state management
- UI: Tailwind CSS + Lucide React icons + Recharts for dashboard charts

### WeChat Mini Program (UniDormManagerMini/)

- Native WeChat mini-app structure (`app.js`, `app.json`, pages/, components/, utils/)
- Role-based dynamic tab bar configured in `app.js`
- API calls go through `utils/` request helpers

### UniApp (UniDormManager-UniApp/)

- Vue 3 + Pinia for state management
- Page routing configured in `pages.json`
- Cross-platform: builds to H5 and WeChat mini-app

## CI/CD

Gitea Actions workflow at `.gitea/workflows/build.yml`:
- Triggers on push to main/master/dev
- Detects changes in `UniDormManager-UniApp/`
- Builds WeChat mini-app and pushes artifacts to `build/mp-weixin` branch
- Replaces API baseURL with production URL during build

## Key Environment Variables (Backend)

| Variable | Purpose |
|----------|---------|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | PostgreSQL connection |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` | Redis connection |
| `USE_CACHE` | Enable Redis caching (`true`/`false`) |
| `JWT_SECRET` | JWT signing key |
| `APP_ENV` | Environment (`development`/`production`) |
| `APP_PORT` | Server port (default 8080) |

## Git Workflow

```
feature/* → dev → master
```

Commit messages use conventional commits in Chinese or English: `feat:`, `fix:`, `refactor:`, `docs:`, `style:`, `test:`, `chore:`.

## Notes

- The docker-compose.yml references MySQL but the backend actually uses **PostgreSQL** (pgx driver). The compose file is partially outdated.
- The README says Vue 3 frontend but UniDormManagerWeb is actually **React 19**. The Vue 3 frontend is UniDormManager-UniApp.
- Go code should follow the conventions in `.cursor/rules/golang.mdc`: use standard library patterns, proper error handling, and input validation.
