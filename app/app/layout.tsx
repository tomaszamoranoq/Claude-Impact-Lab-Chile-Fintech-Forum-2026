import type { Metadata } from "next";
import Sidebar from "@/components/layout/Sidebar";
import {
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Copiloto Pyme",
  description: "MVP Fase 3D - Demo privada",
};

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-parchment text-ink">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar shell */}
        <header className="h-14 bg-vellum/80 backdrop-blur-sm border-b border-silver-mist/60 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-6">
            <Link
              href="/app/empresa"
              className="flex items-center gap-1.5 text-sm font-medium text-ink hover:text-graphite transition-colors"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
