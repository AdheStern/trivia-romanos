/**
 * Barajado determinista a partir de un identificador.
 *
 * Al escribir preguntas uno tiende a poner la correcta primero, y en el banco
 * inicial la opción A era la correcta el 57% de las veces: un grupo que se
 * diera cuenta acertaba más de la mitad sin saber nada. Barajar al mostrar lo
 * corrige también para las preguntas que se carguen después.
 *
 * Es determinista a propósito, con el id de la pregunta como semilla: el orden
 * no cambia entre renders ni al refrescar, así el índice de la opción elegida
 * que viaja en la URL sigue apuntando a la misma opción.
 */

/** Hash FNV-1a: estable, rápido y suficiente para sembrar el generador. */
function semillaDe(texto: string): number {
  let hash = 2166136261;
  for (let i = 0; i < texto.length; i += 1) {
    hash ^= texto.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** xorshift32: un generador chico y reproducible. */
function generador(semilla: number): () => number {
  let estado = semilla || 0x9e3779b9;
  return () => {
    estado ^= estado << 13;
    estado >>>= 0;
    estado ^= estado >>> 17;
    estado ^= estado << 5;
    estado >>>= 0;
    return estado / 0x100000000;
  };
}

export function barajarCon<T>(items: readonly T[], clave: string): T[] {
  const copia = [...items];
  const azar = generador(semillaDe(clave));
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(azar() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
