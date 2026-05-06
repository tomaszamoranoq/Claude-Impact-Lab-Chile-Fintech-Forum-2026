# Copiloto Pyme Chile — Design System

> Escritorio tributario cálido: una aplicación operativa donde la formalización de una microempresa se siente clara, guiada y verificable, no burocrática ni fría.

## Principio Visual

Copiloto Pyme Chile debe sentirse como una herramienta de trabajo seria para emprendedores chilenos: clara, sobria, cálida y confiable. La referencia visual base viene de una estética editorial tipo Slite, pero adaptada a un producto SaaS operativo con información densa, acciones confirmables, tablas, documentos y obligaciones.

La raíz `/` es una landing pública sobria que presenta el producto. La aplicación operativa vive bajo `/app/*`.

## Personalidad

- **Clara:** cada pantalla debe decir qué está pasando, qué falta y cuál es el próximo paso.
- **Confiable:** estados, fuentes, supuestos y acciones propuestas deben verse auditables.
- **Cercana:** usar lenguaje simple, no tono legalista ni bancario.
- **Operativa:** priorizar lectura rápida, tablas claras, navegación estable y acciones concretas.
- **Chilena sin folclor:** referencias institucionales y tributarias reales/simuladas, sin decoración temática.

## Tokens — Color

La app usa una base cálida, no blanco clínico ni gris frío. Los colores fuertes se reservan para acciones, estados y enlaces.

| Name | Value | Token | Role |
|---|---:|---|---|
| Parchment | `#f9efe4` | `--color-parchment` | Fondo principal de la app. |
| Vellum | `#fdf9f4` | `--color-vellum` | Superficie secundaria, paneles interiores y bandas suaves. |
| Chalk | `#fdfdfd` | `--color-chalk` | Cards, tablas, chat y superficies elevadas. |
| Ink | `#3f434a` | `--color-ink` | Texto principal. |
| Graphite | `#2d2f34` | `--color-graphite` | Botones primarios, texto fuerte, iconos activos. |
| Slate | `#656565` | `--color-slate` | Texto secundario. |
| Ash | `#9da3af` | `--color-ash` | Metadatos, placeholders, texto terciario. |
| Silver Mist | `#d9dde6` | `--color-silver-mist` | Bordes, divisores, líneas de tablas. |
| Linen | `#f0e4d6` | `--color-linen` | Inputs suaves, banners informativos, hover cálido. |
| Blueprint | `#2e77e5` | `--color-blueprint` | Enlaces, foco, navegación activa, acciones secundarias importantes. |
| Sage | `#547358` | `--color-sage` | Cumplido, confirmado, saludable. |
| Buttercup | `#fbf4d8` | `--color-buttercup` | Preparado, pendiente suave, advertencia no crítica. |
| Ochre | `#7f6c1f` | `--color-ochre` | Texto de estado preparado/advertencia suave. |
| Blossom | `#fae9f4` | `--color-blossom` | Acción IA propuesta, dato inferido o revisión humana. |
| Mauve | `#9d4d77` | `--color-mauve` | Texto para estados inferidos/propuestos. |
| Terracotta | `#f67748` | `--color-terracotta` | Riesgo, rechazo, atraso o bloqueo. Usar con moderación. |
| Dusk Blue | `#446aa7` | `--color-dusk-blue` | Fuentes, referencias institucionales, links de bajo énfasis. |

### Semántica De Estados

| Estado | Background | Text |
|---|---:|---:|
| Confirmado / cumplido | `#eef7ef` | `#547358` |
| En progreso | `#edf4ff` | `#2e77e5` |
| Pendiente | `#fbf4d8` | `#7f6c1f` |
| Propuesto por IA / inferido | `#fae9f4` | `#9d4d77` |
| Bloqueado / rechazado / riesgo | `#fff0ea` | `#c5522e` |
| No aplica | `#f4f3f1` | `#9da3af` |

## Tokens — Tipografía

Usar fuentes del sistema por ahora. No bloquear implementación por fuentes privadas.

