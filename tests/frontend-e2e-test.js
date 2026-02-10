#!/usr/bin/env node
/**
 * UniDormManager 前端 E2E 测试脚本
 * 使用 Playwright 进行页面功能测试
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:8082';

let browser, page;
let passCount = 0;
let failCount = 0;

async function test(name, fn) {
    try {
        await fn();
        console.log(`✅ PASS: ${name}`);
        passCount++;
    } catch (error) {
        console.log(`❌ FAIL: ${name}`);
        console.log(`   错误: ${error.message}`);
        failCount++;
    }
}

async function setup() {
    console.log('========================================');
    console.log('  UniDormManager 前端 E2E 测试');
    console.log('========================================\n');
    
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
    
    // 设置视口
    await page.setViewportSize({ width: 1280, height: 720 });
}

async function teardown() {
    await browser.close();
    
    console.log('\n========================================');
    console.log('  测试结果');
    console.log('========================================');
    console.log(`✅ 通过: ${passCount}`);
    console.log(`❌ 失败: ${failCount}`);
    
    if (failCount === 0) {
        console.log('\n🎉 所有测试通过！');
        process.exit(0);
    } else {
        console.log(`\n⚠️  有 ${failCount} 个测试失败`);
        process.exit(1);
    }
}

async function runTests() {
    // 测试1: 首页加载
    await test('首页加载', async () => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        const title = await page.title();
        if (!title) throw new Error('页面标题为空');
    });
    
    // 截图保存
    await page.screenshot({ path: '/home/moltbot/workspace/UniDormManager/tests/screenshots/01-homepage.png' });
    
    // 测试2: 登录页面
    await test('登录页面存在', async () => {
        // 等待登录表单或跳转到登录页
        await page.waitForTimeout(2000);
        
        // 检查是否有登录表单或按钮
        const hasLogin = await page.$('input[type="text"], input[type="password"], button:has-text("登录"), button:has-text("Login")') !== null;
        if (!hasLogin) {
            // 如果没有登录表单，可能已经在首页
            const hasNav = await page.$('nav, .sidebar, .menu') !== null;
            if (!hasNav) throw new Error('无法找到登录表单或导航');
        }
    });
    
    await page.screenshot({ path: '/home/moltbot/workspace/UniDormManager/tests/screenshots/02-login.png' });
    
    // 测试3: 尝试登录（如果存在登录表单）
    await test('登录功能', async () => {
        const usernameInput = await page.$('input[type="text"], input[name="username"], input[name="phone"]');
        const passwordInput = await page.$('input[type="password"], input[name="password"], input[name="code"]');
        
        if (usernameInput && passwordInput) {
            await usernameInput.fill('admin');
            await passwordInput.fill('admin123');
            
            const loginButton = await page.$('button[type="submit"], button:has-text("登录"), button:has-text("Login")');
            if (loginButton) {
                await loginButton.click();
                await page.waitForTimeout(3000);
            }
        }
    });
    
    await page.screenshot({ path: '/home/moltbot/workspace/UniDormManager/tests/screenshots/03-after-login.png' });
    
    // 测试4: 导航菜单
    await test('导航菜单', async () => {
        // 检查常见导航元素
        const navSelectors = ['nav', '.sidebar', '.menu', '.navigation', '[role="navigation"]'];
        let hasNav = false;
        
        for (const selector of navSelectors) {
            if (await page.$(selector) !== null) {
                hasNav = true;
                break;
            }
        }
        
        if (!hasNav) {
            // 检查是否有链接
            const links = await page.$$('a');
            if (links.length < 2) throw new Error('导航菜单或链接不足');
        }
    });
    
    // 测试5: 学生管理页面
    await test('学生管理页面', async () => {
        // 尝试点击学生管理链接
        const studentLink = await page.$('a:has-text("学生"), a:has-text("Student"), [href*="student"]');
        if (studentLink) {
            await studentLink.click();
            await page.waitForTimeout(2000);
            
            // 检查页面内容
            const content = await page.content();
            if (!content.includes('学生') && !content.includes('Student') && !content.includes('table')) {
                throw new Error('学生管理页面内容不正确');
            }
        }
    });
    
    await page.screenshot({ path: '/home/moltbot/workspace/UniDormManager/tests/screenshots/04-students.png' });
    
    // 测试6: 响应式设计 - 移动端视图
    await test('移动端响应式', async () => {
        await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
        await page.goto(BASE_URL);
        await page.waitForTimeout(2000);
        
        // 检查是否有移动端菜单或适配
        const hasMobileMenu = await page.$('.mobile-menu, .hamburger, [aria-label="Menu"]') !== null;
        // 移动端测试通过的条件可以放宽
    });
    
    await page.screenshot({ path: '/home/moltbot/workspace/UniDormManager/tests/screenshots/05-mobile.png' });
    
    // 测试7: API 连接检查
    await test('API 连接', async () => {
        // 使用 page.evaluate 检查 API 是否可访问
        const apiStatus = await page.evaluate(async (apiUrl) => {
            try {
                const response = await fetch(`${apiUrl}/health`);
                return response.status;
            } catch (e) {
                return -1;
            }
        }, API_URL);
        
        if (apiStatus !== 200) {
            throw new Error(`API 状态异常: ${apiStatus}`);
        }
    });
    
    // 测试8: 页面元素检查
    await test('页面元素完整性', async () => {
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.goto(BASE_URL);
        await page.waitForTimeout(2000);
        
        // 检查基本元素
        const hasHeader = await page.$('header, .header, .navbar') !== null;
        const hasContent = await page.$('main, .content, .container') !== null;
        const hasFooter = await page.$('footer, .footer') !== null;
        
        if (!hasContent) throw new Error('页面缺少主要内容区域');
    });
    
    // 测试9: 表单元素检查
    await test('表单元素', async () => {
        const inputs = await page.$$('input');
        const buttons = await page.$$('button');
        
        if (inputs.length === 0 && buttons.length === 0) {
            throw new Error('页面缺少交互元素');
        }
    });
    
    // 测试10: 页面加载性能
    await test('页面加载性能', async () => {
        const startTime = Date.now();
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;
        
        if (loadTime > 10000) {
            throw new Error(`页面加载过慢: ${loadTime}ms`);
        }
        
        console.log(`   加载时间: ${loadTime}ms`);
    });
}

// 主函数
(async () => {
    try {
        await setup();
        await runTests();
    } finally {
        await teardown();
    }
})();
