# UniDormManager 设计系统 v2.0

> 基于 UI-UX-Pro-Max 设计智能 + 有机自然风美学

---

## 🎨 设计理念

### 风格定位
**Organic Biophilic (有机生物亲和)** - 自然、有机形状、绿色调、可持续性、圆润流动

### 设计关键词
- 🌿 自然有机
- 🏠 家的温暖  
- ✨ 生命力
- 🎋 宁静平和
- 🍃 可持续

### 适用场景
宿舍管理系统 - 让学生感受到"家"的归属感，温暖而宁静的使用体验

---

## 📐 设计原则

1. **有机流动** - 不规则圆角、自然曲线
2. **温暖大地** - 鼠尾草绿 + 陶土色 + 温暖白
3. **层次丰富** - 柔和阴影、微妙渐变
4. **精致细节** - 微交互、细腻动画

---

## 🎯 色彩系统

### 主色 - 鼠尾草绿 (Sage Green)
```scss
$sage-50:  #f6f7f4;  // 最浅背景
$sage-100: #e8ece4;  // 卡片背景
$sage-200: #d4dcc9;  // 边框/分割线
$sage-300: #b8c7a6;  // 图标/装饰
$sage-400: #96aa7d;  // 次要按钮
$sage-500: #7a8f63;  // 主要强调
$sage-600: #5c6b52;  // ⭐ 主色调
$sage-700: #485440;  // 深文本
$sage-800: #3c4436;  // 标题
$sage-900: #333a2f;  // 最深
```

### 强调色 - 陶土色 (Terracotta)
```scss
$terracotta-50:  #fdf6f0;  // 浅背景
$terracotta-100: #f5e5d5;  // 卡片背景
$terracotta-200: #ebd0b8;  // 边框
$terracotta-300: #deaf8b;  // 装饰
$terracotta-400: #d08b62;  // 次要强调
$terracotta-500: #c46f43;  // ⭐ 强调色
$terracotta-600: #b85a38;  // 按钮/链接
$terracotta-700: #994630;  // 深文本
$terracotta-800: #7d3c2d;  // 标题
$terracotta-900: #653327;  // 最深
```

### 功能色
```scss
// 成功 - 自然绿
$success:       #6b8e6b;
$success-light: rgba(107, 142, 107, 0.1);

// 警告 - 柔和琥珀
$warning:       #c4a77d;
$warning-light: rgba(196, 167, 125, 0.1);

// 错误 - 柔和红
$error:         #c1666b;
$error-light:   rgba(193, 102, 107, 0.1);

// 信息 - 天空蓝
$info:          #7da3c4;
$info-light:    rgba(125, 163, 196, 0.1);
```

### 中性色
```scss
// 温暖白/灰
$warm-white:    #faf9f7;  // ⭐ 页面背景
$warm-gray-50:  #f5f4f2;
$warm-gray-100: #e8e4df;
$warm-gray-200: #d4cfc9;
$warm-gray-300: #b8b3ab;
$warm-gray-400: #9a958d;
$warm-gray-500: #8b8b8b;  // 次要文本
$warm-gray-600: #6b6b6b;
$warm-gray-700: #4a4a4a;
$warm-gray-800: #3d3d3d;  // ⭐ 主要文本
$warm-gray-900: #2d2d2d;
```

### 使用规范
| 场景 | 颜色 | 说明 |
|------|------|------|
| 页面背景 | $warm-white | 温暖米白，不刺眼 |
| 卡片背景 | #ffffff | 纯白，带柔和阴影 |
| 主要按钮 | $sage-600 | 鼠尾草绿 |
| 次要按钮 | $sage-500 | 浅绿 |
| 强调/提醒 | $terracotta-500 | 陶土色 |
| 主要文本 | $warm-gray-800 | 深灰 |
| 次要文本 | $warm-gray-500 | 中灰 |
| 禁用文本 | $warm-gray-400 | 浅灰 |

---

## 📝 字体系统

