"use client";

import { useState } from "react";

type Presupuesto = {
  base: number;
  paginasAdicionales: number;
  formulario: number;
  segundoIdioma: number;
  total: number;
  moneda: string;
};

const euros = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const focus =
  "outline-none focus-visible:ring-2 focus-visible:ring-q-accent focus-visible:ring-offset-2 focus-visible:ring-offset-q-ground";

export function FormularioPresupuesto() {
  const [tipo, setTipo] = useState("landing");
  const [paginas, setPaginas] = useState(1);
  const [formulario, setFormulario] = useState(false);
  const [segundoIdioma, setSegundoIdioma] = useState(false);

  const [resultado, setResultado] = useState<Presupuesto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCargando(true);
    try {
      const respuesta = await fetch("/api/presupuesto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, paginas, formulario, segundoIdioma }),
      });
      const datos = await respuesta.json();
      if (respuesta.ok) {
        setResultado(datos);
        setError(null);
      } else {
        setResultado(null);
        setError(datos.error);
      }
    } catch {
      setResultado(null);
      setError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-10 px-5 py-12 sm:py-16 lg:grid-cols-[1fr_24rem] lg:gap-16 lg:py-24">
      <div>
        <h1 className="max-w-md text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          ¿Cuánto cuesta tu web?
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-q-muted">
          Elige lo que necesitas y calcula tu presupuesto al momento. El precio
          lo calcula nuestro servidor con tarifas fijas, sin sorpresas.
        </p>

        <form onSubmit={enviar} className="mt-10 flex max-w-md flex-col gap-8">
          <fieldset>
            <legend className="mb-3 text-sm font-medium">Tipo de web</legend>
            <div className="grid grid-cols-2 gap-1 rounded-xl border border-q-line bg-q-surface p-1">
              {[
                { valor: "landing", texto: "Landing" },
                { valor: "corporativa", texto: "Corporativa" },
              ].map((opcion) => (
                <button
                  key={opcion.valor}
                  type="button"
                  aria-pressed={tipo === opcion.valor}
                  onClick={() => setTipo(opcion.valor)}
                  className={`h-10 rounded-lg text-sm font-medium transition-colors ${focus} ${
                    tipo === opcion.valor
                      ? "bg-q-ink text-q-ground"
                      : "text-q-muted hover:text-q-ink"
                  }`}
                >
                  {opcion.texto}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-q-muted">
              {tipo === "landing"
                ? "Una página pensada para presentar un producto o captar contactos."
                : "Una web con varias secciones para presentar tu empresa."}
            </p>
          </fieldset>

          <div>
            <label htmlFor="paginas" className="mb-3 block text-sm font-medium">
              Número de páginas
            </label>
            <div className="flex w-fit items-center rounded-xl border border-q-line bg-q-surface">
              <button
                type="button"
                aria-label="Quitar una página"
                onClick={() => setPaginas((p) => Math.max(1, p - 1))}
                className={`size-11 rounded-l-xl text-xl text-q-muted hover:text-q-ink ${focus}`}
              >
                −
              </button>
              <input
                id="paginas"
                type="number"
                min={1}
                max={20}
                value={paginas}
                onChange={(e) => setPaginas(Number(e.target.value))}
                className={`h-11 w-16 [appearance:textfield] bg-transparent text-center text-base font-medium tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${focus}`}
              />
              <button
                type="button"
                aria-label="Añadir una página"
                onClick={() => setPaginas((p) => Math.min(20, p + 1))}
                className={`size-11 rounded-r-xl text-xl text-q-muted hover:text-q-ink ${focus}`}
              >
                +
              </button>
            </div>
            <p className="mt-2 text-sm text-q-muted">
              La primera página está incluida. Entre 1 y 20.
            </p>
          </div>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-sm font-medium">Extras</legend>
            {[
              {
                texto: "Formulario de contacto",
                detalle: "Tus clientes te escriben desde la web.",
                marcado: formulario,
                cambiar: setFormulario,
              },
              {
                texto: "Segundo idioma",
                detalle: "Todo el contenido en dos idiomas.",
                marcado: segundoIdioma,
                cambiar: setSegundoIdioma,
              },
            ].map((extra) => (
              <label
                key={extra.texto}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-q-line bg-q-surface p-4 transition-colors has-[:checked]:border-q-accent has-[:checked]:bg-q-accent/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-q-accent"
              >
                <input
                  type="checkbox"
                  checked={extra.marcado}
                  onChange={(e) => extra.cambiar(e.target.checked)}
                  className="mt-0.5 size-5 accent-q-accent outline-none"
                />
                <span>
                  <span className="block text-sm font-medium">{extra.texto}</span>
                  <span className="block text-sm text-q-muted">
                    {extra.detalle}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          <div>
            <button
              type="submit"
              disabled={cargando}
              className={`h-12 w-full rounded-xl bg-q-accent text-base font-medium text-white transition-colors hover:bg-q-accent-hover disabled:opacity-60 ${focus}`}
            >
              {cargando ? "Calculando…" : "Calcular presupuesto"}
            </button>
            {error && (
              <p role="alert" className="mt-3 text-sm font-medium text-q-error">
                {error}
              </p>
            )}
          </div>
        </form>
      </div>

      <aside aria-live="polite" className="lg:pt-2">
        <div className="sticky top-8 overflow-hidden rounded-2xl border border-q-line bg-q-surface">
          <div className="h-1.5 bg-q-accent" />
          <div className="p-6">
            <h2 className="text-lg font-semibold tracking-tight">Tu presupuesto</h2>

            {resultado ? (
              <>
                <dl className="mt-6 flex flex-col gap-4 text-sm">
                  <Linea concepto="Base" importe={resultado.base} />
                  <Linea
                    concepto="Páginas adicionales"
                    importe={resultado.paginasAdicionales}
                  />
                  <Linea
                    concepto="Formulario de contacto"
                    importe={resultado.formulario}
                  />
                  <Linea
                    concepto="Segundo idioma"
                    importe={resultado.segundoIdioma}
                  />
                </dl>
                <div className="mt-6 flex items-baseline justify-between border-t border-q-ink pt-5">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-4xl font-semibold tracking-tight tabular-nums">
                    {euros.format(resultado.total)}
                  </span>
                </div>
                <p className="mt-3 text-xs text-q-muted">
                  Importe en euros, sin impuestos ni descuentos.
                </p>
              </>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-q-muted">
                Elige las opciones de tu web y pulsa «Calcular presupuesto». Aquí
                verás el desglose, concepto por concepto.
              </p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

function Linea({ concepto, importe }: { concepto: string; importe: number }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className={importe === 0 ? "text-q-muted" : ""}>{concepto}</dt>
      <span
        aria-hidden="true"
        className="flex-1 translate-y-[-3px] border-b border-dotted border-q-dot"
      />
      <dd
        className={`font-medium tabular-nums ${importe === 0 ? "text-q-muted" : ""}`}
      >
        {importe === 0 ? "No incluido" : euros.format(importe)}
      </dd>
    </div>
  );
}
