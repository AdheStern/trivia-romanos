"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  DIFICULTADES,
  type Dificultad,
  ETIQUETA_DIFICULTAD,
  ETIQUETA_TIPO,
  LETRAS,
  MAX_OPCIONES,
  MIN_OPCIONES,
  type Pregunta,
  type Similar,
  TIPOS,
  type Tipo,
} from "@/lib/tipos";
import type { ErroresCampo } from "@/lib/validacion";
import { guardarPregunta, verificarDuplicado } from "./acciones";

/**
 * Cada fila lleva un id propio en vez de identificarse por su posición: al
 * quitar una fila del medio, las de abajo conservan su estado y el foco no
 * salta de campo.
 */
type FilaOpcion = {
  id: string;
  texto: string;
};

type Borrador = {
  tipo: Tipo;
  dificultad: Dificultad;
  enunciado: string;
  referencia: string;
  opciones: FilaOpcion[];
  /** Id de la fila marcada como correcta. */
  correcta: string;
  respuestaNumerica: string;
  unidad: string;
};

let contador = 0;
function nuevaFila(texto = ""): FilaOpcion {
  contador += 1;
  return { id: `fila-${contador}`, texto };
}

function borradorVacio(tipo: Tipo, dificultad: Dificultad): Borrador {
  const opciones = [nuevaFila(), nuevaFila(), nuevaFila(), nuevaFila()];
  return {
    tipo,
    dificultad,
    enunciado: "",
    referencia: "",
    opciones,
    correcta: opciones[0].id,
    respuestaNumerica: "",
    unidad: "",
  };
}

function desdePregunta(pregunta: Pregunta): Borrador {
  const vacio = borradorVacio(pregunta.tipo, pregunta.dificultad);
  const opciones =
    pregunta.opciones.length > 0
      ? pregunta.opciones.map((opcion) => nuevaFila(opcion.texto))
      : vacio.opciones;
  const indiceCorrecta = pregunta.opciones.findIndex(
    (opcion) => opcion.correcta,
  );

  return {
    ...vacio,
    enunciado: pregunta.enunciado,
    referencia: pregunta.referencia ?? "",
    opciones,
    correcta: opciones[indiceCorrecta >= 0 ? indiceCorrecta : 0].id,
    respuestaNumerica:
      pregunta.respuestaNumerica === null
        ? ""
        : String(pregunta.respuestaNumerica),
    unidad: pregunta.unidad ?? "",
  };
}

function aEntrada(borrador: Borrador) {
  const esOpciones = borrador.tipo === "opcion_multiple";
  const numero = borrador.respuestaNumerica.trim();
  return {
    tipo: borrador.tipo,
    dificultad: borrador.dificultad,
    enunciado: borrador.enunciado,
    referencia: borrador.referencia.trim() === "" ? null : borrador.referencia,
    opciones: esOpciones
      ? borrador.opciones.map((fila) => ({
          texto: fila.texto,
          correcta: fila.id === borrador.correcta,
        }))
      : [],
    respuestaNumerica: esOpciones || numero === "" ? null : Number(numero),
    unidad:
      esOpciones || borrador.unidad.trim() === "" ? null : borrador.unidad,
  };
}

type Props = {
  /** Presente sólo al editar. */
  inicial?: Pregunta;
};

