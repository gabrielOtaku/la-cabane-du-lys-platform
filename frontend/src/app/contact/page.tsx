import Link from "next/link";
import { ArrowLeft, Mail, Youtube } from "lucide-react";
import { PLATFORM_LINKS } from "@/lib/platforms";

const CONTACT_EMAIL = "lacabanedulys@gmail.com";

export const metadata = {
  title: "Contact · La Cabane du Lys",
  description: "Contactez l'équipe de La Cabane du Lys.",
};

export default function ContactPage() {
  return (
    <div className="subpage">
      <div className="container">
        <Link href="/" className="back-link"><ArrowLeft size={16} /> Accueil</Link>
        <div className="page-head" data-reveal>
          <span className="eyebrow">Contact</span>
          <h1 className="sec-title">Parlons-en.</h1>
          <p className="lead">Une question, un partenariat, une idée d&apos;épisode ? Écrivez-nous directement.</p>
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", marginTop: 40 }}>
          <a href={`mailto:${CONTACT_EMAIL}`} className="btn btn-solid">
            <Mail size={16} /> {CONTACT_EMAIL}
          </a>
          <a href={PLATFORM_LINKS.youtube} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
            <Youtube size={16} /> YouTube
          </a>
        </div>
      </div>
    </div>
  );
}
