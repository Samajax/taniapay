// ponches/hooks/useAsistenciaEnriquecida.ts
// Motor del módulo de ponches. NO recalcula tiempos: los registros ya vienen
// calculados desde el parser (tipo_incidencia, retraso_minutos, etc.).
// Aquí solo: 1) overlay de incidencias RRHH, 2) filtrado, 3) agrupación, 4) métricas.

import { useMemo } from "react";
import type {
  AsistenciaRecord,
  Empleado,
  Incidencia,
  Tasas,
  FiltrosPonches,
  GrupoEmpleado,
  MetricasPonches,
} from "../types"; // <-- se crea en el siguiente paso
import { calcularDescuento } from "../lib/calcularDescuento"; // <-- se crea en ponches/lib

/** Días que necesitan acción humana: ponche raro/incompleto o sin turno configurado. */
function requiereAtencion(rec: AsistenciaRecord): boolean {
  return rec.error_reloj || rec.tipo_incidencia === "Horario No Configurado";
}

/**
 * Devuelve la incidencia de RRHH (vacaciones, licencia, permiso) que cubre
 * ese día, si existe. El cruce es por id_reloj + rango de fechas.
 */
function incidenciaDelDia(
  incidencias: Incidencia[],
  idReloj: string,
  fecha: string
): Incidencia | undefined {
  return incidencias.find(
    (inc) =>
      inc.id_reloj === idReloj &&
      fecha >= inc.fecha_inicio &&
      fecha <= inc.fecha_fin
  );
}

export function useAsistenciaEnriquecida(params: {
  asistencia: AsistenciaRecord[];
  empleados: Empleado[];
  incidencias: Incidencia[];
  tasas: Tasas;
  filtros: FiltrosPonches;
}) {
  const { asistencia, empleados, incidencias, tasas, filtros } = params;

  // Índice O(1) de empleados por id_reloj (adiós a los .find() en bucle).
  const empleadosPorId = useMemo(() => {
    const mapa = new Map<string, Empleado>();
    empleados.forEach((e) => mapa.set(e.id_reloj, e));
    return mapa;
  }, [empleados]);

  // 1) OVERLAY RRHH: si hay incidencia ese día, gana y anula penalización.
  //    No tocamos tiempos; solo el veredicto. (Único paso que se resuelve aquí
  //    porque las incidencias llegan después de importar.)
  const registros = useMemo<AsistenciaRecord[]>(() => {
    if (incidencias.length === 0) return asistencia;
    return asistencia.map((rec) => {
      const inc = incidenciaDelDia(incidencias, rec.id_reloj, rec.fecha);
      if (!inc) return rec;
      return {
        ...rec,
        tipo_incidencia: inc.tipo,
        retraso_minutos: 0,
        salida_temprana_minutos: 0,
        error_reloj: false,
      };
    });
  }, [asistencia, incidencias]);

  // 2) FILTRADO (búsqueda, sucursal, fecha, y "solo errores").
  const registrosFiltrados = useMemo<AsistenciaRecord[]>(() => {
    const q = filtros.search.trim().toLowerCase();
    return registros.filter((rec) => {
      const emp = empleadosPorId.get(rec.id_reloj);
      const matchSearch =
        q === "" ||
        rec.id_reloj.includes(q) ||
        (emp?.nombre.toLowerCase().includes(q) ?? false);
      const matchSucursal =
        filtros.sucursal === "Todos" || rec.sucursal === filtros.sucursal;
      const matchFecha =
        filtros.fecha === "Todos" || rec.fecha === filtros.fecha;
      const matchErrores = !filtros.soloErrores || requiereAtencion(rec);
      return matchSearch && matchSucursal && matchFecha && matchErrores;
    });
  }, [registros, filtros, empleadosPorId]);

  // 3) AGRUPACIÓN por empleado (para Resumen y Expediente).
  const grupos = useMemo<GrupoEmpleado[]>(() => {
    const mapa = new Map<string, GrupoEmpleado>();
    for (const rec of registrosFiltrados) {
      const emp = empleadosPorId.get(rec.id_reloj);
      if (!emp) continue;

      let g = mapa.get(rec.id_reloj);
      if (!g) {
        g = {
          id_reloj: emp.id_reloj,
          nombre: emp.nombre,
          cargo: emp.cargo,
          sucursal: rec.sucursal,
          totalDescuento: 0,
          totalRetrasoMin: 0,
          alertas: new Set<string>(),
          registros: [],
        };
        mapa.set(rec.id_reloj, g);
      }

      g.totalDescuento += calcularDescuento(rec, emp, tasas);
      g.totalRetrasoMin += rec.retraso_minutos + rec.salida_temprana_minutos;
      g.registros.push(rec);
      if (rec.tipo_incidencia !== "Correcto" && rec.tipo_incidencia !== "Libre") {
        g.alertas.add(rec.tipo_incidencia);
      }
    }
    return Array.from(mapa.values());
  }, [registrosFiltrados, empleadosPorId, tasas]);

  // 4) MÉTRICAS de las tarjetas superiores (sobre todo, antes de filtrar).
  const metricas = useMemo<MetricasPonches>(() => {
    return {
      errores: registros.filter(requiereAtencion).length,
      ausencias: registros.filter((r) => r.tipo_incidencia === "Ausencia").length,
      impactoNomina: grupos.reduce((acc, g) => acc + g.totalDescuento, 0),
    };
  }, [registros, grupos]);

  return { registrosFiltrados, grupos, metricas };
}