import "./globals.css";

export const metadata = {
  title: "UNMAPPED — Skills to Opportunity Infrastructure",
  description:
    "An open, localizable infrastructure layer that closes the distance between a young person's real skills and real economic opportunity. Powered by the World Bank Youth Summit × MIT Hack-Nation.",
  keywords: ["skills mapping", "youth employment", "LMIC", "automation risk", "World Bank", "ISCO-08"],
};

// Runs synchronously before hydration. Resolves theme from
// localStorage, falling back to prefers-color-scheme. Prevents
// flash-of-wrong-theme on first paint.
const themeInitScript = `
(function(){
  try {
    var saved = localStorage.getItem('unmapped-theme');
    var prefers = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = (saved === 'dark' || saved === 'light') ? saved : (prefers ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#FBF7EE" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#171313" media="(prefers-color-scheme: dark)" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
