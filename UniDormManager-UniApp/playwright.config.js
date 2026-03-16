# ============================================
# Playwright E2E 测试配置
# ============================================

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  
  // 完全并行运行测试
  fullyParallel: true,
  
  // 失败时禁止并行
  forbidOnly: !!process.env.CI,
  
  // 重试次数
  retries: process.env.CI ? 2 : 0,
  
  // 并发 workers
  workers: process.env.CI ? 1 : undefined,
  
  // 测试报告
  reporter: [
    ['html', { outputFolder: 'e2e-report' }],
    ['json', { outputFile: 'e2e-report/results.json' }]
  ],
  
  // 共享配置
  use: {
    // 基础 URL
    baseURL: process.env.BASE_URL || 'http://localhost:8080',
    
    // 收集 trace
    trace: 'on-first-retry',
    
    // 截图
    screenshot: 'only-on-failure',
    
    // 视频
    video: 'on-first-retry',
    
    // 视口
    viewport: { width: 375, height: 812 }, // 移动端视口
    
    // 超时
    actionTimeout: 10000,
    
    // 导航超时
    navigationTimeout: 30000
  },
  
  // 项目配置
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] }
    }
  ],
  
  // 全局设置
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts'
})
