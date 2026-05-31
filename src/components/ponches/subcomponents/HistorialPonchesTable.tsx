"use client";
import React from "react";
import { Edit3, CheckCircle, X, Star, AlertCircle, Check } from "lucide-react";
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
}

export default function HistorialPonchesTable({
  registros, empleados, tasas, selectedIdReloj, setSelectedIdReloj,
  editandoRegistroId, nuevaEntrada, nuevaSalida, setNuevaEntrada, setNuevaSalida,
  iniciarEdicion, guardarEdicion, cancelarEdicion, aprobarHE
}: Props) {
  return (
    <table className="w-full text-left text-xs min-w-[1350px] border-separate border-spacing-0">
      <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase border-b h-12 sticky top-0 z-10 backdrop-blur-sm">
        <tr>
          <th className="p-3 pl-6 w-28 border-b">Fecha</th>
          <th className="p-3 w-56 border-b">Colaborador</th>
          <th className="p-3 w-24 text-center border-b">Turno</th>
          <th className="p-3 w-28 border-b">Sucursal</th>
          <th className="p-3 w-24 text-center border-b">Entrada</th>
          <th className="p-3 w-24 text-center border-b">Salida</th>
          <th className="p-3 w-32 text-center border-b">Alerta Visual</th>
          <th className="p-3 w-36 text-center border-b">Horas Extras</th>
          <th className="p-3 w-28 text-right border-b">Monto Neto</th>
          <th className="p-3 pr-6 w-32 text-center border-b">Acción</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {registros.map((rec) => {
          const emp = empleados.find((e) => e.id_reloj === rec.id_reloj);
          const montoCalculado = calcularDescuentoPonche(rec, emp, tasas);
          const alerta = obtenerAlertaSimplificada(rec, emp);
          const estaEditando = editandoRegistroId === rec.id_registro;
          const tienePonche = rec.entrada_normalizada !== "—" && rec.entrada_normalizada !== "";
          
          // Validación de conflicto HE vs Tardanza
          const heBloqueada = rec.requiereConfirmacionHE && !rec.he_aprobada;

          return (
            <tr 
              key={rec.id_registro} 
              className={`group transition-all hover:bg-slate-50/50 ${selectedIdReloj === rec.id_reloj ? "bg-emerald-50/20" : ""}`}
            >
              {/* FECHA Y CONTROL FERIADO */}
              <td className="p-3 pl-6 font-mono text-slate-600 border-b border-transparent group-hover:border-slate-100" onClick={() => setSelectedIdReloj(rec.id_reloj)}>
                {rec.es_feriado && <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-[8px] font-bold mr-1.5 shadow-sm">FERIADO</span>}
                {rec.fecha}
              </td>

              {/* COLABORADOR */}
              <td className="p-3 border-b border-transparent group-hover:border-slate-100" onClick={() => setSelectedIdReloj(rec.id_reloj)}>
                <div className="font-bold uppercase text-slate-800 cursor-pointer">{emp?.nombre || "N/A"}</div>
                <div className="text-[10px] text-slate-400 font-mono">ID Reloj: {rec.id_reloj}</div>
              </td>

              {/* TURNO */}
              <td className="p-3 text-center border-b border-transparent group-hover:border-slate-100">
                <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-slate-100 text-slate-500 uppercase">
                  {formatNombreTurno(rec.turno, rec.entrada_normalizada)}
                </span>
              </td>

              {/* SUCURSAL */}
              <td className="p-3 uppercase text-[10px] font-medium text-slate-400 border-b border-transparent group-hover:border-slate-100">
                {rec.sucursal_ponche}
              </td>
              
              {/* ENTRADA EDITABLE */}
              <td className="p-3 text-center border-b border-transparent group-hover:border-slate-100">
                {estaEditando ? (
                  <input type="time" value={nuevaEntrada} onChange={(e) => setNuevaEntrada(e.target.value)} className="w-24 px-2 py-1 border border-emerald-400 rounded-lg text-center text-xs font-mono bg-white focus:outline-none shadow-sm" />
                ) : (
                  <span className={`font-mono font-bold ${rec.minutos_tardanza > 0 ? "text-orange-500" : "text-slate-700"}`}>
                    {rec.entrada_normalizada}
                  </span>
                )}
              </td>
              
              {/* SALIDA EDITABLE */}
              <td className="p-3 text-center border-b border-transparent group-hover:border-slate-100">
                {estaEditando ? (
                  <input type="time" value={nuevaSalida} onChange={(e) => setNuevaSalida(e.target.value)} className="w-24 px-2 py-1 border border-emerald-400 rounded-lg text-center text-xs font-mono bg-white focus:outline-none shadow-sm" />
                ) : (
                  <span className={`font-mono font-bold ${rec.minutos_extras > 0 ? "text-emerald-600" : "text-slate-700"}`}>
                    {rec.salida_normalizada}
                  </span>
                )}
              </td>
              
              {/* CÓDIGO DE COLORES MAESTRO (RESUMEN VISUAL) */}
              <td className="p-3 text-center border-b border-transparent group-hover:border-slate-100">
                {rec.es_dia_libre ? (
                  <span className="text-slate-500 font-bold bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-lg uppercase text-[9px]">
                    Libre
                  </span>
                ) : (
                  alerta && (
                    <span className={`px-2 py-0.5 rounded-lg border font-bold shadow-sm ${getAlertaEstilo(alerta)}`}>
                      {alerta === "Correcto" ? "Correcto" : alerta === "HE por Aprobar" ? "HE Bloqueada" : alerta === "Tardanza" ? "Tardanza" : `${alerta}`}
                    </span>
                  )
                )}
              </td>
              
              {/* HORAS EXTRAS VALIDACIÓN CRUZADA */}
              <td className="p-3 text-center border-b border-transparent group-hover:border-slate-100">
                {heBloqueada ? (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded border border-orange-100 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Requiere Confirmación
                    </span>
                    {aprobarHE && (
                      <button 
                        onClick={() => aprobarHE(rec.id_registro)}
                        className="text-[9px] text-emerald-600 font-bold hover:underline uppercase tracking-tighter"
                      >
                        Autorizar Pago
                      </button>
                    )}
                  </div>
                ) : rec.minutos_extras > 0 ? (
                  <span className="text-emerald-600 font-mono font-bold text-[11px] bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                    +{rec.minutos_extras} min Aprobados
                  </span>
                ) : (
                  <span className="text-slate-300 font-mono">—</span>
                )}
              </td>
              
              {/* RETENCIÓN O INCENTIVO NETO */}
              <td className="p-3 text-right font-mono font-bold border-b border-transparent group-hover:border-slate-100 pr-6">
                {montoCalculado < 0 ? (
                  <span className="text-rose-600">-{formatMonto(Math.abs(montoCalculado))}</span>
                ) : montoCalculado > 0 ? (
                  <span className="text-emerald-600">+{formatMonto(montoCalculado)}</span>
                ) : (
                  <span className="text-slate-400">RD$ 0.00</span>
                )}
              </td>
              
              {/* ACCIÓN ACCESIBLE */}
              <td className="p-3 pr-6 text-center border-b border-transparent group-hover:border-slate-100">
                {estaEditando ? (
                  <div className="flex items-center gap-1.5 justify-center">
                    <button onClick={() => guardarEdicion(rec.id_registro)} className="text-white p-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-md transition-all"><Check className="w-4 h-4" /></button>
                    <button onClick={cancelarEdicion} className="text-white p-1.5 bg-rose-500 hover:bg-rose-600 rounded-lg shadow-md transition-all"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button onClick={() => iniciarEdicion(rec)} className="text-slate-400 hover:text-emerald-600 p-2 rounded-xl hover:bg-slate-100 transition-all flex items-center gap-1.5 mx-auto font-bold">
                    <Edit3 className="w-3.5 h-3.5" /> <span className="text-[10px] uppercase">Corregir</span>
                  </button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}