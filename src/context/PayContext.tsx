"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { Empleado, AsistenciaRecord, EMPLEADOS_INICIALES, ASISTENCIA_INICIAL, CONFIG_SISTEMA } from "@/data/mockData";

export interface Incidencia {
  id_incidencia: string;
  id_reloj: string;
  tipo: "Permiso" | "Licencia médica" | "Maternidad" | "Cuentas por Cobrar (CXC)" | "Vales / Faltantes de caja";
  fecha_inicio: string;
  fecha_fin: string;
  horas_permiso?: number; 
  monto?: number;
  cuotas?: number;
  tiene_cobertura?: boolean;
  id_reloj_cubre?: string;
  observaciones: string;
  fecha_registro: string;
}

interface PayContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  empleados: Empleado[];
  updateEmpleado: (id_reloj: string, updatedData: Partial<Empleado>) => void;
  addEmpleado: (nuevo: Empleado) => void;
  asistencia: AsistenciaRecord[];
  corregirPoncheIndividual: (id_registro: string, horaSalidaFijada: string) => void;
  corregirTodosErroresMasivo: () => void;
  incidencias: Incidencia[];
  addIncidencia: (nueva: Incidencia) => void;
  eliminarIncidencia: (id: string) => void;
  fechaSistema: string;
  periodoInicio: string;
  periodoFin: string;
  nominaAprobada: boolean;
  setNominaAprobada: (aprobada: boolean) => void;
  bhdArchivoTexto: string;
  setBhdArchivoTexto: (texto: string) => void;
}

const PayContext = createContext<PayContextType | undefined>(undefined);

const INCIDENCIAS_INICIALES: Incidencia[] = [
  {
    id_incidencia: "INC-01",
    id_reloj: "T1040",
    tipo: "Permiso",
    fecha_inicio: "2026-05-16",
    fecha_fin: "2026-05-16",
    horas_permiso: 3, 
    observaciones: "CITA MÉDICA EN EL HOMS POR LA MAÑANA",
    fecha_registro: "2026-05-14"
  }
];

export function PayContextProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [empleados, setEmpleados] = useState<Empleado[]>(EMPLEADOS_INICIALES);
  const [asistencia, setAsistencia] = useState<AsistenciaRecord[]>(ASISTENCIA_INICIAL);
  
  // --- CORE FIX: ESTADO PERSISTENTE LOCAL ---
  const [incidencias, setIncidenciasState] = useState<Incidencia[]>([]);

  // Cargar datos al arrancar
  useEffect(() => {
    const backup = localStorage.getItem("taniapay_local_incidencias");
    if (backup) {
      setIncidenciasState(JSON.parse(backup));
    } else {
      setIncidenciasState(INCIDENCIAS_INICIALES);
    }
  }, []);

  const [nominaAprobada, setNominaAprobada] = useState<boolean>(false);
  const [bhdArchivoTexto, setBhdArchivoTexto] = useState<string>("");

  const updateEmpleado = (id_reloj: string, updatedData: Partial<Empleado>) => {
    setEmpleados((prev) => prev.map((emp) => (emp.id_reloj === id_reloj ? { ...emp, ...updatedData } : emp)));
  };

  const addEmpleado = (nuevo: Empleado) => {
    setEmpleados((prev) => [...prev, nuevo]);
  };

  const corregirPoncheIndividual = (id_registro: string, horaSalidaFijada: string) => {
    setAsistencia((prev) =>
      prev.map((rec) =>
        rec.id_registro === id_registro
          ? { ...rec, hora_salida: horaSalidaFijada, error_reloj: false, tipo_incidencia: "Normal" }
          : rec
      )
    );
  };

  const corregirTodosErroresMasivo = () => {
    setAsistencia((prev) =>
      prev.map((rec) =>
        rec.error_reloj 
          ? { ...rec, hora_salida: "17:00:00", error_reloj: false, tipo_incidencia: "Normal" }
          : rec
      )
    );
  };

  // Enlazamos funciones con localStorage para que no mueran al refrescar Next.js
  const addIncidencia = (nueva: Incidencia) => {
    setIncidenciasState((prev) => {
      const actualizadas = [nueva, ...prev];
      localStorage.setItem("taniapay_local_incidencias", JSON.stringify(actualizadas));
      return actualizadas;
    });
  };

  const eliminarIncidencia = (id: string) => {
    setIncidenciasState((prev) => {
      const filtradas = prev.filter(i => i.id_incidencia !== id);
      localStorage.setItem("taniapay_local_incidencias", JSON.stringify(filtradas));
      return filtradas;
    });
  };

  return (
    <PayContext.Provider value={{ 
      activeTab, setActiveTab, empleados, updateEmpleado, addEmpleado,
      asistencia, corregirPoncheIndividual, corregirTodosErroresMasivo,
      incidencias, addIncidencia, eliminarIncidencia,
      fechaSistema: CONFIG_SISTEMA.FECHA_ACTUAL,
      periodoInicio: CONFIG_SISTEMA.QUINCENA_INICIO,
      periodoFin: CONFIG_SISTEMA.QUINCENA_FIN,
      nominaAprobada, setNominaAprobada,
      bhdArchivoTexto, setBhdArchivoTexto
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