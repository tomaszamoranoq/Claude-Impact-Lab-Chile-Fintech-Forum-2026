import { AgentName } from "@/lib/schemas";

export interface Company {
  id: string;
  legal_name: string;
  rut: string;
  legal_type: string;
  tax_regime: string;
  lifecycle_stage: string;
  representative_name: string;
  representative_rut: string;
  industry: string;
  municipality: string;
}

export interface RoadmapItem {
  id: string;
  stage: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "blocked";
  due_date?: string;
  source_name: string;
  source_url: string;
}

export interface ActionPayloadFinancial {
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface ActionPayloadConstitution {
  legal_type: string;
  description: string;
  date: string;
}

export type ActionPayload = ActionPayloadFinancial | ActionPayloadConstitution;

export function isFinancialPayload(payload: ActionPayload): payload is ActionPayloadFinancial {
  return "amount" in payload;
}

export function isConstitutionPayload(payload: ActionPayload): payload is ActionPayloadConstitution {
  return "legal_type" in payload;
}

export interface ProposedAction {
  intent: string;
  confidence: number;
  payload: ActionPayload;
  missing_fields: string[];
}

export interface ChatResponse {
  message: string;
  assumptions?: string[];
  recommendation?: {
    title: string;
    description: string;
    options: string[];
  };
  next_steps?: string[];
  proposed_action?: ProposedAction;
}

export interface DiagnosisData {
  input_text: string;
  business_profile: {
    business_activity_category: string;
    business_description: string;
    municipality?: string;
    has_partners: boolean | "unknown";
    partners_count?: number;
    plans_to_hire: boolean | "unknown";
    operates_from_home: boolean | "unknown";
    expected_revenue_range?: string;
    notes?: string;
  };
  recommended_legal_type: string;
  lifecycle_stage: string;
  assumptions: string[];
  unknowns: string[];
  next_steps: string[];
  confidence: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: ChatResponse;
  action_status?: "proposed" | "confirmed" | "rejected";
  backend_action_id?: string;
  diagnosis?: DiagnosisData;
  diagnosis_status?: "proposed" | "saved" | "discarded";
  diagnosis_model_used?: string;
  agent_response?: {
    agent: AgentName;
    data: unknown;
  };
}

export interface ComplianceObligation {
  id: string;
  title: string;
  form_code: string;
  period: string;
  due_date: string;
  status: "pending" | "prepared" | "fulfilled" | "not_applicable";
  explanation: string;
  depends_on_hiring: boolean;
}

export interface CashTransaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string;
  description: string;
  status: "confirmed" | "pending" | "inferred";
  document_reference?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  uploaded_at: string;
  status: "uploaded" | "reviewed" | "extracted";
}

export interface DocumentFolder {
  id: string;
  name: string;
  documents: DocumentItem[];
}

export const mockCompany: Company = {
  id: "1",
  legal_name: "Empresa sin configurar",
  rut: "Pendiente",
  legal_type: "Pendiente",
  tax_regime: "Pendiente",
  lifecycle_stage: "exploration",
  representative_name: "Pendiente",
  representative_rut: "Pendiente",
  industry: "Pendiente",
  municipality: "Pendiente",
};

export const mockRoadmap: RoadmapItem[] = [];

