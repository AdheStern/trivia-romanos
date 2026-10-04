"use client";

import { useEffect, useState } from "react";

/** `true` si el sistema pide menos movimiento. */
function useQuietud(): boolean {
  const [quieto, setQuieto] = useState(false);

  useEffect(() => {
    const consulta = window.matchMedia("(prefers-reduced-motion: reduce)");
    setQuieto(consulta.matches);
    const alCambiar = (evento: MediaQueryListEvent) =>
      setQuieto(evento.matches);
    consulta.addEventListener("change", alCambiar);
    return () => consulta.removeEventListener("change", alCambiar);
  }, []);

  return quieto;
}

type Props = {
  valor: number;
  unidad?: string | null;
  /** Mientras sea `false` los tambores quedan tapados, listos para revelar. */
  revelado: boolean;
};

/**
 * Marcador análogo: cada dígito es un tambor de bronce en una apertura
 * hundida. Los tambores asientan de izquierda a derecha, así el número se
 * puede ir leyendo mientras se arma.
 */
export function Odometro({ valor, unidad, revelado }: Props) {
  const quieto = useQuietud();
  const [rodando, setRodando] = useState(false);

  // Un frame de retraso para que el navegador registre la posición de partida
  // y la transición tenga de dónde arrancar.
  useEffect(() => {
    if (!revelado) {
      setRodando(false);
      return;
    }
    const cuadro = requestAnimationFrame(() => setRodando(true));
    return () => cancelAnimationFrame(cuadro);
  }, [revelado]);

  const negativo = valor < 0;
  const [entera, decimal = ""] = Math.abs(valor).toString().split(".");
  const digitos = entera.padStart(2, "0").split("");

  return (
    <div className="flex flex-col items-center gap-[2vh]">
      <div
        className="flex items-end gap-[0.5vw]"
        style={{ ["--alto" as string]: "clamp(5rem, 30vh, 20rem)" }}
      >
        {negativo ? <Signo /> : null}

        {digitos.map((digito, indice) => (
          <Tambor
            // La identidad de un tambor es su posición, no el dígito que muestra.
            // biome-ignore lint/suspicious/noArrayIndexKey: identidad posicional
            key={`entera-${indice}`}
            objetivo={Number(digito)}
            posicion={indice}
            rodando={rodando && !quieto}
            revelado={revelado}
            quieto={quieto}
          />
        ))}

        {decimal ? (
          <>
            <span
              aria-hidden="true"
              className="mb-[1.2vh] h-[0.9vh] w-[0.9vh] rounded-full bg-dorado-2"
            />
            {decimal.split("").map((digito, indice) => (
              <Tambor
                // biome-ignore lint/suspicious/noArrayIndexKey: identidad posicional
                key={`decimal-${indice}`}
                objetivo={Number(digito)}
                posicion={digitos.length + indice}
                rodando={rodando && !quieto}
                revelado={revelado}
                quieto={quieto}
                pequeno
              />
            ))}
          </>
        ) : null}
      </div>

      {unidad ? (
        <p className="inscripcion text-[clamp(0.85rem,2.4vh,1.7rem)] text-dorado-2/80">
          {unidad}
        </p>
      ) : null}

      {/* Para lectores de pantalla el número aparece de una sola vez. */}
      <p aria-live="polite" className="sr-only">
        {revelado
          ? `La respuesta es ${new Intl.NumberFormat("es-ES").format(valor)}${unidad ? ` ${unidad}` : ""}.`
          : ""}
      </p>
    </div>
  );
}

function Signo() {
  return (
    <span
      aria-hidden="true"
      className="mb-[4vh] h-[0.5vh] w-[1.6vw] rounded-full bg-dorado-2"
    />
  );
}

type TamborProps = {
  objetivo: number;
  posicion: number;
  rodando: boolean;
  revelado: boolean;
  quieto: boolean;
  pequeno?: boolean;
};

function Tambor({
  objetivo,
  posicion,
  rodando,
  revelado,
  quieto,
  pequeno,
}: TamborProps) {
  // Cuanto más a la derecha, más vueltas y más tarde asienta: el número se lee
  // de izquierda a derecha mientras se va armando.
  const vueltas = 3 + Math.min(posicion, 4);
  const pasos = vueltas * 10 + objetivo;
  const retraso = posicion * 110;
  const duracion = 1150 + posicion * 280;

  const celdas = quieto
    ? [objetivo]
    : Array.from({ length: pasos + 1 }, (_, k) => k % 10);
  const desplazamiento = quieto || !rodando ? 0 : pasos;

  return (
    <span
      className="relative block overflow-hidden rounded-[0.35em] border border-dorado-3/80"
      style={{
        height: "var(--alto)",
        width: pequeno
          ? "calc(var(--alto) * 0.44)"
          : "calc(var(--alto) * 0.62)",
        background:
          "linear-gradient(180deg, #120d08 0%, #3a2a12 22%, #6b5222 50%, #2a1e0c 78%, #0e0a06 100%)",
        boxShadow:
          "inset 0 0.35em 0.6em -0.2em rgb(0 0 0 / 0.95), inset 0 -0.35em 0.6em -0.2em rgb(0 0 0 / 0.95)",
      }}
    >
      <span
        className="absolute inset-x-0 top-0 flex flex-col"
        style={{
          transform: `translateY(calc(-1 * ${desplazamiento} * var(--alto)))`,
          transitionProperty: "transform",
          transitionDuration: `${duracion}ms`,
          transitionDelay: `${retraso}ms`,
          transitionTimingFunction: "cubic-bezier(0.16, 0.9, 0.2, 1)",
        }}
      >
        {celdas.map((digito, indice) => (
          <span
            key={`${indice}-${digito}`}
            className="flex shrink-0 items-center justify-center text-dorado-2"
            style={{
              height: "var(--alto)",
              fontFamily: "var(--font-cuerpo)",
              fontWeight: 600,
              fontSize: pequeno
                ? "calc(var(--alto) * 0.5)"
                : "calc(var(--alto) * 0.68)",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
              textShadow: "0 1px 0 rgb(0 0 0 / 0.8)",
            }}
          >
            {digito}
          </span>
        ))}
      </span>

      {/* La costura del tambor. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/55"
      />

      {/* El brillo que cruza el bronce cuando el dígito asienta. */}
      {revelado && !quieto ? (
        <span
          aria-hidden="true"
          className="destello pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-white/45 to-transparent"
          style={{ ["--retraso" as string]: `${retraso + duracion - 700}ms` }}
        />
      ) : null}
    </span>
  );
}
