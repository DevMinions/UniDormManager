# Contributing to UniDormManager

感谢有兴趣贡献。这份文档说明如何报 bug、提建议,以及如何提交代码改动。

## Code of Conduct

本项目遵循 [Code of Conduct](CODE_OF_CONDUCT.md),参与即视为接受。

## Reporting Issues

- **Bug 报告**:[开 issue](https://github.com/DevMinions/UniDormManager/issues/new?template=bug_report.md),包含复现步骤、期望行为、实际行为、运行环境(后端 / 前端版本、Go / Node 版本、浏览器)
- **功能建议**:[开 issue](https://github.com/DevMinions/UniDormManager/issues/new?template=feature_request.md),说明使用场景与替代方案
- **安全漏洞**:走 [GitHub Private Vulnerability Reporting](SECURITY.md),不要直接在 issue 区公开

提之前请先用 issue 搜索是否已有同类问题。

## Submitting Changes

主分支是 `main`,改动通过 Pull Request 合入。

### 1. 准备工作

```bash
# Fork 仓库后 clone 自己的 fork
git clone https://github.com/<your-account>/UniDormManager.git
cd UniDormManager

# 关联 upstream
git remote add upstream https://github.com/DevMinions/UniDormManager.git

# 从最新 main 开新分支
git fetch upstream
git checkout -b feat/your-topic upstream/main
```

分支命名建议(非强制):`feat/*` · `fix/*` · `docs/*` · `refactor/*` · `test/*`。

### 2. 本地开发与测试

参考 [README → Development](README.md#development) 起后端与前端。提 PR 前请保证两个 baseline 都绿:

```bash
make test       # go test ./... + vitest
make audit      # 105 项 E2E(预置 vite preview :3000 + 后端 :8082)
```

新加端点或 schema 变动,**必须**同步更新:

- 后端 `database/createTables` 或 `init_auth_data.go`(若涉及新权限)
- `tests/audit_api.py` 覆盖新接口
- `docs/API.md` 写新接口章节
- 涉及 UI 工作流的,加 `tests/audit_web_crud_*.js` 或 `audit_web_workflow_*.js`

### 3. Commit Message

采用 [Conventional Commits](https://www.conventionalcommits.org/),subject 简短,正文写清"为什么":

| 类型 | 用途 |
|---|---|
| `feat` | 新功能 |
| `fix` | bug 修复 |
| `refactor` | 不改外部行为的重构 |
| `docs` | 仅文档 |
| `test` | 仅测试 |
| `chore` | 工具链 / 依赖 / CI |
| `build` | 构建系统 / 包管理 |
| `perf` | 性能改进 |

中英文皆可。涉及 issue 的 commit 末尾加 `Closes #123` 自动关联。

### 4. 提 Pull Request

```bash
git push origin feat/your-topic
gh pr create --base main --head feat/your-topic
```

PR 描述请按 [PR template](.github/PULL_REQUEST_TEMPLATE.md) 填:动机 / 改动概要 / 测试方式 / 关联 issue。CI(GitHub Actions)会跑 backend + frontend test、Trivy 扫描、镜像构建。

PR 期望:

- 一个 PR 解决一类问题,不混合无关改动
- `make test` + `make audit` 本地双绿
- 提交历史可读,合并时按需 squash
- 涉及破坏性变更,在 PR 描述明确说明

## Style

- **Go**:`go fmt` + `goimports`;错误显式 `return err`,不吞;handler 用 `c.ShouldBindJSON` 校验
- **TypeScript**:遵循现有 ESLint / Prettier 配置;尽量复用 `services/api.ts` 而不是手写 fetch
- **SQL**:`scripts/` 里的迁移命名 `YYYYMMDD_*.sql`(虽然目前自动建表为主)

详细约定参考 [docs/DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md)。

## License

提交即视为同意将贡献以 [MIT](LICENSE) 协议授权。
