import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerPregunta } from "@/db/preguntas";
import { sesionActiva } from "@/lib/admin-sesion";
import { FormularioPregunta } from "../formulario-pregunta";

export const dynamic = "force-dynamic";

export const metadata = { title: "Editar pregunta" };

export default async function Editar({ params }: PageProps<"/admin/[id]">) {
  if (!(await sesionActiva())) redirect("/entrar");

  const { id } = await params;
  const pregunta = await obtenerPregunta(id);

  if (!pregunta) {
    return (
      <div className="marmol filete rounded-sm px-6 py-10 text-center">
        <p className="text-tinta">Esa pregunta ya no existe en el banco.</p>
        <Link
          href="/admin"
          className="mt-5 inline-block rounded-sm text-sm text-tinta underline decoration-tinta/30 underline-offset-4 transition-colors duration-150 hover:decoration-tinta"
        >
          Volver al listado
        </Link>
      </div>
    );
  }

  return <FormularioPregunta inicial={pregunta} />;
}
