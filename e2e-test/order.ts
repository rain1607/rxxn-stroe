import { chromium, Locator, Page } from 'playwright';
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const PREFIX = 'order';
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4200';
const OUT_DIR = join(__dirname, '..', 'manuals');

const pick = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const digits = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');

let step = 0;

/** ครอบกรอบแดงรอบ element แล้วบันทึกภาพ (ถ้าไม่มี element ถ่ายทั้งหน้า) */
async function shot(page: Page, name: string, target?: Locator) {
  const file = join(OUT_DIR, `${PREFIX}-${String(++step).padStart(2, '0')}-${name}.png`);
  if (target) {
    await target.scrollIntoViewIfNeeded();
    await target.evaluate(
      (el, n) => {
        const e = el as HTMLElement;
        e.dataset.prevOutline = e.style.outline;
        e.style.outline = '4px solid red';
        e.style.outlineOffset = '3px';
        // วงกลมเลขลำดับมุมซ้ายบนของกรอบ (เลขเดียวกับลำดับในคู่มือ)
        const r = e.getBoundingClientRect();
        const b = document.createElement('div');
        b.id = '__e2e_badge';
        b.textContent = String(n);
        b.style.cssText = `position:absolute;z-index:99999;width:32px;height:32px;border-radius:50%;background:red;color:#fff;font:bold 18px sans-serif;display:flex;align-items:center;justify-content:center;left:${Math.max(0, r.left + scrollX - 16)}px;top:${Math.max(0, r.top + scrollY - 16)}px`;
        document.body.appendChild(b);
      },
      step,
    );
  }
  await page.screenshot({ path: file });
  if (target) {
    await target.evaluate((el) => {
      const e = el as HTMLElement;
      e.style.outline = e.dataset.prevOutline ?? '';
      document.getElementById("__e2e_badge")?.remove();
    });
  }
  console.log('saved', file);
}

/** highlight + ถ่ายภาพ แล้วคลิกจริง */
async function clickShot(page: Page, name: string, target: Locator) {
  await shot(page, name, target);
  await target.click();
}

async function fillShot(page: Page, name: string, target: Locator, value: string) {
  await target.fill(value);
  await shot(page, name, target);
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const f of readdirSync(OUT_DIR)) if (f.startsWith(PREFIX + '-')) rmSync(join(OUT_DIR, f));

  // ตะกร้าเก็บที่ฝั่งเซิร์ฟเวอร์ ต้องล้างก่อนเพื่อให้ผลทดสอบแน่นอน
  await fetch(`${process.env.API_URL ?? 'http://localhost:3000'}/api/cart`, { method: 'DELETE' });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto(BASE_URL);
  await page.getByTestId('product-card').first().waitFor();
  await shot(page, 'home');

  // 1) เพิ่มสินค้า 3 อย่างลงตะกร้า
  const count = await page.getByTestId('product-card').count();
  const idx = [...Array(count).keys()].sort(() => Math.random() - 0.5).slice(0, 3);
  for (const [n, i] of idx.entries()) {
    await clickShot(page, `select-product-${n + 1}`, page.getByTestId('product-card').nth(i));
    const add = page.getByTestId('add-to-cart');
    await add.waitFor();
    await clickShot(page, `add-to-cart-${n + 1}`, add);
    await page.getByRole('status').waitFor();
    await page.waitForLoadState('networkidle');
    await page.locator('a.logo').click();
    await page.getByTestId('product-card').first().waitFor();
  }

  // 2) เข้าหน้าตะกร้า
  await clickShot(page, 'open-cart', page.getByTestId('cart-link'));
  await page.getByTestId('cart-line').first().waitFor();
  if ((await page.getByTestId('cart-line').count()) !== 3) throw new Error('คาดว่ามี 3 รายการในตะกร้า');
  await shot(page, 'cart');
  await clickShot(page, 'go-checkout', page.getByRole('link', { name: 'ไปชำระเงิน' }));

  // 3) กรอกข้อมูลจัดส่งแบบสุ่ม
  await page.getByRole('heading', { name: 'ชำระเงิน', exact: true }).waitFor();
  const name = `${pick(['สมชาย', 'สมหญิง', 'วิชัย', 'มาลี', 'ธนากร'])} ${pick(['ใจดี', 'รักไทย', 'สุขสม', 'มั่นคง'])}`;
  await fillShot(page, 'fill-name', page.getByLabel('ชื่อ-นามสกุล'), name);
  await fillShot(page, 'fill-phone', page.getByLabel('เบอร์โทรศัพท์'), `08${digits(8)}`);
  await fillShot(page, 'fill-email', page.getByLabel('อีเมล'), `test${digits(5)}@example.com`);
  await fillShot(page, 'fill-address', page.getByLabel('ที่อยู่'), `${digits(2)}/${digits(1)} ถนน${pick(['สุขุมวิท', 'สีลม', 'พหลโยธิน'])}`);
  await fillShot(page, 'fill-province', page.getByLabel('จังหวัด'), pick(['กรุงเทพมหานคร', 'เชียงใหม่', 'ขอนแก่น', 'ภูเก็ต']));
  await fillShot(page, 'fill-zipcode', page.getByLabel('รหัสไปรษณีย์'), `1${digits(4)}`);
  await clickShot(page, 'select-shipping', page.locator('label.opt', { hasText: pick(['จัดส่งมาตรฐาน', 'จัดส่งด่วน']) }).first());

  const method = pick(['พร้อมเพย์', 'เก็บเงินปลายทาง', 'บัตรเครดิต']);
  await clickShot(page, 'select-payment', page.locator('label.opt', { hasText: method }));
  if (method === 'บัตรเครดิต') {
    await fillShot(page, 'fill-card', page.getByLabel('หมายเลขบัตร'), '4111111111111111');
    await fillShot(page, 'fill-expiry', page.getByLabel('วันหมดอายุ'), '12/30');
    await fillShot(page, 'fill-cvv', page.getByLabel('รหัส CVV'), '123');
  }

  // 4) ยืนยันการสั่งซื้อ
  await clickShot(page, 'place-order', page.getByRole('button', { name: 'ยืนยันการสั่งซื้อ' }));
  await page.getByRole('heading', { name: 'สั่งซื้อสำเร็จ' }).waitFor();
  await shot(page, 'order-success');

  await browser.close();
  console.log(`เสร็จสิ้น: ${step} ภาพใน ${OUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
