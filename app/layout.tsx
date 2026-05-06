import type { Metadata } from "next";
import { Bungee, Lilita_One, Poppins } from "next/font/google";
import { SparkleBackground } from "@/components/ui/SparkleBackground";
import "./globals.css";

const bungee = Bungee({
  variable: "--font-bungee",
  subsets: ["latin"],
  weight: "400",
});

const lilita = Lilita_One({
  variable: "--font-lilita",
  subsets: ["latin"],
  weight: "400",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Você é amiga(o) de verdade da Ju? | Edição Especial Ju Faz 40",
  description:
    "Teste oficial Capricho — descubra se você é BFF nota 10 ou se ainda tem muito o que aprender sobre a Juliana.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${bungee.variable} ${lilita.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative">
        <SparkleBackground />
        <div className="relative z-10 flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}
