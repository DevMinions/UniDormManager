# UniDormManager 重构开发计划

## 📋 项目概述

将微信小程序原生代码重构为 UniApp + Vue3 跨平台应用，采用有机自然风设计风格。

**技术栈**: Vue3 + UniApp + Vite + Pinia + SCSS
**设计风格**: 有机自然风 (鼠尾草绿 + 陶土色)

---

## 📊 当前状态 (更新: 2026-03-08)

| 模块 | 状态 | 完成度 |
|------|------|--------|
| 项目架构 | ✅ | 100% |
| 设计系统 | ✅ | 100% |
| 基础组件 (6个) | ✅ | 100% |
| 首页 (index) | ✅ | 100% |
| 登录页 (login) | ✅ | 100% |
| 个人中心 (profile) | ✅ | 100% |
| 房间列表 (rooms/list) | ✅ | 100% |
| 房间详情 (rooms/detail) | ⬜ | 0% |
| 报修相关页面 | ⬜ | 0% |
| 公告相关页面 | ⬜ | 0% |
| 查寝页面 | ⬜ | 0% |
| 入住/退宿页面 | ⬜ | 0% |
| 管理员页面 | ⬜ | 0% |

---

## 🎯 开发阶段

### Phase 1: 核心用户功能（Week 1）

**目标**: 完成普通学生用户的核心功能，让 TabBar 全部可用

| 序号 | 任务 | 页面路径 | 预计耗时 | 优先级 |
|------|------|----------|----------|--------|
| 1.1 | 个人中心页面 | `profile/index.vue` | 4h | P0 |
| 1.2 | 房间列表页面 | `rooms/list.vue` | 4h | P0 |
| 1.3 | 房间详情页面 | `rooms/detail.vue` | 3h | P0 |
| 1.4 | 报修列表页面 | `repairs/list.vue` | 4h | P0 |
| 1.5 | 报修提交页面 | `repairs/submit.vue` | 4h | P0 |
| 1.6 | 报修详情页面 | `repairs/detail.vue` | 3h | P1 |

**交付标准**:
- 底部 TabBar 四个入口全部可用
- 普通学生用户可以完成：查看宿舍、提交报修、查看公告
- 页面风格统一，符合设计系统

---

### Phase 2: 内容展示功能（Week 1-2）

**目标**: 完成内容展示类页面

| 序号 | 任务 | 页面路径 | 预计耗时 | 优先级 |
|------|------|----------|----------|--------|
| 2.1 | 公告列表页面 | `notices/list.vue` | 3h | P0 |
| 2.2 | 公告详情页面 | `notices/detail.vue` | 2h | P0 |
| 2.3 | 查寝记录页面 | `inspections/list.vue` | 3h | P1 |
| 2.4 | 入住办理页面 | `checkin/index.vue` | 4h | P2 |
| 2.5 | 退宿办理页面 | `checkout/index.vue` | 4h | P2 |

---

### Phase 3: 管理员功能（Week 2）

**目标**: 完成管理员后台功能

| 序号 | 任务 | 页面路径 | 预计耗时 | 优先级 |
|------|------|----------|----------|--------|
| 3.1 | 管理员仪表盘 | `admin/dashboard.vue` | 4h | P1 |
| 3.2 | 用户管理页面 | `admin/users.vue` | 5h | P1 |
| 3.3 | 系统设置页面 | `admin/settings.vue` | 3h | P2 |

---

### Phase 4: 高级功能（Week 2-3）

**目标**: 完成高级管理功能

| 序号 | 任务 | 页面路径 | 预计耗时 | 优先级 |
|------|------|----------|----------|--------|
| 4.1 | 公告发布页面 | `notices/publish.vue` | 3h | P2 |
| 4.2 | 公告统计页面 | `notices/stats.vue` | 3h | P3 |
| 4.3 | 报修统计页面 | `repairs/statistics.vue` | 3h | P3 |
| 4.4 | 系统日志页面 | `admin/logs.vue` | 2h | P3 |

---

### Phase 5: 优化与测试（Week 3）

**目标**: 优化性能和用户体验

| 序号 | 任务 | 预计耗时 |
|------|------|----------|
| 5.1 | 真机测试（微信小程序） | 1d |
| 5.2 | 性能优化 | 1d |
| 5.3 | 代码审查和重构 | 1d |
| 5.4 | 文档更新 | 0.5d |

---

## 🎨 组件清单

### 已完成的组件
- ✅ AppNavbar - 导航栏
- ✅ CustomTabBar - 自定义 TabBar
- ✅ WelcomeCard - 欢迎卡片
- ✅ StatCard - 统计卡片
- ✅ MenuGrid - 功能菜单网格
- ✅ NoticeList - 公告列表

### 需要新增的组件
| 组件名 | 用途 | 优先级 |
|--------|------|--------|
| EmptyState | 空状态展示 | P0 |
| LoadingSkeleton | 骨架屏 | P1 |
| ListCard | 列表项卡片 | P0 |
| StatusBadge | 状态标签 | P0 |
| ImageUploader | 图片上传 | P1 |
| SearchBar | 搜索栏 | P1 |
| FilterDropdown | 筛选下拉 | P2 |

---

## 🔌 API 接口规划

### 用户相关
- `GET /api/user/profile` - 获取用户信息
- `PUT /api/user/profile` - 更新用户信息
- `POST /api/user/avatar` - 上传头像

### 房间相关
- `GET /api/rooms` - 房间列表
- `GET /api/rooms/:id` - 房间详情
- `GET /api/rooms/my` - 我的房间

### 报修相关
- `GET /api/repairs` - 报修列表
- `POST /api/repairs` - 提交报修
- `GET /api/repairs/:id` - 报修详情
- `PUT /api/repairs/:id` - 更新报修

### 公告相关
- `GET /api/notices` - 公告列表
- `GET /api/notices/:id` - 公告详情

### 管理员相关
- `GET /api/admin/dashboard` - 仪表盘数据
- `GET /api/admin/users` - 用户列表
- `PUT /api/admin/users/:id` - 更新用户

---

## 📅 执行计划

### 本周任务（当前周）

#### Day 1 - Phase 1 开始
- [ ] 1.1 个人中心页面
- [ ] 1.2 房间列表页面

#### Day 2
- [ ] 1.3 房间详情页面
- [ ] 1.4 报修列表页面

#### Day 3
- [ ] 1.5 报修提交页面
- [ ] 1.6 报修详情页面

#### Day 4 - Phase 2
- [ ] 2.1 公告列表页面
- [ ] 2.2 公告详情页面

#### Day 5
- [ ] 2.3 查寝记录页面
- [ ] 代码审查和优化

---

## 📝 开发规范

### 文件命名
- 页面: `pages/模块名/页面名.vue`
- 组件: `components/组件名/组件名.vue`
- 工具: `utils/功能名.js`

### 代码风格
- 使用 Composition API `<script setup>`
- 样式使用 SCSS + scoped
- 颜色使用设计系统变量
- 组件使用 PascalCase

### 提交规范
```
feat: 新增功能
fix: 修复问题
style: 样式调整
refactor: 代码重构
docs: 文档更新
```

---

*计划创建时间: 2026-03-07*
*预计总工期: 3 周*
