import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', title: 'รายการสินค้า', loadComponent: () => import('./pages/product-list').then((m) => m.ProductList) },
  { path: 'product/:id', title: 'รายละเอียดสินค้า', loadComponent: () => import('./pages/product-info').then((m) => m.ProductInfo) },
  { path: 'cart', title: 'ตะกร้าสินค้า', loadComponent: () => import('./pages/cart').then((m) => m.Cart) },
  { path: 'checkout', title: 'ชำระเงิน', loadComponent: () => import('./pages/checkout').then((m) => m.Checkout) },
  { path: 'admin', title: 'Admin จัดการสินค้า', loadComponent: () => import('./pages/admin').then((m) => m.Admin) },
  { path: '**', redirectTo: '' },
];
