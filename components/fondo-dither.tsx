"use client";

import { useEffect, useRef } from "react";

/**
 * Fondo animado estilo risografía: un campo de flujo (ruido fbm con
 * deformación de dominio) cuantizado con una matriz Bayer 8×8 a una rampa
 * corta de tintas. Se dibuja a resolución de celda (1 fragmento = 1 «punto»)
 * y se escala con `image-rendering: pixelated`, así que cuesta muy poco.
 *
 * Los colores salen de las variables CSS --dither-0..3, de modo que el
 * modo oscuro y la paleta se controlan desde globals.css.
 */

const PIXEL = 4; // tamaño de celda en px CSS
const NIVELES = 5.0;
const FPS = 30;

const VERT = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uC0, uC1, uC2, uC3;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; }
  return v;
}

float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

void main() {
  vec2 cell = gl_FragCoord.xy;
  vec2 uv = cell / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * aspect, uv.y) * 2.2;

  // Campo de flujo: cintas diagonales arrastradas por el viento.
  float t = uTime * 0.05;
  vec2 dir = normalize(vec2(0.86, 0.5));
  vec2 q = vec2(fbm(p + dir * t), fbm(p + vec2(5.2, 1.3) - dir * t * 0.7));
  vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) + t * 0.6), fbm(p + 3.0 * q + vec2(8.3, 2.8)));
  float v = fbm(p + 2.6 * r);

  // Núcleo luminoso que deriva lentamente.
  vec2 core = vec2(0.72 + 0.18 * sin(uTime * 0.07), 0.78 + 0.12 * cos(uTime * 0.05));
  float glow = exp(-6.0 * length((uv - core) * vec2(aspect, 1.0)));
  v = v + glow * 0.45;

  // Más calma en la columna central, donde va el contenido.
  float lado = smoothstep(0.08, 0.42, abs(uv.x - 0.5));
  float calma = mix(0.55, 1.0, lado);
  v = clamp((v - 0.32) * 1.9 * calma, 0.0, 1.0);

  // Cuantización con dithering ordenado.
  float d = bayer8(cell) - 0.5;
  float n = floor(clamp(v + d / (${NIVELES.toFixed(1)} - 1.0), 0.0, 1.0) * (${NIVELES.toFixed(1)} - 1.0) + 0.5);

  vec3 c = uC0;
  if (n >= 1.0) c = mix(uC0, uC1, 0.55);
  if (n >= 2.0) c = uC1;
  if (n >= 3.0) c = uC2;
  if (n >= 4.0) c = uC3;
  gl_FragColor = vec4(c, 1.0);
}`;

function hexARgb(valor: string): [number, number, number] {
  const hex = valor.trim().replace("#", "");
  const n = parseInt(hex.length === 3 ? hex.replace(/./g, "$&$&") : hex, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function FondoDither() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, preserveDrawingBuffer: true });
    if (!gl) return; // sin WebGL: queda el color de papel del body

    const compilar = (tipo: number, fuente: string) => {
      const s = gl.createShader(tipo)!;
      gl.shaderSource(s, fuente);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compilar(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compilar(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uC = [0, 1, 2, 3].map((i) => gl.getUniformLocation(prog, `uC${i}`));

    const leerColores = () => {
      const estilo = getComputedStyle(document.documentElement);
      uC.forEach((u, i) => gl.uniform3fv(u, hexARgb(estilo.getPropertyValue(`--dither-${i}`) || "#ffffff")));
    };

    const ajustar = () => {
      const w = Math.ceil(window.innerWidth / PIXEL);
      const h = Math.ceil(window.innerHeight / PIXEL);
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
    };

    const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)");
    const inicio = performance.now();
    let ultimo = 0;
    let raf = 0;

    const dibujar = (ahora: number) => {
      gl.uniform1f(uTime, reducirMovimiento.matches ? 12 : (ahora - inicio) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const bucle = (ahora: number) => {
      raf = requestAnimationFrame(bucle);
      if (document.hidden || reducirMovimiento.matches) return;
      if (ahora - ultimo < 1000 / FPS) return;
      ultimo = ahora;
      dibujar(ahora);
    };

    leerColores();
    ajustar();
    dibujar(performance.now());
    raf = requestAnimationFrame(bucle);

    const alRedimensionar = () => {
      ajustar();
      dibujar(performance.now());
    };
    window.addEventListener("resize", alRedimensionar);

    // next-themes cambia la clase .dark en <html>: releer la paleta.
    const observador = new MutationObserver(() => {
      leerColores();
      dibujar(performance.now());
    });
    observador.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const alCambiarMovimiento = () => dibujar(performance.now());
    reducirMovimiento.addEventListener("change", alCambiarMovimiento);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", alRedimensionar);
      reducirMovimiento.removeEventListener("change", alCambiarMovimiento);
      observador.disconnect();
      // No usar loseContext(): React (modo estricto) vuelve a montar el
      // componente sobre el mismo <canvas> y getContext devolvería el
      // contexto ya perdido. Basta con liberar los recursos.
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full [image-rendering:pixelated]"
    />
  );
}
