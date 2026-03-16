
// ============================================
// 敏感数据处理工具
// ============================================

import CryptoJS from 'crypto-js'

// 加密密钥（实际项目中应从安全的地方获取）
const ENCRYPT_KEY = 'UniDormManager@2024!SecureKey#'

/**
 * 加密数据
 * @param {*} data - 要加密的数据
 * @returns {string}
 */
export const encrypt = (data) => {
  try {
    const jsonStr = JSON.stringify(data)
    const encrypted = CryptoJS.AES.encrypt(jsonStr, ENCRYPT_KEY, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    })
    return encrypted.toString()
  } catch (error) {
    console.error('加密失败:', error)
    return null
  }
}

/**
 * 解密数据
 * @param {string} encryptedData - 加密的数据
 * @returns {*}
 */
export const decrypt = (encryptedData) => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, ENCRYPT_KEY, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    })
    const jsonStr = decrypted.toString(CryptoJS.enc.Utf8)
    return JSON.parse(jsonStr)
  } catch (error) {
    console.error('解密失败:', error)
    return null
  }
}

/**
 * MD5 哈希
 * @param {string} str - 字符串
 * @returns {string}
 */
export const md5 = (str) => {
  return CryptoJS.MD5(str).toString()
}

/**
 * SHA256 哈希
 * @param {string} str - 字符串
 * @returns {string}
 */
export const sha256 = (str) => {
  return CryptoJS.SHA256(str).toString()
}

/**
 * 生成随机字符串
 * @param {number} length - 长度
 * @returns {string}
 */
export const generateNonce = (length = 16) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 本地存储加密
 */
export const secureStorage = {
  /**
   * 设置加密存储
   * @param {string} key - 键
   * @param {*} value - 值
   */
  set(key, value) {
    try {
      const encrypted = encrypt(value)
      if (encrypted) {
        uni.setStorageSync(`secure_${key}`, encrypted)
      }
    } catch (error) {
      console.error('安全存储失败:', error)
    }
  },
  
  /**
   * 获取解密存储
   * @param {string} key - 键
   * @returns {*}
   */
  get(key) {
    try {
      const encrypted = uni.getStorageSync(`secure_${key}`)
      if (encrypted) {
        return decrypt(encrypted)
      }
      return null
    } catch (error) {
      console.error('安全读取失败:', error)
      return null
    }
  },
  
  /**
   * 移除存储
   * @param {string} key - 键
   */
  remove(key) {
    try {
      uni.removeStorageSync(`secure_${key}`)
    } catch (error) {
      console.error('安全移除失败:', error)
    }
  },
  
  /**
   * 清空安全存储
   */
  clear() {
    try {
      const keys = uni.getStorageInfoSync().keys
      keys.forEach(key => {
        if (key.startsWith('secure_')) {
          uni.removeStorageSync(key)
        }
      })
    } catch (error) {
      console.error('安全清空失败:', error)
    }
  }
}

/**
 * 数据脱敏
 */
export const dataMasking = {
  /**
   * 手机号脱敏
   * @param {string} phone
   * @returns {string}
   */
  phone(phone) {
    if (!phone || phone.length !== 11) return phone
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  },
  
  /**
   * 身份证号脱敏
   * @param {string} idCard
   * @returns {string}
   */
  idCard(idCard) {
    if (!idCard) return idCard
    if (idCard.length === 15) {
      return idCard.replace(/(\d{4})\d{7}(\d{4})/, '$1*******$2')
    }
    if (idCard.length === 18) {
      return idCard.replace(/(\d{4})\d{10}(\d{4})/, '$1**********$2')
    }
    return idCard
  },
  
  /**
   * 姓名脱敏
   * @param {string} name
   * @returns {string}
   */
  name(name) {
    if (!name || name.length < 2) return name
    if (name.length === 2) {
      return '*' + name[1]
    }
    return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1]
  },
  
  /**
   * 邮箱脱敏
   * @param {string} email
   * @returns {string}
   */
  email(email) {
    if (!email || !email.includes('@')) return email
    const [local, domain] = email.split('@')
    const maskedLocal = local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
    return `${maskedLocal}@${domain}`
  },
  
  /**
   * 银行卡号脱敏
   * @param {string} cardNo
   * @returns {string}
   */
  bankCard(cardNo) {
    if (!cardNo || cardNo.length < 8) return cardNo
    return cardNo.slice(0, 4) + ' **** **** ' + cardNo.slice(-4)
  },
  
  /**
   * 地址脱敏
   * @param {string} address
   * @returns {string}
   */
  address(address) {
    if (!address || address.length < 10) return address
    const half = Math.floor(address.length / 2)
    return address.slice(0, half - 2) + '****' + address.slice(half + 2)
  }
}

/**
 * 对象脱敏
 * @param {Object} data - 数据对象
 * @param {Object} fields - 字段配置 { field: 'type' }
 * @returns {Object}
 */
export const maskObject = (data, fields) => {
  if (!data || typeof data !== 'object') return data
  
  const masked = { ...data }
  
  for (const [field, type] of Object.entries(fields)) {
    if (masked[field]) {
      const masker = dataMasking[type]
      if (masker) {
        masked[field] = masker(masked[field])
      }
    }
  }
  
  return masked
}

/**
 * 日志脱敏
 * @param {*} data - 日志数据
 * @returns {*}
 */
export const maskLogData = (data) => {
  if (typeof data === 'string') {
    // 脱敏手机号
    let result = data.replace(/1[3-9]\d{9}/g, match => dataMasking.phone(match))
    // 脱敏身份证号
    result = result.replace(/\d{15}|\d{18}|\d{17}[Xx]/g, match => dataMasking.idCard(match))
    return result
  }
  
  if (Array.isArray(data)) {
    return data.map(maskLogData)
  }
  
  if (data && typeof data === 'object') {
    const masked = {}
    for (const [key, value] of Object.entries(data)) {
      // 敏感字段脱敏
      if (['phone', 'mobile', 'tel'].some(k => key.toLowerCase().includes(k))) {
        masked[key] = dataMasking.phone(value)
      } else if (['idcard', 'id_card', 'identity'].some(k => key.toLowerCase().includes(k))) {
        masked[key] = dataMasking.idCard(value)
      } else if (['password', 'pwd', 'secret', 'token'].some(k => key.toLowerCase().includes(k))) {
        masked[key] = '******'
      } else {
        masked[key] = maskLogData(value)
      }
    }
    return masked
  }
  
  return data
}
