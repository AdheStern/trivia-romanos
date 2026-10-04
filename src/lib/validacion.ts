import { z } from "zod";
import { DIFICULTADES, MAX_OPCIONES, MIN_OPCIONES, TIPOS } from "./tipos";

const opcionSchema = z.object({
  texto: z
    .string()
    .trim()
    .min(1, "Escribe el texto de la opción.")
    .max(400, "Opción demasiado larga."),
  correcta: z.boolean(),
});

export const preguntaSchema = z
  .object({
    tipo: z.enum(TIPOS),
    dificultad: z.enum(DIFICULTADES),
    enunciado: z
      .string()
      .trim()
      .min(10, "El enunciado necesita al menos 10 caracteres.")
      .max(600, "El enunciado no puede pasar de 600 caracteres."),
    referencia: z
      .string()
      .trim()
      .max(80, "Referencia demasiado larga.")
      .nullable(),
    opciones: z.array(opcionSchema).max(MAX_OPCIONES, "Demasiadas opciones."),
    respuestaNumerica: z.number().finite("Tiene que ser un número.").nullable(),
    unidad: z.string().trim().max(40, "Unidad demasiado larga.").nullable(),
  })
  .superRefine((valor, ctx) => {
    if (valor.tipo === "opcion_multiple") {
      if (valor.opciones.length < MIN_OPCIONES) {
        ctx.addIssue({
          code: "custom",
          path: ["opciones"],
          message: "Hacen falta al menos dos opciones.",
        });
      }
      if (valor.opciones.filter((opcion) => opcion.correcta).length !== 1) {
        ctx.addIssue({
          code: "custom",
          path: ["opciones"],
          message: "Marca exactamente una opción como correcta.",
        });
      }
      const vistas = new Set<string>();
      for (const opcion of valor.opciones) {
        const clave = opcion.texto.toLowerCase();
        if (vistas.has(clave)) {
          ctx.addIssue({
            code: "custom",
            path: ["opciones"],
            message: "Hay dos opciones con el mismo texto.",
          });
          break;
        }
        vistas.add(clave);
      }
      return;
    }

    if (valor.respuestaNumerica === null) {
      ctx.addIssue({
        code: "custom",
        path: ["respuestaNumerica"],
        message: "Escribe la respuesta numérica.",
      });
    }
  });

export type EntradaPregunta = z.infer<typeof preguntaSchema>;

/** Errores por campo, en la forma que consume el formulario. */
export type ErroresCampo = Partial<Record<keyof EntradaPregunta, string>>;

export function erroresPorCampo(error: z.ZodError): ErroresCampo {
  const errores: ErroresCampo = {};
  for (const issue of error.issues) {
    const campo = issue.path[0];
    if (typeof campo === "string" && !(campo in errores)) {
      errores[campo as keyof EntradaPregunta] = issue.message;
    }
  }
  return errores;
}
