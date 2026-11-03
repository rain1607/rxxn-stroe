export interface Product {
  id: string;
  order: number;
  name: string;
  cat: string;
  price: number;
  discount: number;
  bg: string;
  fg: string;
  image?: string;
  rating: number;
  reviews: number;
  province: string;
  colors: string[];
  sizes: string[];
  desc: string;
  specs: string;
}

export interface CartLine {
  id: string;
  name: string;
  variant: string;
  price: number;
  qty: number;
  bg: string;
  fg: string;
  img?: string;
}

export interface Review {
  id: string;
  productId: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export const salePrice = (p: Pick<Product, 'price' | 'discount'>) =>
  Math.round(p.price * (1 - (p.discount || 0) / 100));

export const baht = (n: number) => '฿' + Math.round(n).toLocaleString('en-US');
