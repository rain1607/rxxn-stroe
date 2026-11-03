import { computed, Injectable } from '@angular/core';
import { api } from './api';
import { Product } from './models';
import { storedSignal } from './local-storage';

const mk = (
  id: string, name: string, cat: string, price: number, discount: number, bg: string,
  rating: number, reviews: number, province: string, colors: string[], sizes: string[], desc: string,
): Product => ({
  id, order: Number(id.slice(1)), name, cat, price, discount, bg, fg: '#2B2430', rating, reviews, province,
  colors, sizes, desc,
  specs: id === 'p1'
    ? 'วัสดุ: เซรามิกสโตนแวร์\nความจุ: 250-400 มล.\nการรับประกัน: [ระบุระยะเวลารับประกัน]'
    : 'วัสดุ: เซรามิก',
});

export const DEFAULT_PRODUCTS: Product[] = [
  mk('p1', 'ถ้วยกาแฟเซรามิก', 'ถ้วย', 390, 11, '#FADCE4', 4.8, 126, 'เชียงใหม่', ['เขียวเทา', 'ครีม', 'น้ำตาลดิน'], ['250 มล.', '350 มล.', '400 มล.'], 'ถ้วยปั้นมือเคลือบเขียวเทา ขอบบางจับถนัดมือ ใช้กับไมโครเวฟและเครื่องล้างจานได้'),
  mk('p2', 'จานข้าวทรงลึก', 'จาน', 520, 11, '#9DC3E2', 4.6, 84, 'ลำปาง', ['ครีม', 'ฟ้า'], ['8 นิ้ว', '10 นิ้ว'], 'จานทรงลึกเหมาะกับข้าวและแกง เคลือบเงาทนความร้อน'),
  mk('p3', 'แจกันคอยาว', 'แจกัน', 890, 11, '#9DD2D8', 4.9, 212, 'เชียงใหม่', ['ขาว', 'เขียวมิ้นต์'], ['เล็ก', 'ใหญ่'], 'แจกันคอยาวทรงเพรียว เหมาะกับดอกไม้ก้านยาว'),
  mk('p4', 'ชามซุปเคลือบเขียว', 'ชาม', 450, 11, '#E2B9DB', 4.5, 57, 'ราชบุรี', ['เขียว'], ['500 มล.'], 'ชามซุปเคลือบเขียวเข้ม ขอบหนาจับไม่ร้อน'),
  mk('p5', 'แก้วน้ำทรงสูง', 'ถ้วย', 320, 11, '#FFB5CC', 4.7, 98, 'ลำปาง', ['ชมพู', 'ขาว'], ['300 มล.', '400 มล.'], 'แก้วเซรามิกทรงสูง ใส่ได้ทั้งน้ำเย็นและน้ำร้อน'),
  mk('p6', 'จานรองขนมกลม', 'จาน', 280, 11, '#FADCE4', 4.4, 41, 'นนทบุรี', ['ขาว'], ['6 นิ้ว'], 'จานรองขนมขนาดเล็ก วางคู่กับถ้วยกาแฟได้พอดี'),
  mk('p7', 'กระถางต้นไม้เล็ก', 'แจกัน', 350, 11, '#9DD2D8', 4.6, 63, 'ราชบุรี', ['ดินเผา'], ['เล็ก', 'กลาง'], 'กระถางดินเผาเล็ก มีรูระบายน้ำ เหมาะกับไม้อวบน้ำ'),
  mk('p8', 'ชุดน้ำชา 4 ใบ', 'ชุดของขวัญ', 1290, 0, '#E2B9DB', 5.0, 36, 'เชียงใหม่', [], [], 'ชุดน้ำชา 4 ใบพร้อมกล่อง เหมาะเป็นของขวัญ'),
];

export const CATEGORIES = ['ถ้วย', 'จาน', 'แจกัน', 'ชาม', 'ชุดของขวัญ'];

/** localStorage key: ds.products.v2 */
@Injectable({ providedIn: 'root' })
export class ProductStore {
  private readonly state = storedSignal<Product[]>('ds.products.v2', () => DEFAULT_PRODUCTS);

  readonly products = computed(() => [...this.state()].sort((a, b) => a.order - b.order));
  readonly promos = computed(() => this.products().filter((p) => p.discount > 0));

  constructor() {
    // เขียนค่าเริ่มต้นลง localStorage ครั้งแรก แล้วดึงจาก API มาแทนที่ถ้าเรียกได้
    this.state.commit(this.state());
    api<Product[]>('GET', '/products').then((list) => {
      if (list?.length) this.state.commit(list);
    });
  }

  find(id: string | null | undefined): Product | undefined {
    return this.products().find((p) => p.id === id);
  }

  save(p: Product) {
    const list = this.state();
    const exists = list.some((x) => x.id === p.id);
    this.state.commit(exists ? list.map((x) => (x.id === p.id ? p : x)) : [...list, p]);
    // สินค้าใหม่ยังไม่มีใน DB จึงลอง PUT ก่อน ถ้าไม่พบค่อย POST
    api<Product>('PUT', `/products/${p.id}`, p).then((r) => r ?? api('POST', '/products', p));
  }

  remove(id: string) {
    this.state.commit(this.state().filter((p) => p.id !== id));
    api('DELETE', `/products/${id}`);
  }

  async reset() {
    const current = this.state();
    this.state.commit(DEFAULT_PRODUCTS);
    const keep = new Set(DEFAULT_PRODUCTS.map((p) => p.id));
    for (const p of current) if (!keep.has(p.id)) await api('DELETE', `/products/${p.id}`);
    for (const p of DEFAULT_PRODUCTS) {
      if (!(await api('PUT', `/products/${p.id}`, p))) await api('POST', '/products', p);
    }
  }
}
