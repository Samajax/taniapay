// ponches/lib/parsearArchivo.ts
// Convierte el export del aparato (texto tabulado) en registros limpios.
// Toda la "suciedad" del formato vive aquí, en un solo lugar testeable.

import { calcularIncidencia } from "./calcularIncidencia";
import type { AsistenciaRecord } from "../types"; // <-- pendiente (types.ts)

// Una fila-día se reconoce porque col[0] es un número (id) y col[1] una fecha.
const RE_ID = /^\d+$/;
const RE_FECHA = /^\d{2}\/\d{2}\/\d{4}$/;
// La ventana horaria viene dentro del nombre del turno: "...(08:00-16:00)".
const RE_VENTANA = /\((\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\)/;

export interface ReporteImportacion {
  sucursal: string;
  filasLeidas: number;
  diasGenerados: number;
  duplicadosConsolidados: number;
  paraRevisar: number;
  ausencias: number;
}

interface FilaCruda {
  id_reloj: string;
  fecha: string; // ISO
  turno: string | null;
  entrada: string | null;
  salida: string | null;
}

/** "30/04/2026" -> "2026-04-30" */
function fechaISO(f: string): string {
  const [d, m, y] = f.split("/");
  return `${y}-${m}-${d}`;
}

/** Saca la ventana "08:00-16:00". null si está vacío o es "Default" (sin configurar). */
function ventanaTurno(turnoRaw: string): string | null {
  if (!turnoRaw || /default/i.test(turnoRaw)) return null;
  const m = turnoRaw.match(RE_VENTANA);
  return m ? `${m[1]}-${m[2]}` : null;
}

export function parsearArchivo(
  texto: string,
  opts: { sucursal: string; feriados?: string[] }
): { registros: AsistenciaRecord[]; reporte: ReporteImportacion } {
  const feriados = new Set(opts.feriados ?? []);

  // 1) EXTRAER solo las filas-día (se ignora header, "Nombre", "Horas totales", pie…)
  const crudas: FilaCruda[] = [];
  for (const linea of texto.split(/\r?\n/)) {
    const cols = linea.split("\t").map((c) => c.trim());
    if (!RE_ID.test(cols[0] ?? "") || !RE_FECHA.test(cols[1] ?? "")) continue;
    crudas.push({
      id_reloj: cols[0],
      fecha: fechaISO(cols[1]),
      turno: ventanaTurno(cols[2] ?? ""),
      entrada: cols[3] || null,
      salida: cols[4] || null,
    });
  }
  const filasLeidas = crudas.length;

  // 2) AGRUPAR por (id_reloj, fecha) para consolidar duplicados del aparato
  const porDia = new Map<string, FilaCruda[]>();
  for (const f of crudas) {
    const k = `${f.id_reloj}|${f.fecha}`;
    const arr = porDia.get(k);
    if (arr) arr.push(f);
    else porDia.set(k, [f]);
  }

  // 3) CONSOLIDAR + CALCULAR (un registro por día)
  let duplicadosConsolidados = 0;
  let paraRevisar = 0;
  let ausencias = 0;
  const registros: AsistenciaRecord[] = [];

  for (const grupo of porDia.values()) {
    if (grupo.length > 1) duplicadosConsolidados += grupo.length - 1;

    const entradas = grupo.map((g) => g.entrada).filter(Boolean) as string[];
    const salidas = grupo.map((g) => g.salida).filter(Boolean) as string[];

    // entrada = la más temprana; salida = la más tardía (se ordenan como texto HH:MM)
    const entrada = entradas.length ? entradas.sort()[0] : null;
    const salida = salidas.length ? salidas.sort()[salidas.length - 1] : null;
    const turno = grupo.find((g) => g.turno)?.turno ?? null;
    const { id_reloj, fecha } = grupo[0];

    const calc = calcularIncidencia({
      turno,
      entrada,
      salida,
      esFeriado: feriados.has(fecha),
    });

    if (calc.tipo_incidencia === "Revisar") paraRevisar++;
    if (calc.tipo_incidencia === "Ausencia") ausencias++;

    registros.push({
      id_reloj,
      fecha,
      sucursal: opts.sucursal,
      turno,
      entrada,
      salida,
      ...calc, // tipo_incidencia, retraso_minutos, salida_temprana_minutos, error_reloj
    });
  }

  // 4) ORDENAR por fecha y luego por id, para mostrar bonito
  registros.sort(
    (a, b) => a.fecha.localeCompare(b.fecha) || a.id_reloj.localeCompare(b.id_reloj)
  );

  return {
    registros,
    reporte: {
      sucursal: opts.sucursal,
      filasLeidas,
      diasGenerados: registros.length,
      duplicadosConsolidados,
      paraRevisar,
      ausencias,
    },
  };
}