import { chromium } from 'playwright';
import { readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..');
const DIR = join(ROOT, 'manuals');

type Desc = { title: string; text: string };

const SECTIONS: { prefix: string; title: string; intro: string; steps: Record<string, Desc> }[] = [
  {
    prefix: 'order',
    title: 'ส่วนที่ 1 การสั่งซื้อสินค้า',
    intro: 'ขั้นตอนเลือกสินค้าใส่ตะกร้า กรอกข้อมูลจัดส่ง เลือกวิธีชำระเงิน และยืนยันการสั่งซื้อ',
    steps: {
      home: { title: 'เปิดหน้าสินค้าทั้งหมด', text: 'เข้าเว็บไซต์ RXXN.STUDIO จะพบรายการสินค้าทั้งหมด สามารถกรองตามหมวดหมู่ได้จากปุ่มด้านบนรายการ' },
      'select-product': { title: 'เลือกสินค้า', text: 'คลิกที่การ์ดสินค้าที่ต้องการ (กรอบแดง) เพื่อเข้าไปดูรายละเอียดสินค้า' },
      'add-to-cart': { title: 'เพิ่มลงตะกร้า', text: 'เลือกสี ขนาด และจำนวนตามต้องการ แล้วกดปุ่ม "เพิ่มไปยังรถเข็น" จะมีข้อความ "เพิ่มลงตะกร้าแล้ว" แสดงขึ้น ทำซ้ำกับสินค้าชิ้นอื่นได้โดยกดโลโก้เพื่อกลับหน้าแรก' },
      'open-cart': { title: 'เปิดตะกร้าสินค้า', text: 'กดปุ่ม "ตะกร้า" มุมขวาบน ตัวเลขในวงเล็บคือจำนวนชิ้นทั้งหมดในตะกร้า' },
      cart: { title: 'ตรวจสอบรายการในตะกร้า', text: 'หน้านี้แสดงสินค้าทั้งหมด ปรับจำนวนด้วยปุ่ม − / + หรือลบสินค้าด้วยปุ่ม ✕ และดูสรุปยอดรวมทางด้านขวา' },
      'go-checkout': { title: 'ไปหน้าชำระเงิน', text: 'กดปุ่ม "ไปชำระเงิน" ในกล่องสรุปคำสั่งซื้อ' },
      'fill-name': { title: 'กรอกชื่อ-นามสกุล', text: 'พิมพ์ชื่อและนามสกุลของผู้รับสินค้า ในส่วน "1 ข้อมูลการจัดส่ง"' },
      'fill-phone': { title: 'กรอกเบอร์โทรศัพท์', text: 'พิมพ์เบอร์โทรศัพท์ที่ติดต่อได้' },
      'fill-email': { title: 'กรอกอีเมล', text: 'พิมพ์อีเมลสำหรับรับรายละเอียดการจัดส่ง' },
      'fill-address': { title: 'กรอกที่อยู่', text: 'พิมพ์บ้านเลขที่ ถนน และรายละเอียดที่อยู่จัดส่ง' },
      'fill-province': { title: 'กรอกจังหวัด', text: 'พิมพ์ชื่อจังหวัดที่จัดส่ง' },
      'fill-zipcode': { title: 'กรอกรหัสไปรษณีย์', text: 'พิมพ์รหัสไปรษณีย์ 5 หลัก' },
      'select-shipping': { title: 'เลือกวิธีจัดส่ง', text: 'เลือก "จัดส่งมาตรฐาน" (฿50) หรือ "จัดส่งด่วน" (฿90) ยอดรวมทางขวาจะเปลี่ยนตามที่เลือก' },
      'select-payment': { title: 'เลือกวิธีชำระเงิน', text: 'เลือกวิธีชำระเงิน: บัตรเครดิต/เดบิต พร้อมเพย์ หรือเก็บเงินปลายทาง' },
      'fill-card': { title: 'กรอกหมายเลขบัตร', text: 'กรณีเลือกบัตรเครดิต/เดบิต ให้พิมพ์หมายเลขบัตร' },
      'fill-expiry': { title: 'กรอกวันหมดอายุบัตร', text: 'พิมพ์เดือน/ปีที่บัตรหมดอายุ เช่น 12/30' },
      'fill-cvv': { title: 'กรอกรหัส CVV', text: 'พิมพ์รหัส CVV 3 หลักด้านหลังบัตร' },
      'place-order': { title: 'ยืนยันการสั่งซื้อ', text: 'ตรวจสอบรายการและยอดรวมอีกครั้ง แล้วกดปุ่ม "ยืนยันการสั่งซื้อ"' },
      'order-success': { title: 'สั่งซื้อสำเร็จ', text: 'ระบบแสดงหน้า "สั่งซื้อสำเร็จ" และตะกร้าถูกล้าง กดปุ่ม "กลับไปเลือกสินค้าต่อ" เพื่อเลือกซื้อสินค้าเพิ่ม' },
    },
  },
  {
    prefix: 'review',
    title: 'ส่วนที่ 2 การรีวิวสินค้า',
    intro: 'ขั้นตอนเขียนรีวิว ให้คะแนนดาว และลบรีวิวในหน้ารายละเอียดสินค้า',
    steps: {
      'select-product': { title: 'เลือกสินค้าที่จะรีวิว', text: 'จากหน้าแรก คลิกการ์ดสินค้าเพื่อเข้าหน้ารายละเอียด' },
      'reviews-section': { title: 'ส่วน "รีวิวจากลูกค้า"', text: 'เลื่อนลงมาด้านล่างของหน้า จะพบกล่องรีวิวซึ่งมีแบบฟอร์มเขียนรีวิวและรายการรีวิวของลูกค้าท่านอื่น' },
      'submit-empty': { title: 'กด "ส่งรีวิว" โดยไม่กรอกข้อมูล', text: 'ลองกดปุ่ม "ส่งรีวิว" ขณะที่ยังไม่กรอกอะไร' },
      'error-name-required': { title: 'ข้อความเตือนให้ใส่ชื่อ', text: 'ระบบแสดงข้อความ "กรุณาใส่ชื่อ" และยังไม่บันทึกรีวิว' },
      'fill-author': { title: 'กรอกชื่อ', text: 'พิมพ์ชื่อที่จะแสดงในรีวิว' },
      'submit-no-comment': { title: 'กด "ส่งรีวิว" โดยไม่ใส่ความคิดเห็น', text: 'ลองกดส่งรีวิวทั้งที่ยังไม่ได้เขียนความคิดเห็น' },
      'error-comment-required': { title: 'ข้อความเตือนให้เขียนความคิดเห็น', text: 'ระบบแสดงข้อความ "กรุณาเขียนความคิดเห็น"' },
      'select-rating': { title: 'เลือกคะแนนดาว', text: 'คลิกดาวตามคะแนนที่ต้องการให้ (1-5 ดาว) ค่าเริ่มต้นคือ 5 ดาว' },
      'fill-comment': { title: 'เขียนความคิดเห็น', text: 'พิมพ์ความคิดเห็นเกี่ยวกับสินค้าในช่อง "ความคิดเห็น"' },
      'submit-review': { title: 'กดส่งรีวิว', text: 'กดปุ่ม "ส่งรีวิว" เพื่อบันทึก' },
      'review-added': { title: 'รีวิวถูกเพิ่มในรายการ', text: 'รีวิวใหม่ปรากฏในรายการ พร้อมชื่อ จำนวนดาว วันเวลา และข้อความ' },
      'review-persisted': { title: 'รีวิวยังอยู่หลังโหลดหน้าใหม่', text: 'เมื่อรีเฟรชหน้า รีวิวยังคงอยู่ เพราะบันทึกลงฐานข้อมูลแล้ว' },
      'delete-review': { title: 'ลบรีวิว', text: 'กดปุ่ม "ลบ" ท้ายชื่อผู้รีวิวเพื่อลบรีวิวนั้น' },
      'review-deleted': { title: 'ลบรีวิวสำเร็จ', text: 'รีวิวที่ลบหายออกจากรายการ' },
    },
  },
];

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

async function main() {
  const files = readdirSync(DIR);
  let body = `<section class="cover"><h1>คู่มือการใช้งาน<br>RXXN.STUDIO</h1><p>การสั่งซื้อสินค้าและการรีวิวสินค้า</p>
    <p class="note">ในแต่ละภาพ วงกลมสีแดง <b class="dot">1</b> คือเลขลำดับขั้นตอน และกรอบสีแดงคือจุดที่ต้องกดหรือกรอก</p></section>`;

  for (const sec of SECTIONS) {
    const items = files
      .filter((f) => f.startsWith(sec.prefix + '-') && f.endsWith('.png'))
      .sort()
      .map((f) => {
        const m = f.match(/^[a-z]+-(\d+)-(.+)\.png$/)!;
        const key = m[2];
        const d = sec.steps[key] ?? sec.steps[key.replace(/-\d+$/, '')];
        if (!d) throw new Error('ไม่มีคำอธิบายสำหรับ ' + f);
        const img = readFileSync(join(DIR, f)).toString('base64');
        return { n: Number(m[1]), d, img };
      });
    body += `<section class="sec-head"><h1>${sec.title}</h1><p>${sec.intro}</p></section>`;
    for (const it of items) {
      body += `<section class="step"><h2><span class="n">${it.n}</span>${esc(it.d.title)}</h2>
        <p>${esc(it.d.text)}</p><img src="data:image/png;base64,${it.img}"></section>`;
    }
  }

  const html = `<!doctype html><html lang="th"><head><meta charset="utf-8"><style>
    body { font-family: 'Noto Sans Thai','Leelawadee UI','Tahoma',sans-serif; color:#2B2430; font-size:13pt; margin:0; }
    .cover { text-align:center; padding-top:80mm; }
    .cover h1 { font-size:34pt; margin:0 0 10mm; } .cover p { font-size:15pt; }
    .note { margin-top:20mm; font-size:12pt !important; color:#555; }
    .dot { display:inline-block; width:22px; height:22px; line-height:22px; border-radius:50%; background:red; color:#fff; text-align:center; font-size:11pt; }
    .sec-head { page-break-before: always; }
    .sec-head h1 { font-size:24pt; color:#A33B68; }
    .step { page-break-inside: avoid; margin:0 0 8mm; }
    h2 { font-size:15pt; margin:6mm 0 2mm; display:flex; align-items:center; gap:8px; }
    .n { display:inline-flex; width:30px; height:30px; border-radius:50%; background:red; color:#fff; align-items:center; justify-content:center; font-size:13pt; }
    p { margin:0 0 3mm; line-height:1.5; }
    img { width:100%; border:1px solid #ddd; border-radius:6px; }
  </style></head><body>${body}</body></html>`;

  const htmlPath = join(__dirname, 'manual.html');
  writeFileSync(htmlPath, html);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file:///' + htmlPath.replace(/\\/g, '/'));
  await page.pdf({ path: join(ROOT, 'manual.pdf'), format: 'A4', printBackground: true, margin: { top: '14mm', bottom: '14mm', left: '14mm', right: '14mm' } });
  await browser.close();
  rmSync(htmlPath);
  console.log('สร้าง manual.pdf แล้ว');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
