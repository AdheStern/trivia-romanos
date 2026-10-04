-- Esquema de la trivia de Romanos. Idempotente: se puede correr de nuevo.

create extension if not exists pg_trgm;

do $do$ begin
  create type tipo_pregunta as enum ('opcion_multiple', 'aproximacion');
exception
  when duplicate_object then null;
end $do$;

do $do$ begin
  create type nivel as enum ('basico', 'intermedio', 'avanzado');
exception
  when duplicate_object then null;
end $do$;

create table if not exists preguntas (
  id                 uuid primary key default gen_random_uuid(),
  tipo               tipo_pregunta not null,
  dificultad         nivel not null,
  enunciado          text not null,
  -- Forma canónica del enunciado (sin acentos ni puntuación). El índice único
  -- de abajo es la red de seguridad real contra preguntas duplicadas.
  enunciado_norm     text not null,
  referencia         text,
  -- [{ "texto": "…", "correcta": true }] — sólo para opción múltiple.
  opciones           jsonb not null default '[]'::jsonb,
  -- Sólo para aproximación.
  respuesta_numerica numeric,
  unidad             text,
  creado_en          timestamptz not null default now(),
  actualizado_en     timestamptz not null default now(),
  constraint mc_valida check (
    tipo <> 'opcion_multiple' or jsonb_array_length(opciones) >= 2
  ),
  constraint aprox_valida check (
    tipo <> 'aproximacion' or respuesta_numerica is not null
  )
);

create unique index if not exists preguntas_norm_key
  on preguntas (enunciado_norm);

create index if not exists preguntas_norm_trgm
  on preguntas using gin (enunciado_norm gin_trgm_ops);

create index if not exists preguntas_bucket
  on preguntas (tipo, dificultad);
