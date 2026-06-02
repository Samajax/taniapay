"use client";
import React, { useMemo, useState } from "react";
import { Edit3, Trash2, Check, X, UserCheck, Clock } from "lucide-react";
import { getAlertaEstilo, minutosATexto, formatMonto } from "../hooks/useAsistenciaUtils";
import { calcularDescuento } from "../lib/calcularDescuento";
import type { AsistenciaRecord, Empleado, Tasas, AgruparPor } from "../types";

interface Props {
  registros: AsistenciaRecord[];
  empleados: Empleado[];
  tasas: Tasas;
  agruparPor: AgruparPor;
  selectedIdReloj: string;
  setSelectedIdReloj: (id: string) => void;
  onCorregir: (idReloj: string, fecha: string, entrada: string | null, salida: string | null) => void;
  onEliminar: (idReloj: string, fecha: string) => void;
  onAsignarTurno: (idReloj: string, fecha: string, turno: string | null) => void;
}

const claveFila = (r: AsistenciaRecord) => `${r.id_reloj}|${r.fecha}`;

export default function HistorialPonchesTable({
  registros,
  empleados,
  tasas,
  agruparPor,
  selectedIdReloj,
  setSelectedIdReloj,
  onCorregir,
  onEliminar,
  onAsignarTurno,
}: Props) {
  const empPorId = useMemo(() => {
    const m = new Map<string, Empleado>();
    empleados.forEach((e) => m.set(e.id_reloj, e));
    return m;
  }, [empleados]);

  const [editId, setEditId] = useState<string | null>(null);
  const [nuevaEntrada, setNuevaEntrada] = useState("");
  const [nuevaSalida, setNuevaSalida] = useState("");

  // Edición independiente del turno (para "Horario No Configurado", etc.)
  const [turnoEditId, setTurnoEditId] = useState<string | null>(null);
  const [turnoIni, setTurnoIni] = useState("08:00");
  const [turnoFin, setTurnoFin] = useState("16:00");

  // Agrupación de las filas (solo presentación; no toca los datos).
  const gruposRender = useMemo(() => {
    if (agruparPor === "ninguno") {
      return [{ clave: "__all__", label: "", registros }];
    }
    const mapa = new Map<string, AsistenciaRecord[]>();
    for (const r of registros) {
      let label: string;
      switch (agruparPor) {
        case "sucursal":
          label = r.sucursal;
          break;
        case "empleado":
          label = empPorId.get(r.id_reloj)?.nombre ?? `ID ${r.id_reloj}`;
          break;
        case "incidencia":
          label = r.tipo_incidencia;
          break;
        case "turno":
          label = r.turno ?? "Sin turno";
          break;
        default:
          label = "";
      }
      const arr = mapa.get(label);
      if (arr) arr.push(r);
      else mapa.set(label, [r]);
    }
    return Array.from(mapa.entries()).map(([label, regs]) => ({
      clave: label,
      label,
      registros: regs,
    }));
  }, [registros, agruparPor, empPorId]);

  const iniciarTurno = (r: AsistenciaRecord) => {
    setTurnoEditId(claveFila(r));
    const [ini, fin] = (r.turno ?? "08:00-16:00").split("-");
    setTurnoIni(ini || "08:00");
    setTurnoFin(fin || "16:00");
  };

  const guardarTurno = (r: AsistenciaRecord) => {
    onAsignarTurno(r.id_reloj, r.fecha, `${turnoIni}-${turnoFin}`);
    setTurnoEditId(null);
  };

  const iniciar = (r: AsistenciaRecord) => {
    setEditId(claveFila(r));
    setNuevaEntrada(r.entrada ?? "08:00");
    setNuevaSalida(r.salida ?? "17:00");
  };

  const guardar = (r: AsistenciaRecord) => {
    onCorregir(r.id_reloj, r.fecha, nuevaEntrada || null, nuevaSalida || null);
    setEditId(null);
  };

  const renderFila = (r: AsistenciaRecord) => {
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
        <td className="p-3 text-slate-500">
          {turnoEditId === claveFila(r) ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <input
                type="time"
                value={turnoIni}
                onChange={(e) => setTurnoIni(e.target.value)}
                className="bg-slate-50 border rounded-lg px-1.5 py-1 text-xs outline-none"
              />
              <span className="text-slate-400">-</span>
              <input
                type="time"
                value={turnoFin}
                onChange={(e) => setTurnoFin(e.target.value)}
                className="bg-slate-50 border rounded-lg px-1.5 py-1 text-xs outline-none"
              />
              <button onClick={() => guardarTurno(r)} className="p-1 rounded-lg bg-emerald-100 text-emerald-700">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setTurnoEditId(null)} className="p-1 rounded-lg bg-slate-100 text-slate-500">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : r.tipo_incidencia === "Horario No Configurado" ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                iniciarTurno(r);
              }}
              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 flex items-center gap-1"
            >
              <Clock className="w-3 h-3" /> Asignar turno
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                iniciarTurno(r);
              }}
              className="text-slate-500 hover:text-slate-900 hover:underline decoration-dotted"
            >
              {r.turno ?? "Sin turno"}
            </button>
          )}
        </td>

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
          {gruposRender.map((g) => (
            <React.Fragment key={g.clave}>
              {agruparPor !== "ninguno" && (
                <tr className="bg-slate-100/70">
                  <td
                    colSpan={9}
                    className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b"
                  >
                    {g.label} <span className="text-slate-400">· {g.registros.length}</span>
                  </td>
                </tr>
              )}
              {g.registros.map(renderFila)}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}