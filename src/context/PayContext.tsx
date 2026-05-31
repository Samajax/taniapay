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

  // --- CORRECCIÓN POR ID COMPUESTO (id_reloj-fecha) ---
  const corregirPoncheIndividual = (id_compuesto: string, hEntrada: string, hSalida: string) => {
    const actualizadas = asistencia.map((rec) => {
      // Creamos la llave de comparación para cada registro
      const currentId = `${rec.id_reloj}-${rec.fecha}`;
      
      if (currentId === id_compuesto) {
        return { 
          ...rec, 
          entrada: hEntrada, 
          salida: hSalida, 
          error_reloj: false, 
          tipo_incidencia: "Normal" 
        };
      }
      return rec;
    });
    saveAndSetAsistencia(actualizadas);
  };

  // --- APROBACIÓN POR ID COMPUESTO ---
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

        if (rec.turno && rec.turno.includes("-")) {
          const [tE, tS] = rec.turno.split("-");
          if (rec.entrada === "—") hEntrada = tE;
          if (rec.salida === "—") hSalida = tS;
        }

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