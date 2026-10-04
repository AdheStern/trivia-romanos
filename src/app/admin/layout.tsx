import Link from "next/link";
import { redirect } from "next/navigation";
import { sesionActiva } from "@/lib/admin-sesion";
import { salir } from "./acciones";

export const metadata = { title: "Banco de preguntas" };

// La reja lee la cookie, así que la sección es dinámica de por sí.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  if (!(await sesionActiva())) redirect("/entrar");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-dorado/25 px-4 py-3 sm:px-8 sm:py-4">
        <div className="flex items-baseline gap-4">
          <Link
            href="/admin"
            className="inscripcion flex min-h-11 items-center rounded-sm text-[0.8rem] text-travertino transition-colors duration-150 hover:text-dorado-2"
          >
            Banco de preguntas
          </Link>
          <Link
            href="/"
            className="flex min-h-11 items-center rounded-sm text-sm text-travertino/55 underline decoration-travertino/25 underline-offset-4 transition-colors duration-150 hover:text-travertino hover:decoration-travertino/60"
          >
            Inicio
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/nueva"
            className="marmol filete inscripcion flex min-h-11 items-center rounded-sm px-5 text-[0.62rem] text-tinta transition-transform duration-200 ease-out hover:-translate-y-0.5"
          >
            Nueva pregunta
          </Link>
          <form action={salir}>
            <button
              type="submit"
              className="flex min-h-11 items-center rounded-sm px-3 text-sm text-travertino/55 underline decoration-travertino/25 underline-offset-4 transition-colors duration-150 hover:text-travertino hover:decoration-travertino/60"
            >
              Salir
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-8 sm:py-8">
        {children}
      </main>
    </div>
  );
}
