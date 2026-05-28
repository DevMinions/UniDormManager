// Web 管理端 E2E 冒烟（审核用）。借用系统 google-chrome 跑 Playwright。
// 用法: node tests/audit_web.js  （需 vite preview 在 :3000，后端在 :8082）
const { chromium } = require('playwright');

const BASE = process.env.WEB_BASE || 'http://localhost:3000';
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const results = [];
const consoleErrors = [];
const failedRequests = [];

function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name} ${detail}`);
}

async function withPage(browser, fn) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => consoleErrors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(`console.error: ${m.text().slice(0, 200)}`); });
  page.on('requestfailed', r => failedRequests.push(`${r.method()} ${r.url()} ${r.failure()?.errorText}`));
  page.on('response', r => { if (r.status() >= 400) failedRequests.push(`HTTP ${r.status()} ${r.request().method()} ${r.url()}`); });
  try { await fn(page); } finally { await ctx.close(); }
}

(async () => {
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox'] });
  } catch (e) { console.log('chromium 启动失败:', e.message); process.exit(2); }

  // 1) 首页加载
  await withPage(browser, async (page) => {
    const r = await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 20000 }).catch(e => null);
    check('首页/index.html 200', r && r.status() === 200, `status=${r?.status()}`);
    const hasRoot = await page.locator('#root').count() > 0;
    check('#root 容器存在', hasRoot);
    // SPA 是 hash router，默认会跳到 #/login
    await page.waitForTimeout(800);
    const url = page.url();
    check('SPA 跳转到登录页', /login/i.test(url) || /#\/login/.test(url), `url=${url}`);
  });

  // 2) 登录页元素
  await withPage(browser, async (page) => {
    await page.goto(BASE + '/#/login', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(500);
    const inputs = await page.locator('input').count();
    const buttons = await page.locator('button').count();
    check('登录页输入框 >= 2', inputs >= 2, `inputs=${inputs}`);
    check('登录页按钮 >= 1', buttons >= 1, `buttons=${buttons}`);
  });

  // 3) 登录 + 导航 + 各页面冒烟
  await withPage(browser, async (page) => {
    await page.goto(BASE + '/#/login', { waitUntil: 'networkidle' });
    // 找用户名/密码输入框（按 placeholder 或 type）
    const userInput = page.locator('input[type="text"], input[placeholder*="用户"], input[placeholder*="账号"]').first();
    const passInput = page.locator('input[type="password"]').first();
    const loginBtn  = page.locator('button:has-text("登录"), button:has-text("登 录"), button[type="submit"]').first();
    try {
      await userInput.fill('admin');
      await passInput.fill('admin123');
      await loginBtn.click();
      await page.waitForTimeout(2500);
    } catch (e) {
      check('登录提交', false, `异常: ${e.message.slice(0,120)}`); return;
    }
    const after = page.url();
    const loggedIn = !/login/i.test(after) || (await page.locator('text=退出').count()) > 0;
    check('登录成功跳转', loggedIn, `url=${after}`);
    if (!loggedIn) return;

    // 各主要页面冒烟（hash 路由）
    const pages = [
      ['#/', '仪表板'],
      ['#/students', '学生管理'],
      ['#/buildings', '楼栋'],
      ['#/rooms', '房间管理'],
      ['#/repairs', '报修'],
      ['#/notices', '公告'],
      ['#/users', '用户管理'],
      ['#/roles', '角色管理'],
      ['#/inspections', '查寝'],
      ['#/exchange-requests', '调宿'],
      ['#/access-logs', '门禁记录'],
    ];
    for (const [hash, label] of pages) {
      const before = failedRequests.length;
      await page.goto(BASE + '/' + hash, { waitUntil: 'load', timeout: 12000 }).catch(()=>{});
      await page.waitForTimeout(1200);
      const newFails = failedRequests.slice(before);
      const errorVisible = await page.locator('text=/加载失败|出错|Error|500|403/i').count() > 0;
      const ok = !errorVisible && newFails.filter(s=>/HTTP [45]\d\d.*\/api\//.test(s)).length === 0;
      check(`页面 ${label} (${hash})`, ok,
        ok ? '' : `API 失败=${newFails.filter(s=>/HTTP [45]\d\d/.test(s)).length} 错误UI=${errorVisible}`);
    }
  });

  await browser.close();

  // 汇总
  const pass = results.filter(r => r.ok).length;
  console.log(`\n== Web 汇总: ${pass}/${results.length} 通过 ==`);
  if (consoleErrors.length) {
    console.log(`\n控制台错误 (${consoleErrors.length} 条，前 10):`);
    consoleErrors.slice(0, 10).forEach(e => console.log('  - ' + e));
  }
  if (failedRequests.length) {
    console.log(`\n失败请求 (${failedRequests.length} 条，去重后前 15):`);
    const uniq = [...new Set(failedRequests)];
    uniq.slice(0, 15).forEach(r => console.log('  - ' + r));
  }
  console.log('JSON_WEB=' + JSON.stringify({
    passed: pass, total: results.length,
    fails: results.filter(r=>!r.ok),
    consoleErrors: consoleErrors.length, failedRequests: [...new Set(failedRequests)].length
  }));
})().catch(e => { console.error('FATAL', e); process.exit(1); });
