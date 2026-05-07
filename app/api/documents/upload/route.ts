import { NextRequest, NextResponse } from "next/server";
import { createDocument } from "@/lib/server/documents";
import { uploadCompanyDocument } from "@/lib/server/storage";
import { documentFolderSchema } from "@/lib/schemas";
import { getDemoIdentity } from "@/lib/server/demo-session";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
];

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No se encontró archivo en la petición." },
        { status: 400 }
      );
    }

    if (typeof folder !== "string") {
      return NextResponse.json(
        { success: false, error: "El campo 'folder' es obligatorio." },
        { status: 400 }
      );
    }

    const folderParsed = documentFolderSchema.safeParse(folder);
    if (!folderParsed.success) {
      return NextResponse.json(
        { success: false, error: "Carpeta no válida. Opciones: legal, tributario, rrhh, operaciones." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `Tipo de archivo no permitido: ${file.type}. Solo se aceptan PDF, PNG y JPEG.` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: `El archivo excede el límite de ${MAX_FILE_SIZE_MB} MB.` },
        { status: 413 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { companyId } = await getDemoIdentity();
    const { path } = await uploadCompanyDocument(buffer, {
      companyId,
      folder: folderParsed.data,
      fileName: file.name,
      mimeType: file.type,
    });

    const document = await createDocument({
      company_id: companyId,
      name: file.name,
      folder: folderParsed.data,
      file_type: file.name.split(".").pop()?.toUpperCase() ?? "UNKNOWN",
      mime_type: file.type,
      file_size: file.size,
      storage_bucket: "company-documents",
      storage_path: path,
      status: "uploaded",
      source: "manual_upload",
    });

    return NextResponse.json({ success: true, data: document }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("Bucket company-documents no existe") ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
