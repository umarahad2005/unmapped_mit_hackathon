"use client";

/**
 * UNMAPPED — Team Page
 * Four students. One mission. Replace TODO names below with your own.
 */

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
  Code,
  Cpu,
  Palette,
  Database,
  Sparkles,
} from "../../components/Icons";

// ─── Edit your team here ─────────────────────────────────────────────
// Replace name / handle / links / blurb with your real team details.
const TEAM = [
  {
    name: "TODO Member One",
    role: "Frontend & UX",
    Icon: Code,
    tone: "var(--accent-marigold)",
    blurb:
      "Built the Next.js client, the Mirror Test swipe interface, and the country-agnostic switcher. Cares about Amara reading her own profile in plain language.",
    initial: "1",
    links: { github: "#", linkedin: "#", email: "mailto:#" },
  },
  {
    name: "TODO Member Two",
    role: "Backend & Orchestration",
    Icon: Cpu,
    tone: "var(--accent-forest)",
    blurb:
      "Authored the FastAPI service, the agent orchestrator, the Gemini pipeline, and the offline keyword fallbacks. Believes resilience is a feature, not a polish.",
    initial: "2",
    links: { github: "#", linkedin: "#", email: "mailto:#" },
  },
  {
    name: "TODO Member Three",
    role: "Data & AI",
    Icon: Database,
    tone: "var(--accent-plum)",
    blurb:
      "Wired ESCO, ISCO-08, O*NET, Frey-Osborne, and the Wittgenstein projections. Recalibrated automation risk for LMIC infrastructure realities.",
    initial: "3",
    links: { github: "#", linkedin: "#", email: "mailto:#" },
  },
  {
    name: "TODO Member Four",
    role: "Design & HCI",
    Icon: Palette,
    tone: "var(--accent-terracotta)",
    blurb:
      "Designed the system in design.md — typography, color, Gestalt, accessibility. Argued (correctly) that warmth is more empowering than cyber sheen.",
    initial: "4",
    links: { github: "#", linkedin: "#", email: "mailto:#" },
  },
];
// ──────────────────────────────────────────────────────────────────────

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
                    <div
                      className={styles.memberAvatar}
                      style={{ background: m.tone }}
                      aria-hidden="true"
                    >
                      {m.initial}
                    </div>
                    <div className={styles.memberRoleBadge} style={{ color: m.tone }}>
                      <RoleIcon size={16} />
                      <span>{m.role}</span>
                    </div>
                  </div>

                  <h2 className={styles.memberName}>{m.name}</h2>
                  <p className={styles.memberBlurb}>{m.blurb}</p>

                  <div className={styles.memberLinks}>
                    <a
                      href={m.links.github}
                      className={styles.linkBtn}
                      aria-label={`${m.name} on GitHub`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Github size={18} />
                    </a>
                    <a
                      href={m.links.linkedin}
                      className={styles.linkBtn}
                      aria-label={`${m.name} on LinkedIn`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Linkedin size={18} />
                    </a>
                    <a
                      href={m.links.email}
                      className={styles.linkBtn}
                      aria-label={`Email ${m.name}`}
                    >
                      <Mail size={18} />
                    </a>
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
              Hundreds of millions of young people hold real, unrecognized skills. The credentialing
              systems built to map them simply don&apos;t reach them. UNMAPPED is our small bet that
              a lighter, locally-configurable infrastructure layer can — and that the right
              direction starts with treating Amara as the protagonist, not a data subject.
            </p>
            <div className={styles.lovePill}>
              <Heart size={14} />
              <span>Made with love · MIT Hack-Nation 2026</span>
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
