/**
 * Badge 徽标组件
 * 
 * 使用示例：
 * <badge count="99" max="99">
 *   <view class="icon">通知</view>
 * </badge>
 * 
 * <badge dot position="top-right">
 *   <view class="avatar"><image src="..." /></view>
 * </badge>
 * 
 * 属性说明：
 * - count: 数字
 * - max: 最大值限制（超过显示 99+）
 * - dot: 是否显示圆点
 * - position: 位置 top-right(默认)|top-left|bottom-right|bottom-left
 * - offset: 偏移量 [x, y]
 * - color: 背景颜色
 * - show-zero: 数字为0时是否显示
 */

Component({
  properties: {
    // 数字
    count: {
      type: Number,
      value: 0
    },
    // 最大值限制
    max: {
      type: Number,
      value: 99
    },
    // 是否显示圆点
    dot: {
      type: Boolean,
      value: false
    },
    // 位置：top-right, top-left, bottom-right, bottom-left
    position: {
      type: String,
      value: 'top-right'
    },
    // 偏移量 [x, y]
    offset: {
      type: Array,
      value: [0, 0]
    },
    // 背景颜色
    color: {
      type: String,
      value: '#ff4d4f'
    },
    // 数字为0时是否显示
    showZero: {
      type: Boolean,
      value: false
    }
  },

  data: {
    displayCount: ''
  },

  lifetimes: {
    attached() {
      this.updateDisplayCount();
    }
  },

  observers: {
    'count, max': function(count, max) {
      this.updateDisplayCount();
    }
  },

  methods: {
    // 更新显示的数字
    updateDisplayCount() {
      const { count, max } = this.properties;
      let displayCount = '';
      
      if (count > max) {
        displayCount = max + '+';
      } else {
        displayCount = String(count);
      }
      
      this.setData({ displayCount });
    },

    // 判断是否显示badge
    isShow() {
      const { dot, count, showZero } = this.properties;
      if (dot) return true;
      if (count > 0) return true;
      if (count === 0 && showZero) return true;
      return false;
    }
  }
});
