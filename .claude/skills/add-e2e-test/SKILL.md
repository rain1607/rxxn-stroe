---
name: add-e2e-test
description: เพิ่ม e2e test script (Playwright + TypeScript) ให้ฟีเจอร์ของร้าน RXXN.STUDIO พร้อมบันทึกภาพทุก step ที่มีกรอบแดง highlight ไว้ใน /manuals สำหรับทำคู่มือ ใช้เมื่อผู้ใช้สั่ง "/add-e2e-test", "เขียน e2e test ให้ระบบ ...", "ทดสอบระบบ ... ด้วย playwright", "ทำ script ถ่ายภาพขั้นตอนการใช้งาน"
---

# add-e2e-test

สร้าง script ที่ `e2e-test/<feature>.ts` ทดสอบฟีเจอร์ผ่านเบราว์เซอร์จริง พร้อมถ่ายภาพทุก step ลง `manuals/`

## สภาพแวดล้อม (ตรวจก่อนเริ่ม)
- Frontend Angular: `http://localhost:4200` (`cd frontend && npm start`)
- Backend Express + Prisma/SQLite: `http://localhost:3000` (`cd backend && npm run dev`)
- ถ้ายังไม่รัน ให้สั่งรันเบื้องหลังแล้วรอจนพร้อม (log ขึ้น `API listening` / `Local: http://localhost:4200`)
- ติดตั้ง Playwright ครั้งเดียวใน `e2e-test/`: `npm i -D playwright tsx typescript @types/node && npx playwright install chromium`
- รัน: `cd e2e-test && npx tsx <feature>.ts`

## ขั้นตอน
1. อ่าน component ของฟีเจอร์ใน `frontend/src/app/pages/` เพื่อดู selector ที่มี (`data-testid`, label, role) ถ้าไม่มี ใช้ `getByLabel` / `getByRole` และถ้าจำเป็นค่อยเพิ่ม `data-testid` ใน template
2. เขียน `e2e-test/<feature>.ts` โดยยึด `e2e-test/order.ts` เป็นต้นแบบ (คัดลอก helper `shot`, `clickShot`, `fillShot`)
3. รัน แก้ จนผ่าน แล้วเปิดดูภาพสัก 2-3 ภาพเพื่อยืนยันว่ากรอบแดงอยู่ถูกจุด
4. สรุปผลให้ผู้ใช้: ภาพที่ได้, ช่องโหว่ที่พบในระบบ (ถ้ามี)

## กติกาของ script
- ภาพไปที่ `manuals/` ตั้งชื่อ `<feature>-<NN>-<step>.png` (NN สองหลักเรียงตามลำดับ) ตอนเริ่มลบเฉพาะไฟล์ที่ขึ้นต้น `<feature>-` ของตัวเอง ห้ามลบทั้งโฟลเดอร์
- ทุกครั้งที่ "กด" หรือ "กรอก" ต้อง highlight ด้วย `outline: 4px solid red` รอบ element นั้นก่อนถ่ายภาพ แล้วคืนค่า style หลังถ่าย
- ใน `shot` ให้ใส่วงกลมแดงเลขลำดับ (เลข step เดียวกับชื่อไฟล์) ที่มุมซ้ายบนของกรอบ แล้วลบทิ้งหลังถ่าย เพื่อใช้อ้างอิงในคู่มือ
- ทำ `manual.pdf`: เพิ่มคำอธิบายของ step ใหม่ใน `SECTIONS` ของ `e2e-test/build-manual.ts` (key = ชื่อ step ในไฟล์ภาพ) แล้วรัน `npx tsx build-manual.ts` จะได้ `manual.pdf` ที่รากโปรเจกต์
- ข้อมูลที่กรอกให้สุ่ม (ชื่อ เบอร์ อีเมล ที่อยู่) ใช้ helper `pick` / `digits`
- ใช้ viewport 1280x900 และ `chromium.launch()` (headless)
- ใส่ `exact: true` กับ `getByRole('heading', { name })` เมื่อชื่อสั้นอาจซ้ำกับหัวข้ออื่น (เช่น "ชำระเงิน" ซ้ำกับ "วิธีชำระเงิน")
- ตรวจผลลัพธ์ด้วย assertion จริง (เช่นจำนวนรายการ, ข้อความที่ปรากฏ) ถ้าผิดให้ `throw` และ `process.exit(1)`

## ข้อควรระวังที่เคยเจอ
- **ตะกร้าเก็บที่ฝั่งเซิร์ฟเวอร์** (`/api/cart`) และค้างข้ามรอบ ต้อง `DELETE /api/cart` ก่อนเริ่มทดสอบที่เกี่ยวกับตะกร้า
- อย่า `page.goto` ระหว่างขั้นตอนที่เพิ่งเรียก API เพราะหน้าโหลดใหม่จะดึงข้อมูลจาก API ทับสถานะ ให้ `waitForLoadState('networkidle')` แล้วคลิกลิงก์ (`a.logo`) แทน
- รีวิวสินค้าเก็บผ่าน `/api/products/:id/reviews` ถ้าทดสอบสร้างรีวิวให้ลบรีวิวที่สร้างทิ้งตอนจบ (ผ่านปุ่ม "ลบ" หรือ `DELETE /api/reviews/:id`) เพื่อไม่ให้ข้อมูลทดสอบสะสม
- `place()` ใน checkout ยังไม่บันทึก order ลง DB จึงตรวจ order ผ่าน DB ไม่ได้ ตรวจได้แค่หน้า "สั่งซื้อสำเร็จ" และตะกร้าว่าง
