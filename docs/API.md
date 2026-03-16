# UniDormManager API 接口文档

## 📋 目录

- [认证相关](#认证相关)
- [用户管理](#用户管理)
- [学生管理](#学生管理)
- [房间管理](#房间管理)
- [楼栋管理](#楼栋管理)
- [报修管理](#报修管理)
- [公告管理](#公告管理)
- [查寝管理](#查寝管理)
- [换寝管理](#换寝管理)
- [晚归告警](#晚归告警)
- [门禁记录](#门禁记录)
- [消息中心](#消息中心)
- [数据统计](#数据统计)

---

## 认证相关

### POST /api/auth/login
用户登录

**请求参数:**
```json
{
  "username": "string",  // 用户名/手机号
  "password": "string",  // 密码
  "captcha": "string"    // 验证码（可选）
}
```

**响应:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "admin",
    "name": "管理员",
    "roles": ["system_admin"]
  }
}
```

---

### POST /api/auth/logout
用户登出

**请求头:**
```
Authorization: Bearer {token}
```

**响应:**
```json
{
  "message": "登出成功"
}
```

---

### POST /api/auth/refresh
刷新 Token

**请求头:**
```
Authorization: Bearer {token}
```

**响应:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## 用户管理

### GET /api/users
获取用户列表

**请求参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| pageSize | int | 否 | 每页数量，默认20 |
| keyword | string | 否 | 搜索关键词 |
| role | string | 否 | 角色筛选 |

**响应:**
```json
{
  "list": [
    {
      "id": 1,
      "username": "student001",
      "name": "张三",
      "phone": "138****5678",
      "roles": ["student"],
      "status": "active",
      "createdAt": "2024-01-15T08:00:00Z"
    }
  ],
  "total": 100
}
```

---

### GET /api/users/{id}
获取用户详情

**响应:**
```json
{
  "id": 1,
  "username": "student001",
  "name": "张三",
  "phone": "13812345678",
  "email": "zhangsan@example.com",
  "roles": ["student"],
  "student": {
    "studentId": "2024001",
    "major": "计算机科学",
    "grade": "2024"
  },
  "createdAt": "2024-01-15T08:00:00Z"
}
```

---

### POST /api/users
创建用户

**请求参数:**
```json
{
  "username": "string",
  "password": "string",
  "name": "string",
  "phone": "string",
  "email": "string",
  "roles": ["string"],
  "studentId": "string",  // 学生必填
  "major": "string",      // 学生必填
  "grade": "string"       // 学生必填
}
```

---

### PUT /api/users/{id}
更新用户

**请求参数:**
```json
{
  "name": "string",
  "phone": "string",
  "email": "string",
  "roles": ["string"],
  "status": "active"
}
```

---

### DELETE /api/users/{id}
删除用户

---

## 学生管理

### GET /api/students
获取学生列表

**请求参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| pageSize | int | 否 | 每页数量 |
| keyword | string | 否 | 搜索关键词 |
| buildingId | int | 否 | 楼栋筛选 |
| roomId | int | 否 | 房间筛选 |

**响应:**
```json
{
  "list": [
    {
      "id": 1,
      "studentId": "2024001",
      "name": "张三",
      "gender": "male",
      "major": "计算机科学",
      "grade": "2024",
      "room": {
        "id": 101,
        "building": "A栋",
        "roomNumber": "101"
      },
      "phone": "138****5678",
      "checkInDate": "2024-02-01"
    }
  ],
  "total": 500
}
```

---

### GET /api/students/{id}
获取学生详情

---

### POST /api/students
录入学生信息

**请求参数:**
```json
{
  "studentId": "2024001",
  "name": "张三",
  "gender": "male",
  "major": "计算机科学",
  "grade": "2024",
  "phone": "13812345678",
  "idCard": "110101200001011234",
  "roomId": 101
}
```

---

### PUT /api/students/{id}/room
调整宿舍

**请求参数:**
```json
{
  "roomId": 102,
  "reason": "宿舍调整"
}
```

---

## 房间管理

### GET /api/rooms
获取房间列表

**请求参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| buildingId | int | 否 | 楼栋ID |
| floor | int | 否 | 楼层 |
| status | string | 否 | 状态: available/occupied/full |

**响应:**
```json
{
  "list": [
    {
      "id": 101,
      "buildingId": 1,
      "buildingName": "A栋",
      "roomNumber": "101",
      "floor": 1,
      "capacity": 4,
      "occupied": 3,
      "status": "available",
      "students": [
        { "id": 1, "name": "张三" }
      ]
    }
  ],
  "total": 200
}
```

---

### GET /api/rooms/{id}
获取房间详情

---

### POST /api/rooms
创建房间

**请求参数:**
```json
{
  "buildingId": 1,
  "roomNumber": "101",
  "floor": 1,
  "capacity": 4,
  "type": "standard"  // standard/suite/single
}
```

---

## 楼栋管理

### GET /api/buildings
获取楼栋列表

**响应:**
```json
{
  "list": [
    {
      "id": 1,
      "name": "A栋",
      "type": "male",  // male/female/mixed
      "floors": 6,
      "roomsCount": 120,
      "occupiedCount": 350,
      "capacity": 480,
      "managerId": 10,
      "managerName": "李宿管"
    }
  ]
}
```

---

### GET /api/buildings/{id}
获取楼栋详情

---

### POST /api/buildings
创建楼栋

**请求参数:**
```json
{
  "name": "A栋",
  "type": "male",
  "floors": 6,
  "roomsPerFloor": 20,
  "managerId": 10
}
```

---

### PUT /api/buildings/{id}
更新楼栋信息

---

### DELETE /api/buildings/{id}
删除楼栋

---

## 报修管理

### GET /api/repairs
获取报修列表

**请求参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 状态筛选 |
| type | string | 否 | 类型筛选 |
| studentId | int | 否 | 学生ID |
| page | int | 否 | 页码 |

**响应:**
```json
{
  "list": [
    {
      "id": 1,
      "title": "水龙头漏水",
      "type": "plumbing",
      "description": "卫生间水龙头滴水",
      "images": ["url1", "url2"],
      "status": "Pending",
      "studentId": 1,
      "studentName": "张三",
      "roomNumber": "A-101",
      "createdAt": "2024-03-16T10:00:00Z",
      "updatedAt": "2024-03-16T10:00:00Z"
    }
  ],
  "total": 50
}
```

---

### GET /api/repairs/{id}
获取报修详情

---

### POST /api/repairs
提交报修

**请求参数:**
```json
{
  "title": "水龙头漏水",
  "type": "plumbing",
  "description": "详细描述",
  "images": ["url1", "url2"],
  "urgency": "normal"  // low/normal/high/urgent
}
```

---

### PUT /api/repairs/{id}/assign
分配维修人员

**请求参数:**
```json
{
  "staffId": 5
}
```

---

### PUT /api/repairs/{id}/status
更新报修状态

**请求参数:**
```json
{
  "status": "Completed",
  "comment": "已修复",
  "images": ["url3"]
}
```

---

## 公告管理

### GET /api/notices
获取公告列表

**请求参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 否 | 类型 |
| page | int | 否 | 页码 |

**响应:**
```json
{
  "list": [
    {
      "id": 1,
      "title": "关于宿舍安全检查的通知",
      "content": "详细内容...",
      "type": "system",
      "author": "管理员",
      "isTop": true,
      "viewCount": 150,
      "createdAt": "2024-03-15T08:00:00Z"
    }
  ],
  "total": 20
}
```

---

### GET /api/notices/{id}
获取公告详情

---

### POST /api/notices
发布公告

**请求参数:**
```json
{
  "title": "公告标题",
  "content": "公告内容",
  "type": "system",
  "isTop": false,
  "targetRoles": ["student", "dorm_manager"]
}
```

---

## 查寝管理

### GET /api/inspections
获取查寝记录

**请求参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| roomId | int | 否 | 房间ID |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

**响应:**
```json
{
  "list": [
    {
      "id": 1,
      "roomId": 101,
      "roomNumber": "A-101",
      "score": 95,
      "items": {
        "cleanliness": 20,
        "order": 20,
        "safety": 20,
        "decoration": 15,
        "atmosphere": 20
      },
      "issues": ["地面有水渍"],
      "inspector": "李宿管",
      "inspectionDate": "2024-03-16",
      "createdAt": "2024-03-16T14:00:00Z"
    }
  ]
}
```

---

### POST /api/inspections
录入查寝评分

**请求参数:**
```json
{
  "roomId": 101,
  "score": 95,
  "items": {
    "cleanliness": 20,
    "order": 20,
    "safety": 20,
    "decoration": 15,
    "atmosphere": 20
  },
  "issues": ["地面有水渍"],
  "photos": ["url1"],
  "inspectionDate": "2024-03-16"
}
```

---

### GET /api/inspections/rankings
查寝排行榜

**请求参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| period | string | 否 | 周期: week/month/semester |

**响应:**
```json
{
  "rankings": [
    {
      "rank": 1,
      "roomId": 101,
      "roomNumber": "A-101",
      "averageScore": 98.5,
      "inspectionCount": 4
    }
  ]
}
```

---

## 换寝管理

### GET /api/room-swaps
获取换寝申请列表

**请求参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 状态筛选 |
| studentId | int | 否 | 学生ID |

**响应:**
```json
{
  "list": [
    {
      "id": 1,
      "studentId": 1,
      "studentName": "张三",
      "currentRoomId": 101,
      "currentRoomNumber": "A-101",
      "targetRoomId": 102,
      "targetRoomNumber": "A-102",
      "reason": "想和同学住一起",
      "status": "Pending",
      "approver": null,
      "approvalComment": null,
      "createdAt": "2024-03-15T10:00:00Z"
    }
  ]
}
```

---

### POST /api/room-swaps
提交换寝申请

**请求参数:**
```json
{
  "targetRoomId": 102,
  "reason": "想和同学住一起",
  "expectedDate": "2024-03-20"
}
```

---

### PUT /api/room-swaps/{id}/approve
审批换寝申请

**请求参数:**
```json
{
  "approved": true,
  "comment": "同意换寝"
}
```

---

## 晚归告警

### GET /api/late-returns
获取晚归记录

**请求参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 状态 |
| date | string | 否 | 日期 |
| studentId | int | 否 | 学生ID |

**响应:**
```json
{
  "list": [
    {
      "id": 1,
      "studentId": 1,
      "studentName": "张三",
      "roomNumber": "A-101",
      "alertDate": "2024-03-16",
      "lastEntry": "23:45",
      "status": "Pending",
      "handler": null,
      "comment": null,
      "createdAt": "2024-03-17T00:00:00Z"
    }
  ]
}
```

---

### PUT /api/late-returns/{id}/handle
处理晚归记录

**请求参数:**
```json
{
  "status": "Handled",
  "comment": "已联系学生确认"
}
```

---

### GET /api/late-returns/statistics
晚归统计

**响应:**
```json
{
  "total": 25,
  "pending": 3,
  "handled": 20,
  "ignored": 2,
  "trend": [5, 3, 8, 4, 5]  // 最近5天
}
```

---

## 门禁记录

### GET /api/access-logs
获取门禁记录

**请求参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| studentId | int | 否 | 学生ID |
| direction | string | 否 | 方向: In/Out |
| status | string | 否 | 状态: Normal/Late/Absent |
| date | string | 否 | 日期 |

**响应:**
```json
{
  "list": [
    {
      "id": 1,
      "studentId": 1,
      "studentName": "张三",
      "roomNumber": "A-101",
      "timestamp": "2024-03-16T22:30:00Z",
      "direction": "In",
      "status": "Late",
      "deviceId": "GATE_01"
    }
  ],
  "total": 1000
}
```

---

### GET /api/access-logs/statistics
门禁统计

**响应:**
```json
{
  "totalEntries": 5000,
  "totalExits": 4800,
  "lateReturns": 25,
  "absentCount": 5,
  "peakHours": [
    { "hour": 7, "count": 300 },
    { "hour": 12, "count": 450 },
    { "hour": 18, "count": 500 },
    { "hour": 22, "count": 200 }
  ]
}
```

---

## 消息中心

### GET /api/messages
获取消息列表

**请求参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 否 | 类型 |
| isRead | bool | 否 | 是否已读 |
| page | int | 否 | 页码 |

**响应:**
```json
{
  "list": [
    {
      "id": 1,
      "type": "repair",
      "title": "报修状态更新",
      "content": "您的报修已处理完成",
      "isRead": false,
      "link": "/pages/repairs/detail?id=1",
      "createdAt": "2024-03-16T14:00:00Z"
    }
  ],
  "total": 50
}
```

---

### GET /api/messages/unread-count
获取未读消息数

**响应:**
```json
{
  "count": 5
}
```

---

### POST /api/messages/{id}/read
标记消息已读

---

### POST /api/messages/read-all
标记全部已读

---

## 数据统计

### GET /api/statistics/occupancy
入住统计

**响应:**
```json
{
  "totalRooms": 1200,
  "occupied": 1080,
  "available": 120,
  "occupancyRate": 90,
  "byBuilding": [
    { "building": "A栋", "occupancyRate": 95 },
    { "building": "B栋", "occupancyRate": 88 }
  ]
}
```

---

### GET /api/statistics/repairs
报修统计

**响应:**
```json
{
  "total": 86,
  "pending": 2,
  "processing": 6,
  "completed": 78,
  "byType": {
    "plumbing": 25,
    "electrical": 18,
    "furniture": 15
  },
  "avgProcessTime": 24.5
}
```

---

### GET /api/reports/generate
生成报表

**请求参数:**
```json
{
  "type": "occupancy",  // occupancy/repair/inspection/late/access/roomswap
  "timeRange": "month", // today/week/month/quarter/year/custom
  "startDate": "2024-03-01",
  "endDate": "2024-03-31",
  "format": "excel"     // excel/pdf/csv
}
```

---

## 通用响应格式

### 成功响应
```json
{
  "code": 200,
  "message": "success",
  "data": { }
}
```

### 错误响应
```json
{
  "code": 400,
  "message": "参数错误",
  "error": {
    "field": "username",
    "message": "用户名不能为空"
  }
}
```

### 错误码说明
| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权/Token过期 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

---

## 认证方式

所有 API 请求（除登录外）需要在请求头中携带 Token:

```
Authorization: Bearer {access_token}
```

---

## 分页参数

列表接口支持统一分页参数:

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| pageSize | int | 20 | 每页数量，最大100 |

分页响应格式:
```json
{
  "list": [],
  "total": 100,
  "page": 1,
  "pageSize": 20,
  "totalPages": 5
}
```