### 字体选择
- **标题字体**: ZCOOL XiaoWei (站酷小薇) - 人文书法感
- **正文字体**: Noto Sans SC - 清晰可读
- **英文备用**: -apple-system, BlinkMacSystemFont, 'Segoe UI'

### 字号规范
```scss
// 展示文字
$text-hero:     48rpx;  // 大标题
$text-display:  40rpx;  // 页面标题

// 标题
$text-h1:       36rpx;  // 区块标题
$text-h2:       32rpx;  // 卡片标题
$text-h3:       28rpx;  // 小标题

// 正文
$text-body:     28rpx;  // 标准正文
$text-body-sm:  26rpx;  // 小正文
$text-caption:  24rpx;  // 说明文字
$text-small:    22rpx;  // 辅助文字
$text-xs:       20rpx;  // 标签/时间
```

### 行高
```scss
$leading-tight:   1.25;  // 标题
$leading-normal:  1.6;   // 正文
$leading-relaxed: 1.8;   // 长文本
```

---

## 🔷 形状系统

### 圆角规范
```scss
// 标准圆角
$radius-sm:  8rpx;   // 小元素
$radius-md:  16rpx;  // 按钮/输入框
$radius-lg:  20rpx;  // 卡片
$radius-xl:  24rpx;  // 大卡片
$radius-full: 9999rpx; // 胶囊/头像

// 有机不规则圆角 (手绘感)
$radius-organic:         24rpx 24rpx 24rpx 8rpx;   // 左上小
$radius-organic-reverse: 8rpx 24rpx 24rpx 24rpx;   // 左下小
$radius-organic-alt:     24rpx 8rpx 24rpx 24rpx;   // 右上小
$radius-organic-alt2:    24rpx 24rpx 8rpx 24rpx;   // 右下小
```

### 使用建议
- 主要卡片使用 `$radius-organic` 增加手绘感
- 功能卡片交替使用不同有机圆角
- 按钮使用标准圆角保持一致性

---

## 🌑 阴影系统

```scss
// 柔和阴影
$shadow-sm: 
  0 2rpx 12rpx rgba(0, 0, 0, 0.05);

$shadow-md: 
  0 4rpx 16rpx rgba(0, 0, 0, 0.06),
  0 1px 3px rgba(0, 0, 0, 0.04);

$shadow-lg: 
  0 8rpx 24rpx rgba(139, 154, 124, 0.15),
  0 2px 8px rgba(0, 0, 0, 0.04);

$shadow-xl: 
  0 16rpx 40rpx rgba(92, 107, 82, 0.12),
  0 4px 12px rgba(0, 0, 0, 0.05);

// 有机阴影 (带颜色)
$shadow-organic: 
  0 8rpx 32px rgba(92, 107, 82, 0.12),
  0 2px 8px rgba(0, 0, 0, 0.04),
  inset 0 1px 0 rgba(255, 255, 255, 0.8);
```

---

## 🎬 动画系统

### 进入动画
```scss
// 淡入上浮
@keyframes fadeInUp {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}

// 弹性进入
@keyframes bounceIn {
  0% { opacity: 0; transform: scale(0.3); }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
}

// 卡片滑动
@keyframes cardSlideUp {
  0% { opacity: 0; transform: translateY(20px) scale(0.95); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
```

### 持续动画
```scss
// 漂浮
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

// 呼吸
@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
}

// 叶子摇摆
@keyframes leafSway {
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
}

// 旋转
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### 微交互
```scss
// 点击波纹
@keyframes ripple {
  0% { transform: scale(0); opacity: 0.5; }
  100% { transform: scale(4); opacity: 0; }
}

// 脉冲
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

