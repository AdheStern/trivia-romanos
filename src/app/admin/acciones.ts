"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  actualizarPregunta,
  buscarSimilares,
  CODIGO_DUPLICADO,
  crearPregunta,
  eliminarPregunta,
} from "@/db/preguntas";
import { cerrarSesion, requerirAdmin } from "@/lib/admin-sesion";
import type { Similar } from "@/lib/tipos";
import {
  type ErroresCampo,
  erroresPorCampo,
  preguntaSchema,
} from "@/lib/validacion";

export async function salir(): Promise<void> {
  await cerrarSesion();
  revalidatePath("/admin");
  redirect("/");
}

export type ResultadoGuardado =
  | { ok: true; id: string }
  | { ok: false; mensaje: string; errores: ErroresCampo };

function esErrorDuplicado(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === CODIGO_DUPLICADO
  );
}

const DUPLICADA =
  "Ya existe una pregunta con ese mismo enunciado. Usa «Verificar si ya existe» para encontrarla.";

export async function guardarPregunta(
  entrada: unknown,
  id?: string,
): Promise<ResultadoGuardado> {
  await requerirAdmin();

  const validado = preguntaSchema.safeParse(entrada);
  if (!validado.success) {
    return {
      ok: false,
      mensaje: "Revisa los campos marcados.",
      errores: erroresPorCampo(validado.error),
    };
  }

  try {
    const guardadoId = id
      ? (await actualizarPregunta(id, validado.data))
        ? id
        : null
      : await crearPregunta(validado.data);

    if (!guardadoId) {
      return { ok: false, mensaje: "Esa pregunta ya no existe.", errores: {} };
    }

    revalidatePath("/admin");
    revalidatePath("/jugar");
    revalidatePath("/");
    return { ok: true, id: guardadoId };
  } catch (error) {
    if (esErrorDuplicado(error)) {
      return {
        ok: false,
        mensaje: DUPLICADA,
        errores: { enunciado: DUPLICADA },
      };
    }
    throw error;
  }
}

export async function verificarDuplicado(
  enunciado: string,
  excluirId?: string,
): Promise<Similar[]> {
  await requerirAdmin();
  return buscarSimilares(enunciado, excluirId);
}

export async function borrarPregunta(id: string): Promise<{ ok: boolean }> {
  await requerirAdmin();
  const borrada = await eliminarPregunta(id);
  revalidatePath("/admin");
  revalidatePath("/jugar");
  revalidatePath("/");
  return { ok: borrada };
}
