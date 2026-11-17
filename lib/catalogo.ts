import { TARIFAS } from "@/lib/tarifas";

/**
 * Catálogo de servicios. Es la única fuente de verdad sobre lo que ofrecemos:
 * la IA solo puede proponer estos identificadores y los precios salen siempre
 * de TARIFAS, nunca del modelo ni del navegador.
 */

export const IDS_SERVICIO = [
  "web_landing",
  "web_corporativa",
  "paginas_adicionales",
  "formulario_contacto",
  "segundo_idioma",
] as const;

export type IdServicio = (typeof IDS_SERVICIO)[number];

export type Servicio = {
  id: IdServicio;
  nombre: string;
  descripcion: string;
  /** Texto legible de la regla de precio. */
  regla: string;
  precioUnitario: number;
  /** Si es true, el importe depende de una cantidad que hay que indicar. */
  requiereCantidad: boolean;
  cantidadMin?: number;
  cantidadMax?: number;
  /** Servicios base: el presupuesto necesita exactamente uno. */
  esBase: boolean;
};

export const CATALOGO: readonly Servicio[] = [
  {
    id: "web_landing",
    nombre: "Web landing",
    descripcion:
      "Web de una sola página para presentar un producto, servicio o negocio y captar contactos. Incluye 1 página.",
    regla: "Precio fijo",
    precioUnitario: TARIFAS.base.landing,
    requiereCantidad: false,
    esBase: true,
  },
  {
    id: "web_corporativa",
    nombre: "Web corporativa",
    descripcion:
      "Web con estructura de varias secciones para presentar una empresa o negocio. Incluye 1 página; el resto se presupuesta como páginas adicionales.",
    regla: "Precio fijo",
    precioUnitario: TARIFAS.base.corporativa,
    requiereCantidad: false,
    esBase: true,
  },
  {
    id: "paginas_adicionales",
    nombre: "Páginas adicionales",
    descripcion:
      "Páginas o secciones extra además de la incluida en la web base (p. ej. carta, servicios, galería, quiénes somos).",
    regla: `${TARIFAS.pag_adicional} € por página`,
    precioUnitario: TARIFAS.pag_adicional,
    requiereCantidad: true,
    cantidadMin: 1,
    cantidadMax: 19,
    esBase: false,
  },
  {
    id: "formulario_contacto",
    nombre: "Formulario de contacto",
    descripcion:
      "Formulario para que los visitantes envíen un mensaje o solicitud que llega por correo electrónico. No incluye gestión de reservas, pagos ni panel de administración.",
    regla: "Precio fijo",
    precioUnitario: TARIFAS.form_contacto,
    requiereCantidad: false,
    esBase: false,
  },
  {
    id: "segundo_idioma",
    nombre: "Segundo idioma",
    descripcion:
      "Versión de todo el contenido de la web en un segundo idioma (traducción facilitada por el cliente).",
    regla: "Precio fijo",
    precioUnitario: TARIFAS.seg_idioma,
    requiereCantidad: false,
    esBase: false,
  },
];

export function buscarServicio(id: unknown): Servicio | undefined {
  return CATALOGO.find((s) => s.id === id);
}

export function esIdServicio(id: unknown): id is IdServicio {
  return buscarServicio(id) !== undefined;
}
