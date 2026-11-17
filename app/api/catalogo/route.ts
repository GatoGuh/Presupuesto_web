import { CATALOGO } from "@/lib/catalogo";

export async function GET() {
    return Response.json(CATALOGO);
}
