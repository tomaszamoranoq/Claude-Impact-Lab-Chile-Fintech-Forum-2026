# Arquitectura Tecnica

## Stack Recomendado

- Frontend: Next.js + TypeScript.
- UI: Tailwind CSS + componentes propios.
- Backend: API routes de Next.js al inicio; separable a FastAPI/NestJS despues.
- Base de datos: PostgreSQL.
- Vector search: pgvector.
- Auth y storage: Supabase en MVP.
- Validacion: Zod.
- Orquestacion IA: capa propia de agentes y herramientas.
- Jobs: Trigger.dev o Inngest en una segunda iteracion.

## Capas

```text
Frontend Web
  Chat | Hoja de Ruta | Back Office | Documentos | Cumplimiento
        |
Backend API
  Empresas | Usuarios | Documentos | Transacciones | Obligaciones
        |
Orquestador IA
  Router | Asesor Inicial | Tributario | Documental | Cumplimiento
        |
Postgres + pgvector + Storage
```

## Patron de Accion Segura

La IA nunca escribe directamente en la base de datos.

Flujo:

1. Usuario da una instruccion natural.
2. Router clasifica intencion.
3. Agente genera propuesta estructurada.
4. Backend valida con schema.
5. Usuario confirma.
6. Backend ejecuta.
7. Se registra auditoria.

Ejemplo:

```json
{
  "intent": "create_cash_expense",
  "confidence": 0.92,
  "requires_confirmation": true,
  "payload": {
    "type": "expense",
    "amount": 500000,
    "category": "arriendo",
    "date": "2026-05-05"
  },
  "missing_fields": ["supplier", "payment_method"]
}
```

## Agentes Iniciales

### Supervisor

- Clasifica intencion.
- Decide que agente debe responder.
- Detecta datos faltantes.
- Protege limites del dominio.

### Asesor Inicial

- Diagnostica etapa.
- Recomienda figura legal.
- Crea hoja de ruta.
- Explica pasos y fuentes.

### Documental

- Clasifica archivos.
- Extrae campos clave.
- Sugiere carpeta y relacion con tareas.

### Operaciones Tributarias

- Registra ingresos/egresos.
- Lee XMLs.
- Categoriza movimientos.
- Calcula estimaciones simples.

### Cumplimiento

- Genera calendario.
- Explica obligaciones.
- Muestra datos usados.

## RAG

La base de conocimiento debe ser curada, no un volcado completo de leyes.

Cada fragmento deberia guardar:

- Tema.
- Fuente.
- URL.
- Texto fuente o resumen operacional.
- Fecha de vigencia.
- Aplicabilidad.
- Riesgo o advertencia.

