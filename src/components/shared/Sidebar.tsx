"use client";
import React from "react";
import { usePay } from "@/context/PayContext";

interface MenuItem {
  id: string;
  label: string;
  icon: string;
}

export default function Sidebar() {
  const { activeTab, setActiveTab } = usePay();

  const menuItems: MenuItem[] = [
    { id: "dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { id: "nomina", label: "Nómina", icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M12 7h.01M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { id: "ponches", label: "Ponches", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    { id: "incidencias", label: "Incidencias", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
    { id: "empleados", label: "Empleados", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
    { id: "reportes", label: "Reportes", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  ];

  return (
    <div className="w-60 bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0 px-4">
      {/* BRAND CORPORATIVO */}
      <div className="py-8 px-3 border-b border-slate-100 flex items-center gap-2">
        <svg className="w-6 h-6 text-[#C8A96E]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        <span className="text-xl font-bold text-[#C8A96E] tracking-tight">
          Tania<span className="text-slate-700">Pay</span>
        </span>
      </div>

      {/* ELEMENTOS DE MENÚ */}
      <div className="flex-1 pt-6">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 mb-1 ${
                isActive
                  ? "bg-[#FFFDF9] text-[#C8A96E] border-l-4 border-[#C8A96E] pl-3 font-semibold"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {item.label}
            </button>
          );
        })}
      </div>

      {/* MARCADOR DE QUINCENA */}
      <div className="py-6 border-t border-slate-100 flex flex-col gap-1 px-2">
        <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Quincena Activa</span>
        <span className="text-xs font-semibold text-[#C8A96E]">1–14 Mayo 2026</span>
      </div>
    </div>
  );
}