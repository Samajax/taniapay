"use client";
import React from "react";
import { usePay } from "@/context/PayContext";

export default function Header() {
  const { activeTab } = usePay();

  // Diccionario indexado estrictamente mapeado para TypeScript
  const titles: Record<string, string> = {
    dashboard: "Resumen Operativo",
    nomina: "Cálculo de Nómina Quincenal",
    ponches: "Auditoría de Ponches y Tardanzas",
    incidencias: "Registro de Excepciones e Incidencias",
    empleados: "Empleados",
    reportes: "Reportes Financieros y Layouts",
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between flex-shrink-0">
      <h1 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
        {titles[activeTab] || "TaniaPay"}
      </h1>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-50 border-2 border-[#C8A96E] flex items-center justify-center font-bold text-xs text-[#C8A96E]">
          AD
        </div>
      </div>
    </header>
  );
}