export function FormularioPregunta({ inicial }: Props) {
  const router = useRouter();
  const [guardando, enviar] = useTransition();
  const [verificando, verificar] = useTransition();

  const [borrador, setBorrador] = useState<Borrador>(() =>
    inicial
      ? desdePregunta(inicial)
      : borradorVacio("opcion_multiple", "basico"),
  );
  const [errores, setErrores] = useState<ErroresCampo>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [similares, setSimilares] = useState<Similar[] | null>(null);
  const [creadas, setCreadas] = useState(0);
  const [sucio, setSucio] = useState(false);

  const resumenRef = useRef<HTMLParagraphElement>(null);
  const enunciadoRef = useRef<HTMLTextAreaElement>(null);

  const editando = Boolean(inicial);
  const esOpciones = borrador.tipo === "opcion_multiple";

  function cambiar(parche: Partial<Borrador>) {
    setBorrador((previo) => ({ ...previo, ...parche }));
    setSucio(true);
    setMensaje(null);
  }

  // Aviso del navegador si hay texto escrito sin guardar.
  useEffect(() => {
    if (!sucio) return;
    const alSalir = (evento: BeforeUnloadEvent) => evento.preventDefault();
    window.addEventListener("beforeunload", alSalir);
    return () => window.removeEventListener("beforeunload", alSalir);
  }, [sucio]);

  // Al fallar la validación, el foco va al resumen del error.
  useEffect(() => {
    if (mensaje) resumenRef.current?.focus();
  }, [mensaje]);

  function guardar(intencion: "seguir" | "salir") {
    enviar(async () => {
      const resultado = await guardarPregunta(aEntrada(borrador), inicial?.id);

      if (!resultado.ok) {
        setErrores(resultado.errores);
        setMensaje(resultado.mensaje);
        return;
      }

      setErrores({});
      setMensaje(null);
      setSucio(false);

      if (editando || intencion === "salir") {
        router.push("/admin");
        return;
      }

      // Seguir creando: formulario en blanco, pero tipo y dificultad quedan
      // pegados porque las preguntas se cargan de a tandas.
      setCreadas((cantidad) => cantidad + 1);
      setBorrador(borradorVacio(borrador.tipo, borrador.dificultad));
      setSimilares(null);
      enunciadoRef.current?.focus();
    });
  }

  function revisarDuplicados() {
    verificar(async () => {
      setSimilares(await verificarDuplicado(borrador.enunciado, inicial?.id));
    });
  }

  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault();
        guardar(editando ? "salir" : "seguir");
      }}
      className="flex flex-col gap-7"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="inscripcion text-[0.95rem] text-travertino">
          {editando ? "Editar pregunta" : "Nueva pregunta"}
        </h1>
        {creadas > 0 ? (
          <p
            aria-live="polite"
            className="text-sm text-verdigris-2 tabular-nums"
          >
            {creadas}{" "}
            {creadas === 1 ? "pregunta guardada" : "preguntas guardadas"} en
            esta sesión
          </p>
        ) : null}
      </div>

      <p
        ref={resumenRef}
        tabIndex={-1}
        aria-live="polite"
        className={
          mensaje
            ? "rounded-sm border border-porfido-2/60 bg-porfido/20 px-4 py-3 text-sm text-carrara"
            : "sr-only"
        }
      >
        {mensaje ?? ""}
      </p>

      <Panel>
        <Segmentos
          leyenda="Tipo de pregunta"
          nombre="tipo"
          valor={borrador.tipo}
          opciones={TIPOS.map((tipo) => ({
            valor: tipo,
            etiqueta: ETIQUETA_TIPO[tipo],
          }))}
          onCambiar={(tipo) => cambiar({ tipo })}
        />

        <Segmentos
          leyenda="Dificultad"
          nombre="dificultad"
          valor={borrador.dificultad}
          opciones={DIFICULTADES.map((nivel) => ({
            valor: nivel,
            etiqueta: ETIQUETA_DIFICULTAD[nivel],
          }))}
          onCambiar={(dificultad) => cambiar({ dificultad })}
        />
      </Panel>

      <Panel>
        <div>
          <label htmlFor="enunciado" className="block text-sm text-tinta-2">
            Enunciado
          </label>
          <textarea
            id="enunciado"
            ref={enunciadoRef}
            name="enunciado"
            value={borrador.enunciado}
            onChange={(evento) => cambiar({ enunciado: evento.target.value })}
            rows={3}
            maxLength={600}
            required
            autoComplete="off"
            placeholder="¿Según Romanos 5:8, cómo demostró Dios su amor…"
            aria-invalid={errores.enunciado ? true : undefined}
            aria-describedby={errores.enunciado ? "enunciado-error" : undefined}
            className={campoClase(Boolean(errores.enunciado))}
          />
          <PieDeCampo id="enunciado-error" error={errores.enunciado}>
            <span className="tabular-nums">
              {borrador.enunciado.length} / 600
            </span>
          </PieDeCampo>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <button
            type="button"
            onClick={revisarDuplicados}
            disabled={verificando || borrador.enunciado.trim().length < 6}
            className="marmol filete rounded-sm px-4 py-2.5 text-sm text-tinta transition-[transform,opacity] duration-200 ease-out hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-45"
          >
            {verificando ? "Buscando…" : "Verificar si ya existe"}
          </button>
          <p className="text-sm text-tinta-2">
            Busca preguntas parecidas en el banco antes de guardar.
          </p>
        </div>

        <Similares resultados={similares} />
      </Panel>

      {esOpciones ? (
        <Panel>
          <fieldset>
            <legend className="text-sm text-tinta-2">
              Opciones{" "}
              <span className="text-tinta/45">(marca la correcta)</span>
            </legend>

            <div
              className="mt-3 flex flex-col gap-2"
              aria-invalid={errores.opciones ? true : undefined}
            >
              {borrador.opciones.map((fila, indice) => (
                <Fila
                  key={fila.id}
                  letra={LETRAS[indice]}
                  texto={fila.texto}
                  esCorrecta={borrador.correcta === fila.id}
                  puedeQuitar={borrador.opciones.length > MIN_OPCIONES}
                  onTexto={(valor) =>
                    cambiar({
                      opciones: borrador.opciones.map((actual) =>
                        actual.id === fila.id
                          ? { ...actual, texto: valor }
                          : actual,
                      ),
                    })
                  }
                  onMarcar={() => cambiar({ correcta: fila.id })}
                  onQuitar={() => {
                    const restantes = borrador.opciones.filter(
                      (actual) => actual.id !== fila.id,
                    );
                    cambiar({
                      opciones: restantes,
                      // Si la que se va era la correcta, la marca pasa a la primera.
                      correcta:
                        borrador.correcta === fila.id
                          ? restantes[0].id
                          : borrador.correcta,
                    });
                  }}
                />
              ))}
            </div>

            <PieDeCampo id="opciones-error" error={errores.opciones} />

            {borrador.opciones.length < MAX_OPCIONES ? (
              <button
                type="button"
                onClick={() =>
                  cambiar({ opciones: [...borrador.opciones, nuevaFila()] })
                }
                className="mt-3 rounded-sm text-sm text-dorado-3 underline decoration-dorado/40 underline-offset-4 transition-colors duration-150 hover:decoration-dorado-3"
              >
                Agregar otra opción
              </button>
            ) : (
              <p className="mt-3 text-sm text-tinta-2">
                Llegaste al máximo de {MAX_OPCIONES} opciones.
              </p>
            )}
          </fieldset>
        </Panel>
      ) : (
        <Panel>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <label htmlFor="respuesta" className="block text-sm text-tinta-2">
                Respuesta numérica
              </label>
              <input
                id="respuesta"
                name="respuesta"
                type="number"
                inputMode="decimal"
                step="any"
                value={borrador.respuestaNumerica}
                onChange={(evento) =>
                  cambiar({ respuestaNumerica: evento.target.value })
                }
                required
                autoComplete="off"
                spellCheck={false}
                placeholder="16…"
                aria-invalid={errores.respuestaNumerica ? true : undefined}
                aria-describedby={
                  errores.respuestaNumerica ? "respuesta-error" : undefined
                }
                className={`${campoClase(Boolean(errores.respuestaNumerica))} tabular-nums`}
              />
              <PieDeCampo
                id="respuesta-error"
                error={errores.respuestaNumerica}
              />
            </div>

            <div>
              <label htmlFor="unidad" className="block text-sm text-tinta-2">
                Unidad <span className="text-tinta/45">(opcional)</span>
              </label>
              <input
                id="unidad"
                name="unidad"
                type="text"
                value={borrador.unidad}
                onChange={(evento) => cambiar({ unidad: evento.target.value })}
                maxLength={40}
                autoComplete="off"
                placeholder="capítulos…"
                className={campoClase(false)}
              />
              <PieDeCampo id="unidad-error" error={errores.unidad} />
            </div>
          </div>
        </Panel>
      )}

      <Panel>
        <div>
          <label htmlFor="referencia" className="block text-sm text-tinta-2">
            Referencia <span className="text-tinta/45">(opcional)</span>
          </label>
          <input
            id="referencia"
            name="referencia"
            type="text"
            value={borrador.referencia}
            onChange={(evento) => cambiar({ referencia: evento.target.value })}
            maxLength={80}
            autoComplete="off"
            placeholder="Romanos 5:8…"
            aria-invalid={errores.referencia ? true : undefined}
            aria-describedby={
              errores.referencia ? "referencia-error" : undefined
            }
            className={campoClase(Boolean(errores.referencia))}
          />
          <PieDeCampo id="referencia-error" error={errores.referencia}>
            <span>Se muestra recién después de revelar la respuesta.</span>
          </PieDeCampo>
        </div>
      </Panel>

      <div className="flex flex-wrap items-center gap-3">
        {editando ? (
          <button type="submit" disabled={guardando} className={BOTON_PRIMARIO}>
            {guardando ? "Guardando…" : "Guardar cambios"}
          </button>
        ) : (
          <>
            <button
              type="submit"
              disabled={guardando}
              className={BOTON_PRIMARIO}
            >
              {guardando ? "Guardando…" : "Guardar y seguir creando"}
            </button>
            <button
              type="button"
              onClick={() => guardar("salir")}
              disabled={guardando}
              className="marmol filete rounded-sm px-5 py-3 text-sm text-tinta transition-[transform,opacity] duration-200 ease-out hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
            >
              Guardar y volver al listado
            </button>
          </>
        )}

        <Link
          href="/admin"
          className="rounded-sm px-2 py-3 text-sm text-travertino/55 underline decoration-travertino/25 underline-offset-4 transition-colors duration-150 hover:text-travertino hover:decoration-travertino/60"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */

