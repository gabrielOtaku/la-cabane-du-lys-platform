"use client";
import dynamic from "next/dynamic";

// R3F a besoin du navigateur : chargement strictement côté client.
const EmberField = dynamic(() => import("./EmberField"), {
  ssr: false,
  loading: () => null,
});

export function EmberFieldWrapper() {
  return <EmberField />;
}
