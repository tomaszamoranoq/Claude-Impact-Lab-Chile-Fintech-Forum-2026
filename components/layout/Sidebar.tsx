"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  Map,
  Building2,
  FileText,
  BookOpen,
  ShieldCheck,
  Zap,
  Settings,
  HelpCircle,
  Plus,
} from "lucide-react";

const navItems = [
  { href: "/app/asesor-inicial", label: "Agente IA", icon: Sparkles },
  { href: "/app/hoja-de-ruta", label: "Hoja de Ruta", icon: Map },
  { href: "/app/empresa", label: "Empresa", icon: Building2 },
  { href: "/app/documentos", label: "Documentos", icon: FileText },
  { href: "/app/libro-de-caja", label: "Libro de Caja", icon: BookOpen },
  { href: "/app/cumplimiento", label: "Cumplimiento", icon: ShieldCheck },
  { href: "/app/acciones-ia", label: "Acciones IA", icon: Zap },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[260px] bg-vellum border-r border-silver-mist flex flex-col h-screen sticky top-0 shrink-0">
      {/* Branding */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-xl font-bold text-graphite tracking-tight leading-tight">
          Escritorio
          <br />
          Operativo
        </h1>
        <p className="text-[11px] font-semibold text-ash uppercase tracking-wider mt-1">
          Chile Emprende
        </p>
      </div>

      {/* Nueva Operación */}
      <div className="px-5 pb-4">
        <Link
          href="/app/asesor-inicial"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-graphite text-chalk text-sm font-medium rounded-full hover:bg-ink transition-colors shadow-soft"
        >
          <Plus size={16} strokeWidth={2.5} />
          Nueva Operación
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative " +
                (isActive
                  ? "bg-linen text-graphite"
                  : "text-ink hover:bg-linen/60 hover:text-graphite")
              }
            >
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-graphite rounded-r-full" />
              )}
              <Icon size={18} className={isActive ? "text-graphite" : "text-slate"} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-2 border-t border-silver-mist/60 space-y-0.5">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate hover:bg-linen/60 hover:text-graphite transition-colors"
        >
          <span className="inline-flex items-center justify-center w-[18px] h-[18px] text-[10px] font-bold border border-slate/40 rounded text-slate">
            CP
          </span>
          Inicio público
        </Link>
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate hover:bg-linen/60 hover:text-graphite transition-colors w-full text-left cursor-default">
          <Settings size={18} className="text-slate" />
          Configuración
        </button>
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate hover:bg-linen/60 hover:text-graphite transition-colors w-full text-left cursor-default">
          <HelpCircle size={18} className="text-slate" />
          Ayuda
        </button>
      </div>
    </aside>
  );
}
