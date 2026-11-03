import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartStore } from '../cart.store';
import { baht, salePrice } from '../models';
import { ProductStore } from '../product.store';
import { ProductTile } from '../product-tile';
import { ReviewStore } from '../review.store';

@Component({
  imports: [RouterLink, FormsModule, DatePipe, ProductTile],
  styleUrl: './product-info.css',
  template: `
    <main class="page">
      <a routerLink="/" class="back">← กลับไปรายการสินค้า</a>

      @if (product(); as p) {
        <div class="top">
          <div class="gallery">
            <div class="sq"><app-tile [bg]="p.bg" [image]="p.image" [alt]="p.name" [radius]="20" /></div>
          </div>

          <div class="detail">
            <h1>{{ p.name }}</h1>
            <div class="rate">
              <b>{{ p.rating }}</b>
              <span class="stars" role="img" [attr.aria-label]="'คะแนนรีวิว ' + p.rating + ' จาก 5'">{{ stars(p.rating) }}</span>
              <span>{{ p.reviews }} รีวิว</span>
            </div>
            <p class="desc">{{ p.desc }}</p>

            <div class="buy">
              <div class="price">
                <b>{{ baht(sale(p) * qty()) }}</b>
                @if (p.discount > 0) {
                  <s class="muted">{{ baht(p.price * qty()) }}</s>
                  <span class="off">-{{ p.discount }}%</span>
                }
              </div>
              @if (p.colors.length) {
                <div class="opt">
                  <span class="lbl">สี</span>
                  <div class="row" style="gap: 10px">
                    @for (c of p.colors; track c; let i = $index) {
                      <button type="button" class="chip" [class.on]="color() === i" (click)="color.set(i)">{{ c }}</button>
                    }
                  </div>
                </div>
              }
              @if (p.sizes.length) {
                <div class="opt">
                  <span class="lbl">ขนาด</span>
                  <div class="row" style="gap: 10px">
                    @for (s of p.sizes; track s; let i = $index) {
                      <button type="button" class="chip" [class.on]="size() === i" (click)="size.set(i)">{{ s }}</button>
                    }
                  </div>
                </div>
              }
              <div class="opt">
                <span class="lbl">จำนวน</span>
                <div class="qty">
                  <button type="button" aria-label="ลดจำนวน" (click)="qty.set(Math.max(1, qty() - 1))">−</button>
                  <span>{{ qty() }}</span>
                  <button type="button" aria-label="เพิ่มจำนวน" (click)="qty.set(qty() + 1)">+</button>
                </div>
              </div>
              <div class="row" style="gap: 12px">
                <button type="button" class="btn ghost grow" data-testid="add-to-cart" (click)="addToCart(p.id)">เพิ่มไปยังรถเข็น</button>
                <button type="button" class="btn grow" (click)="buyNow(p.id)">ซื้อสินค้า</button>
              </div>
              @if (added()) {
                <span role="status" class="muted">เพิ่มลงตะกร้าแล้ว</span>
              }
            </div>
          </div>
        </div>

        @if (specRows().length) {
          <section class="card block">
            <h2>ข้อมูลจำเพาะ</h2>
            @for (r of specRows(); track r.k) {
              <div class="spec"><span class="muted">{{ r.k }}</span><span>{{ r.v }}</span></div>
            }
          </section>
        }

        <section class="card block" aria-labelledby="rv-title" data-testid="reviews">
          <div class="rv-head">
            <h2 id="rv-title">รีวิวจากลูกค้า</h2>
            @if (reviews().length) {
              <span class="muted" data-testid="review-summary">★ {{ average() }} จาก {{ reviews().length }} รีวิว</span>
            }
          </div>

          <form class="rv-form" (ngSubmit)="submitReview(p.id)">
            <div class="row">
              <label class="f grow">ชื่อ
                <input type="text" name="author" [(ngModel)]="author" autocomplete="name" data-testid="review-author" />
              </label>
              <fieldset class="rating">
                <legend>คะแนน</legend>
                @for (n of [1, 2, 3, 4, 5]; track n) {
                  <button type="button" class="star" [class.on]="n <= rating()" [attr.aria-label]="n + ' ดาว'" [attr.aria-pressed]="n === rating()" (click)="rating.set(n)">★</button>
                }
              </fieldset>
            </div>
            <label class="f">ความคิดเห็น
              <textarea name="comment" [(ngModel)]="comment" data-testid="review-comment"></textarea>
            </label>
            @if (error()) {
              <span role="alert" class="err">{{ error() }}</span>
            }
            <div><button type="submit" class="btn" data-testid="review-submit">ส่งรีวิว</button></div>
          </form>

          @for (r of reviews(); track r.id) {
            <article class="review" data-testid="review-item">
              <div class="rv-line">
                <b>{{ r.author }}</b>
                <span class="stars" role="img" [attr.aria-label]="r.rating + ' จาก 5 ดาว'">{{ stars(r.rating) }}</span>
                <span class="muted small">{{ r.createdAt | date: 'd MMM y HH:mm' }}</span>
                <button type="button" class="del" (click)="removeReview(r.id)">ลบ</button>
              </div>
              <p>{{ r.comment }}</p>
            </article>
          } @empty {
            <p class="muted">ยังไม่มีรีวิว เป็นคนแรกที่รีวิวสินค้านี้</p>
          }
        </section>
      } @else {
        <p class="muted" style="margin-top: 32px">ไม่พบสินค้า</p>
      }
    </main>
  `,
})
export class ProductInfo {
  /** รับจาก route param :id (withComponentInputBinding) */
  readonly id = input.required<string>();