export const sampleRoadmap: RoadmapItem[] = [
  {
    id: "r1",
    stage: "exploration",
    title: "Diagnóstico inicial del negocio",
    description: "Evaluar idea, rubro y necesidades básicas.",
    status: "completed",
    source_name: "SERCOTEC",
    source_url: "https://www.sercotec.cl",
  },
  {
    id: "r2",
    stage: "exploration",
    title: "Análisis de mercado local",
    description: "Conocer competencia y demanda en la comuna.",
    status: "completed",
    source_name: "SERCOTEC",
    source_url: "https://www.sercotec.cl",
  },
  {
    id: "r3",
    stage: "constitution",
    title: "Elegir figura legal",
    description: "Comparar Empresario Individual, EIRL y SpA según socios y riesgo.",
    status: "completed",
    source_name: "Registro de Empresas y Sociedades",
    source_url: "https://www.registrodeempresasysociedades.cl",
  },
  {
    id: "r4",
    stage: "constitution",
    title: "Inscribir empresa en Registro Comercial",
    description: "Constituir la SpA a través de Empresa en un Día.",
    status: "completed",
    source_name: "Registro de Empresas y Sociedades",
    source_url: "https://www.registrodeempresasysociedades.cl",
  },
  {
    id: "r5",
    stage: "constitution",
    title: "Obtener patente municipal",
    description: "Solicitar patente comercial en la Municipalidad de Providencia.",
    status: "completed",
    source_name: "Municipalidad de Providencia",
    source_url: "https://www.providencia.cl",
  },
  {
    id: "r6",
    stage: "tax_start",
    title: "Obtener RUT de la empresa",
    description: "Inscripción en el SII para obtener RUT tributario.",
    status: "completed",
    source_name: "SII",
    source_url: "https://www.sii.cl",
  },
  {
    id: "r7",
    stage: "tax_start",
    title: "Iniciar actividades en el SII",
    description: "Declarar inicio de actividades y giro tributario.",
    status: "in_progress",
    source_name: "SII",
    source_url: "https://www.sii.cl",
  },
  {
    id: "r8",
    stage: "tax_start",
    title: "Solicitar timbraje de boletas y facturas",
    description: "Habilitar folios electrónicos en el SII.",
    status: "pending",
    source_name: "SII",
    source_url: "https://www.sii.cl",
  },
  {
    id: "r9",
    stage: "operation",
    title: "Configurar libro de caja",
    description: "Definir categorías de ingresos y egresos.",
    status: "pending",
    source_name: "SII",
    source_url: "https://www.sii.cl",
  },
  {
    id: "r10",
    stage: "operation",
    title: "Registrar primera venta",
    description: "Ingresar la primera transacción de venta en el sistema.",
    status: "pending",
    source_name: "SII",
    source_url: "https://www.sii.cl",
  },
  {
    id: "r11",
    stage: "operation",
    title: "Declarar IVA mensual (F29)",
    description: "Preparar y presentar la declaración de IVA.",
    status: "pending",
    source_name: "SII",
    source_url: "https://www.sii.cl",
  },
  {
    id: "r12",
    stage: "operation",
    title: "Declaración anual de renta (F22)",
    description: "Presentar declaración de renta anual.",
    status: "pending",
    source_name: "SII",
    source_url: "https://www.sii.cl",
  },
  {
    id: "r13",
    stage: "operation",
    title: "Mantener cumplimiento mensual",
    description: "Boletas, facturas, retenciones y registros contables.",
    status: "pending",
    source_name: "SII",
    source_url: "https://www.sii.cl",
  },
  {
    id: "r14",
    stage: "hiring",
    title: "Afiliar trabajador a AFP y salud",
    description: "Inscribir al trabajador en sistema previsional.",
    status: "blocked",
    source_name: "Previred",
    source_url: "https://www.previred.com",
  },
  {
    id: "r15",
    stage: "hiring",
    title: "Confeccionar contrato de trabajo",
    description: "Redactar contrato según Código del Trabajo.",
    status: "blocked",
    source_name: "Dirección del Trabajo",
    source_url: "https://www.dt.gob.cl",
  },
  {
    id: "r16",
    stage: "regularization",
    title: "Rectificar declaración tributaria",
    description: "Corregir errores en declaraciones previas si aplica.",
    status: "blocked",
    source_name: "SII",
    source_url: "https://www.sii.cl",
  },
  {
    id: "r17",
    stage: "closing",
    title: "Disolver y liquidar la sociedad",
    description: "Trámite de disolución en Registro Comercial y SII.",
    status: "blocked",
    source_name: "Registro de Empresas y Sociedades",
    source_url: "https://www.registrodeempresasysociedades.cl",
  },
];

export const mockCompliance: ComplianceObligation[] = [];

