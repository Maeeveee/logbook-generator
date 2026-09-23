import type { Metadata } from "next";
import { Geist_Mono, Figtree } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Logbook Magang - JTI Polinema",
  description:
    "Tools pencatatan logbook kegiatan magang industri mahasiswa Jurusan Teknologi Informasi Politeknik Negeri Malang dengan ekspor PDF siap cetak.",
  keywords: [
    "logbook magang",
    "jti polinema",
    "politeknik negeri malang",
    "generator logbook",
    "magang industri",
  ],
  authors: [{ name: "rizalabrar" }],
  openGraph: {
    title: "Logbook Magang - JTI Polinema",
    description:
      "Tools pencatatan logbook kegiatan magang industri mahasiswa Jurusan Teknologi Informasi Politeknik Negeri Malang dengan ekspor PDF siap cetak.",
    type: "website",
  },
  icons: {
    icon: "/logo/logo.webp",
  },
};

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", figtree.variable)}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
