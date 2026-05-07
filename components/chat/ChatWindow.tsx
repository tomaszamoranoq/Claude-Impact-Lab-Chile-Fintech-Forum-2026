"use client";

import { useState } from "react";
import { getMockResponse, Message, ChatResponse, DiagnosisData } from "@/lib/mock-data";
import { AgentName } from "@/lib/schemas";
import ChatMessage from "./ChatMessage";
import { Paperclip, Send } from "lucide-react";

const CHITCHAT_PATTERNS: RegExp[] = [
  /^hola$/i, /^buenas$/i, /^gracias$/i, /^ok$/i, /^dale$/i,
  /^chao$/i, /^adiós$/i, /^adios$/i, /^qué puedes hacer$/i,
  /^que puedes hacer$/i, /^ayuda$/i, /^help$/i,
  /^hey$/i, /^buenos días$/i, /^buenas tardes$/i, /^buenas noches$/i,
  /^gracias!$/i, /^ok!$/i, /^sí$/i, /^si$/i, /^no$/i, /^nop$/i,
];

function isChitChat(input: string): boolean {
  const trimmed = input.trim().toLowerCase();
  if (trimmed.length < 20) {
    for (const pattern of CHITCHAT_PATTERNS) {
      if (pattern.test(trimmed)) return true;
    }
  }
  return false;
}

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

    // PASO 2: Chitchat Guard — evitar llamar /api/agent para saludos/inputs sin intención
    if (isChitChat(userMsg.content)) {
      const fallback = getMockResponse(userMsg.content);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: fallback.message,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setLoading(false);
      return;
    }

    // PASO 3: Llamar /api/agent con mode: "chat"
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input_text: userMsg.content,
          mode: "chat",
        }),
      });
      const json = await res.json();

      if (json.success && json.data) {
        const agentData = json.data as Record<string, unknown>;

        // LaunchAgent response: tiene diagnosis + roadmap_items
        if (agentData.diagnosis && agentData.message) {
          const diagnosisData = agentData.diagnosis as DiagnosisData;
          const assistantMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: String(agentData.message),
            diagnosis: diagnosisData,
            diagnosis_status: "saved",
            diagnosis_model_used: String(agentData.model_used || "claude"),
            agent_response: {
              agent: (agentData.agent as AgentName) || "launch",
              data: agentData,
            },
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setLoading(false);
          return;
        }

        // Launch guard o agente que devuelve solo message
        if (agentData.message) {
          const assistantMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: String(agentData.message),
            agent_response: agentData.agent
              ? { agent: agentData.agent as AgentName, data: agentData }
              : undefined,
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setLoading(false);
          return;
        }

        // Respuesta genérica con data (fallback)
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Recibí tu consulta. ¿Necesitas ayuda con algo específico?",
          agent_response: { agent: "launch", data: agentData },
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setLoading(false);
        return;
      }

      // Skeleton agent o error del router (HTTP 501, not-implemented)
      const isSkeleton = res.status === 501 || json.model_used === "not-implemented";
      const errorContent = isSkeleton
        ? json.error || "Este módulo estará disponible pronto."
        : json.error || "Lo siento, ocurrió un error. Intenta de nuevo.";

      const fallbackMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorContent,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } catch {
      const fallbackMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Lo siento, no pude conectar con el asistente. Intenta de nuevo.",
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    }

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
    <div className="flex flex-col h-full bg-chalk border border-silver-mist rounded-2xl shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-silver-mist/60 bg-vellum/60">
        <h2 className="text-base font-semibold text-graphite">Agente IA</h2>
        <p className="text-sm text-slate mt-0.5">
          Responde algunas preguntas y te orientaré sobre figura legal, obligaciones y próximos pasos.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-parchment/30">
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
          <div className="flex items-center gap-2 text-sm text-slate pl-2">
            <span className="inline-block w-2 h-2 bg-slate rounded-full animate-bounce" />
            <span className="inline-block w-2 h-2 bg-slate rounded-full animate-bounce [animation-delay:0.1s]" />
            <span className="inline-block w-2 h-2 bg-slate rounded-full animate-bounce [animation-delay:0.2s]" />
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-t border-silver-mist/60 bg-chalk">
        <div className="flex items-center gap-3 bg-vellum border border-silver-mist rounded-full px-4 py-2">
          <button className="text-ash hover:text-slate transition-colors cursor-default">
            <Paperclip size={18} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje o adjunta un documento..."
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ash focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-9 h-9 flex items-center justify-center bg-graphite text-chalk rounded-full hover:bg-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
