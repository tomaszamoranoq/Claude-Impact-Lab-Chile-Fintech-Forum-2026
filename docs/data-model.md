# Modelo de Datos Inicial

## Entidades

### users

- id
- email
- name
- created_at

### companies

- id
- owner_user_id
- legal_name
- rut
- legal_type
- tax_regime
- lifecycle_stage
- created_at

### company_profiles

- id
- company_id
- has_partners
- wants_liability_separation
- expected_revenue_range
- sells_products
- sells_services
- plans_to_hire
- operates_from_home
- municipality
- notes

### roadmap_items

- id
- company_id
- stage
- title
- description
- status
- due_date
- source_id
- created_at

### documents

- id
- company_id
- name
- type
- folder
- storage_path
- uploaded_at

### document_extractions

- id
- document_id
- extracted_payload
- confidence
- reviewed_by_user
- created_at

### cash_transactions

- id
- company_id
- type
- amount
- category
- date
- description
- document_id
- status
- created_at

### invoices

- id
- company_id
- document_id
- issuer_rut
- receiver_rut
- folio
- issue_date
- net_amount
- tax_amount
- gross_amount
- payment_status

### compliance_obligations

- id
- company_id
- title
- category
- period
- due_date
- status
- explanation
- source_id

### agent_actions

- id
- company_id
- user_id
- intent
- input_text
- proposed_payload
- status
- confidence
- model_used
- sources_used
- created_at
- executed_at

### knowledge_sources

- id
- topic
- source_name
- source_url
- effective_date
- content_summary
- source_text_ref
- created_at

## Estados Sugeridos

### lifecycle_stage

- exploration
- constitution
- tax_start
- operation
- hiring
- regularization
- closing

### action status

- proposed
- needs_more_info
- confirmed
- rejected
- executed
- failed

### roadmap status

- pending
- in_progress
- completed
- blocked

