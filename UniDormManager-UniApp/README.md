# UniDormManager - UniApp 重构版

## 🎨 设计风格：有机自然风 (Organic & Natural)

温暖、人文、自然，让宿舍管理系统像家一样有归属感。

---

## 📁 项目结构

```
UniDormManager-UniApp/
├── src/
│   ├── components/          # 公共组件
│   │   ├── AppNavbar/       # 导航栏
│   │   ├── WelcomeCard/     # 欢迎卡片
│   │   ├── StatCard/        # 统计卡片
│   │   ├── MenuGrid/        # 功能菜单
│   │   ├── NoticeList/      # 公告列表
│   │   └── CustomTabBar/    # 自定义 TabBar
│   │
│   ├── pages/               # 页面
│   │   ├── index/           # 首页 ✅
│   │   ├── login/           # 登录 ✅
│   │   ├── rooms/           # 房间相关
│   │   ├── repairs/         # 报修相关
│   │   ├── notices/         # 公告相关
│   │   ├── profile/         # 个人中心
│   │   ├── inspections/     # 查寝
│   │   ├── checkin/         # 入住
│   │   ├── checkout/        # 退宿
│   │   └── admin/           # 管理后台
│   │
│   ├── static/              # 静态资源
│   ├── styles/              # 样式系统 ✅
│   ├── utils/               # 工具函数 ✅
│   ├── api/                 # API 接口
│   ├── store/               # Pinia 状态管理 ✅
│   ├── App.vue              # 根组件 ✅
│   ├── main.js              # 入口 ✅
│   ├── manifest.json        # 应用配置 ✅
│   └── pages.json           # 页面路由 ✅
│
├── index.html               # HTML 模板 ✅
├── vite.config.js           # Vite 配置 ✅
└── package.json             # 依赖配置 ✅
```

---

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式

**微信小程序**
```bash
npm run dev:mp-weixin
```

**H5**
```bash
npm run dev:h5
```

**App**
```bash
npm run dev:app
```

### 打包构建

**微信小程序**
```bash
npm run build:mp-weixin
```

**H5**
```bash
npm run build:h5
```

---

## 🎨 设计系统

### 色彩系统

#### 主色 - 鼠尾草绿 (Sage Green)
```
$sage-50: #f6f7f4
$sage-100: #e8ece4
$sage-200: #d4dcc9
$sage-300: #b8c7a6
$sage-400: #96aa7d
$sage-500: #7a8f63
$sage-600: #5c6b52  ← 主色调
$sage-700: #485440
$sage-800: #3c4436
$sage-900: #333a2f
```

#### 强调色 - 陶土色 (Terracotta)
```
$terracotta-50: #fdf6f0
$terracotta-100: #f5e5d5
$terracotta-200: #ebd0b8
$terracotta-300: #deaf8b
$terracotta-400: #d08b62
$terracotta-500: #c46f43
$terracotta-600: #b85a38
```

### 字体系统
- **标题**: ZCOOL XiaoWei（站酷小薇）- 人文书法感
- **正文**: Noto Sans SC - 清晰可读

### 圆角系统
- 小: 8rpx
- 中: 16rpx
- 大: 20rpx
- 特大: 24rpx
- **手绘感不规则**: 24px 24px 24px 8px

### 阴影系统
```
$shadow-sm: 0 2rpx 12rpx rgba(0,0,0,0.05)
$shadow-md: 0 4rpx 16rpx rgba(0,0,0,0.06)
$shadow-lg: 0 8rpx 24rpx rgba(139,154,124,0.15)
```

---

## 📱 页面列表

### Phase 1: 核心页面 ✅
- [x] 首页 (index)
- [x] 登录页 (login)
- [ ] 个人中心 (profile)

### Phase 2: 功能页面
- [ ] 房间列表 (rooms/list)
- [ ] 房间详情 (rooms/detail)
- [ ] 报修列表 (repairs/list)
- [ ] 报修提交 (repairs/submit)
- [ ] 公告列表 (notices/list)
- [ ] 公告详情 (notices/detail)

### Phase 3: 管理页面
- [ ] 管理员仪表盘 (admin/dashboard)
- [ ] 用户管理 (admin/users)
- [ ] 系统设置 (admin/settings)

### Phase 4: 特殊功能
- [ ] 查寝 (inspections)
- [ ] 入住/退宿 (checkin/checkout)

---

## 🛠️ 技术栈

- **框架**: Vue 3 + Composition API
- **跨平台**: UniApp 3.0
- **状态管理**: Pinia
- **样式**: SCSS
- **构建**: Vite
- **HTTP**: 基于 uni.request 的封装

---

## 📦 组件说明

### WelcomeCard
欢迎卡片组件，显示用户姓名和角色
```vue
<WelcomeCard 
  name="张明同学" 
  role="学生" 
  decoration="🌿"
/>
```

### StatCard
统计卡片组件，显示数据指标
```vue
<StatCard
  icon="🏠"
  value="3-205"
  label="我的宿舍"
  variant="sage"
/>
```

### MenuGrid
功能菜单网格
```vue
<MenuGrid :items="[
  { icon: '🔧', text: '报修', path: '/pages/repairs/submit' },
  { icon: '📅', text: '查寝', path: '/pages/inspections/list' }
]" />
```

### NoticeList
公告列表组件
```vue
<NoticeList 
  :notices="notices" 
  @click="handleNoticeClick"
/>
```

---

## 🔌 API 配置

在 `src/utils/request.js` 中修改 `BASE_URL`：
```javascript
const BASE_URL = 'http://localhost:8080'  // 你的后端地址
```

---

## 📝 开发规范

### 命名规范
- 组件: PascalCase (WelcomeCard)
- 页面: index.vue, list.vue, detail.vue
- 样式: 使用 BEM 命名法

### 样式规范
- 使用 SCSS 变量
- 移动端适配使用 rpx
- 颜色使用设计系统变量

### 状态管理
- 用户状态: `useUserStore`
- 应用状态: `useAppStore`

---

## 🎯 下一步计划

1. [ ] 完善个人中心页面
2. [ ] 创建 API 接口模块
3. [ ] 迁移房间相关页面
4. [ ] 迁移报修相关页面
5. [ ] 迁移公告相关页面
6. [ ] 真机测试和优化

---

## 📄 许可证

MIT

---

*重建时间: 2026-03-05*
*设计风格: 有机自然风*
*技术栈: Vue3 + UniApp + Pinia + SCSS*
// CI Test: Wed Mar 18 09:51:56 AM UTC 2026
// CI Test 2: Wed Mar 18 09:54:37 AM UTC 2026
// CI Test 3: Wed Mar 18 09:58:22 AM UTC 2026
// CI Test 4: Wed Mar 18 10:00:48 AM UTC 2026
// CI Test 5: Wed Mar 18 11:24:29 AM UTC 2026
// CI Test 6: Wed Mar 18 11:41:02 AM UTC 2026
