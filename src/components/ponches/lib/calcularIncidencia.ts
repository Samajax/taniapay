// ponches/lib/calcularIncidencia.ts
// La SECUENCIA DE DECISIÓN para un día. Función pura, sin React.
// La usa el parser al importar; el resultado se guarda en el registro.

import { parseMinutos } from "../hooks/useAsistenciaUtils";
import type { TipoIncidencia } from "../types"; // <-- se crea en el siguiente paso

// --- POLÍTICA (ajustable; podría vivir en configTasas más adelante) ---
const TOLERANCIA_MIN = 10; // minutos de gracia para tardanza / salida temprana
const MAX_DESVIO_MIN = 240; // desvío > 4h = no es real, es turno cruzado / anomalía

export interface ResultadoIncidencia {
  tipo_incidencia: TipoIncidencia;
  retraso_minutos: number;
  salida_temprana_minutos: number;
  error_reloj: boolean;
}

/**
 * Decide el veredicto del día a partir del turno y los ponches.
 * Orden de prioridad (el primero que aplica, gana):
 *   1. Feriado        (lo determina el parser desde la lista de feriados)
 *   2. Libre          (sin turno y sin ponche)
 *   3. Ausencia       (con turno y sin ponche)
 *   4. Revisar        (ponche incompleto o desvío absurdo = turno cruzado)
 *   5. Sin config     (con ponche pero sin turno utilizable / Default)
 *   6. Tardanza / Salida Temprana / Correcto
 *
 * Nota: retraso_minutos y salida_temprana_minutos se guardan CRUDOS
 * (el delta real). La tolerancia solo decide la etiqueta y, luego, el dinero.
 */
export function calcularIncidencia(input: {
  turno: string | null; // "08:00-16:00" | null
  entrada: string | null; // "08:30" | null
  salida: string | null; // "16:49" | null
  esFeriado: boolean;
}): ResultadoIncidencia {
  const { turno, entrada, salida, esFeriado } = input;

  const sinPenalizar = (tipo: TipoIncidencia, error = false): ResultadoIncidencia => ({
    tipo_incidencia: tipo,
    retraso_minutos: 0,
    salida_temprana_minutos: 0,
    error_reloj: error,
  });

  const hayEntrada = entrada != null && entrada !== "";
  const haySalida = salida != null && salida !== "";
  const hayTurno = turno != null && turno !== "";

  // 1) FERIADO (haya o no ponche, no penaliza; si trabajó, el dinero suma recargo)
  if (esFeriado) return sinPenalizar("Feriado");

  // 2 y 3) SIN PONCHE -> Libre o Ausencia
  if (!hayEntrada && !haySalida) {
    return sinPenalizar(hayTurno ? "Ausencia" : "Libre");
  }

  // 4a) PONCHE INCOMPLETO (entró pero no salió, o viceversa)
  if (hayEntrada !== haySalida) {
    return sinPenalizar("Revisar", true);
  }

  // 5) CON PONCHE PERO SIN TURNO UTILIZABLE (turno vacío o "Default")
  if (!hayTurno) {
    return sinPenalizar("Horario No Configurado");
  }

  // 6) CÁLCULO contra la ventana del turno
  const [ini, fin] = turno!.split("-");
  const tIni = parseMinutos(ini);
  const tFin = parseMinutos(fin);
  const tEnt = parseMinutos(entrada);
  const tSal = parseMinutos(salida);

  // si algún valor no parsea, mejor revisar que penalizar mal
  if (tIni == null || tFin == null || tEnt == null || tSal == null) {
    return sinPenalizar("Revisar", true);
  }

  const retraso = Math.max(0, tEnt - tIni);
  const temprano = Math.max(0, tFin - tSal);

  // 4b) DESVÍO ABSURDO = turno cruzado / lectura mala -> Revisar, sin penalizar
  if (retraso > MAX_DESVIO_MIN || temprano > MAX_DESVIO_MIN) {
    return sinPenalizar("Revisar", true);
  }

  // etiqueta según tolerancia (los minutos crudos se guardan igual)
  let tipo: TipoIncidencia = "Correcto";
  if (retraso > TOLERANCIA_MIN) tipo = "Tardanza";
  else if (temprano > TOLERANCIA_MIN) tipo = "Salida Temprana";

  return {
    tipo_incidencia: tipo,
    retraso_minutos: retraso,
    salida_temprana_minutos: temprano,
    error_reloj: false,
  };
}