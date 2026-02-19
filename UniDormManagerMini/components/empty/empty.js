/**
 * Empty 空状态组件
 * 
 * 使用示例：
 * <empty icon="📭" title="暂无消息" description="消息列表为空" />
 * <empty icon="/images/empty.png" title="没有数据" 
 *        btn-text="去添加" bind:btntap="onAddClick" />
 * 
 * 属性说明：
 * - icon: 图标，可以是emoji或图片路径
 * - title: 标题
 * - description: 描述文字
 * - btn-text: 按钮文字（不传则不显示按钮）
 * - btn-type: 按钮样式 primary(默认)|default|warn
 * 
 * 事件：
 * - btntap: 按钮点击事件
 */

Component({
  properties: {
    // 图标（emoji或图片路径）
    icon: {
      type: String,
      value: '📭'
    },
    // 标题
    title: {
      type: String,
      value: '暂无数据'
    },
    // 描述
    description: {
      type: String,
      value: ''
    },
    // 按钮文字
    btnText: {
      type: String,
      value: ''
    },
    // 按钮类型 primary|default|warn
    btnType: {
      type: String,
      value: 'primary'
    },
    // 是否显示背景
    showBg: {
      type: Boolean,
      value: false
    }
  },

  data: {
    isImageIcon: false
  },

  lifetimes: {
    attached() {
      // 判断icon是图片路径还是emoji
      const { icon } = this.properties;
      this.setData({
        isImageIcon: icon && (icon.startsWith('/') || icon.startsWith('http'))
      });
    }
  },

  observers: {
    'icon': function(icon) {
      this.setData({
        isImageIcon: icon && (icon.startsWith('/') || icon.startsWith('http'))
      });
    }
  },

  methods: {
    // 按钮点击事件
    onBtnTap(e) {
      this.triggerEvent('btntap', e.detail);
    }
  }
});