// 弹跳
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
```

### 动画时长
```scss
$duration-fast:   150ms;  // 微交互
$duration-normal: 300ms;  // 状态变化
$duration-slow:   500ms;  // 页面过渡
$duration-enter:  600ms;  // 进入动画
```

### 缓动函数
```scss
$ease-default:     ease;
$ease-smooth:      cubic-bezier(0.4, 0, 0.2, 1);
$ease-bounce:      cubic-bezier(0.34, 1.56, 0.64, 1);
$ease-out-expo:    cubic-bezier(0.16, 1, 0.3, 1);
```

---

## 📏 间距系统

```scss
// 基础单位 8rpx
$space-1: 8rpx;    // 极小
$space-2: 16rpx;   // 小
$space-3: 24rpx;   // 中
$space-4: 32rpx;   // 标准
$space-5: 40rpx;   // 大
$space-6: 48rpx;   // 特大
$space-8: 64rpx;   // 超大
$space-10: 80rpx;  // 巨大

// 页面边距
$page-padding-x: 20px;
$page-padding-y: 16px;

// 卡片内边距
$card-padding: 24rpx;
$card-padding-lg: 32rpx;
```

---

## 🧩 组件规范

### 按钮
```scss
// 主要按钮
.btn-primary {
  background: linear-gradient(135deg, $sage-500 0%, $sage-600 100%);
  color: #ffffff;
  border-radius: 16rpx;
  height: 52rpx;
  padding: 0 32rpx;
  font-size: 16rpx;
  font-weight: 600;
  box-shadow: $shadow-md;
  
  &:active {
    transform: scale(0.98);
    box-shadow: $shadow-sm;
  }
}

// 次要按钮
.btn-secondary {
  background: $sage-100;
  color: $sage-700;
  border: 1rpx solid $sage-300;
  border-radius: 16rpx;
  
  &:active {
    background: $sage-200;
  }
}
```

### 卡片
```scss
// 标准卡片
.card {
  background: #ffffff;
  border-radius: $radius-organic;
  padding: $card-padding;
  box-shadow: $shadow-organic;
  border: 1rpx solid rgba(184, 199, 166, 0.3);
}

// 玻璃卡片
.card-glass {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border-radius: $radius-organic;
  border: 1rpx solid rgba(255, 255, 255, 0.3);
}
```

### 输入框
```scss
.input-group {
  display: flex;
  align-items: center;
  background: rgba(246, 247, 244, 0.8);
  border-radius: 16rpx;
  border: 1rpx solid rgba(184, 199, 166, 0.3);
  padding: 4rpx;
  
  &:focus-within {
    background: #ffffff;
    border-color: $sage-400;
    box-shadow: 0 0 0 3rpx rgba(184, 199, 166, 0.15);
  }
}
```

---

## ✅ 设计检查清单

### 视觉一致性
- [ ] 颜色仅使用设计系统中的值
- [ ] 圆角遵循规范（有机形状交替使用）
- [ ] 阴影层次清晰
- [ ] 间距使用 8rpx 倍数

### 交互体验
- [ ] 所有可点击元素有 hover/active 状态
- [ ] 过渡动画时长 150-300ms
- [ ] 使用 $ease-bounce 增强弹性感
- [ ] 页面进入有 staggered 动画

### 可访问性
- [ ] 文本对比度 ≥ 4.5:1
- [ ] 焦点状态可见
- [ ] 支持 prefers-reduced-motion
- [ ] 触摸目标 ≥ 44x44rpx

### 性能
- [ ] 使用 CSS 动画代替 JS
- [ ] 使用 transform 和 opacity 做动画
- [ ] 图片懒加载
- [ ] 减少重绘重排

---

## 🚫 避免使用

### 颜色
- ❌ 荧光色
- ❌ 紫色渐变 (AI 俗套)
- ❌ 高饱和度对比
- ❌ 纯黑/纯白

### 字体
- ❌ Arial, Roboto (过于常见)
- ❌ 超过 3 种字体
- ❌ 过小字号 (<20rpx)

### 形状
- ❌ 纯方形卡片
- ❌ 过于复杂的边框

### 动画
- ❌ 过于花哨的效果
- ❌ 超过 1s 的动画
- ❌ 无意义的动画

---

## 📚 参考资源

- **Design System Generator**: UI-UX-Pro-Max
- **Style**: Organic Biophilic
- **Generated**: 2026-03-14
- **Version**: 2.0

---

*让宿舍管理像家一样温暖 🏠🌿*
