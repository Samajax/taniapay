"use client";
import React, { useState } from "react";
import { Edit3, X, Check, AlertCircle, Trash2, PlusCircle } from "lucide-react";
import { 
  formatNombreTurno, 
  formatMonto, 
  getAlertaEstilo, 
  calcularDescuentoPonche, 
  obtenerAlertaSimplificada 
} from "../hooks/useAsistenciaUtils";

interface Props {
  registros: any[];
  empleados: any[];
  tasas: any;
  selectedIdReloj: string;
  setSelectedIdReloj: (id: string) => void;
  editandoRegistroId: string | null;
  nuevaEntrada: string;
  nuevaSalida: string;
  setNuevaEntrada: (v: string) => void;
  setNuevaSalida: (v: string) => void;
  iniciarEdicion: (rec: any) => void;
  guardarEdicion: (id: string) => void;
  cancelarEdicion: () => void;
  aprobarHE?: (id: string) => void;
  // Nuevas props para CRUD
  modoEdicionActivo: boolean;
  onAgregar?: (id_reloj: string, fecha: string) => void;
  onEliminar?: (idCompuesto: string) => void;
  onCambiarTurno?: (idCompuesto: string, nuevoEstado: string) => void;
}

export default function HistorialPonchesTable({
  registros, empleados, tasas, selectedIdReloj, setSelectedIdReloj,
  editandoRegistroId, nuevaEntrada, nuevaSalida, setNuevaEntrada, setNuevaSalida,
  iniciarEdicion, guardarEdicion, cancelarEdicion, aprobarHE,
  modoEdicionActivo, onAgregar, onEliminar, onCambiarTurno
}: Props) {
  
  // Estado local para la fila de inserción rápida
  const [nuevoIdReloj, setNuevoIdReloj] = useState("");
  const [nuevaFecha, setNuevaFecha] = useState("");

  const handleInsertar = () => {
    if (!nuevoIdReloj || !nuevaFecha) return;
    if (onAgregar) onAgregar(nuevoIdReloj, nuevaFecha);
    setNuevoIdReloj("");
    setNuevaFecha("");
  };

  return (
    <table className="w-full text-left text-xs min-w-[1400px] border-separate border-spacing-0">
      <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase border-b h-12 sticky top-0 z-10 backdrop-blur-sm">
        <tr>
          <th className="p-3 pl-6 w-28 border-b">Fecha</th>
          <th className="p-3 w-56 border-b">Colaborador</th>
          <th className="p-3 w-36 text-center border-b">Turno / Estado</th>
          <th className="p-3 w-28 border-b">Sucursal</th>
          <th className="p-3 w-24 text-center border-b">Entrada</th>
          <th className="p-3 w-24 text-center border-b">Salida</th>
          <th className="p-3 w-32 text-center border-b">Alerta Visual</th>
          <th className="p-3 w-36 text-center border-b">Horas Extras</th>
          <th className="p-3 w-28 text-right border-b">Monto Neto</th>
          <th className="p-3 pr-6 w-40 text-center border-b">Acciones</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        
        {/* FILA PARA AÑADIR REGISTRO (Solo en Modo Edición) */}
        {modoEdicionActivo && onAgregar && (
          <tr className="bg-emerald-50/40 hover:bg-emerald-50 transition-colors">
            <td className="p-3 pl-6 border-b border-emerald-100">
              <input 
                type="date" 
                value={nuevaFecha} 
                onChange={(e) => setNuevaFecha(e.target.value)} 
                className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none bg-white focus:ring-1 focus:ring-emerald-400" 
              />
            </td>
            <td className="p-3 border-b border-emerald-100" colSpan={2}>
              <select 
                value={nuevoIdReloj} 
                onChange={(e) => setNuevoIdReloj(e.target.value)} 
                className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none bg-white font-medium text-slate-700 focus:ring-1 focus:ring-emerald-400"
              >
                <option value="">-- Seleccionar Colaborador --</option>
                {empleados.map(e => (
                  <option key={e.id_reloj} value={e.id_reloj}>{e.nombre} (ID: {e.id_reloj})</option>
                ))}
              </select>
            </td>
            <td className="p-3 border-b border-emerald-100" colSpan={6}>
              <span className="text-[10px] text-slate-400 italic">Complete los campos para insertar un nuevo ponche en el historial.</span>
            </td>
            <td className="p-3 pr-6 border-b border-emerald-100 text-center">
              <button 
                onClick={handleInsertar} 
                disabled={!nuevoIdReloj || !nuevaFecha} 
                className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm text-[10px] uppercase transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Añadir
              </button>
            </td>
          </tr>
        )}

        {registros.map((rec) => {
          const emp = empleados.find((e) => e.id_reloj === rec.id_reloj);
          const montoCalculado = calcularDescuentoPonche(rec, emp, tasas);
          const alerta = obtenerAlertaSimplificada(rec, emp);
          const filaIdentificadorUnico = `${rec.id_reloj}-${rec.fecha}`;
          const estaEditando = editandoRegistroId !== null && editandoRegistroId === filaIdentificadorUnico;
          const heBloqueada = rec.requiereConfirmacionHE && !rec.he_aprobada;
          
          // Bloqueo de entrada/salida para estados especiales
          const esEspecial = rec.turno === "LIBRE" || rec.turno === "FERIADO";

          return (
            <tr 
              key={filaIdentificadorUnico} 
              className={`group transition-all hover:bg-slate-50/50 ${selectedIdReloj === rec.id_reloj ? "bg-emerald-50/20" : ""}`}
            >
              <td className="p-3 pl-6 font-mono text-slate-600 border-b border-transparent group-hover:border-slate-100" onClick={() => setSelectedIdReloj(rec.id_reloj)}>
                {rec.fecha}
              </td>

              <td className="p-3 border-b border-transparent group-hover:border-slate-100" onClick={() => setSelectedIdReloj(rec.id_reloj)}>
                <div className="font-bold uppercase text-slate-800 cursor-pointer">{emp?.nombre || "N/A"}</div>
                <div className="text-[10px] text-slate-400 font-mono">ID Reloj: {rec.id_reloj}</div>
              </td>

              {/* COLUMNA TURNO DINÁMICA: Permite cambiar a LIBRE o FERIADO */}
              <td className="p-3 text-center border-b border-transparent group-hover:border-slate-100">
                {modoEdicionActivo && onCambiarTurno ? (
                  <select
                    value={rec.turno}
                    onChange={(e) => onCambiarTurno(filaIdentificadorUnico, e.target.value)}
                    className="px-2 py-1 border rounded-lg text-xs font-bold bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-400 outline-none cursor-pointer"
                  >
                    <option value="Matutino">Matutino</option>
                    <option value="Vespertino">Vespertino</option>
                    <option value="LIBRE">💤 Día Libre</option>
                    <option value="FERIADO">🎉 Feriado</option>
                  </select>
                ) : (
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${rec.turno === "LIBRE" ? "bg-slate-100 text-slate-500" : rec.turno === "FERIADO" ? "bg-blue-100 text-blue-700 shadow-sm" : "bg-slate-100 text-slate-500"}`}>
                    {rec.turno === "LIBRE" ? "Libre" : rec.turno === "FERIADO" ? "Feriado" : formatNombreTurno(rec.turno, rec.entrada_normalizada)}
                  </span>
                )}
              </td>

              <td className="p-3 uppercase text-[10px] font-medium text-slate-400 border-b border-transparent group-hover:border-slate-100">
                {rec.sucursal_ponche}
              </td>
              
              <td className="p-3 text-center border-b border-transparent group-hover:border-slate-100">
                {esEspecial ? (
                  <span className="text-slate-300 font-mono font-bold">—</span>
                ) : estaEditando ? (
                  <input type="time" value={nuevaEntrada} onChange={(e) => setNuevaEntrada(e.target.value)} className="w-24 px-2 py-1 border border-emerald-400 rounded-lg text-center text-xs font-mono bg-white shadow-sm ring-1 ring-emerald-500/20 outline-none" />
                ) : (
                  <span className={`font-mono font-bold ${rec.minutos_tardanza > 0 ? "text-orange-500" : "text-slate-700"}`}>
                    {rec.entrada_normalizada}
                  </span>
                )}
              </td>
              
              <td className="p-3 text-center border-b border-transparent group-hover:border-slate-100">
                {esEspecial ? (
                  <span className="text-slate-300 font-mono font-bold">—</span>
                ) : estaEditando ? (
                  <input type="time" value={nuevaSalida} onChange={(e) => setNuevaSalida(e.target.value)} className="w-24 px-2 py-1 border border-emerald-400 rounded-lg text-center text-xs font-mono bg-white shadow-sm ring-1 ring-emerald-500/20 outline-none" />
                ) : (
                  <span className={`font-mono font-bold ${rec.minutos_extras > 0 ? "text-emerald-600" : "text-slate-700"}`}>
                    {rec.salida_normalizada}
                  </span>
                )}
              </td>
              
              <td className="p-3 text-center border-b border-transparent group-hover:border-slate-100">
                {rec.turno === "LIBRE" ? (
                  <span className="text-slate-400 font-bold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded uppercase text-[9px]">Gris: Libre</span>
                ) : rec.turno === "FERIADO" ? (
                  <span className="text-blue-500 font-bold bg-blue-50 border border-blue-100 px-2 py-0.5 rounded uppercase text-[9px]">Feriado</span>
                ) : (
                  alerta && (
                    <span className={`px-2 py-0.5 rounded-lg border font-bold shadow-sm ${getAlertaEstilo(alerta)}`}>
                      {alerta === "Correcto" ? "Correcto" : alerta === "HE por Aprobar" ? "HE Bloqueada" : alerta === "Tardanza" ? "Tardanza" : `${alerta}`}
                    </span>
                  )
                )}
              </td>
              
              <td className="p-3 text-center border-b border-transparent group-hover:border-slate-100">
                {esEspecial ? (
                  <span className="text-slate-300 font-mono">—</span>
                ) : heBloqueada ? (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded border border-orange-100 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Requiere Confirmación
                    </span>
                    {aprobarHE && (
                      <button onClick={(e) => { e.stopPropagation(); aprobarHE(filaIdentificadorUnico); }} className="text-[9px] text-emerald-600 font-bold hover:underline uppercase">
                        Autorizar
                      </button>
                    )}
                  </div>
                ) : rec.minutos_extras > 0 ? (
                  <span className="text-emerald-600 font-mono font-bold text-[11px] bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                    +{rec.minutos_extras} min
                  </span>
                ) : (
                  <span className="text-slate-300 font-mono">—</span>
                )}
              </td>
              
              <td className="p-3 text-right font-mono border-b border-transparent group-hover:border-slate-100 pr-6">
                <div className="flex flex-col items-end">
                  {!esEspecial && rec.minutos_penalizados > 0 && (
                    <span className="text-[9px] text-orange-500 font-bold mb-0.5">-{rec.minutos_penalizados} min</span>
                  )}
                  <span className={`font-bold ${montoCalculado < 0 ? "text-rose-600" : montoCalculado > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                    {montoCalculado === 0 ? "RD$ 0.00" : (montoCalculado > 0 ? "+" : "-") + formatMonto(Math.abs(montoCalculado))}
                  </span>
                </div>
              </td>
              
              <td className="p-3 pr-6 text-center border-b border-transparent group-hover:border-slate-100">
                {estaEditando ? (
                  <div className="flex items-center gap-1.5 justify-center">
                    <button onClick={() => guardarEdicion(filaIdentificadorUnico)} className="text-white p-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-md transition-all"><Check className="w-4 h-4" /></button>
                    <button onClick={cancelarEdicion} className="text-white p-1.5 bg-rose-500 hover:bg-rose-600 rounded-lg shadow-md transition-all"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                    {!esEspecial && (
                      <button onClick={() => iniciarEdicion(rec)} className="text-slate-400 hover:text-emerald-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all flex items-center gap-1 font-bold">
                        <Edit3 className="w-3.5 h-3.5" /> <span className="text-[9px] uppercase">Corregir</span>
                      </button>
                    )}
                    {modoEdicionActivo && onEliminar && (
                      <button 
                        onClick={() => { if(confirm(`¿Desea eliminar este registro del ${rec.fecha}?`)) onEliminar(filaIdentificadorUnico); }} 
                        className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}