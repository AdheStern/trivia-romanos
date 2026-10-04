import type { Dificultad, Tipo } from "@/lib/tipos";
import { ETIQUETA_DIFICULTAD, ETIQUETA_TIPO_CORTA } from "@/lib/tipos";

type Props = {
  tipo: Tipo;
  dificultad: Dificultad;
  restantes: number;
  onElegir: () => void;
};

/* Remate redondeado arriba: una tabula romana, no una tarjeta. */
const REMATE = "46% 46% 4px 4px / 14% 14% 4px 4px";

/**
 * Tableta de piedra: una de las seis categorías elegibles. Cuando se agota
 * queda gastada y deshabilitada, con el motivo a la vista.
 */
export function Tableta({ tipo, dificultad, restantes, onElegir }: Props) {
  const agotada = restantes === 0;

  return (
    <button
      type="button"
      onClick={onElegir}
      disabled={agotada}
      style={{ borderRadius: REMATE }}
      aria-label={`${ETIQUETA_TIPO_CORTA[tipo]}, ${ETIQUETA_DIFICULTAD[dificultad]}. ${
        agotada
          ? "Sin preguntas disponibles."
          : `${restantes} preguntas disponibles.`
      }`}
      className={[
        "group relative flex flex-col items-center justify-center gap-[1.4vh]",
        "min-h-[22vh] px-[2vw] pt-[4vh] pb-[3vh] text-center",
        "transition-[transform,box-shadow,opacity] duration-200 ease-out",
        agotada
          ? "marmol-oscuro cursor-not-allowed opacity-60"
          : "marmol tallado filete hover:-translate-y-1 hover:shadow-[0_22px_44px_-20px_rgb(0,0,0,0.95)]",
      ].join(" ")}
    >
      {/* Moldura interior, como el recuadro rehundido de una lápida. */}
      <span
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-[0.5rem] border",
          agotada ? "border-travertino/15" : "border-dorado/30",
        ].join(" ")}
        style={{ borderRadius: REMATE }}
      />

      <Emblema tipo={tipo} agotada={agotada} />

      <span
        className={[
          "inscripcion relative text-[clamp(1rem,2.6vh,2rem)] leading-none",
          agotada ? "text-travertino/60" : "text-tinta",
        ].join(" ")}
      >
        {ETIQUETA_DIFICULTAD[dificultad]}
      </span>

      <span
        className={[
          "relative text-[clamp(0.68rem,1.4vh,0.95rem)] tabular-nums",
          agotada ? "text-porfido-2" : "text-dorado-3",
        ].join(" ")}
      >
        {agotada ? "ya se usaron todas" : `${restantes} sin usar`}
      </span>
    </button>
  );
}

/**
 * Emblema del tipo de pregunta: losas apiladas para opción múltiple, tambores
 * para aproximación. Codifica el tipo, no decora.
 */
function Emblema({ tipo, agotada }: { tipo: Tipo; agotada: boolean }) {
  const color = agotada ? "text-travertino/40" : "text-dorado";

  if (tipo === "aproximacion") {
    return (
      <svg
        viewBox="0 0 48 24"
        className={`relative h-[2.6vh] w-auto ${color}`}
        aria-hidden="true"
        focusable="false"
      >
        <title>Aproximación</title>
        {[2, 18, 34].map((x) => (
          <g key={x}>
            <rect
              x={x}
              y="2"
              width="12"
              height="20"
              rx="2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <line
              x1={x}
              y1="12"
              x2={x + 12}
              y2="12"
              stroke="currentColor"
              strokeWidth="1.1"
              opacity="0.65"
            />
          </g>
        ))}
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 48 24"
      className={`relative h-[2.6vh] w-auto ${color}`}
      aria-hidden="true"
      focusable="false"
    >
      <title>Opción múltiple</title>
      {[1, 9, 17].map((y, indice) => (
        <rect
          key={y}
          x="2"
          y={y * 1.3}
          width="44"
          height="5"
          rx="1.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          opacity={indice === 1 ? 1 : 0.5}
        />
      ))}
    </svg>
  );
}
