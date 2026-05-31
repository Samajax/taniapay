"use client";
import React from "react";
import { 
  CalendarDays, AlertTriangle, Edit3, LogIn, LogOut, X, 
  CheckCircle, Clock, Users, ShieldCheck, Info, DollarSign 
} from "lucide-react";
import { 
  formatNombreTurno, formatMonto, calcularDescuentoPonche, obtenerAlertaSimplificada 
} from "../hooks/useAsistenciaUtils";

interface Props {
  panelWidth: number;
  empleado: any;
  records: any[];
  tasas: any;
  editandoPanelId: string | null;
  panelNuevaEntrada: string;
  panelNuevaSalida: string;
  setPanelNuevaEntrada: (v: string) => void;
  setPanelNuevaSalida: (v: string) => void;
  iniciarEdicionPanel: (p: any) => void;
  cancelarEdicionPanel: () => void;
  guardarEdicionPanel: (id: string) => void;
  totalDescuentoEmpleado: number;
}

export default function ExpedienteLateral({
  panelWidth, empleado, records, tasas, editandoPanelId, panelNuevaEntrada, panelNuevaSalida,
  setPanelNuevaEntrada, setPanelNuevaSalida, iniciarEdicionPanel, cancelarEdicionPanel, guardarEdicionPanel, totalDescuentoEmpleado
}: Props) {

  if (!empleado) {
    return (
      <div style={{ width: `${panelWidth}px` }} className="bg-white border border-slate-100/80 rounded-2xl shadow-[0_4px_20px_rgba(241,245,249,0.6)] p-5 sticky top-5 max-h-[88vh] shrink-0 flex flex-col justify-center items-center text-center text-slate-400 py-16 border-dashed">
        <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
        Seleccione un colaborador<br />para ver su expediente completo
      </div>
    );
  }

  return (
    <div style={{ width: `${panelWidth}px` }} className="bg-white border border-slate-100/80 rounded-2xl shadow-[0_4px_20px_rgba(241,245,249,0.6)] p-5 sticky top-5 max-h-[88vh] overflow-y-auto border-slate-200/50 shrink-0 custom-scrollbar">
      <div className="flex flex-col gap-5">
        
        {/* ENCABEZADO DE PERFIL */}
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center text-xl font-bold shadow-lg">
            {empleado.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 text-base uppercase tracking-tight">{empleado.nombre}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{empleado.cargo}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/50">ID: {empleado.id_reloj}</span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> {empleado.sucursal_principal}</span>
            </div>
          </div>
        </div>

        {/* RESUMEN DE RETENCIÓN / PAGO */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Estado Jornada</p>
            <p className="text-xs font-bold text-slate-700 mt-1">{empleado.exento_ponche ? "Exento de Fichar" : "Control Activo"}</p>
          </div>
          <div className={`rounded-xl p-3 shadow-sm border ${totalDescuentoEmpleado < 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
            <p className={`text-[9px] font-bold uppercase tracking-wider ${totalDescuentoEmpleado < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              Impacto en Nómina
            </p>
            <p className={`text-base font-black font-mono mt-1 ${totalDescuentoEmpleado < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {totalDescuentoEmpleado === 0 ? "RD$ 0.00" : formatMonto(totalDescuentoEmpleado)}
            </p>
          </div>
        </div>

        {/* LISTADO DE REGISTROS DIARIOS */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Historial del Periodo</span>
            <span className="text-[9px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/50">{records.length} días</span>
          </div>

          <div className="space-y-3">
            {records.map((p) => {
              const montoDia = calcularDescuentoPonche(p, empleado, tasas);
              const alerta = obtenerAlertaSimplificada(p, empleado);
              const estaEditandoPanel = editandoPanelId === p.id_registro;
              
              // Validación Cruzada: HE bloqueada si hay tardanza sin aprobar
              const heBloqueada = p.requiereConfirmacionHE && !p.he_aprobada;

              return (
                <div key={p.id_registro} className={`border rounded-xl overflow-hidden transition-all ${p.error_reloj ? "border-red-200 bg-red-50/5" : estaEditandoPanel ? "border-emerald-400 bg-emerald-50/20 shadow-md scale-[1.02]" : "border-slate-100 bg-white hover:border-slate-200"}`}>
                  
                  {/* HEADER DEL DÍA */}
                  <div className={`px-3 py-2 flex justify-between items-center border-b ${p.error_reloj ? "border-red-100" : estaEditandoPanel ? "border-emerald-200" : "border-slate-50"}`}>
                    <div className="flex items-center gap-2">
                      <CalendarDays className={`w-3.5 h-3.5 ${p.error_reloj ? "text-red-400" : "text-slate-400"}`} />
                      <span className="font-mono font-bold text-slate-700 text-[11px]">{p.fecha}</span>
                      {p.es_dia_libre && <span className="text-[8px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase font-bold">Gris: Libre</span>}
                      {p.es_feriado && <span className="text-[8px] bg-blue-600 text-white px-1.5 py-0.5 rounded uppercase font-bold">Feriado</span>}
                    </div>
                    <span className={`font-mono font-bold text-[11px] ${montoDia < 0 ? "text-rose-600" : montoDia > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                      {montoDia === 0 ? "RD$ 0.00" : (montoDia > 0 ? "+" : "") + formatMonto(montoDia)}
                    </span>
                  </div>

                  {/* CONTENIDO DEL REGISTRO */}
                  <div className="p-3">
                    {estaEditandoPanel ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-bold text-slate-500 block mb-1 flex items-center gap-1"><LogIn className="w-3 h-3" /> Entrada</label>
                            <input type="time" value={panelNuevaEntrada} onChange={(e) => setPanelNuevaEntrada(e.target.value)} className="w-full border border-slate-200 px-3 py-2 font-mono text-center text-xs rounded-lg bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-500 block mb-1 flex items-center gap-1"><LogOut className="w-3 h-3" /> Salida</label>
                            <input type="time" value={panelNuevaSalida} onChange={(e) => setPanelNuevaSalida(e.target.value)} className="w-full border border-slate-200 px-3 py-2 font-mono text-center text-xs rounded-lg bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={cancelarEdicionPanel} className="flex-1 bg-slate-100 text-slate-600 text-[10px] font-bold py-2 rounded-lg hover:bg-slate-200">Cancelar</button>
                          <button onClick={() => guardarEdicionPanel(p.id_registro)} className="flex-1 bg-emerald-600 text-white text-[10px] font-bold py-2 rounded-lg shadow-sm hover:bg-emerald-700">Guardar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* PONCHES Y TURNO */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1"><span className="text-[9px] text-slate-400 uppercase font-bold">E:</span><span className="font-mono font-bold text-[11px] text-slate-700">{p.entrada || "—"}</span></div>
                            <div className="flex items-center gap-1"><span className="text-[9px] text-slate-400 uppercase font-bold">S:</span><span className="font-mono font-bold text-[11px] text-slate-700">{p.salida || "—"}</span></div>
                          </div>
                          <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-slate-50 text-slate-500 border border-slate-200/50 uppercase">{formatNombreTurno(p.turno, p.entrada)}</span>
                        </div>

                        {/* ESTADO DINÁMICO */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            <Clock className={`w-3 h-3 ${heBloqueada ? "text-orange-500" : "text-slate-400"}`} />
                            <span className="text-[10px] flex items-center gap-1.5">
                              {heBloqueada ? (
                                <span className="text-orange-600 font-bold flex items-center gap-1">
                                  <Info className="w-3 h-3" /> HE Naranja: Por Aprobar
                                </span>
                              ) : p.es_dia_libre ? (
                                <span className="text-slate-500 font-bold">Libre</span>
                              ) : p.incidencia_detectada ? (
                                <span className="text-blue-600 font-bold uppercase">{p.incidencia_detectada}</span>
                              ) : (p.entrada === "—" && !p.es_feriado) ? (
                                <span className="text-rose-600 font-bold uppercase">Ausencia</span>
                              ) : p.minutos_tardanza > 0 ? (
                                <span className="text-orange-600 font-bold">Tardanza ({p.minutos_tardanza}m)</span>
                              ) : (
                                <span className="text-emerald-600 font-bold italic">Correcto</span>
                              )}
                            </span>
                          </div>
                          
                          {/* ACCIÓN RÁPIDA */}
                          {(p.error_reloj || p.minutos_tardanza > 0 || p.entrada === "—") && (
                            <button onClick={() => iniciarEdicionPanel(p)} className="bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 p-1.5 rounded-lg transition-all border border-transparent hover:border-emerald-100">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}