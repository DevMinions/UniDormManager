# UniDorm Manager Mini - 大学宿舍管理系统小程序版

## 📋 项目简介

这是 UniDorm Manager（大学宿舍管理系统）的微信小程序版本，为学生和管理员提供便捷的移动端宿舍管理服务。

## ✨ 主要功能

### 学生端
- 🏠 **房间查询**: 查看宿舍房间状态、楼栋信息
- 🔧 **报修申请**: 在线提交报修请求，上传图片
- 📢 **公告通知**: 查看最新公告和通知
- 👤 **个人中心**: 管理个人信息，查看报修记录

### 管理员端
- 📊 **仪表板**: 查看系统统计数据
- 🏠 **房间管理**: 管理房间信息和入住状态
- 🔧 **报修处理**: 查看和处理报修请求
- 📢 **公告管理**: 发布和管理公告通知

## 🏗️ 技术栈

- **开发框架**: 微信小程序原生开发
- **开发工具**: 微信开发者工具
- **后端API**: 复用现有 Go + Gin 后端服务

## 📂 项目结构

```
UniDormManagerMini/
├── pages/                  # 页面目录
│   ├── index/             # 首页（仪表板）
│   ├── login/             # 登录页
│   ├── rooms/             # 房间查询
│   ├── repairs/           # 报修管理
│   ├── notices/           # 公告通知
│   └── profile/           # 个人中心
├── components/            # 组件目录
├── utils/                 # 工具函数
│   └── request.js        # 网络请求封装
├── api/                   # API接口
│   ├── auth.js           # 认证接口
│   ├── rooms.js          # 房间接口
│   ├── repairs.js        # 报修接口
│   ├── notices.js        # 公告接口
│   └── dashboard.js      # 仪表板接口
├── styles/                # 样式文件
├── images/                # 图片资源
├── app.js                 # 小程序入口
├── app.json               # 小程序配置
├── app.wxss               # 全局样式
└── project.config.json    # 项目配置
```

## 🚀 快速开始

### 前置要求

1. 安装微信开发者工具
2. 注册微信小程序账号，获取 AppID
3. 确保后端服务正在运行（UniDormManagerServer）

### 安装步骤

1. **克隆项目**
```bash
cd /home/adamyu/CursorPorjects/UniDormManager/UniDormManagerMini
```

2. **配置小程序基本信息**

   在 `project.config.json` 中设置 AppID：
   ```json
   "appid": "你的AppID"
   ```

3. **配置后端API地址**

   在 `app.js` 中修改 `baseUrl`：
   ```javascript
   baseUrl: 'http://your-server:8080'
   ```

4. **用微信开发者工具打开项目**

   打开微信开发者工具，选择"导入项目"，选择项目目录

5. **编译运行**

   点击工具栏的"编译"按钮

## 🔧 配置说明

### 服务器域名配置

在小程序管理后台配置以下服务器域名：

- **request合法域名**: `https://your-domain.com`
- **uploadFile合法域名**: `https://your-domain.com`

### API基础URL配置

修改 `app.js` 中的 `baseUrl`：

```javascript
globalData: {
  baseUrl: 'http://localhost:8080', // 开发环境
  // baseUrl: 'https://your-domain.com', // 生产环境
}
```

## 📱 页面说明

### 1. 登录页 (`pages/login/login`)
- 微信一键登录
- 自动跳转到首页

### 2. 首页 (`pages/index/index`)
- 显示统计数据（房间总数、空闲房间、待处理报修等）
- 快捷操作入口
- 管理员专属数据

### 3. 房间查询 (`pages/rooms/list`)
- 房间列表展示
- 搜索房间号
- 查看房间详情

### 4. 报修管理 (`pages/repairs/`)
- `list`: 报修列表，按状态筛选
- `submit`: 提交报修申请，支持图片上传
- `detail`: 报修详情，管理员可更新状态

### 5. 公告通知 (`pages/notices/`)
- `list`: 公告列表，按分类筛选
- `detail`: 公告详情，支持分享

### 6. 个人中心 (`pages/profile/index`)
- 用户信息展示
- 角色权限显示
- 退出登录

## 🔐 权限管理

### 学生权限
- 查看房间信息
- 提交报修申请
- 查看公告通知
- 查看个人报修记录

### 管理员权限
- 查看所有统计数据
- 处理报修请求
- 发布公告通知
- 管理房间信息

## 📝 开发计划

详细的开发计划请查看 [DEV_PLAN.md](./DEV_PLAN.md)

## 📊 进度跟踪

当前开发进度请查看 [PROGRESS.md](./PROGRESS.md)

## 🐛 常见问题

### 1. 登录失败
- 检查后端服务是否运行
- 检查 API 地址配置是否正确
- 确认后端微信登录接口是否正常

### 2. 数据加载失败
- 检查网络连接
- 检查 API 地址配置
- 查看控制台错误信息

### 3. 图片上传失败
- 确认上传接口配置正确
- 检查图片大小限制
- 确认后端文件上传功能正常

## 🔜 后续优化

1. 添加消息推送功能
2. 添加扫一扫功能（扫码查看房间信息）
3. 优化图片压缩和上传
4. 添加离线缓存功能
5. 性能优化和体验提升

## 📄 许可证

MIT License

## 👥 联系方式

如有问题或建议，请联系项目维护者。

---

**开始时间**: 2025-01-30
**当前版本**: 1.0.0
