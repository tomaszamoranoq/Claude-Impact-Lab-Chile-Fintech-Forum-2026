import Link from "next/link";

const features = [
  {
    title: "Diagnóstico inicial guiado",
    description:
      "Describe tu idea de negocio en lenguaje natural. El sistema extrae rubro, comuna, socios y etapa, y propone una figura legal inicial.",
  },
  {
    title: "Libro de caja conversacional",
    description:
      "Registra ingresos y egresos escribiendo como hablas. La IA propone la acción, tú confirmas, y queda auditado.",
  },
  {
    title: "Hoja de ruta de cumplimiento",
    description:
      "Visualiza obligaciones tributarias, laborales y legales ordenadas por etapa del ciclo de vida de la empresa.",
  },
  {
    title: "Auditoría de acciones IA",
    description:
      "Revisa cada acción propuesta, confirmada o rechazada por el sistema, con trazabilidad completa de modelo y confianza.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900">Copiloto Pyme Chile</span>
          </div>
          <Link
            href="/app/asesor-inicial"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Entrar a la demo
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight max-w-3xl">
          Copiloto IA para microempresas chilenas
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl leading-relaxed">
          Guía a emprendedores desde la idea inicial hasta la operación mensual,
          convirtiendo lenguaje natural en acciones estructuradas, validadas y auditables.
        </p>
        <div className="mt-8 flex items-center space-x-4">
          <Link
            href="/app/asesor-inicial"
            className="px-6 py-3 bg-blue-600 text-white text-base font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Entrar a la demo
          </Link>
          <a
            href="#como-funciona"
            className="px-6 py-3 bg-white text-gray-700 border border-gray-300 text-base font-medium rounded-md hover:bg-gray-50 transition-colors"
          >
            Ver cómo funciona
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="como-funciona" className="bg-white border-t border-gray-200 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center">¿Qué incluye?</h2>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
              >
                <h3 className="text-base font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-gray-50 border-t border-gray-200 py-10">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-sm text-gray-500 leading-relaxed">
            La plataforma entrega orientación y organización operativa.
            No reemplaza asesoría contable, tributaria o legal profesional.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-5xl mx-auto px-6 text-sm text-gray-500 text-center">
          Copiloto Pyme Chile — MVP Fase 3D
        </div>
      </footer>
    </div>
  );
}
