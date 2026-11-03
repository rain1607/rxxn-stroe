import express from 'express';
import cors from 'cors';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const productInclude = { options: { orderBy: { id: 'asc' } } } satisfies Prisma.ProductInclude;
type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

// แปลงแถวจากฐานข้อมูลให้เป็นรูปแบบเดียวกับ ds.products.v2 ใน localStorage
const toProduct = (p: ProductRow) => ({
  id: p.id,
  order: p.sortOrder,
  name: p.name,
  cat: p.category,
  price: p.price,
  discount: p.discount,
  bg: p.bg,
  fg: p.fg,
  image: p.image ?? '',
  rating: p.rating,
  reviews: p.reviewCount,
  province: p.province,
  colors: p.options.filter((o) => o.type === 'color').map((o) => o.label),
  sizes: p.options.filter((o) => o.type === 'size').map((o) => o.label),
  desc: p.description,
  specs: p.specs
});

const productData = (b: any) => ({
  name: String(b.name ?? '').trim(),
  category: String(b.cat ?? ''),
  price: Math.max(0, Math.round(Number(b.price) || 0)),
  discount: Math.min(90, Math.max(0, Math.round(Number(b.discount) || 0))),
  bg: b.bg || '#FADCE4',
  fg: b.fg || '#2B2430',
  image: b.image || null,
  rating: Math.min(5, Math.max(0, Number(b.rating) || 0)),
  reviewCount: Math.max(0, Math.round(Number(b.reviews) || 0)),
  province: String(b.province ?? ''),
  description: String(b.desc ?? ''),
  specs: String(b.specs ?? ''),
  sortOrder: Math.round(Number(b.order) || 0)
});

const optionRows = (b: any) => [
  ...((b.colors as string[]) || []).map((label) => ({ type: 'color', label })),
  ...((b.sizes as string[]) || []).map((label) => ({ type: 'size', label }))
];

const bad = (res: express.Response, message: string) => res.status(400).json({ message });

// ---------- products ----------
app.get('/api/products', async (_req, res) => {
  const rows = await prisma.product.findMany({ include: productInclude, orderBy: { sortOrder: 'asc' } });
  res.json(rows.map(toProduct));
});

app.get('/api/products/:id', async (req, res) => {
  const row = await prisma.product.findUnique({ where: { id: req.params.id }, include: productInclude });
  if (!row) return res.status(404).json({ message: 'ไม่พบสินค้า' });
  res.json(toProduct(row));
});

app.post('/api/products', async (req, res) => {
  const data = productData(req.body);
  if (!data.name) return bad(res, 'กรุณาใส่ชื่อสินค้า');
  const max = await prisma.product.aggregate({ _max: { sortOrder: true } });
  const row = await prisma.product.create({
    data: { id: req.body.id || 'p' + Date.now(), ...data, sortOrder: data.sortOrder || (max._max.sortOrder ?? 0) + 1, options: { create: optionRows(req.body) } },
    include: productInclude
  });
  res.status(201).json(toProduct(row));
});

app.put('/api/products/:id', async (req, res) => {
  const data = productData(req.body);
  if (!data.name) return bad(res, 'กรุณาใส่ชื่อสินค้า');
  const exists = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!exists) return res.status(404).json({ message: 'ไม่พบสินค้า' });
  const [, , row] = await prisma.$transaction([
    prisma.productOption.deleteMany({ where: { productId: req.params.id } }),
    prisma.productOption.createMany({ data: optionRows(req.body).map((o) => ({ ...o, productId: req.params.id })) }),
    prisma.product.update({ where: { id: req.params.id }, data, include: productInclude })
  ]);
  res.json(toProduct(row));
});

