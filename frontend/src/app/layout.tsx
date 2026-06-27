import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";

import { Providers } from "@/components/layout/Providers";
import { Preloader } from "@/components/layout/Preloader";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CustomCursor } from "@/components/layout/CustomCursor";
import { AnimatedMain } from "@/components/layout/AnimatedMain";
import { LysDefs } from "@/components/ui/Lys";
import { Toaster } from "@/components/ui/Toaster";
import { EmberFieldWrapper } from "@/components/3d/EmberFieldWrapper";

const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif", display: "swap" });
const sans = Manrope({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "La Cabane du Lys — La vérité brute de l'entrepreneuriat",
  description:
    "Le podcast qui démystifie l'entrepreneuriat et contre les fausses promesses d'argent facile. Né au cœur du Cégep de Saint-Félicien.",
  metadataBase: new URL("https://cabanedulys.ca"),
};

export const viewport: Viewport = {
  themeColor: "#0d0d0d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <Providers>
          <LysDefs />
          <Preloader />
          <EmberFieldWrapper />
          <CustomCursor />
          <Header />
          <AnimatedMain>{children}</AnimatedMain>
          <Footer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}