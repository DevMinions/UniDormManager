import { test, expect } from '@playwright/test'

/**
 * 登录功能 E2E 测试
 */
test.describe('登录功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/login/login')
  })

  test('正常登录流程', async ({ page }) => {
    // 输入用户名
    await page.fill('[data-testid="username-input"]', 'admin')
    
    // 输入密码
    await page.fill('[data-testid="password-input"]', 'admin123')
    
    // 点击登录按钮
    await page.click('[data-testid="login-button"]')
    
    // 验证登录成功，跳转到首页
    await expect(page).toHaveURL(/.*index/)
    
    // 验证首页元素存在
    await expect(page.locator('[data-testid="home-page"]')).toBeVisible()
  })

  test('错误密码提示', async ({ page }) => {
    // 输入用户名
    await page.fill('[data-testid="username-input"]', 'admin')
    
    // 输入错误密码
    await page.fill('[data-testid="password-input"]', 'wrongpassword')
    
    // 点击登录
    await page.click('[data-testid="login-button"]')
    
    // 验证错误提示
    await expect(page.locator('.toast')).toContainText('用户名或密码错误')
  })

  test('空用户名验证', async ({ page }) => {
    // 直接点击登录
    await page.click('[data-testid="login-button"]')
    
    // 验证输入框有错误提示
    await expect(page.locator('[data-testid="username-input"]')).toHaveClass(/error/)
  })
})

/**
 * 报修功能 E2E 测试
 */
test.describe('报修功能', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/pages/login/login')
    await page.fill('[data-testid="username-input"]', 'student001')
    await page.fill('[data-testid="password-input"]', '123456')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL(/.*index/)
    
    // 进入报修页面
    await page.goto('/pages/repairs/apply')
  })

  test('提交报修申请', async ({ page }) => {
    // 填写报修标题
    await page.fill('[data-testid="repair-title"]', '水龙头漏水')
    
    // 选择报修类型
    await page.selectOption('[data-testid="repair-type"]', 'plumbing')
    
    // 填写详细描述
    await page.fill('[data-testid="repair-description"]', '卫生间水龙头一直滴水，需要维修')
    
    // 提交报修
    await page.click('[data-testid="submit-repair-button"]')
    
    // 验证提交成功
    await expect(page.locator('.toast')).toContainText('提交成功')
    
    // 验证跳转到报修列表
    await expect(page).toHaveURL(/.*repairs\/list/)
  })

  test('报修列表查看', async ({ page }) => {
    // 进入报修列表
    await page.goto('/pages/repairs/list')
    
    // 验证列表加载
    await expect(page.locator('[data-testid="repair-list"]')).toBeVisible()
    
    // 验证至少有一条记录
    const items = await page.locator('.repair-item').count()
    expect(items).toBeGreaterThan(0)
  })
})

/**
 * 换寝申请 E2E 测试
 */
test.describe('换寝申请', () => {
  test.beforeEach(async ({ page }) => {
    // 登录学生账号
    await page.goto('/pages/login/login')
    await page.fill('[data-testid="username-input"]', 'student001')
    await page.fill('[data-testid="password-input"]', '123456')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL(/.*index/)
  })

  test('提交换寝申请', async ({ page }) => {
    // 进入换寝申请页面
    await page.goto('/pages/room-swaps/apply')
    
    // 选择目标房间
    await page.click('[data-testid="select-room-button"]')
    await page.click('[data-testid="room-option-102"]')
    
    // 填写申请原因
    await page.fill('[data-testid="swap-reason"]', '想和同学住一起')
    
    // 提交申请
    await page.click('[data-testid="submit-swap-button"]')
    
    // 验证提交成功
    await expect(page.locator('.toast')).toContainText('申请已提交')
  })

  test('查看申请进度', async ({ page }) => {
    // 进入换寝列表
    await page.goto('/pages/room-swaps/list')
    
    // 验证列表显示
    await expect(page.locator('[data-testid="swap-list"]')).toBeVisible()
    
    // 点击查看详情
    await page.click('.swap-item:first-child')
    
    // 验证详情页
    await expect(page.locator('[data-testid="swap-detail"]')).toBeVisible()
  })
})

/**
 * 消息中心 E2E 测试
 */
test.describe('消息中心', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/pages/login/login')
    await page.fill('[data-testid="username-input"]', 'student001')
    await page.fill('[data-testid="password-input"]', '123456')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL(/.*index/)
  })

  test('查看消息列表', async ({ page }) => {
    // 进入消息中心
    await page.goto('/pages/messages/list')
    
    // 验证消息列表加载
    await expect(page.locator('[data-testid="message-list"]')).toBeVisible()
  })

  test('标记消息已读', async ({ page }) => {
    await page.goto('/pages/messages/list')
    
    // 点击第一条未读消息
    await page.click('.message-item.unread:first-child')
    
    // 验证消息标记为已读
    await expect(page.locator('.message-item.unread')).toHaveCount(0)
  })
})

/**
 * 管理员功能 E2E 测试
 */
test.describe('管理员功能', () => {
  test.beforeEach(async ({ page }) => {
    // 登录管理员账号
    await page.goto('/pages/login/login')
    await page.fill('[data-testid="username-input"]', 'admin')
    await page.fill('[data-testid="password-input"]', 'admin123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL(/.*index/)
  })

  test('审批换寝申请', async ({ page }) => {
    // 进入换寝审批页面
    await page.goto('/pages/room-swaps/list')
    
    // 找到待审批的申请
    await page.click('.swap-item.pending:first-child')
    
    // 点击通过按钮
    await page.click('[data-testid="approve-button"]')
    
    // 填写审批意见
    await page.fill('[data-testid="approval-comment"]', '同意换寝')
    
    // 确认审批
    await page.click('[data-testid="confirm-approval"]')
    
    // 验证审批成功
    await expect(page.locator('.toast')).toContainText('审批完成')
  })

  test('录入查寝评分', async ({ page }) => {
    // 进入查寝评分页面
    await page.goto('/pages/inspections/score')
    
    // 选择房间
    await page.selectOption('[data-testid="room-select"]', '101')
    
    // 输入各项分数
    await page.fill('[data-testid="score-cleanliness"]', '18')
    await page.fill('[data-testid="score-order"]', '19')
    await page.fill('[data-testid="score-safety"]', '20')
    
    // 提交评分
    await page.click('[data-testid="submit-score"]')
    
    // 验证提交成功
    await expect(page.locator('.toast')).toContainText('评分已保存')
  })
})
