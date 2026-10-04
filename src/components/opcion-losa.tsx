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
  onElegir: () => void;
};

const SUPERFICIE: Record<EstadoLosa, string> = {
  inerte:
    "marmol tallado filete hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-16px_rgb(0,0,0,0.85)]",
  acertada:
    "marmol tallado outline outline-[3px] -outline-offset-[3px] outline-verdigris",
  fallada:
    "tallado outline outline-[3px] -outline-offset-[3px] outline-porfido-2",
  correcta:
    "marmol tallado outline outline-[3px] -outline-offset-[3px] outline-verdigris",
  descartada: "marmol marmol-b opacity-50",
};

const FONDO: Partial<Record<EstadoLosa, string>> = {
  fallada:
    "linear-gradient(165deg, var(--color-porfido-2) 0%, var(--color-porfido) 55%, var(--color-tirio-2) 100%)",
};

export function OpcionLosa({ letra, texto, estado, onElegir }: Props) {
  const respondida = estado !== "inerte";
  const sobrePiedraOscura = estado === "fallada";

  return (
    <button
      type="button"
      onClick={onElegir}
      disabled={respondida}
      aria-pressed={estado === "acertada" || estado === "fallada"}
      className={[
        "group relative flex w-full items-center gap-[1.4vw] overflow-hidden",
        "rounded-sm px-[1.6vw] py-[2vh] text-left",
        "transition-[transform,box-shadow,opacity] duration-200 ease-out",
        "disabled:cursor-default",
        SUPERFICIE[estado],
      ].join(" ")}
      style={FONDO[estado] ? { backgroundImage: FONDO[estado] } : undefined}
    >
      {/* Letra entallada en un recuadro hundido, como en una inscripción. */}
      <span
        aria-hidden="true"
        className={[
          "inscripcion flex shrink-0 items-center justify-center rounded-[2px]",
          "h-[4.6vh] w-[4.6vh] text-[clamp(0.9rem,2.2vh,1.7rem)] leading-none",
          sobrePiedraOscura
            ? "bg-black/30 text-travertino/80"
            : "bg-black/[0.07] text-dorado-3",
        ].join(" ")}
        style={{
          boxShadow:
            "inset 0 1px 3px rgb(0 0 0 / 0.45), inset 0 -1px 0 rgb(255 255 255 / 0.25)",
          letterSpacing: 0,
        }}
      >
        {letra}
      </span>

      <span
        className={[
          "min-w-0 flex-1 break-words",
          "text-[clamp(1rem,2.6vh,2.1rem)] leading-[1.25]",
          sobrePiedraOscura ? "text-carrara" : "text-tinta",
        ].join(" ")}
      >
        {texto}
      </span>

      {estado === "acertada" ? (
        <Laurel className="brota h-[4.4vh] w-[4.4vh] shrink-0 text-verdigris" />
      ) : null}

      {estado === "correcta" ? (
        <span className="inscripcion shrink-0 rounded-[2px] bg-verdigris px-[0.9vw] py-[0.8vh] text-[clamp(0.55rem,1.15vh,0.8rem)] text-carrara">
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
