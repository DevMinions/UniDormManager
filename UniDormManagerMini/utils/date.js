/**
 * 日期时间格式化工具
 */

/**
 * 格式化时间为相对时间（刚刚/今天/昨天/日期）
 * @param {string|number|Date} date 日期
 * @returns {string} 格式化后的时间
 */
function formatRelativeTime(date) {
  if (!date) return ''
  
  const now = new Date()
  const target = new Date(date)
  const diff = now.getTime() - target.getTime()
  
  // 小于1分钟
  if (diff < 60000) {
    return '刚刚'
  }
  
  // 小于1小时
  if (diff < 3600000) {
    return Math.floor(diff / 60000) + '分钟前'
  }
  
  // 小于24小时
  if (diff < 86400000) {
    return Math.floor(diff / 3600000) + '小时前'
  }
  
  // 判断是否是今天
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  
  if (targetDay.getTime() === today.getTime()) {
    return '今天 ' + formatTime(target)
  }
  
  // 判断是否是昨天
  const yesterday = new Date(today.getTime() - 86400000)
  if (targetDay.getTime() === yesterday.getTime()) {
    return '昨天 ' + formatTime(target)
  }
  
  // 判断是否是今年
  if (target.getFullYear() === now.getFullYear()) {
    return formatDate(target, 'MM-DD')
  }
  
  // 其他显示完整日期
  return formatDate(target, 'YYYY-MM-DD')
}

/**
 * 格式化时间为 HH:MM
 * @param {Date} date 
 * @returns {string}
 */
function formatTime(date) {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * 格式化日期
 * @param {Date} date 
 * @param {string} format 
 * @returns {string}
 */
function formatDate(date, format = 'YYYY-MM-DD') {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 格式化完整日期时间
 * @param {string|number|Date} date 
 * @returns {string}
 */
function formatDateTime(date) {
  if (!date) return ''
  return formatDate(new Date(date), 'YYYY-MM-DD HH:mm')
}

module.exports = {
  formatRelativeTime,
  formatDate,
  formatTime,
  formatDateTime
}
