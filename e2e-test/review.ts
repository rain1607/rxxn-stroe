import { chromium, Locator, Page } from 'playwright';
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const PREFIX = 'review';
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4200';
const OUT_DIR = join(__dirname, '..', 'manuals');

const pick = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const assert = (ok: boolean, msg: string) => {
  if (!ok) throw new Error('ASSERT: ' + msg);
};

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

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto(BASE_URL);
  await page.getByTestId('product-card').first().waitFor();
  await clickShot(page, 'select-product', page.getByTestId('product-card').first());

  const section = page.getByTestId('reviews');
  await section.waitFor();
  await page.waitForLoadState('networkidle');
  const before = await page.getByTestId('review-item').count();
  await shot(page, 'reviews-section', section);

  // กรณีผิดพลาด: ส่งโดยไม่กรอกอะไร
  await clickShot(page, 'submit-empty', page.getByTestId('review-submit'));
  await page.getByRole('alert').filter({ hasText: 'กรุณาใส่ชื่อ' }).waitFor();
  await shot(page, 'error-name-required', page.getByRole('alert'));

  // กรอกชื่อแต่ไม่ใส่ความคิดเห็น
  const author = `ผู้ทดสอบ ${Math.floor(Math.random() * 9000 + 1000)}`;
  await fillShot(page, 'fill-author', page.getByTestId('review-author'), author);
  await clickShot(page, 'submit-no-comment', page.getByTestId('review-submit'));
  await page.getByRole('alert').filter({ hasText: 'กรุณาเขียนความคิดเห็น' }).waitFor();
  await shot(page, 'error-comment-required', page.getByRole('alert'));

  // กรณีปกติ: ให้คะแนนแบบสุ่มและเขียนความคิดเห็น
  const stars = pick([1, 2, 3, 4, 5]);
  await clickShot(page, 'select-rating', page.getByRole('button', { name: `${stars} ดาว`, exact: true }));
  const comment = pick(['คุณภาพดีมาก', 'ส่งไว แพ็กดี', 'สีสวยตรงปก', 'น่าใช้ ราคาคุ้ม']) + ' (e2e)';
  await fillShot(page, 'fill-comment', page.getByTestId('review-comment'), comment);
  await clickShot(page, 'submit-review', page.getByTestId('review-submit'));

  const item = page.getByTestId('review-item').filter({ hasText: comment });
  await item.waitFor();
  await page.waitForLoadState('networkidle');
  assert((await page.getByTestId('review-item').count()) === before + 1, 'จำนวนรีวิวต้องเพิ่มขึ้น 1');
  assert((await item.innerText()).includes(author), 'ต้องแสดงชื่อผู้รีวิว');
  assert((await item.getByRole('img').getAttribute('aria-label')) === `${stars} จาก 5 ดาว`, 'ดาวต้องตรงกับที่เลือก');
  await shot(page, 'review-added', item);

  // รีวิวต้องอยู่หลังโหลดหน้าใหม่ (บันทึกลง DB)
  await page.reload();
  await page.getByTestId('review-item').filter({ hasText: comment }).waitFor();
  await shot(page, 'review-persisted', page.getByTestId('review-item').filter({ hasText: comment }));

  // ลบรีวิวที่สร้าง
  const created = page.getByTestId('review-item').filter({ hasText: comment });
  await clickShot(page, 'delete-review', created.getByRole('button', { name: 'ลบ' }));
  await created.waitFor({ state: 'detached' });
  assert((await page.getByTestId('review-item').count()) === before, 'จำนวนรีวิวต้องกลับเท่าเดิมหลังลบ');
  await shot(page, 'review-deleted', page.getByTestId('reviews'));

  await browser.close();
  console.log(`เสร็จสิ้น: ${step} ภาพ`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
