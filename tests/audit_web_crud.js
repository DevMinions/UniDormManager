// Web 管理端 CRUD 深度 E2E:楼栋(Building)的 Create → Edit → API Delete → 列表同步
//
// 为什么单独成文:
// - audit_web.js 只验"页面打开 / 表格存在 / 无 4xx-5xx 网络错误",
//   不会发现 form 字段绑定错、列表刷新缺失等 UI bug。
// - 完整 UI CRUD 脚本独立运行,失败时不污染 audit_web 基线。
// - 选 Buildings 因为字段少(name/type/floors/manager/description),
//   UI Modal 直接,Modal 关闭后列表自动 reload。
//
// 用法: node tests/audit_web_crud.js
//   预置: vite preview :3000 + 后端 :8082 + admin 账号可登
//   env:  WEB_BASE, API_BASE, ADMIN_USER, ADMIN_PASS, CHROME
//
// 注意 Building 没有 UI Delete 按钮(产品决策:防误删),Delete 走 API 直调。

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
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
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

  const uniqueName = `Audit-${Date.now()}`;
  const editedManager = 'audit-bot-edited';

  try {
    // ─── Step 1:UI 登录 ─────────────────────────────────────────────
    await page.goto(WEB_BASE + '/#/login', { waitUntil: 'load', timeout: 15000 });
    await page.locator('input[type="text"], input[placeholder*="用户"], input[placeholder*="账号"]').first().fill(ADMIN_USER);
    await page.locator('input[type="password"]').first().fill(ADMIN_PASS);
    // 登录按钮 actionability 会卡(framer-motion / transition);force 直接发事件
    await page.locator('button:has-text("登录"), button:has-text("登 录"), button[type="submit"]').first().click({ force: true });
    await page.waitForTimeout(2500);
    const loggedIn = !/login/i.test(page.url());
    check('UI 登录成功', loggedIn, `url=${page.url()}`);
    if (!loggedIn) throw new Error('login failed');

    // 从 localStorage 拿 token,后面给 API Delete 用
    const token = await page.evaluate(() => {
      return localStorage.getItem('token') || localStorage.getItem('access_token') || localStorage.getItem('jwt') || '';
    });
    check('localStorage 取到 token', !!token, token ? `len=${token.length}` : '');

    // ─── Step 2:打开楼栋页 + 点"添加楼栋" 弹 Modal ──────────────────
    await page.goto(WEB_BASE + '/#/buildings', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    await page.locator('button:has-text("添加楼栋")').click({ force: true });
    await page.waitForTimeout(500);
    const modalOpen = await page.locator('text=添加新楼栋').count() > 0;
    check('Modal 打开(添加新楼栋)', modalOpen);

    // ─── Step 3:填表 + 保存 ────────────────────────────────────────
    await page.locator('input[placeholder*="例如"]').fill(uniqueName);
    await page.locator('input[placeholder*="负责人"]').fill('audit-bot');
    await page.locator('button:has-text("确认添加")').click({ force: true });
    await page.waitForTimeout(2000);

    const modalClosed = await page.locator('text=添加新楼栋').count() === 0;
    check('Modal 关闭', modalClosed);

    // 列表里出现刚创建的项(名字唯一,直接 text 匹配)
    const inListAfterCreate = await page.locator(`text=${uniqueName}`).count() > 0;
    check('列表显示新创建的楼栋', inListAfterCreate, `name=${uniqueName}`);

    // ─── Step 4:行级"编辑信息" → 改 manager ──────────────────────
    // 卡片(class 含 rounded-2xl)里包含 uniqueName 文本的那一个,再找该卡片内的"编辑信息"按钮。
    // 不能 fallback 到全局 .first()——会改到列表第一个楼栋,而不是新建的。
    const card = page.locator('div.rounded-2xl', { hasText: uniqueName });
    const cardCount = await card.count();
    check('能精确定位到新建楼栋的卡片', cardCount === 1, `count=${cardCount}`);
    if (cardCount !== 1) throw new Error('card locator ambiguous');
    const editBtn = card.locator('button:has-text("编辑信息")');
    await editBtn.click({ force: true });
    await page.waitForTimeout(500);
    const editModal = await page.locator('text=编辑楼栋信息').count() > 0;
    check('Modal 打开(编辑楼栋信息)', editModal);

    // 改 manager:用 label 兄弟定位。
    // Playwright fill 在 React controlled input 上不一定触发 onChange(value 进了 DOM 但 state 未更新),
    // 所以用 select-all + type 走真键盘事件:
    const managerInput = page.locator('label:has-text("管理员")').locator('xpath=following-sibling::input[1]');
    // input.click() 也会受 actionability 卡(modal 入场动画),force focus
    await managerInput.focus();
    await managerInput.press('Control+a');
    await managerInput.pressSequentially(editedManager, { delay: 10 });
    const filledValue = await managerInput.inputValue();
    check('manager input 已填入新值', filledValue === editedManager, `actual=${filledValue}`);

    // 抓 PUT 请求体 + 响应,debug 用
    const putPromise = page.waitForResponse(r => /\/api\/buildings\/[^/]+$/.test(r.url()) && r.request().method() === 'PUT', { timeout: 8000 }).catch(() => null);
    await page.locator('button:has-text("保存更改")').click({ force: true });
    const putRes = await putPromise;
    const putBody = putRes ? await putRes.text().catch(()=>'') : '';
    const putReqBody = putRes ? putRes.request().postData() : '';
    check('PUT 请求 body 含编辑后的 manager', /audit-bot-edited/.test(putReqBody || ''), `body=${(putReqBody||'').slice(0,160)}`);
    await page.waitForTimeout(800);

    // 别 reload(reload 可能丢登录态),直接重新拉 /#/buildings,触发列表重渲
    await page.goto(WEB_BASE + '/#/buildings', { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    const urlNow = page.url();
    const managerVisible = await page.locator(`text=${editedManager}`).count() > 0;
    check('列表显示编辑后的 manager', managerVisible, `manager=${editedManager} url=${urlNow}`);

    // ─── Step 5:API 拿到 building id 然后 Delete ──────────────────
    const list = await api(token, 'GET', '/buildings');
    check('GET /api/buildings → 200', list.status === 200, `status=${list.status}`);
    const buildings = list.body?.data || list.body || [];
    const target = Array.isArray(buildings) ? buildings.find(b => b.name === uniqueName) : null;
    check('API 返回里能找到刚创建的项', !!target, target ? `id=${target.id}` : 'not found');

    if (target) {
      const del = await api(token, 'DELETE', `/buildings/${target.id}`);
      check('DELETE /api/buildings/:id → 2xx', del.status >= 200 && del.status < 300, `status=${del.status}`);

      // ─── Step 6:验已消失 ────────────────────────────────────
      // hash router 同 hash 二次 goto 不重新挂载组件,先跳 dashboard 再回来才能触发 fetch
      await page.goto(WEB_BASE + '/#/', { waitUntil: 'load' });
      await page.waitForTimeout(800);
      await page.goto(WEB_BASE + '/#/buildings', { waitUntil: 'load' });
      await page.waitForTimeout(2500);
      const goneFromUI = await page.locator(`text=${uniqueName}`).count() === 0;
      check('UI 列表中删除后的楼栋已消失', goneFromUI);
    }
  } catch (e) {
    check('未捕获异常', false, e.message.slice(0, 200));
  } finally {
    await ctx.close();
    await browser.close();
  }

  // 汇总
  const pass = results.filter(r => r.ok).length;
  console.log(`\n== Web CRUD 汇总: ${pass}/${results.length} 通过 ==`);
  if (consoleErrors.length) {
    console.log(`\n控制台错误 (${consoleErrors.length} 条,前 10):`);
    consoleErrors.slice(0, 10).forEach(e => console.log('  - ' + e));
  }
  console.log('JSON_CRUD=' + JSON.stringify({
    passed: pass,
    total: results.length,
    fails: results.filter(r => !r.ok),
    consoleErrors: consoleErrors.length,
  }));
  process.exit(pass === results.length ? 0 : 1);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
