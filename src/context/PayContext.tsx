"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  Empleado, 
  AsistenciaRecord, 
  EMPLEADOS_INICIALES, 
  ASISTENCIA_INICIAL, 
  CONFIG_SISTEMA 
} from "@/data/mockData";

// --- INTERFACES ---
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
  // Configuración de Nómina
  configTasas: { diaTrabajo: number; hora: number; he: number; feriado: number };
  feriados: any[];
  // Métodos de Asistencia
  corregirPoncheIndividual: (id_registro: string, entrada: string, salida: string) => void;
  corregirTodosErroresMasivo: () => void;
  actualizarConfigTasas: (nuevasTasas: any) => void;
  // Otros
  fechaSistema: string;
  periodoInicio: string;
  periodoFin: string;
}

const PayContext = createContext<PayContextType | undefined>(undefined);

export function PayContextProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [empleados] = useState<Empleado[]>(EMPLEADOS_INICIALES);
  
  // --- PERSISTENCIA LOCAL PARA ASISTENCIA ---
  const [asistencia, setAsistencia] = useState<AsistenciaRecord[]>([]);
  const [incidencias] = useState<Incidencia[]>([]); // Aquí conectarías tus incidencias reales
  
  // --- CONFIGURACIÓN DE TASAS (Sincronizada con PonchesView) ---
  const [configTasas, setConfigTasas] = useState({
    diaTrabajo: 1153.57,
    hora: 144.20,
    he: 194.67,
    feriado: 288.40
  });

  const [feriados] = useState([
    { id: 1, fecha: "2026-05-04", nombre: "Día del Trabajo", confirmado: true },
    { id: 2, fecha: "2026-06-04", nombre: "Día de Corpus Christi", confirmado: true },
  ]);

  // Cargar datos al arrancar para que las correcciones no se pierdan al recargar
  useEffect(() => {
    const localAsistencia = localStorage.getItem("taniapay_asistencia");
    if (localAsistencia) {
      setAsistencia(JSON.parse(localAsistencia));
    } else {
      setAsistencia(ASISTENCIA_INICIAL);
    }
  }, []);

  // --- MÉTODOS DE ASISTENCIA (Lógica de Negocio) ---

  const corregirPoncheIndividual = (id_registro: string, hEntrada: string, hSalida: string) => {
    setAsistencia((prev) => {
      const actualizadas = prev.map((rec) =>
        rec.id_registro === id_registro
          ? { 
              ...rec, 
              hora_entrada: hEntrada, 
              hora_salida: hSalida, 
              error_reloj: false, 
              tipo_incidencia: "Normal" 
            }
          : rec
      );
      localStorage.setItem("taniapay_asistencia", JSON.stringify(actualizadas));
      return actualizadas;
    });
  };

  const corregirTodosErroresMasivo = () => {
    setAsistencia((prev) => {
      const actualizadas = prev.map((rec) => {
        if (rec.error_reloj) {
          // Buscamos el horario del empleado para no poner 17:00 a todos por igual
          const emp = empleados.find(e => e.id_reloj === rec.id_reloj);
          let hEntrada = rec.hora_entrada && rec.hora_entrada !== "—" ? rec.hora_entrada : "08:00:00";
          let hSalida = rec.hora_salida && rec.hora_salida !== "—" ? rec.hora_salida : "17:00:00";

          // Si el turno está definido en el registro, lo usamos
          if (rec.turno && rec.turno.includes("-")) {
            const [tE, tS] = rec.turno.split("-");
            if (rec.hora_entrada === "—") hEntrada = tE + ":00";
            if (rec.hora_salida === "—") hSalida = tS + ":00";
          }

          return { 
            ...rec, 
            hora_entrada: hEntrada,
            hora_salida: hSalida, 
            error_reloj: false, 
            tipo_incidencia: "Normal" 
          };
        }
        return rec;
      });
      localStorage.setItem("taniapay_asistencia", JSON.stringify(actualizadas));
      return actualizadas;
    });
  };

  const actualizarConfigTasas = (nuevasTasas: any) => {
    setConfigTasas(nuevasTasas);
    // Podrías persistir esto también en localStorage si lo deseas
  };

  return (
    <PayContext.Provider value={{ 
      activeTab, setActiveTab, empleados, asistencia, incidencias,
      configTasas, feriados,
      corregirPoncheIndividual, corregirTodosErroresMasivo, actualizarConfigTasas,
      fechaSistema: CONFIG_SISTEMA.FECHA_ACTUAL,
      periodoInicio: CONFIG_SISTEMA.QUINCENA_INICIO,
      periodoFin: CONFIG_SISTEMA.QUINCENA_FIN,
    }}>
      {children}
    </PayContext.Provider>
  );
}

export function usePay() {
  const context = useContext(PayContext);
  if (!context) throw new Error("usePay debe usarse dentro de un PayContextProvider");
  return context;
}