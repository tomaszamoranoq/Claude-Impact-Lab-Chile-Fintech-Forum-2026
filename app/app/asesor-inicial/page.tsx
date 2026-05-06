"use client";

import { useEffect, useState } from "react";
import ChatWindow from "@/components/chat/ChatWindow";
import RoadmapPanel from "@/components/roadmap/RoadmapPanel";
import { CashTransaction } from "@/lib/schemas";

export default function AsesorInicialPage() {
  const [recentTransactions, setRecentTransactions] = useState<CashTransaction[]>([]);

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
    <>
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <ChatWindow />
        </div>
        {recentTransactions.length > 0 && (
          <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Acciones recientes</h3>
            <div className="space-y-2">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between text-sm px-3 py-2 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        tx.type === "income" ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <span className="text-gray-700">{tx.description}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-gray-400">{tx.date}</span>
                    <span
                      className={`font-medium ${
                        tx.type === "income" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}$
                      {tx.amount.toLocaleString("es-CL")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <RoadmapPanel />
    </>
  );
}