app.delete('/api/products/:id', async (req, res) => {
  const exists = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!exists) return res.status(404).json({ message: 'ไม่พบสินค้า' });
  await prisma.product.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// ---------- reviews ----------
const toReview = (r: { id: string; productId: string; author: string; rating: number; comment: string; createdAt: Date }) => ({
  id: r.id, productId: r.productId, author: r.author, rating: r.rating, comment: r.comment, createdAt: r.createdAt.toISOString()
});

app.get('/api/products/:id/reviews', async (req, res) => {
  const rows = await prisma.review.findMany({ where: { productId: req.params.id }, orderBy: { createdAt: 'desc' } });
  res.json(rows.map(toReview));
});

app.post('/api/products/:id/reviews', async (req, res) => {
  const { author, rating, comment } = req.body ?? {};
  const r = Math.round(Number(rating));
  if (!String(author ?? '').trim()) return bad(res, 'กรุณาใส่ชื่อผู้รีวิว');
  if (!(r >= 1 && r <= 5)) return bad(res, 'คะแนนต้องอยู่ระหว่าง 1-5');
  if (!String(comment ?? '').trim()) return bad(res, 'กรุณาเขียนความคิดเห็น');
  const exists = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!exists) return res.status(404).json({ message: 'ไม่พบสินค้า' });
  const row = await prisma.review.create({
    data: { productId: req.params.id, author: String(author).trim(), rating: r, comment: String(comment).trim() }
  });
  res.status(201).json(toReview(row));
});

app.delete('/api/reviews/:id', async (req, res) => {
  const exists = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!exists) return res.status(404).json({ message: 'ไม่พบรีวิว' });
  await prisma.review.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// ---------- cart ----------
const toLine = (c: Prisma.CartItemGetPayload<{}>) => ({
  id: c.id, productId: c.productId, name: c.name, variant: c.variant, price: c.price, qty: c.qty, bg: c.bg, fg: c.fg, img: c.img ?? ''
});

app.get('/api/cart', async (_req, res) => {
  const rows = await prisma.cartItem.findMany({ orderBy: { createdAt: 'asc' } });
  const items = rows.map(toLine);
  const subtotal = items.reduce((s, l) => s + l.price * l.qty, 0);
  const shipping = items.length ? 50 : 0;
  res.json({ items, subtotal, shipping, total: subtotal + shipping });
});

// เพิ่มสินค้า: ถ้า id (productId-สี-ขนาด) ซ้ำให้บวกจำนวน เหมือนใน ProductInfo.addToCart
app.post('/api/cart/items', async (req, res) => {
  const { productId, colorIndex = 0, sizeIndex = 0, qty = 1 } = req.body ?? {};
  const q = Math.round(Number(qty));
  if (!(q >= 1)) return bad(res, 'จำนวนต้องมากกว่า 0');
  const p = await prisma.product.findUnique({ where: { id: String(productId) }, include: productInclude });
  if (!p) return res.status(404).json({ message: 'ไม่พบสินค้า' });
  const colors = p.options.filter((o) => o.type === 'color');
  const sizes = p.options.filter((o) => o.type === 'size');
  const ci = Math.min(Number(colorIndex) || 0, Math.max(0, colors.length - 1));
  const si = Math.min(Number(sizeIndex) || 0, Math.max(0, sizes.length - 1));
  const parts: string[] = [];
  if (colors.length) parts.push('สี: ' + colors[ci].label);
  if (sizes.length) parts.push('ขนาด: ' + sizes[si].label);
  const id = `${p.id}-${colors.length ? ci : 0}-${sizes.length ? si : 0}`;
  const price = Math.round(p.price * (1 - p.discount / 100));
  const row = await prisma.cartItem.upsert({
    where: { id },
    update: { qty: { increment: q }, price },
    create: { id, productId: p.id, name: p.name, variant: parts.join(' · ') || 'ตัวเลือกมาตรฐาน', price, qty: q, bg: p.bg, fg: p.fg, img: p.image }
  });
  res.status(201).json(toLine(row));
});

app.patch('/api/cart/items/:id', async (req, res) => {
  const q = Math.round(Number(req.body?.qty));
  if (!(q >= 1)) return bad(res, 'จำนวนต้องมากกว่า 0');
  const exists = await prisma.cartItem.findUnique({ where: { id: req.params.id } });
  if (!exists) return res.status(404).json({ message: 'ไม่พบรายการในตะกร้า' });
  res.json(toLine(await prisma.cartItem.update({ where: { id: req.params.id }, data: { qty: q } })));
});

app.delete('/api/cart/items/:id', async (req, res) => {
  const exists = await prisma.cartItem.findUnique({ where: { id: req.params.id } });
  if (!exists) return res.status(404).json({ message: 'ไม่พบรายการในตะกร้า' });
  await prisma.cartItem.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

app.delete('/api/cart', async (_req, res) => {
  await prisma.cartItem.deleteMany();
  res.status(204).end();
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
