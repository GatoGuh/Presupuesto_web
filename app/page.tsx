import Link from "next/link";

import { AsistentePresupuesto } from "@/components/asistente-presupuesto";
import { CATALOGO } from "@/lib/catalogo";

export default function Page() {
  return (
    <main className="min-h-svh bg-q-ground text-q-ink">
      <AsistentePresupuesto catalogo={[...CATALOGO]} />
      <footer className="mx-auto max-w-3xl px-4 pb-10 text-sm text-q-muted sm:px-5">
        ¿Prefieres elegir tú las opciones?{" "}
        <Link href="/calculadora" className="underline hover:text-q-ink">
          Usa la calculadora
        </Link>
        .
      </footer>
    </main>
  );
}
