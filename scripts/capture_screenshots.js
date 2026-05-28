// 自动抓取 Web 管理端关键页面截图，输出到 docs/screenshots/
// 依赖：根目录 npm install 过 playwright；系统 google-chrome 提供 chromium 替代
// 运行：node scripts/capture_screenshots.js
// 前提：后端跑在 :8082，vite preview 跑在 :3000，admin 账号有效

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.WEB_BASE || 'http://localhost:3000';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const OUT_DIR = path.resolve(__dirname, '../docs/screenshots');

const PAGES = [
  { hash: '#/login',              file: '01-login.png',     label: '登录' },
  { hash: '#/',                   file: '02-dashboard.png', label: '仪表板' },
  { hash: '#/students',           file: '03-students.png',  label: '学生管理' },
  { hash: '#/buildings',          file: '04-buildings.png', label: '楼栋' },
  { hash: '#/rooms',              file: '05-rooms.png',     label: '房间管理' },
  { hash: '#/repairs',            file: '06-repairs.png',   label: '报修' },
  { hash: '#/notices',            file: '07-notices.png',   label: '公告' },
  { hash: '#/inspections',        file: '08-inspections.png', label: '查寝' },
  { hash: '#/access-logs',        file: '09-access-logs.png', label: '门禁记录' },
];

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME,
    args: ['--no-sandbox'],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // Retina 清晰度
  });
  const page = await ctx.newPage();

  // 第一张 = 登录页快照
  await page.goto(BASE + '/' + PAGES[0].hash, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT_DIR, PAGES[0].file) });
  console.log('captured', PAGES[0].file);

  // 登录
  const user = page.locator('input[type="text"], input[placeholder*="用户"], input[placeholder*="账号"]').first();
  const pass = page.locator('input[type="password"]').first();
  const btn = page.locator('button:has-text("登录"), button:has-text("登 录"), button[type="submit"]').first();
  await user.fill(ADMIN_USER);
  await pass.fill(ADMIN_PASS);
  await btn.click();
  await page.waitForTimeout(2500);
  if (/login/i.test(page.url())) {
    console.error('登录失败，URL:', page.url(), '\n请确认 ADMIN_USER/ADMIN_PASS 正确。');
    await browser.close();
    process.exit(2);
  }

  // 抓登录后的页面
  for (const p of PAGES.slice(1)) {
    await page.goto(BASE + '/' + p.hash, { waitUntil: 'load' });
    await page.waitForTimeout(1500); // 让图表/数据渲染
    await page.screenshot({ path: path.join(OUT_DIR, p.file) });
    console.log('captured', p.file);
  }

  await browser.close();
  console.log(`\nDone. ${PAGES.length} screenshots in ${OUT_DIR}`);
})().catch(e => {
  console.error('FATAL', e);
  process.exit(1);
});
