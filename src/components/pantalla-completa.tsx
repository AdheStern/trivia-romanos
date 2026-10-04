"use client";

import { useCallback, useEffect, useState } from "react";

/** Alterna pantalla completa. Exportada aparte para el atajo de teclado. */
export async function alternarPantallaCompleta(): Promise<void> {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  } catch {
    // Algunos navegadores la bloquean si el gesto no les parece directo.
    // No es crítico: la trivia se proyecta igual sin pantalla completa.
  }
}

export function BotonPantallaCompleta({ className }: { className?: string }) {
  const [activa, setActiva] = useState(false);

  useEffect(() => {
    const alCambiar = () => setActiva(Boolean(document.fullscreenElement));
    alCambiar();
    document.addEventListener("fullscreenchange", alCambiar);
    return () => document.removeEventListener("fullscreenchange", alCambiar);
  }, []);

  const alternar = useCallback(() => {
    void alternarPantallaCompleta();
  }, []);

  return (
    <button
      type="button"
      onClick={alternar}
      className={[
        "inscripcion rounded-sm px-3 py-1.5 text-[0.62rem] text-dorado-2/75",
        "transition-[color,background-color] duration-150",
        "hover:bg-dorado/15 hover:text-dorado-2",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {activa ? "Salir de pantalla completa" : "Pantalla completa"}
      <span className="ml-2 opacity-60">F</span>
    </button>
  );
}
