// ponches/lib/calcularDescuento.ts
// Convierte un registro ya calculado en su impacto en nómina.
// Convención: negativo = retención (descuento), positivo = incentivo.
// Función pura. La tolerancia ya se aplicó al decidir el tipo en calcularIncidencia.

import type { AsistenciaRecord, Empleado, Tasas } from "../types"; // <-- pendiente

export function calcularDescuento(
  rec: AsistenciaRecord,
  emp: Empleado,
  tasas: Tasas
): number {
  // El exento de ponche nunca tiene retención ni incentivo por asistencia.
  if (emp.exento_ponche) return 0;

  const tieneEntrada = rec.entrada != null && rec.entrada !== "";

  switch (rec.tipo_incidencia) {
    // Faltó teniendo turno: se descuenta el día.
    case "Ausencia":
      return -tasas.diaTrabajo;

    // Feriado: si trabajó, lleva recargo; si no, no se le descuenta nada.
    case "Feriado":
      return tieneEntrada ? tasas.feriado : 0;

    // Llegó tarde o salió temprano: se penalizan los minutos por su tasa/hora.
    case "Tardanza":
    case "Salida Temprana": {
      const mins = rec.retraso_minutos + rec.salida_temprana_minutos;
      return -(mins * (tasas.hora / 60));
    }

    // Correcto, Libre, Horario No Configurado, Revisar -> sin impacto.
    default:
      return 0;
  }
}