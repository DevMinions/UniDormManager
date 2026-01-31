# UniDormManager 小程序 - 角色权限系统文档

> **版本**: v2.0
> **更新日期**: 2026-01-31
> **状态**: ✅ 已实现

---

## 📋 角色定义

### 后端角色代码

| 角色代码 | 角色名称 | 小程序角色 | 权限等级 | 说明 |
|----------|----------|-----------|---------|------|
| `student` | 学生 | `student` | 1 | 普通学生用户 |
| `dorm_manager` | 宿管员 | `student` | 2 | 宿舍楼栋管理员 |
| `maintenance_staff` | 维修工 | `maintenance` | 3 | 后勤维修员工 |
| `building_manager` | 楼栋管理员 | `admin` | 4 | 楼栋区域管理员 |
| `logistics_admin` | 后勤管理员 | `admin` | 5 | 后勤部门管理员 |
| `system_admin` | 系统管理员 | `admin` | 6 | 系统最高管理员 |

---

## 🔐 权限级别

| 级别 | 角色代码 | 权限范围 |
|------|----------|---------|
| **1级** | `student` | 基础查看 + 自主操作 |
| **2级** | `dorm_manager` | 所有学生信息 + 查寝 |
| **3级** | `maintenance_staff` | 所有报修管理 + 状态更新 |
| **4级** | `building_manager` | 所有报修管理 + 房间管理 + 删除 |
| **5级** | `logistics_admin` | 所有报修管理 + 房间管理 + 公告管理 |
| **6级** | `system_admin` | 完整管理权限 |

---

## 📊 功能权限矩阵

### Dashboard (首页)

| 功能 | 学生 | 宿管员 | 维修工 | 楼栋管理员 | 后勤管理员 | 系统管理员 |
|------|------|--------|--------|----------|-----------|-----------|
| 查看基础统计 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 查看学生总数 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 查看楼栋总数 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 查看待修统计 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 房间管理

| 功能 | 学生 | 宿管员 | 维修工 | 楼栋管理员 | 后勤管理员 | 系统管理员 |
|------|------|--------|--------|----------|-----------|-----------|
| 查看房间列表 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 搜索房间 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 查看房间详情 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 管理房间分配 | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |

### 报修管理

| 功能 | 学生 | 宿管员 | 维修工 | 楼栋管理员 | 后勤管理员 | 系统管理员 |
|------|------|--------|--------|----------|-----------|-----------|
| 查看所有报修 | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 查看自己的报修 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 提交报修申请 | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| 更新报修状态 | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| 添加维修备注 | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| 删除报修记录 | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |

### 报修详情

| 功能 | 学生 | 宿管员 | 维修工 | 楼栋管理员 | 后勤管理员 | 系统管理员 |
|------|------|--------|--------|----------|-----------|-----------|
| 查看详情 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 更新状态 | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| 添加备注 | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| 删除报修 | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |

### 公告通知

| 功能 | 学生 | 宿管员 | 维修工 | 楼栋管理员 | 后勤管理员 | 系统管理员 |
|------|------|--------|--------|----------|-----------|-----------|
| 查看公告列表 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 查看公告详情 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 发布公告 | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| 编辑公告 | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| 删除公告 | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

### 个人中心

| 功能 | 学生 | 宿管员 | 维修工 | 楼栋管理员 | 后勤管理员 | 系统管理员 |
|------|------|--------|--------|----------|-----------|-----------|
| 查看个人信息 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 查看角色标签 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 学生管理菜单 | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| 房间管理菜单 | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| 公告管理菜单 | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| 报修管理菜单 | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |

---

## 🎨 角色标签显示

### 个人中心 - 角色标签

| 角色 | 标签文本 | 标签样式 |
|------|---------|---------|
| **学生** | 👥 学生 | 灰色 `student` |
| **宿管员** | 👥 宿管员 | 灰色 `dorm_manager` |
| **维修工** | 🔧 维修工 | 灰色 `maintenance` |
| **楼栋管理员** | 👤 楼栋管理员 | 蓝色 `admin` |
| **后勤管理员** | 👤 后勤管理员 | 蓝色 `admin` |
| **系统管理员** | 👤 系统管理员 | 蓝色 `admin` |

---

## 📝 代码实现

### app.js - 权限系统

