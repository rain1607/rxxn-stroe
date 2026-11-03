# RXXN.STUDIO

ร้านค้าออนไลน์ตัวอย่าง (เครื่องปั้นดินเผา) ประกอบด้วยหน้าร้าน Angular, API Express + Prisma (SQLite) และชุดทดสอบ e2e ด้วย Playwright ที่ถ่ายภาพทุกขั้นตอนเพื่อสร้างคู่มือ PDF

## โครงสร้างโปรเจกต์

| โฟลเดอร์ | หน้าที่ |
| --- | --- |
| [frontend/](frontend/) | หน้าร้าน Angular: รายการสินค้า, รายละเอียด + รีวิว, ตะกร้า, ชำระเงิน, Admin |
| [backend/](backend/) | REST API (Express) + Prisma/SQLite (`prisma/dev.db`) |
| [docs/openapi.yml](docs/openapi.yml) | สเปก OpenAPI ของ API |
| [e2e-test/](e2e-test/) | สคริปต์ Playwright และตัวสร้างคู่มือ |
| [manuals/](manuals/) | ภาพหน้าจอแต่ละขั้นตอนที่ e2e script ถ่ายไว้ |
| [manual.pdf](manual.pdf) | คู่มือการใช้งานที่สร้างจากภาพใน `manuals/` |
| [.claude/skills/](.claude/skills/) | skill สำหรับ Claude Code (`/add-e2e-test`, `/manuals-pdf`) |

## เริ่มใช้งาน

ต้องมี Node.js และเปิดสองเทอร์มินัล (หรือสองแท็บ)

### 1. Backend (พอร์ต 3000)

```bash
cd backend
npm install
npm run db:push     # สร้างตารางใน SQLite (ครั้งแรก)
npm run seed        # ใส่ข้อมูลสินค้าตัวอย่าง (ถ้าต้องการ)
npm run dev         # http://localhost:3000
```

`.env` ใช้ `DATABASE_URL="file:./dev.db"` ล้างและสร้างข้อมูลใหม่ได้ด้วย `npm run db:reset`

### 2. Frontend (พอร์ต 4200)

```bash
cd frontend
npm install
npm start           # http://localhost:4200
```

`npm start` ใช้ Node ที่อยู่ใน `tools/` หากเครื่องมี Node เวอร์ชันที่ Angular รองรับอยู่แล้วให้ใช้ `npm run start:system-node`

## API

Base URL `http://localhost:3000/api` (รายละเอียดเต็มใน [docs/openapi.yml](docs/openapi.yml))

| Method | Path | คำอธิบาย |
| --- | --- | --- |
| GET / POST | `/products` | รายการสินค้า / เพิ่มสินค้า |
| GET / PUT / DELETE | `/products/:id` | ดู / แก้ไข / ลบสินค้า |
| GET / POST | `/products/:id/reviews` | รีวิวของสินค้า / เพิ่มรีวิว |
| DELETE | `/reviews/:id` | ลบรีวิว |
| GET / DELETE | `/cart` | ดูตะกร้า / ล้างตะกร้า |
| POST | `/cart/items` | เพิ่มสินค้าลงตะกร้า |
| PATCH / DELETE | `/cart/items/:id` | แก้จำนวน / ลบรายการ |

> หมายเหตุ: ตะกร้าเก็บที่ฝั่งเซิร์ฟเวอร์และใช้ร่วมกันทุกผู้ใช้ ส่วนการกด "ยืนยันการสั่งซื้อ" ตอนนี้ล้างตะกร้าและแสดงหน้าสำเร็จเท่านั้น **ยังไม่มีการบันทึก order ลงฐานข้อมูล**

## ทดสอบ e2e และทำคู่มือ

ต้องรัน backend และ frontend ไว้ก่อน

```bash
cd e2e-test
npm install
npx playwright install chromium   # ครั้งแรก

npx tsx order.ts          # สั่งซื้อ: เลือกสินค้า 3 ชิ้น -> ตะกร้า -> กรอกที่อยู่แบบสุ่ม -> ยืนยัน
npx tsx review.ts         # รีวิว: validate, เพิ่ม, รีเฟรช, ลบ (ลบรีวิวทดสอบทิ้งเอง)
npx tsx build-manual.ts   # สร้าง ../manual.pdf จากภาพใน manuals/
```

- ภาพบันทึกที่ `manuals/<ชุดทดสอบ>-<ลำดับ>-<ขั้นตอน>.png` มีกรอบแดงรอบจุดที่กด/กรอก และวงกลมเลขลำดับ
- `order.ts` ล้างตะกร้าผ่าน API ก่อนเริ่มทุกครั้ง
- ปรับ URL ได้ด้วย env `BASE_URL` (ค่าเริ่มต้น `http://localhost:4200`) และ `API_URL` (`http://localhost:3000`)
- เพิ่มคำอธิบายขั้นตอนใหม่ในคู่มือที่ `SECTIONS` ใน [e2e-test/build-manual.ts](e2e-test/build-manual.ts)

## Skills สำหรับ Claude Code

| คำสั่ง | ใช้ทำอะไร |
| --- | --- |
| `/add-e2e-test` | เขียน e2e script ใหม่ให้ฟีเจอร์ พร้อมถ่ายภาพลง `manuals/` |
| `/manuals-pdf` | สร้าง `manual.pdf` จากภาพใน `manuals/` |
