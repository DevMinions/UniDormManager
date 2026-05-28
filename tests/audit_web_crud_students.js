// Web 管理端 CRUD 深度 E2E:学生(Student)的 Create → Edit → Delete(UI 全闭环)
//
// 跟 audit_web_crud.js(Buildings)的差异:
// - Students 行内有 UI 删除按钮(icon + window.confirm),不像 Buildings 只能走 API
// - 编辑 / 删除按钮无文本,要用 title 属性定位
// - 学号 unique constraint:用 Date.now() 后 8 位避免历史脏数据
//
// 用法: ADMIN_PASS=admin123 node tests/audit_web_crud_students.js
//   预置: vite preview :3000 + 后端 :8082 + admin 账号可登

const { chromium } = require('playwright');

const WEB_BASE = process.env.WEB_BASE || 'http://localhost:3000';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';

const results = [];
const consoleErrors = [];

function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name} ${detail}`);
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

  // window.alert / confirm 处理:alert 全打到 consoleErrors 用于诊断,confirm 全 accept
  page.on('dialog', async d => {
    if (d.type() === 'alert') consoleErrors.push(`alert: ${d.message().slice(0, 200)}`);
    await d.accept();
  });

  const stamp = String(Date.now()).slice(-8);
  const uniqueName = `审核学生-${stamp}`;
  const studentId = `S${stamp}`;
  const major = '审核专业';
  const editedMajor = '审核专业-edited';

  try {
    // ─── Step 1:UI 登录 ─────────────────────────────────────────────
    await page.goto(WEB_BASE + '/#/login', { waitUntil: 'load', timeout: 15000 });
    await page.locator('input[type="text"], input[placeholder*="用户"], input[placeholder*="账号"]').first().fill(ADMIN_USER);
    await page.locator('input[type="password"]').first().fill(ADMIN_PASS);
    // 同 audit_web_crud:登录按钮 actionability 卡,force click 绕过
    await page.locator('button:has-text("登录"), button:has-text("登 录"), button[type="submit"]').first().click({ force: true });
    await page.waitForTimeout(2500);
    const loggedIn = !/login/i.test(page.url());
    check('UI 登录成功', loggedIn, `url=${page.url()}`);
    if (!loggedIn) throw new Error('login failed');

    // ─── Step 2:打开学生页 + 点"添加学生" ─────────────────────────
    await page.goto(WEB_BASE + '/#/students', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    await page.locator('button:has-text("添加学生")').click({ force: true });
    await page.waitForTimeout(500);
    // 用 modal 标题 h2 作为存在判定 — 顶部"添加学生"是 button,不是 modal
    const modalOpen = await page.locator('h2:has-text("添加学生")').count() === 1;
    check('Modal 打开(添加学生)', modalOpen);

    // ─── Step 3:填表 + 创建 ────────────────────────────────────────
    // input 顺序:姓名 / 学号 / 专业(label 兄弟定位,稳)
    const nameInput = page.locator('label:has-text("姓名")').locator('xpath=following-sibling::input[1]');
    const idInput = page.locator('label:has-text("学号")').locator('xpath=following-sibling::input[1]');
    const majorInput = page.locator('label:has-text("专业")').locator('xpath=following-sibling::input[1]');
    await nameInput.focus(); await nameInput.pressSequentially(uniqueName, { delay: 5 });
    await idInput.focus();   await idInput.pressSequentially(studentId, { delay: 5 });
    await majorInput.focus();await majorInput.pressSequentially(major, { delay: 5 });

    await page.locator('button:has-text("创建")').first().click({ force: true });
    await page.waitForTimeout(2000);

    const modalClosed = await page.locator('h2:has-text("添加学生")').count() === 0;
    check('Modal 关闭', modalClosed);

    // 列表显示新建项 + 用 search 验证后端 ILIKE 三列 OR(v0.2.2 fix)
    await page.waitForTimeout(800);
    const visibleNoFilter = await page.locator(`text=${uniqueName}`).count() > 0;
    check('列表显示新创建的学生(无过滤)', visibleNoFilter, `name=${uniqueName}`);
    const search = page.locator('input[placeholder*="搜索"]').first();
    await search.focus(); await search.pressSequentially(stamp, { delay: 5 });
    await page.waitForTimeout(1500);
    const visibleSearch = await page.locator(`text=${uniqueName}`).count() > 0;
    check('search 输入 stamp 后仍可见(三列 OR 生效)', visibleSearch, `stamp=${stamp}`);
    // 清空搜索准备下一步
    await search.focus(); await search.press('Control+a'); await search.press('Delete');
    await page.waitForTimeout(800);

    // ─── Step 4:行级编辑 → 改专业 ─────────────────────────────────
    // 行(tr)里包含 uniqueName,定位该 tr 内 title="编辑学生信息" 的 button
    const row = page.locator('tr', { hasText: uniqueName });
    const editBtn = row.locator('button[title="编辑学生信息"]');
    await editBtn.click({ force: true });
    await page.waitForTimeout(500);
    const editModal = await page.locator('h2:has-text("编辑学生")').count() === 1;
    check('Modal 打开(编辑学生)', editModal);

    const editMajorInput = page.locator('label:has-text("专业")').locator('xpath=following-sibling::input[1]');
    await editMajorInput.focus();
    await editMajorInput.press('Control+a');
    await editMajorInput.pressSequentially(editedMajor, { delay: 5 });

    const putPromise = page.waitForResponse(r => /\/api\/students\/[^/]+$/.test(r.url()) && r.request().method() === 'PUT', { timeout: 8000 }).catch(() => null);
    await page.locator('button:has-text("更新")').first().click({ force: true });
    const putRes = await putPromise;
    check('PUT /api/students/:id 2xx', putRes && putRes.status() < 400, `status=${putRes ? putRes.status() : 'n/a'}`);
    await page.waitForTimeout(1500);

    // 二次 goto 触发 reload(同 buildings 踩坑:hash 同 hash 不重挂载)
    await page.goto(WEB_BASE + '/#/', { waitUntil: 'load' });
    await page.waitForTimeout(800);
    await page.goto(WEB_BASE + '/#/students', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    // 同样:不用 search,新建的还在第一页(created_at DESC)
    const editedRowVisible = await page.locator('tr', { hasText: uniqueName }).locator(`text=${editedMajor}`).count() > 0;
    check('列表显示编辑后的专业', editedRowVisible, `major=${editedMajor}`);

    // ─── Step 5:行级 UI 删除 ──────────────────────────────────────
    const row2 = page.locator('tr', { hasText: uniqueName });
    const delBtn = row2.locator('button[title="删除学生"]');
    const delPromise = page.waitForResponse(r => /\/api\/students\/[^/]+$/.test(r.url()) && r.request().method() === 'DELETE', { timeout: 8000 }).catch(() => null);
    await delBtn.click({ force: true });
    // window.confirm 已被 page.on('dialog') 自动 accept
    const delRes = await delPromise;
    check('DELETE /api/students/:id 2xx', delRes && delRes.status() < 400, `status=${delRes ? delRes.status() : 'n/a'}`);
    await page.waitForTimeout(1500);

    // ─── Step 6:验已消失 ──────────────────────────────────────────
    await page.goto(WEB_BASE + '/#/', { waitUntil: 'load' });
    await page.waitForTimeout(800);
    await page.goto(WEB_BASE + '/#/students', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const goneFromUI = await page.locator(`text=${uniqueName}`).count() === 0;
    check('UI 列表中已删除的学生消失', goneFromUI);
  } catch (e) {
    check('未捕获异常', false, e.message.slice(0, 200));
  } finally {
    await ctx.close();
    await browser.close();
  }

  const pass = results.filter(r => r.ok).length;
  console.log(`\n== Web CRUD (Students) 汇总: ${pass}/${results.length} 通过 ==`);
  if (consoleErrors.length) {
    console.log(`\n控制台错误 (${consoleErrors.length} 条,前 10):`);
    consoleErrors.slice(0, 10).forEach(e => console.log('  - ' + e));
  }
  console.log('JSON_CRUD_STUDENTS=' + JSON.stringify({
    passed: pass,
    total: results.length,
    fails: results.filter(r => !r.ok),
    consoleErrors: consoleErrors.length,
  }));
  process.exit(pass === results.length ? 0 : 1);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
