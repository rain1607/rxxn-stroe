import { Injectable } from '@angular/core';
import { api } from './api';
import { Review } from './models';
import { storedSignal } from './local-storage';

export type ReviewInput = Pick<Review, 'productId' | 'author' | 'rating' | 'comment'>;

/** localStorage key: ds.reviews.v1 — รูปแบบเดียวกับตาราง Review ใน Prisma */
@Injectable({ providedIn: 'root' })
export class ReviewStore {
  private readonly state = storedSignal<Review[]>('ds.reviews.v1', () => []);

  readonly all = this.state.asReadonly();

  forProduct(productId: string): Review[] {
    return this.state()
      .filter((r) => r.productId === productId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /** ดึงรีวิวของสินค้าจาก API มาแทนที่ของสินค้านั้นใน localStorage */
  async load(productId: string) {
    const list = await api<Review[]>('GET', `/products/${productId}/reviews`);
    if (!list) return;
    this.state.commit([...this.state().filter((r) => r.productId !== productId), ...list]);
  }

  add(input: ReviewInput): Review {
    const review: Review = {
      ...input,
      author: input.author.trim(),
      comment: input.comment.trim(),
      id: 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      createdAt: new Date().toISOString(),
    };
    this.state.commit([review, ...this.state()]);
    // แสดงทันที แล้วสลับ id ชั่วคราวเป็น id จริงจากฐานข้อมูลเมื่อบันทึกสำเร็จ
    api<Review>('POST', `/products/${input.productId}/reviews`, review).then((saved) => {
      if (saved) this.state.commit(this.state().map((r) => (r.id === review.id ? saved : r)));
    });
    return review;
  }

  remove(id: string) {
    this.state.commit(this.state().filter((r) => r.id !== id));
    api('DELETE', `/reviews/${id}`);
  }
}
