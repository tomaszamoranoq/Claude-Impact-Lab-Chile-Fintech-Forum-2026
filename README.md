# Copiloto Pyme Chile

Aplicacion web impulsada por IA para acompanar a microempresas chilenas durante su ciclo de vida: decision inicial, constitucion, inicio tributario, operacion mensual, contratacion y eventual cierre.

El MVP cubre todo el recorrido como experiencia guiada, pero desarrolla con mayor profundidad la asesoria inicial, la hoja de ruta personalizada y la transformacion de instrucciones naturales en acciones estructuradas.

## Ejecutar el proyecto

Requisitos: Node.js 20+ y npm.

```bash
npm install
npm run dev
```

Abre http://localhost:3000 en tu navegador. La raíz muestra la **landing pública**; la demo privada está en `/app`.

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
3. Esto crea las tablas `companies`, `agent_actions`, `cash_transactions`, `business_diagnoses` y `documents`, junto con los índices y datos iniciales (empresa mock y transacciones de la panadería).

> **Recordatorio Fase 4A:** Si tu base de datos ya estaba configurada antes de Fase 4A, vuelve a ejecutar `docs/supabase-schema.sql` en el SQL Editor. El script es idempotente y agregará la nueva tabla `documents` sin afectar los datos existentes.

4. Crea el bucket privado `company-documents` en **Supabase Storage**:
   - Ve a Storage en el dashboard de Supabase.
   - Crea un nuevo bucket llamado `company-documents`.
   - Mantenlo como **privado** (no público).
   - No se requieren políticas de acceso adicionales para la demo actual, ya que el backend usa `SUPABASE_SERVICE_ROLE_KEY`.

> **Nota:** Las descargas directas con signed URLs quedarán para una fase posterior.

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

### Fase 3D — Landing pública + separación de app privada

- Nueva landing pública en `/` con presentación del producto, características principales y disclaimer legal.
- Aplicación privada/demo movida bajo `/app/*`:
  - `/app/asesor-inicial`, `/app/hoja-de-ruta`, `/app/empresa`, `/app/documentos`, `/app/libro-de-caja`, `/app/acciones-ia`, `/app/cumplimiento`.
- `app/layout.tsx` ya no incluye Sidebar globalmente; solo envuelve `html`/`body`.
- `app/app/layout.tsx` incluye Sidebar + `<main>` para las rutas privadas.
- Redirects en rutas antiguas para no romper bookmarks:
  - `/asesor-inicial` → `/app/asesor-inicial`
  - `/empresa` → `/app/empresa`
  - etc.
- Sidebar actualizado con links a `/app/*` y link "Inicio público" separado visualmente.

#### Limitaciones técnicas Fase 2B

- **Atomicidad:** la confirmación de una acción financiera implica dos queries sucesivas (update de acción + insert de transacción). Si falla la segunda, la acción queda como `executed` sin transacción asociada. Esto es aceptable para la demo single-tenant actual; la atomicidad real se abordará en una fase posterior.
- Sin autenticación: `company_id` y `user_id` son mocks fijos.
- Sin pgvector, IA real ni integración SII.

### Fase 4A — Carga de documentos PDF/foto con Supabase Storage

- Tabla `documents` en Supabase para metadata de archivos.
- Bucket privado `company-documents` en Supabase Storage.
- Página `/app/documentos` permite subir PDF/PNG/JPEG (máx. 5 MB) a carpetas: Legal, Tributario, RRHH, Operaciones.
- El archivo se guarda en Storage y su metadata en la tabla `documents` con `status: uploaded`.
- Botón "Analizar" simula extracción sin usar Claude Vision: cambia el status a `analyzed` y guarda un `extracted_payload` mock explícito.
- **No se crean `agent_actions` ni `cash_transactions` al subir o analizar documentos.**
- Flujo actual: Upload → metadata en DB → `uploaded` → Analizar → `analyzed` (mock).
- Flujo futuro: Vision extraction → documento tributario confirmable → pago/caja separado.
- Sin signed URLs todavía; el acceso a archivos queda para una fase posterior.

### Fase 4B — Extracción documental mock-controlada con propuesta confirmable

- El análisis documental es **100% mock y determinístico**: clasifica según el nombre del archivo, carpeta y tipo, sin OCR ni Claude Vision.
- Al hacer click en "Analizar", el sistema genera una propuesta estructurada (`DocumentExtraction`) con campos como tipo de documento, emisor, monto, categoría sugerida, confianza y advertencias.
- La propuesta queda guardada en `documents.extracted_payload` y se muestra en una fila expandida dentro de la tabla de documentos.
- Montos mock son determinísticos (ej. factura de harina = $120.000, boleta = $25.000) para que la demo sea reproducible.
- **No se crean `agent_actions` ni `cash_transactions` al analizar documentos.**
- Botón "Confirmar extracción" está visible pero deshabilitado, con copy "Disponible en próxima fase".
- Próxima fase: convertir la extracción confirmada en propuesta operativa (factura, pago, caja) con confirmación humana explícita.

### Fase 4C — Confirmación documental controlada

- Al confirmar una extracción documental operable (`invoice` o `receipt` con monto), el sistema crea una `agent_action` con status `proposed` e intent `create_transaction_from_document`.
- El documento pasa a `status: confirmed` y se vincula a la acción mediante `linked_agent_action_id`.
- **No se crea `cash_transaction` al confirmar la extracción.** La ejecución real queda en `/app/acciones-ia`.
- Documentos no operables (`contract`, `tax_certificate`, `unknown`) no generan acción y permanecen en `analyzed`.
- En `/app/acciones-ia`, las acciones desde documento muestran intent "Registrar desde documento" con el monto, categoría y fecha detectados.
- Al confirmar la acción en Acciones IA, se crea la transacción de caja con `document_reference` apuntando al nombre del documento.
- Flujo completo: Documento → Analizar → Confirmar extracción → Acción propuesta → Confirmar en Acciones IA → Transacción de caja.

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
| GET | `/api/documents` | Listar documentos de la empresa |
| POST | `/api/documents/upload` | Subir documento a Supabase Storage |
| POST | `/api/documents/[id]/analyze` | Simular análisis de documento (mock, sin Vision) |
| POST | `/api/documents/[id]/confirm-extraction` | Confirmar extracción y crear acción propuesta |

## Enfoque del MVP

- Chile.
- Microempresas.
- Empresa en un Dia.
- Empresario Individual, EIRL y SpA.
- Regimen PROPYME General con Contabilidad Simplificada.
- Carga manual de documentos PDF/foto con organización por carpetas.
- IA con respuestas trazables, fuentes y confirmacion humana antes de ejecutar acciones.

## Documentos Iniciales

- [Sistema de Diseño](DESIGN.md)
- [Vision de Producto](docs/product-vision.md)
- [Alcance MVP](docs/mvp-scope.md)
- [Arquitectura Tecnica](docs/architecture.md)
- [Modelo de Datos Inicial](docs/data-model.md)
- [Plan de Implementacion](docs/implementation-plan.md)
- [Schema Supabase](docs/supabase-schema.sql)
