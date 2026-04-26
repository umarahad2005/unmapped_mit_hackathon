import "./globals.css";

export const metadata = {
  title: "UNMAPPED — Skills to Opportunity Infrastructure",
  description: "An open, localizable infrastructure layer that closes the distance between a young person's real skills and real economic opportunity. Powered by the World Bank Youth Summit × MIT Hack-Nation.",
  keywords: ["skills mapping", "youth employment", "LMIC", "automation risk", "World Bank", "ISCO-08"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0a0e17" />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
