// ponches/lib/calcularDescuento.ts
// Convierte un registro ya calculado en su impacto en nómina.
// Convención: negativo = retención (descuento), positivo = lo que RECIBE.
// Función pura.

import type { AsistenciaRecord, Empleado, Tasas } from "../types";
import { TOLERANCIA_MIN } from "./calcularIncidencia";
import { parseMinutos } from "../hooks/useAsistenciaUtils";

const JORNADA_DEFAULT_MIN = 480; // 8h, si el feriado no trae ventana de turno

/** Largo en minutos de la ventana del turno ("08:00-16:00" -> 480). null si no es usable. */
function ventanaMin(turno: string | null): number | null {
  if (!turno) return null;
  const [ini, fin] = turno.split("-");
  const a = parseMinutos(ini);
  const b = parseMinutos(fin);
  if (a == null || b == null || b <= a) return null;
  return b - a;
}

export function calcularDescuento(
  rec: AsistenciaRecord,
  emp: Empleado,
  tasas: Tasas
): number {
  // El exento de ponche nunca tiene retención ni incentivo por asistencia.
  if (emp.exento_ponche) return 0;

  const tieneEntrada = rec.entrada != null && rec.entrada !== "";
  const tieneSalida = rec.salida != null && rec.salida !== "";
  let monto = 0;

  switch (rec.tipo_incidencia) {
    // Faltó teniendo turno: se descuenta el día.
    case "Ausencia":
      monto = -tasas.diaTrabajo;
      break;

    // FERIADO: no se paga el día completo fijo, sino las HORAS TRABAJADAS.
    // - Se prorratea el pago de feriado por (trabajado / jornada).
    // - Llegar tarde o salir antes => menos horas => recibe menos (descuento implícito).
    // - Quedarse de más => más horas => recibe más.
    // tasas.feriado = pago de una JORNADA COMPLETA en feriado (con el recargo que definan).
    case "Feriado": {
      if (!tieneEntrada || !tieneSalida) {
        monto = 0; // sin ponche completo no hay nada que pagar
        break;
      }
      const tEnt = parseMinutos(rec.entrada);
      const tSal = parseMinutos(rec.salida);
      if (tEnt == null || tSal == null || tSal <= tEnt) {
        monto = 0;
        break;
      }
      const trabajadoMin = tSal - tEnt;
      const jornadaMin = ventanaMin(rec.turno) ?? JORNADA_DEFAULT_MIN;
      monto = (trabajadoMin / jornadaMin) * tasas.feriado;
      break;
    }

    // Tarde / temprano: GRACIA de 10 min. Solo se cobra lo que pasa de la
    // tolerancia (ej. 15 min tarde -> se cobran 5; 10 min o menos -> 0).
    case "Tardanza":
    case "Salida Temprana": {
      const minsTarde = Math.max(0, rec.retraso_minutos - TOLERANCIA_MIN);
      const minsTemprano = Math.max(0, rec.salida_temprana_minutos - TOLERANCIA_MIN);
      const minsCobrables = minsTarde + minsTemprano;
      monto = -(minsCobrables * (tasas.hora / 60));
      break;
    }

    // Correcto, Libre, Horario No Configurado, Revisar -> base sin impacto.
    default:
      monto = 0;
  }

  // Horas extras APROBADAS (explícitas, nunca auto-detectadas): suman al monto.
  // En feriado NO se suman: el pago por horas trabajadas ya incluye lo que pasó de la jornada.
  if (
    rec.tipo_incidencia !== "Feriado" &&
    rec.horas_extras_aprobadas_min &&
    rec.horas_extras_aprobadas_min > 0
  ) {
    monto += (rec.horas_extras_aprobadas_min / 60) * tasas.hora;
  }

  return monto;
}