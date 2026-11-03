export type SeedProduct = {
  id: string; name: string; category: string; price: number; discount: number; bg: string;
  rating: number; reviewCount: number; province: string; colors: string[]; sizes: string[];
  description: string; specs: string;
};

// ข้อมูลเดียวกับ defaults() ในดีไซน์ (ds.products.v2)
export const products: SeedProduct[] = [
  { id: 'p1', name: 'ถ้วยกาแฟเซรามิก', category: 'ถ้วย', price: 390, discount: 11, bg: '#FADCE4', rating: 4.8, reviewCount: 126, province: 'เชียงใหม่', colors: ['เขียวเทา', 'ครีม', 'น้ำตาลดิน'], sizes: ['250 มล.', '350 มล.', '400 มล.'], description: 'ถ้วยปั้นมือเคลือบเขียวเทา ขอบบางจับถนัดมือ ใช้กับไมโครเวฟและเครื่องล้างจานได้', specs: 'วัสดุ: เซรามิกสโตนแวร์\nความจุ: 250-400 มล.\nการรับประกัน: [ระบุระยะเวลารับประกัน]' },
  { id: 'p2', name: 'จานข้าวทรงลึก', category: 'จาน', price: 520, discount: 11, bg: '#9DC3E2', rating: 4.6, reviewCount: 84, province: 'ลำปาง', colors: ['ครีม', 'ฟ้า'], sizes: ['8 นิ้ว', '10 นิ้ว'], description: 'จานทรงลึกเหมาะกับข้าวและแกง เคลือบเงาทนความร้อน', specs: 'วัสดุ: เซรามิก' },
  { id: 'p3', name: 'แจกันคอยาว', category: 'แจกัน', price: 890, discount: 11, bg: '#9DD2D8', rating: 4.9, reviewCount: 212, province: 'เชียงใหม่', colors: ['ขาว', 'เขียวมิ้นต์'], sizes: ['เล็ก', 'ใหญ่'], description: 'แจกันคอยาวทรงเพรียว เหมาะกับดอกไม้ก้านยาว', specs: 'วัสดุ: เซรามิก' },
  { id: 'p4', name: 'ชามซุปเคลือบเขียว', category: 'ชาม', price: 450, discount: 11, bg: '#E2B9DB', rating: 4.5, reviewCount: 57, province: 'ราชบุรี', colors: ['เขียว'], sizes: ['500 มล.'], description: 'ชามซุปเคลือบเขียวเข้ม ขอบหนาจับไม่ร้อน', specs: 'วัสดุ: เซรามิก' },
  { id: 'p5', name: 'แก้วน้ำทรงสูง', category: 'ถ้วย', price: 320, discount: 11, bg: '#FFB5CC', rating: 4.7, reviewCount: 98, province: 'ลำปาง', colors: ['ชมพู', 'ขาว'], sizes: ['300 มล.', '400 มล.'], description: 'แก้วเซรามิกทรงสูง ใส่ได้ทั้งน้ำเย็นและน้ำร้อน', specs: 'วัสดุ: เซรามิก' },
  { id: 'p6', name: 'จานรองขนมกลม', category: 'จาน', price: 280, discount: 11, bg: '#FADCE4', rating: 4.4, reviewCount: 41, province: 'นนทบุรี', colors: ['ขาว'], sizes: ['6 นิ้ว'], description: 'จานรองขนมขนาดเล็ก วางคู่กับถ้วยกาแฟได้พอดี', specs: 'วัสดุ: เซรามิก' },
  { id: 'p7', name: 'กระถางต้นไม้เล็ก', category: 'แจกัน', price: 350, discount: 11, bg: '#9DD2D8', rating: 4.6, reviewCount: 63, province: 'ราชบุรี', colors: ['ดินเผา'], sizes: ['เล็ก', 'กลาง'], description: 'กระถางดินเผาเล็ก มีรูระบายน้ำ เหมาะกับไม้อวบน้ำ', specs: 'วัสดุ: เซรามิก' },
  { id: 'p8', name: 'ชุดน้ำชา 4 ใบ', category: 'ชุดของขวัญ', price: 1290, discount: 0, bg: '#E2B9DB', rating: 5.0, reviewCount: 36, province: 'เชียงใหม่', colors: [], sizes: [], description: 'ชุดน้ำชา 4 ใบพร้อมกล่อง เหมาะเป็นของขวัญ', specs: 'วัสดุ: เซรามิก' }
];

export const reviews = [
  { productId: 'p1', author: 'มานี', rating: 5, comment: 'ถ้วยสวยมาก จับถนัดมือ สีตรงปก' },
  { productId: 'p1', author: 'สมชาย', rating: 4, comment: 'คุณภาพดี แพ็กมาอย่างดี ไม่แตก' },
  { productId: 'p2', author: 'วิภา', rating: 5, comment: 'ใส่ข้าวแกงกำลังดี เคลือบเงาสวย' },
  { productId: 'p3', author: 'ปราณี', rating: 5, comment: 'แจกันเพรียวสวย ใส่ดอกไม้แล้วดูดีมาก' },
  { productId: 'p8', author: 'ธนา', rating: 5, comment: 'ซื้อเป็นของขวัญ ผู้รับชอบมาก' }
];

export const cartItems = [
  { id: 'p1-0-1', productId: 'p1', qty: 2, variant: 'สี: เขียวเทา · ขนาด: 350 มล.' }
];