| Role | Font | Size | Line Height | Weight |
|---|---|---:|---:|---:|
| Page title | `ui-sans-serif` | 28px | 36px | 700 |
| Section title | `ui-sans-serif` | 20px | 28px | 650 |
| Card title | `ui-sans-serif` | 15px | 22px | 650 |
| Body | `ui-sans-serif` | 14px | 22px | 400 |
| Small body | `ui-sans-serif` | 13px | 20px | 400 |
| Caption | `ui-sans-serif` | 11px | 16px | 600 |
| Monospace/data | `ui-monospace` | 12px | 18px | 400 |

Reglas:

- No escalar texto con viewport width.
- Letter spacing normal para texto común.
- Usar uppercase solo en etiquetas cortas y metadatos.
- Evitar titulares gigantes dentro de la app; esto no es marketing.

## Layout General

La app tiene navegación persistente y una estructura de trabajo de tres zonas.

```text
Sidebar izquierda
  Navegación principal y contexto de empresa

Panel principal
  Módulo activo: chat, tabla, hoja de ruta, documentos, etc.

Panel contextual opcional
  Hoja de ruta, detalle de acción, explicación, fuentes o próximos pasos
```

### Dimensiones

- Sidebar desktop: `260px`.
- Panel contextual desktop: `320px` a `380px`.
- Contenido principal: flexible, con max-width interno según módulo.
- Padding de página: `24px` desktop, `16px` tablet/móvil.
- Gap base: `8px`; gaps habituales: `12px`, `16px`, `24px`.
- Radio de cards: `12px`.
- Radio de botones: `999px` para acciones principales, `10px` a `12px` para controles compactos.

### Responsive

- Desktop: sidebar + contenido + panel contextual cuando corresponda.
- Tablet: sidebar compacta o superior, panel contextual bajo el contenido.
- Móvil: navegación colapsada, una columna, tablas con scroll horizontal o cards resumidas.

## Componentes

### Sidebar

Rol: navegación estable y confianza contextual.

- Fondo `Chalk` o `Vellum`.
- Borde derecho `Silver Mist`.
- Logo/nombre arriba.
- Módulos:
  - Asesor Inicial
  - Hoja de Ruta
  - Empresa
  - Documentos
  - Libro de Caja
  - Cumplimiento
  - Acciones IA
- Item activo con fondo `Linen` o tinte `Blueprint` muy suave.
- Contexto inferior: razón social, RUT, régimen y etapa.

### App Header / Page Header

Cada pantalla debe iniciar con:

- Título breve.
- Subtítulo operativo.
- Acciones primarias si existen.
- Metadato de simulación/fuente cuando aplique.

Ejemplo:

```text
Libro de Caja
Ingresos y egresos confirmados, pendientes e inferidos para mayo 2026.
```

### Cards

Usar cards solo para unidades reales de información: KPI, tarea, documento, acción, obligación. No meter cards dentro de cards salvo que sea un detalle pequeño dentro de una acción propuesta.

Estilo:

- Background `Chalk`.
- Border `1px solid Silver Mist`.
- Radius `12px`.
- Shadow muy suave:
  `rgba(0,0,0,0.01) 0 4px 12px, rgba(0,0,0,0.05) 0 2px 6px, rgba(0,0,0,0.08) 0 1px 3px`.
- Padding: `16px` a `24px`.

### Botones

#### Primario

Uso: confirmar acción, iniciar diagnóstico, guardar decisión.

- Background `Graphite`.
- Text `Chalk`.
- Radius `999px`.
- Padding `8px 16px`.
- Font 14px, weight 600.

#### Secundario

Uso: rechazar, editar, ver detalle, abrir fuente.

- Background `transparent` o `Chalk`.
- Border `Silver Mist` o `Graphite`.
- Text `Ink`.
- Radius `999px`.

#### Peligro

Uso: rechazar, eliminar, marcar problema.

- Background suave `#fff0ea`.
- Text `Terracotta`.
- Border `#ffd4c4`.

### Badges

Badges deben ser pequeños, consistentes y semánticos.

- Radius `999px`.
- Padding `3px 8px`.
- Font 11px, weight 600.
- No usar colores aleatorios.
- No usar badges para reemplazar texto explicativo cuando el estado necesita contexto.

### Chat

Pantalla principal del producto.

#### Mensaje Del Usuario

- Alineado a la derecha.
- Background `Graphite` o `Blueprint`.
- Texto `Chalk`.
- Radius `14px`, con esquina inferior derecha levemente reducida.

