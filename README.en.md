<h1 align="center">UniDormManager</h1>

<p align="center">
  A batteries-included dormitory management system — Go backend + React 19 frontend on PostgreSQL, with RBAC, audit logs, an SSE live feed, and first-class Prometheus metrics.
</p>

<p align="center">
  <a href="https://github.com/DevMinions/UniDormManager/actions/workflows/ci-cd.yml"><img alt="CI" src="https://github.com/DevMinions/UniDormManager/actions/workflows/ci-cd.yml/badge.svg"></a>
  <a href="https://github.com/DevMinions/UniDormManager/releases/latest"><img alt="Release" src="https://img.shields.io/github/v/release/DevMinions/UniDormManager?sort=semver"></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-blue.svg"></a>
  <a href="https://golang.org/"><img alt="Go" src="https://img.shields.io/badge/go-1.23%2B-00ADD8?logo=go&logoColor=white"></a>
  <a href="https://react.dev/"><img alt="React" src="https://img.shields.io/badge/react-19-61DAFB?logo=react&logoColor=white"></a>
  <a href="https://render.com/deploy?repo=https://github.com/DevMinions/UniDormManager"><img alt="Deploy to Render" src="https://render.com/images/deploy-to-render-button.svg" height="20"></a>
</p>

<p align="center">
  <a href="README.md">简体中文</a> · <a href="README.en.md">English</a> · <a href="docs/ARCHITECTURE.md">Architecture</a> · <a href="docs/API.md">API</a>
</p>

<p align="center">
  <img src="docs/screenshots/02-dashboard.png" alt="Dashboard" width="860">
</p>

<details>
<summary>More screenshots (students / buildings / rooms / repairs / notices / inspections / access logs / login)</summary>

| ![Students](docs/screenshots/03-students.png) | ![Buildings](docs/screenshots/04-buildings.png) |
|---|---|
| Students | Buildings |
| ![Rooms](docs/screenshots/05-rooms.png) | ![Repairs](docs/screenshots/06-repairs.png) |
| Rooms | Repair tickets |
| ![Notices](docs/screenshots/07-notices.png) | ![Inspections](docs/screenshots/08-inspections.png) |
| Notices | Inspections |
| ![Access Logs](docs/screenshots/09-access-logs.png) | ![Login](docs/screenshots/01-login.png) |
| Access logs & late-return alerts | Login |

Screenshots are auto-captured by `scripts/capture_screenshots.js`; re-run on each release to keep them in sync.

</details>

## Features

- **Complete coverage** — students / buildings / rooms / repairs / notices / inspections / access logs / late-return alerts / room swaps, eight first-line domains all UI-enabled
- **RBAC + JWT** — roles and permissions stored in the database; system-admin matches all; new routes auto-included
- **Audit log + SSE live stream** — every write recorded to `audit_logs`; the dashboard subscribes to `/api/audit-logs/stream` to show the last 10 events in real time
- **Observability built in** — `/metrics` exposes Prometheus counters; a Grafana dashboard with 11 panels (business / HTTP / audit / scheduler) ships in the repo
- **One-click deployment** — full local stack via Docker Compose, or push-button cloud deploy via Render Blueprint (PostgreSQL + backend + frontend)
- **105-item E2E baseline** — `make audit` runs every harness (audit_api + four UI CRUD suites + workflow), one command for full regression in CI or locally

## Tech Stack

| Layer | Choice |
|---|---|
| Backend | Go 1.23 · Gin · pgx · golang-jwt · robfig/cron · prometheus client |
| Frontend | React 19 · TypeScript · Vite · Tailwind · Recharts · HashRouter |
| Data | PostgreSQL 16 · Redis 7 (optional cache) |
| Monitoring | Prometheus · Grafana (provisioning included) |
| Testing | Vitest · `go test` · Playwright (`audit_web*`) |
| Deployment | Docker Compose · Render Blueprint · GitHub Actions |

## Quick Start

Requires Docker 20.10+ and Docker Compose 2.0+.

```bash
git clone https://github.com/DevMinions/UniDormManager.git
cd UniDormManager
make up
```

Once running:
- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- Grafana: http://localhost:3001

On first boot the backend log prints **once** `INITIAL PASSWORD: <16 chars>` (or pre-set via `ADMIN_INITIAL_PASSWORD`). Sign in with `admin` and that password, then change it immediately.

Optional — load seed data:

```bash
docker compose exec -T postgres psql -U postgres -d unidorm < scripts/seed_test_data.sql
```

### One-click cloud deploy

Click **Deploy to Render** at the top. Render reads `render.yaml` and provisions PostgreSQL + backend + frontend. After deploy:

1. Find the real hostname of `unidorm-backend` in the Render dashboard
2. Edit `unidorm-web`'s `VITE_API_URL` to `https://<backend host>.onrender.com/api`
3. Trigger a rebuild of `unidorm-web`
4. Grab `INITIAL PASSWORD` from the `unidorm-backend` startup log to sign in

Render Free tier sleeps after 15min idle (~30s cold start); the PostgreSQL trial lasts 90 days. Use a paid plan or self-host with `make up` for production.

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — C4 container view, backend layering, key flow Mermaid diagrams
- [API reference](docs/API.md) — every endpoint with request/response examples
- [Deployment](docs/DEPLOYMENT.md) · [Docker guide](docs/DOCKER.md) · [Database init](docs/DATABASE_INIT.md)
- [Development guidelines](docs/DEVELOPMENT_GUIDE.md) — Backend / frontend conventions + E2E pitfalls
- [Changelog](docs/CHANGELOG.md) · [Security policy](SECURITY.md) · [Contributing](CONTRIBUTING.md)

## Development

Run dev servers directly (without Docker):

```bash
# Backend (needs a local PostgreSQL)
cd UniDormManagerServer
go mod download
go run main.go

# Frontend
cd UniDormManagerWeb
npm install
npm run dev
```

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full env var matrix.

## Testing

```bash
make test       # backend go test + frontend vitest
make audit      # full E2E baseline, 105 items (audit_api + 4 UI CRUD + workflow)
```

`make audit` expects vite preview on :3000, backend on :8082, admin/admin123 reachable; any failing harness aborts the chain. See [Makefile](Makefile).

## Project Structure

```
UniDormManager/
├── UniDormManagerServer/    Go backend (handlers / store / middleware / scheduler / audit / monitoring)
├── UniDormManagerWeb/       React 19 frontend (pages / hooks / services / contexts)
├── tests/                   E2E harnesses (audit_api.py / audit_web*.js)
├── scripts/                 SQL migrations and one-off fixes
├── docs/                    Long-form docs (ARCHITECTURE / API / DEPLOYMENT, etc.)
├── grafana/                 Grafana provisioning (datasources + dashboards)
├── render.yaml              Render Blueprint (one-click cloud deploy)
├── docker-compose.yml       Full local stack
└── Makefile                 Common commands
```

## Contributing

Issues and PRs welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) first for the branching model, commit message convention, and local test expectations. Security issues go through [GitHub Private Vulnerability Reporting](SECURITY.md); please don't open public issues for them.

## License

[MIT](LICENSE) © DevMinions
