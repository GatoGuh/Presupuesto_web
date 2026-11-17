import Link from "next/link";

import { FormularioPresupuesto } from "@/components/formulario-presupuestos";

export const metadata = { title: "Calculadora · Presupuesta mi web" };

export default function Page() {
  return (
    <main className="min-h-svh px-4 py-8 text-q-ink sm:px-5 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="inline-block bg-q-ground px-3 py-2 text-sm font-medium underline decoration-q-pink underline-offset-4"
        >
          Volver al asistente
        </Link>
        <div className="registro mt-4 border border-q-ink bg-q-ground">
          <FormularioPresupuesto />
        </div>
      </div>
    </main>
  );
}
