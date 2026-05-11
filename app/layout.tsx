import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BreezeMobile Flow Intelligence",
  description: "Command center para tracking, sesiones y journey comercial de BreezeMobile",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
