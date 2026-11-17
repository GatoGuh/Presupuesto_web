import { Bricolage_Grotesque, Geist_Mono, Instrument_Sans, Newsreader } from "next/font/google"

import "./globals.css"
import { FondoDither } from "@/components/fondo-dither"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

export const metadata = {
  title: "Presupuesta mi web",
  description: "Describe tu proyecto y recibe una propuesta de servicios y un presupuesto en PDF.",
}

// Titulares: grotesca con carácter y eje de anchura.
const fontDisplay = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["wdth", "opsz"],
})

// Interfaz y texto corrido.
const fontSans = Instrument_Sans({ subsets: ["latin"], variable: "--font-sans" })

// Texto del documento de presupuesto.
const fontSerif = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  style: ["normal", "italic"],
})

// Cifras e importes.
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn(
        "antialiased font-sans",
        fontDisplay.variable,
        fontSans.variable,
        fontSerif.variable,
        fontMono.variable,
      )}
    >
      <body>
        <ThemeProvider>
          <FondoDither />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