```javascript
// 全局数据
globalData: {
  userRole: null,    // 'student', 'maintenance', 'admin'
  userLevel: 1,      // 1-6
  userRoleName: null // '学生', '宿管员', '维修工', '楼栋管理员', '后勤管理员', '系统管理员'
}

// 角色映射
mapBackendRole(backendRoles) {
  const primaryRole = backendRoles[0].code
  const roleMap = {
    'student': { role: 'student', level: 1, name: '学生' },
    'dorm_manager': { role: 'student', level: 2, name: '宿管员' },
    'maintenance_staff': { role: 'maintenance', level: 3, name: '维修工' },
    'building_manager': { role: 'admin', level: 4, name: '楼栋管理员' },
    'logistics_admin': { role: 'admin', level: 5, name: '后勤管理员' },
    'system_admin': { role: 'admin', level: 6, name: '系统管理员' }
  }
  return roleMap[primaryRole]
}

// 权限检查
canSubmitRepair() {
  return this.globalData.userRole === 'student' || this.globalData.userRole === 'admin'
}

canUpdateRepairStatus() {
  return this.globalData.userLevel >= 3  // 维修工及以上
}

canDeleteRepair() {
  return this.globalData.userLevel >= 4  // 楼栋管理员及以上
}

canManageNotices() {
  return this.globalData.userLevel >= 5  // 后勤管理员及以上
}

canManageStudents() {
  return this.globalData.userLevel >= 2  // 宿管员及以上
}

canManageRooms() {
  return this.globalData.userLevel >= 4  // 楼栋管理员及以上
}
```

### 页面权限控制示例

#### 报修列表页面

```javascript
data: {
  userRole: 'student',  // 当前用户角色
  canUpdateStatus: false,  // 能否更新状态
  canDeleteRepair: false,  // 能否删除报修
  canSubmitRepair: true,   // 能否提交报修
}

// 加载权限
loadPermissions() {
  const userLevel = app.globalData.userLevel
  
  this.setData({
    canUpdateStatus: userLevel >= 3,  // 维修工及以上
    canDeleteRepair: userLevel >= 4,  // 楼栋管理员及以上
    canSubmitRepair: app.globalData.userRole === 'student' || app.globalData.userRole === 'admin'
  })
}
```

#### 个人中心页面

```javascript
data: {
  userRole: 'student',
  showStudentManagement: false,  // 学生管理菜单
  showRoomManagement: false,    // 房间管理菜单
  showNoticeManagement: false,  // 公告管理菜单
  showRepairManagement: false, // 报修管理菜单
}

// 加载权限
loadPermissions() {
  const userLevel = app.globalData.userLevel
  
  this.setData({
    showStudentManagement: userLevel >= 2,  // 宿管员及以上
    showRoomManagement: userLevel >= 4,     // 楼栋管理员及以上
    showNoticeManagement: userLevel >= 5,   // 后勤管理员及以上
    showRepairManagement: userLevel >= 3,   // 维修工及以上
  })
}
```

---

## 🎯 角色功能差异化

### 学生角色 (Level 1)

**可以做的：**
- ✅ 查看Dashboard统计
- ✅ 查看房间列表
- ✅ 搜索房间
- ✅ 查看房间详情
- ✅ 查看所有公告
- ✅ 查看公告详情
- ✅ 查看自己的报修记录
- ✅ 提交报修申请
- ✅ 查看报修详情
- ✅ 查看个人中心

**不能做的：**
- ❌ 查看所有报修
- ❌ 查看所有学生信息
- ❌ 更新报修状态
- ❌ 删除报修
- ❌ 发布/编辑/删除公告
- ❌ 管理房间分配

### 宿管员角色 (Level 2)

**额外可以做的：**
- ✅ 查看所有学生信息
- ✅ 查看学生详情
- ✅ 管理学生分配
- ✅ 查寝功能

### 维修工角色 (Level 3)

**额外可以做的：**
- ✅ 查看所有报修
- ✅ 更新报修状态
- ✅ 添加维修备注
- ✅ 分配报修
- ✅ 处理报修

### 楼栋管理员角色 (Level 4)

**额外可以做的：**
- ✅ 删除报修
- ✅ 管理房间分配
- ✅ 调整房间容量
- ✅ 处理报修

### 后勤管理员角色 (Level 5)

**额外可以做的：**
- ✅ 发布公告
- ✅ 编辑公告
- ✅ 删除公告
- ✅ 管理所有报修
- ✅ 管理所有房间

