import Link from "next/link";

import { AsistentePresupuesto } from "@/components/asistente-presupuesto";
import { CATALOGO } from "@/lib/catalogo";

export default function Page() {
  return (
    <main className="min-h-svh text-q-ink">
      <AsistentePresupuesto catalogo={[...CATALOGO]} />
      <footer className="mx-auto max-w-3xl px-4 pb-12 sm:px-5">
        <p className="w-fit bg-q-ground px-3 py-2 text-sm text-q-muted">
          ¿Prefieres elegir tú las opciones?{" "}
          <Link href="/calculadora" className="font-medium text-q-ink underline decoration-q-pink underline-offset-4">
            Usa la calculadora
          </Link>
        </p>
      </footer>
    </main>
  );
}
