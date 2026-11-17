import { ErrorIA, proponerServicios } from "@/lib/ia";
import { validarSolicitudIA } from "@/lib/validaciones";

export const maxDuration = 60;

/** Recibe la descripción del cliente y devuelve una propuesta de servicios del catálogo. */
export async function POST(request: Request) {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: "El cuerpo debe ser JSON válido." }, { status: 400 });
    }
    const resultado = validarSolicitudIA(body);
    if (!resultado.ok) {
        return Response.json({ error: resultado.error }, { status: 400 });
    }
    try {
        const propuesta = await proponerServicios(resultado.datos.cliente, resultado.datos.descripcion);
        return Response.json(propuesta);
    } catch (e) {
        if (e instanceof ErrorIA) {
            return Response.json({ error: e.message, reintentable: true }, { status: e.status });
        }
        console.error("[propuesta] Error inesperado:", e);
        return Response.json({ error: "Error inesperado. Vuelve a intentarlo.", reintentable: true }, { status: 500 });
    }
}
