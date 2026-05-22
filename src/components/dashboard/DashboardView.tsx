"use client";
import React from "react";

interface MetricCard {
  label: string;
  value: string;
  sub: string;
  color: string;
}

export default function DashboardView() {
  const metrics: MetricCard[] = [
    { label: "Masa Salarial Bruta", value: "RD$ 131,237.19", sub: "10 Colaboradores activos", color: "text-[#C8A96E]" },
    { label: "Retenciones TSS Proyectadas", value: "RD$ 7,756.11", sub: "AFP 2.87% + ARS 3.04%", color: "text-blue-600" },
    { label: "Balances CxC (Vales)", value: "RD$ 23,500.00", sub: "Descuentos por planilla", color: "text-red-600" },
    { label: "Farmacias del Grupo", value: "9 Sucursales", sub: "T1 a T9 Mapeadas", color: "text-emerald-600" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* GRILLA CON RENDIMIENTO RESPONSIVO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              {m.label}
            </span>
            <span className={`text-xl font-bold font-mono block ${m.color}`}>
              {m.value}
            </span>
            <span className="text-xs text-slate-400 block mt-1">
              {m.sub}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800 mb-2">Entorno Gráfico Base Inicializado</h3>
        <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
          La estructura de navegación por estado local está activa. Puedes utilizar el menú lateral izquierdo para alternar entre los diferentes módulos operativos. El sistema cambiará las vistas de forma instantánea sin recargar la página.
        </p>
      </div>
    </div>
  );
}