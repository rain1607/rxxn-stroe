import { PrismaClient } from '@prisma/client';
import { products, reviews, cartItems } from './seed-data';

const prisma = new PrismaClient();
const sale = (price: number, discount: number) => Math.round(price * (1 - discount / 100));

async function main() {
  // ล้างข้อมูลทั้งหมด (ลูกก่อนแม่) แล้วสร้าง mockup ใหม่ — รันซ้ำได้เสมอ
  await prisma.review.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.productOption.deleteMany();
  await prisma.product.deleteMany();

  for (const [i, p] of products.entries()) {
    await prisma.product.create({
      data: {
        id: p.id, sortOrder: i + 1, name: p.name, category: p.category, price: p.price, discount: p.discount,
        bg: p.bg, rating: p.rating, reviewCount: p.reviewCount, province: p.province,
        description: p.description, specs: p.specs,
        options: {
          create: [
            ...p.colors.map((label) => ({ type: 'color', label })),
            ...p.sizes.map((label) => ({ type: 'size', label }))
          ]
        }
      }
    });
  }

  await prisma.review.createMany({ data: reviews });

  for (const c of cartItems) {
    const p = products.find((x) => x.id === c.productId)!;
    await prisma.cartItem.create({
      data: { id: c.id, productId: p.id, name: p.name, variant: c.variant, price: sale(p.price, p.discount), qty: c.qty, bg: p.bg, fg: '#2B2430' }
    });
  }

  console.log(`seeded: ${products.length} products, ${reviews.length} reviews, ${cartItems.length} cart items`);
}

main().finally(() => prisma.$disconnect());
