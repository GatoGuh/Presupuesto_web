"use client";

import { useRef, useState } from "react";

import type { IdServicio, Servicio } from "@/lib/catalogo";
import type { Cotizacion } from "@/lib/cotizacion";

type Propuesta = {
  resumen: string;
  servicios: { id: IdServicio; justificacion: string; cantidad: number | null }[];
  dudas: string[];
  fueraDeCatalogo: { necesidad: string; motivo: string }[];
  descartados: string[];
};

type Item = {
  id: IdServicio;
  justificacion: string;
  /** Como texto para poder dejar el campo vacío mientras se edita. */
  cantidad: string;
  origen: "ia" | "manual";
};

type Paso = "solicitud" | "revision" | "presupuesto";

const MAX_DESCRIPCION = 2000;
const MAX_CLIENTE = 120;

const euros = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

const focus =
  "outline-none focus-visible:ring-2 focus-visible:ring-q-accent focus-visible:ring-offset-2 focus-visible:ring-offset-q-ground";
const botonPrimario = `inline-flex h-11 items-center justify-center rounded-sm bg-q-accent px-5 text-sm font-semibold text-white transition-[background-color,box-shadow,translate] hover:bg-q-accent-hover hover:shadow-[3px_3px_0_0_var(--q-pink)] active:translate-x-px active:translate-y-px active:shadow-none disabled:pointer-events-none disabled:opacity-60 ${focus}`;
const botonSecundario = `inline-flex h-11 items-center justify-center rounded-sm border border-q-ink/80 bg-transparent px-5 text-sm font-semibold transition-colors hover:bg-q-ink hover:text-q-ground disabled:opacity-60 ${focus}`;
const campo = `w-full rounded-sm border border-q-line bg-q-ground/60 px-4 py-3 text-base placeholder:text-q-dot focus-visible:border-q-accent ${focus}`;
const tituloSeccion = "font-display text-xl font-semibold tracking-tight [font-variation-settings:'wdth'_90]";

