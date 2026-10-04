import type { CSSProperties, ReactNode } from "react";

/*
 * Radio elíptico del arco. Se dibuja con radios en porcentaje en vez de un path
 * fijo para que estire a cualquier alto de contenido sin que la curva se
 * quiebre. Es un arco rebajado, no de medio punto: los romanos los usaban en
 * puentes y arcos de descarga, y es la proporción que entra en una pantalla
 * apaisada. Lo que lo vuelve romano es el detalle — dovelas, clave, impostas —
 * más que la curvatura.
 */
const CURVA = "50% 50% 6px 6px / 42% 42% 6px 6px";

/* Dovelas: las juntas entre las piedras en cuña, radiando desde el centro del
   arranque. */
const DOVELAS =
  "repeating-conic-gradient(from 186deg at 50% 100%, " +
  "transparent 0deg 4.4deg, rgb(110 82 34 / 0.5) 4.4deg 5deg)";

type Props = {
  children: ReactNode;
  className?: string;
};

export function Arco({ children, className }: Props) {
  return (
    <div
      className={["@container relative", className].filter(Boolean).join(" ")}
      style={{ containerType: "inline-size" }}
    >
      {/* Archivolto: la banda de dovelas. Va detrás del panel, así sólo asoma
          el anillo que queda alrededor. */}
      <div
        aria-hidden="true"
        className="marmol absolute -top-[2.6cqw] -right-[1.7cqw] -left-[1.7cqw] bottom-0 overflow-hidden"
        style={{
          borderRadius: CURVA,
          boxShadow:
            "0 0 0 1px rgb(185 138 60 / 0.55), 0 18px 40px -20px rgb(0 0 0 / 0.95)",
        }}
      >
        <div
          className="absolute inset-0 opacity-80"
          style={{ background: DOVELAS }}
        />
      </div>

      {/* Clave: la cuña que cierra el arco. Monta sobre el archivolto y baja
          hasta morder el panel, que es como asienta una clave de verdad. */}
      <span
        aria-hidden="true"
        className="absolute -top-[4.4cqw] left-1/2 h-[6.6cqw] w-[7.4cqw] -translate-x-1/2"
        style={{
          clipPath: "polygon(21% 0%, 79% 0%, 100% 100%, 0% 100%)",
          background:
            "linear-gradient(177deg, var(--color-dorado-2) 0%, var(--color-dorado) 38%, #8d6a2c 78%, var(--color-dorado-3) 100%)",
          filter: "drop-shadow(0 3px 5px rgb(0 0 0 / 0.45))",
        }}
      />

      {/* Impostas: los bloques salientes donde el arco descansa sobre la pilastra. */}
      <Imposta lado="left" />
      <Imposta lado="right" />

      {/* Panel interior: la cara lisa donde se lee la inscripción. */}
      <div
        className="marmol tallado relative overflow-hidden"
        style={{
          borderRadius: CURVA,
          boxShadow:
            "inset 0 0 0 1px rgb(185 138 60 / 0.4), inset 0 2px 0 0 rgb(255 255 255 / 0.5), inset 0 -4px 8px -3px rgb(201 185 156 / 0.85)",
        }}
      >
        <Acanaladura lado="left" />
        <Acanaladura lado="right" />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}

function Imposta({ lado }: { lado: "left" | "right" }) {
  const estilo = {
    [lado]: "-3.1cqw",
    boxShadow:
      "0 0 0 1px rgb(185 138 60 / 0.5), 0 3px 6px -2px rgb(0 0 0 / 0.55), inset 0 1px 0 rgb(255 255 255 / 0.6)",
  } as CSSProperties;
  return (
    <span
      aria-hidden="true"
      className="marmol marmol-b absolute top-[38%] h-[3.1cqw] w-[5.2cqw] rounded-[2px]"
      style={estilo}
    />
  );
}

/** Acanaladuras: las estrías talladas en el fuste de una pilastra. */
function Acanaladura({ lado }: { lado: "left" | "right" }) {
  const estilo = {
    [lado]: 0,
    background:
      "repeating-linear-gradient(90deg, transparent 0 0.62cqw, rgb(110 82 34 / 0.38) 0.62cqw 0.72cqw)",
    maskImage: "linear-gradient(to bottom, transparent, black 18%)",
  } as CSSProperties;
  return (
    <span
      aria-hidden="true"
      className="absolute top-[40%] bottom-0 w-[3cqw] opacity-55"
      style={estilo}
    />
  );
}
