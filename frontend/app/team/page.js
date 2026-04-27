"use client";

/**
 * UNMAPPED — Team Page
 * ────────────────────────────────────────────────────────────────────
 * The four people who built this.
 *
 * ⚠ TO ADD PROFILE PHOTOS:
 *   1. Open each LinkedIn profile (URLs in the TEAM array below).
 *   2. Right-click the profile picture → "Save image as…".
 *   3. Save into `frontend/public/team/` using these exact filenames:
 *        - umar.jpg
 *        - rizwan.jpg
 *        - zeeshan.jpg
 *        - taimoor.jpg
 *   The page auto-renders the photos. If a file is missing, the card
 *   falls back to a colored circle with the member's initials.
 *
 *   We do this manually because LinkedIn's CDN blocks hot-linking and
 *   issues short-lived signed URLs that expire — local files are the
 *   only reliable path.
 * ────────────────────────────────────────────────────────────────────
 */

import { useState } from "react";
import Link from "next/link";
import styles from "./team.module.css";
import ThemeToggle from "../../components/ThemeToggle";
import {
  Compass,
  ArrowRight,
  Heart,
  Github,
  Linkedin,
  Mail,
  Layers,
  FileText,
  Database,
  Shield,
  Sparkles,
  MessageCircle,
} from "../../components/Icons";

const TEAM = [
  {
    name: "Umar Ahad Usmani",
    initials: "UA",
    role: "Full-Stack & Agentic Workflow",
    Icon: Layers,
    tone: "var(--accent-marigold)",
    photo: "/team/umar.jpg",
    blurb:
      "Built the Next.js client, the FastAPI backend, and the agent orchestrator that ties them together. Designed the agentic workflow — narrative intake, Mirror Test, country-agnostic config swap — and shipped the UI Amara actually reads.",
    linkedin: "https://www.linkedin.com/in/umarahadusmani/",
    github: "https://github.com/umarahad2005",
    email: "mailto:umarahadusmani@gmail.com",
  },
  {
    name: "Hafiz Rizwan Umar",
    initials: "HR",
    role: "Documentation & System Design",
    Icon: FileText,
    tone: "var(--accent-forest)",
    photo: "/team/rizwan.jpg",
    blurb:
      "Architected the system: module boundaries, configuration schema, data-flow diagrams, the README and DOCUMENTATION.md. The reason a stranger can pick up this repo and ship a country pilot in a week.",
    linkedin: "https://www.linkedin.com/in/hafizrizwanumar/",
    github: null,
    email: null,
  },
  {
    name: "Zeeshan Jamal",
    initials: "ZJ",
    role: "Data & AI",
    Icon: Database,
    tone: "var(--accent-plum)",
    photo: "/team/zeeshan.jpg",
    blurb:
      "Wired ESCO, ISCO-08, O*NET, Frey-Osborne and the Wittgenstein projections. Recalibrated global automation risk for LMIC infrastructure realities — the honest delta the rubric rewards.",
    linkedin: "https://www.linkedin.com/in/zeeshan-jamal-data-scientist/",
    github: null,
    email: null,
  },
  {
    name: "M. Taimoor Ahsan",
    initials: "TA",
    role: "Cybersecurity & UI",
    Icon: Shield,
    tone: "var(--accent-terracotta)",
    photo: "/team/taimoor.jpg",
    blurb:
      "Hardened the surface: input sanitisation, CORS scope, rate-limit handling for the Gemini pipeline, and audit notes on PII flow. Co-shaped the UI so trust is felt, not promised.",
    linkedin: "https://www.linkedin.com/in/taimoorxahsan/",
    github: null,
    email: null,
  },
];

const SUPPORT = {
  whatsappNumber: "+92 333 4739757",
  whatsappLink: "https://wa.me/923334739757",
  email: "umarahadusmani@gmail.com",
};

/**
 * Avatar — uses the LinkedIn photo if present in /public/team/, else
 * falls back to a colored circle with the member's initials.
 */
function Avatar({ member }) {
  const [errored, setErrored] = useState(false);
  if (member.photo && !errored) {
    return (
      // plain <img> rather than next/image — files in /public/team/ may
      // not exist yet; onError-driven fallback keeps the page graceful.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={member.photo}
        alt={member.name}
        className={styles.memberAvatarImg}
        onError={() => setErrored(true)}
      />
    );
  }
  return (
    <div
      className={styles.memberAvatar}
      style={{ background: member.tone }}
      aria-hidden="true"
    >
      {member.initials}
    </div>
  );
}

