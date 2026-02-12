# UniDormManager 宿舍管理系统 API 文档

## 📋 目录

1. [基础信息](#基础信息)
2. [认证接口](#认证接口)
3. [用户管理](#用户管理)
4. [学生管理](#学生管理)
5. [楼栋管理](#楼栋管理)
6. [房间管理](#房间管理)
7. [报修管理](#报修管理)
8. [公告管理](#公告管理)
9. [查寝管理](#查寝管理)
10. [换寝申请](#换寝申请)
11. [门禁记录](#门禁记录)
12. [晚归告警](#晚归告警)
13. [仪表板](#仪表板)
14. [通用接口](#通用接口)

---

## 基础信息

### 服务地址

| 环境 | Base URL |
|------|----------|
| 本地开发 | `http://localhost:8080` |
| 测试环境 | `http://test-api.unidorm.com` |
| 生产环境 | `https://api.unidorm.com` |

### 通用请求头

```http
Content-Type: application/json
Authorization: Bearer {access_token}
```

### 通用响应格式

#### 成功响应
```json
{
  "id": "uuid",
  "field": "value"
}
```

或列表响应：
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "pageSize": 10,
  "totalPages": 10,
  "hasNext": true,
  "hasPrev": false
}
```

#### 错误响应
```json
{
  "error": "error_code",
  "message": "错误描述信息"
}
```

### HTTP 状态码

| 状态码 | 含义 |
|--------|------|
| `200 OK` | 请求成功 |
| `201 Created` | 资源创建成功 |
| `400 Bad Request` | 请求参数错误 |
| `401 Unauthorized` | 未授权，需要登录 |
| `403 Forbidden` | 无权限访问 |
| `404 Not Found` | 资源不存在 |
| `422 Unprocessable Entity` | 验证失败 |
| `500 Internal Server Error` | 服务器内部错误 |

---

## 认证接口

### POST /api/auth/login
用户登录

**请求体**:
```json
{
  "username": "admin",
  "password": "password123"
}
```

**响应**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "1",
    "username": "admin",
    "name": "管理员",
    "roles": ["admin"],
    "permissions": ["students:read", "students:create", ...]
  }
}
```

**错误响应**:
```json
{
  "error": "invalid_credentials",
  "message": "用户名或密码错误"
}
```

---

### POST /api/auth/wechat/login
微信小程序登录

**请求体**:
```json
{
  "code": "wechat_login_code",
  "encryptedData": "...",
  "iv": "..."
}
```

**响应**: 同普通登录

---

### POST /api/auth/logout
用户登出

**请求头**:
```http
Authorization: Bearer {token}
```

**响应**:
```json
{
  "message": "登出成功"
}
```

---

### GET /api/auth/me
获取当前用户信息

**响应**:
```json
{
  "id": "1",
  "username": "admin",
  "name": "管理员",
  "avatar": "https://...",
  "roles": ["admin"],
  "permissions": ["students:read", "students:create", ...]
}
```

---

## 用户管理

### GET /api/users
获取用户列表（分页）

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| pageSize | int | 否 | 每页数量，默认 10，最大 100 |
| search | string | 否 | 搜索关键词（用户名/姓名） |
| sortBy | string | 否 | 排序字段 |
| sortOrder | string | 否 | 排序方向：`asc` 或 `desc` |

**响应**:
```json
{
  "data": [
    {
      "id": "1",
      "username": "admin",
      "name": "管理员",
      "status": "active",
      "roles": ["admin"],
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "pageSize": 10,
  "totalPages": 5,
  "hasNext": true,
  "hasPrev": false
}
```

**权限**: `users:read`

---

### GET /api/users/:id
获取指定用户信息

**响应**:
```json
{
  "id": "1",
  "username": "admin",
  "name": "管理员",
  "email": "admin@example.com",
  "phone": "13800138000",
  "status": "active",
  "roles": ["admin"],
  "permissions": [...],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

**权限**: `users:read`

---

### POST /api/users
创建用户

**请求体**:
```json
{
  "username": "newuser",
  "password": "password123",
  "name": "新用户",
  "email": "user@example.com",
  "phone": "13800138001",
  "roles": ["counselor"]
}
```

**权限**: `users:create`

---

### PUT /api/users/:id
更新用户信息

**请求体**:
```json
{
  "name": "更新的名字",
  "email": "newemail@example.com",
  "status": "active"
}
```

**权限**: `users:update`

---

### DELETE /api/users/:id
删除用户

**权限**: `users:delete`

---

### POST /api/users/:id/roles
分配角色给用户

**请求体**:
```json
{
  "roles": ["counselor", "inspector"]
}
```

**权限**: `users:update`

---

## 角色权限管理

### GET /api/roles
获取所有角色

**响应**:
```json
[
  {
    "id": "1",
    "name": "admin",
    "description": "系统管理员",
    "permissions": ["*"]
  },
  {
    "id": "2",
    "name": "counselor",
    "description": "辅导员",
    "permissions": ["students:read", "students:update"]
  }
]
```

**权限**: `roles:read`

---

### GET /api/roles/:id
获取角色详情

---

### POST /api/roles
创建角色

**请求体**:
```json
{
  "name": "custom_role",
  "description": "自定义角色",
  "permissions": ["students:read", "repairs:read"]
}
```

**权限**: `roles:create`

---

### GET /api/permissions
获取所有权限列表

**响应**:
```json
{
  "permissions": [
    { "code": "students:read", "name": "查看学生", "module": "学生管理" },
    { "code": "students:create", "name": "创建学生", "module": "学生管理" },
    { "code": "students:update", "name": "更新学生", "module": "学生管理" },
    { "code": "students:delete", "name": "删除学生", "module": "学生管理" }
  ]
}
```

**权限**: `roles:read`

---

## 学生管理

### GET /api/students
获取学生列表（分页）⭐ 推荐使用

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| pageSize | int | 否 | 每页数量，默认 10 |
| search | string | 否 | 搜索（姓名/学号） |
| status | string | 否 | 筛选状态：`Active`, `Graduated`, `On Leave` |
| major | string | 否 | 筛选专业 |
| building | string | 否 | 筛选楼栋 |
| room | string | 否 | 筛选房间号 |
| sortBy | string | 否 | 排序字段 |
| sortOrder | string | 否 | `asc` 或 `desc` |

**响应**:
```json
{
  "data": [
    {
      "id": "1",
      "name": "张三",
      "studentId": "2023001",
      "major": "计算机科学",
      "building": "A栋",
      "roomNumber": "101",
      "status": "Active"
    }
  ],
  "total": 349,
  "page": 1,
  "pageSize": 10,
  "totalPages": 35,
  "hasNext": true,
  "hasPrev": false
}
```

**权限**: `students:read`

---

### GET /api/students/all
获取所有学生（不分页）⚠️ 数据量大时慎用

**响应**: 学生数组（无分页信息）

**权限**: `students:read`

---

### GET /api/students/:id
获取指定学生详情

**响应**:
```json
{
  "id": "1",
  "name": "张三",
  "studentId": "2023001",
  "major": "计算机科学",
  "building": "A栋",
  "roomNumber": "101",
  "status": "Active",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**权限**: `students:read`

---

### POST /api/students
创建学生

**请求体**:
```json
{
  "name": "张三",
  "studentId": "2023001",
  "major": "计算机科学",
  "building": "A栋",
  "roomNumber": "101",
  "status": "Active"
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | ✅ | 学生姓名（2-20字符） |
| studentId | string | ✅ | 学号（唯一） |
| major | string | ❌ | 专业 |
| building | string | ❌ | 楼栋 |
| roomNumber | string | ❌ | 房间号 |
| status | string | ❌ | 状态：`Active`, `Graduated`, `On Leave`，默认 `Active` |

**权限**: `students:create`

---

### PUT /api/students/:id
更新学生信息

**请求体**:
```json
{
  "name": "李四",
  "roomNumber": "102",
  "status": "Active"
}
```

**权限**: `students:update`

---

### DELETE /api/students/:id
删除学生

**权限**: `students:delete`

---

## 楼栋管理

### GET /api/buildings
获取所有楼栋

**响应**:
```json
[
  {
    "id": "1",
    "name": "A栋",
    "type": "Male",
    "floors": 6,
    "manager": "王老师",
    "description": "理工科男生宿舍",
    "roomCount": 120,
    "occupiedCount": 118
  }
]
```

**权限**: `buildings:read`

---

### GET /api/buildings/:id
获取楼栋详情

---

### POST /api/buildings
创建楼栋

**请求体**:
```json
{
  "name": "B栋",
  "type": "Female",
  "floors": 6,
  "manager": "李老师",
  "description": "文科女生宿舍"
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | ✅ | 楼栋名称（唯一） |
| type | string | ✅ | 类型：`Male`, `Female`, `Co-ed` |
| floors | int | ✅ | 层数（>0） |
| manager | string | ✅ | 管理员姓名 |
| description | string | ❌ | 描述信息 |

**权限**: `buildings:create`

---

### PUT /api/buildings/:id
更新楼栋

**权限**: `buildings:update`

---

### DELETE /api/buildings/:id
删除楼栋

**权限**: `buildings:delete`

---

## 房间管理

### GET /api/rooms
获取房间列表（分页）⭐ 推荐使用

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页数量 |
| building | string | 否 | 筛选楼栋 |
| status | string | 否 | 筛选状态：`Available`, `Full`, `Maintenance` |
| type | string | 否 | 筛选类型：`Male`, `Female`, `Co-ed` |
| capacityMin | int | 否 | 最小容量 |
| capacityMax | int | 否 | 最大容量 |

**响应**:
```json
{
  "data": [
    {
      "id": "1",
      "number": "101",
      "building": "A栋",
      "capacity": 4,
      "occupied": 3,
      "type": "Male",
      "status": "Available"
    }
  ],
  "total": 500,
  "page": 1,
  "pageSize": 10
}
```

**权限**: `rooms:read`

---

### GET /api/rooms/all
获取所有房间（不分页）

**权限**: `rooms:read`

---

### GET /api/rooms/:id
获取房间详情

---

### POST /api/rooms
创建房间

**请求体**:
```json
{
  "number": "101",
  "building": "A栋",
  "capacity": 4,
  "occupied": 0,
  "type": "Male",
  "status": "Available"
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| number | string | ✅ | 房间号（楼栋内唯一） |
| building | string | ✅ | 所属楼栋 |
| capacity | int | ✅ | 容量（>0） |
| occupied | int | ❌ | 已入住人数（默认0，不能>capacity） |
| type | string | ✅ | 类型：`Male`, `Female`, `Co-ed` |
| status | string | ✅ | 状态：`Available`, `Full`, `Maintenance` |

**权限**: `rooms:create`

---

### PUT /api/rooms/:id
更新房间

**权限**: `rooms:update`

---

### DELETE /api/rooms/:id
删除房间

**权限**: `rooms:delete`

---

## 报修管理

### GET /api/repairs
获取报修列表（分页）⭐ 推荐使用

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页数量 |
| status | string | 否 | 筛选：`Pending`, `In Progress`, `Completed` |
| priority | string | 否 | 筛选：`Low`, `Medium`, `High` |
| room | string | 否 | 筛选房间号 |
| dateFrom | date | 否 | 开始日期（YYYY-MM-DD） |
| dateTo | date | 否 | 结束日期 |

**响应**:
```json
{
  "data": [
    {
      "id": "1",
      "title": "水龙头漏水",
      "description": "浴室洗脸盆水龙头持续漏水",
      "status": "Pending",
      "priority": "Medium",
      "date": "2024-01-15",
      "roomNumber": "101"
    }
  ],
  "total": 25
}
```

**权限**: `repairs:read`

---

### GET /api/repairs/all
获取所有报修（不分页）

**权限**: `repairs:read`

---

### GET /api/repairs/:id
获取报修详情

---

### POST /api/repairs
创建报修请求

**请求体**:
```json
{
  "title": "水龙头漏水",
  "description": "浴室洗脸盆水龙头持续漏水",
  "roomNumber": "101",
  "priority": "Medium"
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | ✅ | 报修主题（2-100字符） |
| description | string | ❌ | 详细描述（最多500字符） |
| roomNumber | string | ✅ | 房间号 |
| priority | string | ❌ | 优先级：`Low`, `Medium`, `High`，默认 `Medium` |

**注意**: 创建时 `status` 自动设置为 `Pending`，`date` 自动设置为当前日期。

**权限**: `repairs:create`

---

### PUT /api/repairs/:id
更新报修请求

**请求体**:
```json
{
  "status": "In Progress",
  "priority": "High"
}
```

**状态值**: `Pending`, `In Progress`, `Completed`

**权限**: `repairs:update`

---

### DELETE /api/repairs/:id
删除报修请求

**权限**: `repairs:delete`

---

## 公告管理

### GET /api/notices
获取公告列表

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页数量 |
| search | string | 否 | 搜索标题/内容 |

**响应**:
```json
{
  "data": [
    {
      "id": "1",
      "title": "关于寒假期间宿舍封闭管理的通知",
      "content": "各位同学：寒假将至...",
      "date": "2024-01-10",
      "author": "后勤管理处"
    }
  ],
  "total": 15
}
```

**权限**: `notices:read`

---

### GET /api/notices/:id
获取公告详情

---

### POST /api/notices
创建公告

**请求体**:
```json
{
  "title": "关于寒假期间宿舍封闭管理的通知",
  "content": "各位同学：寒假将至，为确保宿舍安全...",
  "author": "后勤管理处"
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | ✅ | 公告标题（2-200字符） |
| content | string | ❌ | 公告内容 |
| author | string | ✅ | 发布者 |

**注意**: `date` 自动设置为当前日期。

**权限**: `notices:create`

---

### PUT /api/notices/:id
更新公告

**权限**: `notices:update`

---

### DELETE /api/notices/:id
删除公告

**权限**: `notices:delete`

---

## 查寝管理

### GET /api/inspections
获取查寝记录（分页）

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页数量 |
| status | string | 否 | 筛选：`Excellent`, `Good`, `Fair`, `Poor` |
| building | string | 否 | 筛选楼栋 |
| inspector | string | 否 | 筛选检查人 |
| dateFrom | date | 否 | 开始日期 |
| dateTo | date | 否 | 结束日期 |
| scoreMin | int | 否 | 最低分数 |
| scoreMax | int | 否 | 最高分数 |

**响应**:
```json
{
  "data": [
    {
      "id": "1",
      "roomNumber": "101",
      "building": "A栋",
      "inspector": "王老师",
      "checkDate": "2024-01-15",
      "overallScore": 95,
      "status": "Excellent",
      "comment": "卫生状况良好",
      "details": [
        {
          "category": "卫生",
          "item": "地面清洁",
          "score": 25,
          "maxScore": 25,
          "comment": "非常干净"
        }
      ],
      "createdAt": "2024-01-15T14:30:00Z"
    }
  ],
  "total": 100
}
```

**权限**: `inspections:read`

---

### GET /api/inspections/rooms
获取待查寝房间列表

**响应**:
```json
[
  {
    "roomNumber": "101",
    "building": "A栋",
    "lastInspectionDate": "2024-01-10",
    "daysSinceLastInspection": 5
  }
]
```

**权限**: `inspections:read`

---

### GET /api/inspections/rankings
获取查寝排行榜

**响应**:
```json
{
  "weekly": [
    {
      "roomNumber": "101",
      "building": "A栋",
      "weekScore": 98.5,
      "rank": 1
    }
  ],
  "monthly": [
    {
      "roomNumber": "102",
      "building": "B栋",
      "monthScore": 96.0,
      "rank": 1
    }
  ]
}
```

**权限**: `inspections:read`

---

### GET /api/inspections/:id
获取查寝详情

---

### POST /api/inspections
创建查寝记录

**请求体**:
```json
{
  "roomNumber": "101",
  "building": "A栋",
  "overallScore": 95,
  "comment": "卫生状况良好",
  "details": [
    {
      "category": "卫生",
      "item": "地面清洁",
      "score": 25,
      "maxScore": 25,
      "comment": "非常干净"
    },
    {
      "category": "卫生",
      "item": "桌面整洁",
      "score": 24,
      "maxScore": 25,
      "comment": "略有杂物"
    }
  ]
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| roomNumber | string | ✅ | 房间号 |
| building | string | ✅ | 楼栋 |
| overallScore | int | ✅ | 总分（0-100） |
| comment | string | ❌ | 评语 |
| details | array | ❌ | 详细评分项 |

**权限**: `inspections:create`

---

### PUT /api/inspections/:id
更新查寝记录

**权限**: `inspections:update`

---

### DELETE /api/inspections/:id
删除查寝记录

**权限**: `inspections:delete`

---

## 换寝申请

### GET /api/room-swaps
获取所有换寝申请

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 筛选状态 |
| currentStep | string | 否 | 筛选当前步骤 |
| urgencyLevel | string | 否 | 筛选紧急程度 |
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页数量 |

**响应**:
```json
{
  "data": [
    {
      "id": "1",
      "applicantId": "student1",
      "applicantName": "张三",
      "currentRoom": "A栋101",
      "targetRoom": "B栋202",
      "reason": "与室友作息不合",
      "urgencyLevel": "Normal",
      "status": "Pending",
      "currentStep": "Counselor",
      "applyDate": "2024-01-15",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 20
}
```

---

### GET /api/room-swaps/my-applications
获取我的换寝申请

**响应**: 换寝申请列表

---

### GET /api/room-swaps/pending
获取待审批的换寝申请

**响应**: 待审批申请列表

---

### GET /api/room-swaps/history
获取换寝申请历史记录

**响应**:
```json
{
  "data": [
    {
      "id": "1",
      "applicationId": "app1",
      "action": "Submitted",
      "actorName": "张三",
      "comment": "提交申请",
      "createdAt": "2024-01-15T10:00:00Z"
    },
    {
      "id": "2",
      "applicationId": "app1",
      "action": "CounselorApproved",
      "actorName": "李老师",
      "comment": "情况属实，同意换寝",
      "createdAt": "2024-01-16T09:00:00Z"
    }
  ]
}
```

---

### GET /api/room-swaps/available
获取可换入的空闲房间

**响应**:
```json
[
  {
    "roomNumber": "B栋202",
    "building": "B栋",
    "capacity": 4,
    "occupied": 2,
    "availableBeds": 2
  }
]
```

---

### POST /api/room-swaps
提交换寝申请

**请求体**:
```json
{
  "targetRoom": "B栋202",
  "reason": "与室友作息不合，影响休息",
  "urgencyLevel": "Normal"
}
```

**urgencyLevel 说明**:
- `Normal`: 一般（处理时间：5个工作日）
- `Urgent`: 紧急（处理时间：3个工作日）
- `VeryUrgent`: 非常紧急（处理时间：1个工作日）

---

### POST /api/room-swaps/:id/approve
审批换寝申请

**请求体**:
```json
{
  "status": "Approved",
  "comment": "情况属实，同意换寝"
}
```

**status**: `Approved` 或 `Rejected`

**权限**: 辅导员/学院/公寓中心

---

### DELETE /api/room-swaps/:id
取消换寝申请（仅限申请人本人）

---

## 门禁记录

### GET /api/access-logs
获取门禁记录（分页）

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页数量 |
| direction | string | 否 | 筛选：`In`, `Out` |
| studentName | string | 否 | 筛选学生姓名 |
| roomNumber | string | 否 | 筛选房间号 |
| gateName | string | 否 | 筛选门禁名称 |
| status | string | 否 | 筛选：`Normal`, `Late`, `Absent` |
| dateFrom | date | 否 | 开始日期 |
| dateTo | date | 否 | 结束日期 |

**响应**:
```json
{
  "data": [
    {
      "id": "1",
      "studentId": "2023001",
      "studentName": "张三",
      "roomNumber": "101",
      "direction": "In",
      "gateName": "A栋大门",
      "timestamp": "2024-01-15T22:30:00Z",
      "status": "Late",
      "photoUrl": "https://..."
    }
  ],
  "total": 1000
}
```

---

### GET /api/access-logs/live
获取实时门禁记录（WebSocket 或 SSE）

**响应**: 最新 50 条记录

---

### POST /api/access-logs
创建门禁记录（通常是硬件设备调用）

**请求体**:
```json
{
  "studentId": "2023001",
  "studentName": "张三",
  "roomNumber": "101",
  "direction": "In",
  "gateName": "A栋大门",
  "timestamp": "2024-01-15T22:30:00Z",
  "photoUrl": "https://..."
}
```

**权限**: `access_logs:create`

---

## 晚归告警

### GET /api/late-returns
获取晚归告警列表

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 筛选：`Pending`, `Handled`, `Ignored` |
| studentName | string | 否 | 筛选学生姓名 |
| roomNumber | string | 否 | 筛选房间号 |
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页数量 |

**响应**:
```json
{
  "data": [
    {
      "id": "1",
      "studentId": "2023001",
      "studentName": "张三",
      "roomNumber": "101",
      "alertDate": "2024-01-15",
      "lastEntry": "2024-01-15T23:30:00Z",
      "status": "Pending",
      "notifySent": true,
      "createdAt": "2024-01-16T00:00:00Z"
    }
  ],
  "total": 15
}
```

---

### GET /api/late-returns/pending
获取待处理的晚归告警

---

### POST /api/late-returns/:id/handle
处理晚归告警

**请求体**:
```json
{
  "handler": "李老师",
  "comment": "已联系学生，确认安全",
  "status": "Handled"
}
```

**status**: `Handled` 或 `Ignored`

---

## 仪表板

### GET /api/dashboard/stats
获取仪表板统计数据

**响应**:
```json
{
  "totalStudents": 349,
  "occupancyRate": 87.5,
  "pendingRepairs": 12,
  "completedRepairs": 45,
  "todayAccessCount": 523,
  "lateReturnsCount": 3,
  "occupancyData": [
    {
      "name": "A栋",
      "occupied": 120,
      "capacity": 150
    },
    {
      "name": "B栋",
      "occupied": 98,
      "capacity": 100
    }
  ],
  "requestStatus": [
    {
      "name": "待处理",
      "value": 12,
      "color": "#F59E0B"
    },
    {
      "name": "处理中",
      "value": 8,
      "color": "#3B82F6"
    },
    {
      "name": "已完成",
      "value": 45,
      "color": "#10B981"
    }
  ]
}
```

**权限**: `dashboard:read`

---

## 通用接口

### GET /health
健康检查

**响应**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15 14:30:00",
  "cache": true,
  "database": "connected"
}
```

---

### GET /metrics
Prometheus 监控指标

**响应**: Prometheus 格式文本

---

## 前端开发指南

### 错误处理示例

```javascript
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      ...options
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '请求失败');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

### 分页请求示例

```javascript
async function getStudents(page = 1, filters = {}) {
  const params = new URLSearchParams({
    page,
    pageSize: 10,
    ...filters
  });
  
  return await apiRequest(`/api/students?${params}`);
}

// 使用
const { data, total, hasNext } = await getStudents(1, { status: 'Active' });
```

### 带上传文件的请求

```javascript
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: formData
  });
  
  return await response.json();
}
```

---

## 更新日志

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v2.0 | 2024-02-11 | 新增查寝、换寝、门禁、晚归模块；支持分页和筛选 |
| v1.5 | 2024-02-03 | 新增用户角色权限系统 |
| v1.0 | 2024-01-31 | 初始版本：学生、楼栋、房间、报修、公告管理 |

---

*文档生成时间: 2024-02-11*
*接口版本: v2.0*
