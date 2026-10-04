"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import {
  ETIQUETA_DIFICULTAD,
  ETIQUETA_TIPO,
  formatearNumero,
  type Pregunta,
} from "@/lib/tipos";
import { borrarPregunta } from "./acciones";

export function ListaPreguntas({ preguntas }: { preguntas: Pregunta[] }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [objetivo, setObjetivo] = useState<Pregunta | null>(null);
  const [borrando, borrar] = useTransition();
  const [fallo, setFallo] = useState<string | null>(null);

  function pedirBorrado(pregunta: Pregunta) {
    setFallo(null);
    setObjetivo(pregunta);
    dialogo.current?.showModal();
  }

  function cerrar() {
    dialogo.current?.close();
    setObjetivo(null);
  }

  function confirmar() {
    if (!objetivo) return;
    borrar(async () => {
      try {
        await borrarPregunta(objetivo.id);
        cerrar();
      } catch {
        setFallo("No se pudo borrar. Vuelve a intentar.");
      }
    });
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {preguntas.map((pregunta) => (
          <li
            key={pregunta.id}
            className="marmol marmol-panel filete flex flex-wrap items-start gap-x-5 gap-y-3 rounded-sm px-4 py-4 sm:px-5"
          >
            <div className="flex min-w-0 flex-1 basis-full flex-col gap-2 sm:basis-0">
              <p className="min-w-0 break-words text-tinta">
                {pregunta.enunciado}
              </p>

              <p className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-tinta-2">
                <span className="inscripcion text-[0.6rem] text-dorado-3">
                  {ETIQUETA_DIFICULTAD[pregunta.dificultad]}
                </span>
                <span className="interpunto" />
                <span>{ETIQUETA_TIPO[pregunta.tipo]}</span>
                <span className="interpunto" />
                {pregunta.tipo === "opcion_multiple" ? (
                  <span className="tabular-nums">
                    {pregunta.opciones.length} opciones
                  </span>
                ) : (
                  <span className="tabular-nums">
                    respuesta {formatearNumero(pregunta.respuestaNumerica ?? 0)}
                    {pregunta.unidad ? ` ${pregunta.unidad}` : ""}
                  </span>
                )}
                {pregunta.referencia ? (
                  <>
                    <span className="interpunto" />
                    <span className="italic">{pregunta.referencia}</span>
                  </>
                ) : null}
              </p>
            </div>

            <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
              <Link
                href={`/admin/${pregunta.id}`}
                className="flex min-h-11 flex-1 items-center justify-center rounded-sm border border-tinta/20 px-4 text-sm text-tinta transition-colors duration-150 hover:border-tinta/50 sm:flex-none"
              >
                Editar
              </Link>
              <button
                type="button"
                onClick={() => pedirBorrado(pregunta)}
                className="flex min-h-11 flex-1 items-center justify-center rounded-sm border border-transparent px-4 text-sm text-tinta-2 transition-[color,background-color,border-color] duration-150 hover:border-porfido/40 hover:bg-porfido/15 hover:text-porfido sm:flex-none"
              >
                Borrar
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* `<dialog>` nativo: trae el atrapado de foco y el cierre con Esc. */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: el cierre por teclado
          ya lo cubren onCancel (Esc) y el botón Cancelar; el clic en el fondo
          es un atajo de puntero adicional. */}
      <dialog
        ref={dialogo}
        onCancel={(evento) => {
          evento.preventDefault();
          cerrar();
        }}
        onClick={(evento) => {
          // Clic en el fondo, fuera del contenido.
          if (evento.target === dialogo.current) cerrar();
        }}
        aria-labelledby="borrar-titulo"
        className="marmol tallado m-auto w-[min(32rem,calc(100vw-2rem))] rounded-sm px-6 py-6 text-tinta backdrop:bg-black/70"
        style={{ overscrollBehavior: "contain" }}
      >
        <h2 id="borrar-titulo" className="inscripcion text-[0.8rem] text-tinta">
          Borrar esta pregunta
        </h2>

        <p className="mt-4 break-words text-tinta">{objetivo?.enunciado}</p>

        <p className="mt-3 text-sm text-tinta-2">
          Se borra para siempre y no se puede recuperar.
        </p>

        <p
          aria-live="polite"
          className="mt-3 min-h-[1.25rem] text-sm text-porfido"
        >
          {fallo ?? ""}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={confirmar}
            disabled={borrando}
            className="inscripcion flex min-h-11 flex-1 items-center justify-center rounded-sm bg-porfido px-5 text-[0.62rem] text-carrara transition-[background-color,opacity] duration-150 hover:bg-porfido-2 disabled:opacity-60 sm:flex-none"
          >
            {borrando ? "Borrando…" : "Sí, borrar"}
          </button>
          <button
            type="button"
            onClick={cerrar}
            disabled={borrando}
            className="flex min-h-11 flex-1 items-center justify-center rounded-sm border border-tinta/20 px-4 text-sm text-tinta transition-colors duration-150 hover:border-tinta/50 disabled:opacity-60 sm:flex-none"
          >
            Cancelar
          </button>
        </div>
      </dialog>
    </>
  );
}
