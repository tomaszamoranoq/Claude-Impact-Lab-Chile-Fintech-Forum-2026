"use client";

import { useState } from "react";
import { getMockResponse, Message, ChatResponse, DiagnosisData } from "@/lib/mock-data";
import ChatMessage from "./ChatMessage";

const MOCK_COMPANY_ID = "mock-company-1";
const MOCK_USER_ID = "mock-user-1";

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "¡Hola! Soy tu Asesor Inicial. Cuéntame sobre tu negocio: ¿qué rubro, en qué comuna, cuántos socios, y qué etapa crees que estás?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // PASO 1: Intentar interpretar como acción operativa
    let actionResponse: ChatResponse | null = null;
    let actionModelUsed = "mock-regex";

    try {
      const res = await fetch("/api/interpret-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_text: userMsg.content }),
      });
      const json = await res.json();
      if (json.success && json.data?.proposed_action) {
        actionResponse = json.data;
        actionModelUsed = json.model_used || "mock-regex";
      }
    } catch {
      // Silenciosamente falla, continuamos con diagnosis
    }

    // Si es una acción operativa, flujo existente
    if (actionResponse?.proposed_action) {
      let backendActionId: string | undefined;

      try {
        const res = await fetch("/api/agent-actions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company_id: MOCK_COMPANY_ID,
            user_id: MOCK_USER_ID,
            intent: actionResponse.proposed_action.intent,
            input_text: userMsg.content,
            proposed_payload: actionResponse.proposed_action.payload,
            confidence: actionResponse.proposed_action.confidence,
            missing_fields: actionResponse.proposed_action.missing_fields,
            model_used: actionModelUsed,
            sources_used: [],
          }),
        });
        const json = await res.json();
        if (json.success) {
          backendActionId = json.data.id;
        }
      } catch {
        // Backend creation failed
      }

      const hasProposedAction = backendActionId !== undefined;

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: hasProposedAction
          ? actionResponse.message
          : "No se pudo registrar la acción propuesta en backend. Intenta de nuevo.",
        response: hasProposedAction ? actionResponse : undefined,
        action_status: hasProposedAction ? "proposed" : undefined,
        backend_action_id: backendActionId,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setLoading(false);
      return;
    }

    // PASO 2: Intentar interpretar como diagnóstico de negocio
    let diagnosisData: DiagnosisData | undefined;
    let diagnosisModelUsed = "mock-regex";
    let diagnosisMessage = "";

    try {
      const res = await fetch("/api/interpret-business-diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_text: userMsg.content }),
      });
      const json = await res.json();
      if (json.success) {
        diagnosisModelUsed = json.model_used || "mock-regex";
        if (json.is_business_diagnosis && json.data) {
          diagnosisData = json.data;
          diagnosisMessage = json.message;
        } else {
          diagnosisMessage = json.message;
        }
      }
    } catch {
      // Fallback: usar regex mock para mensaje conversacional
      const fallback = getMockResponse(userMsg.content);
      diagnosisMessage = fallback.message;
    }

    // Si no hay diagnóstico estructurado, mostrar mensaje conversacional
    if (!diagnosisData) {
      const fallback = getMockResponse(userMsg.content);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: diagnosisMessage || fallback.message,
        response: fallback.proposed_action ? undefined : fallback,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setLoading(false);
      return;
    }

    // Mostrar tarjeta de diagnóstico propuesto
    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: diagnosisMessage || "He analizado tu situación. Revisa el diagnóstico propuesto:",
      diagnosis: diagnosisData,
      diagnosis_status: "proposed",
      diagnosis_model_used: diagnosisModelUsed,
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  const handleConfirm = async (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg?.backend_action_id) return;

    try {
      const res = await fetch(`/api/agent-actions/${msg.backend_action_id}/confirm`, {
        method: "POST",
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error);
      }

      const action = json.data.action;
      const isExecuted = action.status === "executed";

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, action_status: "confirmed" as const } : m
        )
      );

      const confirmationText = isExecuted
        ? "✅ Acción confirmada y ejecutada. Se registró en el Libro de Caja."
        : "✅ Acción confirmada. Se preparará la hoja de ruta de constitución.";

      const systemMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: confirmationText,
      };
      setMessages((prev) => [...prev, systemMsg]);
    } catch {
      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: "❌ No se pudo confirmar la acción. Intenta de nuevo.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const handleReject = async (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg?.backend_action_id) return;

    try {
      const res = await fetch(`/api/agent-actions/${msg.backend_action_id}/reject`, {
        method: "POST",
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error);
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, action_status: "rejected" as const } : m
        )
      );

      const systemMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: "❌ Acción rechazada. No se registró ningún cambio.",
      };
      setMessages((prev) => [...prev, systemMsg]);
    } catch {
      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: "❌ No se pudo rechazar la acción. Intenta de nuevo.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const handleSaveDiagnosis = async (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg?.diagnosis) return;

    try {
      const res = await fetch("/api/business-diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input_text: msg.diagnosis.input_text,
          business_profile: msg.diagnosis.business_profile,
          recommended_legal_type: msg.diagnosis.recommended_legal_type,
          lifecycle_stage: msg.diagnosis.lifecycle_stage,
          assumptions: msg.diagnosis.assumptions,
          unknowns: msg.diagnosis.unknowns,
          next_steps: msg.diagnosis.next_steps,
          confidence: msg.diagnosis.confidence,
          model_used: msg.diagnosis_model_used || "unknown",
        }),
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error);
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, diagnosis_status: "saved" as const } : m
        )
      );
    } catch {
      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: "❌ No se pudo guardar el diagnóstico. Intenta de nuevo.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const handleDiscardDiagnosis = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, diagnosis_status: "discarded" as const } : m
      )
    );
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-base font-semibold text-gray-900">Asesor Inicial</h2>
        <p className="text-sm text-gray-500">
          Responde algunas preguntas y te orientaré sobre figura legal, obligaciones y próximos pasos.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            onConfirm={msg.action_status === "proposed" ? handleConfirm : undefined}
            onReject={msg.action_status === "proposed" ? handleReject : undefined}
            onSaveDiagnosis={msg.diagnosis_status === "proposed" ? handleSaveDiagnosis : undefined}
            onDiscardDiagnosis={msg.diagnosis_status === "proposed" ? handleDiscardDiagnosis : undefined}
          />
        ))}
        {loading && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
            <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
            <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
