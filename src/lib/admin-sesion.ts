import { cookies } from "next/headers";

/**
 * Reja del CRUD. No es un sistema crítico: un solo código compartido, sin
 * usuarios. Lo que sí importa es que `requerirAdmin()` se llame dentro de cada
 * server action, porque las actions son alcanzables por POST directo sin pasar
 * por la interfaz — el chequeo en el layout sólo decide qué se dibuja.
 */
const CODIGO = "25052004";

export const COOKIE = "romanos_admin";

// Token opaco: así el código no queda guardado en el navegador.
const TOKEN = "ingressus-concessus-v1";

const DURACION = 60 * 60 * 8; // ocho horas, de sobra para una jornada de carga

export function codigoValido(codigo: string): boolean {
  return codigo.trim() === CODIGO;
}

export async function sesionActiva(): Promise<boolean> {
  const almacen = await cookies();
  return almacen.get(COOKIE)?.value === TOKEN;
}

export async function abrirSesion(): Promise<void> {
  const almacen = await cookies();
  almacen.set(COOKIE, TOKEN, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: DURACION,
  });
}

export async function cerrarSesion(): Promise<void> {
  const almacen = await cookies();
  almacen.delete(COOKIE);
}

export class NoAutorizado extends Error {
  constructor() {
    super("Sesión de administración vencida. Vuelve a ingresar el código.");
    this.name = "NoAutorizado";
  }
}

export async function requerirAdmin(): Promise<void> {
  if (!(await sesionActiva())) throw new NoAutorizado();
}
