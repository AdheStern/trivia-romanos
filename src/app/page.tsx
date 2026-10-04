import Link from "next/link";
import { Arco } from "@/components/arco";
import { Laurel } from "@/components/laurel";
import { contarPorCategoria } from "@/db/preguntas";

export const dynamic = "force-dynamic";

export default async function Portal() {
  const conteos = await contarPorCategoria();
  const total = Object.values(conteos).reduce(
    (suma, cantidad) => suma + cantidad,
    0,
  );

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-14 px-6 py-16">
      <Arco className="w-full">
        <div className="px-[8%] pt-[14%] pb-[7%] text-center">
          <h1
            className="inscripcion text-tinta text-[clamp(1.5rem,5.2vw,3.4rem)] leading-[1.1]"
            style={{ textWrap: "balance" }}
          >
            Epístola a los Romanos
          </h1>

          <p className="mt-4 text-[clamp(0.95rem,1.6vw,1.2rem)] text-tinta-2">
            Certamen de preguntas para proyectar en pantalla grande
          </p>

          <Filete />

          <blockquote className="mx-auto max-w-xl text-[clamp(0.9rem,1.5vw,1.1rem)] text-tinta/85 italic">
            «No me avergüenzo del evangelio, porque es poder de Dios para
            salvación a todo aquel que cree»
            <cite className="mt-2 block text-[0.8em] not-italic text-tinta-2">
              Romanos 1:16
            </cite>
          </blockquote>
        </div>
      </Arco>

      <div className="grid gap-5 sm:grid-cols-2">
        <Puerta
          href="/jugar"
          titulo="Iniciar la trivia"
          detalle={
            total > 0
              ? "Elige una de las seis categorías y proyecta la pregunta."
              : "Hace falta cargar preguntas antes de empezar."
          }
          deshabilitada={total === 0}
        />
        <Puerta
          href="/admin"
          titulo="Administrar preguntas"
          detalle="Carga, corrige o borra preguntas del banco. Pide un código."
        />
      </div>

      <p className="text-center text-sm text-travertino/55 tabular-nums">
        {total === 0 ? (
          <>
            El banco está vacío todavía.{" "}
            <Link
              href="/admin"
              className="text-dorado-2 underline decoration-dorado/40 underline-offset-4 transition-colors duration-150 hover:decoration-dorado-2"
            >
              Carga la primera pregunta
            </Link>
            .
          </>
        ) : (
          <>
            {total} {total === 1 ? "pregunta" : "preguntas"} en el banco,
            repartidas en seis categorías.
          </>
        )}
      </p>
    </main>
  );
}

/** Filete dorado con un laurel al centro, a modo de separador tallado. */
function Filete() {
  return (
    <div
      aria-hidden="true"
      className="my-7 flex items-center justify-center gap-4"
    >
      <span className="h-px w-full max-w-[9rem] bg-gradient-to-r from-transparent to-dorado/60" />
      <Laurel className="h-8 w-8 shrink-0 text-dorado" />
      <span className="h-px w-full max-w-[9rem] bg-gradient-to-l from-transparent to-dorado/60" />
    </div>
  );
}

type PuertaProps = {
  href: string;
  titulo: string;
  detalle: string;
  deshabilitada?: boolean;
};

/* Mismo remate que las tabletas del tablero: vanos de piedra, no tarjetas. */
const VANO = "44% 44% 4px 4px / 16% 16% 4px 4px";

function Puerta({ href, titulo, detalle, deshabilitada }: PuertaProps) {
  const contenido = (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-[0.55rem] border border-dorado/30"
        style={{ borderRadius: VANO }}
      />
      <span className="inscripcion relative block text-[clamp(0.9rem,1.7vw,1.15rem)] text-tinta">
        {titulo}
      </span>
      <span className="relative mt-2 block text-sm leading-snug text-tinta-2">
        {detalle}
      </span>
    </>
  );

  const base =
    "relative block px-7 pt-9 pb-7 text-left transition-[transform,box-shadow] duration-200 ease-out";

  if (deshabilitada) {
    return (
      <span
        aria-disabled="true"
        style={{ borderRadius: VANO }}
        className={`marmol filete ${base} cursor-not-allowed opacity-55`}
      >
        {contenido}
      </span>
    );
  }

  return (
    <Link
      href={href}
      style={{ borderRadius: VANO }}
      className={`marmol marmol-b tallado filete ${base} hover:-translate-y-1 hover:shadow-[0_24px_46px_-20px_rgb(0,0,0,0.95)]`}
    >
      {contenido}
    </Link>
  );
}
