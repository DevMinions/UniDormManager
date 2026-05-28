# UniDormManager API 集成指南

## ✅ 已完成的工作

### 1. API 模块创建

```
src/api/
├── index.js       # API 统一入口
├── user.js        # 用户相关 API
├── notice.js      # 公告相关 API
├── repair.js      # 报修相关 API
└── room.js        # 房间相关 API
```

### 2. Store 更新

- 更新了 `user.js` store，添加了真实的登录/获取用户信息 API 调用

### 3. 页面更新

- **登录页**: 使用 `userStore.login()` 进行真实登录
- **首页**: 并行获取公告、报修、房间数据

---

## 📡 API 列表

### 用户 API (`/api/user.js`)

| 方法 | 接口 | 说明 |
|------|------|------|
| `login(data)` | POST /api/auth/login | 用户登录 |
| `register(data)` | POST /api/auth/register | 用户注册 |
| `getUserInfo()` | GET /api/user/info | 获取用户信息 |
| `updateUserInfo(data)` | PUT /api/user/info | 更新用户信息 |
| `changePassword(data)` | POST /api/user/change-password | 修改密码 |
| `logout()` | POST /api/auth/logout | 退出登录 |

### 公告 API (`/api/notice.js`)

| 方法 | 接口 | 说明 |
|------|------|------|
| `getNoticeList(params)` | GET /api/notices | 获取公告列表 |
| `getNoticeDetail(id)` | GET /api/notices/:id | 获取公告详情 |
| `createNotice(data)` | POST /api/notices | 创建公告 |
| `updateNotice(id, data)` | PUT /api/notices/:id | 更新公告 |
| `deleteNotice(id)` | DELETE /api/notices/:id | 删除公告 |

### 报修 API (`/api/repair.js`)

| 方法 | 接口 | 说明 |
|------|------|------|
| `getRepairList(params)` | GET /api/repairs | 获取报修列表 |
| `getRepairDetail(id)` | GET /api/repairs/:id | 获取报修详情 |
| `createRepair(data)` | POST /api/repairs | 创建报修 |
| `updateRepairStatus(id, status)` | PUT /api/repairs/:id/status | 更新报修状态 |
| `cancelRepair(id)` | POST /api/repairs/:id/cancel | 取消报修 |
| `getRepairStatistics()` | GET /api/repairs/statistics | 获取报修统计 |
| `uploadImage(filePath)` | POST /api/upload/image | 上传图片 |

### 房间 API (`/api/room.js`)

| 方法 | 接口 | 说明 |
|------|------|------|
| `getRoomList(params)` | GET /api/rooms | 获取房间列表 |
| `getRoomDetail(id)` | GET /api/rooms/:id | 获取房间详情 |
| `getMyRoom()` | GET /api/rooms/my | 获取我的房间 |
| `applyCheckIn(data)` | POST /api/rooms/check-in | 申请入住 |
| `applyCheckOut(data)` | POST /api/rooms/check-out | 申请退宿 |

---

## 🔧 后端配置

### 当前配置

```javascript
// src/utils/request.js
const BASE_URL = 'http://localhost:8080'
```

### 生产环境配置

部署时需要修改 `BASE_URL` 为实际的后端地址：

```javascript
// 开发环境
const BASE_URL = 'http://localhost:8080'

// 生产环境
const BASE_URL = 'https://api.yourdomain.com'
```

---

## 🚀 使用示例

### 1. 登录

```javascript
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()

// 登录
const result = await userStore.login({
  username: 'student001',
  password: '123456'
})

if (result.success) {
  console.log('登录成功', result.data)
} else {
  console.log('登录失败', result.error)
}
```

### 2. 获取公告列表

```javascript
import { noticeApi } from '@/api/notice.js'

// 获取公告列表
try {
  const data = await noticeApi.getNoticeList({ 
    page: 1, 
    limit: 10 
  })
  console.log('公告列表', data)
} catch (error) {
  console.error('获取失败', error)
}
```

### 3. 创建报修

```javascript
import { repairApi } from '@/api/repair.js'

// 创建报修
try {
  const data = await repairApi.createRepair({
    title: '灯管损坏',
    description: '房间主灯不亮',
    type: '灯具维修',
    location: '3-205'
  })
  console.log('创建成功', data)
} catch (error) {
  console.error('创建失败', error)
}
```

---

## 📝 数据格式约定

### 响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

### 错误响应

```json
{
  "code": 400,
  "message": "参数错误",
  "data": null
}
```

### 分页格式

```json
{
  "code": 200,
  "data": {
    "list": [ ... ],
    "total": 100,
    "page": 1,
    "limit": 10
  }
}
```

---

## 🛠️ 下一步工作

### 1. 后端开发

需要后端实现以下 API：

- [ ] 用户认证 API (`/api/auth/*`)
- [ ] 用户信息 API (`/api/user/*`)
- [ ] 公告管理 API (`/api/notices/*`)
- [ ] 报修管理 API (`/api/repairs/*`)
- [ ] 房间管理 API (`/api/rooms/*`)
- [ ] 文件上传 API (`/api/upload/*`)

### 2. 数据模型

参考 `UniDormManagerServer/models/` 目录下的模型定义

### 3. 数据库

参考 `DATABASE_INIT.md` 进行数据库初始化

---

## 🔍 调试技巧

### 1. 查看网络请求

在浏览器开发者工具中：
- 打开 Network 面板
- 查看请求/响应详情

### 2. 模拟数据

当后端 API 不可用时，前端会自动回退到模拟数据：

```javascript
// 首页数据获取
const fetchHomeData = async () => {
  try {
    // 尝试获取真实数据
    const data = await api.getData()
  } catch (error) {
    // 失败时使用模拟数据
    useMockData()
  }
}
```

### 3. 跨域问题

开发时如果遇到跨域问题：

**方案 1**: 配置后端 CORS
```go
// Go 后端示例
w.Header().Set("Access-Control-Allow-Origin", "*")
```

**方案 2**: 使用代理
```json
// manifest.json
"mp-weixin": {
  "setting": {
    "urlCheck": false
  }
}
```

---

## 📚 参考文档

- [后端 API 设计](./UniDormManagerServer/API_DESIGN.md)
- [数据库初始化](./DATABASE_INIT.md)
- [请求封装](../UniDormManagerWeb/services/api.ts)

---

*API 集成完成时间: 2026-03-14*
