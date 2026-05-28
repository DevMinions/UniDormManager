# UniDormManager

> A modern university dormitory management system — Go + React 19.

[![Go](https://img.shields.io/badge/Go-1.23+-00ADD8?logo=go)](https://golang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/DevMinions/UniDormManager)

📖 **Languages**: **English** · [简体中文](README.md)

---

## ✨ Overview

UniDormManager is a full-stack dormitory management system covering student records, room allocation, repair requests, announcements, inspection scoring, access logs and more.

### Features

- 🎓 **Students** — record management & room allocation
- 🏢 **Buildings** — buildings, floors, room inventory
- 🔧 **Repairs** — request lifecycle and status tracking
- 📢 **Notices** — publishing and notifications
- 📊 **Inspections** — scoring records, rankings, statistics
- 🚪 **Access Logs** — entry/exit records & late-return alerts
- 🔄 **Room Swap** — apply / approve workflow
- 👥 **RBAC** — fine-grained role and permission management
- 📝 **Audit Log** — every write recorded, including a live SSE stream
- ⏰ **Scheduler** — built-in cron for token cleanup & late-return scans

---

## 🚀 One-click Demo

Click the **Deploy to Render** badge above (or visit [render.com/deploy?repo=...](https://render.com/deploy?repo=https://github.com/DevMinions/UniDormManager)). Render reads `render.yaml` at the repo root and provisions PostgreSQL + Go backend + React frontend automatically.

> Render Free plan: services sleep after 15min idle, ~30s cold start; PostgreSQL Free trial is 90 days. For production, use a paid plan or self-host with `make up`.

After deploy:
1. In Render dashboard, find the real `onrender.com` hostname of `unidorm-backend`.
2. Edit `unidorm-web`'s `VITE_API_URL` env var → `https://<your-backend>.onrender.com/api`.
3. Trigger a redeploy of `unidorm-web`.
4. Find `INITIAL PASSWORD` in the backend startup logs to log in as `admin`.

---

## 📸 Screenshots

| Dashboard | Students |
|---|---|
| ![Dashboard](docs/screenshots/02-dashboard.png) | ![Students](docs/screenshots/03-students.png) |

| Buildings | Rooms |
|---|---|
| ![Buildings](docs/screenshots/04-buildings.png) | ![Rooms](docs/screenshots/05-rooms.png) |

| Repairs | Notices |
|---|---|
| ![Repairs](docs/screenshots/06-repairs.png) | ![Notices](docs/screenshots/07-notices.png) |

| Inspections | Access Logs |
|---|---|
| ![Inspections](docs/screenshots/08-inspections.png) | ![Access Logs](docs/screenshots/09-access-logs.png) |

<details>
<summary>Login page</summary>

![Login](docs/screenshots/01-login.png)

</details>

> Screenshots are auto-captured by `scripts/capture_screenshots.js`; re-run after a UI release to refresh.

---

## 🏗️ Tech Stack

### Backend
- **Language**: Go 1.23+
- **Framework**: Gin
- **Database**: PostgreSQL 16 (via pgx)
- **Cache**: Redis 7 (optional, `USE_CACHE=true`)
- **Scheduler**: robfig/cron/v3 (token cleanup, late-return scan)
- **Monitoring**: Prometheus `/metrics` + optional Grafana dashboards

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **UI**: Tailwind CSS + Lucide React icons
- **Charts**: Recharts (bar, pie, line)
- **HTTP**: Fetch API
- **Router**: React Router DOM (HashRouter)
- **Testing**: Vitest + Testing Library

---

## 🚀 Quick Start

### Prerequisites

- Docker 20.10+ and Docker Compose 2.0+
- Git

### Run with Docker (recommended)

```bash
# 1. Clone
git clone https://github.com/DevMinions/UniDormManager.git
cd UniDormManager

# 2. Bring up the full stack
docker compose up -d

# 3. (optional) Seed demo data
docker compose exec -T postgres psql -U postgres -d unidorm < scripts/seed_test_data.sql

# 4. Open
# Web admin:   http://localhost:3000
# Backend API: http://localhost:8080
# Grafana:     http://localhost:3001
```

### Default account

- **Username**: `admin`
- **Password**: printed once in the backend startup log — search for `INITIAL PASSWORD` (or preset via `ADMIN_INITIAL_PASSWORD` env var)

⚠️ Log in and change the admin password immediately after first boot.

---

## 📚 Documentation

- [Docker deployment](docs/DOCKER.md)
- [Database initialization](docs/DATABASE_INIT.md)
- [Full deployment guide](docs/DEPLOYMENT.md)
- [Architecture overview](docs/ARCHITECTURE.md) — C4 container view, backend layering, key flow Mermaid diagrams
- [API reference](docs/API.md)
- [Development guidelines](docs/DEVELOPMENT_GUIDE.md)
- [User manual](docs/USER_MANUAL.md)
- [Changelog](docs/CHANGELOG.md)
- [Contributing](CONTRIBUTING.md)

---

## 🛠️ Development

```bash
# Backend
cd UniDormManagerServer
go mod download
go run main.go

# Frontend
cd UniDormManagerWeb
npm install
npm run dev
```

### Workflow

```
feature/* (development) → dev (integration) → master (release)
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for branching and review rules.

---

## 🧪 Audit & Regression Harnesses

The repo ships with three reproducible audit harnesses (under `tests/`) so any change can be verified end-to-end:

```bash
# Backend integration: hits 38 endpoints (auth, RBAC, paginated CRUD, audit logs)
BASE=http://localhost:8082 python3 tests/audit_api.py

# Web E2E: Playwright + system Chrome, login + 11 pages smoke
node tests/audit_web.js

# UniApp H5 audit (only relevant if you also clone the Mobile repo)
node tests/audit_uniapp.js

# Upload endpoint smoke (multipart, MIME whitelist, size limit)
BASE=http://localhost:8082 python3 tests/upload_smoke.py
```

Current baseline: **audit_api 38/38**, **audit_web 17/17**, **vitest 31/31**, `go test ./...` all green.

---

## 📊 Project Structure

```
UniDormManager/
├── UniDormManagerServer/         # Go backend
│   ├── handlers/                  # HTTP handlers, one file per domain
│   ├── models/                    # Shared data structs
│   ├── database/                  # Connection + auto-create tables
│   ├── store/                     # Data access (interface + impl)
│   ├── scheduler/                 # Cron framework (cron/v3)
│   ├── audit/                     # SSE broker for live audit stream
│   ├── middleware/                # JWT auth, RBAC, CORS, audit log
│   ├── cache/                     # Optional Redis layer
│   └── main.go
├── UniDormManagerWeb/            # React 19 admin
│   ├── pages/                     # One component per admin page
│   ├── components/                # Shared components
│   ├── hooks/                     # usePaginatedData and friends
│   ├── services/api.ts            # Centralised API client
│   ├── contexts/                  # AuthContext etc.
│   └── types.ts
├── tests/                         # Audit / smoke harnesses
├── scripts/                       # SQL scripts, screenshot capture
├── docs/                          # Long-form docs + screenshots
├── render.yaml                    # Render Blueprint (Demo deploy)
├── docker-compose.yml             # Local full-stack
└── Makefile                       # Common commands
```

---

## 📝 Commit Style

Conventional Commits (Chinese or English):

- `feat:` new feature
- `fix:` bug fix
- `refactor:` no behaviour change
- `docs:` documentation
- `style:` formatting only
- `test:` tests
- `chore:` build / tooling

Example: `feat: 添加查寝评分功能` or `fix(api): correct pagination defaults`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/AwesomeFeature`
3. Commit your changes: `git commit -m 'feat: Add awesome feature'`
4. Push the branch: `git push origin feature/AwesomeFeature`
5. Open a Pull Request

Detailed guidelines: [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 🔒 Security

To report a vulnerability, see [SECURITY.md](SECURITY.md). Please **do not** open a public issue for security reports.

---

## 📄 License

MIT — see [LICENSE](LICENSE).

## 👥 Author

- [@DevMinions](https://github.com/DevMinions)

## 📮 Feedback

Open an issue or reach out to the maintainer.
