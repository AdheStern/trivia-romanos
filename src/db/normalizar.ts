/**
 * Forma canónica de un enunciado, usada para detectar duplicados: sin acentos,
 * sin puntuación, en minúsculas y con los espacios colapsados. Se calcula acá
 * en vez de como columna generada porque quitar acentos en Postgres exigiría la
 * extensión `unaccent` envuelta en una función IMMUTABLE.
 */
export function normalizarEnunciado(enunciado: string): string {
  return enunciado
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
