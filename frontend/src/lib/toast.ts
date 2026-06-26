"use client";

export interface ToastPayload { title: string; message?: string; }
const EVENT = "cabane:toast";

export function toast(title: string, message?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastPayload>(EVENT, { detail: { title, message } }));
}

export function onToast(handler: (p: ToastPayload) => void) {
  const fn = (e: Event) => handler((e as CustomEvent<ToastPayload>).detail);
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
}
