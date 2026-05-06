"use client";

import { useState } from "react";
import { mockFolders } from "@/lib/mock-data";

const statusBadge = (status: string) => {
  switch (status) {
    case "extracted":
      return "bg-blue-100 text-blue-700";
    case "reviewed":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case "extracted":
      return "Datos extraídos";
    case "reviewed":
      return "Revisado";
    default:
      return "Subido";
  }
};

export default function DocumentosPage() {
  const [selectedFolder, setSelectedFolder] = useState(mockFolders[0].id);
  const folder = mockFolders.find((f) => f.id === selectedFolder);

  const totalDocs = mockFolders.reduce((sum, f) => sum + f.documents.length, 0);

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
        <p className="mt-1 text-gray-600">
          Gestor documental de la empresa. Total: {totalDocs} documentos.
        </p>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {mockFolders.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFolder(f.id)}
              className={`text-left p-4 rounded-lg border transition-colors ${
                selectedFolder === f.id
                  ? "bg-blue-50 border-blue-300"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div className="text-sm font-medium text-gray-900">{f.name}</div>
              <div className="text-2xl font-bold text-gray-700 mt-1">{f.documents.length}</div>
              <div className="text-xs text-gray-500">documentos</div>
            </button>
          ))}
        </div>

        {folder && (
          <div className="mt-8 bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">
                {folder.name} — {folder.documents.length} documentos
              </h2>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {folder.documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{doc.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{doc.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{doc.uploaded_at}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge(
                          doc.status
                        )}`}
                      >
                        {statusLabel(doc.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
