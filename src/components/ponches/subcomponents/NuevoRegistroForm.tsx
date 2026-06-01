"use client";
import React, { useState } from "react";
import { Check, X, Plus } from "lucide-react";
import type { Empleado } from "../types";

interface Props {
  empleados: Empleado[];
  onAgregar: (
    idReloj: string,
    fecha: string,
    turno: string | null,
    entrada: string | null,
    salida: string | null
  ) => void;
  onCerrar: () => void;
}

const hoyISO = () => new Date().toISOString().slice(0, 10);

export default function NuevoRegistroForm({ empleados, onAgregar, onCerrar }: Props) {
  const [idReloj, setIdReloj] = useState("");
  const [fecha, setFecha] = useState(hoyISO());

  const [tieneTurno, setTieneTurno] = useState(true);
  const [turnoIni, setTurnoIni] = useState("08:00");
  const [turnoFin, setTurnoFin] = useState("16:00");

  const [poncho, setPoncho] = useState(true);
  const [entrada, setEntrada] = useState("08:00");
  const [salida, setSalida] = useState("16:00");

  const valido = idReloj !== "" && fecha !== "";

  const agregar = () => {
    if (!valido) return;
    onAgregar(
      idReloj,
      fecha,
      tieneTurno ? `${turnoIni}-${turnoFin}` : null,
      poncho ? entrada : null,
      poncho ? salida : null
    );
  };

  const inputCls = "bg-slate-50 border rounded-xl px-3 py-2 text-xs outline-none";
  const labelCls = "text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block";

  return (
    <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-emerald-600" /> Nuevo registro
        </span>
        <button onClick={onCerrar} className="p-1 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className={labelCls}>Colaborador</label>
          <select value={idReloj} onChange={(e) => setIdReloj(e.target.value)} className={`${inputCls} w-full cursor-pointer`}>
            <option value="">Selecciona…</option>
            {empleados.map((e) => (
              <option key={e.id_reloj} value={e.id_reloj}>
                {e.nombre} — {e.sucursal_principal} (ID {e.id_reloj})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Fecha</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={`${inputCls} w-full`} />
        </div>

        <div>
          <label className={labelCls}>
            <span className="flex items-center gap-2 normal-case">
              <input type="checkbox" checked={tieneTurno} onChange={(e) => setTieneTurno(e.target.checked)} />
              Turno
            </span>
          </label>
          {tieneTurno ? (
            <div className="flex items-center gap-1">
              <input type="time" value={turnoIni} onChange={(e) => setTurnoIni(e.target.value)} className={inputCls} />
              <span className="text-slate-400">-</span>
              <input type="time" value={turnoFin} onChange={(e) => setTurnoFin(e.target.value)} className={inputCls} />
            </div>
          ) : (
            <p className="text-[10px] text-slate-400 pt-2">Sin turno (día libre si no ponchó)</p>
          )}
        </div>

        <div>
          <label className={labelCls}>
            <span className="flex items-center gap-2 normal-case">
              <input type="checkbox" checked={poncho} onChange={(e) => setPoncho(e.target.checked)} />
              Ponchó
            </span>
          </label>
          {poncho ? (
            <div className="flex items-center gap-1">
              <input type="time" value={entrada} onChange={(e) => setEntrada(e.target.value)} className={inputCls} />
              <span className="text-slate-400">-</span>
              <input type="time" value={salida} onChange={(e) => setSalida(e.target.value)} className={inputCls} />
            </div>
          ) : (
            <p className="text-[10px] text-slate-400 pt-2">Sin ponche (ausencia si tenía turno)</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onCerrar} className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-600">
          Cancelar
        </button>
        <button
          onClick={agregar}
          disabled={!valido}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
            valido ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          <Check className="w-3.5 h-3.5" /> Agregar
        </button>
      </div>
    </div>
  );
}