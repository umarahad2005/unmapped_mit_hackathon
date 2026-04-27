"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { useBackend } from "../lib/api/useBackend";
import BackendStatus from "../components/BackendStatus";
import ThemeToggle from "../components/ThemeToggle";
import {
  Compass,
  Target,
  Shield,
  Globe,
  Radio,
  Zap,
  Link2,
  BarChart3,
  ArrowRight,
  Loader,
  Check,
  Database,
  TrendingUp,
  Heart,
} from "../components/Icons";

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeCountry, setActiveCountry] = useState("GHA");
  const [swapStatus, setSwapStatus] = useState(null);
  const { backendOnline, systemStatus, swapConfig, retryConnection } = useBackend();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Handle country switch — calls FastAPI config swap if backend is online
  const handleCountrySwap = async (countryCode) => {
    setActiveCountry(countryCode);
    if (backendOnline) {
      setSwapStatus("swapping");
      try {
        const configMap = { GHA: "ghana_urban", IND: "india_rural" };
        await swapConfig(configMap[countryCode] || "ghana_urban");
        setSwapStatus("success");
        setTimeout(() => setSwapStatus(null), 2000);
      } catch (e) {
        console.warn("Config swap failed:", e.message);
        setSwapStatus("error");
        setTimeout(() => setSwapStatus(null), 3000);
      }
    }
  };

  const stats = [
    { value: "600M+", label: "Youth with unmapped skills globally" },
    { value: "88.5%", label: "Informal employment in Ghana" },
    { value: "23.2%", label: "Youth unemployment in India" },
    { value: "0", label: "Systems connecting them to opportunity" },
  ];

  const modules = [
    {
      number: "01",
      title: "Skills Signal Engine",
      description:
        "Extract, map, and standardize informal skills into portable ISCO-08 profiles. Turn invisible experience into visible credentials.",
      Icon: Target,
      tone: "var(--accent-marigold)",
    },
    {
      number: "02",
      title: "AI Readiness & Risk Lens",
      description:
        "LMIC-calibrated automation risk assessment. Show which skills are durable, which face disruption, and what adjacent skills build resilience.",
      Icon: Shield,
      tone: "var(--accent-forest)",
    },
    {
      number: "03",
      title: "Opportunity Matching",
      description:
        "Connect skills profiles to real labor market signals — wage floors, sector growth, honest pathways. Dual interface for youth and policymakers.",
      Icon: Globe,
      tone: "var(--accent-plum)",
    },
  ];

  return (
    <main className={styles.main}>
      {/* Soft ambient — single light radial wash, no orbs */}
      <div className={styles.bgOrbs} aria-hidden="true">
        <div className={styles.orb1}></div>
        <div className={styles.orb2}></div>
        <div className={styles.orb3}></div>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.logo} aria-label="UNMAPPED home">
            <span className={styles.logoIcon}><Compass size={22} /></span>
            <span className={styles.logoText}>UNMAPPED</span>
          </Link>
          <div className={styles.navLinks}>
            <Link href="/profile" className={styles.navLink}>Map Skills</Link>
            <Link href="/assess" className={styles.navLink}>Verify Skills</Link>
            <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
            <Link href="/team" className={styles.navLink}>Team</Link>
            <BackendStatus
              backendOnline={backendOnline}
              systemStatus={systemStatus}
              onRetry={retryConnection}
            />
            <ThemeToggle />
            <Link href="/profile" className={`btn btn-primary btn-sm ${styles.navCta}`}>
              Start Mapping <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`${styles.hero} ${isLoaded ? styles.heroLoaded : ""}`}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot}></span>
            World Bank × MIT Hack-Nation
          </div>
          <h1 className={styles.heroTitle}>
            From <span className={styles.heroGradient}>invisible skills</span>
            <br />to real opportunity.
          </h1>
          <p className={styles.heroSubtitle}>
            An open infrastructure layer that maps real skills of youth in low- and middle-income
            countries to real economic opportunity — powered by international standards,
            calibrated for local reality.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/profile" className="btn btn-primary btn-lg">
              <Target size={18} /> Start Mapping Skills
            </Link>
            <Link href="/dashboard" className="btn btn-secondary btn-lg">
              <BarChart3 size={18} /> Policymaker Dashboard
            </Link>
          </div>

          {/* Amara's story teaser */}
          <div className={`${styles.amaraCard} glass-card`}>
            <div className={styles.amaraAvatar}>A</div>
            <div className={styles.amaraText}>
              <p className={styles.amaraQuote}>
                &quot;I repair phones, speak three languages, and taught myself to code.
                But to the formal economy, I don&apos;t exist.&quot;
              </p>
              <p className={styles.amaraName}>— Amara, 22, Accra, Ghana</p>
            </div>
          </div>
        </div>

        {/* Floating stats grid */}
        <div className={styles.heroVisual}>
          <div className={styles.statsGrid}>
            {stats.map((stat, i) => (
              <div
                key={i}
                className={`${styles.statItem} glass-card`}
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className={styles.statValue}>{stat.value}</div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className={styles.problemSection}>
        <div className="container">
          <p className="section-label">The Problem</p>
          <h2 className="section-title">Three failures. One generation at risk.</h2>
          <div className={styles.problemGrid}>
            <div className={`${styles.problemCard} glass-card`}>
              <div className={styles.problemIcon} style={{ color: "var(--accent-marigold)" }}>
                <Radio size={28} />
              </div>
              <h3>Broken Signals</h3>
              <p>
                Education credentials don&apos;t translate into labor market signals. A secondary
                school certificate tells an employer almost nothing meaningful. Informal skills are
                invisible.
              </p>
            </div>
            <div className={`${styles.problemCard} glass-card`}>
              <div className={styles.problemIcon} style={{ color: "var(--accent-terracotta)" }}>
                <Zap size={28} />
              </div>
              <h3>AI Disruption Without Readiness</h3>
              <p>
                Automation is arriving unevenly. Jobs in routine and manual work — disproportionately
                held by young LMIC workers — face the highest disruption risk. Youth have no tools
                to navigate this.
              </p>
            </div>
            <div className={`${styles.problemCard} glass-card`}>
              <div className={styles.problemIcon} style={{ color: "var(--accent-plum)" }}>
                <Link2 size={28} />
              </div>
              <h3>No Matching Infrastructure</h3>
              <p>
                Even where skills and jobs exist in the same place, the connective tissue is absent.
                Matching happens through informal networks that systematically exclude the most
                vulnerable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section className={styles.modulesSection}>
        <div className="container">
          <p className="section-label">The Solution</p>
          <h2 className="section-title">Three modules. One infrastructure.</h2>
          <p className="section-subtitle" style={{ marginBottom: "var(--space-2xl)" }}>
            UNMAPPED is not an app — it&apos;s an infrastructure layer that any government, NGO, or
            employer can plug into and configure with local data.
          </p>
          <div className={styles.modulesGrid}>
            {modules.map((mod, i) => {
              const ModuleIcon = mod.Icon;
              return (
                <div key={i} className={`${styles.moduleCard} glass-card`}>
                  <div className={styles.moduleNumber}>{mod.number}</div>
                  <div className={styles.moduleIcon} style={{ color: mod.tone }}>
                    <ModuleIcon size={32} />
                  </div>
                  <h3 className={styles.moduleTitle}>{mod.title}</h3>
                  <p className={styles.moduleDesc}>{mod.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Country Agnostic Demo */}
      <section className={styles.configSection}>
        <div className="container">
          <p className="section-label">Country-Agnostic</p>
          <h2 className="section-title">One codebase. Any country.</h2>
          <p className="section-subtitle" style={{ marginBottom: "var(--space-2xl)" }}>
            Switch between country configurations without changing a single line of code. Labor
            market data, education taxonomy, language — all configurable.
          </p>
          <div className={styles.configDemo}>
            <div className={styles.configTabs}>
              <button
                className={`${styles.configTab} ${activeCountry === "GHA" ? styles.configTabActive : ""}`}
                onClick={() => handleCountrySwap("GHA")}
              >
                🇬🇭 Ghana
                {swapStatus === "swapping" && activeCountry === "GHA" && (
                  <Loader size={14} style={{ marginLeft: 6 }} />
                )}
              </button>
              <button
                className={`${styles.configTab} ${activeCountry === "IND" ? styles.configTabActive : ""}`}
                onClick={() => handleCountrySwap("IND")}
              >
                🇮🇳 India
                {swapStatus === "swapping" && activeCountry === "IND" && (
                  <Loader size={14} style={{ marginLeft: 6 }} />
                )}
              </button>
              {swapStatus === "success" && (
                <span
                  style={{
                    color: "var(--feedback-success)",
                    fontSize: "0.85rem",
                    padding: "6px 12px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Check size={14} /> Config swapped via FastAPI
                </span>
              )}
            </div>
            <div className={`${styles.configPanel} glass-card`}>
              {activeCountry === "GHA" ? (
                <div className={styles.configContent}>
                  <h3>🇬🇭 Ghana — Urban Informal Economy</h3>
                  <div className={styles.configGrid}>
                    <div className={styles.configItem}>
                      <span className={styles.configKey}>Region</span>
                      <span className={styles.configVal}>Sub-Saharan Africa</span>
                    </div>
                    <div className={styles.configItem}>
                      <span className={styles.configKey}>Currency</span>
                      <span className={styles.configVal}>GHS (₵)</span>
                    </div>
                    <div className={styles.configItem}>
                      <span className={styles.configKey}>Informal Employment</span>
                      <span className={styles.configVal}>88.5%</span>
                    </div>
                    <div className={styles.configItem}>
                      <span className={styles.configKey}>Youth NEET Rate</span>
                      <span className={styles.configVal}>13.1%</span>
                    </div>
                    <div className={styles.configItem}>
                      <span className={styles.configKey}>Digital Penetration</span>
                      <span className={styles.configVal}>53%</span>
                    </div>
                    <div className={styles.configItem}>
                      <span className={styles.configKey}>Automation Adj. Factor</span>
                      <span className={styles.configVal}>0.65×</span>
                    </div>
                    <div className={styles.configItem}>
                      <span className={styles.configKey}>Education Levels</span>
                      <span className={styles.configVal}>P1-P6, JHS, SHS, Tertiary</span>
                    </div>
                    <div className={styles.configItem}>
                      <span className={styles.configKey}>Key Sectors</span>
                      <span className={styles.configVal}>Agriculture, Trade, ICT</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.configContent}>
                  <h3>🇮🇳 India — Rural Agricultural Economy</h3>
                  <div className={styles.configGrid}>
                    <div className={styles.configItem}>
                      <span className={styles.configKey}>Region</span>
                      <span className={styles.configVal}>South Asia</span>
                    </div>
                    <div className={styles.configItem}>
                      <span className={styles.configKey}>Currency</span>
                      <span className={styles.configVal}>INR (₹)</span>
                    </div>
                    <div className={styles.configItem}>
                      <span className={styles.configKey}>Informal Employment</span>
                      <span className={styles.configVal}>89.1%</span>
                    </div>
                    <div className={styles.configItem}>
                      <span className={styles.configKey}>Youth NEET Rate</span>
                      <span className={styles.configVal}>28.5%</span>
                    </div>
                    <div className={styles.configItem}>
                      <span className={styles.configKey}>Digital Penetration</span>
                      <span className={styles.configVal}>47%</span>
                    </div>
                    <div className={styles.configItem}>
                      <span className={styles.configKey}>Automation Adj. Factor</span>
                      <span className={styles.configVal}>0.72×</span>
                    </div>
                    <div className={styles.configItem}>
                      <span className={styles.configKey}>Education Levels</span>
                      <span className={styles.configVal}>Class I-XII, ITI, Graduate</span>
                    </div>
                    <div className={styles.configItem}>
                      <span className={styles.configKey}>Key Sectors</span>
                      <span className={styles.configVal}>Agriculture, Construction, ICT</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Data Sources */}
      <section className={styles.dataSection}>
        <div className="container">
          <p className="section-label">Grounded in Real Data</p>
          <h2 className="section-title">Not synthetic. Not aspirational.</h2>
          <div className={styles.dataGrid}>
            {[
              { name: "ILO ILOSTAT", type: "Labor Market", desc: "Employment, wages, sector data", Icon: TrendingUp },
              { name: "World Bank WDI", type: "Development", desc: "Education, poverty, GDP indicators", Icon: BarChart3 },
              { name: "Frey & Osborne", type: "Automation", desc: "Occupation automation probability", Icon: Zap },
              { name: "ISCO-08", type: "Taxonomy", desc: "International occupation classification", Icon: Database },
              { name: "Wittgenstein Centre", type: "Projections", desc: "Education attainment forecasts", Icon: TrendingUp },
              { name: "ITU Digital", type: "Infrastructure", desc: "Internet & mobile penetration", Icon: Globe },
            ].map((source, i) => {
              const SourceIcon = source.Icon;
              return (
                <div key={i} className={`${styles.dataCard} glass-card`}>
                  <span className="badge badge-primary">{source.type}</span>
                  <div style={{ color: "var(--accent-forest)", marginTop: "var(--space-2)" }}>
                    <SourceIcon size={22} />
                  </div>
                  <h4>{source.name}</h4>
                  <p>{source.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className="container" style={{ textAlign: "center" }}>
          <h2 className="section-title">
            Start mapping real skills<br />to real opportunity.
          </h2>
          <p className="section-subtitle" style={{ margin: "0 auto var(--space-xl)" }}>
            UNMAPPED is open infrastructure. Try it now with Amara&apos;s story — or input your own.
          </p>
          <div className={styles.heroCtas} style={{ justifyContent: "center" }}>
            <Link href="/profile" className="btn btn-primary btn-lg">
              <Target size={18} /> Map Skills Now
            </Link>
            <Link href="/dashboard" className="btn btn-accent btn-lg">
              <BarChart3 size={18} /> View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerInner}>
            <div className={styles.footerLogo}>
              <span className={styles.logoIcon}><Compass size={18} /></span> UNMAPPED
            </div>
            <p className={styles.footerText}>
              Challenge 05 — World Bank Youth Summit × MIT Hack-Nation
            </p>
            <Link href="/team" className={styles.lovePill} aria-label="Meet the four people who built UNMAPPED">
              <Heart size={14} />
              <span>Made with love by 4 students</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
