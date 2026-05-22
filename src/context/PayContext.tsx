"use client";
import React, { createContext, useContext, useState } from "react";
import { Empleado, AsistenciaRecord, EMPLEADOS_INICIALES, ASISTENCIA_INICIAL, CONFIG_SISTEMA } from "@/data/mockData";

export interface Incidencia {
  id_incidencia: string;
  id_reloj: string;
  tipo: "Permiso" | "Licencia médica" | "Vacaciones" | "Sanción Disciplinaria";
  fecha_inicio: string;
  fecha_fin: string;
  horas_permiso?: number; // Para evaluar la regla de las 4.5 horas
  ya_pagada_adelantada: boolean; // Control estricto de flujo de efectivo de vacaciones
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
  // --- NUEVOS ESTADOS PARA INTEGRACIÓN DE LA ETAPA 4 ---
  nominaAprobada: boolean;
  setNominaAprobada: (aprobada: boolean) => void;
  bhdArchivoTexto: string;
  setBhdArchivoTexto: (texto: string) => void;
}

const PayContext = createContext<PayContextType | undefined>(undefined);

// MOCKS INICIALES DE INCIDENCIAS PARA VALIDAR REGLAS DE NEGOCIO
const INCIDENCIAS_INICIALES: Incidencia[] = [
  {
    id_incidencia: "INC-01",
    id_reloj: "102",
    tipo: "Permiso",
    fecha_inicio: "2026-05-16",
    fecha_fin: "2026-05-16",
    horas_permiso: 3, // Menor a 4.5 horas -> No descuenta nada
    ya_pagada_adelantada: false,
    observaciones: "CITA MÉDICA EN EL HOMS POR LA MAÑANA",
    fecha_registro: "2026-05-14"
  },
  {
    id_incidencia: "INC-02",
    id_reloj: "101",
    tipo: "Vacaciones",
    fecha_inicio: "2026-05-16",
    fecha_fin: "2026-05-31",
    ya_pagada_adelantada: true, // Provoca descuento quincenal porque ya cobró adelantado
    observaciones: "DISFRUTE DE PERIODO ANUAL CONSTITUCIONAL",
    fecha_registro: "2026-05-01"
  }
];

export function PayContextProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [empleados, setEmpleados] = useState<Empleado[]>(EMPLEADOS_INICIALES);
  const [asistencia, setAsistencia] = useState<AsistenciaRecord[]>(ASISTENCIA_INICIAL);
  const [incidencias, setIncidencias] = useState<Incidencia[]>(INCIDENCIAS_INICIALES);
  
  // --- ESTADOS GLOBALES DE NÓMINA (ETAPA 4) ---
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

  const addIncidencia = (nueva: Incidencia) => {
    setIncidencias((prev) => [nueva, ...prev]);
  };

  const eliminarIncidencia = (id: string) => {
    setIncidencias((prev) => prev.filter(i => i.id_incidencia !== id));
  };

  return (
    <PayContext.Provider value={{ 
      activeTab, setActiveTab, empleados, updateEmpleado, addEmpleado,
      asistencia, corregirPoncheIndividual, corregirTodosErroresMasivo,
      incidencias, addIncidencia, eliminarIncidencia,
      fechaSistema: CONFIG_SISTEMA.FECHA_ACTUAL,
      periodoInicio: CONFIG_SISTEMA.QUINCENA_INICIO,
      periodoFin: CONFIG_SISTEMA.QUINCENA_FIN,
      // --- EXPOSICIÓN DE LOS NUEVOS ATRIBUTOS ---
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