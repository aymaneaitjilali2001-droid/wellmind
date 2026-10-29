import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WellMind",
  description: "Plateforme de retours d'expérience et d'amélioration du bien-être au travail",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
