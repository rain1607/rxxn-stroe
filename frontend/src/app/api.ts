export const API_BASE = 'http://localhost:3000/api';

/**
 * เรียก API ของ backend; คืน null เมื่อเรียกไม่ได้ (เซิร์ฟเวอร์ปิด/error)
 * เพื่อให้ store ใช้ข้อมูลใน localStorage ต่อได้
 */
export async function api<T>(method: string, path: string, body?: unknown): Promise<T | null> {
  try {
    const res = await fetch(API_BASE + path, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) return null;
    return res.status === 204 ? (true as T) : ((await res.json()) as T);
  } catch {
    return null;
  }
}
