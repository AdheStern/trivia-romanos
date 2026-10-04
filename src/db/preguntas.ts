import type { Dificultad, Opcion, Pregunta, Similar, Tipo } from "@/lib/tipos";
import type { EntradaPregunta } from "@/lib/validacion";
import { sql } from "./client";
import { normalizarEnunciado } from "./normalizar";

type Fila = {
  id: string;
  tipo: Tipo;
  dificultad: Dificultad;
  enunciado: string;
  referencia: string | null;
  opciones: Opcion[] | null;
  respuesta_numerica: string | null;
  unidad: string | null;
  creado_en: Date;
};

// postgres.js devuelve `numeric` como string para no perder precisión, así que
// la conversión a número es explícita.
function aPregunta(fila: Fila): Pregunta {
  return {
    id: fila.id,
    tipo: fila.tipo,
    dificultad: fila.dificultad,
    enunciado: fila.enunciado,
    referencia: fila.referencia,
    opciones: fila.opciones ?? [],
    respuestaNumerica:
      fila.respuesta_numerica === null ? null : Number(fila.respuesta_numerica),
    unidad: fila.unidad,
    creadoEn: fila.creado_en.toISOString(),
  };
}

/** Código de Postgres para violación de índice único. */
export const CODIGO_DUPLICADO = "23505";

export type Filtros = {
  tipo?: Tipo;
  dificultad?: Dificultad;
  busqueda?: string;
};

/** Arma el WHERE una sola vez para que el listado y el conteo no se desfasen. */
function condicionesDe(filtros: Filtros) {
  const condiciones = [];
  if (filtros.tipo) condiciones.push(sql`tipo = ${filtros.tipo}`);
  if (filtros.dificultad)
    condiciones.push(sql`dificultad = ${filtros.dificultad}`);

  const busqueda = filtros.busqueda
    ? normalizarEnunciado(filtros.busqueda)
    : "";
  if (busqueda) {
    condiciones.push(sql`enunciado_norm like ${`%${busqueda}%`}`);
  }

  return condiciones.length
    ? sql`where ${condiciones.reduce((previo, actual) => sql`${previo} and ${actual}`)}`
    : sql``;
}

export type Pagina = {
  limite?: number;
  desplazamiento?: number;
};

export async function listarPreguntas(
  filtros: Filtros = {},
  pagina: Pagina = {},
): Promise<Pregunta[]> {
  const filtro = condicionesDe(filtros);
  const limite = pagina.limite ? sql`limit ${pagina.limite}` : sql``;
  const salto = pagina.desplazamiento
    ? sql`offset ${pagina.desplazamiento}`
    : sql``;

  const filas = await sql<Fila[]>`
    select id, tipo, dificultad, enunciado, referencia, opciones,
           respuesta_numerica, unidad, creado_en
    from preguntas
    ${filtro}
    order by creado_en desc
    ${limite} ${salto}
  `;
  return filas.map(aPregunta);
}

export async function contarPreguntas(filtros: Filtros = {}): Promise<number> {
  const [fila] = await sql<{ total: number }[]>`
    select count(*)::int as total from preguntas ${condicionesDe(filtros)}
  `;
  return fila.total;
}

/** Todo el banco de una vez: la trivia lo carga al entrar y después corre sin red. */
export async function obtenerBanco(): Promise<Pregunta[]> {
  const filas = await sql<Fila[]>`
    select id, tipo, dificultad, enunciado, referencia, opciones,
           respuesta_numerica, unidad, creado_en
    from preguntas
    order by creado_en asc
  `;
  return filas.map(aPregunta);
}

export async function obtenerPregunta(id: string): Promise<Pregunta | null> {
  const filas = await sql<Fila[]>`
    select id, tipo, dificultad, enunciado, referencia, opciones,
           respuesta_numerica, unidad, creado_en
    from preguntas
    where id = ${id}::uuid
  `;
  const fila = filas.at(0);
  return fila ? aPregunta(fila) : null;
}

export async function contarPorCategoria(): Promise<Record<string, number>> {
  const filas = await sql<
    { tipo: Tipo; dificultad: Dificultad; total: number }[]
  >`
    select tipo, dificultad, count(*)::int as total
    from preguntas
    group by tipo, dificultad
  `;
  return Object.fromEntries(
    filas.map((fila) => [`${fila.tipo}:${fila.dificultad}`, fila.total]),
  );
}

type FilaSimilar = {
  id: string;
  enunciado: string;
  tipo: Tipo;
  dificultad: Dificultad;
  similitud: number;
};

/**
 * Preguntas parecidas a un enunciado. Combina similitud trigram con contención
 * en ambos sentidos, porque dos enunciados de largo muy distinto puntúan bajo
 * en `similarity` aunque uno contenga al otro.
 */
export async function buscarSimilares(
  enunciado: string,
  excluirId?: string,
): Promise<Similar[]> {
  const norm = normalizarEnunciado(enunciado);
  if (norm.length < 6) return [];

  const excluir = excluirId ?? null;
  const filas = await sql<FilaSimilar[]>`
    select id, enunciado, tipo, dificultad,
           greatest(
             similarity(enunciado_norm, ${norm}),
             word_similarity(${norm}, enunciado_norm)
           )::float8 as similitud
    from preguntas
    where (
        similarity(enunciado_norm, ${norm}) >= 0.3
        or enunciado_norm like ${`%${norm}%`}
        or ${norm} like concat('%', enunciado_norm, '%')
      )
      and (${excluir}::uuid is null or id <> ${excluir}::uuid)
    order by similitud desc
    limit 5
  `;
  return filas.map((fila) => ({ ...fila, similitud: Number(fila.similitud) }));
}

function campos(entrada: EntradaPregunta) {
  const esOpciones = entrada.tipo === "opcion_multiple";
  return {
    tipo: entrada.tipo,
    dificultad: entrada.dificultad,
    enunciado: entrada.enunciado,
    enunciado_norm: normalizarEnunciado(entrada.enunciado),
    referencia: entrada.referencia || null,
    // sql.json y no JSON.stringify: postgres.js vuelve a codificar un string,
    // y la columna terminaría guardando un escalar JSON en vez de un arreglo.
    opciones: sql.json(esOpciones ? entrada.opciones : []),
    respuesta_numerica: esOpciones ? null : entrada.respuestaNumerica,
    unidad: esOpciones ? null : entrada.unidad || null,
  };
}

export async function crearPregunta(entrada: EntradaPregunta): Promise<string> {
  const [fila] = await sql<{ id: string }[]>`
    insert into preguntas ${sql(campos(entrada))}
    returning id
  `;
  return fila.id;
}

export async function actualizarPregunta(
  id: string,
  entrada: EntradaPregunta,
): Promise<boolean> {
  const filas = await sql<{ id: string }[]>`
    update preguntas
    set ${sql({ ...campos(entrada), actualizado_en: new Date() })}
    where id = ${id}::uuid
    returning id
  `;
  return filas.length > 0;
}

export async function eliminarPregunta(id: string): Promise<boolean> {
  const filas = await sql<{ id: string }[]>`
    delete from preguntas where id = ${id}::uuid returning id
  `;
  return filas.length > 0;
}
