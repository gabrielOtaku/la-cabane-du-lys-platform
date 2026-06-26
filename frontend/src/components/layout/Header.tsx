"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Lys } from "@/components/ui/Lys";
import { ScrollLink } from "@/components/ui/ScrollLink";

const NAV = [
  { href: "#manifeste", label: "Le Manifeste" },
  { href: "#coffre", label: "Le Coffre" },
  { href: "#salle", label: "La Salle des Trophées" },
  { href: "#reserve", label: "La Réserve" },
];

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  if (pathname === "/hall-of-fame") return null;

  return (
    <>
      <header className={`nav${scrolled ? " scrolled" : ""}`} id="nav">
        <ScrollLink to="#edifice" className="brand">
          <Lys />
          <span className="bn">La Cabane du Lys<small>Entrepreneuriat · Brut</small></span>
        </ScrollLink>
        <nav className="links">
          {NAV.map((n) => <ScrollLink key={n.href} to={n.href}>{n.label}</ScrollLink>)}
        </nav>
        <ScrollLink to="#cercle" className="btn btn-ghost nav-cta">Le Cercle</ScrollLink>
        <button className={`burger${open ? " open" : ""}`} aria-label="Menu" onClick={() => setOpen((v) => !v)}>
          <span /><span /><span />
        </button>
      </header>

      <div className={`mobile-menu${open ? " open" : ""}`}>
        {NAV.map((n, i) => (
          <ScrollLink key={n.href} to={n.href} onNavigate={() => setOpen(false)}>
            {n.label} <span>{String(i + 1).padStart(2, "0")}</span>
          </ScrollLink>
        ))}
        <ScrollLink to="#cercle" onNavigate={() => setOpen(false)}>Le Cercle <span>05</span></ScrollLink>
      </div>
    </>
  );
}
