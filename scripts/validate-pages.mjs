import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const outputRoot = path.join(rootDir, '.artifacts', 'screenshots');
const baseUrl = 'http://127.0.0.1:5173';
const viewports = [
  { name: '375', width: 375, height: 812 },
  { name: '428', width: 428, height: 926 },
  { name: '1440', width: 1440, height: 960 },
];

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function waitForQuiet(page) {
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.waitForTimeout(300);
}

async function screenshot(page, dir, name) {
  await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: true });
}

async function collect(page, errors, kind, text, location) {
  errors.push({ kind, text, location: location ? `${location.url || ''}:${location.lineNumber || ''}` : '' });
}

for (const viewport of viewports) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      collect(page, errors, 'console', msg.text(), msg.location()).catch(() => undefined);
    }
  });
  page.on('pageerror', (error) => {
    errors.push({ kind: 'pageerror', text: error.message, location: '' });
  });

  const dir = path.join(outputRoot, viewport.name);
  await ensureDir(dir);

  await page.goto(baseUrl);
  await waitForQuiet(page);
  await screenshot(page, dir, 'home');

  await page.goto(`${baseUrl}/order`);
  await waitForQuiet(page);
  await screenshot(page, dir, 'order');

  const addButtons = page.locator('.fab-mini, .quantity-stepper button:last-child');
  const addCount = await addButtons.count();
  for (let index = 0; index < Math.min(2, addCount); index += 1) {
    await addButtons.nth(index).click();
    await page.waitForTimeout(250);
  }

  const isMobileLayout = viewport.width < 1200;
  if (isMobileLayout) {
    await page.locator('.selection-bar').click();
    await page.waitForTimeout(300);
  }
  await page.getByRole('button', { name: '生成菜单' }).click();
  await waitForQuiet(page);
  await screenshot(page, dir, 'menu-preview');

  await page.goto(`${baseUrl}/recipes`);
  await waitForQuiet(page);
  await screenshot(page, dir, 'recipes');

  await page.locator('.recipe-card').first().click();
  await waitForQuiet(page);
  await screenshot(page, dir, 'recipe-detail');

  await page.getByRole('link', { name: '编辑' }).first().click();
  await waitForQuiet(page);
  await screenshot(page, dir, 'recipe-edit');

  await page.goto(`${baseUrl}/history`);
  await waitForQuiet(page);
  await screenshot(page, dir, 'history');

  if (viewport.width >= 1200) {
    await page.locator('.history-card--desktop-row').first().click();
    await page.waitForTimeout(250);
    await screenshot(page, dir, 'history-preview');
    await page.getByRole('link', { name: '查看详情' }).click();
  } else {
    await page.locator('.history-card a').first().click();
  }

  await waitForQuiet(page);
  await screenshot(page, dir, 'menu-detail');

  await page.getByRole('link', { name: '查看采购清单' }).click();
  await waitForQuiet(page);
  await screenshot(page, dir, 'ingredients');

  await page.goto(`${baseUrl}/profile`);
  await waitForQuiet(page);
  await screenshot(page, dir, 'profile');

  await fs.writeFile(path.join(dir, 'console-errors.json'), JSON.stringify(errors, null, 2), 'utf8');
  console.log(JSON.stringify({ viewport: viewport.name, screenshots: dir, errorCount: errors.length }, null, 2));

  await browser.close();
}
