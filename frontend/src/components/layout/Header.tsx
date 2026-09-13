"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lys } from "@/components/ui/Lys";
import { MagneticButton } from "@/components/ui/MagneticButton";

const NAV = [
  { href: "/episodes", label: "Épisodes" },
  { href: "/invites", label: "Invités" },
  { href: "/a-propos", label: "À propos" },
  { href: "/participer", label: "Participer" },
];

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) return;
    // Échap ferme le menu ; Tab reste dans le menu (focus trap) ; le focus revient au bouton.
    const focusables = () => Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? []
    );
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); burgerRef.current?.focus(); return; }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Fermer le menu quand la route change.
  useEffect(() => { setOpen(false); }, [pathname]);

  if (pathname === "/hall-of-fame") return null;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <header className={`nav${scrolled ? " scrolled" : ""}`} id="nav">
        <Link href="/" className="brand" aria-label="La Cabane du Lys — accueil">
          <Lys />
          <span className="bn">La Cabane du Lys<small>Entrepreneuriat · Brut</small></span>
        </Link>
        <nav className="links" aria-label="Navigation principale">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? "page" : undefined}>{n.label}</Link>
          ))}
        </nav>
        <MagneticButton><Link href="/contact" className="btn btn-ghost nav-cta" aria-current={isActive("/contact") ? "page" : undefined}>Contact</Link></MagneticButton>
        <button
          ref={burgerRef}
          className={`burger${open ? " open" : ""}`}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>
      </header>

      <div ref={menuRef} className={`mobile-menu${open ? " open" : ""}`} id="mobile-menu" aria-hidden={!open}>
        {NAV.map((n, i) => (
          <Link key={n.href} href={n.href} onClick={() => setOpen(false)} aria-current={isActive(n.href) ? "page" : undefined} tabIndex={open ? 0 : -1}>
            {n.label} <span>{String(i + 1).padStart(2, "0")}</span>
          </Link>
        ))}
        <Link href="/contact" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>Contact <span>{String(NAV.length + 1).padStart(2, "0")}</span></Link>
      </div>
    </>
  );
}
