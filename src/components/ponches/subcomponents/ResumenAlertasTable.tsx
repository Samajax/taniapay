"use client";
import React from "react";
import { 
  formatMonto, 
  getAlertaEstilo 
} from "../hooks/useAsistenciaUtils";
import { AlertCircle, UserCheck, Wallet } from "lucide-react";

interface Props {
  listaGroupedTardanzas: any[];
  selectedIdReloj: string;
  setSelectedIdReloj: (id: string) => void;
}

export default function ResumenAlertasTable({ 
  listaGroupedTardanzas, 
  selectedIdReloj, 
  setSelectedIdReloj 
}: Props) {
  return (
    <table className="w-full text-left text-xs min-w-[900px] border-separate border-spacing-0">
      <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase border-b h-12 sticky top-0 z-10 backdrop-blur-sm">
        <tr>
          <th className="p-3 pl-6 border-b">Colaborador / Expediente</th>
          <th className="p-3 border-b">Sucursal Principal</th>
          <th className="p-3 text-center border-b">Alertas Activas en el Periodo</th>
          <th className="p-3 pr-6 text-right border-b">Impacto Total en Nómina</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {listaGroupedTardanzas.length === 0 ? (
          <tr>
            <td colSpan={4} className="py-12 text-center">
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <UserCheck className="w-8 h-8 opacity-20" />
                <p className="font-medium">No hay alertas activas en los filtros seleccionados.</p>
              </div>
            </td>
          </tr>
        ) : (
          listaGroupedTardanzas.map((g) => {
            const tieneImpactoNegativo = g.totalDescuento < 0;
            const tieneImpactoPositivo = g.totalDescuento > 0;

            return (
              <tr 
                key={g.id_reloj} 
                onClick={() => setSelectedIdReloj(g.id_reloj)} 
                className={`group cursor-pointer transition-all hover:bg-slate-50/50 ${
                  selectedIdReloj === g.id_reloj ? "bg-emerald-50/30 border-l-4 border-emerald-500" : "border-l-4 border-transparent"
                }`}
              >
                {/* INFO COLABORADOR */}
                <td className="p-4 pl-6">
                  <div className="font-bold uppercase text-slate-800 group-hover:text-emerald-700 transition-colors">
                    {g.nombre}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    ID Reloj: {g.id_reloj} • {g.cargo}
                  </div>
                </td>

                {/* SUCURSAL */}
                <td className="p-4 uppercase text-[10px] font-bold text-slate-500 tracking-tight">
                  {g.sucursal_principal}
                </td>

                {/* ETIQUETAS DE ALERTAS ACUMULADAS */}
                <td className="p-4 text-center">
                  <div className="flex justify-center gap-1.5 flex-wrap">
                    {Array.from(g.alertasAcumuladas).map((alerta: any) => (
                      <span 
                        key={alerta} 
                        className={`px-2.5 py-1 rounded-lg text-[9px] border font-black shadow-sm uppercase tracking-tighter ${getAlertaEstilo(alerta)}`}
                      >
                        {alerta === "HE por Aprobar" ? (
                          <span className="flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5" /> {alerta}
                          </span>
                        ) : alerta}
                      </span>
                    ))}
                    {g.alertasAcumuladas.size === 0 && (
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        SIN NOVEDADES
                      </span>
                    )}
                  </div>
                </td>

                {/* MONTO ACUMULADO */}
                <td className="p-4 pr-6 text-right">
                  <div className="flex flex-col items-end">
                    <div className={`font-mono font-black text-sm flex items-center gap-1 ${
                      tieneImpactoNegativo ? "text-rose-600" : tieneImpactoPositivo ? "text-emerald-600" : "text-slate-400"
                    }`}>
                      {tieneImpactoNegativo ? (
                        <Wallet className="w-3.5 h-3.5 opacity-50" />
                      ) : null}
                      {g.totalDescuento === 0 ? "RD$ 0.00" : (tieneImpactoPositivo ? "+" : "") + formatMonto(g.totalDescuento)}
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                      {tieneImpactoNegativo ? "Retención Estimada" : tieneImpactoPositivo ? "Incentivo Acumulado" : "Balance Limpio"}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}