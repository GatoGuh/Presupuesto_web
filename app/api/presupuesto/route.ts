import { validarSolicitud } from "@/lib/validaciones";
import { calcularPresupuesto } from "@/lib/presupuesto";

export async function POST(request: Request) {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: "El cuerpo debe ser JSON válido." }, { status: 400 });
    }
    const resultado = validarSolicitud(body);
    if (!resultado.ok) {
        return Response.json({ error: resultado.error }, { status: 400 });
    }
    const presupuesto = calcularPresupuesto(resultado.datos);
    return Response.json(presupuesto);
}