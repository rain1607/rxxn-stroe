import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartStore, SHIPPING } from '../cart.store';
import { baht } from '../models';
import { ProductTile } from '../product-tile';

@Component({
  imports: [RouterLink, ProductTile],
  styleUrl: './cart.css',
  template: `
    <main class="page">
      <h1>ตะกร้าสินค้า</h1>
      <div class="layout">
        <section class="items">
          @if (!cart.lines().length) {
            <div class="empty">
              <p class="muted">ตะกร้าของคุณว่างอยู่</p>
              <a routerLink="/" class="btn big">เลือกซื้อสินค้า</a>
            </div>
          }
          @for (l of cart.lines(); track l.id) {
            <div class="line" data-testid="cart-line">
              <div class="thumb"><app-tile [bg]="l.bg" [image]="l.img" [alt]="l.name" [radius]="20" /></div>
              <div class="grow col" style="gap: 4px">
                <b>{{ l.name }}</b>
                <span class="muted small">{{ l.variant }}</span>
                <span class="small">{{ baht(l.price) }} / ชิ้น</span>
              </div>
              <div class="qty">
                <button type="button" aria-label="ลดจำนวน" (click)="cart.setQty(l.id, l.qty - 1)">−</button>
                <span>{{ l.qty }}</span>
                <button type="button" aria-label="เพิ่มจำนวน" (click)="cart.setQty(l.id, l.qty + 1)">+</button>
              </div>
              <b class="total">{{ baht(l.price * l.qty) }}</b>
              <button type="button" class="x" aria-label="ลบสินค้า" (click)="cart.remove(l.id)">✕</button>
            </div>
          }
          <a routerLink="/" class="more">← เลือกสินค้าต่อ</a>
        </section>
        <aside class="card sum">
          <h2>สรุปคำสั่งซื้อ</h2>
          <div class="between"><span>ยอดสินค้า</span><span>{{ baht(cart.subtotal()) }}</span></div>
          <div class="between"><span>ค่าจัดส่ง</span><span>{{ baht(cart.lines().length ? std : 0) }}</span></div>
          <div class="between grand"><span>ยอดรวม</span><span>{{ baht(cart.subtotal() + (cart.lines().length ? std : 0)) }}</span></div>
          <a routerLink="/checkout" class="btn big">ไปชำระเงิน</a>
        </aside>
      </div>
    </main>
  `,
})
export class Cart {
  protected readonly cart = inject(CartStore);
  protected readonly baht = baht;
  protected readonly std = SHIPPING.std;
}
