/**
 * Card 卡片组件
 * 
 * 使用示例：
 * <card title="卡片标题" type="default" hoverable bind:tap="onCardTap">
 *   <view slot="header-right">更多</view>
 *   <view>卡片内容区域</view>
 *   <view slot="footer"><button>操作</button></view>
 * </card>
 * 
 * 属性说明：
 * - title: 标题
 * - type: 卡片类型 default(默认)|bordered|shadow|plain
 * - hoverable: 是否支持hover效果
 * - padding: 内容区内边距
 * - bordered: 是否显示边框
 * 
 * 插槽：
 * - default: 内容区域
 * - header-right: 标题右侧
 * - footer: 底部区域
 */

Component({
  properties: {
    // 标题
    title: {
      type: String,
      value: ''
    },
    // 卡片类型：default, bordered, shadow, plain
    type: {
      type: String,
      value: 'default'
    },
    // 是否支持hover效果
    hoverable: {
      type: Boolean,
      value: false
    },
    // 内容区内边距
    padding: {
      type: String,
      value: '24rpx'
    },
    // 是否显示边框
    bordered: {
      type: Boolean,
      value: true
    },
    // 自定义样式
    customStyle: {
      type: String,
      value: ''
    },
    // 标题样式
    titleStyle: {
      type: String,
      value: ''
    }
  },

  data: {
    isHover: false
  },

  methods: {
    // 卡片点击
    onTap(e) {
      this.triggerEvent('tap', e.detail);
    },
    
    // 触摸开始
    onTouchStart() {
      if (this.properties.hoverable) {
        this.setData({ isHover: true });
      }
    },
    
    // 触摸结束
    onTouchEnd() {
      if (this.properties.hoverable) {
        this.setData({ isHover: false });
      }
    }
  }
});
