import { createRequire } from 'node:module';
import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { CONTENT as C } from '../src/config/content.vi.ts';

const require = createRequire(join(process.env.TEMP, 'doita-review-browser', 'package.json'));
const { chromium } = require('playwright');
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
const page = await context.newPage();
const failures = [];
page.on('pageerror', error => failures.push(error.message));
const requests = [];
let rejectSignup = true;
await context.route(process.env.NEXT_PUBLIC_SUPABASE_URL + '/**', async route => {
  if (route.request().url().includes('/auth/v1/signup')) {
    requests.push(route.request().postDataJSON());
    return route.fulfill(rejectSignup
      ? { status: 400, headers: { 'x-supabase-api-version': '2024-01-01' }, json: { code: 'user_already_exists', message: 'User already registered' } }
      : { json: { user: { id: '00000000-0000-0000-0000-000000000009', email: 'signup@example.com', user_metadata: requests.at(-1).data, identities: [], aud: 'authenticated', created_at: new Date().toISOString() }, session: null } });
  }
  return route.fulfill({ status: 400, json: { message: 'Unexpected fixture request' } });
});
try {
  await page.goto('http://localhost:3100/auth');
  await page.getByRole('button', { name: C.auth.switchSignUp, exact: true }).click();
  assert.equal(await page.getByText(C.brand.name, { exact: true }).count(), 1);
  await page.getByLabel(C.auth.email, { exact: true }).fill('signup@example.com');
  await page.getByLabel(C.auth.name, { exact: true }).fill('  Tài  ');
  await page.getByLabel(C.auth.password, { exact: true }).fill('password123');
  const gender = page.getByRole('combobox', { name: C.profile.gender, exact: true });
  assert.equal(await gender.getAttribute('data-value'), '');
  await page.getByRole('button', { name: C.auth.signUp, exact: true }).click();
  await page.locator('.field-error').filter({ hasText: C.auth.chooseGender }).waitFor();
  await gender.evaluate(el => { if (document.activeElement !== el) throw new Error('Missing gender should receive focus'); });
  assert.equal(requests.length, 0);
  await gender.press('ArrowDown');
  assert.equal(await page.getByRole('option', { name: C.profile.genders.unset, exact: true }).count(), 0);
  await page.getByRole('option', { name: C.profile.genders.female, exact: true }).click();
  await page.getByRole('button', { name: C.auth.signUp, exact: true }).click();
  await page.getByText(C.errors.emailExists, { exact: true }).waitFor();
  assert.equal(await gender.getAttribute('data-value'), 'female');
  assert.equal(await page.getByLabel(C.auth.name, { exact: true }).inputValue(), '  Tài  ');
  assert.equal(requests[0].data.gender, 'female');
  assert.equal(requests[0].data.display_name, 'Tài');
  rejectSignup = false;
  await page.getByRole('button', { name: C.auth.signUp, exact: true }).click();
  await page.getByText(C.auth.confirm, { exact: true }).waitFor();
  assert.equal(requests.length, 2);
  await mkdir('doita-test/signup-evidence', { recursive: true });
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await gender.click();
    await page.getByRole('listbox').waitFor();
    const bounds = await page.getByRole('listbox').boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width + 1);
    await gender.press('Escape');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    if (width !== 320) await page.screenshot({ path: `doita-test/signup-evidence/signup-${width}.png`, fullPage: true });
  }
  await page.getByRole('button', { name: C.auth.switchSignIn, exact: true }).click();
  assert.equal(await page.getByRole('combobox', { name: C.profile.gender, exact: true }).count(), 0);
  assert.deepEqual(failures, []);
  console.log('PASS signup: one brand name, explicit gender required, keyboard/focus, metadata, retry preserves fields, confirmation, login unchanged, 320/390/1440px');
} catch (error) {
  console.log('Signup fixture requests:', requests.length);
  console.log('Visible field errors:', await page.locator('.field-error').allTextContents());
  console.log('Visible feedback:', await page.locator('.toast').allTextContents());
  throw error;
} finally {
  await browser.close();
}
