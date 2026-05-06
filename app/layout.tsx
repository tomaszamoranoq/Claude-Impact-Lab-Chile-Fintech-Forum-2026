import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Copiloto Pyme Chile",
  description: "MVP Fase 3C - Diagnóstico Inicial Guiado con Claude",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900 flex min-h-screen">
        <Sidebar />
        <main className="flex-1 flex overflow-hidden">{children}</main>
      </body>
    </html>
  );
}
