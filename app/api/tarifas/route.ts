import { TARIFAS } from "@/lib/tarifas";
export async function GET() {
  return Response.json(TARIFAS);
}