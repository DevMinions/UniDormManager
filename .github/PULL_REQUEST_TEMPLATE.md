## 改动概要 / Summary

<!-- 一句话说清这个 PR 做了什么 -->

## 关联 issue / Related issue

<!-- Closes #123 / Refs #456；无 issue 也请简要说明动机 -->

## 改动类型 / Type of change

- [ ] 🐛 Bug 修复
- [ ] ✨ 新功能
- [ ] 🔨 重构（不改变行为）
- [ ] 📝 文档
- [ ] 🎨 样式 / UI
- [ ] ⚡ 性能
- [ ] 🔒 安全
- [ ] 🧪 测试
- [ ] 🔧 CI / 工具链
- [ ] 💥 Breaking change（破坏性，需说明迁移路径）

## 验证 / How was this tested?

<!-- 列出运行过的检查；越具体越好 -->

- [ ] `cd UniDormManagerServer && go test ./...` 全绿
- [ ] `cd UniDormManagerWeb && npm run test:run` 全绿
- [ ] `python3 tests/audit_api.py` 不退化（35+/36）
- [ ] `node tests/audit_web.js` 不退化（17/17）
- [ ] 手动验证关键路径:

## Checklist

- [ ] 改动遵循 [`CONTRIBUTING.md`](../CONTRIBUTING.md) 风格
- [ ] 新增/修改的代码有对应的测试或回归手段
- [ ] 涉及 schema 改动时，同步更新了 `database/database.go`（自动建表 + ALTER 兼容现库）
- [ ] 涉及新路由的 RBAC 权限时，同步在 `database/init_auth_data.go` 加了 `permissions` 行
- [ ] 文档（README / docs/）已同步更新
- [ ] commit message 遵循 Conventional Commits（`feat:` / `fix:` / `chore:` / ...）
- [ ] 我已自审过 diff，没有调试代码、注释掉的代码、或硬编码凭据残留

## 截图 / Screenshots

<!-- UI 改动请附前后对比 -->
