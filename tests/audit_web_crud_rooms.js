// Web 管理端 CRUD 深度 E2E:房间(Room)的 Create → Edit → Delete(UI 全闭环)
//
// 跟 Students 的差异:
// - Rooms 表 ORDER BY building, number(不是 created_at DESC),新建的不一定第一页
//   靠 search input(BuildRoomQuery 已是 OR)定位
// - 必填字段含楼栋(select)— 不能空,要从 buildings 拿一个 existing
// - 容量 / 楼层是 number input
//
// 用法: ADMIN_PASS=admin123 node tests/audit_web_crud_rooms.js

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
  const roomNumber = `A${stamp}`;
  const newCapacity = 6;

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

    // ─── Step 2:拿 token + 一个 existing building name(供 select 用)
    const token = await page.evaluate(() => localStorage.getItem('token') || localStorage.getItem('access_token') || '');
    check('localStorage 取到 token', !!token, `len=${token.length}`);
    const blist = await api(token, 'GET', '/buildings');
    const buildings = blist.body?.data || blist.body || [];
    const buildingName = Array.isArray(buildings) && buildings.length ? buildings[0].name : '';
    check('从 API 拿到 existing building', !!buildingName, `name=${buildingName}`);
    if (!buildingName) throw new Error('no building available');

    // ─── Step 3:打开房间页 + 点"添加房间" ─────────────────────────
    await page.goto(WEB_BASE + '/#/rooms', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    await page.locator('button:has-text("添加房间")').click({ force: true });
    await page.waitForTimeout(500);
    const modalOpen = await page.locator('h2:has-text("添加房间")').count() === 1;
    check('Modal 打开(添加房间)', modalOpen);

    // ─── Step 4:填表 + 创建 ────────────────────────────────────────
    const numInput = page.locator('label:has-text("房间号")').locator('xpath=following-sibling::input[1]');
    await numInput.focus(); await numInput.pressSequentially(roomNumber, { delay: 5 });
    const buildingSelect = page.locator('label:has-text("楼栋")').locator('xpath=following-sibling::select[1]');
    await buildingSelect.selectOption(buildingName);
    // 容量、楼层用默认值即可。type="number" min=1 → 默认填了 number,不动
    await page.locator('button:has-text("创建")').first().click({ force: true });
    await page.waitForTimeout(2000);

    const modalClosed = await page.locator('h2:has-text("添加房间")').count() === 0;
    check('Modal 关闭', modalClosed);

    // 用 search input(BuildRoomQuery OR 工作)找新建的 room
    const search = page.locator('input[placeholder*="搜索"]').first();
    if (await search.count() > 0) {
      await search.focus(); await search.pressSequentially(roomNumber, { delay: 5 });
      await page.waitForTimeout(1500);
    }
    const visible = await page.locator(`text=${roomNumber}`).count() > 0;
    check('search + 列表显示新创建的房间', visible, `room=${roomNumber}`);

    // ─── Step 5:卡片级编辑 → 改容量(默认 grid view,不是 table)
    // 卡片根 div 含 `hover:shadow-md` + roomNumber 文本,唯一定位
    const card = page.locator('div.hover\\:shadow-md', { hasText: roomNumber });
    const cardCount = await card.count();
    check('能精确定位到新建房间的卡片', cardCount === 1, `count=${cardCount}`);
    if (cardCount !== 1) throw new Error('card locator ambiguous');
    const editBtn = card.locator('button:has-text("编辑")');
    await editBtn.click({ force: true });
    await page.waitForTimeout(500);
    const editModal = await page.locator('h2:has-text("编辑房间")').count() === 1;
    check('Modal 打开(编辑房间)', editModal);

    const capacityInput = page.locator('label:has-text("容量")').locator('xpath=following-sibling::input[1]');
    await capacityInput.focus();
    await capacityInput.press('Control+a');
    await capacityInput.pressSequentially(String(newCapacity), { delay: 5 });

    const putPromise = page.waitForResponse(r => /\/api\/rooms\/[^/]+$/.test(r.url()) && r.request().method() === 'PUT', { timeout: 8000 }).catch(() => null);
    await page.locator('button:has-text("更新")').first().click({ force: true });
    const putRes = await putPromise;
    check('PUT /api/rooms/:id 2xx', putRes && putRes.status() < 400, `status=${putRes ? putRes.status() : 'n/a'}`);
    await page.waitForTimeout(1500);

    // API 验证容量真改了(不依赖 UI search 重置)
    const list = await api(token, 'GET', '/rooms?page=1&pageSize=200');
    const rooms = list.body?.data || list.body || [];
    const target = Array.isArray(rooms) ? rooms.find(r => r.number === roomNumber) : null;
    check('API 列表能找到刚创建的 room', !!target, target ? `id=${target.id} capacity=${target.capacity}` : 'not found');
    check('容量已被改为新值', target && target.capacity === newCapacity, `capacity=${target?.capacity}`);

    // ─── Step 6:行级 UI 删除 ──────────────────────────────────────
    if (!target) throw new Error('cannot find target room for delete');

    // hash router 同 hash 二次 goto 不重挂载,先跳别处再回
    await page.goto(WEB_BASE + '/#/', { waitUntil: 'load' });
    await page.waitForTimeout(600);
    await page.goto(WEB_BASE + '/#/rooms', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const search2 = page.locator('input[placeholder*="搜索"]').first();
    if (await search2.count() > 0) {
      await search2.focus(); await search2.pressSequentially(roomNumber, { delay: 5 });
      await page.waitForTimeout(1500);
    }
    const card2 = page.locator('div.hover\\:shadow-md', { hasText: roomNumber });
    const delBtn = card2.locator('button:has-text("删除")');
    const delPromise = page.waitForResponse(r => /\/api\/rooms\/[^/]+$/.test(r.url()) && r.request().method() === 'DELETE', { timeout: 8000 }).catch(() => null);
    await delBtn.click({ force: true });
    const delRes = await delPromise;
    check('DELETE /api/rooms/:id 2xx', delRes && delRes.status() < 400, `status=${delRes ? delRes.status() : 'n/a'}`);
    await page.waitForTimeout(1500);

    // API 验证已消失
    const list2 = await api(token, 'GET', '/rooms?page=1&pageSize=200');
    const rooms2 = list2.body?.data || list2.body || [];
    const stillThere = Array.isArray(rooms2) && rooms2.find(r => r.number === roomNumber);
    check('API 列表中删除后的 room 消失', !stillThere);
  } catch (e) {
    check('未捕获异常', false, e.message.slice(0, 200));
  } finally {
    await ctx.close();
    await browser.close();
  }

  const pass = results.filter(r => r.ok).length;
  console.log(`\n== Web CRUD (Rooms) 汇总: ${pass}/${results.length} 通过 ==`);
  if (consoleErrors.length) {
    console.log(`\n控制台错误 (${consoleErrors.length} 条,前 10):`);
    consoleErrors.slice(0, 10).forEach(e => console.log('  - ' + e));
  }
  console.log('JSON_CRUD_ROOMS=' + JSON.stringify({
    passed: pass,
    total: results.length,
    fails: results.filter(r => !r.ok),
    consoleErrors: consoleErrors.length,
  }));
  process.exit(pass === results.length ? 0 : 1);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
