import type { DatosPresupuesto } from "@/lib/presupuesto";

export function validarSolicitud(body: unknown):
    | { ok: true; datos: DatosPresupuesto }
    | { ok: false; error: string } {
        if (typeof body !== "object" || body === null) {
            return { ok: false, error: "El cuerpo de la solicitud debe ser un objeto." };
        }
        const data = body as Record<string, unknown>;
        if (!("tipo" in data)) {
            return { ok: false, error: "Falta el campo obligatorio: tipo." };
        }
        if (!("paginas" in data)) {
            return { ok: false, error: "Falta el campo obligatorio: paginas." };
        }
        if (!("formulario" in data)) {
            return { ok: false, error: "Falta el campo obligatorio: formulario." };
        }
        if (!("segundoIdioma" in data)) {
            return { ok: false, error: "Falta el campo obligatorio: segundoIdioma." };
        }
        if (data.tipo !== "landing" && data.tipo !== "corporativa") {
            return { ok: false, error: "tipo debe ser 'landing' o 'corporativa'." };
        }
        if (!Number.isInteger(data.paginas) || (data.paginas as number) < 1 || (data.paginas as number) > 20) {
            return { ok: false, error: "paginas debe ser un entero entre 1 y 20." };
        }
        if (typeof data.formulario !== "boolean") {
            return { ok: false, error: "formulario debe ser un booleano." };
        }
        if (typeof data.segundoIdioma !== "boolean") {
            return { ok: false, error: "segundoIdioma debe ser un booleano." };
        }

        return { ok: true,
            datos: {
                tipo: data.tipo as DatosPresupuesto["tipo"],
                paginas: data.paginas as number,
                formulario: data.formulario as boolean,
                segundoIdioma: data.segundoIdioma as boolean,

            }
        };
    }
