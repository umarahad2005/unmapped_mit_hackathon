"use client";

/**
 * UNMAPPED — Theme Toggle
 * Two-state: light ↔ dark. Persisted in localStorage.
 *
 * Mechanics:
 *   - The `<head>` script in app/layout.js sets `data-theme` on <html> BEFORE
 *     React hydrates, to prevent flash-of-wrong-theme.
 *   - This component reads the current value, toggles it, writes localStorage,
 *     and updates the attribute. globals.css drives overrides off
 *     :root[data-theme="dark"].
 */

import { useEffect, useState } from "react";
import { Sun, Moon } from "./Icons";

const KEY = "unmapped-theme";

function readTheme() {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem(KEY, next); } catch {}
  };

  const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      onClick={toggle}
      title={label}
      aria-label={label}
      style={styles.button}
      onMouseDown={(e) => e.currentTarget.style.transform = "translateY(0)"}
    >
      <span style={{
        ...styles.iconSlot,
        transform: theme === "dark" ? "rotate(0deg)" : "rotate(0deg)",
      }}>
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </span>
    </button>
  );
}

const styles = {
  button: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: 9999,
    border: "1.5px solid var(--border-default)",
    background: "var(--surface-raised)",
    color: "var(--ink-strong)",
    cursor: "pointer",
    transition:
      "background-color 150ms cubic-bezier(0.4,0,0.2,1)," +
      "border-color 150ms cubic-bezier(0.4,0,0.2,1)," +
      "transform 150ms cubic-bezier(0.4,0,0.2,1)",
    flexShrink: 0,
  },
  iconSlot: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 250ms cubic-bezier(0.34, 1.4, 0.64, 1)",
  },
};
