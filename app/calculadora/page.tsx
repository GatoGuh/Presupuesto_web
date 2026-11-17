import Link from "next/link";

import { FormularioPresupuesto } from "@/components/formulario-presupuestos";

export const metadata = { title: "Calculadora · Presupuesta mi web" };

export default function Page() {
  return (
    <main className="min-h-svh bg-q-ground text-q-ink">
      <nav className="mx-auto max-w-5xl px-5 pt-6 text-sm">
        <Link href="/" className="text-q-muted underline hover:text-q-ink">
          ← Presupuesto con asistente
        </Link>
      </nav>
      <FormularioPresupuesto />
    </main>
  );
}
