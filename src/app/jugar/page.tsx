import { obtenerBanco } from "@/db/preguntas";
import { Escenario } from "./escenario";

// El banco se lee en cada entrada a la pantalla: el operador tiene que ver las
// preguntas que acaba de cargar, sin esperar a que caduque una caché.
export const dynamic = "force-dynamic";

export const metadata = { title: "Certamen" };

export default async function Jugar() {
  const banco = await obtenerBanco();
  return <Escenario banco={banco} />;
}
