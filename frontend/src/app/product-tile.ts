import { Component, input } from '@angular/core';

/** ช่องแสดงรูปสินค้า: สีพื้น + ไอคอนถ้วย และรูปจริงทับถ้ามี */
@Component({
  selector: 'app-tile',
  template: `
    <div class="tile" [style.background]="bg()" [style.border-radius.px]="radius()">
      <svg width="40%" viewBox="0 0 64 64" fill="none" stroke="#2B2430" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 20h44c0 16-8 30-22 30S10 36 10 20z" /><path d="M22 56h20" /></svg>
      @if (image()) {
        <img [src]="image()" [alt]="alt()" />
      }
    </div>
  `,
  styles: `
    :host { display: block; }
    .tile { width: 100%; height: 100%; }
  `,
})
export class ProductTile {
  readonly bg = input('#FADCE4');
  readonly image = input<string | undefined>('');
  readonly alt = input('');
  readonly radius = input(14);
}
