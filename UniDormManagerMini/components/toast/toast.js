/**
 * Toast 轻提示组件
 * 
 * 使用示例：
 * // 在页面的 json 中引用组件
 * // 在页面的 js 中调用
 * this.selectComponent('#toast').show({
 *   message: '操作成功',
 *   type: 'success',
 *   duration: 2000
 * });
 * 
 * 属性说明：
 * - message: 提示内容
 * - type: 类型 success|error|warning|info|loading
 * - duration: 持续时间（毫秒）
 * - position: 位置 top|center|bottom
 * - icon: 是否显示图标
 * - mask: 是否显示遮罩层
 */

Component({
  properties: {
    // 提示内容
    message: {
      type: String,
      value: ''
    },
    // 类型：success, error, warning, info, loading
    type: {
      type: String,
      value: 'info'
    },
    // 持续时间（毫秒），0表示不自动关闭
    duration: {
      type: Number,
      value: 2000
    },
    // 位置：top, center, bottom
    position: {
      type: String,
      value: 'center'
    },
    // 是否显示图标
    icon: {
      type: Boolean,
      value: true
    },
    // 是否显示遮罩层
    mask: {
      type: Boolean,
      value: false
    },
    // 是否显示
    show: {
      type: Boolean,
      value: false
    }
  },

  data: {
    timer: null,
    iconMap: {
      success: '✓',
      error: '✕',
      warning: '!',
      info: 'ℹ',
      loading: '⟳'
    }
  },

  methods: {
    // 显示提示
    show(options = {}) {
      const props = {};
      if (options.message !== undefined) props.message = options.message;
      if (options.type !== undefined) props.type = options.type;
      if (options.duration !== undefined) props.duration = options.duration;
      if (options.position !== undefined) props.position = options.position;
      if (options.icon !== undefined) props.icon = options.icon;
      if (options.mask !== undefined) props.mask = options.mask;
      props.show = true;
      
      this.setData(props);
      
      // 自动关闭
      if (options.duration > 0) {
        this.clearTimer();
        this.setData({
          timer: setTimeout(() => {
            this.hide();
          }, options.duration)
        });
      }
    },
    
    // 隐藏提示
    hide() {
      this.clearTimer();
      this.setData({ show: false });
    },
    
    // 清除定时器
    clearTimer() {
      if (this.data.timer) {
        clearTimeout(this.data.timer);
        this.setData({ timer: null });
      }
    },
    
    // 点击遮罩
    onMaskTap() {
      // 可选：点击遮罩关闭
      // this.hide();
    },
    
    // 快捷方法
    success(message, duration = 2000) {
      this.show({ message, type: 'success', duration });
    },
    
    error(message, duration = 2000) {
      this.show({ message, type: 'error', duration });
    },
    
    warning(message, duration = 2000) {
      this.show({ message, type: 'warning', duration });
    },
    
    info(message, duration = 2000) {
      this.show({ message, type: 'info', duration });
    },
    
    loading(message = '加载中...', duration = 0) {
      this.show({ message, type: 'loading', duration, icon: true });
    }
  },
  
  lifetimes: {
    detached() {
      this.clearTimer();
    }
  }
});