#### Mensaje Del Asesor

- Alineado a la izquierda.
- Background `Chalk`.
- Border `Silver Mist`.
- Texto `Ink`.
- Radius `14px`, con esquina inferior izquierda levemente reducida.

#### Acción Propuesta Por IA

Debe verse distinta de una respuesta normal. Es el patrón central del producto.

Contenido obligatorio:

- Intención.
- Confianza mock o real.
- Datos detectados.
- Campos faltantes.
- Estado: propuesta, confirmada, rechazada, ejecutada.
- Botones Confirmar / Rechazar.

Estilo:

- Fondo `Vellum`.
- Borde izquierdo o badge `Mauve`.
- No usar lenguaje absoluto: “Propuesta detectada”, no “Hecho”.

### Hoja De Ruta

Debe comunicar ciclo de vida completo.

Estructura:

- Etapas ordenadas:
  - Exploración
  - Constitución
  - Inicio Tributario
  - Operación
  - Contratación
  - Regularización
  - Cierre
- Cada tarea muestra:
  - título,
  - descripción,
  - estado,
  - fuente,
  - bloqueo si aplica.

Visual:

- Timeline vertical o lista por etapas.
- Etapa actual destacada.
- Bloqueadas/no aplicables con bajo contraste, no rojo agresivo.

### Tablas

Para Libro de Caja, Cumplimiento y Acciones IA.

Reglas:

- Header en `Vellum`.
- Bordes horizontales suaves.
- Números alineados a la derecha.
- Fechas en formato legible.
- Montos con color semántico, sin saturación excesiva.
- Scroll horizontal en pantallas pequeñas.

### Documentos

Gestor documental con cuatro carpetas:

- Legal.
- Tributario.
- RRHH.
- Operaciones.

Cada documento debe mostrar:

- nombre,
- tipo,
- fecha,
- estado,
- extracción/revisión si aplica,
- relación con acción o tarea si existe.

### Cumplimiento

Debe sentirse como brújula, no como calendario legal intimidante.

Cada obligación debe mostrar:

- obligación,
- formulario/canal si aplica,
- periodo,
- vencimiento,
- estado,
- explicación simple,
- fuente o nota “simulado para demo” si no está conectado a fuente real.

## Reglas De Producto En UI

- La IA no debe parecer que ejecuta sin permiso.
- Toda acción sensible debe tener confirmación humana.
- Toda recomendación importante debe mostrar supuestos.
- Si la información es simulada, decirlo de forma discreta.
- No usar “debes” cuando la app no tenga fuente validada; preferir “correspondería revisar”, “la app propone”, “según los datos registrados”.
- Separar “documento comercial” de “movimiento de dinero”.
- Separar “obligación pendiente” de “no aplica por ahora”.

## Do

- Usar fondo cálido `Parchment` en la app.
- Mantener tablas y paneles densos pero respirables.
- Mostrar estados con badges consistentes.
- Usar cards solo para unidades reales de información.
- Hacer que el chat y las acciones propuestas sean el centro de la experiencia.
- Usar fuentes institucionales como elementos de confianza.
- Mantener navegación lateral estable.
- Cuidar responsive antes de considerar una pantalla terminada.

## Don't

- No usar hero marketing, blobs, gradientes decorativos u orbes dentro de `/app/*`.
- La landing pública en `/` debe ser sobria; no prometer automatización tributaria/legal definitiva.
- No dominar la UI con azul intenso o morado.
- No cambiar contratos de datos por razones visuales.
- No meter lógica de backend dentro de componentes visuales.
- No crear cards anidadas sin necesidad.
- No usar textos legales largos sin jerarquía.
- No presentar datos mock como información normativa vigente.

## Tailwind v3 — Implementación Actual

El proyecto usa Tailwind CSS 3.4. Definir tokens en `tailwind.config.ts` y variables globales en `app/globals.css`.

### CSS Variables Recomendadas

```css
:root {
  --color-parchment: #f9efe4;
  --color-vellum: #fdf9f4;
  --color-chalk: #fdfdfd;
  --color-ink: #3f434a;
  --color-graphite: #2d2f34;
  --color-slate: #656565;
  --color-ash: #9da3af;
  --color-silver-mist: #d9dde6;
  --color-linen: #f0e4d6;
  --color-blueprint: #2e77e5;
  --color-sage: #547358;
  --color-buttercup: #fbf4d8;
  --color-ochre: #7f6c1f;
  --color-blossom: #fae9f4;
  --color-mauve: #9d4d77;
  --color-terracotta: #f67748;
  --color-dusk-blue: #446aa7;
}
```

