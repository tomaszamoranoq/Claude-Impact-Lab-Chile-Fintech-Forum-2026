import { AgentName, IntentClassification } from "./types";

interface DomainScorer {
  name: AgentName;
  keywords: Array<{ word: string; weight: number }>;
  strongSignals: string[]; // signals that win tie-breakers
  reasonTemplate: string;
}

const DOMAIN_SCORERS: DomainScorer[] = [
  {
    name: "documents",
    keywords: [
      { word: "subir", weight: 3 }, { word: "subí", weight: 3 }, { word: "subio", weight: 3 }, { word: "subió", weight: 3 },
      { word: "cargar", weight: 3 }, { word: "cargue", weight: 3 }, { word: "cargué", weight: 3 },
      { word: "adjuntar", weight: 3 }, { word: "adjunte", weight: 3 }, { word: "adjunté", weight: 3 },
      { word: "pdf", weight: 3 }, { word: "foto", weight: 3 }, { word: "fotos", weight: 3 },
      { word: "imagen", weight: 3 }, { word: "imágenes", weight: 3 }, { word: "imagenes", weight: 3 },
      { word: "escaneado", weight: 3 }, { word: "escanear", weight: 3 }, { word: "escanee", weight: 3 }, { word: "escaneé", weight: 3 },
      { word: "archivo", weight: 2 }, { word: "archivos", weight: 2 },
      { word: "documento", weight: 2 }, { word: "documentos", weight: 2 },
      { word: "revisar", weight: 1 }, { word: "analizar", weight: 1 }, { word: "clasificar", weight: 1 },
    ],
    strongSignals: ["subir", "subí", "subio", "subió", "cargar", "cargue", "cargué", "adjuntar", "adjunte", "adjunté", "pdf", "foto", "fotos", "imagen", "imágenes", "imagenes", "escaneado", "escanear", "escanee", "escaneé"],
    reasonTemplate: "Detectada acción sobre archivos/documentos",
  },
  {
    name: "operations",
    keywords: [
      { word: "pagué", weight: 3 }, { word: "pague", weight: 3 }, { word: "pagado", weight: 2 }, { word: "pagar", weight: 2 }, { word: "pago", weight: 2 },
      { word: "venta", weight: 2 }, { word: "vendí", weight: 2 }, { word: "vender", weight: 2 }, { word: "vendí", weight: 2 },
      { word: "ingreso", weight: 2 }, { word: "ingresos", weight: 2 },
      { word: "egreso", weight: 2 }, { word: "egresos", weight: 2 },
      { word: "arriendo", weight: 2 }, { word: "caja", weight: 2 },
      { word: "monto", weight: 2 }, { word: "transferencia", weight: 2 }, { word: "efectivo", weight: 2 },
      { word: "gasto", weight: 2 }, { word: "gastos", weight: 2 },
      { word: "cobro", weight: 2 }, { word: "cobrar", weight: 2 },
      { word: "transacción", weight: 2 }, { word: "transacciones", weight: 2 },
      { word: "operación", weight: 1 }, { word: "operaciones", weight: 1 },
      { word: "factura", weight: 1 }, { word: "facturas", weight: 1 }, { word: "boleta", weight: 1 }, { word: "boletas", weight: 1 },
    ],
    strongSignals: ["pagué", "pague", "pagado", "pago", "monto", "transferencia", "efectivo", "cobro", "cobrar"],
    reasonTemplate: "Detectada operación de caja/pago",
  },
  {
    name: "compliance",
    keywords: [
      { word: "vence", weight: 3 }, { word: "vencimiento", weight: 3 }, { word: "venció", weight: 3 }, { word: "vencieron", weight: 3 },
      { word: "plazo", weight: 2 }, { word: "f29", weight: 3 }, { word: "f22", weight: 3 },
      { word: "iva", weight: 2 }, { word: "impuesto", weight: 2 }, { word: "impuestos", weight: 2 },
      { word: "sii", weight: 2 },
      { word: "declaración", weight: 2 }, { word: "declarar", weight: 2 },
      { word: "patente", weight: 2 }, { word: "previred", weight: 3 },
      { word: "obligación", weight: 2 }, { word: "obligaciones", weight: 2 },
      { word: "tributario", weight: 2 }, { word: "tributaria", weight: 2 },
      { word: "cumplimiento", weight: 2 },
      { word: "calendario", weight: 2 }, { word: "mensual", weight: 1 }, { word: "anual", weight: 1 },
      { word: "renovar", weight: 2 }, { word: "renovación", weight: 2 },
    ],
    strongSignals: ["vence", "vencimiento", "venció", "vencieron", "f29", "f22", "previred", "impuesto", "impuestos", "obligación", "obligaciones", "calendario", "renovar", "renovación"],
    reasonTemplate: "Detectada obligación tributaria o vencimiento",
  },
  {
    name: "labor",
    keywords: [
      { word: "contratar", weight: 3 }, { word: "contraté", weight: 3 }, { word: "contratacion", weight: 3 }, { word: "contratación", weight: 3 },
      { word: "trabajador", weight: 2 }, { word: "trabajadores", weight: 2 },
      { word: "empleado", weight: 2 }, { word: "empleados", weight: 2 },
      { word: "sueldo", weight: 2 }, { word: "sueldos", weight: 2 },
      { word: "liquidación", weight: 2 }, { word: "liquidar", weight: 2 },
      { word: "jornada", weight: 2 }, { word: "jornadas", weight: 2 },
      { word: "imposiciones", weight: 2 }, { word: "afp", weight: 2 },
      { word: "fonasa", weight: 2 }, { word: "isapre", weight: 2 },
      { word: "cesantía", weight: 2 }, { word: "honorarios", weight: 2 },
      { word: "nómina", weight: 2 }, { word: "nomina", weight: 2 },
      { word: "finiquito", weight: 2 }, { word: "finiquitar", weight: 2 },
      { word: "contrato laboral", weight: 3 },
    ],
    strongSignals: ["contratar", "contraté", "contratacion", "contratación", "contrato laboral", "sueldo", "liquidación", "finiquito", "imposiciones", "nómina", "nomina"],
    reasonTemplate: "Detectado vocabulario laboral",
  },
  {
    name: "resolution",
    keywords: [
      { word: "cerrar", weight: 3 }, { word: "cierre", weight: 3 }, { word: "cerré", weight: 3 },
      { word: "disolver", weight: 3 }, { word: "disolución", weight: 3 },
      { word: "termino", weight: 2 }, { word: "término", weight: 2 }, { word: "giro", weight: 2 },
      { word: "deuda", weight: 2 }, { word: "deudas", weight: 2 },
      { word: "quiebra", weight: 2 }, { word: "insolvencia", weight: 2 },
      { word: "finalizar", weight: 2 }, { word: "terminar", weight: 2 },
      { word: "liquidar empresa", weight: 3 },
    ],
    strongSignals: ["cerrar", "cierre", "cerré", "disolver", "disolución", "liquidación de empresa", "liquidación empresa", "liquidación sociedad", "quiebra", "insolvencia", "termino de giro", "término de giro"],
    reasonTemplate: "Detectado vocabulario de cierre",
  },
  {
    name: "launch",
    keywords: [
      { word: "abrir", weight: 2 }, { word: "iniciar", weight: 2 }, { word: "empezar", weight: 2 }, { word: "comenzar", weight: 2 },
      { word: "constituir", weight: 3 }, { word: "crear", weight: 2 },
      { word: "empresa", weight: 1 }, { word: "negocio", weight: 1 },
      { word: "sociedad", weight: 2 }, { word: "spa", weight: 3 }, { word: "eirl", weight: 3 }, { word: "empresario individual", weight: 3 },
      { word: "socio", weight: 2 }, { word: "socios", weight: 2 },
      { word: "hermano", weight: 1 }, { word: "hermana", weight: 1 }, { word: "pareja", weight: 1 },
      { word: "amigo", weight: 1 }, { word: "amiga", weight: 1 },
      { word: "asociado", weight: 1 }, { word: "compañero", weight: 1 }, { word: "compañera", weight: 1 },
      { word: "idea", weight: 1 }, { word: "proyecto", weight: 1 },
      { word: "emprender", weight: 2 }, { word: "emprendimiento", weight: 2 },
      { word: "roadmap", weight: 2 }, { word: "plan", weight: 1 }, { word: "pasos", weight: 1 },
      { word: "fundar", weight: 2 }, { word: "establecer", weight: 2 }, { word: "montar", weight: 2 },
    ],
    strongSignals: ["constituir", "spa", "eirl", "empresario individual", "roadmap", "fundar", "establecer", "montar"],
    reasonTemplate: "Detectada intención de crear/iniciar negocio",
  },
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[áàäâ]/g, "a")
    .replace(/[éèëê]/g, "e")
    .replace(/[íìïî]/g, "i")
    .replace(/[óòöô]/g, "o")
    .replace(/[úùüû]/g, "u")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

