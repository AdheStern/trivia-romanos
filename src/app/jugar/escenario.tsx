"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { Arco } from "@/components/arco";
import { Odometro } from "@/components/odometro";
import { type EstadoLosa, OpcionLosa } from "@/components/opcion-losa";
import {
  alternarPantallaCompleta,
  BotonPantallaCompleta,
} from "@/components/pantalla-completa";
import { Tableta } from "@/components/tableta";
import { barajarCon } from "@/lib/barajar";
import {
  CATEGORIAS,
  type CategoriaId,
  categoriaId,
  DIFICULTADES,
  ETIQUETA_DIFICULTAD,
  ETIQUETA_TIPO,
  esCategoriaId,
  LETRAS,
  type Pregunta,
  TIPOS,
} from "@/lib/tipos";

const CLAVE_USADAS = "romanos-trivia:usadas";

/** Una pregunta al azar de la categoría, de entre las que no se usaron. */
function elegirDe(
  banco: Pregunta[],
  categoria: CategoriaId,
  usadas: Set<string>,
): Pregunta | null {
  const candidatas = banco.filter(
    (pregunta) =>
      categoriaId(pregunta.tipo, pregunta.dificultad) === categoria &&
      !usadas.has(pregunta.id),
  );
  if (candidatas.length === 0) return null;
  return candidatas[Math.floor(Math.random() * candidatas.length)];
}

