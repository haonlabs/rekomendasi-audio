import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Bricolage_Grotesque } from "next/font/google";
import { SITE_URL } from "@/lib/sheet";
import "./globals.css";

// Di-host sendiri lewat next/font: hemat satu round-trip ke Google Fonts dan tanpa FOUT.
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Atkinson_Hyperlegible({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-body", display: "swap" });

const description = "Tier list audio dari Kitab Audio Fernanda Gunsan: IEM, TWS, headphone, DAC, mic, dan lainnya. Diperbarui otomatis dari Google Sheets.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Tier list Kitab Audio", template: "%s · Kitab Audio" },
  description,
  openGraph: { type: "website", locale: "id_ID", siteName: "Kitab Audio", description },
  twitter: { card: "summary_large_image", description },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
