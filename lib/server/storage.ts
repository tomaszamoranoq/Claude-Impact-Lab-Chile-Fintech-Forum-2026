import { supabase } from "./supabase";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
];

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export interface UploadCompanyDocumentInput {
  companyId: string;
  folder: string;
  fileName: string;
  mimeType: string;
}

export interface UploadCompanyDocumentResult {
  path: string;
}

function sanitizeFileName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_");
}

export async function uploadCompanyDocument(
  file: Buffer,
  input: UploadCompanyDocumentInput
): Promise<UploadCompanyDocumentResult> {
  if (!ALLOWED_MIME_TYPES.includes(input.mimeType)) {
    throw new Error(
      `Tipo de archivo no permitido: ${input.mimeType}. Solo se aceptan PDF, PNG y JPEG.`
    );
  }

  if (file.length > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `El archivo excede el límite de ${MAX_FILE_SIZE_MB} MB.`
    );
  }

  const safeFileName = sanitizeFileName(input.fileName);
  const timestamp = Date.now();
  const path = `${input.companyId}/${input.folder}/${timestamp}-${safeFileName}`;

  const { error } = await supabase.storage
    .from("company-documents")
    .upload(path, file, {
      contentType: input.mimeType,
      upsert: false,
    });

  if (error) {
    if (error.message?.toLowerCase().includes("bucket") || error.message?.toLowerCase().includes("not found")) {
      throw new Error(
        "Bucket company-documents no existe. Créalo en Supabase Storage como bucket privado."
      );
    }
    throw new Error(`Error al subir archivo: ${error.message}`);
  }

  return { path };
}
