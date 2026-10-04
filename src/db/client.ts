import postgres from "postgres";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("Falta DATABASE_URL. Revisa el archivo .env.");
}

// `ssl: "require"` es lo que acepta el pooler de Supabase sin tener que cargar
// su CA. `prepare: false` es inofensivo en session mode (puerto 5432) y deja la
// puerta abierta a mover la conexión a 6543 (transaction mode) sin romper nada.
function crear() {
  return postgres(url as string, {
    ssl: "require",
    prepare: false,
    max: 3,
  });
}

// Un único pool por proceso: sin esto, el HMR de `next dev` abre una conexión
// nueva en cada recarga hasta agotar el límite del pooler.
const global_ = globalThis as typeof globalThis & {
  __sqlRomanos?: ReturnType<typeof crear>;
};

if (!global_.__sqlRomanos) {
  global_.__sqlRomanos = crear();
}

export const sql = global_.__sqlRomanos;
