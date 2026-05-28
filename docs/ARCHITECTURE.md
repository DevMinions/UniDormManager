# Architecture

> UniDormManager 的整体结构与关键流转。Mermaid 图,GitHub 与多数 Markdown 阅读器原生渲染。

## 系统上下文(C4 L1 — Context)

```mermaid
flowchart LR
    Admin[管理员<br/>Web 浏览器]
    Mobile[学生 / 宿管员<br/>UniApp H5 或微信小程序]
    Monitor[运维<br/>Grafana / Prometheus]

    System[UniDormManager<br/>Go + React 全栈]

    Admin -->|HTTPS / JWT| System
    Mobile -->|HTTPS / JWT| System
    Monitor -->|/metrics scrape| System
    Monitor -.->|SSE /api/audit-logs/stream| System

    classDef ext fill:#e0e7ff,stroke:#4f46e5,color:#1e1b4b
    classDef sys fill:#fef3c7,stroke:#d97706,color:#451a03
    class Admin,Mobile,Monitor ext
    class System sys
```

外部接入只有三类:Web 浏览器(本仓库)、UniApp 客户端(独立 [Mobile repo](https://github.com/DevMinions/UniDormManager-Mobile))、运维监控。

---

## 容器视图(C4 L2 — Container)

```mermaid
flowchart TB
    subgraph Client[ 客户端 ]
        Web[React 19 + Vite<br/>Web 管理端 :3000]
        UniApp[UniApp Vue3<br/>H5 / 微信小程序]
    end

    subgraph Backend[ 后端 ]
        API[Gin HTTP API :8080<br/>RBAC + JWT + Audit Middleware]
        Scheduler[Cron Scheduler<br/>robfig/cron/v3]
        Broker[SSE Broker<br/>in-memory fan-out]
    end

    subgraph Data[ 数据层 ]
        PG[(PostgreSQL 16<br/>pgx)]
        Redis[(Redis 7<br/>可选缓存)]
    end

    subgraph Ops[ 可观测性 ]
        Prom[Prometheus<br/>/metrics scrape]
        Graf[Grafana<br/>面板]
    end

    Web -->|fetch /api| API
    UniApp -->|fetch /api| API
    API --> PG
    API -.cached.-> Redis
    Scheduler --> PG
    API -- publish --> Broker
    Web -.SSE /audit-logs/stream.-> Broker
    Prom -->|scrape /metrics| API
    Graf --> Prom

    classDef cli fill:#dbeafe,stroke:#2563eb
    classDef be fill:#fef3c7,stroke:#d97706
    classDef db fill:#fce7f3,stroke:#db2777
    classDef ops fill:#d1fae5,stroke:#059669
    class Web,UniApp cli
    class API,Scheduler,Broker be
    class PG,Redis db
    class Prom,Graf ops
```

**关键事实**:
- 单 Go 进程内集成 HTTP API + cron + SSE broker(无独立 worker / 消息队列)。
- Redis 是可选缓存(`USE_CACHE=true` 才启用),不存关键状态。
- SSE broker 是 in-memory fan-out;事件持久化由 `audit_logs` 表保证。

---

## 后端包分层(C4 L3 — Component)

```mermaid
flowchart TB
    Main[main.go<br/>Gin 路由组装 + scheduler.Start]

    subgraph HTTP[HTTP 层]
        Handlers[handlers/<br/>每业务域一个文件]
        Middleware[middleware/<br/>AuthMiddleware<br/>RequirePermission<br/>AuditLog<br/>CORS]
    end

    subgraph Domain[领域]
        Models[models/<br/>共享结构体]
        Auth[auth/<br/>JWT 签发 / Claims]
        StoreIF[store.StoreInterface]
        StoreDB[store/store_db.go<br/>pgx 实现]
    end

    subgraph Infra[基础设施]
        DB[database/<br/>连接池 + 自动建表]
        Cache[cache/<br/>Redis 包装]
        Logger[logger/]
        Monitoring[monitoring/<br/>Prometheus 指标]
        Scheduler[scheduler/<br/>cron + jobs]
        AuditBroker[audit/<br/>SSE broker]
        Utils[utils/query_builder.go]
    end

    Main --> Handlers
    Main --> Middleware
    Main --> Scheduler
    Handlers --> StoreIF
    StoreIF --> StoreDB
    StoreDB --> DB
    StoreDB --> Cache
    Middleware --> Auth
    Middleware --> AuditBroker
    Middleware --> Monitoring
    Handlers --> Models
    Handlers --> Utils
    Scheduler --> DB
    Scheduler --> Monitoring
    AuditBroker --> Monitoring
```

依赖方向(箭头)始终 outside-in,**没有循环**:
- HTTP 层依赖 Domain;Domain 依赖 Infra;Infra 不反向依赖。
- `monitoring` 是叶子节点,被所有人调用。
- `store` 用接口(`StoreInterface`)抽象,handler 测试时可用 mock 替代。

---

## 关键流程:写请求 + 审计

```mermaid
sequenceDiagram
    participant C as Client
    participant Auth as AuthMiddleware
    participant Audit as AuditLog Middleware
    participant H as Handler
    participant S as Store
    participant DB as PostgreSQL
    participant Broker as SSE Broker
    participant Sub as 任意 SSE 订阅者

    C->>+Auth: POST /api/buildings (Bearer <token>)
    Auth->>Auth: 验证 JWT, 写 claims 到 ctx
    Auth->>+Audit: c.Next()
    Audit->>+H: c.Next()
    H->>S: CreateBuilding(req)
    S->>DB: INSERT INTO buildings
    DB-->>S: id
    S-->>H: building
    H-->>-Audit: 201 Created
    Audit-->>-C: 201(立即响应)
    Note over Audit: 异步 goroutine
    Audit-)DB: INSERT INTO audit_logs
    Audit-)Broker: Publish(event)
    Broker->>Sub: SSE event: audit
```

要点:
- **AuditLog 在 `c.Next()` 后才落库**——这样它能拿到最终 status code,只记 `< 400` 的成功操作。
- **DB 写 + broker publish 都在 goroutine**,client 已经拿到 201,不会被审计 IO 阻塞。
- **goroutine 失败仅 log**——审计可丢,业务不丢。

---

## 关键流程:JWT 鉴权 + RBAC

```mermaid
sequenceDiagram
    participant C as Client
    participant Auth as AuthMiddleware
    participant RBAC as RequirePermission
    participant H as Handler
    participant DB as PostgreSQL

    C->>+Auth: GET /api/students (Bearer <token>)
    alt token 无效 / 过期
        Auth-->>C: 401 unauthorized
    else token 在 blacklist
        Auth->>DB: SELECT FROM token_blacklist
        DB-->>Auth: hit
        Auth-->>C: 401 token revoked
    else 合法
        Auth->>Auth: 解码 claims, 注入 ctx
        Auth->>+RBAC: c.Next()
        alt claims 缺权限
            RBAC-->>C: 403 forbidden
        else 权限 OK
            RBAC->>+H: c.Next()
            H->>DB: SELECT FROM students
            DB-->>H: rows
            H-->>C: 200 + data
        end
    end
```

权限模型详见 [RBAC design](ROLE_BASED_DESIGN.md)。

---

## 数据流:Dashboard 时序图渲染

```mermaid
sequenceDiagram
    participant Web as Web Dashboard
    participant API as Backend
    participant DB as PostgreSQL

    Web->>+API: GET /api/dashboard/stats
    API->>DB: 多表聚合(students/rooms/repairs)
    DB-->>API: aggregated counts
    API-->>-Web: stats JSON

    par 并行拉趋势
    Web->>+API: GET /api/statistics/repairs-by-day?days=30
    API->>DB: WITH days AS (generate_series ...)<br/>LEFT JOIN repair_requests
    DB-->>API: 30 行
    API-->>-Web: { days: 30, data: [...] }
    end

    Web->>Web: Recharts 渲染:<br/>LineChart 趋势 + BarChart 入住 + PieChart 报修状态
```

时序图 SQL 用 `generate_series` 补缺日,前端拿到的永远是连续 N 个数据点。

---

## 部署拓扑

```mermaid
flowchart LR
    subgraph Render[ Render 一键部署 / Free Tier ]
        WebRender[unidorm-web<br/>Static Site]
        BackendRender[unidorm-backend<br/>Web Service Docker]
        PGRender[(unidorm-postgres<br/>Managed DB)]
    end

    User -->|"https://*.onrender.com"| WebRender
    WebRender -.fetch.-> BackendRender
    BackendRender --> PGRender
```

或本地 `make up` 走 docker-compose 全栈(含 Redis + Grafana,详见 [Docker 部署指南](DOCKER.md))。

---

## 相关文档

- [API 接口文档](API.md) — 含 v0.2.0 新增接口
- [部署](DEPLOYMENT.md)
- [开发规范](DEVELOPMENT_GUIDE.md)
- [角色权限设计](ROLE_BASED_DESIGN.md)
