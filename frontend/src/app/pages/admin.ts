import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { baht, Product, salePrice } from '../models';
import { CATEGORIES, ProductStore } from '../product.store';
import { ProductTile } from '../product-tile';

interface Draft extends Omit<Product, 'colors' | 'sizes'> {
  colorsText: string;
  sizesText: string;
}

const SWATCHES: [string, string][] = [
  ['#FADCE4', 'ชมพูอ่อน'], ['#FFB5CC', 'ชมพู'], ['#E2B9DB', 'ม่วงอ่อน'], ['#9DC3E2', 'ฟ้า'], ['#9DD2D8', 'เขียวมิ้นต์'],
];

const split = (t: string) => t.split(',').map((x) => x.trim()).filter(Boolean);

@Component({
  imports: [FormsModule, RouterLink, ProductTile],
  styleUrl: './admin.css',
  template: `
    <main class="page">
      <div class="head">
        <div class="col" style="gap: 8px">
          <h1>จัดการสินค้า</h1>
          <span class="muted">แก้ไขแล้วกดบันทึก ข้อมูลจะแสดงผลในหน้าร้านทันที</span>
          <span class="muted small">ที่เก็บข้อมูล: local storage ของเบราว์เซอร์ (ds.products.v2)</span>
        </div>
        <div class="row" style="gap: 12px">
          <button type="button" class="btn ghost" (click)="reset()">คืนค่าเริ่มต้น</button>
          <button type="button" class="btn" (click)="addNew()">+ เพิ่มสินค้าใหม่</button>
        </div>
      </div>

      <div class="layout">
        <section class="card list">
          @for (p of store.products(); track p.id) {
            <button type="button" class="row-item" [class.on]="p.id === selId()" (click)="select(p)">
              <span class="th"><app-tile [bg]="p.bg" [image]="p.image" [alt]="p.name" [radius]="12" /></span>
              <span class="col grow"><b>{{ p.name }}</b><span class="muted small">{{ baht(p.price) }}</span></span>
            </button>
          }
        </section>

        <section class="card form">
          @if (draft(); as d) {
            <div class="between">
              <h2>แก้ไขสินค้า</h2>
              <a [routerLink]="['/product', d.id]" class="btn ghost">ดูหน้าสินค้า →</a>
            </div>
            <label class="f">ชื่อสินค้า<input type="text" [(ngModel)]="d.name" name="name" /></label>
            <div class="row">
              <label class="f grow">หมวดหมู่
                <select [(ngModel)]="d.cat" name="cat">
                  @for (c of cats(); track c) { <option [value]="c">{{ c }}</option> }
                </select>
              </label>
              <label class="f grow">ส่งจากจังหวัด<input type="text" [(ngModel)]="d.province" name="province" /></label>
            </div>
            <div class="row">
              <label class="f grow">ราคาปกติ (บาท)<input type="number" min="0" [(ngModel)]="d.price" name="price" /></label>
              <label class="f grow">ส่วนลดโปร 11.11 (%)
                <input type="number" min="0" max="90" [(ngModel)]="d.discount" name="discount" />
                <span class="hint">ใส่ 0 หากไม่ร่วมโปร · ราคาหลังลด {{ baht(sale(d)) }}</span>
              </label>
            </div>
            <div class="row">
              <label class="f grow">คะแนนรีวิว (0-5)<input type="number" min="0" max="5" step="0.1" [(ngModel)]="d.rating" name="rating" /></label>
              <label class="f grow">จำนวนรีวิว<input type="number" min="0" [(ngModel)]="d.reviews" name="reviews" /></label>
            </div>
            <label class="f">รูปสินค้า (URL https://)<input type="text" [(ngModel)]="d.image" name="image" placeholder="https://..." /></label>
            <div class="col" style="gap: 10px">
              <span class="lbl">สีพื้นหลังภาพสินค้า</span>
              <div class="row" style="gap: 12px">
                @for (w of swatches; track w[0]) {
                  <button type="button" class="sw" [attr.aria-label]="w[1]" [style.background]="w[0]" [class.on]="d.bg === w[0]" (click)="d.bg = w[0]"></button>
                }
              </div>
            </div>
            <label class="f">ตัวเลือกสี<input type="text" [(ngModel)]="d.colorsText" name="colors" /><span class="hint">คั่นด้วยจุลภาค · เว้นว่างถ้าไม่มีตัวเลือก</span></label>
            <label class="f">ตัวเลือกขนาด<input type="text" [(ngModel)]="d.sizesText" name="sizes" /><span class="hint">คั่นด้วยจุลภาค · เว้นว่างถ้าไม่มีตัวเลือก</span></label>
            <label class="f">คำอธิบายสินค้า<textarea [(ngModel)]="d.desc" name="desc"></textarea></label>
            <label class="f">ข้อมูลจำเพาะ<textarea [(ngModel)]="d.specs" name="specs"></textarea><span class="hint">บรรทัดละ 1 รายการ รูปแบบ ชื่อ: ค่า</span></label>
            <span role="status" class="muted">{{ msg() }}</span>
            <div class="row actions">
              <button type="button" class="btn big" (click)="saveIt()">บันทึกการแก้ไข</button>
              <button type="button" class="btn ghost big" (click)="removeIt()">ลบสินค้า</button>
            </div>
          } @else {
            <p class="muted">ยังไม่มีสินค้า กด "เพิ่มสินค้าใหม่" เพื่อเริ่มต้น</p>
          }
        </section>
      </div>
    </main>
  `,
})
export class Admin {
  protected readonly store = inject(ProductStore);
  protected readonly baht = baht;
  protected readonly sale = salePrice;
  protected readonly swatches = SWATCHES;
  protected readonly selId = signal<string | null>(this.store.products()[0]?.id ?? null);
  protected readonly draft = signal<Draft | null>(this.toDraft(this.store.products()[0]));
  protected readonly msg = signal('');
  protected readonly cats = computed(() => {
    const c = [...CATEGORIES];
    const cur = this.draft()?.cat;
    if (cur && !c.includes(cur)) c.push(cur);
    return c;
  });

