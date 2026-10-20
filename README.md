# API de presupuestos web

Calcula el coste de crear una página web con los parámetros introducidos basados en la tarifa del servidor.

## Cómo ejecutarlo
Ejecutar "npm run dev" y entrar en http://localhost:3000.

## Rutas
GET /api/estado:
- Comprueba que el servidor funciona y devuelve "status: ok"

GET /api/tarifas:
- Devuelve las tarifas que el servidor usa para calcular los precios.

POST /api/presupuesto:
- Lee el JSON, si no está bien estructurado, devuelve 400.
- Valida los campos de entrada, si no son correctos, devuelve 400 y un mensaje explicando porqué.
- Calcula el precio utilizando la tarifa del servidor.
- Devuelve 200 si todo es correcto con el desglose de los costes.

## Tarifas
tipo: landing: 300 | corporativa: 600
pag_adicional: 50
form_contacto: 80
seg_idioma: 150

## Pruebas
Las peticiones POST se enviaron desde PowerShell con `Invoke-WebRequest`:

```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/presupuesto -Method Post -ContentType "application/json" -Body '{"tipo":"corporativa","paginas":4,"formulario":true,"segundoIdioma":false}' -UseBasicParsing
```

### Cálculo (9 casos)

| Caso | Solicitud | Estado | Resultado |
|---|---|---|---|
| 1 | landing, 1 página, sin extras | 200 | Total: 300 € |
| 2 | corporativa, 4 páginas, formulario, sin segundo idioma | 200 | Total: 830 € |
| 3 | landing, 2 páginas, formulario y segundo idioma | 200 | Total: 580 € |
| 4 | landing, 20 páginas, sin extras | 200 | Total: 1250 € |
| 5 | `paginas: 0` | 400 | "paginas debe ser un entero entre 1 y 20." |
| 6 | `paginas: 21` | 400 | "paginas debe ser un entero entre 1 y 20." |
| 7 | `paginas: 2.5` | 400 | "paginas debe ser un entero entre 1 y 20." |
| 8 | `tipo: "tienda"` | 400 | "tipo debe ser 'landing' o 'corporativa'." |
| 9 | `formulario: "false"` | 400 | "formulario debe ser un booleano." |

En los casos inválidos los demás campos son correctos, para comprobar cada error por separado.

### Pruebas adicionales

| Prueba | Estado | Resultado |
|---|---|---|
| Propiedad extra `"total": 1` en la solicitud del caso 2 | 200 | Total: 830 € (el servidor ignora el total enviado) |
| JSON mal formado (`{broken`) | 400 | "El cuerpo debe ser JSON válido." |
