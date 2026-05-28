# UniDormManager 设计系统 v3.0

> 基于 UI-UX-Pro-Max 设计智能生成
> 风格: Organic Biophilic (有机生物亲和)
> 适用: 宿舍管理小程序 - 温暖、自然、有归属感

---

## 🎯 设计理念

### 核心概念
**"家一般的温暖"** - 让学生在使用宿舍管理系统时感受到归属感、舒适感和生命力。

### 风格定位
- **Pattern**: Community/Forum Landing - 强调社区感和归属感
- **Style**: Organic Biophilic - 有机自然、生命力、温暖
- **Keywords**: 自然、有机形状、绿色、可持续、圆润、流动、wellness、大地、自然纹理

### 情感关键词
🏠 温暖 · 🌿 自然 · ✨ 生命力 · 🎋 宁静 · 🍃 可持续 · 💚 关怀

---

## 🎨 色彩系统

### 主色调 - 温暖陶土色 (Terracotta)
源自 UI-UX-Pro-Max 推荐: Recipe & Cooking App 配色

```scss
// Primary Scale
$primary-50:  #F8F2F0;   // 最浅背景
$primary-100: #F2E6E2;   // 卡片背景
$primary-200: #E8D4CD;   // 边框
$primary-300: #D4B8AE;   // 装饰
$primary-400: #C49A8D;   // 次要强调
$primary-500: #B07A6B;   // 中等强调
$primary-600: #9A3412;   // ⭐ PRIMARY - 温暖陶土
$primary-700: #7C2D12;   // 深文本
$primary-800: #5C240E;   // 标题
$primary-900: #3D1809;   // 最深

// On Primary
$on-primary: #FFFFFF;
```

### 强调色 - 新鲜绿色 (Fresh Green)
```scss
// Secondary Scale  
$secondary-50:  #ECFDF5;
$secondary-100: #D1FAE5;
$secondary-200: #A7F3D0;
$secondary-300: #6EE7B7;
$secondary-400: #34D399;
$secondary-500: #10B981;  // 生机绿
$secondary-600: #059669;  // ⭐ SECONDARY - 新鲜绿
$secondary-700: #047857;
$secondary-800: #065F46;
$secondary-900: #064E3B;

// On Secondary
$on-secondary: #FFFFFF;
```

### 功能色
```scss
// Success - 自然绿
$success:       #059669;
$success-light: #D1FAE5;

// Warning - 温暖琥珀  
$warning:       #D97706;
$warning-light: #FEF3C7;

// Error - 柔和红
$error:         #DC2626;
$error-light:   #FEE2E2;

// Info - 天空蓝
$info:          #3B82F6;
$info-light:    #DBEAFE;
```

### 中性色 - 温暖灰阶
```scss
// Background System
$background:         #FFFBEB;  // ⭐ 温暖米色背景
$foreground:         #1E293B;  // 主要文本
$card:               #FFFFFF;  // 卡片背景
$card-foreground:    #1E293B;  // 卡片文本

// Muted Scale
$muted:              #F8F2F0;  // 柔和背景
$muted-foreground:   #64748B;  // 次要文本

// Border
$border:             #F2E6E2;  // 边框色

// Ring/Focus
$ring:               #9A3412;  // 焦点环
```

### 使用规范

| 场景 | 颜色 | 说明 |
|------|------|------|
| 页面背景 | `#FFFBEB` | 温暖米色，像家一样 |
| 卡片背景 | `#FFFFFF` | 纯白，带柔和阴影 |
| 主要按钮 | `#9A3412` | 陶土色，温暖有力 |
| 次要按钮 | `#059669` | 新鲜绿，生机活力 |
| 强调/提醒 | `#D97706` | 琥珀色 |
| 主要文本 | `#1E293B` | 深蓝灰，易读 |
| 次要文本 | `#64748B` | 中灰 |
| 禁用文本 | `#94A3B8` | 浅灰 |
| 成功状态 | `#059669` | 绿 |
| 警告状态 | `#D97706` | 琥珀 |
| 错误状态 | `#DC2626` | 红 |

---

## 📝 字体系统

### 字体选择
基于 UI-UX-Pro-Max 推荐: **Lora + Raleway**

- **Heading (标题)**: Lora - 优雅衬线，人文温暖感
- **Body (正文)**: Raleway - 现代无衬线，清晰可读

### 字号规范 (小程序适配)
```scss
// 展示文字
$text-hero:     48rpx;  // 大标题 / 品牌名
$text-display:  40rpx;  // 页面标题

// 标题
$text-h1:       36rpx;  // 区块标题
$text-h2:       32rpx;  // 卡片标题
$text-h3:       28rpx;  // 小标题

// 正文
$text-body-lg:  30rpx;  // 大正文
$text-body:     28rpx;  // 标准正文
$text-body-sm:  26rpx;  // 小正文

// 辅助
$text-caption:  24rpx;  // 说明文字
$text-small:    22rpx;  // 辅助文字
$text-xs:       20rpx;  // 标签/时间
```

