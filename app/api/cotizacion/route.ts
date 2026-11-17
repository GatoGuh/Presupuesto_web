import { cotizar, validarSeleccion } from "@/lib/cotizacion";

/** Calcula los importes de una selección de servicios con las tarifas del servidor. */
export async function POST(request: Request) {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: "El cuerpo debe ser JSON válido." }, { status: 400 });
    }
    const servicios = typeof body === "object" && body !== null ? (body as Record<string, unknown>).servicios : undefined;
    const resultado = validarSeleccion(servicios);
    if (!resultado.ok) {
        return Response.json({ error: resultado.error }, { status: 400 });
    }
    return Response.json(cotizar(resultado.datos));
}
