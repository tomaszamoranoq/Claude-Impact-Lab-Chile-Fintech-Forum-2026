import { supabase } from "./supabase";
import { Document, CreateDocumentInput } from "@/lib/schemas";

const DEFAULT_COMPANY_ID = "mock-company-1";

export async function listDocuments(companyId: string = DEFAULT_COMPANY_ID): Promise<Document[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Error listando documentos: ${error.message}`);
  }

  return (data ?? []) as unknown as Document[];
}

export async function createDocument(input: CreateDocumentInput): Promise<Document> {
  const { data, error } = await supabase
    .from("documents")
    .insert({
      company_id: input.company_id,
      name: input.name,
      folder: input.folder,
      file_type: input.file_type,
      mime_type: input.mime_type,
      file_size: input.file_size,
      storage_bucket: input.storage_bucket,
      storage_path: input.storage_path,
      status: input.status,
      source: input.source,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error creando documento: ${error.message}`);
  }

  return data as unknown as Document;
}

export async function updateDocumentStatus(
  id: string,
  status: Document["status"],
  extractedPayload?: Record<string, unknown>
): Promise<Document> {
  const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (extractedPayload !== undefined) {
    update.extracted_payload = extractedPayload;
  }

  const { data, error } = await supabase
    .from("documents")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error actualizando documento: ${error.message}`);
  }

  return data as unknown as Document;
}

export async function getDocument(id: string): Promise<Document | null> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Error obteniendo documento: ${error.message}`);
  }

  return data as unknown as Document;
}
