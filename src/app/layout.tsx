import type { Metadata, Viewport } from "next";
import { Marcellus, Spectral } from "next/font/google";
import "./globals.css";

/* Marcellus: capitales romanas inscripcionales, de la familia de las letras de
   la columna de Trajano. Lleva los títulos y las letras talladas. */
const inscripcion = Marcellus({
  subsets: ["latin"],
  weight: "400",
  variable: "--fuente-inscripcion",
  display: "swap",
});

/* Spectral: serif pensada para pantalla, con peso real. Aguanta la distancia
   de un proyector y tiene cifras sólidas para el odómetro. */
const cuerpo = Spectral({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--fuente-cuerpo",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Trivia de Romanos",
    template: "%s · Trivia de Romanos",
  },
  description:
    "Certamen de preguntas sobre la epístola de Pablo a los Romanos, para proyectar en pantalla grande.",
};

export const viewport: Viewport = {
  themeColor: "#171310",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${inscripcion.variable} ${cuerpo.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="fondo-basalto flex min-h-full flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
