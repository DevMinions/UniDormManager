# UniDormManager 重构计划

## 🎨 设计风格：有机自然风 (Organic & Natural)

### 设计理念
- **温暖基调**：像家一样的归属感
- **自然元素**：植物、纸张纹理、大地色系
- **人文关怀**：柔和的视觉体验，不冰冷

---

## 📁 项目结构

```
UniDormManager-UniApp/
├── src/
│   ├── components/          # 公共组件
│   │   ├── AppNavbar/       # 导航栏
│   │   ├── GlassCard/       # 玻璃卡片
│   │   ├── StatCard/        # 统计卡片
│   │   ├── MenuGrid/        # 功能菜单
│   │   ├── NoticeItem/      # 公告项
│   │   └── CustomTabBar/    # 自定义 TabBar
│   │
│   ├── pages/               # 页面
│   │   ├── index/           # 首页
│   │   ├── login/           # 登录
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
│   │   ├── images/          # 图片
│   │   ├── icons/           # 图标
│   │   └── fonts/           # 字体
│   │
│   ├── styles/              # 样式系统
│   │   ├── variables.scss   # SCSS 变量
│   │   ├── mixins.scss      # 混入
│   │   ├── global.scss      # 全局样式
│   │   └── theme.js         # 主题配置
│   │
│   ├── utils/               # 工具函数
│   │   ├── request.js       # HTTP 请求
│   │   ├── storage.js       # 本地存储
│   │   ├── auth.js          # 认证相关
│   │   └── common.js        # 通用工具
│   │
│   ├── api/                 # API 接口
│   │   ├── user.js
│   │   ├── room.js
│   │   ├── repair.js
│   │   ├── notice.js
│   │   └── admin.js
│   │
│   ├── store/               # Pinia 状态管理
│   │   ├── index.js
│   │   ├── modules/
│   │   │   ├── user.js
│   │   │   ├── app.js
│   │   │   └── permission.js
│   │
│   ├── App.vue              # 根组件
│   ├── main.js              # 入口
│   ├── manifest.json        # 应用配置
│   └── pages.json           # 页面路由
│
├── index.html
├── vite.config.js
├── package.json
├── tailwind.config.js
└── README.md
```

---

## 🎨 设计系统规范

### 色彩系统
```
// 主色 - 鼠尾草绿（自然、宁静）
--sage-50: #f6f7f4;
--sage-100: #e8ece4;
--sage-200: #d4dcc9;
--sage-300: #b8c7a6;
--sage-400: #96aa7d;
--sage-500: #7a8f63;
--sage-600: #5c6b52;
--sage-700: #485440;
--sage-800: #3c4436;
--sage-900: #333a2f;

// 强调色 - 陶土色（温暖、大地）
--terracotta-50: #fdf6f0;
--terracotta-100: #f5e5d5;
--terracotta-200: #ebd0b8;
--terracotta-300: #deaf8b;
--terracotta-400: #d08b62;
--terracotta-500: #c46f43;
--terracotta-600: #b85a38;
--terracotta-700: #994630;
--terracotta-800: #7d3c2d;
--terracotta-900: #653327;

// 中性色
--warm-white: #faf9f7;
--warm-gray: #8b8b8b;
--deep-charcoal: #3d3d3d;
```

### 字体系统
- **标题**: ZCOOL XiaoWei（站酷小薇）- 人文书法感
- **正文**: Noto Sans SC - 清晰可读

### 圆角系统
- 小: 8px
- 中: 16px
- 大: 20px
- 特大: 24px
- 不对称: 24px 24px 24px 8px（手绘感）

### 阴影系统
- 轻: 0 2px 12px rgba(0,0,0,0.05)
- 中: 0 4px 16px rgba(0,0,0,0.06)
- 重: 0 8px 24px rgba(139,154,124,0.15)

---

## 📱 页面列表

### Phase 1: 核心页面（优先）
- [ ] 首页 (index)
- [ ] 登录页 (login)
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

## 🚀 实施步骤

### Step 1: 项目初始化 ✅ 准备开始
- [ ] 创建 Vue3 + UniApp 项目
- [ ] 配置 Pinia 状态管理
- [ ] 配置 SCSS/Tailwind

### Step 2: 设计系统搭建
- [ ] 创建 CSS 变量系统
- [ ] 创建全局样式
- [ ] 创建基础组件

### Step 3: 核心页面开发
- [ ] 登录页
- [ ] 首页
- [ ] 个人中心

### Step 4: 功能页面迁移
- [ ] 逐个迁移剩余页面

### Step 5: 测试优化
- [ ] 微信小程序测试
- [ ] H5 测试
- [ ] App 测试
- [ ] 性能优化

---

## 📊 进度追踪

| 阶段 | 状态 | 完成度 |
|------|------|--------|
| 项目初始化 | 🟡 进行中 | 0% |
| 设计系统 | ⬜ 待开始 | 0% |
| 核心页面 | ⬜ 待开始 | 0% |
| 功能页面 | ⬜ 待开始 | 0% |
| 管理页面 | ⬜ 待开始 | 0% |
| 测试优化 | ⬜ 待开始 | 0% |

---

## 📝 注意事项

1. **保持耐心**：慢工出细活，每个细节都要打磨
2. **组件优先**：先做好组件，再组装页面
3. **渐进增强**：基础功能优先，特效其次
4. **多端适配**：时刻注意微信小程序限制
5. **文档同步**：代码和文档保持同步更新

---

*创建时间: 2026-03-05*
*设计风格: 有机自然风*
*技术栈: Vue3 + UniApp + Pinia + SCSS*