  private readonly products = inject(ProductStore);
  private readonly cart = inject(CartStore);
  private readonly reviewStore = inject(ReviewStore);
  private readonly router = inject(Router);

  protected readonly Math = Math;
  protected readonly baht = baht;
  protected readonly sale = salePrice;
  protected readonly qty = signal(1);
  protected readonly color = signal(0);
  protected readonly size = signal(0);
  protected readonly added = signal(false);

  protected author = '';
  protected comment = '';
  protected readonly rating = signal(5);
  protected readonly error = signal('');

  constructor() {
    effect(() => {
      this.reviewStore.load(this.id());
    });
  }

  protected readonly product = computed(() => this.products.find(this.id()));
  protected readonly reviews = computed(() => {
    this.reviewStore.all(); // อ่าน signal เพื่อให้คำนวณใหม่เมื่อมีรีวิวเปลี่ยน
    return this.reviewStore.forProduct(this.id());
  });
  protected readonly average = computed(() => {
    const list = this.reviews();
    return list.length ? (list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(1) : '0';
  });
  protected readonly specRows = computed(() =>
    String(this.product()?.specs ?? '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const i = l.indexOf(':');
        return i < 0 ? { k: l, v: '' } : { k: l.slice(0, i).trim(), v: l.slice(i + 1).trim() };
      }),
  );

  protected stars(n: number) {
    const r = Math.round(n);
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  }

  protected addToCart(id: string) {
    const p = this.products.find(id);
    if (!p) return;
    this.cart.add(p, this.color(), this.size(), this.qty());
    this.added.set(true);
  }

  protected buyNow(id: string) {
    this.addToCart(id);
    this.router.navigateByUrl('/checkout');
  }

  protected submitReview(productId: string) {
    if (!this.author.trim()) return this.error.set('กรุณาใส่ชื่อ');
    if (!this.comment.trim()) return this.error.set('กรุณาเขียนความคิดเห็น');
    this.reviewStore.add({ productId, author: this.author, rating: this.rating(), comment: this.comment });
    this.author = '';
    this.comment = '';
    this.rating.set(5);
    this.error.set('');
  }

  protected removeReview(id: string) {
    this.reviewStore.remove(id);
  }
}
