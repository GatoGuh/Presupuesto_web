import { prepararDocumento } from "@/lib/documento";
import { generarPdf } from "@/lib/pdf/plantilla";

/** Genera el PDF del presupuesto. Los importes se recalculan aquí, no se aceptan del navegador. */
export async function POST(request: Request) {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: "El cuerpo debe ser JSON válido." }, { status: 400 });
    }
    const resultado = prepararDocumento(body);
    if (!resultado.ok) {
        return Response.json({ error: resultado.error }, { status: 400 });
    }
    try {
        const pdf = await generarPdf(resultado.datos);
        const nombre = `presupuesto-${resultado.datos.cliente
            .normalize("NFD")
            .replace(/[^\w]+/g, "-")
            .replace(/^-|-$/g, "")
            .toLowerCase()
            .slice(0, 40) || "cliente"}.pdf`;
        return new Response(new Uint8Array(pdf), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="${nombre}"`,
                "Cache-Control": "no-store",
            },
        });
    } catch (e) {
        console.error("[pdf] Error al generar el PDF:", e);
        return Response.json({ error: "No se pudo generar el PDF. Vuelve a intentarlo." }, { status: 500 });
    }
}
