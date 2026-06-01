"use client";
import React from "react";
import { IdCard, CalendarDays } from "lucide-react";
import { formatMonto, getAlertaEstilo, minutosATexto } from "../hooks/useAsistenciaUtils";
import type { AsistenciaRecord, Empleado } from "../types";

interface Props {
  empleado?: Empleado;
  registros: AsistenciaRecord[];
  totalDescuento: number;
}

export default function ExpedienteLateral({ empleado, registros, totalDescuento }: Props) {
  if (!empleado) {
    return (
      <aside className="hidden lg:flex w-[360px] shrink-0 bg-white border rounded-2xl shadow-sm items-center justify-center p-6">
        <div className="text-center text-slate-400">
          <IdCard className="w-8 h-8 mx-auto opacity-20 mb-2" />
          <p className="text-sm font-medium">Selecciona un colaborador para ver su expediente.</p>
        </div>
      </aside>
    );
  }

  const totalDesfase = registros.reduce(
    (acc, r) => acc + r.retraso_minutos + r.salida_temprana_minutos,
    0
  );
  const negativo = totalDescuento < 0;
  const positivo = totalDescuento > 0;

  return (
    <aside className="hidden lg:flex w-[360px] shrink-0 flex-col bg-white border rounded-2xl shadow-sm overflow-hidden">
      {/* Encabezado */}
      <div className="p-5 border-b">
        <div className="font-bold uppercase text-slate-800">{empleado.nombre}</div>
        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
          ID {empleado.id_reloj} • {empleado.cargo} • {empleado.sucursal_principal}
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 divide-x border-b text-center">
        <div className="p-3">
          <div className="text-[9px] text-slate-400 font-bold uppercase">Días</div>
          <div className="text-lg font-black text-slate-700">{registros.length}</div>
        </div>
        <div className="p-3">
          <div className="text-[9px] text-slate-400 font-bold uppercase">Desfase</div>
          <div className="text-lg font-black text-amber-600">{minutosATexto(totalDesfase)}</div>
        </div>
        <div className="p-3">
          <div className="text-[9px] text-slate-400 font-bold uppercase">Impacto</div>
          <div
            className={`text-sm font-mono font-black ${
              negativo ? "text-rose-600" : positivo ? "text-emerald-600" : "text-slate-400"
            }`}
          >
            {totalDescuento === 0 ? "RD$ 0" : (positivo ? "+" : "") + formatMonto(totalDescuento)}
          </div>
        </div>
      </div>

      {/* Detalle por día */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {registros.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
            <CalendarDays className="w-6 h-6 opacity-20" />
            Sin registros en el periodo filtrado.
          </div>
        ) : (
          registros.map((r) => (
            <div key={`${r.id_reloj}|${r.fecha}`} className="p-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-mono text-slate-600">{r.fecha}</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {r.entrada ?? "—"} – {r.salida ?? "—"}
                  {r.turno ? ` · ${r.turno}` : ""}
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-lg text-[9px] border font-black uppercase tracking-tighter shrink-0 ${getAlertaEstilo(
                  r.tipo_incidencia
                )}`}
              >
                {r.tipo_incidencia}
              </span>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}