"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/app/asesor-inicial", label: "Asesor Inicial" },
  { href: "/app/hoja-de-ruta", label: "Hoja de Ruta" },
  { href: "/app/empresa", label: "Empresa" },
  { href: "/app/documentos", label: "Documentos" },
  { href: "/app/libro-de-caja", label: "Libro de Caja" },
  { href: "/app/acciones-ia", label: "Acciones IA" },
  { href: "/app/cumplimiento", label: "Cumplimiento" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-900">Copiloto Pyme Chile</h1>
        <p className="text-xs text-gray-500 mt-1">MVP Fase 3D</p>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                "block px-4 py-2 rounded-md text-sm font-medium transition-colors " +
                (isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900")
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200 space-y-1">
        <Link
          href="/"
          className="block px-4 py-2 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          Inicio público
        </Link>
      </div>
      <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
        <p>Panadería La Estrella SpA</p>
        <p>RUT: 76.123.456-7</p>
      </div>
    </aside>
  );
}