function computeScores(tokens: string[]): Map<AgentName, number> {
  const scores = new Map<AgentName, number>();
  for (const domain of DOMAIN_SCORERS) {
    scores.set(domain.name, 0);
  }

  for (const token of tokens) {
    for (const domain of DOMAIN_SCORERS) {
      for (const kw of domain.keywords) {
        // Check exact word match
        if (token === kw.word) {
          scores.set(domain.name, (scores.get(domain.name) || 0) + kw.weight);
        }
        // Also check multi-word keywords by looking at the original text
      }
    }
  }

  return scores;
}

function checkMultiWordSignals(text: string): Map<AgentName, number> {
  const scores = new Map<AgentName, number>();
  const lower = text.toLowerCase();

  for (const domain of DOMAIN_SCORERS) {
    let extra = 0;
    for (const signal of domain.strongSignals) {
      if (lower.includes(signal.toLowerCase())) {
        extra += 2;
      }
    }
    if (extra > 0) {
      scores.set(domain.name, (scores.get(domain.name) || 0) + extra);
    }
  }

  return scores;
}

function resolveTie(
  winner: AgentName,
  runnerUp: AgentName,
  text: string
): AgentName {
  const lower = text.toLowerCase();

  // documents wins over operations when there are file signals
  if (winner === "operations" && runnerUp === "documents") {
    const docs = DOMAIN_SCORERS.find((d) => d.name === "documents")!;
    const hasFileSignal = docs.strongSignals.some((s) => lower.includes(s.toLowerCase()));
    if (hasFileSignal) return "documents";
  }
  if (winner === "documents" && runnerUp === "operations") {
    const ops = DOMAIN_SCORERS.find((d) => d.name === "operations")!;
    const hasPaymentSignal = ops.strongSignals.some((s) => lower.includes(s.toLowerCase()));
    if (!hasPaymentSignal) return "documents";
  }

  // compliance wins over launch when there are deadline/tax signals
  if (winner === "launch" && runnerUp === "compliance") {
    const comp = DOMAIN_SCORERS.find((d) => d.name === "compliance")!;
    const hasComplianceSignal = comp.strongSignals.some((s) => lower.includes(s.toLowerCase()));
    if (hasComplianceSignal) return "compliance";
  }

  // operations wins over documents when there are payment signals and NO strong file signals
  if (winner === "documents" && runnerUp === "operations") {
    const ops = DOMAIN_SCORERS.find((d) => d.name === "operations")!;
    const hasPaymentSignal = ops.strongSignals.some((s) => lower.includes(s.toLowerCase()));
    const docs = DOMAIN_SCORERS.find((d) => d.name === "documents")!;
    const hasFileSignal = docs.strongSignals.some((s) => lower.includes(s.toLowerCase()));
    if (hasPaymentSignal && !hasFileSignal) return "operations";
  }

  return winner;
}