export function Escenario({ banco }: { banco: Pregunta[] }) {
  const router = useRouter();
  const [recargando, recargar] = useTransition();

  const [usadas, setUsadas] = useState<Set<string>>(new Set());
  const [categoria, setCategoria] = useState<CategoriaId | null>(null);
  const [preguntaId, setPreguntaId] = useState<string | null>(null);
  const [elegida, setElegida] = useState<number | null>(null);
  const [revelado, setRevelado] = useState(false);
  const [agotada, setAgotada] = useState(false);
  // El estado se restaura después del primer pintado para no desincronizar la
  // hidratación: el servidor no puede saber qué hay en la URL del cliente.
  const [restaurado, setRestaurado] = useState(false);

  useEffect(() => {
    try {
      const guardado = window.sessionStorage.getItem(CLAVE_USADAS);
      if (guardado) setUsadas(new Set(JSON.parse(guardado) as string[]));
    } catch {
      // Ventana privada o almacenamiento bloqueado: se arranca de cero.
    }

    const params = new URLSearchParams(window.location.search);
    const cat = params.get("cat");
    if (cat && esCategoriaId(cat)) setCategoria(cat);
    setPreguntaId(params.get("q"));
    const opcion = params.get("e");
    if (opcion !== null && /^\d+$/.test(opcion)) setElegida(Number(opcion));
    if (params.get("r") === "1") setRevelado(true);

    setRestaurado(true);
  }, []);

  useEffect(() => {
    if (!restaurado) return;
    try {
      window.sessionStorage.setItem(CLAVE_USADAS, JSON.stringify([...usadas]));
    } catch {
      // Sin almacenamiento el progreso no sobrevive un refresh, pero la trivia
      // sigue funcionando.
    }
  }, [usadas, restaurado]);

  // La URL refleja el estado, así un refresh accidental en medio de la
  // competencia no pierde la pregunta. `replaceState` evita el viaje al
  // servidor que haría `router.replace`.
  useEffect(() => {
    if (!restaurado) return;
    const url = new URL(window.location.href);
    const fijar = (clave: string, valor: string | null) => {
      if (valor === null) url.searchParams.delete(clave);
      else url.searchParams.set(clave, valor);
    };
    fijar("cat", categoria);
    fijar("q", preguntaId);
    fijar("e", elegida === null ? null : String(elegida));
    fijar("r", revelado ? "1" : null);
    window.history.replaceState(null, "", url);
  }, [categoria, preguntaId, elegida, revelado, restaurado]);

  const pregunta = useMemo(
    () => banco.find((item) => item.id === preguntaId) ?? null,
    [banco, preguntaId],
  );

  const restantes = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const item of CATEGORIAS) mapa[item.id] = 0;
    for (const item of banco) {
      if (usadas.has(item.id)) continue;
      mapa[categoriaId(item.tipo, item.dificultad)] += 1;
    }
    return mapa;
  }, [banco, usadas]);

  const totales = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const item of CATEGORIAS) mapa[item.id] = 0;
    for (const item of banco)
      mapa[categoriaId(item.tipo, item.dificultad)] += 1;
    return mapa;
  }, [banco]);

  const totalUsadas = useMemo(
    () => banco.filter((item) => usadas.has(item.id)).length,
    [banco, usadas],
  );

  const mostrar = useCallback((siguiente: Pregunta, destino: CategoriaId) => {
    // Se marca como usada al mostrarla, no al responderla: así tampoco se
    // repite si el operador vuelve al tablero sin contestar.
    setUsadas((previas) => new Set(previas).add(siguiente.id));
    setCategoria(destino);
    setPreguntaId(siguiente.id);
    setElegida(null);
    setRevelado(false);
    setAgotada(false);
  }, []);

  const abrirCategoria = useCallback(
    (destino: CategoriaId) => {
      const siguiente = elegirDe(banco, destino, usadas);
      if (siguiente) mostrar(siguiente, destino);
    },
    [banco, usadas, mostrar],
  );

  const volverAlTablero = useCallback(() => {
    setCategoria(null);
    setPreguntaId(null);
    setElegida(null);
    setRevelado(false);
    setAgotada(false);
  }, []);

  const siguiente = useCallback(() => {
    if (!categoria) return;
    const proxima = elegirDe(banco, categoria, usadas);
    if (proxima) {
      mostrar(proxima, categoria);
      return;
    }
    // Categoría agotada: se vuelve al tablero y se dice por qué.
    setPreguntaId(null);
    setElegida(null);
    setRevelado(false);
    setAgotada(true);
  }, [banco, categoria, usadas, mostrar]);

  const resuelta = pregunta
    ? pregunta.tipo === "opcion_multiple"
      ? elegida !== null
      : revelado
    : false;

  useEffect(() => {
    const alPresionar = (evento: KeyboardEvent) => {
      if (evento.metaKey || evento.ctrlKey || evento.altKey) return;

      const etiqueta = (evento.target as HTMLElement | null)?.tagName ?? "";
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(etiqueta)) return;
      const enControl = /^(BUTTON|A)$/.test(etiqueta);

      const tecla = evento.key.toLowerCase();

      if (tecla === "f") {
        evento.preventDefault();
        void alternarPantallaCompleta();
        return;
      }

      if (tecla === "escape") {
        evento.preventDefault();
        volverAlTablero();
        return;
      }

      if (!pregunta) return;

      if (pregunta.tipo === "opcion_multiple" && elegida === null) {
        const cantidad = pregunta.opciones.length;
        const numero = Number.parseInt(tecla, 10);
        if (Number.isInteger(numero) && numero >= 1 && numero <= cantidad) {
          evento.preventDefault();
          setElegida(numero - 1);
          return;
        }
        const porLetra = LETRAS.findIndex(
          (letra) => letra.toLowerCase() === tecla,
        );
        if (porLetra >= 0 && porLetra < cantidad) {
          evento.preventDefault();
          setElegida(porLetra);
          return;
        }
      }

      if (pregunta.tipo === "aproximacion" && tecla === "r" && !revelado) {
        evento.preventDefault();
        setRevelado(true);
        return;
      }

      // Enter y espacio activan el botón que tenga el foco; sólo se usan como
      // atajo cuando el foco no está sobre un control.
      if (resuelta && !enControl && (tecla === "enter" || tecla === " ")) {
        evento.preventDefault();
        siguiente();
      }
    };

    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [pregunta, elegida, revelado, resuelta, siguiente, volverAlTablero]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Cabecera
        pregunta={pregunta}
        onVolver={pregunta ? volverAlTablero : undefined}
        recargando={recargando}
        onRecargar={() => recargar(() => router.refresh())}
      />

      {pregunta ? (
        <Ronda
          pregunta={pregunta}
          elegida={elegida}
          revelado={revelado}
          resuelta={resuelta}
          quedan={categoria ? (restantes[categoria] ?? 0) : 0}
          onElegir={setElegida}
          onRevelar={() => setRevelado(true)}
          onSiguiente={siguiente}
          onVolver={volverAlTablero}
        />
      ) : (
        <Tablero
          banco={banco}
          restantes={restantes}
          totales={totales}
          totalUsadas={totalUsadas}
          agotada={agotada}
          onElegir={abrirCategoria}
          onReiniciar={() => {
            setUsadas(new Set());
            setAgotada(false);
          }}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const BOTON_CHROME =
  "inscripcion rounded-sm px-3 py-1.5 text-[0.62rem] text-dorado-2/75 transition-[color,background-color] duration-150 hover:bg-dorado/15 hover:text-dorado-2";

type CabeceraProps = {
  pregunta: Pregunta | null;
  onVolver?: () => void;
  recargando: boolean;
  onRecargar: () => void;
};

function Cabecera({
  pregunta,
  onVolver,
  recargando,
  onRecargar,
}: CabeceraProps) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-dorado/25 px-[2vw] py-[1.4vh]">
      <div className="flex min-w-0 items-center gap-3">
        {onVolver ? (
          <button type="button" onClick={onVolver} className={BOTON_CHROME}>
            ◁ Tablero
            <span className="ml-2 opacity-60">Esc</span>
          </button>
        ) : (
          <Link href="/" className={BOTON_CHROME}>
            ◁ Inicio
          </Link>
        )}

        {pregunta ? (
          <p className="inscripcion truncate text-[clamp(0.6rem,1.4vh,0.85rem)] text-travertino/70">
            {ETIQUETA_DIFICULTAD[pregunta.dificultad]}
            <span className="interpunto" />
            {ETIQUETA_TIPO[pregunta.tipo]}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onRecargar}
          disabled={recargando}
          className={`${BOTON_CHROME} disabled:opacity-50`}
        >
          {recargando ? "Recargando…" : "Recargar banco"}
        </button>
        <BotonPantallaCompleta />
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */

type TableroProps = {
  banco: Pregunta[];
  restantes: Record<string, number>;
  totales: Record<string, number>;
  totalUsadas: number;
  agotada: boolean;
  onElegir: (categoria: CategoriaId) => void;
  onReiniciar: () => void;
};

function Tablero({
  banco,
  restantes,
  totales,
  totalUsadas,
  agotada,
  onElegir,
  onReiniciar,
}: TableroProps) {
  const [confirmando, setConfirmando] = useState(false);

  if (banco.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="inscripcion text-[clamp(1.1rem,3vh,2rem)] text-travertino">
          El banco está vacío
        </h1>
        <p className="max-w-md text-travertino/65">
          No hay ninguna pregunta cargada todavía, así que no hay nada que
          proyectar.
        </p>
        <Link
          href="/admin"
          className="marmol tallado filete inscripcion rounded-sm px-6 py-3 text-[0.7rem] text-tinta transition-transform duration-200 hover:-translate-y-0.5"
        >
          Cargar preguntas
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col justify-center gap-[3vh] overflow-y-auto px-[3vw] py-[2vh]">
      <div className="text-center">
        <h1
          className="inscripcion text-[clamp(1rem,2.8vh,1.9rem)] text-travertino"
          style={{ textWrap: "balance" }}
        >
          Elige la categoría
        </h1>
        {agotada ? (
          <p
            aria-live="polite"
            className="mt-2 text-[clamp(0.75rem,1.6vh,1rem)] text-dorado-2"
          >
            Esa categoría se quedó sin preguntas nuevas. Elige otra.
          </p>
        ) : null}
      </div>

      {TIPOS.map((tipo) => (
        <section key={tipo} className="flex flex-col gap-[1.2vh]">
          <h2 className="inscripcion text-center text-[clamp(0.55rem,1.3vh,0.78rem)] text-dorado/70">
            {ETIQUETA_TIPO[tipo]}
          </h2>
          <div className="grid grid-cols-1 gap-[1.4vw] sm:grid-cols-3">
            {DIFICULTADES.map((dificultad) => (
              <Tableta
                key={dificultad}
                tipo={tipo}
                dificultad={dificultad}
                restantes={restantes[categoriaId(tipo, dificultad)] ?? 0}
                total={totales[categoriaId(tipo, dificultad)] ?? 0}
                onElegir={() => onElegir(categoriaId(tipo, dificultad))}
              />
            ))}
          </div>
        </section>
      ))}

      <footer className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
        <span className="text-[clamp(0.8rem,1.8vh,1.2rem)] text-travertino/55 tabular-nums">
          {totalUsadas} de {banco.length} ya salieron
        </span>

        {totalUsadas > 0 ? (
          confirmando ? (
            <span className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-[clamp(0.8rem,1.8vh,1.2rem)] text-dorado-2">
                ¿Volver a poner todas las preguntas en juego?
              </span>
              <button
                type="button"
                onClick={() => {
                  onReiniciar();
                  setConfirmando(false);
                }}
                className="inscripcion rounded-sm bg-porfido px-5 py-2.5 text-[clamp(0.6rem,1.4vh,0.9rem)] text-carrara transition-colors duration-150 hover:bg-porfido-2"
              >
                Sí, reiniciar
              </button>
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                className="inscripcion rounded-sm border border-travertino/30 px-5 py-2.5 text-[clamp(0.6rem,1.4vh,0.9rem)] text-travertino/80 transition-colors duration-150 hover:border-travertino/60 hover:text-travertino"
              >
                No
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmando(true)}
              className="marmol tallado filete inscripcion rounded-sm px-6 py-2.5 text-[clamp(0.6rem,1.4vh,0.9rem)] text-tinta transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-16px_rgb(0,0,0,0.9)]"
            >
              Reiniciar el contador
            </button>
          )
        ) : null}
      </footer>
    </main>
  );
}

/* -------------------------------------------------------------------------- */

type RondaProps = {
  pregunta: Pregunta;
  elegida: number | null;
  revelado: boolean;
  resuelta: boolean;
  quedan: number;
  onElegir: (indice: number) => void;
  onRevelar: () => void;
  onSiguiente: () => void;
  onVolver: () => void;
};

/* La sala mide unos 10 m y la lona 2 m de ancho, así que el texto manda. Se
   escala según el largo del contenido: corto, enorme; largo, un poco menos. */
function tamanoOpcion(opciones: { texto: string }[]): string {
  const largo = Math.max(...opciones.map((opcion) => opcion.texto.length));
  if (largo <= 30) return "clamp(1.4rem, 5.6vh, 4.6rem)";
  if (largo <= 52) return "clamp(1.25rem, 4.7vh, 3.9rem)";
  if (largo <= 78) return "clamp(1.1rem, 3.9vh, 3.2rem)";
  return "clamp(1rem, 3.2vh, 2.6rem)";
}

function tamanoEnunciado(enunciado: string): string {
  if (enunciado.length <= 60) return "clamp(1.5rem, 6.2vh, 5rem)";
  if (enunciado.length <= 110) return "clamp(1.35rem, 5.2vh, 4.2rem)";
  if (enunciado.length <= 170) return "clamp(1.2rem, 4.4vh, 3.5rem)";
  return "clamp(1.1rem, 3.8vh, 3rem)";
}

function Ronda({
  pregunta,
  elegida,
  revelado,
  resuelta,
  quedan,
  onElegir,
  onRevelar,
  onSiguiente,
  onVolver,
}: RondaProps) {
  // El orden se baraja por pregunta, con su id como semilla: deja de pagar
  // tener la correcta siempre primera, y como la semilla es fija el orden no
  // cambia al refrescar, así el índice que viaja en la URL sigue valiendo.
  const opciones = useMemo(
    () => barajarCon(pregunta.opciones, pregunta.id),
    [pregunta],
  );

  // Con opciones largas, una sola columna da el doble de ancho por línea.
  const masLarga = Math.max(...opciones.map((o) => o.texto.length));
  const columnas =
    masLarga > 78 ? 1 : opciones.length === 3 && masLarga <= 30 ? 3 : 2;
  const tamano = tamanoOpcion(opciones);

  return (
    <main className="grid min-h-0 flex-1 grid-rows-[auto_1fr_auto] gap-[2.5vh] px-[3vw] py-[3vh]">
      <Arco className="mx-auto w-full max-w-[min(64vw,1180px)]">
        <div className="flex flex-col justify-center px-[7%] pt-[12%] pb-[4%] text-center">
          <h1
            className="text-tinta leading-[1.16]"
            style={{
              textWrap: "balance",
              fontSize: tamanoEnunciado(pregunta.enunciado),
            }}
          >
            {pregunta.enunciado}
          </h1>
        </div>
      </Arco>

      <div className="flex min-h-0 flex-col justify-center overflow-hidden">
        {pregunta.tipo === "opcion_multiple" ? (
          <div
            className="mx-auto grid h-full w-full max-w-[min(92vw,1700px)] gap-[1.4vw] overflow-y-auto"
            style={{
              gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))`,
              gridAutoRows: "1fr",
            }}
          >
            {opciones.map((opcion, indice) => (
              <OpcionLosa
                key={opcion.texto}
                letra={LETRAS[indice]}
                texto={opcion.texto}
                tamano={tamano}
                estado={estadoDeOpcion(opciones, elegida, indice)}
                onElegir={() => onElegir(indice)}
              />
            ))}
          </div>
        ) : (
          <Aproximacion
            pregunta={pregunta}
            revelado={revelado}
            onRevelar={onRevelar}
          />
        )}
      </div>

      <Pie
        pregunta={pregunta}
        acerto={elegida !== null && opciones[elegida]?.correcta === true}
        resuelta={resuelta}
        quedan={quedan}
        onSiguiente={onSiguiente}
        onVolver={onVolver}
      />
    </main>
  );
}

function estadoDeOpcion(
  opciones: Pregunta["opciones"],
  elegida: number | null,
  indice: number,
): EstadoLosa {
  if (elegida === null) return "inerte";
  const esCorrecta = opciones[indice].correcta;
  if (indice === elegida) return esCorrecta ? "acertada" : "fallada";
  return esCorrecta ? "correcta" : "descartada";
}

/* -------------------------------------------------------------------------- */

type AproximacionProps = {
  pregunta: Pregunta;
  revelado: boolean;
  onRevelar: () => void;
};

function Aproximacion({ pregunta, revelado, onRevelar }: AproximacionProps) {
  if (!revelado) {
    return (
      <div className="flex flex-col items-center gap-[3vh]">
        {/* Antes de revelar no se dibuja nada de la respuesta, ni la cantidad de
            dígitos: eso ya sería una pista. */}
        <p className="max-w-xl text-center text-[clamp(0.85rem,1.9vh,1.25rem)] text-travertino/65">
          Que cada grupo diga su número en voz alta. Cuando todos hayan dicho el
          suyo, revela la respuesta.
        </p>
        <button
          type="button"
          onClick={onRevelar}
          className="marmol tallado filete inscripcion rounded-sm px-[4vw] py-[2.2vh] text-[clamp(0.7rem,1.7vh,1.05rem)] text-tinta transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_38px_-18px_rgb(0,0,0,0.9)]"
        >
          Revelar la respuesta
          <span className="ml-3 opacity-55">R</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-[2vh]">
      <Odometro
        valor={pregunta.respuestaNumerica ?? 0}
        unidad={pregunta.unidad}
        revelado={revelado}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

type PieProps = {
  pregunta: Pregunta;
  acerto: boolean;
  resuelta: boolean;
  quedan: number;
  onSiguiente: () => void;
  onVolver: () => void;
};

function Pie({
  pregunta,
  acerto,
  resuelta,
  quedan,
  onSiguiente,
  onVolver,
}: PieProps) {
  if (!resuelta) {
    return (
      <p className="shrink-0 text-center text-[clamp(0.62rem,1.3vh,0.82rem)] text-travertino/40">
        {pregunta.tipo === "opcion_multiple"
          ? "Marca la opción que eligió el grupo. También sirven las teclas 1-9 y A-H."
          : "Tecla R para revelar."}
      </p>
    );
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-center gap-x-6 gap-y-3">
      <p
        aria-live="polite"
        className="inscripcion text-[clamp(0.9rem,2.6vh,2rem)]"
      >
        {pregunta.tipo === "aproximacion" ? (
          <span className="text-dorado-2">Respuesta revelada</span>
        ) : acerto ? (
          <span className="text-verdigris-2">Correcta</span>
        ) : (
          <span className="text-porfido-2">Incorrecta</span>
        )}
      </p>

      {pregunta.referencia ? (
        <p className="text-[clamp(0.8rem,2vh,1.5rem)] text-travertino/60 italic">
          {pregunta.referencia}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        {quedan > 0 ? (
          <button
            type="button"
            onClick={onSiguiente}
            className="marmol tallado filete inscripcion rounded-sm px-5 py-2.5 text-[clamp(0.6rem,1.4vh,0.82rem)] text-tinta transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-16px_rgb(0,0,0,0.9)]"
          >
            Siguiente de esta categoría
            <span className="ml-3 tabular-nums opacity-55">{quedan}</span>
          </button>
        ) : (
          <p className="text-[clamp(0.68rem,1.4vh,0.88rem)] text-travertino/55">
            Era la última de esta categoría.
          </p>
        )}

        <button
          type="button"
          onClick={onVolver}
          className="inscripcion rounded-sm px-4 py-2.5 text-[clamp(0.6rem,1.4vh,0.82rem)] text-dorado-2/75 transition-[color,background-color] duration-150 hover:bg-dorado/15 hover:text-dorado-2"
        >
          Volver al tablero
        </button>
      </div>
    </div>
  );
}
