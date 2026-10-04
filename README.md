# Trivia de Romanos

App para una competencia en vivo sobre la epístola de Pablo a los Romanos. Un
operador maneja el laptop conectado al proyector y la sala ve la pregunta en
grande.

## Cómo se juega

Al entrar a `/jugar` aparece un tablero con **seis categorías**: opción múltiple
y aproximación, cada una en básico, intermedio y avanzado.

- **Opción múltiple** — el operador hace click en la opción que eligió el grupo.
  Si acierta, la losa se enciende en verdigris con un laurel; si falla, se
  oscurece en pórfido y se señala cuál era la correcta.
- **Aproximación** — los grupos dicen su número en voz alta. Nada de la
  respuesta se dibuja hasta que el operador revela, y entonces los tambores de
  bronce ruedan hasta el número.

Ninguna pregunta se repite dentro de una sesión. El progreso sobrevive a un
refresh accidental.

### Atajos de teclado

| Tecla | Acción |
|---|---|
| `1`–`9`, `A`–`H` | Elegir una opción |
| `R` | Revelar la respuesta de aproximación |
| `Enter` / `Espacio` | Siguiente pregunta de la categoría |
| `Esc` | Volver al tablero |
| `F` | Pantalla completa |

Todo lo anterior existe también como botón.

## Banco de preguntas

`/admin` pide un código de 8 dígitos. Desde ahí se cargan, corrigen y borran
preguntas, con filtros por tipo y dificultad, búsqueda que ignora acentos, un
botón para **verificar si una pregunta ya existe** (similitud por trigramas) y
**«Guardar y seguir creando»**, que deja el formulario en blanco pero mantiene
pegados tipo y dificultad para cargar de a tandas.

## Puesta en marcha

```bash
pnpm install
cp .env.example .env    # y pegá la cadena real de Supabase
pnpm db:push            # crea la tabla, los tipos y los índices
pnpm dev
```

| Script | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm db:push` | Aplica `src/db/schema.sql` (es idempotente) |
| `pnpm lint` | Biome |
| `pnpm typecheck` | `next typegen` + `tsc --noEmit` |

## Cómo está armado

Next.js 16 (App Router), React 19, Tailwind v4 CSS-first, TypeScript estricto y
Biome. Se habla a Postgres directo con `postgres` (postgres.js) desde el
servidor; no hace falta el SDK de Supabase ni una anon key.

- `src/db/` — cliente, esquema y consultas
- `src/lib/` — tipos compartidos, validación con zod y la reja del CRUD
- `src/app/jugar/` — el escenario proyectado
- `src/app/admin/` — el CRUD
- `src/components/` — arco, odómetro, losas y tabletas (SVG y CSS, sin imágenes
  externas: funciona sin internet durante el evento)

El banco se lee una sola vez al entrar a `/jugar` y de ahí en más la trivia
corre en el cliente, a propósito: si se cae la red en medio de la competencia,
el juego sigue.
