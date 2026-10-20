import {TARIFAS} from "@/lib/tarifas";

export type DatosPresupuesto = {
    tipo: "landing" | "corporativa";
    paginas: number;
    formulario: boolean;
    segundoIdioma: boolean;
};

export function calcularPresupuesto(datos: DatosPresupuesto) {
    const base = TARIFAS.base[datos.tipo];
    const paginasAdicionales = (datos.paginas - 1) * TARIFAS.pag_adicional;
    const formulario = datos.formulario ? TARIFAS.form_contacto : 0;
    const segundoIdioma = datos.segundoIdioma ? TARIFAS.seg_idioma : 0;
    const total = base + paginasAdicionales + formulario + segundoIdioma;
    return { base, paginasAdicionales, formulario, segundoIdioma, total, moneda: "EUR" };
}