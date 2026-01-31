// api/auth.js - 认证相关接口

const { post, get } = require('../utils/request')

/**
 * 微信登录
 * @param {String} code 微信登录code
 */
function wechatLogin(code) {
  return post('/api/auth/wechat/login', { code }, { showLoading: true, loadingText: '登录中...' })
}

/**
 * 获取用户信息
 */
function getUserInfo() {
  return get('/api/auth/user', {}, { showLoading: true })
}

/**
 * 退出登录
 */
function logout() {
  return post('/api/auth/logout', {}, { showLoading: true })
}

module.exports = {
  wechatLogin,
  getUserInfo,
  logout
}
