import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { site } from "@/content/site";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin", "latin-ext"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: { default: `${site.name} – karpių žūklė ir sektorių rezervacija`, template: `%s | ${site.shortName}` },
  description: `${site.tagline}. Sektorių užimtumas internetu, rezervacija telefonu.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="lt" className={`${manrope.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
