import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Superhéroes Estoicos: Aventura",
  description: "¡Descubre los secretos de los Estoicos y conviértete en un superhéroe de la mente!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased font-sans`}>
        {children}
        <Toaster richColors position="bottom-center" />
      </body>
    </html>
  );
}
