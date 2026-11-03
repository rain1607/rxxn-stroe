import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { baht, salePrice } from '../models';
import { ProductStore } from '../product.store';
import { ProductTile } from '../product-tile';

@Component({
  imports: [RouterLink, ProductTile],
  styleUrl: './product-list.css',
  template: `
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-copy">
          <span class="eyebrow">งานปั้นมือ · ส่งตรงจากสตูดิโอ</span>
          <h1>เครื่องปั้นดินเผา<br />ที่เติมความอบอุ่น<br />ให้โต๊ะอาหารของคุณ</h1>
          <p>ถ้วย จาน แจกัน และชุดน้ำชาเคลือบสีนุ่ม ปั้นและเผาทีละใบ เลือกชมแล้วกดดูรายละเอียดเพื่อสั่งซื้อ</p>
        </div>
        <div class="hero-grid">
          @for (p of store.products().slice(0, 3); track p.id; let i = $index) {
            <div class="hero-tile" [style.margin-top.px]="i === 1 ? 48 : 0">
              <app-tile [bg]="p.bg" [image]="p.image" [alt]="p.name" [radius]="20" />
            </div>
          }
        </div>
      </div>
    </section>

    @if (store.promos().length) {
      <section class="page promo" aria-label="โปร 11.11">
        <div class="promo-box">
          <div class="promo-head">
            <span class="big">11.11</span>
            <div class="col">
              <span class="eyebrow">โปรโมชันพิเศษ</span>
              <h2>ลดทันที สูงสุด {{ maxDiscount() }}%</h2>
            </div>
          </div>
          <div class="promo-grid">
            @for (p of store.promos().slice(0, 3); track p.id) {
              <a class="pcard plain" [routerLink]="['/product', p.id]">
                <div class="sq">
                  <app-tile [bg]="p.bg" [image]="p.image" [alt]="p.name" [radius]="20" />
                  <span class="badge">-{{ p.discount }}%</span>
                </div>
                <span class="name">{{ p.name }}</span>
                <div class="prices">
                  <b class="sale">{{ baht(sale(p)) }}</b>
                  <s class="muted">{{ baht(p.price) }}</s>
                </div>
              </a>
            }
          </div>
        </div>
      </section>
    }

    <main class="page">
      <div class="list-head">
        <h2>สินค้าทั้งหมด</h2>
        <div class="row" style="gap: 8px">
          @for (c of categories(); track c) {
            <button type="button" class="pill" [class.on]="cat() === c" (click)="cat.set(c)">{{ c }}</button>
          }
        </div>
      </div>
      <div class="grid">
        @for (p of visible(); track p.id) {
          <a class="pcard" [routerLink]="['/product', p.id]" data-testid="product-card">
            <div class="sq">
              <app-tile [bg]="p.bg" [image]="p.image" [alt]="p.name" />
            </div>
            <div class="info">
              <div class="line">
                <span class="name">{{ p.name }}</span>
                <span class="muted small">{{ p.cat }}</span>
              </div>
              <div class="prices">
                <b class="sale">{{ baht(sale(p)) }}</b>
                @if (p.discount > 0) {
                  <s class="muted small">{{ baht(p.price) }}</s>
                }
              </div>
              <span class="small meta">★ {{ p.rating }} ({{ p.reviews }}) · ส่งจาก {{ p.province }}</span>
            </div>
          </a>
        }
      </div>
    </main>
  `,
})
export class ProductList {
  protected readonly store = inject(ProductStore);
  protected readonly baht = baht;
  protected readonly sale = salePrice;
  protected readonly cat = signal('ทั้งหมด');

  protected readonly categories = computed(() => ['ทั้งหมด', ...new Set(this.store.products().map((p) => p.cat))]);
  protected readonly maxDiscount = computed(() => this.store.promos().reduce((m, p) => Math.max(m, p.discount), 0));
  protected readonly visible = computed(() =>
    this.cat() === 'ทั้งหมด' ? this.store.products() : this.store.products().filter((p) => p.cat === this.cat()),
  );
}