  private toDraft(p: Product | undefined): Draft | null {
    if (!p) return null;
    const { colors, sizes, ...rest } = p;
    return { ...rest, colorsText: colors.join(', '), sizesText: sizes.join(', ') };
  }

  protected select(p: Product) {
    this.selId.set(p.id);
    this.draft.set(this.toDraft(p));
    this.msg.set('');
  }

  protected saveIt() {
    const d = this.draft();
    if (!d) return;
    if (!d.name.trim()) return this.msg.set('กรุณาใส่ชื่อสินค้า');
    const { colorsText, sizesText, ...rest } = d;
    this.store.save({
      ...rest,
      price: Math.max(0, Number(d.price) || 0),
      discount: Math.min(90, Math.max(0, Number(d.discount) || 0)),
      rating: Math.min(5, Math.max(0, Number(d.rating) || 0)),
      reviews: Math.max(0, Math.round(Number(d.reviews) || 0)),
      colors: split(colorsText),
      sizes: split(sizesText),
    });
    this.msg.set('บันทึกแล้ว · ตรวจดูหน้าร้านได้เลย');
  }

  protected removeIt() {
    const d = this.draft();
    if (!d) return;
    if (this.store.products().length <= 1) return this.msg.set('ต้องมีสินค้าอย่างน้อย 1 รายการ');
    this.store.remove(d.id);
    this.select(this.store.products()[0]);
  }

  protected addNew() {
    const order = this.store.products().reduce((m, x) => Math.max(m, x.order), 0) + 1;
    const p: Product = {
      id: 'p' + Date.now(), order, name: 'สินค้าใหม่', cat: 'ถ้วย', price: 0, discount: 0, bg: '#FADCE4', fg: '#2B2430',
      rating: 0, reviews: 0, province: '', colors: [], sizes: [], desc: '', specs: '',
    };
    this.store.save(p);
    this.select(p);
    this.msg.set('กรอกรายละเอียดแล้วกดบันทึกการแก้ไข');
  }

  protected reset() {
    this.store.reset();
    this.select(this.store.products()[0]);
    this.msg.set('คืนค่าเริ่มต้นแล้ว');
  }
}
