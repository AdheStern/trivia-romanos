/* Rama de laurel: la corona del triunfo. Aparece sólo cuando la respuesta
   elegida es la correcta. Las hojas se calculan sobre una curva cuadrática
   para que queden escalonadas y orientadas con la tangente, como en una rama. */

const HOJAS = 7;

/** Punto y ángulo de la tangente sobre la cuadrática P0→P1→P2. */
function enCurva(t: number) {
  const p0 = { x: 6, y: 50 };
  const p1 = { x: 12, y: 18 };
  const p2 = { x: 48, y: 5 };
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
    angulo:
      (Math.atan2(
        2 * u * (p1.y - p0.y) + 2 * t * (p2.y - p1.y),
        2 * u * (p1.x - p0.x) + 2 * t * (p2.x - p1.x),
      ) *
        180) /
      Math.PI,
  };
}

export function Laurel({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 56 56"
      className={className}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M6 50 Q 12 18 48 5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.9"
      />
      {Array.from({ length: HOJAS }, (_, indice) => {
        const t = 0.16 + (indice / (HOJAS - 1)) * 0.8;
        const { x, y, angulo } = enCurva(t);
        const largo = 11 - indice * 0.7;
        return (
          <g key={t} transform={`translate(${x} ${y}) rotate(${angulo})`}>
            <ellipse
              cx={largo / 2}
              cy={-4.4}
              rx={largo / 2}
              ry="2.9"
              transform="rotate(-34)"
              fill="currentColor"
              opacity="0.95"
            />
            <ellipse
              cx={largo / 2}
              cy={4.4}
              rx={largo / 2}
              ry="2.9"
              transform="rotate(34)"
              fill="currentColor"
              opacity="0.72"
            />
          </g>
        );
      })}
    </svg>
  );
}