export default function TeamPage() {
  return (
    <main className={styles.main}>
      <div className={styles.bgWash} aria-hidden="true" />

      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.logo} aria-label="UNMAPPED home">
            <span className={styles.logoIcon}><Compass size={22} /></span>
            <span className={styles.logoText}>UNMAPPED</span>
          </Link>
          <div className={styles.navLinks}>
            <Link href="/" className={styles.navLink}>Home</Link>
            <Link href="/profile" className={styles.navLink}>Map Skills</Link>
            <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
            <ThemeToggle />
            <Link href="/profile" className="btn btn-primary btn-sm">
              Start Mapping <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroBadge}>
            <Heart size={14} />
            <span>Made with love</span>
          </div>
          <h1 className={styles.heroTitle}>
            Meet the four people who built <span className={styles.heroAccent}>UNMAPPED</span>.
          </h1>
          <p className={styles.heroSubtitle}>
            We are four students at MIT Hack-Nation × World Bank Youth Summit. We met around one
            question — <em>how do we make every skill, in every place, visible?</em> — and shipped
            this prototype together over a single weekend.
          </p>
        </div>
      </section>

      {/* Team grid */}
      <section className={styles.teamSection}>
        <div className="container">
          <div className={styles.teamGrid}>
            {TEAM.map((m, i) => {
              const RoleIcon = m.Icon;
              return (
                <article key={i} className={styles.memberCard}>
                  <div className={styles.memberHeader}>
                    <Avatar member={m} />
                    <div className={styles.memberRoleBadge} style={{ color: m.tone }}>
                      <RoleIcon size={16} />
                      <span>{m.role}</span>
                    </div>
                  </div>

                  <h2 className={styles.memberName}>{m.name}</h2>
                  <p className={styles.memberBlurb}>{m.blurb}</p>

                  <div className={styles.memberLinks}>
                    <a
                      href={m.linkedin}
                      className={styles.linkBtn}
                      aria-label={`${m.name} on LinkedIn`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Linkedin size={18} />
                    </a>
                    {m.github ? (
                      <a
                        href={m.github}
                        className={styles.linkBtn}
                        aria-label={`${m.name} on GitHub`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Github size={18} />
                      </a>
                    ) : (
                      <span
                        className={`${styles.linkBtn} ${styles.linkBtnDisabled}`}
                        aria-hidden="true"
                        title="GitHub not provided"
                      >
                        <Github size={18} />
                      </span>
                    )}
                    {m.email ? (
                      <a
                        href={m.email}
                        className={styles.linkBtn}
                        aria-label={`Email ${m.name}`}
                      >
                        <Mail size={18} />
                      </a>
                    ) : (
                      <span
                        className={`${styles.linkBtn} ${styles.linkBtnDisabled}`}
                        aria-hidden="true"
                        title="Email not provided"
                      >
                        <Mail size={18} />
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Story / Made with love */}
      <section className={styles.storySection}>
        <div className="container">
          <div className={styles.storyCard}>
            <Sparkles size={24} style={{ color: "var(--accent-marigold)" }} />
            <h2 className={styles.storyTitle}>Why we built this</h2>
            <p className={styles.storyText}>
              Hundreds of millions of young people hold real, unrecognised skills. The
              credentialing systems built to map them simply don&apos;t reach them. UNMAPPED is our
              small bet that a lighter, locally-configurable infrastructure layer can — and that
              the right direction starts with treating Amara as the protagonist, not a data
              subject.
            </p>
            <div className={styles.lovePill}>
              <Heart size={14} />
              <span>Made with love · MIT Hack-Nation 2026</span>
            </div>
          </div>
        </div>
      </section>

      {/* Support */}
      <section className={styles.supportSection}>
        <div className="container">
          <div className={styles.supportCard}>
            <div className={styles.supportHeader}>
              <MessageCircle size={20} style={{ color: "var(--accent-forest)" }} />
              <h3 className={styles.supportTitle}>Need help, or want to plug UNMAPPED in?</h3>
            </div>
            <p className={styles.supportText}>
              Reach out for an integration call, a partner pilot, or just to say hello.
            </p>
            <div className={styles.supportLinks}>
              <a
                href={SUPPORT.whatsappLink}
                className={styles.supportPrimary}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={16} />
                <span>WhatsApp&nbsp;{SUPPORT.whatsappNumber}</span>
                <ArrowRight size={14} />
              </a>
              <a
                href={`mailto:${SUPPORT.email}`}
                className={styles.supportSecondary}
              >
                <Mail size={16} />
                <span>{SUPPORT.email}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerInner}>
            <div className={styles.footerLogo}>
              <Compass size={18} />
              <span>UNMAPPED</span>
            </div>
            <p className={styles.footerText}>
              Challenge 05 · World Bank Youth Summit × MIT Hack-Nation
            </p>
            <Link href="/" className={styles.footerHomeLink}>
              ← Back to home
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
