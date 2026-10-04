// Aplica src/db/schema.sql a la base apuntada por DATABASE_URL.
//   pnpm db:push
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

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
  const esquema = await readFile(join(raiz, "src/db/schema.sql"), "utf8");
  await sql.unsafe(esquema);
  console.log("Esquema aplicado.\n");

  const [extension] = await sql`
    select extname from pg_extension where extname = 'pg_trgm'
  `;
  const tipos = await sql`
    select typname from pg_type
    where typname in ('tipo_pregunta', 'nivel')
    order by typname
  `;
  const indices = await sql`
    select indexname from pg_indexes
    where tablename = 'preguntas'
    order by indexname
  `;
  const columnas = await sql`
    select column_name, data_type from information_schema.columns
    where table_name = 'preguntas'
    order by ordinal_position
  `;
  const [{ total }] = await sql`select count(*)::int as total from preguntas`;

  console.log(`extensión   ${extension ? extension.extname : "FALTA pg_trgm"}`);
  console.log(
    `tipos       ${tipos.map((t) => t.typname).join(", ") || "ninguno"}`,
  );
  console.log(`tabla       preguntas (${columnas.length} columnas)`);
  for (const col of columnas) {
    console.log(`            · ${col.column_name} ${col.data_type}`);
  }
  console.log(`índices     ${indices.map((i) => i.indexname).join(", ")}`);
  console.log(`preguntas   ${total}`);
} catch (error) {
  console.error("\nFalló la migración:");
  console.error(error.message ?? error);
  process.exitCode = 1;
} finally {
  await sql.end();
}
