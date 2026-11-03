import { signal, WritableSignal } from '@angular/core';

/**
 * signal ที่ซิงก์กับ localStorage: อ่านค่าตอนสร้าง, เขียนกลับทุกครั้งที่เปลี่ยน,
 * และอัปเดตเมื่อแท็บอื่นแก้ key เดียวกัน (storage event)
 */
export function storedSignal<T>(key: string, fallback: () => T): WritableSignal<T> & { commit: (v: T) => void } {
  const read = (): T => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback();
    } catch {
      return fallback();
    }
  };
  const state = signal<T>(read());
  const commit = (v: T) => {
    state.set(v);
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch {
      // localStorage ใช้ไม่ได้ (private mode ฯลฯ) — ใช้ค่าในหน่วยความจำต่อ
    }
  };
  window.addEventListener('storage', (e) => {
    if (e.key === key) state.set(read());
  });
  return Object.assign(state, { commit });
}