export function AsistentePresupuesto({ catalogo }: { catalogo: Servicio[] }) {
  const porId = (id: IdServicio) => catalogo.find((s) => s.id === id)!;

  const [paso, setPaso] = useState<Paso>("solicitud");

  // Paso 1
  const [cliente, setCliente] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [analizando, setAnalizando] = useState(false);
  const [errorSolicitud, setErrorSolicitud] = useState<{ texto: string; reintentable: boolean } | null>(null);

  // Paso 2
  const [resumen, setResumen] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [aclaraciones, setAclaraciones] = useState<string[]>([]);
  const [nuevaAclaracion, setNuevaAclaracion] = useState("");
  const [descartados, setDescartados] = useState<string[]>([]);
  const [calculando, setCalculando] = useState(false);
  const [errorRevision, setErrorRevision] = useState<string | null>(null);

  // Paso 3
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);
  const [generando, setGenerando] = useState(false);
  const [errorPdf, setErrorPdf] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfNombre, setPdfNombre] = useState("presupuesto.pdf");
  const pdfUrlRef = useRef<string | null>(null);

  function cambiarPdfUrl(url: string | null) {
    if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
    pdfUrlRef.current = url;
    setPdfUrl(url);
  }

  // ---------- Paso 1: pedir propuesta a la IA ----------
  async function analizar(e?: React.FormEvent) {
    e?.preventDefault();
    setAnalizando(true);
    setErrorSolicitud(null);
    try {
      const r = await fetch("/api/propuesta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente, descripcion }),
      });
      const datos = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErrorSolicitud({
          texto: datos.error ?? "No se pudo obtener la propuesta.",
          reintentable: Boolean(datos.reintentable),
        });
        return;
      }
      const p = datos as Propuesta;
      setResumen(p.resumen);
      setItems(
        p.servicios.map((s) => ({
          id: s.id,
          justificacion: s.justificacion,
          cantidad: s.cantidad === null ? "" : String(s.cantidad),
          origen: "ia",
        })),
      );
      setAclaraciones([
        ...p.dudas,
        ...p.fueraDeCatalogo.map(
          (f) => `Pendiente de valorar (fuera de catálogo): ${f.necesidad}${f.motivo ? `. ${f.motivo}` : ""}`,
        ),
      ]);
      setDescartados(p.descartados);
      setErrorRevision(null);
      setPaso("revision");
    } catch {
      setErrorSolicitud({
        texto: "No se pudo conectar con el servidor. Comprueba tu conexión y vuelve a intentarlo.",
        reintentable: true,
      });
    } finally {
      setAnalizando(false);
    }
  }

  // ---------- Paso 2: revisar selección ----------
  const disponibles = catalogo.filter((s) => !items.some((i) => i.id === s.id));
  const bases = items.filter((i) => porId(i.id).esBase);
  const pendientes: string[] = [];
  if (items.length === 0) pendientes.push("Añade al menos un servicio.");
  if (bases.length === 0) pendientes.push("Elige un tipo de web base (landing o corporativa).");
  if (bases.length > 1) pendientes.push("Solo puede haber un tipo de web base: elimina uno.");
  for (const i of items) {
    const s = porId(i.id);
    if (!s.requiereCantidad) continue;
    const n = Number(i.cantidad);
    if (i.cantidad.trim() === "" || !Number.isInteger(n) || n < (s.cantidadMin ?? 1) || n > (s.cantidadMax ?? 99)) {
      pendientes.push(`Indica cuántas «${s.nombre}» (entre ${s.cantidadMin} y ${s.cantidadMax}).`);
    }
  }
  if (!resumen.trim()) pendientes.push("Escribe un resumen del proyecto.");

  function actualizarItem(id: IdServicio, cambios: Partial<Item>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...cambios } : i)));
  }

  function anadirServicio(id: IdServicio) {
    setItems((prev) => [...prev, { id, justificacion: "", cantidad: "", origen: "manual" }]);
  }

  function seleccionParaServidor() {
    return items.map((i) => ({
      id: i.id,
      cantidad: porId(i.id).requiereCantidad ? Number(i.cantidad) : null,
      justificacion: i.justificacion,
    }));
  }

  async function confirmarSeleccion() {
    setCalculando(true);
    setErrorRevision(null);
    try {
      const r = await fetch("/api/cotizacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ servicios: seleccionParaServidor() }),
      });
      const datos = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErrorRevision(datos.error ?? "No se pudo calcular el presupuesto.");
        return;
      }
      setCotizacion(datos as Cotizacion);
      cambiarPdfUrl(null);
      setErrorPdf(null);
      setPaso("presupuesto");
    } catch {
      setErrorRevision("No se pudo conectar con el servidor. Vuelve a intentarlo.");
    } finally {
      setCalculando(false);
    }
  }

  // ---------- Paso 3: generar PDF ----------
  async function generarPdf() {
    setGenerando(true);
    setErrorPdf(null);
    try {
      const r = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente,
          resumen,
          servicios: seleccionParaServidor(),
          aclaraciones,
        }),
      });
      if (!r.ok) {
        const datos = await r.json().catch(() => ({}));
        setErrorPdf(datos.error ?? "No se pudo generar el PDF.");
        return;
      }
      const nombre = /filename="([^"]+)"/.exec(r.headers.get("Content-Disposition") ?? "")?.[1];
      setPdfNombre(nombre ?? "presupuesto.pdf");
      cambiarPdfUrl(URL.createObjectURL(await r.blob()));
    } catch {
      setErrorPdf("No se pudo conectar con el servidor. Vuelve a intentarlo.");
    } finally {
      setGenerando(false);
    }
  }

  function empezarDeNuevo() {
    cambiarPdfUrl(null);
    setCotizacion(null);
    setItems([]);
    setAclaraciones([]);
    setResumen("");
    setDescripcion("");
    setPaso("solicitud");
  }

  const fecha = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Madrid",
  }).format(new Date());

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-5 sm:py-16">
      <header className="w-fit max-w-full bg-q-ground px-5 py-5 sm:px-7 sm:py-6">
        <p className="font-display text-sm font-bold tracking-tight text-q-pink [font-variation-settings:'wdth'_80]">
          Presupuesta mi web
        </p>
        <h1 className="mt-2 max-w-[18ch] font-display text-4xl leading-[0.95] font-extrabold tracking-[-0.03em] text-balance [font-variation-settings:'wdth'_78] sm:text-6xl">
          Cuéntanos tu proyecto y te preparamos el presupuesto
        </h1>
        <p className="mt-4 max-w-[52ch] text-base text-q-muted">
          Describe lo que necesitas. Te proponemos los servicios, los ajustas a tu gusto y descargas el
          presupuesto en PDF.
        </p>
      </header>

      <div className="registro mt-6 border border-q-ink bg-q-surface">
        <Pasos actual={paso} />
        <div className="px-5 pb-6 sm:px-8 sm:pb-8">

      {/* ---------- PASO 1 ---------- */}
      {paso === "solicitud" && (
        <form onSubmit={analizar} className="mt-6 flex flex-col gap-6">
          <div>
            <label htmlFor="cliente" className="mb-2 block text-sm font-medium">
              Nombre del cliente o empresa
            </label>
            <input
              id="cliente"
              value={cliente}
              maxLength={MAX_CLIENTE}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Ej.: Restaurante La Brasa (datos ficticios)"
              className={campo}
              autoComplete="organization"
            />
          </div>
          <div>
            <label htmlFor="descripcion" className="mb-2 block text-sm font-medium">
              ¿Qué necesitas?
            </label>
            <textarea
              id="descripcion"
              value={descripcion}
              maxLength={MAX_DESCRIPCION}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={7}
              placeholder="Ej.: Necesito una web para un restaurante. Quiero mostrar la carta, tener un formulario para solicitar reservas y ofrecer el contenido en dos idiomas."
              className={`${campo} resize-y leading-relaxed`}
              aria-describedby="descripcion-ayuda"
            />
            <p id="descripcion-ayuda" className="mt-2 flex justify-between gap-4 text-sm text-q-muted">
              <span>Describe tu negocio, qué secciones quieres y qué debe poder hacer la web.</span>
              <span className="shrink-0 tabular-nums">
                {descripcion.length}/{MAX_DESCRIPCION}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={analizando} className={botonPrimario}>
              {analizando ? "Analizando tu solicitud…" : "Proponer servicios"}
            </button>
          </div>

          {errorSolicitud && (
            <Aviso>
              <p>{errorSolicitud.texto}</p>
              {errorSolicitud.reintentable && (
                <button
                  type="button"
                  onClick={() => analizar()}
                  disabled={analizando}
                  className={`${botonSecundario} mt-3 h-9`}
                >
                  Reintentar
                </button>
              )}
            </Aviso>
          )}
        </form>
      )}

      {/* ---------- PASO 2 ---------- */}
      {paso === "revision" && (
        <div className="mt-6 flex flex-col gap-10">
          <section>
            <h2 className={`mb-3 ${tituloSeccion}`}>Resumen del proyecto</h2>
            <textarea
              value={resumen}
              maxLength={1500}
              onChange={(e) => setResumen(e.target.value)}
              rows={4}
              className={`${campo} resize-y font-serif text-base leading-relaxed`}
              aria-label="Resumen del proyecto"
            />
          </section>

          <section>
            <h2 className={tituloSeccion}>Servicios propuestos</h2>
            <p className="mt-1 text-sm text-q-muted">
              Revisa la propuesta: puedes eliminar servicios, añadir otros del catálogo y completar los datos que falten.
            </p>
            {descartados.length > 0 && (
              <p className="mt-2 text-xs text-q-muted">
                Se han descartado {descartados.length} servicio(s) que no existen en el catálogo.
              </p>
            )}

            <ul className="mt-4 flex flex-col gap-3">
              {items.map((i) => {
                const s = porId(i.id);
                const faltaCantidad = s.requiereCantidad && i.cantidad.trim() === "";
                return (
                  <li key={i.id} className="border border-l-4 border-q-line border-l-q-accent bg-q-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <span className="font-display text-lg font-semibold tracking-tight">{s.nombre}</span>
                          <span className="font-mono text-xs text-q-accent">
                            {s.requiereCantidad ? s.regla : euros.format(s.precioUnitario)}
                          </span>
                        </p>
                        <p className="mt-1 text-sm text-q-muted">{s.descripcion}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setItems((prev) => prev.filter((x) => x.id !== i.id))}
                        className={`shrink-0 rounded-sm px-2 py-1 text-sm text-q-muted underline-offset-4 hover:text-q-error hover:underline ${focus}`}
                        aria-label={`Eliminar ${s.nombre}`}
                      >
                        Eliminar
                      </button>
                    </div>

                    {s.requiereCantidad && (
                      <div className="mt-3">
                        <label htmlFor={`cant-${i.id}`} className="text-sm font-medium">
                          Cantidad ({s.cantidadMin}–{s.cantidadMax})
                        </label>
                        <input
                          id={`cant-${i.id}`}
                          type="number"
                          inputMode="numeric"
                          min={s.cantidadMin}
                          max={s.cantidadMax}
                          value={i.cantidad}
                          onChange={(e) => actualizarItem(i.id, { cantidad: e.target.value })}
                          className={`ml-3 h-9 w-20 rounded-sm border bg-q-ground px-2 text-center font-mono tabular-nums ${
                            faltaCantidad ? "border-q-error" : "border-q-line"
                          } ${focus}`}
                        />
                        {faltaCantidad && (
                          <p className="mt-1 text-sm text-q-error">Falta este dato para calcular la partida.</p>
                        )}
                      </div>
                    )}

                    <label className="mt-3 block">
                      <span className="text-xs font-medium text-q-muted">
                        {i.origen === "ia" ? "Por qué se propone" : "Nota (opcional)"}
                      </span>
                      <input
                        value={i.justificacion}
                        maxLength={400}
                        onChange={(e) => actualizarItem(i.id, { justificacion: e.target.value })}
                        className={`mt-1 h-9 w-full rounded-sm border border-q-line bg-q-ground/60 px-3 font-serif text-[0.95rem] italic ${focus}`}
                      />
                    </label>
                  </li>
                );
              })}
            </ul>

            {disponibles.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium">Añadir del catálogo</p>
                <div className="flex flex-wrap gap-2">
                  {disponibles.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => anadirServicio(s.id)}
                      className={`rounded-sm border border-dashed border-q-accent/60 px-3 py-1.5 text-sm font-medium text-q-accent hover:border-solid hover:bg-q-accent-soft ${focus}`}
                    >
                      + {s.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section>
            <h2 className={tituloSeccion}>Aclaraciones y aspectos pendientes</h2>
            <p className="mt-1 text-sm text-q-muted">
              Dudas a resolver y necesidades fuera de catálogo. Aparecerán en el PDF.
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {aclaraciones.map((a, idx) => (
                <li key={idx} className="flex items-start gap-3 border-l-2 border-q-pink bg-q-pink-soft/60 py-2 pr-2 pl-3 text-sm">
                  <span className="flex-1">{a}</span>
                  <button
                    type="button"
                    onClick={() => setAclaraciones((prev) => prev.filter((_, j) => j !== idx))}
                    className={`shrink-0 text-q-muted hover:text-q-error ${focus}`}
                    aria-label="Quitar aclaración"
                  >
                    ✕
                  </button>
                </li>
              ))}
              {aclaraciones.length === 0 && <li className="text-sm text-q-muted">No hay aclaraciones.</li>}
            </ul>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!nuevaAclaracion.trim()) return;
                setAclaraciones((prev) => [...prev, nuevaAclaracion.trim()]);
                setNuevaAclaracion("");
              }}
            >
              <input
                value={nuevaAclaracion}
                maxLength={300}
                onChange={(e) => setNuevaAclaracion(e.target.value)}
                placeholder="Añadir una aclaración…"
                aria-label="Nueva aclaración"
                className={`h-10 min-w-0 flex-1 rounded-sm border border-q-line bg-q-ground/60 px-3 text-sm ${focus}`}
              />
              <button type="submit" className={`${botonSecundario} h-10`}>
                Añadir
              </button>
            </form>
          </section>

          <div className="border-t border-q-line pt-6">
            {pendientes.length > 0 && (
              <ul className="mb-4 list-inside list-disc text-sm text-q-error">
                {pendientes.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => setPaso("solicitud")} className={botonSecundario}>
                Volver
              </button>
              <button
                type="button"
                onClick={confirmarSeleccion}
                disabled={pendientes.length > 0 || calculando}
                className={botonPrimario}
              >
                {calculando ? "Calculando…" : "Confirmar y calcular presupuesto"}
              </button>
            </div>
            {errorRevision && <Aviso className="mt-4">{errorRevision}</Aviso>}
          </div>
        </div>
      )}

      {/* ---------- PASO 3 ---------- */}
      {paso === "presupuesto" && cotizacion && (
        <div className="mt-6 flex flex-col gap-6">
          <p className="text-sm text-q-muted">
            Revisa el contenido del documento. Si todo es correcto, genera el PDF para verlo y descargarlo.
          </p>

          <article className="border border-q-line bg-white text-[#161a3a]">
            <div className="h-1.5 bg-q-accent" />
            <div className="p-5 sm:p-8">
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <p className="font-display text-sm font-bold text-[#2343e0]">Presupuesta mi web</p>
                  <h2 className="font-display text-3xl font-extrabold tracking-tight [font-variation-settings:'wdth'_80]">
                    Presupuesto
                  </h2>
                </div>
                <dl className="text-sm sm:text-right">
                  <dt className="text-[#5e6483]">Cliente</dt>
                  <dd className="font-medium">{cliente}</dd>
                  <dt className="mt-1 text-[#5e6483]">Fecha</dt>
                  <dd className="font-medium">{fecha}</dd>
                </dl>
              </div>

              <h3 className="mt-7 font-display text-sm font-semibold text-[#2343e0]">
                Resumen del proyecto
              </h3>
              <p className="mt-2 font-serif text-[1.05rem] leading-relaxed">{resumen}</p>

              <h3 className="mt-7 font-display text-sm font-semibold text-[#2343e0]">
                Servicios y desglose
              </h3>
              <ul className="mt-2 divide-y divide-[#c9cddb] border-y border-[#161a3a]">
                {cotizacion.lineas.map((l) => {
                  const nota = items.find((i) => i.id === l.id)?.justificacion.trim();
                  return (
                    <li key={l.id} className="flex gap-4 py-3 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{l.nombre}</p>
                        <p className="text-[#5e6483]">{l.descripcion}</p>
                        {nota && <p className="mt-1 font-serif text-[0.95rem] italic">{nota}</p>}
                      </div>
                      <div className="shrink-0 text-right font-mono tabular-nums">
                        <p className="font-medium">{euros.format(l.importe)}</p>
                        <p className="text-xs text-[#5e6483]">
                          {l.cantidad} × {euros.format(l.precioUnitario)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 flex items-baseline justify-end gap-4">
                <span className="font-display text-base font-semibold">Total</span>
                <span className="font-display text-4xl font-extrabold tracking-tight tabular-nums [font-variation-settings:'wdth'_85]">
                  {euros.format(cotizacion.total)}
                </span>
              </div>
              <p className="mt-1 text-right text-xs text-[#5e6483]">
                Importes calculados por el servidor, en euros y sin impuestos.
              </p>

              <h3 className="mt-7 font-display text-sm font-semibold text-[#2343e0]">
                Aclaraciones y aspectos pendientes
              </h3>
              {aclaraciones.length > 0 ? (
                <ul className="mt-2 list-inside list-disc font-serif text-[1.02rem] leading-relaxed marker:text-[#ff3d8b]">
                  {aclaraciones.map((a, idx) => (
                    <li key={idx}>{a}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 font-serif text-[#5e6483]">No hay aspectos pendientes de concretar.</p>
              )}
            </div>
          </article>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                cambiarPdfUrl(null);
                setPaso("revision");
              }}
              className={botonSecundario}
            >
              Modificar servicios
            </button>
            <button type="button" onClick={generarPdf} disabled={generando} className={botonPrimario}>
              {generando ? "Generando PDF…" : pdfUrl ? "Regenerar PDF" : "Generar PDF"}
            </button>
            {pdfUrl && (
              <a href={pdfUrl} download={pdfNombre} className={botonPrimario}>
                Descargar PDF
              </a>
            )}
          </div>
          {errorPdf && (
            <Aviso>
              <p>{errorPdf}</p>
              <button type="button" onClick={generarPdf} className={`${botonSecundario} mt-3 h-9`}>
                Reintentar
              </button>
            </Aviso>
          )}

          {pdfUrl && (
            <section>
              <h2 className={`mb-3 ${tituloSeccion}`}>Vista previa del PDF</h2>
              <iframe
                src={pdfUrl}
                title="Vista previa del presupuesto en PDF"
                className="h-[75vh] w-full border border-q-ink bg-white"
              />
              <p className="mt-2 text-xs text-q-muted">
                ¿No ves la vista previa?{" "}
                <a href={pdfUrl} target="_blank" rel="noreferrer" className="underline">
                  Ábrelo en otra pestaña
                </a>
                .
              </p>
            </section>
          )}

          <button
            type="button"
            onClick={empezarDeNuevo}
            className={`self-start text-sm text-q-muted underline decoration-q-pink underline-offset-4 hover:text-q-ink ${focus}`}
          >
            Empezar un presupuesto nuevo
          </button>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

function Pasos({ actual }: { actual: Paso }) {
  const pasos: { id: Paso; texto: string }[] = [
    { id: "solicitud", texto: "Tu proyecto" },
    { id: "revision", texto: "Revisar servicios" },
    { id: "presupuesto", texto: "Presupuesto y PDF" },
  ];
  const indice = pasos.findIndex((p) => p.id === actual);
  return (
    <ol className="grid grid-cols-3 border-b border-q-ink text-sm">
      {pasos.map((p, i) => (
        <li
          key={p.id}
          aria-current={i === indice ? "step" : undefined}
          className={`flex items-center gap-2 border-q-ink px-3 py-3 sm:px-5 [&:not(:first-child)]:border-l ${
            i === indice ? "bg-q-ink text-q-ground" : i < indice ? "text-q-ink" : "text-q-muted"
          }`}
        >
          <span
            className={`font-display text-xl leading-none font-extrabold tabular-nums ${
              i === indice ? "text-q-pink" : ""
            }`}
          >
            {i + 1}
          </span>
          <span className="leading-tight font-medium">{p.texto}</span>
        </li>
      ))}
    </ol>
  );
}

function Aviso({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      role="alert"
      className={`border-l-4 border-q-error bg-q-error/10 p-4 text-sm font-medium text-q-error ${className}`}
    >
      {children}
    </div>
  );
}
