import "server-only";

import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

import type { DatosDocumento } from "@/lib/documento";

const TINTA = "#0e1a2b";
const GRIS = "#5b6577";
const LINEA = "#d5dae3";
const ACENTO = "#2d4bff";

const s = StyleSheet.create({
  pagina: {
    paddingTop: 48,
    paddingBottom: 64,
    paddingHorizontal: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: TINTA,
    lineHeight: 1.45,
  },
  franja: { position: "absolute", top: 0, left: 0, right: 0, height: 6, backgroundColor: ACENTO },
  cabecera: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  marca: { fontSize: 11, fontFamily: "Helvetica-Bold", color: ACENTO },
  titulo: { fontSize: 22, fontFamily: "Helvetica-Bold", marginTop: 4 },
  meta: { textAlign: "right", color: GRIS },
  metaValor: { color: TINTA, fontFamily: "Helvetica-Bold" },
  seccion: { marginBottom: 20 },
  h2: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: GRIS,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  fila: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: LINEA,
    paddingVertical: 8,
  },
  filaCabecera: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: TINTA,
    paddingBottom: 4,
    color: GRIS,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  colConcepto: { flex: 1, paddingRight: 12 },
  colCant: { width: 40, textAlign: "right" },
  colPrecio: { width: 70, textAlign: "right" },
  colImporte: { width: 75, textAlign: "right" },
  nombreServicio: { fontFamily: "Helvetica-Bold" },
  descripcion: { color: GRIS, fontSize: 9, marginTop: 2 },
  justificacion: { fontSize: 9, marginTop: 3, fontFamily: "Helvetica-Oblique" },
  total: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "baseline",
    marginTop: 10,
    gap: 16,
  },
  totalEtiqueta: { fontFamily: "Helvetica-Bold", fontSize: 11 },
  totalValor: { fontFamily: "Helvetica-Bold", fontSize: 18 },
  nota: { color: GRIS, fontSize: 8, textAlign: "right", marginTop: 4 },
  vineta: { flexDirection: "row", marginBottom: 4 },
  punto: { width: 12, color: ACENTO },
  pie: {
    // A4 = 841,89 pt de alto. Con `bottom` el pie no se dibujaba en esta versión.
    position: "absolute",
    top: 790,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    color: GRIS,
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: LINEA,
    paddingTop: 8,
  },
});

const euros = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

function DocumentoPresupuesto({ datos }: { datos: DatosDocumento }) {
  const { cliente, fecha, resumen, cotizacion, justificaciones, aclaraciones } = datos;
  return (
    <Document title={`Presupuesto - ${cliente}`} author="Presupuesta mi web" language="es">
      <Page size="A4" style={s.pagina}>
        <View style={s.franja} fixed />

        <View style={s.cabecera}>
          <View>
            <Text style={s.marca}>Presupuesta mi web</Text>
            <Text style={s.titulo}>Presupuesto</Text>
          </View>
          <View style={s.meta}>
            <Text>Cliente</Text>
            <Text style={s.metaValor}>{cliente}</Text>
            <Text style={{ marginTop: 6 }}>Fecha</Text>
            <Text style={s.metaValor}>{fecha}</Text>
          </View>
        </View>

        <View style={s.seccion}>
          <Text style={s.h2}>Resumen del proyecto</Text>
          <Text>{resumen}</Text>
        </View>

        <View style={s.seccion}>
          <Text style={s.h2}>Servicios y desglose</Text>
          <View style={s.filaCabecera} fixed>
            <Text style={s.colConcepto}>Concepto</Text>
            <Text style={s.colCant}>Cant.</Text>
            <Text style={s.colPrecio}>Precio</Text>
            <Text style={s.colImporte}>Importe</Text>
          </View>
          {cotizacion.lineas.map((l) => (
            <View key={l.id} style={s.fila} wrap={false}>
              <View style={s.colConcepto}>
                <Text style={s.nombreServicio}>{l.nombre}</Text>
                <Text style={s.descripcion}>{l.descripcion}</Text>
                {justificaciones[l.id] ? (
                  <Text style={s.justificacion}>{justificaciones[l.id]}</Text>
                ) : null}
              </View>
              <Text style={s.colCant}>{l.cantidad}</Text>
              <Text style={s.colPrecio}>{euros.format(l.precioUnitario)}</Text>
              <Text style={s.colImporte}>{euros.format(l.importe)}</Text>
            </View>
          ))}
          <View style={s.total} wrap={false}>
            <Text style={s.totalEtiqueta}>Total</Text>
            <Text style={s.totalValor}>{euros.format(cotizacion.total)}</Text>
          </View>
          <Text style={s.nota}>Importes en euros, sin impuestos.</Text>
        </View>

        <View style={s.seccion}>
          <Text style={s.h2}>Aclaraciones y aspectos pendientes</Text>
          {aclaraciones.length === 0 ? (
            <Text style={{ color: GRIS }}>No hay aspectos pendientes de concretar.</Text>
          ) : (
            aclaraciones.map((a, i) => (
              <View key={i} style={s.vineta} wrap={false}>
                <Text style={s.punto}>•</Text>
                <Text style={{ flex: 1 }}>{a}</Text>
              </View>
            ))
          )}
          <Text style={{ color: GRIS, fontSize: 8, marginTop: 8 }}>
            Las necesidades fuera de catálogo no están incluidas en el total y se valorarán por separado.
          </Text>
        </View>

        <View style={s.pie} fixed>
          <Text>Presupuesta mi web · Presupuesto orientativo para {cliente}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export function generarPdf(datos: DatosDocumento) {
  return renderToBuffer(<DocumentoPresupuesto datos={datos} />);
}
