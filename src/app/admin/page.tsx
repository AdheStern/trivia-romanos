import Link from "next/link";
import { redirect } from "next/navigation";
import { contarPreguntas, listarPreguntas } from "@/db/preguntas";
import { sesionActiva } from "@/lib/admin-sesion";
import {
  DIFICULTADES,
  type Dificultad,
  ETIQUETA_DIFICULTAD,
  ETIQUETA_TIPO,
  TIPOS,
  type Tipo,
} from "@/lib/tipos";
import { ListaPreguntas } from "./lista-preguntas";

export const dynamic = "force-dynamic";

/* El banco crece rápido y en un teléfono noventa filas son veinte pantallas de
   scroll, así que el listado va paginado. */
const POR_PAGINA = 20;

function primero(valor: string | string[] | undefined): string {
  if (Array.isArray(valor)) return valor[0] ?? "";
  return valor ?? "";
}

export default async function Listado({ searchParams }: PageProps<"/admin">) {
  if (!(await sesionActiva())) redirect("/entrar");

  const params = await searchParams;

  const tipoCrudo = primero(params.tipo);
  const nivelCrudo = primero(params.nivel);
  const busqueda = primero(params.q).trim();

  const tipo = TIPOS.includes(tipoCrudo as Tipo)
    ? (tipoCrudo as Tipo)
    : undefined;
  const dificultad = DIFICULTADES.includes(nivelCrudo as Dificultad)
    ? (nivelCrudo as Dificultad)
    : undefined;

  const filtros = { tipo, dificultad, busqueda };
  const total = await contarPreguntas(filtros);
  const ultimaPagina = Math.max(1, Math.ceil(total / POR_PAGINA));
  const pedida = Number.parseInt(primero(params.p), 10);
  const pagina = Math.min(
    Math.max(Number.isInteger(pedida) ? pedida : 1, 1),
    ultimaPagina,
  );

  const preguntas = await listarPreguntas(filtros, {
    limite: POR_PAGINA,
    desplazamiento: (pagina - 1) * POR_PAGINA,
  });
  const filtrando = Boolean(tipo || dificultad || busqueda);

  // Los filtros viven en la URL, así se pueden compartir y sobreviven un refresh.
  const enlace = (parche: Record<string, string | undefined>) => {
    const siguiente = new URLSearchParams();
    const valores = {
      tipo,
      nivel: dificultad,
      q: busqueda || undefined,
      // Tocar un filtro vuelve a la primera página.
      p: undefined as string | undefined,
      ...parche,
    };
    for (const [clave, valor] of Object.entries(valores)) {
      if (valor) siguiente.set(clave, valor);
    }
    const cadena = siguiente.toString();
    return cadena ? `/admin?${cadena}` : "/admin";
  };

  const desde = (pagina - 1) * POR_PAGINA + 1;
  const hasta = Math.min(pagina * POR_PAGINA, total);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Chips
          leyenda="Tipo"
          activo={tipo}
          opciones={TIPOS.map((valor) => ({
            valor,
            etiqueta: ETIQUETA_TIPO[valor],
          }))}
          href={(valor) => enlace({ tipo: valor })}
        />
        <Chips
          leyenda="Dificultad"
          activo={dificultad}
          opciones={DIFICULTADES.map((valor) => ({
            valor,
            etiqueta: ETIQUETA_DIFICULTAD[valor],
          }))}
          href={(valor) => enlace({ nivel: valor })}
        />

        <form
          method="get"
          action="/admin"
          className="flex flex-wrap items-end gap-2"
        >
          {tipo ? <input type="hidden" name="tipo" value={tipo} /> : null}
          {dificultad ? (
            <input type="hidden" name="nivel" value={dificultad} />
          ) : null}

          <div className="min-w-0 flex-1 basis-full sm:basis-0">
            <label htmlFor="q" className="block text-sm text-travertino/60">
              Buscar en los enunciados
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={busqueda}
              autoComplete="off"
              spellCheck={false}
              placeholder="justificados por la fe…"
              className="mt-2 block min-h-11 w-full rounded-sm border border-dorado/25 bg-basalto-2 px-3 py-2.5 text-travertino transition-[border-color] duration-150 placeholder:text-travertino/30 focus:border-dorado"
            />
          </div>

          <button
            type="submit"
            className="marmol filete min-h-11 flex-1 rounded-sm px-5 text-sm text-tinta transition-transform duration-200 ease-out hover:-translate-y-0.5 sm:flex-none"
          >
            Buscar
          </button>

          {filtrando ? (
            <Link
              href="/admin"
              className="flex min-h-11 flex-1 items-center justify-center rounded-sm px-3 text-sm text-travertino/60 underline decoration-travertino/25 underline-offset-4 transition-colors duration-150 hover:text-travertino hover:decoration-travertino/60 sm:flex-none"
            >
              Limpiar
            </Link>
          ) : null}
        </form>
      </div>

      <p aria-live="polite" className="text-sm text-travertino/55 tabular-nums">
        {total === 0
          ? filtrando
            ? "Ninguna coincide con estos filtros"
            : "Sin preguntas en el banco"
          : `${desde}–${hasta} de ${total}${filtrando ? " con estos filtros" : " en el banco"}`}
      </p>

      {preguntas.length === 0 ? (
        <div className="marmol marmol-panel filete rounded-sm px-6 py-10 text-center">
          <p className="text-tinta">
            {filtrando
              ? "Ninguna pregunta coincide con estos filtros."
              : "Todavía no hay preguntas cargadas."}
          </p>
          <div className="mt-5">
            {filtrando ? (
              <Link
                href="/admin"
                className="inline-flex min-h-11 items-center rounded-sm px-3 text-sm text-tinta underline decoration-tinta/30 underline-offset-4 transition-colors duration-150 hover:decoration-tinta"
              >
                Quitar los filtros
              </Link>
            ) : (
              <Link
                href="/admin/nueva"
                className="inscripcion inline-flex min-h-11 items-center rounded-sm border border-dorado/50 px-5 text-[0.62rem] text-tinta transition-colors duration-150 hover:bg-dorado/20"
              >
                Cargar la primera
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          <ListaPreguntas preguntas={preguntas} />
          <Paginador
            pagina={pagina}
            ultima={ultimaPagina}
            href={(numero) =>
              enlace({ p: numero === 1 ? undefined : String(numero) })
            }
          />
        </>
      )}
    </div>
  );
}

function Paginador({
  pagina,
  ultima,
  href,
}: {
  pagina: number;
  ultima: number;
  href: (numero: number) => string;
}) {
  if (ultima <= 1) return null;

  const paso =
    "flex min-h-11 items-center justify-center rounded-sm border px-4 text-sm transition-colors duration-150";
  const activo =
    "border-dorado/30 text-travertino/75 hover:border-dorado hover:text-travertino";
  const inerte = "border-transparent text-travertino/25";

  return (
    <nav
      aria-label="Páginas del listado"
      className="flex items-center justify-between gap-3"
    >
      {pagina > 1 ? (
        <Link
          href={href(pagina - 1)}
          rel="prev"
          className={`${paso} ${activo}`}
        >
          ← Anterior
        </Link>
      ) : (
        <span className={`${paso} ${inerte}`}>← Anterior</span>
      )}

      <span className="text-sm text-travertino/55 tabular-nums">
        Página {pagina} de {ultima}
      </span>

      {pagina < ultima ? (
        <Link
          href={href(pagina + 1)}
          rel="next"
          className={`${paso} ${activo}`}
        >
          Siguiente →
        </Link>
      ) : (
        <span className={`${paso} ${inerte}`}>Siguiente →</span>
      )}
    </nav>
  );
}

type ChipsProps<T extends string> = {
  leyenda: string;
  activo: T | undefined;
  opciones: { valor: T; etiqueta: string }[];
  href: (valor: T | undefined) => string;
};

/** Filtros como enlaces y no como botones: así funcionan Cmd+clic y el medio. */
function Chips<T extends string>({
  leyenda,
  activo,
  opciones,
  href,
}: ChipsProps<T>) {
  const clase = (seleccionado: boolean) =>
    [
      "flex min-h-11 items-center rounded-sm border px-4 text-sm",
      "transition-[background-color,border-color,color] duration-150",
      seleccionado
        ? "border-dorado bg-dorado/25 text-travertino"
        : "border-dorado/20 text-travertino/60 hover:border-dorado/50 hover:text-travertino",
    ].join(" ");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inscripcion basis-full text-[0.58rem] text-dorado/65 sm:w-24 sm:basis-auto">
        {leyenda}
      </span>
      <Link href={href(undefined)} className={clase(activo === undefined)}>
        Todas
      </Link>
      {opciones.map((opcion) => (
        <Link
          key={opcion.valor}
          href={href(opcion.valor)}
          aria-current={activo === opcion.valor ? "true" : undefined}
          className={clase(activo === opcion.valor)}
        >
          {opcion.etiqueta}
        </Link>
      ))}
    </div>
  );
}
