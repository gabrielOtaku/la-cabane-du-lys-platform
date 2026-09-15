import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Administration · La Cabane du Lys",
  robots: { index: false, follow: false },
};

/** Les pages du back office rendent chacune un AdminShell (garde par rôle côté client). */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
