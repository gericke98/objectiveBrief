import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NAME } from "@/placeholder";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: NAME,
  description:
    "Las noticias más relevantes de España, resumidas objetivamente por inteligencia artificial.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
