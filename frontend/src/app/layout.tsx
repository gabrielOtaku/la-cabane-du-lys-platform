import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
// Ordre significatif : voir le commentaire de globals.css (phase 6, styles modulaires).
import "./globals.css";
import "../styles/base/tokens.css";
import "../styles/base/base.css";
import "../styles/base/loader.css";
import "../styles/base/nav.css";
import "../styles/base/hero.css";
import "../styles/base/manifeste.css";
import "../styles/base/coffre.css";
import "../styles/base/salle.css";
import "../styles/base/cercle.css";
import "../styles/base/reserve.css";
import "../styles/base/diffusion.css";
import "../styles/base/footer.css";
import "../styles/base/responsive.css";
import "../styles/base/pages.css";
import "../styles/gravure.css";
import "../styles/v2.css";
import "../styles/audio.css";
import "../styles/cursor.css";
import "../styles/admin.css";

import { Providers } from "@/components/layout/Providers";
import { Preloader } from "@/components/layout/Preloader";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CustomCursor } from "@/components/layout/CustomCursor";
import { AnimatedMain } from "@/components/layout/AnimatedMain";
import { LysDefs } from "@/components/ui/Lys";
import { Toaster } from "@/components/ui/Toaster";
import { EmberFieldWrapper } from "@/components/3d/EmberFieldWrapper";
import { MiniPlayer } from "@/features/audio";

const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif", display: "swap" });
const sans = Manrope({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cabanedulys.ca";

export const metadata: Metadata = {
  title: "La Cabane du Lys — La vérité brute de l'entrepreneuriat",
  description:
    "Le podcast qui démystifie l'entrepreneuriat et contre les fausses promesses d'argent facile. Né au cœur du Cégep de Saint-Félicien.",
  metadataBase: new URL(SITE_URL),
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
        <a href="#contenu" className="skip-link">Aller au contenu</a>
        <Providers>
          <LysDefs />
          <Preloader />
          <EmberFieldWrapper />
          <CustomCursor />
          <Header />
          <AnimatedMain>{children}</AnimatedMain>
          <Footer />
          <MiniPlayer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
