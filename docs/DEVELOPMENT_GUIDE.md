# UniDormManager 开发规范

## 📋 目录

- [代码风格](#代码风格)
- [命名规范](#命名规范)
- [文件组织](#文件组织)
- [Vue 组件规范](#vue-组件规范)
- [API 规范](#api-规范)
- [Git 提交规范](#git-提交规范)
- [注释规范](#注释规范)

---

## 代码风格

### JavaScript/Vue

使用 ESLint + Prettier 统一代码风格

```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:vue/vue3-recommended"
  ],
  "rules": {
    "indent": ["error", 2],
    "quotes": ["error", "single"],
    "semi": ["error", "never"],
    "max-len": ["warn", { "code": 100 }],
    "no-console": ["warn", { "allow": ["error"] }]
  }
}
```

### Go

使用 gofmt + goimports

```bash
# 格式化代码
gofmt -w .

# 自动导入
goimports -w .
```

---

## 命名规范

### 变量命名

```javascript
// ✅ 正确
const userList = []
const isLoading = false
const MAX_RETRY_COUNT = 3

// ❌ 错误
const user_list = []
const loading = false  // 布尔值应有 is/has 前缀
const maxRetry = 3     // 常量应全大写
```

### 函数命名

```javascript
// ✅ 正确
function getUserList() {}
function handleSubmit() {}
function formatDate() {}

// ❌ 错误
function get_user_list() {}
function submit() {}     // 不够明确
function date() {}       // 应是动词开头
```

### 组件命名

```vue
<!-- ✅ 正确 -->
<AppNavbar />
<UserCard />
<RepairList />

<!-- ❌ 错误 -->
<app-navbar />        <!-- 应使用大驼峰 -->
<User />              <!-- 过于笼统 -->
<List />              <!-- 应更具描述性 -->
```

### 文件命名

```
✅ 正确:
components/
  AppNavbar.vue
  UserCard.vue
  RepairList.vue

utils/
  request.js
  formatDate.js
  validators.js

pages/
  repairs/
    list.vue
    detail.vue

❌ 错误:
components/
  app-navbar.vue       # 使用小驼峰
  user-card.vue        # 使用连字符
  list.vue             # 过于笼统
```

---

## 文件组织

### 目录结构

```
src/
├── api/                    # API 接口
│   ├── index.js           # 统一导出
│   ├── user.js
│   ├── repair.js
│   └── ...
├── components/             # 公共组件
│   ├── AppNavbar/         # 导航栏组件
│   │   ├── AppNavbar.vue
│   │   └── index.js
│   └── ...
├── composables/            # 组合式函数
│   ├── usePerformance.js
│   └── ...
├── config/                 # 配置文件
│   ├── roles.js
│   └── constants.js
├── pages/                  # 页面
│   ├── index/
│   ├── repairs/
│   ├── room-swaps/
│   └── ...
├── store/                  # 状态管理
│   ├── index.js
│   └── modules/
│       ├── user.js
│       └── app.js
├── styles/                 # 样式
│   ├── variables.scss
│   ├── mixins.scss
│   └── global.scss
└── utils/                  # 工具函数
    ├── index.js
    ├── helpers.js
    ├── security.js
    └── ...
```

---

## Vue 组件规范

### 组件结构

```vue
<script setup>
// 1. 导入（按类型分组，空行分隔）
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'

import { useUserStore } from '@/store/modules/user'
import { repairApi } from '@/api/repair'
import { handleApiError } from '@/utils'

import AppNavbar from '@/components/AppNavbar/AppNavbar.vue'

// 2. 组合式函数调用
const userStore = useUserStore()

// 3. 响应式数据（按类型分组）
// 加载状态
const loading = ref(false)
const submitting = ref(false)

// 列表数据
const list = ref([])
const page = ref(1)

// 表单数据
const form = ref({
  title: '',
  description: ''
})

// 4. 计算属性
const isValid = computed(() => {
  return form.value.title && form.value.description
})

// 5. 生命周期
onMounted(() => {
  loadData()
})

// 6. 方法
async function loadData() {
  // ...
}

function handleSubmit() {
  // ...
}

// 7. 暴露（如果需要）
defineExpose({
  reload: loadData
})
</script>

<template>
  <view class="page-container">
    <!-- 导航栏 -->
    <AppNavbar title="页面标题" />
    
    <!-- 内容区 -->
    <view class="content">
      <!-- 加载状态 -->
      <view v-if="loading" class="loading-state">加载中...</view>
      
      <!-- 空状态 -->
      <view v-else-if="list.length === 0" class="empty-state">暂无数据</view>
      
      <!-- 列表 -->
      <view v-else class="list">
        <view
          v-for="item in list"
          :key="item.id"
          class="item"
        >
          {{ item.name }}
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: $bg-color;
}

.content {
  padding: 24rpx;
}

.loading-state {
  text-align: center;
  padding: 60rpx;
  color: $text-secondary;
}

.empty-state {
  text-align: center;
  padding: 120rpx 0;
  color: $text-secondary;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.item {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
}
</style>
```

### Props 定义

```vue
<script setup>
const props = defineProps({
  // 基础类型
  title: {
    type: String,
    required: true
  },
  
  // 带默认值
  visible: {
    type: Boolean,
    default: false
  },
  
  // 对象类型
  user: {
    type: Object,
    default: () => ({
      name: '',
      avatar: ''
    })
  },
  
  // 数组类型
  list: {
    type: Array,
    default: () => []
  },
  
  // 自定义验证
  status: {
    type: String,
    default: 'pending',
    validator: (value) => {
      return ['pending', 'approved', 'rejected'].includes(value)
    }
  }
})
</script>
```

### Emits 定义

```vue
<script setup>
const emit = defineEmits({
  // 无参数
  close: null,
  
  // 带参数
  submit: (data) => {
    // 验证参数
    return data && typeof data.id === 'number'
  },
  
  // 更新事件（v-model）
  'update:modelValue': null
})

// 触发事件
function handleClick() {
  emit('submit', { id: 1, name: 'test' })
}
</script>
```

---

## API 规范

### 请求封装

```javascript
// api/user.js
import { request } from '@/utils/request'

export const userApi = {
  // 获取列表
  getList(params) {
    return request.get('/api/users', params)
  },
  
  // 获取详情
  getById(id) {
    return request.get(`/api/users/${id}`)
  },
  
  // 创建
  create(data) {
    return request.post('/api/users', data)
  },
  
  // 更新
  update(id, data) {
    return request.put(`/api/users/${id}`, data)
  },
  
  // 删除
  delete(id) {
    return request.delete(`/api/users/${id}`)
  }
}
```

### 错误处理

```javascript
// 统一错误处理
import { handleApiError } from '@/utils'

async function loadData() {
  try {
    const data = await userApi.getList()
    list.value = data
  } catch (error) {
    handleApiError(error, '获取用户列表失败')
  }
}
```

---

## Git 提交规范

### 提交消息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

| 类型 | 说明 |
|------|------|
| feat | 新功能 |
| fix | Bug 修复 |
| docs | 文档更新 |
| style | 代码格式（不影响功能） |
| refactor | 重构 |
| perf | 性能优化 |
| test | 测试相关 |
| chore | 构建/工具相关 |

### 示例

```bash
# 新功能
feat(repair): 添加报修图片上传功能

# Bug 修复
fix(auth): 修复 Token 过期未跳转问题

# 文档
docs(api): 更新用户接口文档

# 重构
refactor(utils): 重构日期格式化函数

# 性能优化
perf(list): 优化长列表渲染性能
```

### 分支管理

```
main          # 生产分支
develop       # 开发分支
feature/xxx   # 功能分支
fix/xxx       # 修复分支
release/xxx   # 发布分支
```

---

## 注释规范

### 文件头注释

```javascript
/**
 * @file 文件描述
 * @author 作者
 * @description 详细描述
 * @example 使用示例
 */
```

### 函数注释

```javascript
/**
 * 格式化日期
 * @param {Date|string} date - 日期对象或字符串
 * @param {string} format - 格式化模板，默认 'YYYY-MM-DD'
 * @returns {string} 格式化后的日期字符串
 * @example
 * formatDate(new Date(), 'YYYY-MM-DD') // '2024-03-16'
 */
function formatDate(date, format = 'YYYY-MM-DD') {
  // ...
}
```

### 行内注释

```javascript
// 简单说明
const MAX_COUNT = 100 // 最大重试次数

// 复杂逻辑需要解释
// 使用二分查找优化查询性能
// 时间复杂度从 O(n) 降为 O(log n)
function findUser(users, id) {
  // ...
}
```

---

## 最佳实践

### 性能优化

1. **使用 v-show 代替 v-if**（频繁切换时）
2. **使用 computed 缓存计算结果**
3. **列表使用 key**
4. **懒加载图片和组件**
5. **防抖节流处理频繁事件**

### 安全规范

1. **所有用户输入必须校验**
2. **敏感数据加密存储**
3. **防止 XSS 攻击**
4. **接口防重放保护**
5. **最小权限原则**

### 代码质量

1. **单一职责原则**
2. **函数不超过 50 行**
3. **避免嵌套超过 3 层**
4. **及时清理 console.log**
5. **保持测试覆盖率**

---

## 工具配置

### VS Code 推荐插件

- ESLint
- Prettier
- Vue - Official
- GitLens
- SCSS Formatter

### 快捷键

```json
// settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.autoFixOnSave": true,
  "[vue]": {
    "editor.defaultFormatter": "Vue.volar"
  }
}
```
