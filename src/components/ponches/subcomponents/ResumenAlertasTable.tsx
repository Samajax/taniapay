"use client";
import React from "react";
import { Wallet, UserCheck } from "lucide-react";
import { formatMonto, getAlertaEstilo } from "../hooks/useAsistenciaUtils";
import type { GrupoEmpleado } from "../types";

interface Props {
  grupos: GrupoEmpleado[];
  selectedIdReloj: string;
  setSelectedIdReloj: (id: string) => void;
}

export default function ResumenAlertasTable({
  grupos,
  selectedIdReloj,
  setSelectedIdReloj,
}: Props) {
  if (grupos.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center gap-2 text-slate-400">
        <UserCheck className="w-8 h-8 opacity-20" />
        <p className="font-medium text-sm">No hay alertas con los filtros seleccionados.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs min-w-[900px] border-separate border-spacing-0">
        <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase">
          <tr>
            <th className="p-3 pl-6 border-b">Colaborador / Expediente</th>
            <th className="p-3 border-b">Sucursal</th>
            <th className="p-3 text-center border-b">Alertas del Periodo</th>
            <th className="p-3 pr-6 text-right border-b">Impacto en Nómina</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {grupos.map((g) => {
            const negativo = g.totalDescuento < 0;
            const positivo = g.totalDescuento > 0;
            const alertas = Array.from(g.alertas);
            const seleccionado = selectedIdReloj === g.id_reloj;

            return (
              <tr
                key={g.id_reloj}
                onClick={() => setSelectedIdReloj(g.id_reloj)}
                className={`group cursor-pointer transition-all hover:bg-slate-50/50 ${
                  seleccionado
                    ? "bg-emerald-50/30 border-l-4 border-emerald-500"
                    : "border-l-4 border-transparent"
                }`}
              >
                <td className="p-4 pl-6">
                  <div className="font-bold uppercase text-slate-800 group-hover:text-emerald-700 transition-colors">
                    {g.nombre}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    ID {g.id_reloj} • {g.cargo}
                  </div>
                </td>

                <td className="p-4 uppercase text-[10px] font-bold text-slate-500 tracking-tight">
                  {g.sucursal}
                </td>

                <td className="p-4 text-center">
                  <div className="flex justify-center gap-1.5 flex-wrap">
                    {alertas.length === 0 ? (
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        SIN NOVEDADES
                      </span>
                    ) : (
                      alertas.map((a) => (
                        <span
                          key={a}
                          className={`px-2.5 py-1 rounded-lg text-[9px] border font-black uppercase tracking-tighter ${getAlertaEstilo(
                            a
                          )}`}
                        >
                          {a}
                        </span>
                      ))
                    )}
                  </div>
                </td>

                <td className="p-4 pr-6 text-right">
                  <div className="flex flex-col items-end">
                    <div
                      className={`font-mono font-black text-sm flex items-center gap-1 ${
                        negativo ? "text-rose-600" : positivo ? "text-emerald-600" : "text-slate-400"
                      }`}
                    >
                      {negativo && <Wallet className="w-3.5 h-3.5 opacity-50" />}
                      {g.totalDescuento === 0
                        ? "RD$ 0.00"
                        : (positivo ? "+" : "") + formatMonto(g.totalDescuento)}
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                      {negativo ? "Retención" : positivo ? "Incentivo" : "Balance limpio"}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}