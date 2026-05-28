# UniDormManager 小程序 + 后端 API 联调指南

## ✅ 后端服务状态

### Docker 服务已启动
```
✅ unidorm-postgres    - PostgreSQL 数据库 (端口 5433)
✅ unidorm-redis       - Redis 缓存 (端口 6380)
✅ unidorm-backend     - Go 后端 API (端口 8080)
✅ unidorm-grafana     - 监控面板 (端口 3001)
✅ unidorm-prometheus  - 监控指标 (端口 9090)
```

### 后端 API 地址
```
http://localhost:8080
```

### 健康检查
```bash
curl http://localhost:8080/health
# 响应: {"cache":true,"database":"connected","status":"ok"}
```

---

## 🔧 微信小程序配置

### 1. 开发工具设置

在微信开发者工具中：

1. **开启不校验合法域名** (开发阶段)
   - 点击右上角「详情」
   - 勾选「不校验合法域名、web-view...」

2. **配置局域网 IP** (真机调试)
   
   修改 `src/utils/request.js`：
   ```javascript
   const ENV = {
     development: {
       // 将 localhost 改为你的电脑局域网 IP
       // Windows: ipconfig 查看 IPv4 地址
       // Mac/Linux: ifconfig 或 ip addr 查看
       baseURL: 'http://192.168.1.100:8080'  // 替换为你的 IP
     }
   }
   ```

### 2. 运行小程序

```bash
# 1. 编译小程序
cd UniDormManager-UniApp
npm run build:mp-weixin

# 2. 在微信开发者工具中导入
# 选择目录: UniDormManager-UniApp/dist/build/mp-weixin
```

---

## 📡 可用 API 列表

### 认证 API
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/login` | POST | 登录 |
| `/api/auth/logout` | POST | 退出 (需认证) |
| `/api/auth/me` | GET | 获取当前用户信息 (需认证) |

**登录示例**:
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**响应**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-admin-1",
    "username": "admin",
    "name": "管理员",
    "role": "admin"
  }
}
```

### 公告 API (需认证)
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/notices` | GET | 获取公告列表 |
| `/api/notices/:id` | GET | 获取公告详情 |
| `/api/notices` | POST | 创建公告 |
| `/api/notices/:id` | PUT | 更新公告 |
| `/api/notices/:id` | DELETE | 删除公告 |

### 报修 API (需认证)
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/repairs` | GET | 获取报修列表 (分页) |
| `/api/repairs/all` | GET | 获取所有报修 |
| `/api/repairs/:id` | GET | 获取报修详情 |
| `/api/repairs` | POST | 创建报修 |
| `/api/repairs/:id` | PUT | 更新报修 |
| `/api/repairs/:id` | DELETE | 删除报修 |

### 房间 API (需认证)
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/rooms` | GET | 获取房间列表 (分页) |
| `/api/rooms/all` | GET | 获取所有房间 |
| `/api/rooms/:id` | GET | 获取房间详情 |
| `/api/buildings` | GET | 获取楼栋列表 |
| `/api/students` | GET | 获取学生列表 |

### 用户 API (需管理员权限)
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/users` | GET | 获取用户列表 |
| `/api/users/:id` | GET | 获取用户详情 |
| `/api/users` | POST | 创建用户 |
| `/api/users/:id` | PUT | 更新用户 |
| `/api/users/:id` | DELETE | 删除用户 |

---

## 🔑 测试账号

```yaml
管理员:
  username: admin
  password: admin123

学生:
  username: student001
  password: 123456
```

---

## 🚀 快速开始

### 1. 启动后端服务
```bash
cd UniDormManager
docker compose up -d backend postgres redis
```

### 2. 编译小程序
```bash
cd UniDormManager-UniApp
npm run build:mp-weixin
```

### 3. 微信开发者工具配置
1. 打开微信开发者工具
2. 导入项目: `dist/build/mp-weixin`
3. 勾选「不校验合法域名」
4. 点击「编译」

### 4. 测试登录
1. 进入登录页
2. 输入 `admin` / `admin123`
3. 点击登录
4. 查看首页数据加载

---

## 🔍 常见问题

### 1. 无法连接后端 (localhost)

**问题**: 小程序无法访问 localhost:8080

**解决**:
1. 查找你的电脑局域网 IP:
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig | grep inet
   ```

2. 修改 `src/utils/request.js`:
   ```javascript
   baseURL: 'http://192.168.x.x:8080'  // 替换为你的IP
   ```

3. 确保手机和电脑在同一 WiFi 网络

### 2. 403 Forbidden

**问题**: API 返回 403 权限错误

**原因**: 后端有权限控制，需要特定角色才能访问

**解决**: 
- 使用管理员账号登录
- 或修改后端权限配置

### 3. CORS 跨域错误

**问题**: 浏览器控制台报跨域错误

**解决**: 
- 后端已配置 CORS 中间件
- 确保请求 URL 正确

---

## 📊 监控面板

- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **后端 API**: http://localhost:8080

---

## 📝 文件清单

### 小程序前端
```
UniDormManager-UniApp/
├── src/
│   ├── api/              # API 模块
│   │   ├── index.js
│   │   ├── user.js
│   │   ├── notice.js
│   │   ├── repair.js
│   │   └── room.js
│   ├── utils/
│   │   └── request.js    # 请求封装
│   └── store/
│       └── modules/
│           └── user.js   # 用户状态管理
└── dist/build/mp-weixin/ # 编译输出
```

### 后端服务
```
UniDormManagerServer/
├── main.go               # 入口
├── handlers/             # API 处理器
├── models/               # 数据模型
├── middleware/           # 中间件
└── Dockerfile
```

---

## 🎯 下一步

1. ✅ 后端 API 已启动
2. ✅ 小程序 API 模块已配置
3. ⏳ 真机调试 (配置局域网 IP)
4. ⏳ 测试所有 API 接口
5. ⏳ 联调完成

---

*联调指南生成时间: 2026-03-14*