### Tailwind Theme Recomendado

```ts
theme: {
  extend: {
    colors: {
      parchment: "#f9efe4",
      vellum: "#fdf9f4",
      chalk: "#fdfdfd",
      ink: "#3f434a",
      graphite: "#2d2f34",
      slate: "#656565",
      ash: "#9da3af",
      "silver-mist": "#d9dde6",
      linen: "#f0e4d6",
      blueprint: "#2e77e5",
      sage: "#547358",
      buttercup: "#fbf4d8",
      ochre: "#7f6c1f",
      blossom: "#fae9f4",
      mauve: "#9d4d77",
      terracotta: "#f67748",
      "dusk-blue": "#446aa7",
    },
    boxShadow: {
      soft: "rgba(0,0,0,0.01) 0 4px 12px, rgba(0,0,0,0.05) 0 2px 6px, rgba(0,0,0,0.08) 0 1px 3px",
    },
  },
}
```

## Pantallas Objetivo

### Asesor Inicial

Layout:

- Sidebar.
- Chat central.
- Panel derecho con hoja de ruta resumida o detalle de acción.

Prioridad visual:

1. Conversación.
2. Acción propuesta.
3. Próximos pasos.
4. Fuentes/supuestos.

### Hoja De Ruta

Layout:

- Header con progreso general.
- Timeline por etapas.
- Panel o sección de “etapa actual”.

### Empresa

Layout:

- Datos legales.
- Estado actual.
- Próxima obligación.
- Saldo de caja.
- Tareas completadas.

### Documentos

Layout:

- Carpetas arriba o lateral.
- Lista documental.
- Estado de extracción/revisión.

### Libro De Caja

Layout:

- KPIs arriba.
- Tabla.
- Acción reciente confirmada si viene del chat.
- Nota de simulación mientras no haya datos reales.

### Cumplimiento

Layout:

- KPIs de estados.
- Tabla/lista de obligaciones.
- Explicación simple.
- Fuentes o nota de simulación.

### Acciones IA

Layout:

- Tabla de auditoría.
- Filtros por estado e intención.
- Detalle de payload propuesto.
- Estado: propuesta, confirmada, rechazada, ejecutada, fallida.

## Prompt Para Stitch

Usar este prompt cuando quieras generar variantes visuales:

```md
Diseña una aplicación web SaaS operativa llamada Copiloto Pyme Chile.

Es una herramienta para microempresas chilenas que combina chat con IA, hoja de ruta legal/tributaria, documentos, libro de caja y cumplimiento.

La interfaz debe sentirse cálida, clara, confiable y profesional. Inspiración visual: escritorio editorial cálido tipo Slite, pero adaptado a back office operativo. No debe parecer landing page ni marketing.

Pantalla principal:
- Sidebar izquierda con módulos: Asesor Inicial, Hoja de Ruta, Empresa, Documentos, Libro de Caja, Cumplimiento, Acciones IA.
- Panel central con chat del Asesor Inicial.
- Panel derecho con hoja de ruta del ciclo de vida.
- Una tarjeta destacada de “Acción propuesta por IA” con intención, confianza, datos detectados, campos faltantes y botones Confirmar/Rechazar.
- Estilo claro, cálido, sobrio, con fondo crema, cards blancas, bordes suaves, tipografía legible y estados con badges.

Evitar:
- landing page,
- hero marketing,
- gradientes decorativos,
- colores saturados,
- UI infantil,
- estética gubernamental antigua,
- formularios largos sin jerarquía.
```

## Criterios De Aceptación Visual

- La app se entiende como producto operativo en el primer viewport.
- El chat se siente central, no decorativo.
- La acción propuesta por IA se distingue claramente.
- La hoja de ruta explica avance sin abrumar.
- Tablas y documentos son legibles.
- Estados son consistentes en todas las pantallas.
- La app se ve profesional en desktop y usable en móvil.
- No se rompieron contratos de datos, endpoints ni lógica de confirmación.

