import { cotizar, validarSeleccion, type Cotizacion } from "@/lib/cotizacion";
import { LIMITES } from "@/lib/validaciones";

export type DatosDocumento = {
  cliente: string;
  fecha: string;
  resumen: string;
  cotizacion: Cotizacion;
  /** Justificación de cada servicio confirmado, por id. */
  justificaciones: Record<string, string>;
  aclaraciones: string[];
};

/**
 * Valida el contenido del documento que envía el navegador y recalcula los
 * importes en el servidor. Los textos se recortan a su longitud máxima.
 */
export function prepararDocumento(
  body: unknown,
): { ok: true; datos: DatosDocumento } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "El cuerpo de la solicitud debe ser un objeto." };
  }
  const d = body as Record<string, unknown>;

  if (typeof d.cliente !== "string" || !d.cliente.trim()) {
    return { ok: false, error: "Falta el nombre del cliente o empresa." };
  }
  if (d.cliente.trim().length > LIMITES.cliente) {
    return { ok: false, error: `El nombre no puede superar los ${LIMITES.cliente} caracteres.` };
  }
  if (typeof d.resumen !== "string" || !d.resumen.trim()) {
    return { ok: false, error: "Falta el resumen del proyecto." };
  }
  if (d.resumen.trim().length > LIMITES.resumen) {
    return { ok: false, error: `El resumen no puede superar los ${LIMITES.resumen} caracteres.` };
  }

  const seleccion = validarSeleccion(d.servicios);
  if (!seleccion.ok) return seleccion;

  const justificaciones: Record<string, string> = {};
  for (const item of d.servicios as Record<string, unknown>[]) {
    if (typeof item.justificacion === "string" && item.justificacion.trim()) {
      justificaciones[String(item.id)] = item.justificacion.trim().slice(0, LIMITES.justificacion);
    }
  }

  const aclaracionesBrutas = d.aclaraciones ?? [];
  if (!Array.isArray(aclaracionesBrutas)) {
    return { ok: false, error: "aclaraciones debe ser una lista." };
  }
  const aclaraciones = aclaracionesBrutas
    .filter((a): a is string => typeof a === "string")
    .map((a) => a.trim().slice(0, LIMITES.aclaracion))
    .filter(Boolean)
    .slice(0, LIMITES.aclaraciones);

  return {
    ok: true,
    datos: {
      cliente: d.cliente.trim(),
      fecha: fechaHoy(),
      resumen: d.resumen.trim(),
      cotizacion: cotizar(seleccion.datos),
      justificaciones,
      aclaraciones,
    },
  };
}

export function fechaHoy() {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Madrid",
  }).format(new Date());
}
