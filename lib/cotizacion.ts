import { buscarServicio, IDS_SERVICIO, type IdServicio } from "@/lib/catalogo";

export type ServicioSeleccionado = { id: IdServicio; cantidad: number | null };

export type LineaPresupuesto = {
  id: IdServicio;
  nombre: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  importe: number;
};

export type Cotizacion = {
  lineas: LineaPresupuesto[];
  total: number;
  moneda: "EUR";
};

const MAX_SERVICIOS = 10;

type Resultado<T> = { ok: true; datos: T } | { ok: false; error: string };

/**
 * Valida una selección de servicios enviada por el navegador.
 * Solo se aceptan { id, cantidad }: cualquier precio o importe que venga
 * del cliente se ignora.
 */
export function validarSeleccion(entrada: unknown): Resultado<ServicioSeleccionado[]> {
  if (!Array.isArray(entrada)) {
    return { ok: false, error: "servicios debe ser una lista." };
  }
  if (entrada.length === 0) {
    return { ok: false, error: "Selecciona al menos un servicio." };
  }
  if (entrada.length > MAX_SERVICIOS) {
    return { ok: false, error: "Hay demasiados servicios en la selección." };
  }

  const vistos = new Set<string>();
  const seleccion: ServicioSeleccionado[] = [];

  for (const item of entrada) {
    if (typeof item !== "object" || item === null) {
      return { ok: false, error: "Cada servicio debe ser un objeto." };
    }
    const { id, cantidad } = item as Record<string, unknown>;
    const servicio = buscarServicio(id);
    if (!servicio) {
      return { ok: false, error: `El servicio «${String(id)}» no existe en el catálogo.` };
    }
    if (vistos.has(servicio.id)) {
      return { ok: false, error: `El servicio «${servicio.nombre}» está repetido.` };
    }
    vistos.add(servicio.id);

    if (servicio.requiereCantidad) {
      const min = servicio.cantidadMin ?? 1;
      const max = servicio.cantidadMax ?? 99;
      if (cantidad === null || cantidad === undefined || cantidad === "") {
        return {
          ok: false,
          error: `Indica la cantidad para «${servicio.nombre}».`,
        };
      }
      if (!Number.isInteger(cantidad) || (cantidad as number) < min || (cantidad as number) > max) {
        return {
          ok: false,
          error: `La cantidad de «${servicio.nombre}» debe ser un entero entre ${min} y ${max}.`,
        };
      }
      seleccion.push({ id: servicio.id, cantidad: cantidad as number });
    } else {
      seleccion.push({ id: servicio.id, cantidad: null });
    }
  }

  const bases = seleccion.filter((s) => buscarServicio(s.id)!.esBase);
  if (bases.length === 0) {
    return {
      ok: false,
      error: "Elige un tipo de web base: «Web landing» o «Web corporativa».",
    };
  }
  if (bases.length > 1) {
    return {
      ok: false,
      error: "Solo puede haber un tipo de web base: elige landing o corporativa.",
    };
  }

  return { ok: true, datos: seleccion };
}

/** Calcula los importes con las tarifas del servidor. */
export function cotizar(seleccion: ServicioSeleccionado[]): Cotizacion {
  const lineas = seleccion.map((s) => {
    const servicio = buscarServicio(s.id)!;
    const cantidad = servicio.requiereCantidad ? (s.cantidad ?? 0) : 1;
    return {
      id: servicio.id,
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      cantidad,
      precioUnitario: servicio.precioUnitario,
      importe: cantidad * servicio.precioUnitario,
    };
  });
  // Orden estable: el del catálogo (la web base primero).
  lineas.sort(
    (a, b) => ordenCatalogo(a.id) - ordenCatalogo(b.id),
  );
  const total = lineas.reduce((suma, l) => suma + l.importe, 0);
  return { lineas, total, moneda: "EUR" };
}

function ordenCatalogo(id: IdServicio) {
  return IDS_SERVICIO.indexOf(id);
}
