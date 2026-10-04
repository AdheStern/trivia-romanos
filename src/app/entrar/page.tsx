import { redirect } from "next/navigation";
import { sesionActiva } from "@/lib/admin-sesion";
import { Puerta } from "./puerta";

export const metadata = { title: "Código de acceso" };

export const dynamic = "force-dynamic";

/**
 * La reja vive fuera de `/admin` a propósito. Si estuviera dentro, el layout
 * tendría que elegir entre dibujar la reja o los hijos, y Next igual renderiza
 * la página en paralelo: el banco entero terminaba viajando en el HTML de
 * `/admin` aunque no se viera. Con una ruta aparte, `/admin` responde un
 * redirect y no se manda nada.
 */
export default async function Entrar() {
  if (await sesionActiva()) redirect("/admin");
  return <Puerta />;
}
