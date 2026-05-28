// Web 管理端业务流程 E2E:报修(RepairRequest)的 status workflow
//
// 跟 buildings/students/rooms 的 CRUD 不同 — Repairs 是 workflow:
//   Pending → (点 "开始维修") → In Progress → (点 "标记完成") → Completed
//   Repairs UI 无 Delete,创建后只能流转 status,验业务正确性
//
// 用法: ADMIN_PASS=admin123 node tests/audit_web_workflow_repairs.js

const { chromium } = require('playwright');

const WEB_BASE = process.env.WEB_BASE || 'http://localhost:3000';
const API_BASE = process.env.API_BASE || 'http://localhost:8082/api';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';

const results = [];
const consoleErrors = [];

function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name} ${detail}`);
}

async function api(token, method, path, body) {
  const res = await fetch(API_BASE + path, {
    method,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

(async () => {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: CHROME,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
  } catch (e) {
    console.log('chromium 启动失败:', e.message);
    process.exit(2);
  }

  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => consoleErrors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(`console.error: ${m.text().slice(0, 200)}`); });
  page.on('dialog', async d => {
    if (d.type() === 'alert') consoleErrors.push(`alert: ${d.message().slice(0, 200)}`);
    await d.accept();
  });

  const stamp = String(Date.now()).slice(-8);
  const title = `审核报修-${stamp}`;
  const roomNumber = `R${stamp}`;
  const description = '审核 e2e 自动产生的报修工单';

  try {
    // ─── Step 1:UI 登录 ─────────────────────────────────────────────
    await page.goto(WEB_BASE + '/#/login', { waitUntil: 'load', timeout: 15000 });
    await page.locator('input[type="text"], input[placeholder*="用户"], input[placeholder*="账号"]').first().fill(ADMIN_USER);
    await page.locator('input[type="password"]').first().fill(ADMIN_PASS);
    await page.locator('button:has-text("登录"), button:has-text("登 录"), button[type="submit"]').first().click({ force: true });
    await page.waitForTimeout(2500);
    const loggedIn = !/login/i.test(page.url());
    check('UI 登录成功', loggedIn, `url=${page.url()}`);
    if (!loggedIn) throw new Error('login failed');
    const token = await page.evaluate(() => localStorage.getItem('token') || localStorage.getItem('access_token') || '');

    // ─── Step 2:打开报修页 + 点"新建报修" ─────────────────────────
    await page.goto(WEB_BASE + '/#/repairs', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    await page.locator('button:has-text("新建报修")').click({ force: true });
    await page.waitForTimeout(500);
    const modalOpen = await page.locator('h3:has-text("新建报修单")').count() === 1;
    check('Modal 打开(新建报修单)', modalOpen);

    // ─── Step 3:填表(title / roomNumber / priority / description)
    const titleInput = page.locator('input[placeholder*="空调漏水"]');
    await titleInput.focus(); await titleInput.pressSequentially(title, { delay: 5 });
    const roomInput = page.locator('input[placeholder*="101"]');
    await roomInput.focus(); await roomInput.pressSequentially(roomNumber, { delay: 5 });
    const descTextarea = page.locator('textarea[placeholder*="详细描述故障"]');
    await descTextarea.focus(); await descTextarea.pressSequentially(description, { delay: 5 });

    const postPromise = page.waitForResponse(r => r.url().endsWith('/api/repairs') && r.request().method() === 'POST', { timeout: 8000 }).catch(() => null);
    await page.locator('button:has-text("提交报修")').click({ force: true });
    const postRes = await postPromise;
    check('POST /api/repairs 2xx', postRes && postRes.status() < 400, `status=${postRes ? postRes.status() : 'n/a'}`);
    await page.waitForTimeout(2000);

    const modalClosed = await page.locator('h3:has-text("新建报修单")').count() === 0;
    check('Modal 关闭', modalClosed);

    // ─── Step 4:API 验创建出来的报修 status='Pending'
    const list = await api(token, 'GET', '/repairs?page=1&pageSize=50');
    const repairs = list.body?.data || list.body || [];
    const target = Array.isArray(repairs) ? repairs.find(r => r.title === title) : null;
    check('API 列表能找到刚创建的报修', !!target, target ? `id=${target.id} status=${target.status}` : 'not found');
    check('初始 status = Pending', target && target.status === 'Pending', `status=${target?.status}`);
    if (!target) throw new Error('cannot find target repair');
    const repairId = target.id;

    // ─── Step 5:UI 点"开始维修" → Pending → In Progress
    // 卡片根 div 含 transition-all + title 文本,定位
    const card = page.locator('div.transition-all', { hasText: title });
    const cardCount = await card.count();
    check('能精确定位到新建报修的卡片', cardCount === 1, `count=${cardCount}`);
    if (cardCount !== 1) throw new Error('card locator ambiguous');

    const startBtn = card.locator('button:has-text("开始维修")');
    const putPromise1 = page.waitForResponse(r => /\/api\/repairs\/[^/]+$/.test(r.url()) && r.request().method() === 'PUT', { timeout: 8000 }).catch(() => null);
    await startBtn.click({ force: true });
    const putRes1 = await putPromise1;
    check('PUT /repairs/:id/status (Pending→In Progress) 2xx', putRes1 && putRes1.status() < 400, `status=${putRes1 ? putRes1.status() : 'n/a'}`);
    await page.waitForTimeout(1500);

    // API 验
    const t2 = await api(token, 'GET', `/repairs/${repairId}`);
    check('API 状态 = In Progress', t2.body && t2.body.status === 'In Progress', `status=${t2.body?.status}`);

    // ─── Step 6:UI 点"标记完成" → In Progress → Completed
    // 重新定位卡片(reload 拉新数据后 cards 会重新挂载)
    const card2 = page.locator('div.transition-all', { hasText: title });
    const completeBtn = card2.locator('button:has-text("标记完成")');
    const putPromise2 = page.waitForResponse(r => /\/api\/repairs\/[^/]+$/.test(r.url()) && r.request().method() === 'PUT', { timeout: 8000 }).catch(() => null);
    await completeBtn.click({ force: true });
    const putRes2 = await putPromise2;
    check('PUT /repairs/:id/status (In Progress→Completed) 2xx', putRes2 && putRes2.status() < 400, `status=${putRes2 ? putRes2.status() : 'n/a'}`);
    await page.waitForTimeout(1500);

    const t3 = await api(token, 'GET', `/repairs/${repairId}`);
    check('API 状态 = Completed', t3.body && t3.body.status === 'Completed', `status=${t3.body?.status}`);

    // ─── Step 7:Completed 卡片不再显示流转按钮
    const card3 = page.locator('div.transition-all', { hasText: title });
    const hasStart = await card3.locator('button:has-text("开始维修")').count();
    const hasComplete = await card3.locator('button:has-text("标记完成")').count();
    check('Completed 卡片无"开始维修"按钮', hasStart === 0, `count=${hasStart}`);
    check('Completed 卡片无"标记完成"按钮', hasComplete === 0, `count=${hasComplete}`);
  } catch (e) {
    check('未捕获异常', false, e.message.slice(0, 200));
  } finally {
    await ctx.close();
    await browser.close();
  }

  const pass = results.filter(r => r.ok).length;
  console.log(`\n== Web Workflow (Repairs) 汇总: ${pass}/${results.length} 通过 ==`);
  if (consoleErrors.length) {
    console.log(`\n控制台错误 (${consoleErrors.length} 条,前 10):`);
    consoleErrors.slice(0, 10).forEach(e => console.log('  - ' + e));
  }
  console.log('JSON_WORKFLOW_REPAIRS=' + JSON.stringify({
    passed: pass,
    total: results.length,
    fails: results.filter(r => !r.ok),
    consoleErrors: consoleErrors.length,
  }));
  process.exit(pass === results.length ? 0 : 1);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
