
// ============================================
// 统一日志工具
// 支持不同级别日志，生产环境自动禁用调试日志
// ============================================

// 当前环境
const isDev = process.env.NODE_ENV === 'development'

// 日志级别
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
}

// 当前日志级别（生产环境默认为 WARN）
let currentLevel = isDev ? LogLevel.DEBUG : LogLevel.WARN

// 日志样式（仅在开发环境使用）
const styles = {
  debug: 'color: #6B7280',
  info: 'color: #3B82F6',
  warn: 'color: #F59E0B',
  error: 'color: #DC2626; font-weight: bold'
}

/**
 * 设置日志级别
 * @param {number} level - 日志级别
 */
export function setLogLevel(level) {
  currentLevel = level
}

/**
 * 格式化日志消息
 * @param {string} level - 级别
 * @param {string} module - 模块名
 * @param {*} messages - 消息内容
 */
function formatMessage(level, module, messages) {
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`
  
  if (module) {
    return [`${prefix} [${module}]:`, ...messages]
  }
  
  return [prefix, ...messages]
}

/**
 * 调试日志
 * 仅在开发环境输出
 */
export function debug(module, ...messages) {
  if (currentLevel > LogLevel.DEBUG) return
  
  if (isDev) {
    console.log('%c[DEBUG]', styles.debug, ...formatMessage('debug', module, messages))
  }
}

/**
 * 信息日志
 */
export function info(module, ...messages) {
  if (currentLevel > LogLevel.INFO) return
  
  if (isDev) {
    console.log('%c[INFO]', styles.info, ...formatMessage('info', module, messages))
  } else {
    // 生产环境可发送到日志服务器
    console.log(...formatMessage('info', module, messages))
  }
}

/**
 * 警告日志
 */
export function warn(module, ...messages) {
  if (currentLevel > LogLevel.WARN) return
  
  if (isDev) {
    console.warn('%c[WARN]', styles.warn, ...formatMessage('warn', module, messages))
  } else {
    console.warn(...formatMessage('warn', module, messages))
  }
}

/**
 * 错误日志
 */
export function error(module, ...messages) {
  if (currentLevel > LogLevel.ERROR) return
  
  if (isDev) {
    console.error('%c[ERROR]', styles.error, ...formatMessage('error', module, messages))
  } else {
    console.error(...formatMessage('error', module, messages))
    // 生产环境可发送到错误监控服务
    // reportError(module, messages)
  }
}

/**
 * 分组日志
 */
export function group(label, collapsed = false) {
  if (!isDev) return
  
  if (collapsed) {
    console.groupCollapsed(label)
  } else {
    console.group(label)
  }
}

/**
 * 结束分组
 */
export function groupEnd() {
  if (!isDev) return
  console.groupEnd()
}

/**
 * 计时器
 */
export function time(label) {
  if (!isDev) return
  console.time(label)
}

/**
 * 结束计时
 */
export function timeEnd(label) {
  if (!isDev) return
  console.timeEnd(label)
}

/**
 * 表格输出
 */
export function table(data, columns) {
  if (!isDev) return
  console.table(data, columns)
}

/**
 * 创建模块日志实例
 * @param {string} moduleName - 模块名
 * @returns {Object}
 * 
 * 使用示例:
 * const logger = createLogger('RepairService')
 * logger.debug('加载数据', { id: 1 })
 * logger.error('请求失败', error)
 */
export function createLogger(moduleName) {
  return {
    debug: (...messages) => debug(moduleName, ...messages),
    info: (...messages) => info(moduleName, ...messages),
    warn: (...messages) => warn(moduleName, ...messages),
    error: (...messages) => error(moduleName, ...messages),
    group: (label, collapsed) => group(`${moduleName}: ${label}`, collapsed),
    groupEnd,
    time: (label) => time(`${moduleName}: ${label}`),
    timeEnd: (label) => timeEnd(`${moduleName}: ${label}`)
  }
}

// 默认导出
export default {
  LogLevel,
  setLogLevel,
  debug,
  info,
  warn,
  error,
  group,
  groupEnd,
  time,
  timeEnd,
  table,
  createLogger
}
