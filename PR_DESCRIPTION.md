# PR: feat: 前端功能检查与修复

## 功能描述

本次PR对UniDormManager宿舍管理系统的前端功能进行全面检查和修复，确保所有页面正常渲染、API调用正确、交互功能完整。

### 主要改进

1. **后端API完善**
   - 优化查寝(inspections)相关接口
   - 完善换房(room_swaps)功能处理
   - 新增门禁日志(access_logs)测试
   - 统一分页处理逻辑

2. **前端测试修复**
   - 修复用户认证上下文(authContext)测试
   - 完善组件测试覆盖率

3. **基础设施**
   - 更新docker-compose配置
   - 优化开发环境设置

## 修改文件

### 后端 (UniDormManagerServer/)
- `handlers/access_logs_test.go` - 新增门禁日志测试
- `handlers/inspections.go` - 优化查寝接口
- `handlers/inspections_test.go` - 新增查寝测试
- `handlers/room_swaps.go` - 优化换房处理
- `handlers/room_swaps_test.go` - 新增换房测试
- `main.go` - 主程序优化
- `models/models.go` - 模型定义更新
- `models/pagination.go` - 分页逻辑优化
- `store/interface.go` - 存储接口更新
- `store/store_db.go` - 数据库操作优化

### 前端 (UniDormManagerWeb/)
- `src/test/authContext.test.tsx` - 认证上下文测试修复
- `package-lock.json` - 依赖更新

### Docker配置
- `docker-compose.yml` - 基础配置优化
- `docker-compose.override.yml` - 开发环境配置

## 测试结果

- ✅ 后端构建通过: `go build`
- ✅ 后端测试通过: `go test ./...`
- ✅ 前端构建通过: `npm run build`
- ✅ Docker部署验证通过

## 技术细节

### 分页优化
统一了后端分页处理逻辑，支持更灵活的查询参数。

### API一致性
确保所有handler接口返回格式统一，便于前端处理。

### 测试覆盖
新增和修复了多个单元测试，提高代码可靠性。

---

**分支:** `feature/frontend-function-check-20260210`
**提交数:** 2 commits
**修改文件:** 12 files
