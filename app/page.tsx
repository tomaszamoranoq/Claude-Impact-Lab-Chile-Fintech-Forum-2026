import Link from "next/link";
import {
  Sparkles,
  BookOpen,
  Map,
  Zap,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    title: "Diagnóstico inicial guiado",
    description:
      "Describe tu idea de negocio en lenguaje natural. El sistema extrae rubro, comuna, socios y etapa, y propone una figura legal inicial.",
    icon: Sparkles,
  },
  {
    title: "Libro de caja conversacional",
    description:
      "Registra ingresos y egresos escribiendo como hablas. La IA propone la acción, tú confirmas, y queda auditado.",
    icon: BookOpen,
  },
  {
    title: "Hoja de ruta de cumplimiento",
    description:
      "Visualiza obligaciones tributarias, laborales y legales ordenadas por etapa del ciclo de vida de la empresa.",
    icon: Map,
  },
  {
    title: "Auditoría de acciones IA",
    description:
      "Revisa cada acción propuesta, confirmada o rechazada por el sistema, con trazabilidad completa de modelo y confianza.",
    icon: Zap,
  },
];

const howItWorks = [
  {
    step: "1",
    title: "Describe tu negocio",
    description:
      "El emprendedor explica su idea, comuna, socios y situación actual en lenguaje natural.",
  },
  {
    step: "2",
    title: "La IA estructura la información",
    description:
      "El sistema propone diagnóstico, próximos pasos o acciones operativas con campos claros y trazables.",
  },
  {
    step: "3",
    title: "Tú confirmas antes de guardar",
    description:
      "Nada se registra automáticamente: cada acción pasa por revisión humana antes de llegar a la app privada.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-parchment">
      {/* Header */}
      <header className="bg-vellum/80 backdrop-blur-sm border-b border-silver-mist/40 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-lg font-bold text-graphite">Copiloto Pyme</span>
          <nav className="hidden sm:flex items-center gap-8 text-sm">
            <a href="#caracteristicas" className="text-ink font-medium border-b-2 border-graphite pb-0.5">
              Características
            </a>
            <a href="#como-funciona" className="text-slate hover:text-ink transition-colors">
              Cómo Funciona
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate cursor-default hidden sm:inline">Iniciar Sesión</span>
            <Link
              href="/app/asesor-inicial"
              className="px-4 py-2 bg-graphite text-chalk text-sm font-medium rounded-full hover:bg-ink transition-colors"
            >
              Acceder a Demo
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-graphite tracking-tight leading-[1.15]">
              Copiloto IA para
              <br />
              microempresas chilenas
            </h1>
            <p className="mt-5 text-base md:text-lg text-slate leading-relaxed max-w-lg">
              Guía a emprendedores desde la idea inicial hasta la operación mensual,
              convirtiendo lenguaje natural en acciones estructuradas, validadas y auditables.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Link
                href="/app/asesor-inicial"
                className="inline-flex items-center gap-2 px-6 py-3 bg-graphite text-chalk text-sm font-semibold rounded-full hover:bg-ink transition-colors shadow-soft"
              >
                Entrar a la demo
                <ArrowRight size={16} />
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center px-6 py-3 bg-chalk text-ink border border-silver-mist text-sm font-semibold rounded-full hover:bg-vellum transition-colors"
              >
                Ver cómo funciona
              </a>
            </div>
          </div>

          {/* Right — product preview placeholder */}
          <div className="hidden md:block">
            <div className="bg-chalk border border-silver-mist rounded-2xl shadow-card p-4 rotate-1 hover:rotate-0 transition-transform duration-500">
              <div className="bg-vellum border border-silver-mist/60 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ash uppercase tracking-wider">Documentos</span>
                  <span className="text-xs text-slate">Total: 9 documentos</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {["Legal", "Tributario", "RRHH", "Operaciones"].map((f) => (
                    <div key={f} className="bg-chalk border border-silver-mist rounded-xl p-3">
                      <div className="text-sm font-semibold text-graphite">{f}</div>
                      <div className="text-xs text-slate mt-1">3 docs</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-silver-mist/40 rounded w-3/4" />
                  <div className="h-2 bg-silver-mist/40 rounded w-1/2" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="caracteristicas" className="bg-chalk border-t border-silver-mist/40 py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-graphite text-center">Características</h2>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="bg-chalk border border-silver-mist rounded-2xl p-6 hover:shadow-card transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-vellum border border-silver-mist flex items-center justify-center">
                      <Icon size={18} className="text-graphite" />
                    </div>
                    <h3 className="text-sm font-semibold text-graphite">{f.title}</h3>
                  </div>
                  <p className="text-sm text-slate leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="bg-vellum border-t border-silver-mist/40 py-16 md:py-20 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-graphite">Cómo funciona</h2>
            <p className="mt-3 text-sm md:text-base text-slate leading-relaxed">
              Copiloto Pyme convierte conversaciones simples en información ordenada,
              pero mantiene siempre una revisión humana antes de registrar cambios.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
            {howItWorks.map((item) => (
              <div
                key={item.step}
                className="bg-chalk border border-silver-mist rounded-2xl p-6 shadow-soft"
              >
                <div className="w-9 h-9 rounded-full bg-graphite text-chalk flex items-center justify-center text-sm font-bold">
                  {item.step}
                </div>
                <h3 className="mt-5 text-base font-bold text-graphite">{item.title}</h3>
                <p className="mt-2 text-sm text-slate leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-parchment border-t border-silver-mist/30 py-10">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-xs text-ash leading-relaxed">
            La plataforma entrega orientación y organización operativa.
            No reemplaza asesoría contable, tributaria o legal profesional.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-vellum border-t border-silver-mist/40 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-bold text-graphite">Copiloto Pyme</span>
          <span className="text-xs text-ash">
            &copy; 2024 Copiloto Pyme Chile. Herramientas profesionales para el crecimiento empresarial.
          </span>
          <div className="flex items-center gap-4 text-xs text-ash">
            <span className="cursor-default hover:text-slate transition-colors">Privacidad</span>
            <span className="cursor-default hover:text-slate transition-colors">Términos de Uso</span>
            <span className="cursor-default hover:text-slate transition-colors">Contacto</span>
            <span className="cursor-default hover:text-slate transition-colors">LinkedIn</span>
          </div>
        </div>
      </footer>

      <div className="bg-chalk border-t border-silver-mist/30 py-3 text-center">
        <p className="text-xs text-ash">
          Creado en el marco del <span className="font-semibold text-slate">Claude Impact Lab</span>,
          llevado a cabo en el Chile Fintech Forum el 6 y 7 de mayo del 2026
        </p>
      </div>
    </div>
  );
}
