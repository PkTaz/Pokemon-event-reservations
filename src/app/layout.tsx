import type { Metadata } from "next";
import { Nunito, Rubik } from "next/font/google";
import { SiteFooter } from "@/components/layout";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Pokémon Flash Event | Tattoo Shop Booking",
  description:
    "Reserve your spot for our Pokémon-inspired flash tattoo event. Open a pack at the event — your tattoo is based on what you pull.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} ${rubik.variable} h-full`}>
      <body className="poke-bg min-h-full flex flex-col font-sans antialiased text-poke-navy">
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
