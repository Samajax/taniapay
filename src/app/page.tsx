"use client";
import React from "react";
import { usePay } from "@/context/PayContext";
import Sidebar from "@/components/shared/Sidebar";
import Header from "@/components/shared/Header";
import DashboardView from "@/components/dashboard/DashboardView";
import EmpleadosView from "@/components/empleados/EmpleadosView"; // <-- Importación del módulo de la Etapa 2
import PonchesView from "@/components/ponches/PonchesView"; // <-- Nueva importación de la Etapa 3
import IncidenciasView from "@/components/incidencias/IncidenciasView"; // <-- Nueva importación de la Etapa 3
import NominaView from "@/components/nomina/NominaView"; // <-- Nueva importación de la Etapa 3

export default function Home() {
  const { activeTab } = usePay();

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans">
      {/* 1. SIDEBAR DE NAVEGACIÓN FIJA (IZQUIERDA) */}
      <Sidebar />

      {/* 2. CONTENEDOR DE VISTAS DINÁMICAS (DERECHA) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Encabezado superior adaptativo */}
        <Header />
        
        {/* Área de trabajo con scroll independiente y seguro */}
        <main className="flex-1 p-8 overflow-auto">
          {/* Carga condicional de pantallas según el estado del menú */}
          {activeTab === "dashboard" && <DashboardView />}
          {activeTab === "empleados" && <EmpleadosView />} {/* <-- Renderiza el maestro de personal real */}
          {activeTab === "ponches" && <PonchesView />} {/* <-- Renderización de Etapa 3 */}
          {activeTab === "incidencias" && <IncidenciasView />}

          {activeTab === "nomina" && <NominaView />}


          {/* MARCADORES GRÁFICOS TEMPORALES PARA LAS FUTURAS ETAPAS */}
          {activeTab === "nomina" && (
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm text-sm text-slate-400 italic">
              Módulo de Nómina Quincenal (Maquetación en Etapa 4)
            </div>
          )}
       
          {activeTab === "incidencias" && (
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm text-sm text-slate-400 italic">
              Módulo de Registro de Incidencias (Maquetación en Etapa 3)
            </div>
          )}
          {activeTab === "reportes" && (
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm text-sm text-slate-400 italic">
              Módulo de Reportes y Layout BHD (Maquetación en Etapa 4)
            </div>
          )}
        </main>
      </div>
    </div>
  );
}