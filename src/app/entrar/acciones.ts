"use server";

import { redirect } from "next/navigation";
import { abrirSesion, codigoValido } from "@/lib/admin-sesion";

export type EstadoPuerta = { error: string | null };

export async function entrar(
  _previo: EstadoPuerta,
  formData: FormData,
): Promise<EstadoPuerta> {
  const codigo = String(formData.get("codigo") ?? "");

  if (!/^\d{8}$/.test(codigo)) {
    return { error: "El código son 8 dígitos." };
  }
  if (!codigoValido(codigo)) {
    return { error: "Código incorrecto. Intenta de nuevo." };
  }

  await abrirSesion();
  redirect("/admin");
}
