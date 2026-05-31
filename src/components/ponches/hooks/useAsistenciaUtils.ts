import { AsistenciaRecord, Empleado } from "@/data/mockData";

export interface AsistenciaRefinada extends AsistenciaRecord {
  sucursal_ponche?: string;
  incidencia_detectada?: string;
  nombre_cubre?: string;
  es_feriado?: boolean;
  es_dia_libre?: boolean;
  minutos_tardanza?: number;
  minutos_extras?: number;
  requiereConfirmacionHE?: boolean;
  he_aprobada?: boolean;
}

export interface EmpleadoAsistenciaGrupal {
  id_reloj: string;
  nombre: string;
  cargo: string;
  sucursal_principal: string;
  exento: boolean;
  totalDescuento: number;
  alertasAcumuladas: Set<string>;
  records: AsistenciaRefinada[];
}

export const formatMonto = (val: number) => 
  "RD$ " + val.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const getAlertaEstilo = (alerta: string): string => {
  const estilos: Record<string, string> = {
    "Irregularidad": "bg-red-50 text-red-600 border-red-200 font-semibold",
    "Ausencia": "bg-rose-50 text-rose-700 border-rose-200 font-bold",
    "Tardanza": "bg-amber-50 text-amber-700 border-amber-200",
    "Vacaciones": "bg-blue-50 text-blue-700 border-blue-200",
    "Licencia Médica": "bg-purple-50 text-purple-700 border-purple-200",
    "Permiso": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "HE por Aprobar": "bg-orange-50 text-orange-700 border-orange-200 font-bold",
    "Correcto": "bg-emerald-50 text-emerald-700 border-emerald-200"
  };
  return estilos[alerta] || "bg-slate-50 text-slate-600 border-slate-200";
};

export function formatNombreTurno(turnoString: string, horaEntrada: string): string {
  if (turnoString) {
    const tClean = turnoString.toLowerCase();
    if (tClean.includes("matutino") || tClean.includes("08:00") || tClean.includes("07:30")) return "Matutino";
    if (tClean.includes("vespertino") || tClean.includes("14:30") || tClean.includes("15:00")) return "Vespertino";
  }
  if (!horaEntrada || horaEntrada === "—") return "Matutino";
  const [h] = horaEntrada.split(":").map(Number);
  return h >= 13 ? "Vespertino" : "Matutino";
}

/**
 * REGLA DE NEGOCIO ACTUALIZADA:
 * 1. Feriado laborado = Pago doble (monto positivo).
 * 2. Día Libre = 0.
 * 3. Ausencia = Descuento día completo (monto negativo).
 * 4. Tardanza = Descuento por minuto (monto negativo).
 */
export const calcularDescuentoPonche = (record: AsistenciaRefinada, emp: Empleado | undefined, tasas: any) => {
  if (!emp || emp.exento_ponche) return 0;
  
  const tienePonche = record.entrada !== "—" && record.entrada !== "" && record.entrada !== undefined;

  // 1. INCIDENCIAS (Inmune)
  if (record.incidencia_detectada) return 0;

  // 2. FERIADOS (Si trabajó, se paga el día al doble; ya tiene su sueldo base, sumamos 1 día extra)
  if (record.es_feriado) {
    return tienePonche ? tasas.diaTrabajo : 0;
  }

  // 3. DÍAS LIBRES Y AUSENCIAS
  if (!tienePonche) {
    if (record.es_dia_libre) return 0; // Día libre legal = RD$ 0.00
    return -tasas.diaTrabajo; // Falta injustificada = -1 día
  }

  // 4. TARDANZAS (Independiente de la salida)
  if (record.minutos_tardanza && record.minutos_tardanza > 0) {
    const deduccion = record.minutos_tardanza * (tasas.hora / 60);
    return -deduccion;
  }

  return 0;
};

/**
 * RESUMEN VISUAL SIMPLIFICADO:
 * Rojo: Ausencia o Error.
 * Naranja: Tardanza o HE por Aprobar.
 * Gris: Día Libre o Feriado (sin laborar).
 * Verde: Correcto.
 */
export const obtenerAlertaSimplificada = (record: AsistenciaRefinada, emp: Empleado | undefined) => {
  if (!emp) return "";
  if (record.incidencia_detectada) return record.incidencia_detectada;
  if (record.error_reloj) return "Irregularidad";
  
  const tienePonche = record.entrada !== "—" && record.entrada !== "" && record.entrada !== undefined;

  if (!tienePonche) {
    if (record.es_feriado || record.es_dia_libre) return "";
    return "Ausencia";
  }

  if (record.requiereConfirmacionHE && !record.he_aprobada) return "HE por Aprobar";
  if (record.minutos_tardanza && record.minutos_tardanza > 0 && !emp.exento_ponche) return "Tardanza";
  
  return "Correcto";
};