# API 文档

## 基础信息

- **Base URL**: `http://localhost:8080`
- **Content-Type**: `application/json`
- **字符编码**: UTF-8

## 通用响应格式

### 成功响应

```json
{
  "id": "uuid",
  "field": "value"
}
```

### 错误响应

```json
{
  "error": "error_code",
  "message": "错误描述信息"
}
```

## API 端点

### 1. 学生管理

#### 获取所有学生

```http
GET /api/students
```

**响应示例**:
```json
[
  {
    "id": "1",
    "name": "张三",
    "studentId": "2023001",
    "major": "计算机科学",
    "roomNumber": "101",
    "status": "Active"
  }
]
```

#### 获取指定学生

```http
GET /api/students/{id}
```

#### 创建学生

```http
POST /api/students
Content-Type: application/json

{
  "name": "张三",
  "studentId": "2023001",
  "major": "计算机科学",
  "status": "Active"
}
```

**字段说明**:
- `name` (必填): 学生姓名
- `studentId` (必填): 学号
- `major` (可选): 专业
- `status` (可选): 状态，可选值: `Active`, `Graduated`, `On Leave`，默认为 `Active`

#### 更新学生

```http
PUT /api/students/{id}
Content-Type: application/json

{
  "name": "李四",
  "roomNumber": "102",
  "status": "Active"
}
```

#### 删除学生

```http
DELETE /api/students/{id}
```

---

### 2. 楼栋管理

#### 获取所有楼栋

```http
GET /api/buildings
```

#### 获取指定楼栋

```http
GET /api/buildings/{id}
```

#### 创建楼栋

```http
POST /api/buildings
Content-Type: application/json

{
  "name": "A栋",
  "type": "Male",
  "floors": 6,
  "manager": "王老师",
  "description": "理工科男生宿舍"
}
```

**字段说明**:
- `name` (必填): 楼栋名称
- `type` (必填): 类型，可选值: `Male`, `Female`, `Co-ed`
- `floors` (必填): 层数，必须大于 0
- `manager` (必填): 管理员姓名
- `description` (可选): 描述信息

#### 更新楼栋

```http
PUT /api/buildings/{id}
Content-Type: application/json

{
  "manager": "李老师",
  "description": "更新后的描述"
}
```

#### 删除楼栋

```http
DELETE /api/buildings/{id}
```

---

### 3. 房间管理

#### 获取所有房间

```http
GET /api/rooms
```

#### 获取指定房间

```http
GET /api/rooms/{id}
```

#### 创建房间

```http
POST /api/rooms
Content-Type: application/json

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
- `number` (必填): 房间号
- `building` (必填): 所属楼栋
- `capacity` (必填): 容量，必须大于 0
- `occupied` (可选): 已入住人数，默认为 0，不能超过容量
- `type` (必填): 类型，可选值: `Male`, `Female`, `Co-ed`
- `status` (必填): 状态，可选值: `Available`, `Full`, `Maintenance`

#### 更新房间

```http
PUT /api/rooms/{id}
Content-Type: application/json

{
  "occupied": 2,
  "status": "Available"
}
```

#### 删除房间

```http
DELETE /api/rooms/{id}
```

---

### 4. 报修管理

#### 获取所有报修请求

```http
GET /api/repairs
```

#### 获取指定报修请求

```http
GET /api/repairs/{id}
```

#### 创建报修请求

```http
POST /api/repairs
Content-Type: application/json

{
  "title": "水龙头漏水",
  "description": "浴室洗脸盆水龙头持续漏水",
  "roomNumber": "101",
  "priority": "Medium"
}
```

**字段说明**:
- `title` (必填): 报修主题
- `description` (可选): 详细描述
- `roomNumber` (必填): 房间号
- `priority` (可选): 优先级，可选值: `Low`, `Medium`, `High`，默认为 `Medium`

**注意**: 创建时状态自动设置为 `Pending`，日期自动设置为当前日期。

#### 更新报修请求

```http
PUT /api/repairs/{id}
Content-Type: application/json

{
  "status": "In Progress",
  "priority": "High"
}
```

**状态值**: `Pending`, `In Progress`, `Completed`

#### 删除报修请求

```http
DELETE /api/repairs/{id}
```

---

### 5. 公告通知

#### 获取所有公告

```http
GET /api/notices
```

#### 获取指定公告

```http
GET /api/notices/{id}
```

#### 创建公告

```http
POST /api/notices
Content-Type: application/json

{
  "title": "关于寒假期间宿舍封闭管理的通知",
  "content": "各位同学：寒假将至，为确保宿舍安全...",
  "author": "后勤管理处"
}
```

**字段说明**:
- `title` (必填): 公告标题
- `content` (可选): 公告内容
- `author` (必填): 发布者

**注意**: 日期自动设置为当前日期。

#### 更新公告

```http
PUT /api/notices/{id}
Content-Type: application/json

{
  "title": "更新后的标题",
  "content": "更新后的内容"
}
```

#### 删除公告

```http
DELETE /api/notices/{id}
```

---

### 6. 仪表板

#### 获取统计数据

```http
GET /api/dashboard/stats
```

**响应示例**:
```json
{
  "totalStudents": 349,
  "occupancyRate": 87.5,
  "pendingRepairs": 12,
  "completedRepairs": 45,
  "occupancyData": [
    {
      "name": "A栋",
      "occupied": 120,
      "capacity": 150
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

---

### 7. 健康检查

#### 检查服务状态

```http
GET /health
```

**响应示例**:
```json
{
  "status": "ok"
}
```

---

## HTTP 状态码

- `200 OK` - 请求成功
- `201 Created` - 资源创建成功
- `400 Bad Request` - 请求参数错误
- `404 Not Found` - 资源未找到
- `405 Method Not Allowed` - HTTP 方法不允许
- `500 Internal Server Error` - 服务器内部错误

## 使用示例

### cURL 示例

```bash
# 获取所有学生
curl http://localhost:8080/api/students

# 创建学生
curl -X POST http://localhost:8080/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "name": "张三",
    "studentId": "2023001",
    "major": "计算机科学",
    "status": "Active"
  }'

# 更新学生
curl -X PUT http://localhost:8080/api/students/1 \
  -H "Content-Type: application/json" \
  -d '{
    "roomNumber": "102"
  }'

# 删除学生
curl -X DELETE http://localhost:8080/api/students/1
```

### JavaScript (Fetch) 示例

```javascript
// 获取所有学生
fetch('http://localhost:8080/api/students')
  .then(res => res.json())
  .then(data => console.log(data));

// 创建学生
fetch('http://localhost:8080/api/students', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: '张三',
    studentId: '2023001',
    major: '计算机科学',
    status: 'Active'
  })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

