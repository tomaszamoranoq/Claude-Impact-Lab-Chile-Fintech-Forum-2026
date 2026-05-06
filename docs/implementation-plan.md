# Plan de Implementacion

## Fase 0: Base del Producto

Objetivo: dejar definida la aplicacion antes de programar pantallas.

Entregables:

- Vision de producto.
- Alcance MVP.
- Arquitectura.
- Modelo de datos.
- Flujo de demo.

Estado: iniciado.

## Fase 1: Prototipo Web Navegable

Objetivo: construir la primera version visual en web.

Pantallas:

- Chat/Asesor Inicial.
- Hoja de Ruta.
- Panel Empresa.
- Documentos.
- Libro de Caja.
- Cumplimiento.

Criterio de exito:

- Se puede recorrer la demo completa sin backend real.
- El usuario entiende el ciclo de vida.
- Las acciones simuladas actualizan el estado de la interfaz.

## Fase 2: Backend Local

Objetivo: persistir datos reales y definir contratos.

Trabajo:

- Crear schema de base de datos.
- Crear endpoints de empresas, roadmap, documentos y transacciones.
- Registrar acciones de agente.
- Validar payloads con Zod.

Criterio de exito:

- El chat crea acciones pendientes.
- El usuario confirma.
- La base se actualiza.

## Fase 3: IA Controlada

Objetivo: conectar modelo de lenguaje sin perder control.

Trabajo:

- Router de intencion.
- Schemas de salida por accion.
- Agente asesor inicial.
- Generador de roadmap.
- Respuestas con supuestos y fuentes.

Criterio de exito:

- La IA puede diagnosticar un negocio.
- Puede proponer figura legal y hoja de ruta.
- No ejecuta acciones sin confirmacion.

## Fase 4: Documentos y XML

Objetivo: procesar informacion real.

Trabajo:

- Subida de documentos.
- Clasificacion automatica.
- Lectura basica de XML tributario.
- Asociacion con libro de caja/facturas.

Criterio de exito:

- Un XML o documento de ejemplo alimenta el back office.

## Fase 5: Demo Competencia

Objetivo: preparar una historia completa.

Guion:

1. Usuario quiere iniciar negocio.
2. Asesor pregunta y recomienda.
3. Se genera hoja de ruta.
4. Usuario avanza a constitucion.
5. Sube documento.
6. Registra egreso.
7. Ve cumplimiento mensual.
8. Consulta que pasa si contrata o cierra.

Resultado:

- Demo clara, trazable y visualmente convincente.