### 行高
```scss
$leading-tight:   1.25;  // 标题
$leading-snug:    1.4;   // 小标题
$leading-normal:  1.6;   // 正文
$leading-relaxed: 1.8;   // 长文本
```

### 字重
```scss
$font-normal:   400;
$font-medium:   500;
$font-semibold: 600;
$font-bold:     700;
```

---

## 🔷 形状系统

### 圆角规范
基于 Organic Biophilic 风格: **16-24px 圆润圆角**

```scss
// 标准圆角
$radius-sm:   8rpx;   // 小元素/标签
$radius-md:   12rpx;  // 按钮/输入框
$radius-lg:   16rpx;  // 小卡片
$radius-xl:   20rpx;  // 标准卡片
$radius-2xl:  24rpx;  // 大卡片
$radius-full: 9999rpx; // 胶囊/头像

// 有机不规则圆角 (手绘感)
$radius-organic:         24rpx 24rpx 24rpx 12rpx;  // 左下小
$radius-organic-reverse: 12rpx 24rpx 24rpx 24rpx;  // 左上小
$radius-organic-alt:     24rpx 12rpx 24rpx 24rpx;  // 右上小
$radius-organic-alt2:    24rpx 24rpx 12rpx 24rpx;  // 右下小
```

### 使用建议
- 主要卡片使用 `$radius-2xl` (24rpx) 或有机圆角
- 按钮使用 `$radius-xl` (20rpx) 
- 头像使用 `$radius-full`
- 标签使用 `$radius-full` 胶囊形状

---

## 🌑 阴影系统

### 自然阴影
```scss
// 柔和阴影
$shadow-sm: 
  0 2rpx 8rpx rgba(154, 52, 18, 0.06);

$shadow-md: 
  0 4rpx 12rpx rgba(154, 52, 18, 0.08),
  0 2rpx 4rpx rgba(0, 0, 0, 0.04);

$shadow-lg: 
  0 8rpx 24rpx rgba(154, 52, 18, 0.10),
  0 4rpx 8rpx rgba(0, 0, 0, 0.04);

$shadow-xl: 
  0 16rpx 40rpx rgba(154, 52, 18, 0.12),
  0 8rpx 16rpx rgba(0, 0, 0, 0.04);

// 有机温暖阴影 (主色调)
$shadow-warm: 
  0 8rpx 28rpx rgba(154, 52, 18, 0.12),
  0 2px 8px rgba(0, 0, 0, 0.04),
  inset 0 1px 0 rgba(255, 255, 255, 0.8);

// 绿色生命阴影
$shadow-nature: 
  0 8rpx 28rpx rgba(5, 150, 105, 0.10),
  0 2px 8px rgba(0, 0, 0, 0.04);
```

---

## 🎬 动画系统

### 进入动画
```scss
// 淡入上浮
@keyframes fadeInUp {
  0% { opacity: 0; transform: translateY(20rpx); }
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
@keyframes slideUp {
  0% { opacity: 0; transform: translateY(30rpx) scale(0.95); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
```

### 持续动画
```scss
// 漂浮
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10rpx); }
}

// 呼吸脉冲
@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
}

// 有机变形 (blob)
@keyframes organicMorph {
  0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
  25% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
  50% { border-radius: 50% 60% 30% 60% / 30% 60% 70% 40%; }
  75% { border-radius: 60% 40% 60% 30% / 70% 30% 50% 60%; }
}

// 摇摆
@keyframes sway {
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
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

// 加载弹跳
@keyframes loadingBounce {
  0%, 100% { transform: scale(0); opacity: 0.5; }
  50% { transform: scale(1); opacity: 1; }
}
```

### 动画时长规范
```scss
$duration-instant:   100ms; // 微交互
$duration-fast:      150ms; // 状态变化
$duration-normal:    300ms; // 标准过渡
$duration-slow:      500ms; // 页面过渡
$duration-enter:     600ms; // 进入动画
```

### 缓动函数
```scss
$ease-default:     ease;
$ease-smooth:      cubic-bezier(0.4, 0, 0.2, 1);
$ease-bounce:      cubic-bezier(0.34, 1.56, 0.64, 1);
$ease-out-expo:    cubic-bezier(0.16, 1, 0.3, 1);
$ease-spring:      cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

---

## 📏 间距系统

```scss
// 基础单位 8rpx
$space-1:  8rpx;   // 极小
$space-2:  16rpx;  // 小
$space-3:  24rpx;  // 中
$space-4:  32rpx;  // 标准
$space-5:  40rpx;  // 大
$space-6:  48rpx;  // 特大
$space-8:  64rpx;  // 超大
$space-10: 80rpx;  // 巨大
$space-12: 96rpx;  // 超大

// 页面边距
$page-padding-x: 24rpx;
$page-padding-y: 16rpx;

// 卡片内边距
$card-padding:    24rpx;
$card-padding-lg: 32rpx;