export const sampleCompliance: ComplianceObligation[] = [
  {
    id: "c1",
    title: "Declaración de IVA",
    form_code: "F29",
    period: "Mayo 2026",
    due_date: "2026-06-12",
    status: "pending",
    explanation:
      "Declaración mensual del Impuesto al Valor Agregado. Debe presentarse dentro de los 12 días hábiles del mes siguiente.",
    depends_on_hiring: false,
  },
  {
    id: "c2",
    title: "Declaración anual de renta",
    form_code: "F22",
    period: "Año 2026",
    due_date: "2027-04-30",
    status: "pending",
    explanation:
      "Declaración anual de impuesto a la renta para empresas del régimen PROPYME.",
    depends_on_hiring: false,
  },
  {
    id: "c3",
    title: "Pago de cotizaciones previsionales",
    form_code: "Previred",
    period: "Mayo 2026",
    due_date: "2026-06-10",
    status: "not_applicable",
    explanation:
      "Pago mensual de AFP, salud y seguro de cesantía por trabajadores dependientes.",
    depends_on_hiring: true,
  },
  {
    id: "c4",
    title: "Declaración de remuneraciones",
    form_code: "DT",
    period: "Mayo 2026",
    due_date: "2026-06-10",
    status: "not_applicable",
    explanation:
      "Declaración mensual de remuneraciones y cargas sociales ante la Dirección del Trabajo.",
    depends_on_hiring: true,
  },
  {
    id: "c5",
    title: "Timbraje de boletas electrónicas",
    form_code: "SII",
    period: "Único",
    due_date: "2026-05-20",
    status: "prepared",
    explanation:
      "Solicitud de códigos de autorización para emitir boletas electrónicas.",
    depends_on_hiring: false,
  },
];

export const mockTransactions: CashTransaction[] = [];

export const sampleTransactions: CashTransaction[] = [
  {
    id: "t1",
    type: "income",
    amount: 185000,
    category: "Ventas",
    date: "2026-05-01",
    description: "Venta de pan y pasteles - efectivo",
    status: "confirmed",
    document_reference: "Boleta N° 1",
  },
  {
    id: "t2",
    type: "income",
    amount: 120000,
    category: "Ventas",
    date: "2026-05-02",
    description: "Venta a empresa vecina - transferencia",
    status: "confirmed",
    document_reference: "Factura N° 1",
  },
  {
    id: "t3",
    type: "expense",
    amount: 45000,
    category: "Materias primas",
    date: "2026-05-02",
    description: "Compra de harina y levadura",
    status: "confirmed",
    document_reference: "Factura compra N° 205",
  },
  {
    id: "t4",
    type: "expense",
    amount: 280000,
    category: "Arriendo",
    date: "2026-05-01",
    description: "Arriendo local comercial",
    status: "confirmed",
    document_reference: "Contrato arriendo",
  },
  {
    id: "t5",
    type: "expense",
    amount: 35000,
    category: "Servicios",
    date: "2026-05-03",
    description: "Luz y agua",
    status: "pending",
  },
  {
    id: "t6",
    type: "income",
    amount: 95000,
    category: "Ventas",
    date: "2026-05-03",
    description: "Venta de café y desayunos",
    status: "confirmed",
    document_reference: "Boleta N° 2",
  },
  {
    id: "t7",
    type: "expense",
    amount: 15000,
    category: "Materias primas",
    date: "2026-05-03",
    description: "Compra de azúcar y mantequilla",
    status: "inferred",
  },
  {
    id: "t8",
    type: "expense",
    amount: 42000,
    category: "Servicios",
    date: "2026-05-04",
    description: "Internet y teléfono",
    status: "confirmed",
  },
];

export const mockFolders: DocumentFolder[] = [];

export const sampleFolders: DocumentFolder[] = [
  {
    id: "f1",
    name: "Legal",
    documents: [
      {
        id: "d1",
        name: "Escritura constitución SpA",
        type: "PDF",
        uploaded_at: "2026-04-15",
        status: "reviewed",
      },
      {
        id: "d2",
        name: "Registro comercial",
        type: "PDF",
        uploaded_at: "2026-04-16",
        status: "reviewed",
      },
      {
        id: "d3",
        name: "Poder representante",
        type: "PDF",
        uploaded_at: "2026-04-15",
        status: "uploaded",
      },
    ],
  },
  {
    id: "f2",
    name: "Tributario",
    documents: [
      {
        id: "d4",
        name: "RUT empresa",
        type: "PDF",
        uploaded_at: "2026-04-20",
        status: "reviewed",
      },
      {
        id: "d5",
        name: "Inicio actividades SII",
        type: "PDF",
        uploaded_at: "2026-04-22",
        status: "reviewed",
      },
      {
        id: "d6",
        name: "Boleta electrónica N° 1",
        type: "XML",
        uploaded_at: "2026-05-01",
        status: "extracted",
      },
    ],
  },
  {
    id: "f3",
    name: "RRHH",
    documents: [
      {
        id: "d7",
        name: "Contrato tipo trabajador",
        type: "PDF",
        uploaded_at: "2026-04-25",
        status: "uploaded",
      },
    ],
  },
  {
    id: "f4",
    name: "Operaciones",
    documents: [
      {
        id: "d8",
        name: "Contrato arriendo local",
        type: "PDF",
        uploaded_at: "2026-04-10",
        status: "reviewed",
      },
      {
        id: "d9",
        name: "Factura harina - Abril",
        type: "PDF",
        uploaded_at: "2026-04-12",
        status: "extracted",
      },
    ],
  },
];

