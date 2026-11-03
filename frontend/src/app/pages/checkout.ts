import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartStore, SHIPPING } from '../cart.store';
import { baht } from '../models';
import { ProductTile } from '../product-tile';

type ShipId = keyof typeof SHIPPING;

@Component({
  imports: [RouterLink, ProductTile],
  styleUrl: './checkout.css',
  template: `
    <main class="page narrow">
      @if (done()) {
        <div class="done">
          <div class="ok">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#A33B68" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          </div>
          <h1>สั่งซื้อสำเร็จ</h1>
          <p class="muted">ขอบคุณที่อุดหนุน RXXN.STUDIO<br />เราจะส่งรายละเอียดการจัดส่งให้ทางอีเมล</p>
          <a routerLink="/" class="btn big">กลับไปเลือกสินค้าต่อ</a>
        </div>
      } @else {
        <nav class="crumbs" aria-label="ขั้นตอน">
          <a routerLink="/cart">ตะกร้า</a><span aria-hidden="true">›</span><b>ชำระเงิน</b><span aria-hidden="true">›</span><span>เสร็จสิ้น</span>
        </nav>
        <h1>ชำระเงิน</h1>
        <div class="layout">
          <div class="forms">
            <section class="card sec">
              <h2><span class="n">1</span>ข้อมูลการจัดส่ง</h2>
              <div class="row">
                <label class="f grow">ชื่อ-นามสกุล<input type="text" autocomplete="name" /></label>
                <label class="f grow">เบอร์โทรศัพท์<input type="tel" autocomplete="tel" /></label>
              </div>
              <label class="f">อีเมล<input type="email" autocomplete="email" /></label>
              <label class="f">ที่อยู่<input type="text" autocomplete="street-address" /></label>
              <div class="row">
                <label class="f grow">จังหวัด<input type="text" /></label>
                <label class="f grow">รหัสไปรษณีย์<input type="text" inputmode="numeric" autocomplete="postal-code" /></label>
              </div>
              <fieldset class="opts">
                <legend>วิธีจัดส่ง</legend>
                @for (s of shipOptions; track s.id) {
                  <label class="opt" [class.on]="ship() === s.id">
                    <input type="radio" name="ship" [checked]="ship() === s.id" (change)="ship.set(s.id)" />
                    <span class="grow">{{ s.label }}</span><b>{{ baht(s.price) }}</b>
                  </label>
                }
              </fieldset>
            </section>

            <section class="card sec">
              <h2><span class="n">2</span>วิธีชำระเงิน</h2>
              <fieldset class="opts grid">
                <legend class="sr">วิธีชำระเงิน</legend>
                @for (m of methods; track m.id) {
                  <label class="opt" [class.on]="pay() === m.id">
                    <input type="radio" name="pay" [checked]="pay() === m.id" (change)="pay.set(m.id)" />{{ m.label }}
                  </label>
                }
              </fieldset>
              @if (pay() === 'card') {
                <div class="row">
                  <label class="f" style="flex: 1 1 100%">หมายเลขบัตร<input type="text" inputmode="numeric" autocomplete="cc-number" /></label>
                  <label class="f grow">วันหมดอายุ (เดือน/ปี)<input type="text" inputmode="numeric" autocomplete="cc-exp" /></label>
                  <label class="f grow">รหัส CVV<input type="text" inputmode="numeric" autocomplete="cc-csc" /></label>
                </div>
              }
            </section>
          </div>

          <aside class="summary">
            <div class="between top"><h2>สรุปคำสั่งซื้อ</h2><span class="muted small">{{ cart.count() }} ชิ้น</span></div>
            @if (!cart.lines().length) {
              <p class="muted">ตะกร้ายังว่าง <a routerLink="/" class="link">เลือกสินค้า →</a></p>
            }
            @for (l of cart.lines(); track l.id) {
              <div class="mini">
                <div class="mt">
                  <app-tile [bg]="l.bg" [image]="l.img" [alt]="l.name" />
                  <span class="q">{{ l.qty }}</span>
                </div>
                <div class="grow col"><b>{{ l.name }}</b><span class="muted small">{{ l.variant }}</span></div>
                <b>{{ baht(l.price * l.qty) }}</b>
              </div>
            }
            <div class="col calc">
              <div class="between"><span>ราคาสินค้า</span><span>{{ baht(cart.subtotal()) }}</span></div>
              <div class="between"><span>ค่าจัดส่ง</span><span>{{ baht(shipping()) }}</span></div>
            </div>
            <div class="between grand"><span>รวมทั้งหมด</span><b>{{ baht(cart.subtotal() + shipping()) }}</b></div>
            <button type="button" class="btn big" (click)="place()">ยืนยันการสั่งซื้อ</button>
            <a routerLink="/cart" class="back">← กลับไปแก้ไขตะกร้า</a>
          </aside>
        </div>
      }
    </main>
  `,
})
export class Checkout {
  protected readonly cart = inject(CartStore);
  protected readonly baht = baht;
  protected readonly done = signal(false);
  protected readonly ship = signal<ShipId>('std');
  protected readonly pay = signal('card');
  protected readonly shipOptions: { id: ShipId; label: string; price: number }[] = [
    { id: 'std', label: 'จัดส่งมาตรฐาน', price: SHIPPING.std },
    { id: 'fast', label: 'จัดส่งด่วน', price: SHIPPING.fast },
  ];
  protected readonly methods = [
    { id: 'card', label: 'บัตรเครดิต / เดบิต' },
    { id: 'qr', label: 'พร้อมเพย์ (PromptPay)' },
    { id: 'cod', label: 'เก็บเงินปลายทาง' },
  ];
  protected readonly shipping = computed(() => (this.cart.lines().length ? SHIPPING[this.ship()] : 0));

  protected place() {
    this.cart.clear();
    this.done.set(true);
  }
}
