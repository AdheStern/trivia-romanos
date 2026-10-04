"use client";

import { useActionState } from "react";
import { Arco } from "@/components/arco";
import { entrar } from "./acciones";

/**
 * La reja: un único código compartido de ocho dígitos. No hay usuarios ni
 * contraseñas porque no es un sistema crítico; el chequeo que importa está
 * dentro de cada server action.
 */
export function Puerta() {
  const [estado, enviar, enviando] = useActionState(entrar, { error: null });

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-16">
      <Arco className="w-full">
        <form action={enviar} className="px-[9%] pt-[15%] pb-[8%] text-center">
          <h1 className="inscripcion text-tinta text-[clamp(1.05rem,4vw,1.6rem)] leading-tight">
            Banco de preguntas
          </h1>

          <label htmlFor="codigo" className="mt-8 block text-sm text-tinta-2">
            Código de acceso
          </label>

          <input
            id="codigo"
            name="codigo"
            type="text"
            inputMode="numeric"
            pattern="\d{8}"
            maxLength={8}
            required
            autoComplete="off"
            spellCheck={false}
            // Único campo de una pantalla dedicada, en escritorio: enfocarlo es
            // lo que espera quien llega acá.
            // biome-ignore lint/a11y/noAutofocus: pantalla de un solo campo
            autoFocus
            placeholder="········"
            aria-describedby={estado.error ? "codigo-error" : undefined}
            aria-invalid={estado.error ? true : undefined}
            className="mx-auto mt-3 block w-full max-w-[14rem] rounded-sm border border-tinta/20 bg-white/45 px-4 py-3 text-center text-[1.6rem] tracking-[0.42em] text-tinta tabular-nums transition-[border-color,background-color] duration-150 placeholder:text-tinta/25 focus:border-dorado focus:bg-white/70"
          />

          <p
            id="codigo-error"
            aria-live="polite"
            className="mt-3 min-h-[1.25rem] text-sm text-porfido"
          >
            {estado.error ?? ""}
          </p>

          <button
            type="submit"
            disabled={enviando}
            className="marmol tallado filete inscripcion mt-4 rounded-sm px-8 py-3 text-[0.68rem] text-tinta transition-[transform,box-shadow,opacity] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-16px_rgb(0,0,0,0.9)] disabled:translate-y-0 disabled:opacity-60"
          >
            {enviando ? "Verificando…" : "Entrar"}
          </button>
        </form>
      </Arco>
    </main>
  );
}
