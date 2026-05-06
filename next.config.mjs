/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/asesor-inicial', destination: '/app/asesor-inicial', permanent: true },
      { source: '/hoja-de-ruta', destination: '/app/hoja-de-ruta', permanent: true },
      { source: '/empresa', destination: '/app/empresa', permanent: true },
      { source: '/documentos', destination: '/app/documentos', permanent: true },
      { source: '/libro-de-caja', destination: '/app/libro-de-caja', permanent: true },
      { source: '/acciones-ia', destination: '/app/acciones-ia', permanent: true },
      { source: '/cumplimiento', destination: '/app/cumplimiento', permanent: true },
    ];
  },
};

export default nextConfig;