export function detectAction(input: string): ProposedAction | null {
  const text = input.toLowerCase();

  const amountMatch = text.match(/(\d{4,})/);
  const amount = amountMatch ? parseInt(amountMatch[1], 10) : 0;

  if (text.includes("pagué") || text.includes("pague") || text.includes("pagamos")) {
    let category = "Otro";
    let description = input;
    if (text.includes("arriendo")) { category = "Arriendo"; description = "Pago de arriendo"; }
    else if (text.includes("luz") || text.includes("agua") || text.includes("internet")) { category = "Servicios"; description = "Pago de servicios"; }
    else if (text.includes("harina") || text.includes("levadura") || text.includes("materia")) { category = "Materias primas"; description = "Compra de materias primas"; }

    if (amount > 0) {
      return {
        intent: "create_cash_expense",
        confidence: 0.92,
        payload: { type: "expense", amount, category, description, date: new Date().toISOString().split("T")[0] },
        missing_fields: ["proveedor", "método de pago", "documento de respaldo"],
      };
    }
  }

  if (text.includes("vendí") || text.includes("vendi") || text.includes("venta")) {
    const category = "Ventas";
    let description = input;
    if (text.includes("pan")) description = "Venta de pan";
    else if (text.includes("café")) description = "Venta de café";
    else if (text.includes("desayuno")) description = "Venta de desayunos";

    if (amount > 0) {
      return {
        intent: "create_cash_income",
        confidence: 0.89,
        payload: { type: "income", amount, category, description, date: new Date().toISOString().split("T")[0] },
        missing_fields: ["cliente", "método de pago", "boleta o factura"],
      };
    }
  }

  if (text.includes("compré") || text.includes("compre")) {
    let category = "Materias primas";
    let description = input;
    if (text.includes("harina") || text.includes("levadura")) { category = "Materias primas"; description = "Compra de materias primas"; }
    else if (text.includes("equipo") || text.includes("horno")) { category = "Equipamiento"; description = "Compra de equipamiento"; }

    if (amount > 0) {
      return {
        intent: "create_cash_expense",
        confidence: 0.88,
        payload: { type: "expense", amount, category, description, date: new Date().toISOString().split("T")[0] },
        missing_fields: ["proveedor", "método de pago", "factura de compra"],
      };
    }
  }

  if (text.includes("quiero constituir") || text.includes("constituir una")) {
    let legalType = "SpA";
    if (text.includes("eirl")) legalType = "EIRL";
    else if (text.includes("empresario individual")) legalType = "Empresario Individual";

    return {
      intent: "create_company_constitution",
      confidence: 0.95,
      payload: { legal_type: legalType, description: `Constituir ${legalType}`, date: new Date().toISOString().split("T")[0] },
      missing_fields: ["nombre de fantasía", "rut de socios", "capital inicial", "domicilio social"],
    };
  }

  return null;
}

