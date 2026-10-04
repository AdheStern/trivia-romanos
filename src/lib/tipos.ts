export const TIPOS = ["opcion_multiple", "aproximacion"] as const;
export type Tipo = (typeof TIPOS)[number];

export const DIFICULTADES = ["basico", "intermedio", "avanzado"] as const;
export type Dificultad = (typeof DIFICULTADES)[number];

export type Opcion = {
  texto: string;
  correcta: boolean;
};

export type Pregunta = {
  id: string;
  tipo: Tipo;
  dificultad: Dificultad;
  enunciado: string;
  referencia: string | null;
  opciones: Opcion[];
  respuestaNumerica: number | null;
  unidad: string | null;
  creadoEn: string;
};

export type Similar = {
  id: string;
  enunciado: string;
  tipo: Tipo;
  dificultad: Dificultad;
  similitud: number;
};

export const ETIQUETA_TIPO: Record<Tipo, string> = {
  opcion_multiple: "Opción múltiple",
  aproximacion: "Aproximación",
};

/** Nombre corto, para las tabletas del tablero. */
export const ETIQUETA_TIPO_CORTA: Record<Tipo, string> = {
  opcion_multiple: "Opciones",
  aproximacion: "Aproximación",
};

export const ETIQUETA_DIFICULTAD: Record<Dificultad, string> = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

/** Las seis categorías elegibles: cada tipo cruzado con cada dificultad. */
export type CategoriaId = `${Tipo}:${Dificultad}`;

export type Categoria = {
  id: CategoriaId;
  tipo: Tipo;
  dificultad: Dificultad;
};

export function categoriaId(tipo: Tipo, dificultad: Dificultad): CategoriaId {
  return `${tipo}:${dificultad}`;
}

export const CATEGORIAS: Categoria[] = TIPOS.flatMap((tipo) =>
  DIFICULTADES.map((dificultad) => ({
    id: categoriaId(tipo, dificultad),
    tipo,
    dificultad,
  })),
);

export function esCategoriaId(valor: string): valor is CategoriaId {
  return CATEGORIAS.some((categoria) => categoria.id === valor);
}

/** A, B, C … para las losas de opción múltiple. */
export const LETRAS = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;

export const MIN_OPCIONES = 2;
export const MAX_OPCIONES = LETRAS.length;

export function formatearNumero(valor: number): string {
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(
    valor,
  );
}
