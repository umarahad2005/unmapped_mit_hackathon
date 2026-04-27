/**
 * UNMAPPED — BackendStatus Component
 * Shows a small indicator showing whether the FastAPI backend is connected.
 */

"use client";

import { useState } from 'react';

export default function BackendStatus({ backendOnline, systemStatus, onRetry }) {
  const [expanded, setExpanded] = useState(false);

  const statusColor = backendOnline === null
    ? '#B8770D'  // checking → warm amber (warning)
    : backendOnline
      ? '#0E7A5F' // online → forest green
      : '#C4451C'; // offline → terracotta

  const statusText = backendOnline === null
    ? 'Checking...'
    : backendOnline
      ? 'Backend Connected'
      : 'Backend Offline';

  const statusIcon = backendOnline === null
    ? '⏳'
    : backendOnline
      ? '⚡'
      : '⚠️';

  return (
    <div style={styles.container}>
      <button
        style={{
          ...styles.pill,
          background: `${statusColor}15`,
          borderColor: `${statusColor}40`,
          color: statusColor,
        }}
        onClick={() => setExpanded(!expanded)}
        title={statusText}
      >
        <span style={{
          ...styles.dot,
          background: statusColor,
          boxShadow: `0 0 6px ${statusColor}80`,
        }} />
        <span style={styles.label}>{statusIcon} {backendOnline ? 'FastAPI' : 'Local Mode'}</span>
      </button>

      {expanded && (
        <div style={styles.dropdown}>
          <div style={styles.dropdownHeader}>
            <span style={{ color: statusColor, fontWeight: 600 }}>{statusText}</span>
          </div>
          {systemStatus && (
            <div style={styles.dropdownBody}>
              {backendOnline ? (
                <>
                  <div style={styles.row}>
                    <span style={styles.key}>System</span>
                    <span style={styles.val}>{systemStatus.system}</span>
                  </div>
                  <div style={styles.row}>
                    <span style={styles.key}>Version</span>
                    <span style={styles.val}>{systemStatus.version}</span>
                  </div>
                  <div style={styles.row}>
                    <span style={styles.key}>Config</span>
                    <span style={styles.val}>{systemStatus.active_config}</span>
                  </div>
                  <div style={styles.row}>
                    <span style={styles.key}>Country</span>
                    <span style={styles.val}>{systemStatus.country}</span>
                  </div>
                </>
              ) : (
                <p style={styles.offlineMsg}>
                  FastAPI backend not running. Using local JS processing.
                  <br />
                  <code style={styles.code}>cd unmapped_fast_api && uvicorn api.main:app</code>
                </p>
              )}
            </div>
          )}
          {!backendOnline && onRetry && (
            <button style={styles.retryBtn} onClick={onRetry}>
              🔄 Retry Connection
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    zIndex: 100,
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    borderRadius: '999px',
    border: '1px solid',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'pulse 2s infinite',
  },
  label: {
    fontWeight: 500,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '8px',
    background: 'var(--surface-raised)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '12px',
    padding: '16px',
    minWidth: '280px',
    boxShadow: 'var(--shadow-3)',
  },
  dropdownHeader: {
    fontSize: '0.85rem',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid var(--border-subtle)',
  },
  dropdownBody: {
    fontSize: '0.8rem',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
  },
  key: {
    color: 'var(--ink-soft)',
  },
  val: {
    color: 'var(--ink-strong)',
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: '0.75rem',
    fontVariantNumeric: 'tabular-nums',
  },
  offlineMsg: {
    color: 'var(--ink-medium)',
    fontSize: '0.78rem',
    lineHeight: 1.5,
    margin: 0,
  },
  code: {
    display: 'block',
    marginTop: '8px',
    padding: '6px 10px',
    background: 'var(--surface-sunken)',
    borderRadius: '6px',
    fontSize: '0.72rem',
    color: 'var(--accent-plum)',
  },
  retryBtn: {
    marginTop: '12px',
    width: '100%',
    padding: '8px',
    background: 'var(--accent-marigold)',
    color: 'var(--ink-strong)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 600,
    fontFamily: 'inherit',
    minHeight: '36px',
  },
};
