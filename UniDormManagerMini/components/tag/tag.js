/**
 * Tag 标签组件
 * 
 * 使用示例：
 * <tag color="blue">标签</tag>
 * <tag color="green" closable bind:close="onClose">可关闭</tag>
 * <tag size="small">小标签</tag>
 * 
 * 属性说明：
 * - color: 颜色主题 blue|green|red|orange|purple|gray|black
 * - closable: 是否可关闭
 * - size: 尺寸 medium(默认)|small|large
 * - plain: 是否镂空
 * - round: 是否圆角
 * 
 * 事件：
 * - close: 关闭事件
 */

Component({
  properties: {
    // 颜色主题
    color: {
      type: String,
      value: 'blue'
    },
    // 是否可关闭
    closable: {
      type: Boolean,
      value: false
    },
    // 尺寸
    size: {
      type: String,
      value: 'medium'
    },
    // 是否镂空
    plain: {
      type: Boolean,
      value: false
    },
    // 是否圆角
    round: {
      type: Boolean,
      value: false
    },
    // 自定义样式
    customStyle: {
      type: String,
      value: ''
    }
  },

  data: {
    visible: true
  },

  methods: {
    // 关闭标签
    onClose(e) {
      e.stopPropagation();
      this.setData({ visible: false });
      this.triggerEvent('close', e.detail);
    }
  }
});
