# Copiloto Pyme Chile

Aplicacion web impulsada por IA para acompanar a microempresas chilenas durante su ciclo de vida: decision inicial, constitucion, inicio tributario, operacion mensual, contratacion y eventual cierre.

El MVP cubre todo el recorrido como experiencia guiada, pero desarrolla con mayor profundidad la asesoria inicial, la hoja de ruta personalizada y la transformacion de instrucciones naturales en acciones estructuradas.

## Ejecutar el proyecto

Requisitos: Node.js 20+ y npm.

```bash
npm install
npm run dev
```

Abre http://localhost:3000 en tu navegador. La app redirige automaticamente al **Asesor Inicial**.

### Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
ANTHROPIC_API_KEY=sk-ant-...
# Opcional:
# ANTHROPIC_MODEL=claude-3-5-haiku-latest
```

> **Advertencia de seguridad:** `SUPABASE_SERVICE_ROLE_KEY` otorga acceso administrativo a la base de datos. Nunca la expongas al frontend, ni la incluyas en repositorios públicos. El archivo `.env.local` ya está en `.gitignore`.

### Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Ve al **SQL Editor** y ejecuta el contenido de [`docs/supabase-schema.sql`](docs/supabase-schema.sql).
3. Esto crea las tablas `companies`, `agent_actions`, `cash_transactions` y `business_diagnoses`, junto con los índices y datos iniciales (empresa mock y transacciones de la panadería).

> **Recordatorio Fase 3C:** Si tu base de datos ya estaba configurada antes de Fase 3C, vuelve a ejecutar `docs/supabase-schema.sql` en el SQL Editor. El script es idempotente y agregará la nueva tabla `business_diagnoses` sin afectar los datos existentes.

### Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Zod (validación de schemas)
- Supabase / Postgres (Fase 2B)

### Fase 1 — Prototipo web navegable

- Pantallas operativas: Asesor Inicial, Hoja de Ruta, Empresa, Documentos, Libro de Caja, Cumplimiento.
- Chat con detección local de intenciones (regex mock).
- Patrón "IA propone → usuario confirma → sistema ejecuta" simulado en frontend.
- Datos mock para toda la demo.

### Fase 2A — Backend local mínimo

- API routes con validación Zod.
- Store en memoria para `agent_actions` y `cash_transactions`.
- Flujo seguro completo:
  1. Usuario escribe instrucción natural.
  2. Frontend detecta intención (mock).
  3. Backend crea acción con status `proposed`.
  4. Usuario confirma/rechaza.
  5. Backend valida, ejecuta si corresponde y deja auditoría.
- Acciones financieras confirmadas crean transacción en Libro de Caja (status `executed`).
- Acciones de constitución confirmadas quedan como `confirmed` sin crear movimiento de caja.

### Fase 2B — Supabase / Postgres

- Store en memoria reemplazado por Supabase/Postgres.
- Tablas: `companies`, `agent_actions`, `cash_transactions`.
- Seed idempotente con empresa mock y transacciones iniciales.
- Cliente admin (`SUPABASE_SERVICE_ROLE_KEY`) usado solo en server/API routes.
- Sin cambios en el frontend; sigue consumiendo los mismos endpoints.

### Fase 3A — Centro de Acciones IA / Auditoría

- Nueva ruta `/acciones-ia` con tabla de auditoría de acciones del agente.
- Consumo de `GET /api/agent-actions` desde el frontend.
- Filtros por estado: Todos, Propuestas, Ejecutadas, Confirmadas, Rechazadas, Fallidas.
- Detalle expandible con input completo, payload JSON, metadatos y timestamps.
- Intenciones traducidas al español para lectura humana.
- Resumen de payload contextual (monto + categoría para financieras, figura legal para constitución).
- Sin backend nuevo; reutiliza endpoints existentes de Fase 2B.
- Sin Supabase en componentes client.

### Fase 3B — Interpretador IA controlado con Claude

- Endpoint `POST /api/interpret-action` que recibe texto del usuario y lo envía a Claude para interpretación estructurada.
- Prompt de sistema estricto: solo clasifica en 4 intents (`create_cash_income`, `create_cash_expense`, `create_company_constitution`, `none`).
- No da asesoría legal extensa, no inventa datos, no ejecuta acciones directamente.
- Validación con Zod de la respuesta JSON de Claude.
- Fallback automático a regex local (`lib/mock-data.ts`) si:
  - No hay `ANTHROPIC_API_KEY` configurada.
  - Claude devuelve error, JSON inválido o no pasa validación Zod.
- El endpoint devuelve `model_used` e `interpreter` para trazabilidad:
  - `"claude"` + nombre del modelo cuando usa Claude.
  - `"fallback"` + `"mock-regex"` cuando usa regex.
- `ChatWindow.tsx` consume el endpoint y registra `model_used` real en `agent_actions`.
- Control de costos: `max_tokens: 256`, `temperature: 0`, modelo `claude-3-5-haiku-latest` por defecto.

### Fase 3C — Diagnóstico Inicial Guiado con Claude

- Tabla `business_diagnoses` en Supabase para persistir diagnósticos estructurados.
- Nuevos schemas Zod para perfil de negocio, categorías controladas, tri-state (`true`/`false`/`unknown`).
- Endpoint `POST /api/interpret-business-diagnosis` que detecta si el usuario describe una idea/contexto de negocio.
- Claude clasifica en dominio de diagnóstico vs. acción operativa via **tool use** (`emit_business_diagnosis` con `tool_choice` forzado) para salida estructurada garantizada. Sin JSON textual, sin `JSON.parse`.
- Si es acción operativa, devuelve `is_business_diagnosis: false`.
- Campos controlados para lógica + campos libres para contexto humano + `unknown` cuando faltan datos.
- Flujo en chat (Opción B):
  1. Intenta interpretar como acción operativa (`/api/interpret-action`).
  2. Si no es acción, intenta como diagnóstico (`/api/interpret-business-diagnosis`).
  3. Si es diagnóstico, muestra tarjeta con Guardar/Descartar.
  4. Si guarda, se persiste en `business_diagnoses`.
- Endpoint `GET /api/business-diagnosis/latest` devuelve el diagnóstico más reciente.
- Página `/empresa` muestra el último diagnóstico guardado como tarjeta simple.
- Sin cambios en `/acciones-ia` (solo acciones ejecutables).

#### Limitaciones técnicas Fase 2B

- **Atomicidad:** la confirmación de una acción financiera implica dos queries sucesivas (update de acción + insert de transacción). Si falla la segunda, la acción queda como `executed` sin transacción asociada. Esto es aceptable para la demo single-tenant actual; la atomicidad real se abordará en una fase posterior.
- Sin autenticación: `company_id` y `user_id` son mocks fijos.
- Sin Supabase Storage, pgvector, IA real ni integración SII.

### Endpoints API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/agent-actions` | Listar acciones del agente |
| POST | `/api/agent-actions` | Crear nueva acción propuesta |
| POST | `/api/agent-actions/[id]/confirm` | Confirmar y ejecutar acción |
| POST | `/api/agent-actions/[id]/reject` | Rechazar acción |
| GET | `/api/cash-transactions` | Listar transacciones de caja |
| POST | `/api/interpret-action` | Interpretar instrucción operativa con IA (Claude) |
| POST | `/api/interpret-business-diagnosis` | Interpretar diagnóstico de negocio con IA (Claude) |
| POST | `/api/business-diagnosis` | Crear diagnóstico de negocio |
| GET | `/api/business-diagnosis/latest` | Obtener último diagnóstico de negocio |

## Enfoque del MVP

- Chile.
- Microempresas.
- Empresa en un Dia.
- Empresario Individual, EIRL y SpA.
- Regimen PROPYME General con Contabilidad Simplificada.
- Carga manual de documentos/XML en la primera version.
- IA con respuestas trazables, fuentes y confirmacion humana antes de ejecutar acciones.

## Documentos Iniciales

- [Vision de Producto](docs/product-vision.md)
- [Alcance MVP](docs/mvp-scope.md)
- [Arquitectura Tecnica](docs/architecture.md)
- [Modelo de Datos Inicial](docs/data-model.md)
- [Plan de Implementacion](docs/implementation-plan.md)
- [Schema Supabase](docs/supabase-schema.sql)