export function classifyWithRegex(inputText: string): IntentClassification {
  const tokens = tokenize(inputText);
  const baseScores = computeScores(tokens);
  const multiWordScores = checkMultiWordSignals(inputText);

  // Merge scores
  const totalScores = new Map<AgentName, number>();
  for (const [name, score] of baseScores) {
    totalScores.set(name, score + (multiWordScores.get(name) || 0));
  }

  // Find winner
  let winner: AgentName = "launch";
  let maxScore = -1;
  let runnerUp: AgentName = "launch";
  let runnerUpScore = -1;

  for (const [name, score] of totalScores) {
    if (score > maxScore) {
      runnerUp = winner;
      runnerUpScore = maxScore;
      winner = name;
      maxScore = score;
    } else if (score > runnerUpScore) {
      runnerUp = name;
      runnerUpScore = score;
    }
  }

  // Tie-breaker
  if (runnerUpScore > 0 && maxScore > 0) {
    winner = resolveTie(winner, runnerUp, inputText);
    if (winner !== runnerUp) {
      maxScore = totalScores.get(winner) || 0;
      runnerUpScore = totalScores.get(runnerUp) || 0;
    }
  }

  // Confidence
  let confidence: number;
  if (maxScore === 0) {
    confidence = 0.55;
  } else if (runnerUpScore > 0 && maxScore / runnerUpScore < 1.5) {
    confidence = 0.7;
  } else {
    confidence = 0.85;
  }

  const domain = DOMAIN_SCORERS.find((d) => d.name === winner)!;

  // Build reason with specific signals found
  const foundSignals: string[] = [];
  for (const kw of domain.keywords) {
    if (inputText.toLowerCase().includes(kw.word.toLowerCase())) {
      foundSignals.push(kw.word);
    }
  }
  const reason = foundSignals.length > 0
    ? `${domain.reasonTemplate}: ${foundSignals.slice(0, 5).join(", ")}`
    : `${domain.reasonTemplate} (sin señales claras, default)`;

  return {
    agent_name: winner,
    confidence,
    reason,
    missing_context: [],
  };
}
