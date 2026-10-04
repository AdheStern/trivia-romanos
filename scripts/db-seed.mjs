// Carga el banco inicial de preguntas desde scripts/preguntas-iniciales.json.
//   pnpm db:seed
//
// Es idempotente: las preguntas que ya existen se saltean gracias al índice
// único sobre enunciado_norm, así que se puede correr de nuevo sin duplicar.
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

// Espejo de normalizarEnunciado() en src/db/normalizar.ts. Se repite acá porque
// este script corre en node suelto y no puede importar TypeScript; si se cambia
// una, hay que cambiar la otra.
function normalizarEnunciado(enunciado) {
  return enunciado
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL. Revisa el archivo .env.");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, {
  ssl: "require",
  prepare: false,
  max: 1,
});

try {
  const crudas = JSON.parse(
    await readFile(join(raiz, "scripts/preguntas-iniciales.json"), "utf8"),
  );

  // Se valida antes de tocar la base: una pregunta mal armada frena todo el
  // lote en vez de dejar el banco a medio cargar.
  const vistos = new Map();
  crudas.forEach((pregunta, indice) => {
    const donde = `preguntas-iniciales.json[${indice}]`;
    if (!pregunta.enunciado || pregunta.enunciado.trim().length < 10) {
      throw new Error(`${donde}: enunciado vacío o demasiado corto`);
    }
    if (!Array.isArray(pregunta.opciones) || pregunta.opciones.length < 2) {
      throw new Error(`${donde}: hacen falta al menos 2 opciones`);
    }
    if (
      !Number.isInteger(pregunta.correcta) ||
      pregunta.correcta < 0 ||
      pregunta.correcta >= pregunta.opciones.length
    ) {
      throw new Error(`${donde}: "correcta" fuera de rango`);
    }
    const norm = normalizarEnunciado(pregunta.enunciado);
    if (vistos.has(norm)) {
      throw new Error(
        `${donde}: repite el enunciado de [${vistos.get(norm)}]\n  ${pregunta.enunciado}`,
      );
    }
    vistos.set(norm, indice);
  });

  let agregadas = 0;
  let salteadas = 0;

  for (const pregunta of crudas) {
    const filas = await sql`
      insert into preguntas ${sql({
        tipo: "opcion_multiple",
        dificultad: pregunta.dificultad ?? "basico",
        enunciado: pregunta.enunciado,
        enunciado_norm: normalizarEnunciado(pregunta.enunciado),
        referencia: pregunta.referencia ?? null,
        // sql.json y no JSON.stringify: postgres.js vuelve a codificar un
        // string y la columna terminaría con un escalar en vez de un arreglo.
        opciones: sql.json(
          pregunta.opciones.map((texto, indice) => ({
            texto,
            correcta: indice === pregunta.correcta,
          })),
        ),
      })}
      on conflict (enunciado_norm) do nothing
      returning id
    `;
    if (filas.length > 0) agregadas += 1;
    else salteadas += 1;
  }

  const porCategoria = await sql`
    select tipo, dificultad, count(*)::int as total
    from preguntas
    group by tipo, dificultad
    order by tipo, dificultad
  `;
  const [{ total }] = await sql`select count(*)::int as total from preguntas`;

  console.log(`agregadas   ${agregadas}`);
  console.log(`ya estaban  ${salteadas}`);
  console.log("");
  for (const fila of porCategoria) {
    console.log(`  ${fila.tipo}/${fila.dificultad} = ${fila.total}`);
  }
  console.log(`\ntotal en el banco ${total}`);
} catch (error) {
  console.error("\nFalló la carga:");
  console.error(error.message ?? error);
  process.exitCode = 1;
} finally {
  await sql.end();
}