export function getActionResponse(action: ProposedAction): ChatResponse {
  const labels: Record<string, string> = {
    create_cash_expense: "Registrar egreso",
    create_cash_income: "Registrar ingreso",
    create_company_constitution: "Constituir empresa",
  };

  const steps: string[] = [];

  if (isFinancialPayload(action.payload)) {
    steps.push(`Tipo: ${action.payload.type === "income" ? "Ingreso" : "Egreso"}`);
    if (action.payload.amount > 0) {
      steps.push(`Monto: $${action.payload.amount.toLocaleString("es-CL")}`);
    }
    steps.push(`Categoría: ${action.payload.category}`);
  }

  if (isConstitutionPayload(action.payload)) {
    steps.push(`Figura legal: ${action.payload.legal_type}`);
  }

  steps.push(`Descripción: ${action.payload.description}`);
  steps.push(`Fecha: ${action.payload.date}`);

  return {
    message: `He detectado una acción: **${labels[action.intent] || action.intent}**. Revisa los datos propuestos antes de confirmar.`,
    proposed_action: action,
    next_steps: steps,
  };
}

export function getMockResponse(input: string): ChatResponse {
  const action = detectAction(input);
  if (action) {
    return getActionResponse(action);
  }

  const text = input.toLowerCase();

  if (text.includes("socio") || text.includes("socios") || text.includes("pareja") || text.includes("hermano")) {
    return {
      message:
        "Entiendo que tienes socios. Esto es clave para la figura legal:",
      assumptions: [
        "Planeas operar con al menos otra persona como socio.",
        "Quieren separar patrimonio personal del empresarial.",
      ],
      recommendation: {
        title: "Recomendación: SpA",
        description:
          "Con socios, la SpA es la figura más adecuada. Permite patrimonio separado, múltiples socios y gestión flexible. El Empresario Individual y la EIRL solo permiten un dueño.",
        options: [
          "SpA: patrimonio separado, múltiples socios, constitución rápida vía Empresa en un Día.",
          "EIRL: no aplica porque solo admite un titular.",
          "Empresario Individual: no aplica porque solo admite un titular.",
        ],
      },
      next_steps: [
        "Definir porcentajes de participación entre socios.",
        "Elaborar estatutos y contrato de socios.",
        "Constituir SpA en Registro de Empresas y Sociedades.",
      ],
    };
  }

  if (text.includes("rubro") || text.includes("panadería") || text.includes("comercio") || text.includes("servicio")) {
    return {
      message:
        "Analizando tu rubro. Las panaderías en la Región Metropolitana tienen consideraciones específicas:",
      assumptions: [
        "Operarás con local físico en una comuna urbana.",
        "Requerirás patente municipal y permisos de funcionamiento.",
      ],
      recommendation: {
        title: "Análisis por rubro",
        description:
          "La panadería requiere permiso municipal de funcionamiento, certificado de compatibilidad de uso del local y posiblemente autorización sanitaria. Los márgenes suelen ser del 30-40%.",
        options: [
          "Local comercial: arriendo o comodato, patente municipal obligatoria.",
          "Rubro alimenticio: posible fiscalización de Seremi de Salud.",
          "Ventas diarias: ideal para contabilidad simplificada.",
        ],
      },
      next_steps: [
        "Verificar uso de suelo del local en la municipalidad.",
        "Solicitar patente municipal antes de iniciar operaciones.",
        "Consultar requisitos sanitarios en Seremi correspondiente.",
      ],
    };
  }

  if (text.includes("comuna") || text.includes("providencia") || text.includes("santiago") || text.includes(" municipalidad")) {
    return {
      message:
        "La comuna donde operes define trámites municipales y costos:",
      assumptions: [
        "Te refieres a la Municipalidad de Providencia, Región Metropolitana.",
        "Operarás con local comercial (no domicilio particular).",
      ],
      recommendation: {
        title: "Información municipal",
        description:
          "Providencia requiere patente comercial, certificado de uso de suelo y autorización de funcionamiento. El trámite es online en su portal.",
        options: [
          "Patente comercial: costo variable según metros cuadrados y rubro.",
          "Uso de suelo: verificar que el local permita comercio de alimentos.",
          "Plazo estimado: 5 a 10 días hábiles.",
        ],
      },
      next_steps: [
        "Revisar uso de suelo en el portal de Providencia.",
        "Solicitar patente con título de dominio o contrato de arriendo.",
        "Obtener certificado de iniciación de actividades para patente.",
      ],
    };
  }

  if (text.includes("contratar") || text.includes("trabajador") || text.includes("empleado") || text.includes("rrhh")) {
    return {
      message:
        "Si planeas contratar, hay obligaciones laborales que debes conocer desde antes:",
      assumptions: [
        "Planeas contratar al menos un trabajador dependiente.",
        "No tienes experiencia previa en gestión laboral.",
      ],
      recommendation: {
        title: "Checklist de primer trabajador",
        description:
          "Debes inscribir al trabajador en AFP, sistema de salud, seguro de cesantía y confeccionar contrato por escrito. También debes declarar mensualmente en Previred.",
        options: [
          "Contrato por escrito: obligatorio, puede ser a plazo fijo o indefinido.",
          "AFP + salud: el trabajador elige, tú debes informar la selección.",
          "Previred: declaración mensual de remuneraciones y cotizaciones.",
        ],
      },
      next_steps: [
        "Definir tipo de contrato y remuneración bruta.",
        "Informar elección de AFP y salud del trabajador.",
        "Inscribir empresa en Previred para declaraciones mensuales.",
      ],
    };
  }

  if (text.includes("figura") || text.includes("legal") || text.includes("spa") || text.includes("eirl") || text.includes("empresario individual")) {
    return {
      message:
        "Aquí tienes una comparativa clara de las figuras legales para tu situación:",
      assumptions: [
        "Eres una persona natural que quiere iniciar un negocio formal.",
        "Buscas la opción más simple que proteja tu patrimonio.",
      ],
      recommendation: {
        title: "Comparativa de figuras legales",
        description:
          "Para una panadería con baja complejidad inicial y riesgo moderado, la SpA ofrece buena protección patrimonial y flexibilidad. El Empresario Individual es más simple pero con responsabilidad ilimitada.",
        options: [
          "Empresario Individual: rápido, barato, responsabilidad ilimitada, un solo dueño.",
          "EIRL: patrimonio separado, un solo titular, costo medio.",
          "SpA: patrimonio separado, múltiples socios, más formalidad, constitución express.",
        ],
      },
      next_steps: [
        "Confirmar si tendrás socios o operarás solo.",
        "Evaluar nivel de riesgo del rubro y patrimonio personal a proteger.",
        "Elegir figura y proceder a constitución.",
      ],
    };
  }

  if (text.includes("impuesto") || text.includes("iva") || text.includes("tributario") || text.includes("renta")) {
    return {
      message:
        "Como PROPYME con Contabilidad Simplificada, estas son tus obligaciones tributarias principales:",
      assumptions: [
        "Facturarás menos de 100.000 UF anuales.",
        "Elegirás o ya tienes régimen PROPYME General.",
      ],
      recommendation: {
        title: "Obligaciones tributarias PROPYME",
        description:
          "Debes declarar IVA mensual (F29), renta anual (F22) y posibles retenciones de honorarios (F30). La Contabilidad Simplificada te permite llevar un registro más simple que la contabilidad completa.",
        options: [
          "IVA mensual F29: dentro de los 12 días hábiles del mes siguiente.",
          "Renta anual F22: abril de cada año.",
          "Retenciones F30: si pagas honorarios a terceros.",
          "Boletas electrónicas: obligatorias desde el inicio.",
        ],
      },
      next_steps: [
        "Solicitar timbraje de boletas y facturas en el SII.",
        "Definir categorías de ingresos y egresos para el libro de caja.",
        "Agendar calendario de vencimientos tributarios.",
      ],
    };
  }

  if (text.includes("paso") || text.includes("pasos") || text.includes("qué sigue") || text.includes("sigue") || text.includes("próximo")) {
    return {
      message:
        "Estos son los próximos pasos recomendados para tu panadería:",
      next_steps: [
        "Completar inicio de actividades en el SII (Formulario 4415).",
        "Solicitar timbraje de boletas/facturas electrónicas.",
        "Obtener patente municipal en Providencia.",
        "Configurar libro de caja en Copiloto.",
        "Abrir cuenta corriente empresarial.",
      ],
    };
  }

  return {
    message:
      "Entiendo. Para orientarte mejor, me gustaría saber más sobre tu situación. ¿Puedes contarme sobre:",
    next_steps: [
      "¿Qué rubro o tipo de negocio planeas iniciar?",
      "¿En qué comuna operarás?",
      "¿Tendrás socios o operarás solo?",
      "¿Planeas contratar trabajadores de inmediato?",
    ],
  };
}
