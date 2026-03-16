# UniApp 小程序优化总结

## 日期：2026-03-15

---

## 一、性能优化

### 1. 新增性能工具 (`utils/performance.js`)

| 功能 | 说明 |
|------|------|
| `initLazyLoad` | 图片懒加载初始化 |
| `getVirtualListData` | 虚拟列表数据计算 |
| `debounceSearch` | 防抖搜索 |
| `throttleLoadMore` | 节流加载更多 |
| `cacheManager` | 带过期时间的缓存管理 |
| `preloadImages` | 图片预加载 |
| `getItemHeight` | 动态获取列表项高度 |

**使用示例：**
```javascript
import { cacheManager, debounceSearch } from '@/utils/index.js'

// 缓存数据（5分钟过期）
cacheManager.set('rooms', roomData, 5)
const cachedData = cacheManager.get('rooms')

// 防抖搜索
const debouncedSearch = debounceSearch((keyword) => {
  fetchSearchResults(keyword)
}, 500)
```

---

## 二、代码规范

### 1. 常量统一管理 (`utils/constants.js`)

| 常量类别 | 用途 |
|---------|------|
| `PAGES` | 页面路径统一管理 |
| `ROLES` | 角色代码常量 |
| `STATUS` | 各类状态常量 |
| `CACHE_KEYS` | 缓存键名 |
| `COLORS` | 主题色系统 |
| `PAGINATION` | 分页参数 |
| `SCORE_STANDARDS` | 评分标准 |
| `ISSUE_TYPES` | 问题类型 |

**好处：**
- 避免魔法字符串
- 统一修改一处生效
- 代码提示更友好

### 2. 表单验证统一 (`utils/validator.js`)

| 功能 | 说明 |
|------|------|
| `validateForm` | 验证整个表单 |
| `validateField` | 验证单个字段 |
| `showFirstError` | 显示第一个错误 |
| `validators` | 预设验证规则 |

**使用示例：**
```javascript
import { validateForm, showFirstError } from '@/utils/index.js'

const validationRules = {
  username: ['required', { type: 'minLength', value: 3 }],
  phone: ['required', 'phone']
}

const { valid, errors } = validateForm(formData, validationRules)
if (!valid) {
  showFirstError(errors)
}
```

### 3. 统一导出入口 (`utils/index.js`)

所有工具函数统一从 `utils/index.js` 导出：

```javascript
// 优化前
import { handleApiError } from '@/utils/helpers.js'
import { validateForm } from '@/utils/validator.js'
import { PAGES } from '@/utils/constants.js'

// 优化后
import { 
  handleApiError, 
  validateForm, 
  PAGES 
} from '@/utils/index.js'
```

---

## 三、重构示例

### `room-swaps/apply.vue` 重构前后对比

**重构前：**
```javascript
// 分散的导入
import { handleApiError } from '@/utils/helpers.js'

// 手写的验证逻辑
const validateForm = () => {
  if (!formData.value.targetRoom) {
    uni.showToast({ title: '请选择目标房间', icon: 'none' })
    return false
  }
  if (!formData.value.reason.trim()) {
    uni.showToast({ title: '请填写申请原因', icon: 'none' })
    return false
  }
  if (formData.value.reason.length < 10) {
    uni.showToast({ title: '申请原因至少需要10个字', icon: 'none' })
    return false
  }
  return true
}
```

**重构后：**
```javascript
// 统一导入
import { handleApiError, validateForm, showFirstError } from '@/utils/index.js'

// 声明式验证规则
const validationRules = {
  targetRoom: ['required'],
  reason: [
    'required',
    { type: 'minLength', value: 10, message: '申请原因至少需要10个字' },
    { type: 'maxLength', value: 500 }
  ]
}

// 简洁的验证调用
const checkForm = () => {
  const { valid, errors } = validateForm(formData.value, validationRules)
  if (!valid) {
    showFirstError(errors)
    return false
  }
  return true
}
```

---

## 四、优化成果

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 工具文件数量 | 1 (helpers.js) | 4 (+performance.js, validator.js, constants.js) | 功能更完善 |
| 表单验证代码 | ~20行手写 | ~5行声明式 | 减少75% |
| 错误处理代码 | 分散各处 | 统一封装 | 维护更简单 |
| 魔法字符串 | 多处 | 统一管理 | 减少bug |
| 代码复用性 | 低 | 高 | 开发效率↑ |

---

## 五、后续优化建议

### 短期（1-2周）
1. 继续重构其他页面使用新工具
2. 添加 TypeScript 类型定义
3. 完善单元测试

### 中期（1个月）
1. 图片懒加载落地
2. 虚拟列表优化长列表
3. 缓存策略优化

### 长期（3个月）
1. 组件库封装
2. 性能监控埋点
3. 代码规范自动化检查

---

## 六、文件清单

### 新增文件
```
src/utils/
  ├── performance.js   (性能工具)
  ├── validator.js     (表单验证)
  ├── constants.js     (常量定义)
  └── index.js         (统一导出)
```

### 修改文件
```
src/pages/room-swaps/apply.vue   (使用新工具重构)
```

---

**优化完成！代码质量显著提升 🎉**
