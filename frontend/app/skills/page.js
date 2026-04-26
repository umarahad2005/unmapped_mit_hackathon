"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { processProfile } from "../../lib/agents/orchestrator";
import { useBackend } from "../../lib/api/useBackend";
import BackendStatus from "../../components/BackendStatus";
import styles from "./skills.module.css";

export default function SkillsPage() {
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState("skills");
  const [isLoading, setIsLoading] = useState(true);
  const [aiStatus, setAiStatus] = useState("idle"); // idle, loading, success, error
  const [aiSummary, setAiSummary] = useState("");
  const [pipelineSource, setPipelineSource] = useState(null); // 'fastapi' | 'local'
  const chartCanvasRef = useRef(null);
  const sectorChartRef = useRef(null);
  const eduChartRef = useRef(null);
  const { backendOnline, extractSkills: backendExtract, runPipeline, systemStatus, retryConnection } = useBackend();

  useEffect(() => {
    const defaultInput = {
      name: "Amara",
      age: "22",
      location: "Accra",
      education: "sss",
      skillsText: "I repair mobile phones and tablets. I've been doing this since I was 17 — people in my neighborhood bring me broken screens, battery issues, software problems. I speak English, Twi, and some Hausa. I taught myself Python and HTML from YouTube. I also help my aunt sell clothes at Makola Market on weekends. I can negotiate with suppliers and manage inventory.",
      countryCode: "GHA",
    };

    const stored = sessionStorage.getItem('unmapped_profile');
    const inputData = stored ? JSON.parse(stored) : defaultInput;

    // Step 1: Run local pattern matching immediately (fast, offline-first)
    const processed = processProfile(inputData);
    setResults(processed);
    setIsLoading(false);
    setPipelineSource('local');

    // Step 2: Try FastAPI backend extraction if available
    if (backendOnline) {
      setAiStatus("loading");
      backendExtract(inputData.skillsText)
        .then(data => {
          setAiStatus("success");
          setPipelineSource('fastapi');
          setAiSummary(`FastAPI pipeline: ${data.skill_count || 0} skills extracted`);
          // Merge backend-extracted skills
          if (data.candidate_skills?.skills) {
            setResults(prev => {
              const existingSubs = new Set(prev.skills.map(s => s.subcategory));
              const newSkills = data.candidate_skills.skills
                .filter(s => !existingSubs.has(s.subcategory))
                .map((s, i) => ({
                  ...s,
                  id: `fastapi_skill_${Date.now()}_${i}`,
                  ai_extracted: true,
                  source: 'fastapi_pipeline',
                }));
              return {
                ...prev,
                skills: [...prev.skills, ...newSkills],
                fastApiExtraction: data,
              };
            });
          }
        })
        .catch(() => {
          // FastAPI failed, fall through to Gemini direct
          callGeminiDirect(inputData);
        });
    } else {
      // No backend — try Gemini direct via Next.js API route
      callGeminiDirect(inputData);
    }

    function callGeminiDirect(inputData) {
      setAiStatus("loading");
      fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillsText: inputData.skillsText,
          countryCode: inputData.countryCode,
          education: inputData.education,
        }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.skills) {
            setAiStatus("success");
            setAiSummary(data.summary || "");
            setResults(prev => {
              const existingSubs = new Set(prev.skills.map(s => s.subcategory));
              const newSkills = data.skills.filter(s => !existingSubs.has(s.subcategory));
              const mergedSkills = [...prev.skills, ...newSkills];
              return {
                ...prev,
                skills: mergedSkills,
                aiSkills: data.skills,
                aiModel: data.model,
              };
            });
          } else {
            setAiStatus("error");
          }
        })
        .catch(() => {
          setAiStatus("error");
        });
    }
  }, [backendOnline]);

  useEffect(() => {
    if (!results || typeof window === 'undefined') return;

    import('chart.js/auto').then((ChartModule) => {
      const Chart = ChartModule.default;

      // Render risk gauge
      if (chartCanvasRef.current && results.riskAssessments.length > 0) {
        const existingChart = Chart.getChart(chartCanvasRef.current);
        if (existingChart) existingChart.destroy();

        const riskData = results.riskAssessments.slice(0, 6);
        new Chart(chartCanvasRef.current, {
          type: 'bar',
          data: {
            labels: riskData.map(r => r.title.length > 20 ? r.title.slice(0, 20) + '...' : r.title),
            datasets: [
              {
                label: 'Base Risk (Global)',
                data: riskData.map(r => Math.round(r.base_risk * 100)),
                backgroundColor: 'rgba(239, 68, 68, 0.3)',
                borderColor: 'rgba(239, 68, 68, 0.8)',
                borderWidth: 1,
              },
              {
                label: `Adjusted Risk (${results.config.country_name})`,
                data: riskData.map(r => Math.round(r.lmic_adjusted_risk * 100)),
                backgroundColor: 'rgba(10, 132, 214, 0.4)',
                borderColor: 'rgba(10, 132, 214, 0.8)',
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
              legend: { labels: { color: '#94a3b8', font: { size: 11 } } },
            },
            scales: {
              x: { max: 100, ticks: { color: '#64748b', callback: v => v + '%' }, grid: { color: 'rgba(255,255,255,0.06)' } },
              y: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { display: false } },
            },
          },
        });
      }

      // Sector growth chart
      if (sectorChartRef.current && results.opportunities.length > 0) {
        const existingChart = Chart.getChart(sectorChartRef.current);
        if (existingChart) existingChart.destroy();

        const sectors = results.opportunities.slice(0, 8);
        new Chart(sectorChartRef.current, {
          type: 'bar',
          data: {
            labels: sectors.map(s => s.sector),
            datasets: [{
              label: 'Growth Rate (% YoY)',
              data: sectors.map(s => (s.growth_rate * 100).toFixed(1)),
              backgroundColor: sectors.map(s => 
                s.growth_rate > 0.1 ? 'rgba(16, 185, 129, 0.5)' :
                s.growth_rate > 0.05 ? 'rgba(10, 132, 214, 0.5)' :
                'rgba(245, 158, 11, 0.5)'
              ),
              borderColor: sectors.map(s => 
                s.growth_rate > 0.1 ? 'rgba(16, 185, 129, 0.8)' :
                s.growth_rate > 0.05 ? 'rgba(10, 132, 214, 0.8)' :
                'rgba(245, 158, 11, 0.8)'
              ),
              borderWidth: 1,
              borderRadius: 4,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { ticks: { color: '#64748b', callback: v => v + '%' }, grid: { color: 'rgba(255,255,255,0.06)' } },
              x: { ticks: { color: '#94a3b8', font: { size: 10 }, maxRotation: 45 }, grid: { display: false } },
            },
          },
        });
      }

      // Education projections chart
      if (eduChartRef.current && results.educationTrends) {
        const existingChart = Chart.getChart(eduChartRef.current);
        if (existingChart) existingChart.destroy();

        const projections = results.educationTrends.projections;
        new Chart(eduChartRef.current, {
          type: 'line',
          data: {
            labels: projections.map(p => p.year),
            datasets: [
              {
                label: 'No Education',
                data: projections.map(p => (p.no_education * 100).toFixed(1)),
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: true,
                tension: 0.4,
              },
              {
                label: 'Upper Secondary',
                data: projections.map(p => (p.upper_secondary * 100).toFixed(1)),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
              },
              {
                label: 'Tertiary',
                data: projections.map(p => (p.tertiary * 100).toFixed(1)),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
            scales: {
              y: { ticks: { color: '#64748b', callback: v => v + '%' }, grid: { color: 'rgba(255,255,255,0.06)' } },
              x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.03)' } },
            },
          },
        });
      }
    });
  }, [results, activeTab]);

  if (isLoading) {
    return (
      <main className={styles.main}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <h2>Processing your skills...</h2>
          <p>Our agents are extracting, mapping, and analyzing.</p>
        </div>
      </main>
    );
  }

  if (!results) return null;

  const { skills, occupations, riskAssessments, riskSummary, opportunities, signals, config } = results;

  const categoryColors = {
    technical: { bg: 'rgba(10, 132, 214, 0.12)', color: '#38bdf8', border: 'rgba(10, 132, 214, 0.3)' },
    digital: { bg: 'rgba(139, 92, 246, 0.12)', color: '#a78bfa', border: 'rgba(139, 92, 246, 0.3)' },
    business: { bg: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: 'rgba(16, 185, 129, 0.3)' },
    agricultural: { bg: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' },
    soft: { bg: 'rgba(236, 72, 153, 0.12)', color: '#f472b6', border: 'rgba(236, 72, 153, 0.3)' },
  };

  const riskColor = (level) => {
    if (level === 'low') return 'var(--success)';
    if (level === 'medium') return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <main className={styles.main}>
      {/* Nav */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.logo}>
            <span style={{color: 'var(--primary-400)'}}>◆</span>
            <span className={styles.logoText}>UNMAPPED</span>
          </Link>
          <div className={styles.navLinks}>
            <BackendStatus
              backendOnline={backendOnline}
              systemStatus={systemStatus}
              onRetry={retryConnection}
            />
            {pipelineSource === 'fastapi' && (
              <span style={{color: '#34d399', fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(16,185,129,0.1)', borderRadius: '999px', border: '1px solid rgba(16,185,129,0.3)'}}>⚡ FastAPI Pipeline</span>
            )}
            <Link href="/profile" className={styles.navLink}>← Edit Profile</Link>
            <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
          </div>
        </div>
      </nav>

      <div className={styles.content}>
        {/* Profile Header */}
        <div className={styles.profileHeader}>
          <div className={styles.profileAvatar}>
            {results.profile.profile.name.charAt(0)}
          </div>
          <div className={styles.profileInfo}>
            <h1>{results.profile.profile.name}&apos;s Skills Map</h1>
            <p className={styles.profileMeta}>
              {config.flag_emoji} {results.profile.profile.location} · Age {results.profile.profile.age} · {config.country_name}
            </p>
            <div className={styles.profileBadges}>
              <span className="badge badge-primary">{skills.length} Skills Mapped</span>
              <span className="badge badge-success">{occupations.length} Occupations Matched</span>
              {riskSummary && (
                <span className={`badge badge-${riskSummary.overall_level === 'low' ? 'success' : riskSummary.overall_level === 'medium' ? 'warning' : 'danger'}`}>
                  Risk: {(riskSummary.overall_risk * 100).toFixed(0)}%
                </span>
              )}
              {aiStatus === "loading" && (
                <span className="badge" style={{background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)'}}>
                  ⚡ Gemini AI Extracting...
                </span>
              )}
              {aiStatus === "success" && (
                <span className="badge" style={{background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)'}}>
                  ✨ AI Enhanced ({results.aiModel})
                </span>
              )}
              {aiStatus === "error" && (
                <span className="badge" style={{background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)'}}>
                  ⚠️ AI fallback → local extraction
                </span>
              )}
            </div>
            {aiSummary && (
              <p style={{fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: 'var(--space-sm)', fontStyle: 'italic'}}>
                🤖 Gemini: &quot;{aiSummary}&quot;
              </p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {[
            { id: 'skills', label: '🎯 Skills', count: skills.length },
            { id: 'risk', label: '🛡️ AI Risk', count: riskAssessments.length },
            { id: 'opportunities', label: '🌍 Opportunities', count: opportunities.length },
            { id: 'signals', label: '📊 Econometrics', count: Object.keys(signals).length },
          ].map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              <span className={styles.tabCount}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div className={styles.tabContent}>
            <div className={styles.sectionRow}>
              <div className={styles.sectionMain}>
                <h2 className={styles.sectionTitle}>Extracted Skills</h2>
                <p className={styles.sectionDesc}>
                  Your skills have been extracted from your input and mapped to international standards (ISCO-08).
                  Each skill is categorized and rated by confidence.
                </p>
                <div className={styles.skillsList}>
                  {skills.map((skill, i) => {
                    const cat = categoryColors[skill.category] || categoryColors.soft;
                    return (
                      <div key={i} className={`${styles.skillCard} glass-card`} style={{ animationDelay: `${i * 80}ms` }}>
                        <div className={styles.skillHeader}>
                          <span
                            className={styles.skillCategory}
                            style={{ background: cat.bg, color: cat.color, borderColor: cat.border }}
                          >
                            {skill.category}
                          </span>
                          <span className={styles.skillConfidence}>
                            {(skill.confidence * 100).toFixed(0)}% confidence
                          </span>
                        </div>
                        <h3 className={styles.skillName}>{skill.name}</h3>
                        <div className={styles.skillMeta}>
                          <span>Source: {skill.source.replace(/_/g, ' ')}</span>
                          {skill.isco_codes.length > 0 && (
                            <span className={styles.skillISCO}>
                              ISCO: {skill.isco_codes.join(', ')}
                            </span>
                          )}
                        </div>
                        <div className={styles.confidenceBar}>
                          <div
                            className={styles.confidenceFill}
                            style={{ width: `${skill.confidence * 100}%`, background: cat.color }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className={styles.sectionSide}>
                <div className={`${styles.summaryCard} glass-card`}>
                  <h3>Skills Summary</h3>
                  <div className={styles.summaryGrid}>
                    {Object.entries(results.profile.skills_summary.by_category).map(([cat, count]) => (
                      count > 0 && (
                        <div key={cat} className={styles.summaryItem}>
                          <span
                            className={styles.summaryDot}
                            style={{ background: categoryColors[cat]?.color || '#94a3b8' }}
                          ></span>
                          <span className={styles.summaryLabel}>{cat}</span>
                          <span className={styles.summaryCount}>{count}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>

                <div className={`${styles.summaryCard} glass-card`}>
                  <h3>Matched Occupations</h3>
                  <div className={styles.occupationList}>
                    {occupations.slice(0, 5).map((occ, i) => (
                      <div key={i} className={styles.occupationItem}>
                        <span className={styles.occupationCode}>{occ.isco_code}</span>
                        <span className={styles.occupationTitle}>{occ.title}</span>
                        <span className={styles.occupationMatch}>
                          {(occ.match_confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`${styles.portableCard} glass-card`}>
                  <h3>📋 Portable Profile</h3>
                  <p>Your skills profile is standardized using ISCO-08 international codes — portable across borders and sectors.</p>
                  <button className="btn btn-secondary btn-sm" onClick={() => {
                    const blob = new Blob([JSON.stringify(results.profile, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `unmapped-profile-${results.profile.profile.name}.json`;
                    a.click();
                  }}>
                    ⬇ Download Profile (JSON)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Risk Tab */}
        {activeTab === 'risk' && (
          <div className={styles.tabContent}>
            {riskSummary && (
              <div className={styles.riskOverview}>
                <div className={`${styles.riskGaugeCard} glass-card`}>
                  <h3>Overall Automation Risk</h3>
                  <div className={styles.riskGauge}>
                    <div className={styles.riskGaugeValue} style={{ color: riskColor(riskSummary.overall_level) }}>
                      {(riskSummary.overall_risk * 100).toFixed(0)}%
                    </div>
                    <div className={styles.riskGaugeLabel}>
                      LMIC-adjusted ({config.country_name})
                    </div>
                    <div className={styles.riskGaugeBar}>
                      <div className={styles.riskGaugeFill} style={{
                        width: `${riskSummary.overall_risk * 100}%`,
                        background: riskSummary.overall_level === 'low' ? 'var(--gradient-risk-low)' :
                          riskSummary.overall_level === 'medium' ? 'var(--gradient-risk-med)' :
                          'var(--gradient-risk-high)'
                      }}></div>
                    </div>
                    <p className={styles.riskCalibration}>
                      ⚙️ Calibration: {config.automation_calibration.adjustment_factor}× (accounts for {config.country_name}&apos;s infrastructure level and labor cost)
                    </p>
                  </div>
                </div>

                <div className={`${styles.riskColumns} glass-card`}>
                  <div className={styles.riskColumn}>
                    <h4 style={{color: 'var(--success)'}}>✅ Durable Skills</h4>
                    <ul>
                      {riskSummary.durable_skills.map((skill, i) => (
                        <li key={i}>{skill}</li>
                      ))}
                    </ul>
                  </div>
                  <div className={styles.riskDivider}></div>
                  <div className={styles.riskColumn}>
                    <h4 style={{color: 'var(--danger)'}}>⚠️ At-Risk Tasks</h4>
                    <ul>
                      {riskSummary.at_risk_tasks.map((task, i) => (
                        <li key={i}>{task}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className={`${styles.chartCard} glass-card`}>
              <h3>Automation Risk by Occupation</h3>
              <p className={styles.chartDesc}>Global risk (Frey-Osborne) vs LMIC-adjusted risk for your matched occupations</p>
              <div className={styles.chartContainer}>
                <canvas ref={chartCanvasRef}></canvas>
              </div>
            </div>

            <div className={`${styles.chartCard} glass-card`}>
              <h3>Education Projections — {config.country_name} (2025-2035)</h3>
              <p className={styles.chartDesc}>Wittgenstein Centre education attainment projections showing how the landscape is shifting</p>
              <div className={styles.chartContainer}>
                <canvas ref={eduChartRef}></canvas>
              </div>
            </div>

            {/* Upskilling recommendations */}
            {riskSummary && riskSummary.recommended_upskilling.length > 0 && (
              <div className={`${styles.upskillingCard} glass-card`}>
                <h3>🚀 Recommended Upskilling Paths</h3>
                <p className={styles.chartDesc}>Adjacent skills that increase your resilience against automation</p>
                <div className={styles.upskillingGrid}>
                  {riskSummary.recommended_upskilling.map((skill, i) => (
                    <div key={i} className={styles.upskillingItem}>
                      <div className={styles.upskillingHeader}>
                        <h4>{skill.skill}</h4>
                        <span className="badge badge-success">{skill.demand_growth} demand</span>
                      </div>
                      <div className={styles.upskillingMeta}>
                        <span>📚 {skill.path}</span>
                        <span>⏱ {skill.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Opportunities Tab */}
        {activeTab === 'opportunities' && (
          <div className={styles.tabContent}>
            <h2 className={styles.sectionTitle}>Matched Opportunities</h2>
            <p className={styles.sectionDesc}>
              Real labor market signals for {config.country_name}. These are honest, grounded matches based on your skills profile.
            </p>

            <div className={styles.opportunityList}>
              {opportunities.map((opp, i) => (
                <div key={i} className={`${styles.opportunityCard} glass-card`} style={{ animationDelay: `${i * 100}ms` }}>
                  <div className={styles.oppHeader}>
                    <div>
                      <h3>{opp.sector}</h3>
                      <div className={styles.oppBadges}>
                        <span className={`badge ${opp.automation_exposure === 'low' ? 'badge-success' : opp.automation_exposure === 'medium' ? 'badge-warning' : 'badge-danger'}`}>
                          {opp.automation_exposure} automation risk
                        </span>
                      </div>
                    </div>
                    <div className={styles.oppScore}>
                      <span className={styles.oppScoreValue}>{(opp.match_score * 100).toFixed(0)}%</span>
                      <span className={styles.oppScoreLabel}>match</span>
                    </div>
                  </div>

                  <div className={styles.oppSignals}>
                    <div className={styles.oppSignal}>
                      <span className={styles.oppSignalLabel}>Wage Floor</span>
                      <span className={styles.oppSignalValue}>${opp.wage_floor_usd}/mo</span>
                    </div>
                    <div className={styles.oppSignal}>
                      <span className={styles.oppSignalLabel}>Growth Rate</span>
                      <span className={styles.oppSignalValue} style={{ color: opp.growth_rate > 0.05 ? 'var(--success)' : 'var(--text-secondary)' }}>
                        {opp.growth_label}
                      </span>
                    </div>
                    <div className={styles.oppSignal}>
                      <span className={styles.oppSignalLabel}>Employment Share</span>
                      <span className={styles.oppSignalValue}>{(opp.employment_share * 100).toFixed(1)}%</span>
                    </div>
                    <div className={styles.oppSignal}>
                      <span className={styles.oppSignalLabel}>GDP Share</span>
                      <span className={styles.oppSignalValue}>{(opp.gdp_share * 100).toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className={styles.oppPathway}>
                    <span className={styles.oppPathwayIcon}>🛤️</span>
                    <span>{opp.pathway}</span>
                  </div>

                  <div className={styles.oppTypes}>
                    {opp.opportunity_types.map((type, j) => (
                      <span key={j} className={styles.oppType}>
                        {type.type}
                        <span className={styles.oppTypeFeas}>{type.feasibility}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className={`${styles.chartCard} glass-card`}>
              <h3>Sector Employment Growth</h3>
              <p className={styles.chartDesc}>Year-over-year growth rate across matched sectors — a key econometric signal</p>
              <div className={styles.chartContainer}>
                <canvas ref={sectorChartRef}></canvas>
              </div>
            </div>
          </div>
        )}

        {/* Econometrics Tab */}
        {activeTab === 'signals' && (
          <div className={styles.tabContent}>
            <h2 className={styles.sectionTitle}>Econometric Signals — {config.country_name}</h2>
            <p className={styles.sectionDesc}>
              Real economic data surfaced from ILO ILOSTAT, World Bank WDI, and Wittgenstein Centre.
              These signals are not buried in the algorithm — they are shown transparently.
            </p>

            <div className={styles.signalGrid}>
              {Object.values(signals).map((signal, i) => (
                <div key={i} className={`${styles.signalCard} glass-card`}>
                  <span className="badge badge-primary">{signal.type.replace(/_/g, ' ')}</span>
                  <h3>{signal.label}</h3>
                  <p>{signal.description}</p>

                  {signal.type === 'wage_premium' && signal.data && (
                    <div className={styles.wageTable}>
                      <table>
                        <thead>
                          <tr>
                            <th>Education Level</th>
                            <th>Wage Multiplier</th>
                            <th>Avg Monthly (USD)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {signal.data.labels.map((label, j) => (
                            <tr key={j}>
                              <td>{label}</td>
                              <td style={{ fontWeight: 700, color: signal.data.multipliers[j] > 1.5 ? 'var(--success)' : 'var(--text-primary)' }}>
                                {signal.data.multipliers[j]}×
                              </td>
                              <td>${signal.data.avg_monthly_usd[j]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {signal.type === 'youth_indicators' && (
                    <div className={styles.indicatorGrid}>
                      <div className={styles.indicator}>
                        <span className={styles.indicatorValue}>{(signal.neet_rate * 100).toFixed(1)}%</span>
                        <span className={styles.indicatorLabel}>Youth NEET Rate</span>
                      </div>
                      <div className={styles.indicator}>
                        <span className={styles.indicatorValue}>{(signal.unemployment_rate * 100).toFixed(1)}%</span>
                        <span className={styles.indicatorLabel}>Youth Unemployment</span>
                      </div>
                      <div className={styles.indicator}>
                        <span className={styles.indicatorValue}>{(signal.informal_share * 100).toFixed(1)}%</span>
                        <span className={styles.indicatorLabel}>Informal Employment</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className={`${styles.dataDisclosure} glass-card`}>
              <h3>📋 Data Sources & Transparency</h3>
              <p>All econometric signals shown are derived from publicly available, internationally recognized datasets:</p>
              <ul>
                <li><strong>ILO ILOSTAT</strong> — Employment, wages, sector data by country</li>
                <li><strong>World Bank WDI</strong> — Development indicators (education, GDP, poverty)</li>
                <li><strong>Frey & Osborne (2017)</strong> — Automation probability scores by occupation</li>
                <li><strong>Wittgenstein Centre</strong> — Education attainment projections to 2035</li>
                <li><strong>ISCO-08</strong> — International Standard Classification of Occupations</li>
                <li><strong>ITU Digital Development</strong> — Internet and mobile penetration data</li>
              </ul>
              <p className={styles.honesty}>
                <strong>Honest disclosure:</strong> This is a prototype using pre-processed snapshots of these datasets. 
                Production deployment would integrate live APIs from ILO and World Bank for real-time data.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