// 安全区域
$safe-area-bottom: env(safe-area-inset-bottom);
```

---

## 🧩 组件规范

### 按钮

#### 主要按钮 (Primary)
```scss
.btn-primary {
  background: linear-gradient(135deg, $primary-600 0%, $primary-700 100%);
  color: $on-primary;
  border-radius: $radius-xl;
  height: 88rpx;
  padding: 0 48rpx;
  font-size: $text-body;
  font-weight: $font-semibold;
  box-shadow: $shadow-md;
  transition: all $duration-fast $ease-spring;
  
  &:active {
    transform: scale(0.98);
    box-shadow: $shadow-sm;
  }
}
```

#### 次要按钮 (Secondary)
```scss
.btn-secondary {
  background: $secondary-100;
  color: $secondary-700;
  border: 2rpx solid $secondary-200;
  border-radius: $radius-xl;
  
  &:active {
    background: $secondary-200;
  }
}
```

#### 文字按钮
```scss
.btn-ghost {
  background: transparent;
  color: $primary-600;
  
  &:active {
    background: $primary-50;
  }
}
```

### 卡片

#### 标准卡片
```scss
.card {
  background: $card;
  border-radius: $radius-2xl;
  padding: $card-padding;
  box-shadow: $shadow-warm;
  border: 1rpx solid $border;
}
```

#### 有机卡片 (手绘感)
```scss
.card-organic {
  background: $card;
  border-radius: $radius-organic;
  padding: $card-padding-lg;
  box-shadow: $shadow-warm;
  border: 2rpx solid $border;
}
```

#### 玻璃卡片
```scss
.card-glass {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border-radius: $radius-2xl;
  border: 1rpx solid rgba(255, 255, 255, 0.3);
}
```

### 输入框

```scss
.input-group {
  display: flex;
  align-items: center;
  background: $muted;
  border-radius: $radius-lg;
  border: 2rpx solid $border;
  padding: 8rpx;
  transition: all $duration-fast $ease-smooth;
  
  &:focus-within {
    background: $card;
    border-color: $primary-400;
    box-shadow: 0 0 0 4rpx rgba(154, 52, 18, 0.1);
  }
}

.input-icon {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: $muted-foreground;
}

.form-input {
  flex: 1;
  height: 72rpx;
  font-size: $text-body;
  color: $foreground;
  background: transparent;
  padding: 0 16rpx;
}

.placeholder {
  color: $muted-foreground;
}
```

### 标签/徽章

```scss
.badge {
  display: inline-flex;
  align-items: center;
  padding: 8rpx 20rpx;
  border-radius: $radius-full;
  font-size: $text-small;
  font-weight: $font-medium;
}

.badge-primary {
  background: $primary-100;
  color: $primary-700;
}

.badge-success {
  background: $success-light;
  color: $success;
}

.badge-warning {
  background: $warning-light;
  color: $warning;
}
```

---

## 🏗️ 布局模式

### 页面结构
```
Page
├── Background (有机形状装饰)
├── Header (导航栏)
├── Content
│   ├── Section (功能区块)
│   ├── Card Grid (卡片网格)
│   └── List (列表)
└── Bottom (底部导航/安全区)
```

### 网格系统
```scss
// 2列网格
.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-3;
}

// 4列网格 (快捷菜单)
.grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $space-2;
}
```

---

## ✅ 设计检查清单

### 视觉一致性
- [ ] 颜色仅使用设计系统中的值
- [ ] 圆角遵循 16-24rpx 规范
- [ ] 阴影层次清晰自然
- [ ] 间距使用 8rpx 倍数

### 交互体验
- [ ] 所有可点击元素有 active 状态
- [ ] 过渡动画时长 150-300ms
- [ ] 使用 $ease-spring 增强弹性感
- [ ] 页面进入有 staggered 动画

### 可访问性
- [ ] 文本对比度 ≥ 4.5:1
- [ ] 焦点状态可见
- [ ] 支持 prefers-reduced-motion
- [ ] 触摸目标 ≥ 88rpx

### 性能
- [ ] 使用 CSS 动画
- [ ] 使用 transform 和 opacity
- [ ] 减少重绘重排

---

## 🚫 避免使用

### 颜色
- ❌ 荧光色/霓虹色
- ❌ 紫色渐变 (AI 俗套)
- ❌ 纯黑 #000000 / 纯白 #FFFFFF
- ❌ 高饱和度对比

### 字体
- ❌ Arial, Roboto, Space Grotesk (过于常见)
- ❌ 超过 2 种字体
- ❌ 过小字号 (<20rpx)

### 形状
- ❌ 纯方形卡片 (无圆角)
- ❌ 过于复杂的边框

### 动画
- ❌ 超过 1s 的动画
- ❌ 无意义的装饰动画
- ❌ 闪烁/抖动效果

---

## 📚 参考资源

- **Design System Generator**: UI-UX-Pro-Max
- **Style**: Organic Biophilic
- **Color Reference**: Recipe & Cooking App (Warm terracotta + fresh green)
- **Typography**: Lora + Raleway
- **Generated**: 2026-03-14
- **Version**: 3.0

---

*让宿舍管理像家一样温暖 🏠🌿*

> "Nature does not hurry, yet everything is accomplished." - Lao Tzu
