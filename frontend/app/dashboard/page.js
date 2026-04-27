"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getDashboard, getAvailableCountries } from "../../lib/agents/orchestrator";
import { educationProjections, returnsToEducation } from "../../lib/data/laborMarket";
import { occupations, lmicCalibration } from "../../lib/data/occupations";
import { useBackend } from "../../lib/api/useBackend";
import BackendStatus from "../../components/BackendStatus";
import ThemeToggle from "../../components/ThemeToggle";
import { Compass, BarChart3, ArrowRight } from "../../components/Icons";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const [country, setCountry] = useState("GHA");
  const [dashData, setDashData] = useState(null);
  const [backendSignals, setBackendSignals] = useState(null);
  const sectorChartRef = useRef(null);
  const wageChartRef = useRef(null);
  const projChartRef = useRef(null);
  const riskDistRef = useRef(null);
  const { backendOnline, systemStatus, retryConnection, getSignals, swapConfig } = useBackend();

  const countries = getAvailableCountries();

  useEffect(() => {
    const data = getDashboard(country);
    setDashData(data);

    // Fetch live signals from FastAPI if available
    if (backendOnline) {
      getSignals(country)
        .then(data => setBackendSignals(data))
        .catch(() => setBackendSignals(null));

      // Also trigger config swap on the backend
      const configMap = { GHA: 'ghana_urban', BGD: 'bangladesh_rural', PAK: 'pakistan_urban' };
      swapConfig(configMap[country] || 'ghana_urban').catch(() => {});
    }
  }, [country, backendOnline]);

  useEffect(() => {
    if (!dashData || typeof window === 'undefined') return;

    import('chart.js/auto').then((ChartModule) => {
      const Chart = ChartModule.default;

      // Sector employment chart
      if (sectorChartRef.current) {
        const existing = Chart.getChart(sectorChartRef.current);
        if (existing) existing.destroy();

        const sectors = dashData.sectors.sort((a, b) => b.employment_share - a.employment_share);
        new Chart(sectorChartRef.current, {
          type: 'doughnut',
          data: {
            labels: sectors.map(s => s.name),
            datasets: [{
              data: sectors.map(s => (s.employment_share * 100).toFixed(1)),
              backgroundColor: [
                'rgba(16, 185, 129, 0.7)', 'rgba(10, 132, 214, 0.7)', 'rgba(245, 158, 11, 0.7)',
                'rgba(139, 92, 246, 0.7)', 'rgba(236, 72, 153, 0.7)', 'rgba(59, 130, 246, 0.7)',
                'rgba(234, 88, 12, 0.7)', 'rgba(20, 184, 166, 0.7)', 'rgba(168, 85, 247, 0.7)',
                'rgba(244, 63, 94, 0.7)',
              ],
              borderWidth: 0,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 11 }, padding: 12 } },
            },
          },
        });
      }

      // Wage premium chart
      if (wageChartRef.current) {
        const existing = Chart.getChart(wageChartRef.current);
        if (existing) existing.destroy();

        const returns = dashData.education_returns;
        if (!returns || !returns.labels) return; // skip silently if data missing

        new Chart(wageChartRef.current, {
          type: 'bar',
          data: {
            labels: returns.labels,
            datasets: [{
              label: 'Wage Multiplier',
              data: returns.multipliers,
              backgroundColor: returns.multipliers.map(m =>
                m >= 2 ? 'rgba(16, 185, 129, 0.6)' :
                m >= 1.4 ? 'rgba(10, 132, 214, 0.6)' :
                'rgba(100, 116, 139, 0.4)'
              ),
              borderRadius: 6,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { ticks: { color: '#64748b', callback: v => v + '×' }, grid: { color: 'rgba(255,255,255,0.06)' }, beginAtZero: true },
              x: { ticks: { color: '#94a3b8', font: { size: 10 }, maxRotation: 45 }, grid: { display: false } },
            },
          },
        });
      }

      // Education projections
      if (projChartRef.current) {
        const existing = Chart.getChart(projChartRef.current);
        if (existing) existing.destroy();

        const proj = educationProjections[country]?.projections || [];
        if (proj.length > 0) {
          new Chart(projChartRef.current, {
            type: 'line',
            data: {
              labels: proj.map(p => p.year),
              datasets: [
                { label: 'No Education', data: proj.map(p => (p.no_education * 100).toFixed(1)), borderColor: '#ef4444', tension: 0.4, borderWidth: 2, pointRadius: 3 },
                { label: 'Primary', data: proj.map(p => (p.primary * 100).toFixed(1)), borderColor: '#f59e0b', tension: 0.4, borderWidth: 2, pointRadius: 3 },
                { label: 'Lower Secondary', data: proj.map(p => (p.lower_secondary * 100).toFixed(1)), borderColor: '#8b5cf6', tension: 0.4, borderWidth: 2, pointRadius: 3 },
                { label: 'Upper Secondary', data: proj.map(p => (p.upper_secondary * 100).toFixed(1)), borderColor: '#3b82f6', tension: 0.4, borderWidth: 2, pointRadius: 3 },
                { label: 'Tertiary', data: proj.map(p => (p.tertiary * 100).toFixed(1)), borderColor: '#10b981', tension: 0.4, borderWidth: 2, pointRadius: 3 },
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
      }

      // Risk distribution
      if (riskDistRef.current) {
        const existing = Chart.getChart(riskDistRef.current);
        if (existing) existing.destroy();

        const cal = lmicCalibration[country] || { factor: 0.7 };
        const buckets = { low: 0, medium: 0, high: 0 };
        occupations.forEach(occ => {
          const adjusted = occ.automation_risk * cal.factor;
          if (adjusted < 0.3) buckets.low++;
          else if (adjusted < 0.6) buckets.medium++;
          else buckets.high++;
        });

        new Chart(riskDistRef.current, {
          type: 'pie',
          data: {
            labels: ['Low Risk (<30%)', 'Medium Risk (30-60%)', 'High Risk (>60%)'],
            datasets: [{
              data: [buckets.low, buckets.medium, buckets.high],
              backgroundColor: ['rgba(16, 185, 129, 0.7)', 'rgba(245, 158, 11, 0.7)', 'rgba(239, 68, 68, 0.7)'],
              borderWidth: 0,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 }, padding: 16 } } },
          },
        });
      }
    });
  }, [dashData, country]);

  // Defensive fallback: if a future country lacks data, show a friendly
  // message instead of a blank screen. Today GHA/BGD/PAK all have data.
  if (!dashData) {
    return (
      <main className={styles.main}>
        <nav className={styles.nav}>
          <div className={styles.navInner}>
            <div className={styles.navStart}>
              <Link href="/" className={styles.logo} aria-label="UNMAPPED home">
                <span className={styles.logoIcon}><Compass size={22} /></span>
                <span className={styles.logoText}>UNMAPPED</span>
              </Link>
            </div>
            <div className={styles.navEnd}>
              <ThemeToggle />
            </div>
          </div>
        </nav>
        <div className={styles.content} style={{ paddingTop: 'calc(var(--nav-height) + var(--space-9))' }}>
          <div className="glass-card" style={{ padding: 'var(--space-7)', textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>
              No dashboard data for this country yet.
            </h1>
            <p style={{ color: 'var(--ink-medium)', marginBottom: 'var(--space-5)', lineHeight: 1.6 }}>
              We don&apos;t have an aggregate dataset wired up for <strong>{country}</strong> yet.
              Try Ghana, Bangladesh, or Pakistan from the country toggle.
            </p>
            <Link href="/" className="btn btn-primary">← Back to home</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          {/* Left: brand + section label */}
          <div className={styles.navStart}>
            <Link href="/" className={styles.logo} aria-label="UNMAPPED home">
              <span className={styles.logoIcon}><Compass size={22} /></span>
              <span className={styles.logoText}>UNMAPPED</span>
            </Link>
            <span className={styles.divider} aria-hidden="true" />
            <span className={styles.dashLabel}>
              <BarChart3 size={16} />
              <span>Policymaker Dashboard</span>
            </span>
          </div>

          {/* Right: actions */}
          <div className={styles.navEnd}>
            <Link href="/profile" className={styles.navLink}>Map Skills</Link>
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

      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h1 className={styles.headerTitle}>
              {dashData.country} — Labor Market Overview
            </h1>
            <p className={styles.headerSub}>
              Aggregate data for policymakers and program officers. Source: ILO ILOSTAT, World Bank WDI ({dashData.year})
            </p>
          </div>

          {/* Country toggle lives in the page header, not the nav — it's a
              content filter, not navigation. Clean alignment + room for 3+ countries. */}
          <div className={styles.countryToggle} role="tablist" aria-label="Country context">
            {countries.map(c => (
              <button
                key={c.code}
                role="tab"
                aria-selected={country === c.code}
                className={`${styles.countryBtn} ${country === c.code ? styles.countryBtnActive : ''}`}
                onClick={() => setCountry(c.code)}
              >
                {c.flag} <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Headline Stats */}
        <div className={styles.statsGrid}>
          {dashData.headline_stats.map((stat, i) => (
            <div key={i} className={`${styles.statCard} glass-card`}>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
              {stat.change && (
                <div className={styles.statChange} style={{ color: stat.change.startsWith('+') ? 'var(--success)' : 'var(--danger)' }}>
                  {stat.change}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className={styles.chartsRow}>
          <div className={`${styles.chartCard} glass-card`}>
            <h3>Employment by Sector</h3>
            <div className={styles.chartContainer}>
              <canvas ref={sectorChartRef}></canvas>
            </div>
          </div>
          <div className={`${styles.chartCard} glass-card`}>
            <h3>Returns to Education (Wage Premium)</h3>
            <p className={styles.chartHint}>ECONOMETRIC SIGNAL: Wage multiplier relative to no-education baseline</p>
            <div className={styles.chartContainer}>
              <canvas ref={wageChartRef}></canvas>
            </div>
          </div>
        </div>

        <div className={styles.chartsRow}>
          <div className={`${styles.chartCard} glass-card`}>
            <h3>Education Projections (2025-2035)</h3>
            <p className={styles.chartHint}>Wittgenstein Centre — Where {dashData.country} is heading</p>
            <div className={styles.chartContainer}>
              <canvas ref={projChartRef}></canvas>
            </div>
          </div>
          <div className={`${styles.chartCard} glass-card`}>
            <h3>Automation Risk Distribution</h3>
            <p className={styles.chartHint}>LMIC-adjusted (×{lmicCalibration[country]?.factor || 0.7}) — Frey-Osborne</p>
            <div className={styles.chartContainer}>
              <canvas ref={riskDistRef}></canvas>
            </div>
          </div>
        </div>

        {/* Sector Table */}
        <div className={`${styles.tableCard} glass-card`}>
          <h3>Sector Analysis</h3>
          <p className={styles.chartHint}>ECONOMETRIC SIGNAL: Sector growth, wage floors, and automation exposure</p>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Sector</th>
                  <th>Employment Share</th>
                  <th>GDP Share</th>
                  <th>Growth (YoY)</th>
                  <th>Avg Wage (USD/mo)</th>
                  <th>Automation Risk</th>
                </tr>
              </thead>
              <tbody>
                {dashData.sectors.sort((a, b) => b.growth_rate - a.growth_rate).map((sector, i) => (
                  <tr key={i}>
                    <td className={styles.cellName}>{sector.name}</td>
                    <td>{(sector.employment_share * 100).toFixed(1)}%</td>
                    <td>{(sector.gdp_share * 100).toFixed(1)}%</td>
                    <td style={{ color: sector.growth_rate > 0.08 ? 'var(--success)' : sector.growth_rate > 0.05 ? 'var(--primary-400)' : 'var(--text-secondary)' }}>
                      +{(sector.growth_rate * 100).toFixed(1)}%
                    </td>
                    <td className={styles.cellMono}>${sector.avg_monthly_wage_usd}</td>
                    <td>
                      <span className={`badge badge-${sector.automation_exposure === 'low' ? 'success' : sector.automation_exposure === 'medium' ? 'warning' : 'danger'}`}>
                        {sector.automation_exposure}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Youth Occupations */}
        <div className={`${styles.tableCard} glass-card`}>
          <h3>Top Youth Occupations (Estimated)</h3>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Occupation</th>
                  <th>ISCO Code</th>
                  <th>Est. Youth Workers</th>
                </tr>
              </thead>
              <tbody>
                {dashData.top_youth_occupations.map((occ, i) => (
                  <tr key={i}>
                    <td className={styles.cellName}>{occ.title}</td>
                    <td className={styles.cellMono}>{occ.isco}</td>
                    <td>{occ.count_est.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
