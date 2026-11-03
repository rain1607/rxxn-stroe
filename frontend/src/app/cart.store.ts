import { computed, Injectable } from '@angular/core';
import { api } from './api';
import { CartLine, Product, salePrice } from './models';
import { storedSignal } from './local-storage';

export const SHIPPING = { std: 50, fast: 90 } as const;

/** localStorage key: ds.cart.v1 */
@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly state = storedSignal<CartLine[]>('ds.cart.v1', () => []);

  readonly lines = this.state.asReadonly();
  readonly count = computed(() => this.state().reduce((t, l) => t + l.qty, 0));
  readonly subtotal = computed(() => this.state().reduce((s, l) => s + l.price * l.qty, 0));

  constructor() {
    api<{ items: CartLine[] }>('GET', '/cart').then((cart) => {
      if (cart) this.state.commit(cart.items);
    });
  }

  add(p: Product, colorIndex: number, sizeIndex: number, qty: number) {
    api('POST', '/cart/items', { productId: p.id, colorIndex, sizeIndex, qty });
    const ci = p.colors.length ? Math.min(colorIndex, p.colors.length - 1) : 0;
    const si = p.sizes.length ? Math.min(sizeIndex, p.sizes.length - 1) : 0;
    const id = `${p.id}-${ci}-${si}`;
    const parts: string[] = [];
    if (p.colors.length) parts.push('สี: ' + p.colors[ci]);
    if (p.sizes.length) parts.push('ขนาด: ' + p.sizes[si]);
    const price = salePrice(p);
    const lines = this.state();
    this.state.commit(
      lines.some((l) => l.id === id)
        ? lines.map((l) => (l.id === id ? { ...l, qty: l.qty + qty, price } : l))
        : [...lines, { id, name: p.name, variant: parts.join(' · ') || 'ตัวเลือกมาตรฐาน', price, qty, bg: p.bg, fg: p.fg, img: p.image }],
    );
  }

  setQty(id: string, qty: number) {
    const q = Math.max(1, qty);
    this.state.commit(this.state().map((l) => (l.id === id ? { ...l, qty: q } : l)));
    api('PATCH', `/cart/items/${id}`, { qty: q });
  }

  remove(id: string) {
    this.state.commit(this.state().filter((l) => l.id !== id));
    api('DELETE', `/cart/items/${id}`);
  }

  clear() {
    this.state.commit([]);
    api('DELETE', '/cart');
  }
}
