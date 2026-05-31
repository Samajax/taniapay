"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  Empleado, 
  AsistenciaRecord, 
  EMPLEADOS_INICIALES, 
  ASISTENCIA_INICIAL, 
  CONFIG_SISTEMA 
} from "@/data/mockData";

export interface Incidencia {
  id_incidencia: string;
  id_reloj: string;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string;
  observaciones: string;
  id_reloj_cubre?: string;
  fecha_registro: string;
}

interface PayContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  empleados: Empleado[];
  asistencia: AsistenciaRecord[];
  incidencias: Incidencia[];
  configTasas: { diaTrabajo: number; hora: number; he: number; feriado: number };
  feriados: any[];
  corregirPoncheIndividual: (id_compuesto: string, entrada: string, salida: string) => void;
  corregirTodosErroresMasivo: () => void;
  aprobarHorasExtras: (id_compuesto: string) => void;
  actualizarConfigTasas: (nuevasTasas: any) => void;
  // Nuevas funciones CRUD
  agregarNuevoRegistroAsistencia: (id_reloj: string, fecha: string) => void;
  eliminarRegistroAsistencia: (id_compuesto: string) => void;
  actualizarTurnoOEstado: (id_compuesto: string, nuevoEstado: string) => void;
  fechaSistema: string;
  periodoInicio: string;
  periodoFin: string;
}

const PayContext = createContext<PayContextType | undefined>(undefined);

export function PayContextProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [empleados] = useState<Empleado[]>(EMPLEADOS_INICIALES);
  const [asistencia, setAsistencia] = useState<AsistenciaRecord[]>([]);
  const [incidencias] = useState<Incidencia[]>([]);

  const [configTasas] = useState({
    diaTrabajo: 1153.57,
    hora: 144.20,
    he: 194.67,
    feriado: 1153.57
  });

  useEffect(() => {
    const localAsistencia = localStorage.getItem("taniapay_asistencia");
    if (localAsistencia) {
      setAsistencia(JSON.parse(localAsistencia));
    } else {
      setAsistencia(ASISTENCIA_INICIAL);
    }
  }, []);

  const saveAndSetAsistencia = (data: AsistenciaRecord[]) => {
    localStorage.setItem("taniapay_asistencia", JSON.stringify(data));
    setAsistencia(data);
  };

  // --- AÑADIR REGISTRO ---
  const agregarNuevoRegistroAsistencia = (id_reloj: string, fecha: string) => {
    const existe = asistencia.some(r => r.id_reloj === id_reloj && r.fecha === fecha);
    if (existe) return;

    const nuevoRegistro: AsistenciaRecord = {
      id_registro: `${id_reloj}-${fecha}`,
      id_reloj,
      fecha,
      entrada: "08:00",
      salida: "17:00",
      turno: "Matutino",
      error_reloj: false
    };
    saveAndSetAsistencia([nuevoRegistro, ...asistencia]);
  };

  // --- ELIMINAR REGISTRO ---
  const eliminarRegistroAsistencia = (id_compuesto: string) => {
    const filtradas = asistencia.filter(rec => `${rec.id_reloj}-${rec.fecha}` !== id_compuesto);
    saveAndSetAsistencia(filtradas);
  };

  // --- ACTUALIZAR TURNO / ESTADO (Lógica de limpieza para Libre/Feriado) ---
  const actualizarTurnoOEstado = (id_compuesto: string, nuevoEstado: string) => {
    const actualizadas = asistencia.map((rec) => {
      if (`${rec.id_reloj}-${rec.fecha}` === id_compuesto) {
        const esEspecial = nuevoEstado === "LIBRE" || nuevoEstado === "FERIADO";
        return {
          ...rec,
          turno: nuevoEstado,
          entrada: esEspecial ? "—" : (rec.entrada === "—" ? "08:00" : rec.entrada),
          salida: esEspecial ? "—" : (rec.salida === "—" ? "17:00" : rec.salida),
          error_reloj: esEspecial ? false : rec.error_reloj
        };
      }
      return rec;
    });
    saveAndSetAsistencia(actualizadas);
  };

  const corregirPoncheIndividual = (id_compuesto: string, hEntrada: string, hSalida: string) => {
    const actualizadas = asistencia.map((rec) => {
      const currentId = `${rec.id_reloj}-${rec.fecha}`;
      if (currentId === id_compuesto) {
        return { ...rec, entrada: hEntrada, salida: hSalida, error_reloj: false };
      }
      return rec;
    });
    saveAndSetAsistencia(actualizadas);
  };

  const aprobarHorasExtras = (id_compuesto: string) => {
    const actualizadas = asistencia.map((rec) => {
      const currentId = `${rec.id_reloj}-${rec.fecha}`;
      return currentId === id_compuesto ? { ...rec, he_aprobada: true } : rec;
    });
    saveAndSetAsistencia(actualizadas);
  };

  const corregirTodosErroresMasivo = () => {
    const actualizadas = asistencia.map((rec) => {
      if (rec.error_reloj) {
        let hEntrada = rec.entrada && rec.entrada !== "—" ? rec.entrada : "08:00";
        let hSalida = rec.salida && rec.salida !== "—" ? rec.salida : "17:00";
        return { ...rec, entrada: hEntrada, salida: hSalida, error_reloj: false };
      }
      return rec;
    });
    saveAndSetAsistencia(actualizadas);
  };

  return (
    <PayContext.Provider value={{ 
      activeTab, setActiveTab, empleados, asistencia, incidencias,
      configTasas, feriados: [], 
      corregirPoncheIndividual, corregirTodosErroresMasivo, aprobarHorasExtras,
      agregarNuevoRegistroAsistencia, eliminarRegistroAsistencia, actualizarTurnoOEstado,
      actualizarConfigTasas: () => {},
      fechaSistema: CONFIG_SISTEMA.FECHA_ACTUAL,
      periodoInicio: CONFIG_SISTEMA.QUINCENA_INICIO,
      periodoFin: CONFIG_SISTEMA.QUINCENA_FIN,
    }}>
      {children}
    </PayContext.Provider>
  );
}

export const usePay = () => {
  const context = useContext(PayContext);
  if (!context) throw new Error("usePay debe usarse dentro de un PayContextProvider");
  return context;
};