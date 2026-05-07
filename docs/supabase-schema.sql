-- ============================================================
-- Copiloto Pyme Chile — Supabase Schema (Fase 5B)
-- ============================================================
-- Ejecutar este script en el SQL Editor de Supabase.
-- Es idempotente: puede ejecutarse múltiples veces sin duplicar datos.
-- ============================================================

-- -----------------------------------------------------------
-- Tabla: companies
-- -----------------------------------------------------------
create table if not exists companies (
  id text primary key,
  legal_name text not null,
  rut text not null,
  legal_type text not null,
  tax_regime text not null,
  lifecycle_stage text not null,
  representative_name text,
  representative_rut text,
  industry text,
  municipality text,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------
-- Tabla: agent_actions
-- -----------------------------------------------------------
create table if not exists agent_actions (
  id text primary key,
  company_id text not null references companies(id) on delete cascade,
  user_id text not null,
  intent text not null,
  input_text text not null,
  proposed_payload jsonb not null,
  status text not null,
  confidence numeric not null,
  missing_fields text[] not null default '{}',
  model_used text not null,
  sources_used text[] not null default '{}',
  created_at timestamptz not null default now(),
  executed_at timestamptz
);

-- -----------------------------------------------------------
-- Tabla: cash_transactions
-- -----------------------------------------------------------
create table if not exists cash_transactions (
  id text primary key,
  company_id text not null references companies(id) on delete cascade,
  type text not null,
  amount numeric not null,
  category text not null,
  date date not null,
  description text not null,
  status text not null,
  document_reference text,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------
-- Índices
-- -----------------------------------------------------------
create index if not exists idx_agent_actions_company_created
  on agent_actions(company_id, created_at desc);

create index if not exists idx_cash_transactions_company_date
  on cash_transactions(company_id, date desc);

-- -----------------------------------------------------------
-- Tabla: business_diagnoses (Fase 3C)
-- -----------------------------------------------------------
create table if not exists business_diagnoses (
  id text primary key,
  company_id text not null references companies(id) on delete cascade,
  user_id text not null,
  input_text text not null,
  business_profile jsonb not null,
  recommended_legal_type text not null,
  lifecycle_stage text not null,
  assumptions text[] not null default '{}',
  unknowns text[] not null default '{}',
  next_steps text[] not null default '{}',
  confidence numeric not null,
  model_used text not null,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------
-- Índice adicional para diagnósticos (Fase 3C)
-- -----------------------------------------------------------
create index if not exists idx_business_diagnoses_company_created
  on business_diagnoses(company_id, created_at desc);

-- -----------------------------------------------------------
-- Tabla: documents (Fase 4A)
-- -----------------------------------------------------------
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references companies(id) on delete cascade,
  name text not null,
  folder text not null check (folder in ('legal', 'tributario', 'rrhh', 'operaciones')),
  file_type text not null,
  mime_type text,
  file_size integer,
  storage_bucket text not null default 'company-documents',
  storage_path text,
  status text not null check (status in ('uploaded', 'pending_analysis', 'analyzed', 'confirmed', 'rejected', 'failed')),
  source text not null default 'manual_upload',
  extracted_payload jsonb,
  linked_agent_action_id text references agent_actions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------
-- Índices para documents (Fase 4A)
-- -----------------------------------------------------------
create index if not exists idx_documents_company_created
  on documents(company_id, created_at desc);

create index if not exists idx_documents_company_folder
  on documents(company_id, folder);

-- -----------------------------------------------------------
-- Seed: empresa mock (idempotente)
-- -----------------------------------------------------------
insert into companies (
  id, legal_name, rut, legal_type, tax_regime,
  lifecycle_stage, representative_name, representative_rut,
  industry, municipality
)
values (
  'mock-company-1',
  'Panadería La Estrella SpA',
  '76.123.456-7',
  'SpA',
  'PROPYME General - Contabilidad Simplificada',
  'tax_start',
  'María González',
  '12.345.678-9',
  'Elaboración de pan y productos de panadería',
  'Providencia, Región Metropolitana'
)
on conflict (id) do nothing;

-- -----------------------------------------------------------
-- Seed: transacciones mock iniciales (idempotente)
-- -----------------------------------------------------------
insert into cash_transactions (
  id, company_id, type, amount, category, date,
  description, status, document_reference
)
values
  ('t1', 'mock-company-1', 'income', 185000, 'Ventas', '2026-05-01',
   'Venta de pan y pasteles - efectivo', 'confirmed', 'Boleta N° 1'),
  ('t2', 'mock-company-1', 'income', 120000, 'Ventas', '2026-05-02',
   'Venta a empresa vecina - transferencia', 'confirmed', 'Factura N° 1'),
  ('t3', 'mock-company-1', 'expense', 45000, 'Materias primas', '2026-05-02',
   'Compra de harina y levadura', 'confirmed', 'Factura compra N° 205'),
  ('t4', 'mock-company-1', 'expense', 280000, 'Arriendo', '2026-05-01',
   'Arriendo local comercial', 'confirmed', 'Contrato arriendo'),
  ('t5', 'mock-company-1', 'expense', 35000, 'Servicios', '2026-05-03',
   'Luz y agua', 'pending', null),
  ('t6', 'mock-company-1', 'income', 95000, 'Ventas', '2026-05-03',
   'Venta de café y desayunos', 'confirmed', 'Boleta N° 2'),
  ('t7', 'mock-company-1', 'expense', 15000, 'Materias primas', '2026-05-03',
   'Compra de azúcar y mantequilla', 'inferred', null),
  ('t8', 'mock-company-1', 'expense', 42000, 'Servicios', '2026-05-04',
   'Internet y teléfono', 'confirmed', null)
on conflict (id) do nothing;

-- -----------------------------------------------------------
-- Tabla: roadmap_items (Fase 5A)
-- -----------------------------------------------------------
create table if not exists roadmap_items (
  id text primary key,
  company_id text not null references companies(id) on delete cascade,
  source_diagnosis_id text references business_diagnoses(id) on delete set null,
  stage text not null,
  title text not null,
  description text not null,
  status text not null check (status in ('pending', 'in_progress', 'completed', 'blocked')),
  due_date date,
  source_name text,
  source_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------
-- Índices para roadmap_items (Fase 5A)
-- -----------------------------------------------------------
create index if not exists idx_roadmap_items_company_stage
  on roadmap_items(company_id, stage);

create index if not exists idx_roadmap_items_company_status
  on roadmap_items(company_id, status);
