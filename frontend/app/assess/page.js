"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./assess.module.css";

const DOMAIN_ICONS = {
  technical: "🔧", digital: "💻", business: "📊",
  agricultural: "🌾", soft: "🤝", catchall: "🔮",
};

export default function AssessPage() {
  // Phase: loading → overview → mirror → micro_verify → micro_feedback → results → error
  const [phase, setPhase] = useState("loading");
  const [sessionId, setSessionId] = useState(null);
  const [skills, setSkills] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Micro-verification state
  const [microScenario, setMicroScenario] = useState(null);
  const [microAnswer, setMicroAnswer] = useState("");
  const [microFeedback, setMicroFeedback] = useState(null);
  const [microSkillIndex, setMicroSkillIndex] = useState(null);

  // Results
  const [results, setResults] = useState(null);

  // Stats
  const [swipeCount, setSwipeCount] = useState(0);

  useEffect(() => {
    const stored = sessionStorage.getItem("unmapped_profile");
    if (!stored) {
      setErrorMsg("No profile found. Please create your profile first.");
      setPhase("error");
      return;
    }
    startAssessment(JSON.parse(stored));
  }, []);

  async function startAssessment(profile) {
    try {
      setPhase("loading");
      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillsText: profile.skillsText,
          countryCode: profile.countryCode,
          education: profile.education,
          skills: profile.skills || profile.aiSkills || [],
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to start");

      setSessionId(data.sessionId);
      setSkills(data.skills || []);
      setCurrentCard(data);
      setPhase("overview");
    } catch (err) {
      setErrorMsg(err.message);
      setPhase("error");
    }
  }

  function beginMirrorTest() {
    if (currentCard?.type === "card") {
      setPhase("mirror");
    }
  }

  async function handleSwipe(response) {
    if (isSubmitting || !currentCard) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/assess/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          action: "swipe",
          skillIndex: currentCard.skillIndex,
          cardIndex: currentCard.cardIndex,
          response,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Swipe failed");

      setSwipeCount(prev => prev + 1);

      const next = data.next;
      if (next.type === "card") {
        setCurrentCard(next);
        setPhase("mirror");
      } else if (next.type === "micro_verify") {
        setCurrentCard(next);
        await loadMicroScenario(next.skillIndex);
      } else if (next.type === "complete") {
        setResults(next.results);
        sessionStorage.setItem("unmapped_assessment", JSON.stringify(next.results));
        setPhase("results");
      }
    } catch (err) {
      setErrorMsg(err.message);
      setPhase("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function loadMicroScenario(skillIndex) {
    try {
      const res = await fetch("/api/assess/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          action: "get_micro_verify",
          skillIndex,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to load scenario");

      setMicroScenario(data.scenario);
      setMicroSkillIndex(data.skillIndex);
      setMicroAnswer("");
      setMicroFeedback(null);
      setPhase("micro_verify");
    } catch (err) {
      // If micro-verify fails, skip it
      console.error("Micro-verify load failed:", err);
      await skipMicroVerify(skillIndex);
    }
  }

  async function submitMicroAnswer() {
    if (isSubmitting || !microAnswer.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/assess/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          action: "micro_verify_answer",
          skillIndex: microSkillIndex,
          scenario: microScenario?.scenario || "",
          question: microScenario?.question || "",
          answer: microAnswer,
          goodIndicators: microScenario?.good_answer_indicators || [],
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Evaluation failed");

      setMicroFeedback(data.evaluation);
      setPhase("micro_feedback");

      // After showing feedback, check what's next
      setTimeout(() => {
        const next = data.next;
        if (next?.type === "micro_verify") {
          loadMicroScenario(next.skillIndex);
        } else if (next?.type === "complete") {
          setResults(next.results);
          sessionStorage.setItem("unmapped_assessment", JSON.stringify(next.results));
          setPhase("results");
        }
      }, 3000);
    } catch (err) {
      setErrorMsg(err.message);
      setPhase("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function skipMicroVerify(skillIndex) {
    try {
      const res = await fetch("/api/assess/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          action: "micro_verify_answer",
          skillIndex: skillIndex ?? microSkillIndex,
          scenario: "",
          question: "",
          answer: "",
          goodIndicators: [],
        }),
      });
      const data = await res.json();
      if (data.next?.type === "complete") {
        setResults(data.next.results);
        sessionStorage.setItem("unmapped_assessment", JSON.stringify(data.next.results));
        setPhase("results");
      } else if (data.next?.type === "micro_verify") {
        loadMicroScenario(data.next.skillIndex);
      }
    } catch {
      // Force complete on error
      setPhase("results");
    }
  }

  // ─── RENDER: Loading ───────────────────────
  if (phase === "loading") {
    return (
      <main className={styles.main}>
        <Nav />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <h2 className={styles.loadingTitle}>Preparing Your Mirror Test</h2>
          <p className={styles.loadingSubtitle}>Matching your skills to real work activities...</p>
        </div>
      </main>
    );
  }

  // ─── RENDER: Error ─────────────────────────
  if (phase === "error") {
    return (
      <main className={styles.main}>
        <Nav />
        <div className={styles.content}>
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            <h2 className={styles.errorTitle}>Something went wrong</h2>
            <p className={styles.errorText}>{errorMsg}</p>
            <div style={{ display: "flex", gap: "var(--space-md)", justifyContent: "center" }}>
              <Link href="/profile" className="btn btn-primary">← Create Profile</Link>
              <button className="btn btn-secondary" onClick={() => window.location.reload()}>🔄 Retry</button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ─── RENDER: Overview ──────────────────────
  if (phase === "overview") {
    return (
      <main className={styles.main}>
        <Nav />
        <div className={styles.content}>
          <div className={styles.overviewHeader}>
            <h1 className={styles.overviewTitle}>🪞 The Mirror Test</h1>
            <p className={styles.overviewSubtitle}>
              We&apos;ll show you real task descriptions from your skill areas.
              Simply tell us: <strong>&quot;Yes, I do this&quot;</strong>, <strong>&quot;Sometimes&quot;</strong>, or <strong>&quot;No&quot;</strong>.
              No exams — just recognize what you actually do.
            </p>
          </div>
          <div className={styles.skillsPreview}>
            {skills.map((skill, i) => (
              <div key={i} className={styles.skillPreviewCard} style={{ animationDelay: `${i * 80}ms` }}>
                <span className={styles.skillPreviewIcon}>{DOMAIN_ICONS[skill.domain] || "🔮"}</span>
                <div className={styles.skillPreviewInfo}>
                  <div className={styles.skillPreviewName}>{skill.label}</div>
                  <div className={styles.skillPreviewMeta}>{skill.taskCount} task cards · {skill.domain} skills</div>
                </div>
              </div>
            ))}
          </div>
          <button className={styles.startButton} onClick={beginMirrorTest}>
            🪞 Start Mirror Test
          </button>
        </div>
      </main>
    );
  }

  // ─── RENDER: Mirror Test (Card Swipe) ──────
  if (phase === "mirror" && currentCard) {
    const c = currentCard.card;
    const complexClass = c.complexity === "expert" ? styles.complexityExpert
      : c.complexity === "complex" ? styles.complexityComplex
      : styles.complexityRoutine;

    return (
      <main className={styles.main}>
        <Nav meta={`${swipeCount} cards answered`} />
        <div className={styles.content}>
          <div className={styles.cardContainer} key={`${currentCard.skillIndex}_${currentCard.cardIndex}`}>
            <div className={styles.cardProgress}>
              <div className={styles.cardProgressInfo}>
                <div className={styles.cardSkillName}>
                  {DOMAIN_ICONS[currentCard.domain]} {currentCard.skillName}
                </div>
                <div className={styles.cardProgressMeta}>
                  Skill {currentCard.currentSkillNumber}/{currentCard.totalSkills} · Card {currentCard.cardIndex + 1}/{currentCard.totalCards}
                </div>
              </div>
              <div className={styles.cardProgressBar}>
                <div className={styles.cardProgressFill} style={{
                  width: `${((currentCard.cardIndex + 1) / currentCard.totalCards) * 100}%`
                }}></div>
              </div>
              <span className={`${styles.complexityBadge} ${complexClass}`}>{c.complexity}</span>
            </div>

            <div className={styles.taskCard}>
              <div className={styles.taskCardLabel}>Has this described your actual work?</div>
              <div className={styles.taskCardText}>&ldquo;{c.text}&rdquo;</div>
            </div>

            <div className={styles.swipeButtons}>
              <button className={`${styles.swipeBtn} ${styles.swipeBtnYes}`} onClick={() => handleSwipe("yes")} disabled={isSubmitting}>
                <span className={styles.swipeBtnIcon}>✅</span>
                Yes, I do this
                <span className={styles.swipeBtnLabel}>regularly</span>
              </button>
              <button className={`${styles.swipeBtn} ${styles.swipeBtnSometimes}`} onClick={() => handleSwipe("sometimes")} disabled={isSubmitting}>
                <span className={styles.swipeBtnIcon}>🔶</span>
                Sometimes
                <span className={styles.swipeBtnLabel}>occasionally</span>
              </button>
              <button className={`${styles.swipeBtn} ${styles.swipeBtnNo}`} onClick={() => handleSwipe("no")} disabled={isSubmitting}>
                <span className={styles.swipeBtnIcon}>❌</span>
                No
                <span className={styles.swipeBtnLabel}>not my work</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ─── RENDER: Micro-Verification ────────────
  if (phase === "micro_verify" && microScenario) {
    return (
      <main className={styles.main}>
        <Nav meta="Micro-Verification" />
        <div className={styles.content}>
          <div className={styles.microVerifyContainer}>
            <div className={styles.microVerifyHeader}>
              <h2 className={styles.microVerifyTitle}>🔍 Quick Verification</h2>
              <p className={styles.microVerifySubtitle}>
                You confirmed several tasks — one quick scenario to verify your experience.
              </p>
            </div>

            <div className={styles.scenarioCard}>
              <div className={styles.scenarioLabel}>📋 Scenario</div>
              <p className={styles.scenarioText}>{microScenario.scenario}</p>
              <p className={styles.scenarioQuestion}>{microScenario.question}</p>
            </div>

            <textarea
              className={styles.answerInput}
              placeholder="Describe what you would do..."
              value={microAnswer}
              onChange={(e) => setMicroAnswer(e.target.value)}
              disabled={isSubmitting}
            />

            <div className={styles.submitRow}>
              <button className={styles.skipBtn} onClick={() => skipMicroVerify()}>
                Skip verification
              </button>
              <button
                className={styles.submitBtn}
                onClick={submitMicroAnswer}
                disabled={isSubmitting || microAnswer.trim().length < 10}
              >
                {isSubmitting ? "Evaluating..." : "Submit →"}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ─── RENDER: Micro-Feedback ────────────────
  if (phase === "micro_feedback" && microFeedback) {
    return (
      <main className={styles.main}>
        <Nav />
        <div className={styles.content}>
          <div className={`${styles.microFeedback} ${microFeedback.passed ? styles.microFeedbackPassed : styles.microFeedbackFailed}`}>
            <h3 style={{ marginBottom: "var(--space-sm)" }}>
              {microFeedback.passed ? "✅ Verified!" : "🔶 Noted"}
            </h3>
            <p className={styles.microFeedbackText}>{microFeedback.feedback}</p>
            <p style={{ fontSize: "0.8rem", marginTop: "var(--space-sm)", opacity: 0.6 }}>
              {microFeedback.passed
                ? "Your skill has been upgraded to Demonstrated evidence."
                : "Your skill remains at Recognized level — still a strong profile!"}
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ─── RENDER: Results ───────────────────────
  if (phase === "results" && results) {
    return (
      <main className={styles.main}>
        <Nav />
        <div className={styles.content}>
          <div className={styles.resultsContainer}>
            <div className={styles.resultsHeader}>
              <h1 className={styles.resultsTitle}>🎉 Your Verified Skill Profile</h1>
              <p className={styles.resultsSubtitle}>
                {results.totalSkillsAssessed} skills verified across {swipeCount} task cards
              </p>
            </div>

            {/* Evidence tier legend */}
            <div className={styles.tierLegend}>
              <div className={styles.tierItem}>
                <span className={styles.tierDot} style={{ background: "#34d399" }}></span>
                <span>Demonstrated ({results.evidenceDistribution?.demonstrated || 0})</span>
              </div>
              <div className={styles.tierItem}>
                <span className={styles.tierDot} style={{ background: "#fbbf24" }}></span>
                <span>Recognized ({results.evidenceDistribution?.recognized || 0})</span>
              </div>
              <div className={styles.tierItem}>
                <span className={styles.tierDot} style={{ background: "#60a5fa" }}></span>
                <span>Self-Reported ({results.evidenceDistribution?.selfReported || 0})</span>
              </div>
            </div>

            {/* Stats */}
            <div className={styles.statsRow}>
              <div className={styles.statCircle}>
                <div className={styles.statValue}>{((results.overallConfidence || 0) * 100).toFixed(0)}%</div>
                <div className={styles.statLabel}>Overall Confidence</div>
              </div>
              <div className={styles.statCircle}>
                <div className={styles.statValue}>{results.totalSkillsAssessed}</div>
                <div className={styles.statLabel}>Skills Verified</div>
              </div>
              <div className={styles.statCircle}>
                <div className={styles.statValue}>{swipeCount}</div>
                <div className={styles.statLabel}>Tasks Reviewed</div>
              </div>
            </div>

            {/* Individual results */}
            <div className={styles.resultsList}>
              {results.skills?.map((skill, i) => {
                const tierColor = skill.evidenceTier === "DEMONSTRATED" ? "#34d399"
                  : skill.evidenceTier === "RECOGNIZED" ? "#fbbf24" : "#60a5fa";
                return (
                  <div key={i} className={styles.resultCard}>
                    <div className={styles.resultHeader}>
                      <span className={styles.resultSkillName}>
                        {DOMAIN_ICONS[skill.domain]} {skill.label}
                      </span>
                      <div className={styles.resultBadges}>
                        <span className={styles.evidenceBadge} style={{
                          background: `${tierColor}15`,
                          color: tierColor,
                          border: `1px solid ${tierColor}40`,
                        }}>
                          {skill.microVerified && "✓ "}{skill.evidenceLabel}
                        </span>
                      </div>
                    </div>
                    <div className={styles.resultMeta}>
                      <span>✅ {skill.taskCounts?.yes || 0} confirmed</span>
                      <span>🔶 {skill.taskCounts?.sometimes || 0} partial</span>
                      <span>❌ {skill.taskCounts?.no || 0} no</span>
                      <span>🎯 {((skill.confidence || 0) * 100).toFixed(0)}% confidence</span>
                    </div>
                    <div className={styles.confidenceBar}>
                      <div className={styles.confidenceFill} style={{
                        width: `${(skill.confidence || 0) * 100}%`,
                        background: tierColor,
                      }}></div>
                    </div>
                    {skill.confirmedTasks?.length > 0 && (
                      <div className={styles.confirmedTasks}>
                        {skill.confirmedTasks.slice(0, 4).map((task, j) => (
                          <div key={j} className={styles.confirmedTaskItem}>
                            <span className={styles.confirmedTaskIcon}>
                              {task.confirmed === "fully" ? "✓" : "◐"}
                            </span>
                            {task.text}
                          </div>
                        ))}
                        {skill.confirmedTasks.length > 4 && (
                          <div className={styles.confirmedTaskItem} style={{ opacity: 0.5 }}>
                            +{skill.confirmedTasks.length - 4} more confirmed tasks
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className={styles.resultActions}>
              <Link href="/skills" className="btn btn-primary btn-lg">📋 View Full Profile →</Link>
              <button className="btn btn-secondary" onClick={() => {
                const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `unmapped-profile-${Date.now()}.json`;
                a.click();
              }}>⬇ Download (JSON)</button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return null;
}

function Nav({ meta }) {
  return (
    <nav className={styles.nav}>
      <div className={styles.navInner}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>◆</span> UNMAPPED
        </Link>
        {meta && <div className={styles.navMeta}><span>{meta}</span></div>}
      </div>
    </nav>
  );
}
