/**
 * Loading 加载组件
 * 
 * 使用示例：
 * <loading show type="spinner" fullscreen text="加载中..." />
 * <loading show type="dots" text="请稍候" />
 * <loading show type="default" fullscreen />
 * 
 * 属性说明：
 * - show: 是否显示
 * - type: 类型 - default(默认)|spinner(旋转)|dots(点动画)
 * - fullscreen: 是否全屏显示
 * - text: 自定义文字
 * - overlay: 是否显示遮罩层（仅fullscreen时有效）
 */

Component({
  properties: {
    // 是否显示
    show: {
      type: Boolean,
      value: false
    },
    // 加载类型：default, spinner, dots
    type: {
      type: String,
      value: 'default'
    },
    // 是否全屏显示
    fullscreen: {
      type: Boolean,
      value: false
    },
    // 提示文字
    text: {
      type: String,
      value: '加载中...'
    },
    // 是否显示遮罩层
    overlay: {
      type: Boolean,
      value: true
    },
    // 自定义颜色
    color: {
      type: String,
      value: '#1890ff'
    }
  },

  data: {
    // 组件内部数据
  },

  methods: {
    // 阻止遮罩层点击冒泡
    onMaskTap(e) {
      // 可选：添加点击遮罩关闭功能
      // this.triggerEvent('maskTap', {});
    }
  }
});
