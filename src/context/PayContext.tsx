"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

import {
  EMPLEADOS_INICIALES,
  ASISTENCIA_INICIAL,
  TASAS_INICIALES,
  CONFIG_SISTEMA,
} from "@/data/mockData";
import { fechasFeriado } from "@/data/feriados";
import {
  parsearArchivo,
  type ReporteImportacion,
} from "@/components/ponches/lib/parsearArchivo";
import { calcularIncidencia } from "@/components/ponches/lib/calcularIncidencia";
import type {
  Empleado,
  AsistenciaRecord,
  Incidencia,
  Tasas,
} from "@/components/ponches/types";

const STORAGE_KEY = "taniapay_asistencia";
const FERIADOS_SET = new Set(fechasFeriado());

interface PayContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  empleados: Empleado[];
  asistencia: AsistenciaRecord[];
  incidencias: Incidencia[];
  configTasas: Tasas;
  fechaSistema: string;
  periodoInicio: string;
  periodoFin: string;

  /** Importa el archivo del aparato (uno por sucursal) y devuelve el reporte. */
  importarArchivo: (texto: string, sucursal: string) => ReporteImportacion;
  /** Corrige entrada/salida de un dia y RECALCULA su veredicto. */
  corregirPonche: (idReloj: string, fecha: string, entrada: string | null, salida: string | null) => void;
  /** Cambia el turno (ventana) de un dia y RECALCULA. Util para arreglar "Default". */
  actualizarTurno: (idReloj: string, fecha: string, turno: string | null) => void;
  /** Agrega un dia que faltaba y lo calcula. */
  agregarRegistro: (idReloj: string, fecha: string, turno: string | null, entrada: string | null, salida: string | null) => void;
  eliminarRegistro: (idReloj: string, fecha: string) => void;
  actualizarTasas: (tasas: Tasas) => void;
}

const PayContext = createContext<PayContextType | undefined>(undefined);

export function PayContextProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [empleados] = useState<Empleado[]>(EMPLEADOS_INICIALES);
  const [incidencias] = useState<Incidencia[]>([]); // RRHH; lo llena su modulo
  const [configTasas, setConfigTasas] = useState<Tasas>(TASAS_INICIALES);
  const [asistencia, setAsistencia] = useState<AsistenciaRecord[]>([]);

  // Carga desde localStorage (solo cliente) o cae a la semilla.
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      setAsistencia(guardado ? JSON.parse(guardado) : ASISTENCIA_INICIAL);
    } catch {
      setAsistencia(ASISTENCIA_INICIAL);
    }
  }, []);

  const guardarAsistencia = (data: AsistenciaRecord[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* el estado igual se actualiza aunque falle la persistencia */
    }
    setAsistencia(data);
  };

  // Recalcula un dia con la unica fuente de verdad: calcularIncidencia.
  const recalcular = (
    rec: AsistenciaRecord,
    cambios: Partial<Pick<AsistenciaRecord, "turno" | "entrada" | "salida">>
  ): AsistenciaRecord => {
    const turno = cambios.turno ?? rec.turno;
    const entrada = cambios.entrada !== undefined ? cambios.entrada : rec.entrada;
    const salida = cambios.salida !== undefined ? cambios.salida : rec.salida;
    const calc = calcularIncidencia({
      turno,
      entrada,
      salida,
      esFeriado: FERIADOS_SET.has(rec.fecha),
    });
    return { ...rec, turno, entrada, salida, ...calc };
  };

  const importarArchivo = (texto: string, sucursal: string): ReporteImportacion => {
    const { registros, reporte } = parsearArchivo(texto, { sucursal, feriados: fechasFeriado() });
    guardarAsistencia(registros);
    return reporte;
  };

  const corregirPonche = (idReloj: string, fecha: string, entrada: string | null, salida: string | null) => {
    guardarAsistencia(
      asistencia.map((r) =>
        r.id_reloj === idReloj && r.fecha === fecha ? recalcular(r, { entrada, salida }) : r
      )
    );
  };

  const actualizarTurno = (idReloj: string, fecha: string, turno: string | null) => {
    guardarAsistencia(
      asistencia.map((r) =>
        r.id_reloj === idReloj && r.fecha === fecha ? recalcular(r, { turno }) : r
      )
    );
  };

  const agregarRegistro = (
    idReloj: string,
    fecha: string,
    turno: string | null,
    entrada: string | null,
    salida: string | null
  ) => {
    if (asistencia.some((r) => r.id_reloj === idReloj && r.fecha === fecha)) return;
    const emp = empleados.find((e) => e.id_reloj === idReloj);
    const calc = calcularIncidencia({ turno, entrada, salida, esFeriado: FERIADOS_SET.has(fecha) });
    const nuevo: AsistenciaRecord = {
      id_reloj: idReloj,
      fecha,
      sucursal: emp?.sucursal_principal ?? "T1",
      turno,
      entrada,
      salida,
      ...calc,
    };
    guardarAsistencia([nuevo, ...asistencia]);
  };

  const eliminarRegistro = (idReloj: string, fecha: string) => {
    guardarAsistencia(asistencia.filter((r) => !(r.id_reloj === idReloj && r.fecha === fecha)));
  };

  const actualizarTasas = (tasas: Tasas) => setConfigTasas(tasas);

  return (
    <PayContext.Provider
      value={{
        activeTab,
        setActiveTab,
        empleados,
        asistencia,
        incidencias,
        configTasas,
        fechaSistema: CONFIG_SISTEMA.FECHA_ACTUAL,
        periodoInicio: CONFIG_SISTEMA.QUINCENA_INICIO,
        periodoFin: CONFIG_SISTEMA.QUINCENA_FIN,
        importarArchivo,
        corregirPonche,
        actualizarTurno,
        agregarRegistro,
        eliminarRegistro,
        actualizarTasas,
      }}
    >
      {children}
    </PayContext.Provider>
  );
}

export const usePay = () => {
  const context = useContext(PayContext);
  if (!context) throw new Error("usePay debe usarse dentro de un PayContextProvider");
  return context;
};