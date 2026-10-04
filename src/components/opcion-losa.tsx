"use client";

import { Laurel } from "./laurel";

export type EstadoLosa =
  /** Todavía no se respondió. */
  | "inerte"
  /** La eligieron y era la correcta. */
  | "acertada"
  /** La eligieron y era la equivocada. */
  | "fallada"
  /** No la eligieron, pero era la correcta. */
  | "correcta"
  /** No la eligieron y no era la correcta. */
  | "descartada";

type Props = {
  letra: string;
  texto: string;
  estado: EstadoLosa;
  /** Tamaño de letra ya resuelto por la ronda según el largo de las opciones. */
  tamano: string;
  onElegir: () => void;
};

const SUPERFICIE: Record<EstadoLosa, string> = {
  inerte:
    "marmol tallado filete hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-16px_rgb(0,0,0,0.85)]",
  acertada: "tallado",
  fallada: "tallado",
  correcta: "tallado",
  descartada: "marmol marmol-b opacity-50",
};

/* La correcta se llena de verdigris igual que la equivocada se llena de
   pórfido: a diez metros un aro fino no se ve, un bloque de color sí. */
const VERDE =
  "linear-gradient(165deg, #6aa184 0%, var(--color-verdigris) 52%, #274033 100%)";
const ROJO =
  "linear-gradient(165deg, var(--color-porfido-2) 0%, var(--color-porfido) 55%, var(--color-tirio-2) 100%)";

const FONDO: Partial<Record<EstadoLosa, string>> = {
  acertada: VERDE,
  correcta: VERDE,
  fallada: ROJO,
};

const BORDE: Partial<Record<EstadoLosa, string>> = {
  acertada: "var(--color-verdigris-2)",
  correcta: "var(--color-verdigris-2)",
  fallada: "var(--color-porfido-2)",
};

export function OpcionLosa({ letra, texto, estado, tamano, onElegir }: Props) {
  const respondida = estado !== "inerte";
  const rellena =
    estado === "acertada" || estado === "correcta" || estado === "fallada";

  return (
    <button
      type="button"
      onClick={onElegir}
      disabled={respondida}
      aria-pressed={estado === "acertada" || estado === "fallada"}
      className={[
        "group relative flex w-full items-center gap-[1.4vw] overflow-hidden",
        "rounded-sm px-[1.6vw] py-[1.6vh] text-left",
        "transition-[transform,box-shadow,opacity] duration-200 ease-out",
        "disabled:cursor-default",
        SUPERFICIE[estado],
      ].join(" ")}
      style={{
        backgroundImage: FONDO[estado],
        outline: BORDE[estado] ? `4px solid ${BORDE[estado]}` : undefined,
        outlineOffset: BORDE[estado] ? "-4px" : undefined,
      }}
    >
      {/* Letra entallada en un recuadro hundido, como en una inscripción. */}
      <span
        aria-hidden="true"
        className={[
          "inscripcion flex shrink-0 items-center justify-center rounded-[2px]",
          "leading-none",
          rellena
            ? "bg-black/25 text-carrara"
            : "bg-black/[0.07] text-dorado-3",
        ].join(" ")}
        style={{
          height: `calc(${tamano} * 1.7)`,
          width: `calc(${tamano} * 1.7)`,
          fontSize: `calc(${tamano} * 0.86)`,
          boxShadow:
            "inset 0 1px 3px rgb(0 0 0 / 0.45), inset 0 -1px 0 rgb(255 255 255 / 0.25)",
          letterSpacing: 0,
        }}
      >
        {letra}
      </span>

      <span
        className={[
          "min-w-0 flex-1 break-words leading-[1.22]",
          rellena ? "text-carrara" : "text-tinta",
        ].join(" ")}
        style={{ fontSize: tamano }}
      >
        {texto}
      </span>

      {estado === "acertada" ? (
        <Laurel
          className="brota shrink-0 text-carrara"
          style={{
            height: `calc(${tamano} * 1.6)`,
            width: `calc(${tamano} * 1.6)`,
          }}
        />
      ) : null}

      {estado === "correcta" ? (
        <span
          className="inscripcion shrink-0 rounded-[2px] bg-black/25 px-[0.9vw] py-[0.6vh] text-carrara"
          style={{ fontSize: `calc(${tamano} * 0.46)` }}
        >
          Era esta
        </span>
      ) : null}

      {estado === "fallada" ? <Fisura /> : null}
    </button>
  );
}

/** La grieta que recorre la piedra equivocada. */
function Fisura() {
  return (
    <svg
      viewBox="0 0 200 40"
      preserveAspectRatio="none"
      className="fisura pointer-events-none absolute inset-0 h-full w-full text-black/45"
      style={{ transformBox: "fill-box", transformOrigin: "center" }}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M0 22 L28 17 L44 25 L76 12 L98 24 L132 15 L158 27 L182 18 L200 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