### 系统管理员角色 (Level 6)

**额外可以做的：**
- ✅ 用户管理
- ✅ 角色管理
- ✅ 权限管理
- ✅ 系统设置
- ✅ 完整管理权限

---

## 🔐 安全设计

### 1. 最小权限原则

每个角色只拥有完成任务所需的最小权限集：
- 学生：只能查看和操作自己的数据
- 维修工：只能管理报修，不能管理学生
- 楼栋管理员：可以管理报修和房间，不能发布公告

### 2. 权限继承

高权限角色自动包含低权限角色的所有权限：
- 后勤管理员 (Level 5) 包含 维修工 (Level 3) + 楼栋管理员 (Level 4) 的权限
- 系统管理员 (Level 6) 包含所有角色的权限

### 3. 前端权限验证

所有关键操作都在前端进行了权限验证：
```javascript
// 示例：删除报修
onDeleteRepair(e) {
  if (!this.data.canDeleteRepair) {
    wx.showToast({ title: '权限不足', icon: 'none' })
    return
  }
  // 执行删除操作
}
```

### 4. 后端权限验证

后端也进行了相应的权限验证，确保即使前端绕过也无法进行未授权操作。

---

## 📱 用户体验优化

### 1. 角色提示

登录时显示角色名称：
```
登录成功 - 维修工
```

### 2. 功能灰显

没有权限的功能在UI上应该灰显或隐藏：
```xml
<!-- 报修详情 - 更新状态按钮 -->
<button 
  class="update-btn {{canUpdateStatus ? '' : 'disabled'}}" 
  bindtap="updateStatus" 
  disabled="{{!canUpdateStatus}}">
  更新状态
</button>
```

### 3. 权限不足提示

当用户尝试进行无权限操作时，显示明确的提示：
```javascript
wx.showToast({
  title: '权限不足，您没有此操作权限',
  icon: 'none',
  duration: 2000
})
```

### 4. 角色专属功能提示

在个人中心页面显示角色专属功能：
```
┌─────────────────────┐
│ 🔧 维修工角色     │
│                    │
│ • 您可以处理所有报修  │
│ • 您可以更新报修状态  │
│ • 您可以添加维修备注  │
│                    │
│ • 但不能管理学生信息  │
│ • 但不能管理房间分配  │
└─────────────────────┘
```

---

## 🚀 后续优化建议

### 1. 角色管理页面

为系统管理员添加角色管理页面：
- 查看所有角色
- 编辑角色权限
- 查看角色成员

### 2. 操作日志

记录关键操作的日志：
- 用户：谁操作的
- 时间：什么时候操作的
- 操作：做了什么
- 结果：成功或失败

### 3. 权限缓存

缓存用户的权限信息，减少API调用：
```javascript
// 登录时缓存权限
wx.setStorageSync('userPermissions', permissions)

// 使用时直接读取
const permissions = wx.getStorageSync('userPermissions')
```

### 4. 动态菜单

根据用户角色动态生成菜单：
```javascript
// 学生角色的菜单
const studentMenus = [
  { icon: 'repair', title: '我的报修', url: '/pages/repairs/list/index' },
  { icon: 'notice', title: '公告通知', url: '/pages/notices/list/index' },
  { icon: 'profile', title: '个人中心', url: '/pages/profile/index' }
]

// 管理员角色的菜单
const adminMenus = [
  ...studentMenus,
  { icon: 'student', title: '学生管理', url: '/pages/students/list' },
  { icon: 'room', title: '房间管理', url: '/pages/rooms/list' },
  { icon: 'notice', title: '公告管理', url: '/pages/notices/manage' }
]
```

---

## 📊 权限总结

| 角色 | 查看权限 | 操作权限 | 管理权限 |
|------|---------|---------|---------|
| **学生** | ✅ | ✅ (仅自己） | ❌ |
| **宿管员** | ✅ | ✅ (查寝） | ✅ (学生） |
| **维修工** | ✅ | ✅ (报修） | ✅ (报修） |
| **楼栋管理员** | ✅ | ✅ | ✅ (报修+房间） |
| **后勤管理员** | ✅ | ✅ | ✅ (报修+房间+公告） |
| **系统管理员** | ✅ | ✅ | ✅ (全部） |

---

**最后更新**: 2026-01-31
**文档版本**: v2.0
