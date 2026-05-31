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
 * REGLAS DE NEGOCIO "TANIA PAY" 2026:
 * 1. Margen de Gracia: 10 mins (entrada y salida).
 * 2. Horario Estricto: Llegar temprano no compensa irse antes de la hora.
 * 3. Feriado: Pago proporcional al tiempo real laborado.
 */
export const calcularDescuentoPonche = (record: AsistenciaRefinada, emp: Empleado | undefined, tasas: any) => {
  if (!emp || emp.exento_ponche) return 0;
  
  const tienePonche = record.entrada !== "—" && record.entrada !== "" && record.entrada !== undefined;

  if (record.incidencia_detectada) return 0;

  const parseMins = (h: string) => {
    if (!h || h === "—") return 0;
    const [hrs, mins] = h.split(":").map(Number);
    return hrs * 60 + mins;
  };

  const tEntradaReal = parseMins(record.entrada_normalizada || "");
  const tSalidaReal = parseMins(record.salida_normalizada || "");
  const tEntradaTeo = parseMins(emp.hora_inicio_turno || "08:00");
  const tSalidaTeo = parseMins(emp.hora_fin_turno || "17:00");

  // 1. FERIADOS (Pago proporcional al tiempo real laborado)
  if (record.es_feriado && tienePonche) {
    const minutosTrabajados = tSalidaReal - tEntradaReal;
    return (minutosTrabajados / 60) * tasas.hora;
  }

  // 2. AUSENCIAS
  if (!tienePonche) {
    if (record.es_dia_libre || record.es_feriado) return 0;
    return -tasas.diaTrabajo; 
  }

  // 3. LÓGICA DE INCUMPLIMIENTO DE JORNADA
  let minutosPenalizados = 0;

  // A) Tardanza en Entrada (Margen 10 min)
  if (tEntradaReal > tEntradaTeo + 10) {
    minutosPenalizados += (tEntradaReal - tEntradaTeo);
  }

  // B) Salida Anticipada (Margen 10 min)
  // Si sale antes de (Hora Teórica - 10), se penaliza el tiempo faltante completo
  if (tSalidaReal < tSalidaTeo - 10) {
    minutosPenalizados += (tSalidaTeo - tSalidaReal);
  }

  // C) Bloqueo de Compensación: No hay restas si tEntradaReal < tEntradaTeo

  if (minutosPenalizados > 0) {
    return -(minutosPenalizados * (tasas.hora / 60));
  }

  return 0;
};

export const obtenerAlertaSimplificada = (record: AsistenciaRefinada, emp: Empleado | undefined) => {
  if (!emp) return "";
  if (record.incidencia_detectada) return record.incidencia_detectada;
  if (record.error_reloj) return "Irregularidad";
  
  const tienePonche = record.entrada !== "—" && record.entrada !== "" && record.entrada !== undefined;

  if (!tienePonche) {
    if (record.es_feriado || record.es_dia_libre) return "";
    return "Ausencia";
  }

  // Detección de incumplimiento para alerta visual
  const parseMins = (h: string) => h ? h.split(":").map(Number)[0] * 60 + h.split(":").map(Number)[1] : 0;
  const tSalidaReal = parseMins(record.salida_normalizada || "");
  const tSalidaTeo = parseMins(emp.hora_fin_turno || "17:00");

  if (record.requiereConfirmacionHE && !record.he_aprobada) return "HE por Aprobar";
  
  // Se activa "Tardanza" si llegó tarde O si salió temprano
  const salidaTemprana = tSalidaReal < tSalidaTeo - 10;
  if ((record.minutos_tardanza && record.minutos_tardanza > 0) || salidaTemprana) {
    if (!emp.exento_ponche) return "Tardanza";
  }
  
  return "Correcto";
};