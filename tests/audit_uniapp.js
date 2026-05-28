// UniApp H5 端 audit:走核心页面 + 抓 console error / failed API request
// 用法: WEB_BASE=http://localhost:5174 API_BASE=http://localhost:8082 \
//       node tests/audit_uniapp.js
// 前提: 1) UniApp build:h5 产物已起 http server  2) 后端在 :8082
const { chromium } = require('playwright');

const BASE   = process.env.WEB_BASE  || 'http://localhost:5174';
const API    = process.env.API_BASE  || 'http://localhost:8082';
const USER   = process.env.ADMIN_USER || 'admin';
const PASS   = process.env.ADMIN_PASS || 'admin123';
const CHROME = process.env.CHROME    || '/usr/bin/google-chrome';

const results = [];
const consoleErrors = [];
const failedReqs = [];

function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name} ${detail}`);
}

// UniApp pages.json 33 页里挑 12 个核心 + 高风险
const PAGES = [
  { hash: '#/pages/index/index',                label: '首页' },
  { hash: '#/pages/rooms/list',                  label: '房间列表' },
  { hash: '#/pages/repairs/list',                label: '报修列表' },
  { hash: '#/pages/notices/list',                label: '公告列表' },
  { hash: '#/pages/profile/index',               label: '个人中心' },
  { hash: '#/pages/inspections/list',            label: '查寝记录' },
  { hash: '#/pages/buildings/list',              label: '楼栋管理' },
  { hash: '#/pages/access-logs/list',            label: '门禁记录' },
  { hash: '#/pages/late-returns/list',           label: '晚归告警' },
  { hash: '#/pages/room-swaps/list',             label: '换寝申请' },
  { hash: '#/pages/admin/dashboard',             label: '管理后台' },
  { hash: '#/pages/messages/list',               label: '消息中心(无后端)' },
];

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME,
    args: ['--no-sandbox'],
  });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },           // iPhone 14
    deviceScaleFactor: 2,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Mobile/15E148',
  });
  const page = await ctx.newPage();

  page.on('pageerror',     e => consoleErrors.push(`pageerror: ${e.message}`));
  page.on('console',       m => {
    if (m.type() === 'error') consoleErrors.push(`console.error: ${m.text().slice(0, 200)}`);
  });
  page.on('requestfailed', r => failedReqs.push(`${r.method()} ${r.url()} ${r.failure()?.errorText}`));
  page.on('response',      r => {
    if (r.status() >= 400 && r.url().includes('/api/')) {
      failedReqs.push(`HTTP ${r.status()} ${r.request().method()} ${r.url()}`);
    }
  });

  // 1. 首页/index 加载
  const r = await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => null);
  check('SPA / 加载 200', r && r.status() === 200, `status=${r?.status()}`);

  // 2. UniApp 登录(可能跳到 #/pages/login/login)
  await page.waitForTimeout(1500);
  if (/login/i.test(page.url())) {
    const user = page.locator('input[type="text"], input[placeholder*="账号"], input[placeholder*="用户"]').first();
    const pass = page.locator('input[type="password"]').first();
    const btn  = page.locator('button:has-text("登录"), button:has-text("登 录"), .login-btn, .btn-login').first();
    try {
      await user.fill(USER);
      await pass.fill(PASS);
      await btn.click();
      await page.waitForTimeout(2500);
      check('登录跳出 login 页', !/login/i.test(page.url()), `url=${page.url()}`);
    } catch (e) {
      check('登录提交', false, `异常: ${e.message.slice(0, 120)}`);
    }
  } else {
    check('登录(已自动登录)', true);
  }

  // 3. 走每个核心页面
  for (const p of PAGES) {
    const beforeFails = failedReqs.length;
    const beforeErrs  = consoleErrors.length;
    await page.goto(BASE + '/' + p.hash, { waitUntil: 'load', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1800);
    const newFails = failedReqs.slice(beforeFails);
    const newErrs  = consoleErrors.slice(beforeErrs);
    const apiFails = newFails.filter(s => /HTTP [45]\d\d.*\/api\//.test(s)).length;
    const errUI    = await page.locator('text=/加载失败|出错|Error|404|500/i').count();
    const ok       = apiFails === 0;
    check(`页面 ${p.label} (${p.hash})`, ok,
      ok ? '' : `API失败=${apiFails} UI错误=${errUI} 控制台新错=${newErrs.length}`);
  }

  await browser.close();

  const passed = results.filter(r => r.ok).length;
  console.log(`\n== UniApp 汇总: ${passed}/${results.length} 通过 ==`);
  if (consoleErrors.length) {
    console.log(`\n控制台错误 (${consoleErrors.length} 条,去重后前 10):`);
    [...new Set(consoleErrors)].slice(0, 10).forEach(e => console.log('  - ' + e));
  }
  if (failedReqs.length) {
    console.log(`\n失败请求 (${failedReqs.length} 条,去重后前 15):`);
    [...new Set(failedReqs)].slice(0, 15).forEach(r => console.log('  - ' + r));
  }
  console.log('JSON_UNIAPP=' + JSON.stringify({
    passed,
    total: results.length,
    fails: results.filter(r => !r.ok),
    consoleErrors: consoleErrors.length,
    failedReqs: [...new Set(failedReqs)].length,
  }));
})().catch(e => { console.error('FATAL', e); process.exit(1); });
