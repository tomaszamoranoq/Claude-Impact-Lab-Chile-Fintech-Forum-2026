"use client";

import { useEffect, useState } from "react";
import ChatWindow from "@/components/chat/ChatWindow";
import RoadmapPanel from "@/components/roadmap/RoadmapPanel";
import { CashTransaction } from "@/lib/schemas";
import { Sparkles, Loader2 } from "lucide-react";

export default function AsesorInicialPage() {
  const [recentTransactions, setRecentTransactions] = useState<CashTransaction[]>([]);
  const [launching, setLaunching] = useState(false);
  const [launchMessage, setLaunchMessage] = useState<string | null>(null);
  const [launchWarnings, setLaunchWarnings] = useState<string[]>([]);
  const [launchInput, setLaunchInput] = useState(
    "Quiero iniciar una panadería en Providencia con mi hermano. Necesito saber qué pasos seguir."
  );
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const res = await fetch("/api/cash-transactions");
        const json = await res.json();
        if (json.success) {
          setRecentTransactions(json.data.slice(0, 5));
        }
      } catch {
        // ignore
      }
    }
    fetchTransactions();
  }, []);

  const inputTrimmed = launchInput.trim();
  const canLaunch = inputTrimmed.length > 0 && !launching;

  async function handleLaunchAgent() {
    if (!canLaunch) return;

    setLaunching(true);
    setLaunchMessage(null);
    setLaunchWarnings([]);

    try {
      const res = await fetch("/api/launch-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_text: inputTrimmed }),
      });
      const json = await res.json();
      if (json.success) {
        setLaunchMessage("Hoja de ruta generada correctamente. Ve a Hoja de Ruta para ver los pasos.");
        setLaunchWarnings(json.warnings || []);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        setLaunchMessage(json.error || "Error al generar hoja de ruta");
        setLaunchWarnings(json.warnings || []);
      }
    } catch {
      setLaunchMessage("Error de red al generar hoja de ruta");
    } finally {
      setLaunching(false);
    }
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col p-5 overflow-hidden">
        {/* LaunchAgent CTA */}
        <div className="mb-4 bg-chalk border border-silver-mist rounded-2xl p-4 shadow-card">
          <h3 className="text-sm font-semibold text-graphite mb-1">
            Genera tu hoja de ruta personalizada
          </h3>
          <p className="text-xs text-slate mb-3">
            Describe tu negocio y el agente creará un plan paso a paso.
          </p>
          <textarea
            value={launchInput}
            onChange={(e) => {
              if (e.target.value.length <= 500) {
                setLaunchInput(e.target.value);
              }
            }}
            placeholder="Ej: Quiero abrir una panadería en Providencia con mi hermano..."
            className="w-full px-3 py-2 bg-chalk border border-silver-mist rounded-xl text-sm text-ink placeholder:text-ash focus:outline-none focus:border-graphite resize-none mb-3"
            rows={2}
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-ash">
              {inputTrimmed.length}/500 caracteres
            </span>
            <button
              onClick={handleLaunchAgent}
              disabled={!canLaunch}
              className="inline-flex items-center gap-2 px-4 py-2 bg-graphite text-chalk text-sm font-semibold rounded-full hover:bg-ink transition-colors disabled:opacity-50 shrink-0"
            >
              {launching ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              {launching ? "Generando…" : "Generar hoja de ruta"}
            </button>
          </div>
          {launchMessage && (
            <p className={`text-xs mt-2 ${launchMessage.includes("Error") ? "text-terracotta" : "text-sage"}`}>
              {launchMessage}
            </p>
          )}
          {launchWarnings.length > 0 && (
            <div className="mt-2 bg-buttercup/10 border border-ochre/20 rounded-lg px-3 py-2">
              <p className="text-[11px] text-ochre font-medium">Advertencias:</p>
              <ul className="list-disc list-inside text-[11px] text-ochre mt-0.5">
                {launchWarnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          <ChatWindow />
        </div>
        {recentTransactions.length > 0 && (
          <div className="mt-4 bg-chalk border border-silver-mist rounded-2xl p-4 shadow-card">
            <h3 className="text-sm font-semibold text-graphite mb-2">Acciones recientes</h3>
            <div className="space-y-2">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between text-sm px-3 py-2 bg-vellum rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        tx.type === "income" ? "bg-sage" : "bg-terracotta"
                      }`}
                    />
                    <span className="text-ink">{tx.description}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-ash">{tx.date}</span>
                    <span
                      className={`font-medium ${
                        tx.type === "income" ? "text-sage" : "text-terracotta"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}${tx.amount.toLocaleString("es-CL")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <RoadmapPanel refreshTrigger={refreshTrigger} />
    </div>
  );
}
