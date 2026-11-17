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


export const LIMITES = {
    cliente: 120,
    descripcion: 2000,
    resumen: 1500,
    justificacion: 400,
    aclaracion: 300,
    aclaraciones: 15,
} as const;

/** Valida la solicitud que se envía a la IA: nombre del cliente y descripción. */
export function validarSolicitudIA(body: unknown):
    | { ok: true; datos: { cliente: string; descripcion: string } }
    | { ok: false; error: string } {
        if (typeof body !== "object" || body === null) {
            return { ok: false, error: "El cuerpo de la solicitud debe ser un objeto." };
        }
        const data = body as Record<string, unknown>;
        if (typeof data.cliente !== "string" || data.cliente.trim() === "") {
            return { ok: false, error: "Indica el nombre del cliente o empresa." };
        }
        if (typeof data.descripcion !== "string" || data.descripcion.trim() === "") {
            return { ok: false, error: "La descripción del proyecto no puede estar vacía." };
        }
        const cliente = data.cliente.trim();
        const descripcion = data.descripcion.trim();
        if (cliente.length > LIMITES.cliente) {
            return { ok: false, error: `El nombre no puede superar los ${LIMITES.cliente} caracteres.` };
        }
        if (descripcion.length > LIMITES.descripcion) {
            return { ok: false, error: `La descripción no puede superar los ${LIMITES.descripcion} caracteres.` };
        }
        return { ok: true, datos: { cliente, descripcion } };
    }
