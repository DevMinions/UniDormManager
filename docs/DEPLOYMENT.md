# Deployment

UniDormManager 三种部署路径,按运维偏好选:

| 路径 | 适用 | 入口 |
|---|---|---|
| Docker Compose | 本地 / 单机自托管(推荐) | [DOCKER.md](DOCKER.md) · `make up` |
| Render Blueprint | 云端一键 demo | [`render.yaml`](../render.yaml) + 顶 README 按钮 |
| 自托管 systemd + Nginx | 物理机 / VM,无 Docker | 见下文 |

数据库初始化(种子数据 / 默认账号)所有路径共用 [DATABASE_INIT.md](DATABASE_INIT.md)。

## Prerequisites

| 组件 | 最低版本 | 用途 |
|---|---|---|
| Go | 1.23+ | 后端编译 |
| Node.js | 18+ | 前端构建 |
| PostgreSQL | 16+ | 主数据库 |
| Redis | 7+(可选) | 缓存(`USE_CACHE=true` 才用) |
| Nginx | 1.18+ | 反向代理 + 前端静态文件 |

Docker compose 路径自带前 4 项,只需 Docker 20.10+ 和 Docker Compose 2.0+。

## Environment Variables

后端读 env,无配置文件。生产部署务必设以下:

| 变量 | 必须 | 说明 |
|---|---|---|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | ✓ | PostgreSQL 连接 |
| `DB_SSLMODE` | ✓ | 生产用 `require`,本地可 `disable` |
| `JWT_SECRET` | ✓ | **≥32 字符**,生产请用 `openssl rand -base64 48` 生成 |
| `ADMIN_INITIAL_PASSWORD` | 可选 | 不设则首启随机生成 16 字符,日志打印一次 |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` | 仅 `USE_CACHE=true` 时 | |
| `USE_CACHE` | 可选 | `true` / `false`(默认 false) |
| `PORT` / `APP_PORT` | 可选 | 监听端口(默认 8080) |
| `APP_ENV` | 可选 | `production` / `development` |

完整字段参考 `UniDormManagerServer/config/` 包源码。

## Path 1 — Docker Compose

```bash
git clone https://github.com/DevMinions/UniDormManager.git
cd UniDormManager
make up           # docker compose up -d
docker compose exec -T postgres psql -U postgres -d unidorm < scripts/seed_test_data.sql  # 可选
```

详见 [DOCKER.md](DOCKER.md):服务端口、镜像构建、stack 升级、日志查看。

## Path 2 — Render Blueprint

点 README 顶部 "Deploy to Render" 或访问 `render.com/deploy?repo=...`。Render 读 `render.yaml` 自动起 PostgreSQL + 后端 + 前端。首次部署后:

1. 进 Render dashboard 找 `unidorm-backend` 域名
2. 编辑 `unidorm-web` 的 `VITE_API_URL` 为 `https://<backend>.onrender.com/api`
3. 触发 `unidorm-web` 重新 build
4. 从 `unidorm-backend` 启动日志取 `INITIAL PASSWORD` 登录

Render Free idle 15min 后 sleep,首访冷启 ~30s。生产用付费 plan 或 Path 1/3。

## Path 3 — Self-host (systemd + Nginx)

适合物理机 / VM 上不用 Docker 的场景。前提:PostgreSQL 已就绪、有 `unidorm` 数据库和用户。

### 1. 编译后端

```bash
git clone https://github.com/DevMinions/UniDormManager.git
cd UniDormManager/UniDormManagerServer
go mod download
CGO_ENABLED=0 go build -o /opt/unidorm/unidorm-server .
```

### 2. systemd 单元

`/etc/systemd/system/unidorm.service`:

```ini
[Unit]
Description=UniDormManager backend
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=unidorm
WorkingDirectory=/opt/unidorm
EnvironmentFile=/opt/unidorm/.env       # 含 DB_*, JWT_SECRET 等
ExecStart=/opt/unidorm/unidorm-server
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload && systemctl enable --now unidorm
journalctl -fu unidorm                   # 查启动日志 / INITIAL PASSWORD
```

### 3. 构建前端

```bash
cd UniDormManagerWeb
npm ci
VITE_API_URL=https://api.example.com/api npm run build
# dist/ 拷到 Nginx 静态目录,如 /var/www/unidorm
```

### 4. Nginx 反向代理

`/etc/nginx/sites-available/unidorm`:

```nginx
server {
    listen 443 ssl http2;
    server_name unidorm.example.com;
    ssl_certificate     /etc/letsencrypt/live/unidorm.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/unidorm.example.com/privkey.pem;

    root /var/www/unidorm;
    index index.html;

    # 前端 SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API + SSE
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE (/api/audit-logs/stream) 必需:关 buffer,延长 timeout
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }

    # 上传文件静态服务
    location /uploads/ {
        proxy_pass http://127.0.0.1:8080;
    }

    # Prometheus 指标(建议加 IP 白名单或 basic auth)
    location /metrics {
        allow 10.0.0.0/8;
        deny all;
        proxy_pass http://127.0.0.1:8080;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/unidorm /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

## 升级流程

### Docker compose

```bash
cd UniDormManager
git pull
make rebuild     # docker compose build && docker compose up -d
```

### 自托管

```bash
cd UniDormManager
git pull
cd UniDormManagerServer && go build -o /opt/unidorm/unidorm-server .
systemctl restart unidorm

cd ../UniDormManagerWeb
npm ci && VITE_API_URL=https://api.example.com/api npm run build
rsync -a --delete dist/ /var/www/unidorm/
```

数据库 schema 在后端启动时自动 `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE ADD COLUMN IF NOT EXISTS`,**不需要手动跑迁移**。

## 备份 / 恢复

```bash
# 备份
pg_dump -h localhost -U postgres unidorm | gzip > backup-$(date +%F).sql.gz

# 恢复
gunzip < backup-2026-05-28.sql.gz | psql -h localhost -U postgres unidorm
```

或用 docker compose 路径:`make backup` / `make restore file=backup-2026-05-28.sql.gz`。

## 监控

后端在 `/metrics` 暴露 Prometheus 格式指标。docker compose 路径自带 Prometheus + Grafana(端口 9090 / 3001),开机已通过 provisioning load `grafana/provisioning/dashboards/unidorm-overview.json`(11 panel)。

自托管路径用现有 Prometheus 抓 `http://unidorm-backend:8080/metrics`,Grafana import dashboard JSON 即可。

## 故障排查

| 症状 | 排查 |
|---|---|
| 后端启动 `JWT 密钥长度至少 32 个字符` | `JWT_SECRET` 不够长或未设 |
| `pq: SSL is not enabled on the server` | `DB_SSLMODE=disable` |
| 502 from Nginx | `systemctl status unidorm` 看后端是否启动;`journalctl -u unidorm` 看错误 |
| SSE 断流 / 客户端连不上 | Nginx `proxy_buffering off` 没设;或 `proxy_read_timeout` 太短 |
| Login 401 | DB 中无 admin 行,看后端首启日志的 `INITIAL PASSWORD` |
| `/metrics` 公开访问 | Nginx 加 IP 白名单 / basic auth |

更多见 [DATABASE_INIT.md](DATABASE_INIT.md) 和 [DOCKER.md](DOCKER.md)。
