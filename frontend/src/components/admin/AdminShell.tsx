"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useSession } from "@/lib/auth";
import { Skeleton } from "@/components/ui/States";

const NAV = [
  { href: "/admin", label: "Vue d'ensemble", exact: true },
  { href: "/admin/episodes", label: "Épisodes" },
  { href: "/admin/invites", label: "Invités" },
  { href: "/admin/drops", label: "Drops" },
  { href: "/admin/produits", label: "Pièces" },
  { href: "/admin/commandes", label: "Commandes" },
  { href: "/admin/journal", label: "Journal" },
];

/**
 * Coquille du back office : garde d'affichage par rôle (la vraie protection est serveur),
 * navigation secondaire et titre. Toute page admin est rendue à l'intérieur.
 */
export function AdminShell({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const { data: session, isLoading } = useSession();

  if (isLoading) {
    return <div className="subpage"><div className="container admin"><Skeleton lines={3} width="40%" /></div></div>;
  }

  if (!session) {
    return (
      <div className="subpage">
        <div className="container admin">
          <div className="state-box" role="alert">
            <p>Connexion requise.</p>
            <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="btn btn-solid">Se connecter</Link>
          </div>
        </div>
      </div>
    );
  }

  if (session.role !== "ADMIN") {
    return (
      <div className="subpage">
        <div className="container admin">
          <div className="state-box" role="alert">
            <p>Cet espace est réservé à l&apos;administration.</p>
            <span className="player-note">Connecté·e en tant que {session.email}.</span>
            <Link href="/" className="btn btn-ghost">Retour au site</Link>
          </div>
        </div>
      </div>
    );
  }

  const active = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(href + "/"));

  return (
    <div className="subpage">
      <div className="container admin">
        <nav className="admin-nav" aria-label="Administration">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={active(n.href, n.exact) ? "page" : undefined}>{n.label}</Link>
          ))}
        </nav>
        <header className="admin-head">
          <div>
            <span className="eyebrow">Back office</span>
            <h1 className="admin-title">{title}</h1>
          </div>
          {actions && <div className="admin-actions">{actions}</div>}
        </header>
        {children}
      </div>
    </div>
  );
}
