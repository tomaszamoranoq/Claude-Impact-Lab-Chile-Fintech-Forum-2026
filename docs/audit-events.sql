-- ============================================================
-- Copiloto Pyme Chile — Tabla audit_events
-- ============================================================
-- Ejecutar en el SQL Editor de Supabase.
-- Es idempotente: puede ejecutarse múltiples veces sin duplicar datos.
-- ============================================================

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  company_id text,
  user_id text,
  input_text text,
  endpoint text not null,
  selected_agent text,
  classifier_used text,
  classifier_model text,
  confidence numeric,
  reason text,
  success boolean not null,
  model_used text,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_events_company_created
  on audit_events(company_id, created_at desc);

create index if not exists idx_audit_events_created_desc
  on audit_events(created_at desc);

create index if not exists idx_audit_events_success
  on audit_events(success);