const BOTON_PRIMARIO =
  "marmol tallado filete inscripcion rounded-sm px-6 py-3 text-[0.65rem] text-tinta transition-[transform,box-shadow,opacity] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-16px_rgb(0,0,0,0.9)] disabled:translate-y-0 disabled:opacity-60";

function campoClase(conError: boolean): string {
  return [
    "mt-2 block w-full rounded-sm border bg-white/45 px-3 py-2.5 text-tinta",
    "transition-[border-color,background-color] duration-150",
    "placeholder:text-tinta/30 focus:bg-white/70",
    conError ? "border-porfido-2" : "border-tinta/20 focus:border-dorado",
  ].join(" ");
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section className="marmol marmol-panel filete flex flex-col gap-5 rounded-sm px-5 py-5 sm:px-6">
      {children}
    </section>
  );
}

function PieDeCampo({
  id,
  error,
  children,
}: {
  id: string;
  error?: string;
  children?: React.ReactNode;
}) {
  if (!error && !children) return null;
  return (
    <p
      id={id}
      aria-live="polite"
      className="mt-1.5 flex flex-wrap justify-between gap-2 text-sm"
    >
      <span className="text-porfido">{error ?? ""}</span>
      <span className="text-tinta/45">{children}</span>
    </p>
  );
}

