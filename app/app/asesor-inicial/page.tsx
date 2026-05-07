"use client";

import { useEffect, useState } from "react";
import ChatWindow from "@/components/chat/ChatWindow";
import RoadmapPanel from "@/components/roadmap/RoadmapPanel";
import { CashTransaction } from "@/lib/schemas";

export default function AsesorInicialPage() {
  const [recentTransactions, setRecentTransactions] = useState<CashTransaction[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [roadmapPrompt, setRoadmapPrompt] = useState<string | undefined>();

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

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col p-5 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <ChatWindow
            onRoadmapGenerated={() => setRefreshTrigger((prev) => prev + 1)}
            roadmapPrompt={roadmapPrompt}
            onRoadmapPromptConsumed={() => setRoadmapPrompt(undefined)}
          />
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
      <RoadmapPanel
        refreshTrigger={refreshTrigger}
        onDiscussItem={(prompt) => setRoadmapPrompt(prompt)}
      />
    </div>
  );
}
