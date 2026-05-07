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

export interface DocumentSummary {
  totalDocuments: number;
  byFolder: Array<{ folder: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  recentDocuments: Array<{
    id: string;
    name: string;
    folder: string;
    status: string;
    file_type: string;
    created_at: string;
  }>;
}

export async function getDocumentSummary(
  companyId: string = DEFAULT_COMPANY_ID
): Promise<DocumentSummary> {
  const docs = await listDocuments(companyId);

  const folderMap = new Map<string, number>();
  const statusMap = new Map<string, number>();
  for (const d of docs) {
    folderMap.set(d.folder, (folderMap.get(d.folder) || 0) + 1);
    statusMap.set(d.status, (statusMap.get(d.status) || 0) + 1);
  }

  const byFolder = Array.from(folderMap.entries())
    .map(([folder, count]) => ({ folder, count }))
    .sort((a, b) => b.count - a.count);

  const byStatus = Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  const recentDocuments = docs.slice(0, 5).map((d) => ({
    id: d.id,
    name: d.name,
    folder: d.folder,
    status: d.status,
    file_type: d.file_type,
    created_at: d.created_at,
  }));

  return {
    totalDocuments: docs.length,
    byFolder,
    byStatus,
    recentDocuments,
  };
}
