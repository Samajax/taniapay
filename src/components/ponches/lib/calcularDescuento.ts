// ponches/lib/calcularDescuento.ts
// Convierte un registro ya calculado en su impacto en nómina.
// Convención: negativo = retención (descuento), positivo = incentivo.
// Función pura.

import type { AsistenciaRecord, Empleado, Tasas } from "../types";
import { TOLERANCIA_MIN } from "./calcularIncidencia";

export function calcularDescuento(
  rec: AsistenciaRecord,
  emp: Empleado,
  tasas: Tasas
): number {
  // El exento de ponche nunca tiene retención ni incentivo por asistencia.
  if (emp.exento_ponche) return 0;

  const tieneEntrada = rec.entrada != null && rec.entrada !== "";
  let monto = 0;

  switch (rec.tipo_incidencia) {
    // Faltó teniendo turno: se descuenta el día.
    case "Ausencia":
      monto = -tasas.diaTrabajo;
      break;

    // Feriado: si trabajó, lleva recargo; si no, no se le descuenta nada.
    case "Feriado":
      monto = tieneEntrada ? tasas.feriado : 0;
      break;

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
  // Se quedan en 0 mientras nadie las apruebe, así no reaparece el bug viejo.
  if (rec.horas_extras_aprobadas_min && rec.horas_extras_aprobadas_min > 0) {
    monto += (rec.horas_extras_aprobadas_min / 60) * tasas.hora;
  }

  return monto;
}