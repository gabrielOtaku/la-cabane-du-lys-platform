"use client";
import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { onToast, type ToastPayload } from "@/lib/toast";

export function Toaster() {
  const [data, setData] = useState<ToastPayload | null>(null);
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return onToast((p) => {
      setData(p);
      setShow(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setShow(false), 4200);
    });
  }, []);

  return (
    <div className={`toast${show ? " show" : ""}`} role="status" aria-live="polite">
      <Check size={22} />
      <div>
        <b>{data?.title ?? ""}</b>
        {data?.message && <p>{data.message}</p>}
      </div>
    </div>
  );
}
