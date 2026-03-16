// ============================================
// Vitest 测试环境配置
// ============================================

import { vi } from 'vitest'

// 模拟 uni-app API
global.uni = {
  showToast: vi.fn(),
  showModal: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  request: vi.fn(),
  uploadFile: vi.fn(),
  downloadFile: vi.fn(),
  getStorageSync: vi.fn(),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
  getStorageInfoSync: vi.fn(() => ({ keys: [] })),
  getFileSystemManager: vi.fn(() => ({
    writeFile: vi.fn(),
    readFile: vi.fn(),
    access: vi.fn()
  })),
  chooseImage: vi.fn(),
  previewImage: vi.fn(),
  saveImageToPhotosAlbum: vi.fn(),
  getImageInfo: vi.fn(),
  compressImage: vi.fn(),
  switchTab: vi.fn(),
  navigateTo: vi.fn(),
  redirectTo: vi.fn(),
  reLaunch: vi.fn(),
  navigateBack: vi.fn(),
  getCurrentPages: vi.fn(() => []),
  createSelectorQuery: vi.fn(() => ({
    select: vi.fn(() => ({
      boundingClientRect: vi.fn(() => ({
        exec: vi.fn()
      }))
    }))
  })),
  getSystemInfoSync: vi.fn(() => ({
    windowWidth: 375,
    windowHeight: 667,
    statusBarHeight: 20,
    screenWidth: 375,
    screenHeight: 667
  })),
  vibrateShort: vi.fn(),
  vibrateLong: vi.fn()
}

// 模拟 getCurrentPages
global.getCurrentPages = vi.fn(() => [])

// 模拟 performance API
global.performance = {
  now: vi.fn(() => Date.now())
}

// 清理 mock
afterEach(() => {
  vi.clearAllMocks()
})