type SegmentosProps<T extends string> = {
  leyenda: string;
  nombre: string;
  valor: T;
  opciones: { valor: T; etiqueta: string }[];
  onCambiar: (valor: T) => void;
};

/** Grupo de radios con aspecto de losas. Se evita `<select>` nativo a propósito:
 *  en Windows con tema oscuro hereda colores del sistema. */
function Segmentos<T extends string>({
  leyenda,
  nombre,
  valor,
  opciones,
  onCambiar,
}: SegmentosProps<T>) {
  return (
    <fieldset>
      <legend className="text-sm text-tinta-2">{leyenda}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {opciones.map((opcion) => (
          <label
            key={opcion.valor}
            className="cursor-pointer rounded-sm border border-tinta/20 px-4 py-2 text-sm text-tinta transition-[background-color,border-color] duration-150 has-[:checked]:border-dorado has-[:checked]:bg-dorado/25 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-dorado-3 hover:bg-black/5"
          >
            <input
              type="radio"
              name={nombre}
              value={opcion.valor}
              checked={valor === opcion.valor}
              onChange={() => onCambiar(opcion.valor)}
              className="sr-only"
            />
            {opcion.etiqueta}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

type FilaProps = {
  letra: string;
  texto: string;
  esCorrecta: boolean;
  puedeQuitar: boolean;
  onTexto: (valor: string) => void;
  onMarcar: () => void;
  onQuitar: () => void;
};

/** Fila de opción. La letra tallada hace de indicador del radio. */
function Fila({
  letra,
  texto,
  esCorrecta,
  puedeQuitar,
  onTexto,
  onMarcar,
  onQuitar,
}: FilaProps) {
  const idTexto = `opcion-${letra}`;

  return (
    <div className="flex items-center gap-2">
      <label className="shrink-0 cursor-pointer">
        <input
          type="radio"
          name="correcta"
          checked={esCorrecta}
          onChange={onMarcar}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={[
            "inscripcion flex h-10 w-10 items-center justify-center rounded-sm border text-sm",
            "transition-[background-color,border-color,color] duration-150",
            "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-dorado-3",
            esCorrecta
              ? "border-verdigris bg-verdigris text-carrara"
              : "border-tinta/20 text-tinta-2 hover:bg-black/5",
          ].join(" ")}
          style={{ letterSpacing: 0 }}
        >
          {letra}
        </span>
        <span className="sr-only">
          Marcar la opción {letra} como la correcta
        </span>
      </label>

      <label htmlFor={idTexto} className="sr-only">
        Texto de la opción {letra}
      </label>
      <input
        id={idTexto}
        type="text"
        value={texto}
        onChange={(evento) => onTexto(evento.target.value)}
        maxLength={400}
        autoComplete="off"
        placeholder={`Opción ${letra}…`}
        className="min-w-0 flex-1 rounded-sm border border-tinta/20 bg-white/45 px-3 py-2.5 text-tinta transition-[border-color,background-color] duration-150 placeholder:text-tinta/30 focus:border-dorado focus:bg-white/70"
      />

      <button
        type="button"
        onClick={onQuitar}
        disabled={!puedeQuitar}
        aria-label={`Quitar la opción ${letra}`}
        title={
          puedeQuitar
            ? `Quitar la opción ${letra}`
            : `Hacen falta al menos ${MIN_OPCIONES} opciones`
        }
        className="shrink-0 rounded-sm px-3 py-2.5 text-tinta-2 transition-[color,background-color] duration-150 hover:bg-porfido/15 hover:text-porfido disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-tinta-2"
      >
        <svg
          viewBox="0 0 16 16"
          className="h-4 w-4"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M3 3l10 10M13 3L3 13"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </button>
    </div>
  );
}

function Similares({ resultados }: { resultados: Similar[] | null }) {
  return (
    <div aria-live="polite">
      {resultados === null ? null : resultados.length === 0 ? (
        <p className="rounded-sm border border-verdigris/50 bg-verdigris/10 px-4 py-3 text-sm text-tinta">
          No hay ninguna parecida en el banco.
        </p>
      ) : (
        <div className="rounded-sm border border-dorado/50 bg-dorado/10 px-4 py-3">
          <p className="text-sm text-tinta">
            {resultados.length === 1
              ? "Hay una pregunta parecida:"
              : `Hay ${resultados.length} preguntas parecidas:`}
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {resultados.map((similar) => (
              <li key={similar.id} className="flex items-start gap-3 text-sm">
                <span className="shrink-0 pt-0.5 text-dorado-3 tabular-nums">
                  {Math.round(similar.similitud * 100)}%
                </span>
                <Link
                  href={`/admin/${similar.id}`}
                  className="min-w-0 flex-1 break-words text-tinta underline decoration-tinta/25 underline-offset-4 transition-colors duration-150 hover:decoration-tinta"
                >
                  {similar.enunciado}
                </Link>
                <span className="shrink-0 text-tinta-2">
                  {ETIQUETA_DIFICULTAD[similar.dificultad]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
