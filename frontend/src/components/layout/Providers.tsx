"use client";
import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SmoothScroll } from "./SmoothScroll";
import { AudioPlayerProvider } from "@/features/audio";

/** Fournisseurs globaux : TanStack Query (cache API), lecteur audio persistant, Lenis (smooth scroll). */
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } } })
  );
  return (
    <QueryClientProvider client={client}>
      <AudioPlayerProvider>
        <SmoothScroll>{children}</SmoothScroll>
      </AudioPlayerProvider>
    </QueryClientProvider>
  );
}
