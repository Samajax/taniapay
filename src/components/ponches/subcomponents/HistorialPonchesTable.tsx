"use client";
import React, { useMemo, useState } from "react";
import { Edit3, Trash2, Check, X, UserCheck } from "lucide-react";
import { getAlertaEstilo, minutosATexto, formatMonto } from "../hooks/useAsistenciaUtils";
import { calcularDescuento } from "../lib/calcularDescuento";
import type { AsistenciaRecord, Empleado, Tasas } from "../types";

interface Props {
  registros: AsistenciaRecord[];
  empleados: Empleado[];
  tasas: Tasas;
  selectedIdReloj: string;
  setSelectedIdReloj: (id: string) => void;
  onCorregir: (idReloj: string, fecha: string, entrada: string | null, salida: string | null) => void;
  onEliminar: (idReloj: string, fecha: string) => void;
}

const claveFila = (r: AsistenciaRecord) => `${r.id_reloj}|${r.fecha}`;

export default function HistorialPonchesTable({
  registros,
  empleados,
  tasas,
  selectedIdReloj,
  setSelectedIdReloj,
  onCorregir,
  onEliminar,
}: Props) {
  const empPorId = useMemo(() => {
    const m = new Map<string, Empleado>();
    empleados.forEach((e) => m.set(e.id_reloj, e));
    return m;
  }, [empleados]);

  const [editId, setEditId] = useState<string | null>(null);
  const [nuevaEntrada, setNuevaEntrada] = useState("");
  const [nuevaSalida, setNuevaSalida] = useState("");

  const iniciar = (r: AsistenciaRecord) => {
    setEditId(claveFila(r));
    setNuevaEntrada(r.entrada ?? "08:00");
    setNuevaSalida(r.salida ?? "17:00");
  };

  const guardar = (r: AsistenciaRecord) => {
    onCorregir(r.id_reloj, r.fecha, nuevaEntrada || null, nuevaSalida || null);
    setEditId(null);
  };

  if (registros.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center gap-2 text-slate-400">
        <UserCheck className="w-8 h-8 opacity-20" />
        <p className="font-medium text-sm">No hay registros con los filtros seleccionados.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs min-w-[900px] border-separate border-spacing-0">
        <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase">
          <tr>
            <th className="p-3 pl-6 border-b">Colaborador</th>
            <th className="p-3 border-b">Fecha</th>
            <th className="p-3 border-b">Turno</th>
            <th className="p-3 border-b">Entrada</th>
            <th className="p-3 border-b">Salida</th>
            <th className="p-3 border-b">Incidencia</th>
            <th className="p-3 border-b">Desfase</th>
            <th className="p-3 border-b text-right">Monto</th>
            <th className="p-3 pr-6 border-b text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {registros.map((r) => {
            const emp = empPorId.get(r.id_reloj);
            const enEdicion = editId === claveFila(r);
            const seleccionado = selectedIdReloj === r.id_reloj;
            const monto = emp ? calcularDescuento(r, emp, tasas) : 0;
            return (
              <tr
                key={claveFila(r)}
                onClick={() => setSelectedIdReloj(r.id_reloj)}
                className={`cursor-pointer transition-all hover:bg-slate-50/50 ${
                  seleccionado ? "bg-emerald-50/30" : ""
                }`}
              >
                <td className="p-3 pl-6">
                  <div className="font-bold uppercase text-slate-800">{emp?.nombre ?? r.id_reloj}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    ID {r.id_reloj} • {emp?.cargo ?? "—"} • {r.sucursal}
                  </div>
                </td>
                <td className="p-3 font-mono text-slate-500">{r.fecha}</td>
                <td className="p-3 text-slate-500">{r.turno ?? "Sin turno"}</td>

                {enEdicion ? (
                  <>
                    <td className="p-3">
                      <input
                        type="time"
                        value={nuevaEntrada}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setNuevaEntrada(e.target.value)}
                        className="bg-slate-50 border rounded-lg px-2 py-1 text-xs outline-none"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="time"
                        value={nuevaSalida}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setNuevaSalida(e.target.value)}
                        className="bg-slate-50 border rounded-lg px-2 py-1 text-xs outline-none"
                      />
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-3 font-mono">{r.entrada ?? "—"}</td>
                    <td className="p-3 font-mono">{r.salida ?? "—"}</td>
                  </>
                )}

                <td className="p-3">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[9px] border font-black uppercase tracking-tighter ${getAlertaEstilo(
                      r.tipo_incidencia
                    )}`}
                  >
                    {r.tipo_incidencia}
                  </span>
                </td>

                <td className="p-3 text-[10px] font-mono text-slate-500">
                  {r.retraso_minutos > 0 && (
                    <span className="text-amber-600">+{minutosATexto(r.retraso_minutos)} tarde </span>
                  )}
                  {r.salida_temprana_minutos > 0 && (
                    <span className="text-orange-600">-{minutosATexto(r.salida_temprana_minutos)} antes</span>
                  )}
                  {r.retraso_minutos === 0 && r.salida_temprana_minutos === 0 && "—"}
                </td>

                <td className="p-3 text-right font-mono font-bold text-xs">
                  {!emp || monto === 0 ? (
                    <span className="text-slate-300">—</span>
                  ) : (
                    <span className={monto < 0 ? "text-rose-600" : "text-emerald-600"}>
                      {monto < 0 ? "−" : "+"}
                      {formatMonto(Math.abs(monto))}
                    </span>
                  )}
                </td>

                <td className="p-3 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                  {enEdicion ? (
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => guardar(r)} className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditId(null)} className="p-1.5 rounded-lg bg-slate-100 text-slate-500">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => iniciar(r)} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEliminar(r.id_reloj, r.fecha)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}