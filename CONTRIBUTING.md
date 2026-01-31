# 贡献指南 - Git工作流规范

本文档描述了 UniDormManager 项目的 Git 分支管理规范。

---

## 🌳 分支策略

```
master (生产分支)
    ↓ 仅在发布时合并
dev (开发分支)
    ↓ 功能测试通过后合并
feature/* (功能开发分支)
bugfix/* (Bug修复分支)
```

---

## 📋 分支说明

### 1. master (生产分支)
- **用途**: 生产环境发布版本
- **状态**: 始终保持稳定、可部署
- **合并来源**: 仅从 dev 分支合并
- **保护**: 建议设置为受保护分支，禁止直接推送

### 2. dev (开发分支)
- **用途**: 开发环境稳定版本
- **状态**: 包含已测试通过的功能
- **合并来源**: feature/*, bugfix/* 分支
- **部署**: 用于开发环境部署

### 3. feature/* (功能开发分支)
- **用途**: 新功能开发
- **命名**: `feature/功能描述`，如 `feature/查寝评分`
- **合并**: 开发测试通过后合并到 dev
- **删除**: 合并后建议删除该分支

### 4. bugfix/* (Bug修复分支)
- **用途**: Bug修复
- **命名**: `bugfix/问题描述`，如 `bugfix/修复dashboard数据加载`
- **合并**: 修复测试通过后合并到 dev

### 5. hotfix/* (紧急修复分支)
- **用途**: 生产环境紧急问题修复
- **命名**: `hotfix/紧急问题描述`
- **合并**: 修复后可直接合并到 master，然后再合并到 dev

---

## 🔄 开发工作流

### 步骤 1: 创建功能分支
```bash
# 从 dev 分支创建新的功能分支
git checkout dev
git pull origin dev
git checkout -b feature/新功能名
```

### 步骤 2: 开发与测试
```bash
# ... 进行开发 ...
git add .
git commit -m "feat: 添加新功能"

# 本地测试确保功能正常
```

### 步骤 3: 合并到 dev
```bash
# 切换到 dev 分支
git checkout dev
git pull origin dev

# 合并功能分支
git merge feature/新功能名

# 推送到远程
git push origin dev
```

### 步骤 4: 删除已合并的分支
```bash
# 删除本地分支
git branch -d feature/新功能名

# 删除远程分支（可选）
git push origin --delete feature/新功能名
```

### 步骤 5: 发布到生产
```bash
# 仅在需要发布版本时执行
git checkout master
git pull origin master
git merge dev
git tag v1.0.0
git push origin master --tags
```

---

## 📝 提交信息规范

使用语义化提交信息：

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: 添加查寝评分功能` |
| `fix` | Bug修复 | `fix: 修复Dashboard授权问题` |
| `refactor` | 代码重构 | `refactor: 重构学生列表分页逻辑` |
| `docs` | 文档更新 | `docs: 更新API文档` |
| `style` | 代码格式 | `style: 统一代码缩进` |
| `test` | 测试相关 | `test: 添加单元测试` |
| `chore` | 构建/工具 | `chore: 更新依赖` |

---

## ✅ 合并前检查清单

在合并到 dev 之前，确保：

- [ ] 代码自测通过
- [ ] 没有编译警告
- [ ] 没有残留的 console.error
- [ ] 添加了必要的注释
- [ ] 更新了相关文档
- [ ] 代码符合项目规范
- [ ] 测试覆盖充分

---

## 🎯 最佳实践

### 1. 频繁提交
- 小步快跑，频繁提交
- 每次提交都是一个完整的逻辑单元

### 2. 分支隔离
- 每个功能/修复使用独立分支
- 避免在 dev/master 直接开发

### 3. 及时同步
- 定期从 dev 分支拉取最新代码
- 解决冲突后再提交

### 4. 代码审查
- 重要功能建议进行代码审查
- 合并前与团队成员沟通

---

## 🚨 注意事项

1. **禁止直接推送到 master**
2. **dev 分支必须保持可运行状态**
3. **合并前必须解决所有冲突**
4. **提交信息清晰描述变更内容**

---

## 📞 问题反馈

如对工作流有疑问，请在项目 issue 中提出。

---

**最后更新**: 2026-01-31
