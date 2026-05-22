"use client";
import React, { useState, useEffect, useMemo } from "react";
import { usePay } from "@/context/PayContext";
import { SUCURSALES_DISPONIBLES } from "@/data/mockData";
import { 
  Search, 
  Plus, 
  X, 
  Pencil, 
  Save, 
  Clock, 
  MapPin, 
  FileText, 
  Palmtree, 
  UserCheck, 
  DollarSign, 
  Receipt, 
  FileSpreadsheet, 
  User, 
  CalendarDays, 
  TrendingDown, 
  AlertCircle,
  ShieldAlert
} from "lucide-react";

interface NovedadIncidencia {
  id: string;
  id_reloj: string;
  tipo: "Vacaciones" | "Licencia Médica" | "Cobertura" | "Permiso" | "Cuentas por Cobrar (CXC)" | "Vales / Faltantes de caja";
  fecha_inicio: string;
  cantidad_dias?: number;
  id_reloj_cubre?: string;
  monto?: number;       
  cuotas?: number;      
  comentario: string;
  estado: "Procesado" | "Pendiente Aplicación";
}

function formatMonto(val: number) {
  return "RD$ " + Number(val || 0).toLocaleString("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function IncidenciasView() {
  const { 
    empleados = [], 
    incidencias = [], 
    setIncidencias, 
    fechaSistema 
  } = usePay();

  const [activeTab, setActiveTab] = useState<"general" | "vacaciones">("general");
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("Todos");
  const [filterSucursal, setFilterSucursal] = useState("Todos");
  
  const [selectedId, setSelectedId] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [showAltaForm, setShowAltaForm] = useState(false);

  const [nuevo, setNuevo] = useState({
    id_reloj: "12", 
    tipo: "Licencia Médica" as NovedadIncidencia["tipo"],
    fecha_inicio: fechaSistema || "2026-05-21",
    cantidad_dias: "1",
    id_reloj_cubre: "Ninguno",
    monto: "0",
    cuotas: "1",
    comentario: ""
  });

  const [formFicha, setFormFicha] = useState<Partial<NovedadIncidencia>>({});
  
  const novSel = useMemo(() => incidencias.find((n) => n.id === selectedId), [incidencias, selectedId]);
  const empAsociado = novSel ? empleados.find(e => e.id_reloj === novSel.id_reloj) : null;

  // 🛡️ EFECTO SOLUCIONADO: Dependencias limpias escuchando cambios del lote
  useEffect(() => {
    const primerasDeTab = incidencias.filter(n => activeTab === "vacaciones" ? n.tipo === "Vacaciones" : n.tipo !== "Vacaciones");
    if (primerasDeTab.length > 0) {
      setSelectedId(primerasDeTab[0].id);
    } else {
      setSelectedId("");
    }
    setShowAltaForm(false);
  }, [activeTab, incidencias.length]); 

  useEffect(() => {
    if (novSel) {
      setFormFicha({ ...novSel });
      setIsEditing(false);
    }
  }, [selectedId, novSel]);

  const obtenerLogisticaVacaciones = (fechaInicioStr: string, dias: number, sueldoMensual: number = 27489.57) => {
    const sueldoDia = sueldoMensual / 23.83;
    const dateStart = new Date(fechaInicioStr + "T00:00:00");
    const dateEnd = new Date(dateStart);
    dateEnd.setDate(dateStart.getDate() + dias - 1);
    
    return {
      desde: fechaInicioStr,
      hasta: dateEnd.toISOString().split("T")[0],
      montoAdelantoTotal: dias * sueldoDia,
      montoDeduccionQ1: Math.min(dias, 15) * sueldoDia,
      montoDeduccionQ2: Math.max(0, dias - 15) * sueldoDia,
      quincenasEfectivas: dias > 15 ? 2 : 1
    };
  };

  const resumenes = useMemo(() => {
    let vacs = 0, asistencias = 0, totalCXC = 0, totalFaltantes = 0;
    incidencias.forEach(n => {
      const montoNum = Number(n.monto) || 0;
      if (n.tipo === "Vacaciones") vacs++;
      else if (["Cobertura", "Licencia Médica", "Permiso"].includes(n.tipo)) asistencias++;
      else if (n.tipo === "Cuentas por Cobrar (CXC)") totalCXC += montoNum;
      else if (n.tipo === "Vales / Faltantes de caja") totalFaltantes += montoNum;
    });
    return { vacs, asistencias, totalCXC, totalFaltantes };
  }, [incidencias]);

  // --- PERSISTENCIA AL AGREGAR NUEVO ---
  const ejecutarAlta = (e: React.FormEvent) => {
    e.preventDefault();
    const tipoFinal = activeTab === "vacaciones" ? "Vacaciones" : nuevo.tipo;

    if (tipoFinal === "Cobertura" && (nuevo.id_reloj_cubre === "Ninguno" || nuevo.id_reloj_cubre === nuevo.id_reloj)) {
      return alert("❌ Error: Debe especificar un colaborador de reemplazo válido.");
    }

    const creada: NovedadIncidencia = {
      id: `NOV-${Math.floor(100 + Math.random() * 900)}`,
      id_reloj: nuevo.id_reloj,
      tipo: tipoFinal,
      fecha_inicio: nuevo.fecha_inicio,
      cantidad_dias: ["Vacaciones", "Licencia Médica", "Permiso", "Cobertura"].includes(tipoFinal) ? parseInt(nuevo.cantidad_dias, 10) : undefined,
      id_reloj_cubre: tipoFinal === "Cobertura" ? nuevo.id_reloj_cubre : undefined,
      monto: ["Cuentas por Cobrar (CXC)", "Vales / Faltantes de caja"].includes(tipoFinal) ? parseFloat(nuevo.monto) : undefined,
      cuotas: tipoFinal === "Cuentas por Cobrar (CXC)" ? parseInt(nuevo.cuotas, 10) : undefined,
      comentario: nuevo.comentario.trim() || "Sin observaciones administrativas",
      estado: "Pendiente Aplicación"
    };

    if (setIncidencias) {
      setIncidencias([creada, ...incidencias]);
      setSelectedId(creada.id);
      setShowAltaForm(false);
      alert("✅ Incidencia guardada con éxito. Cambios aplicados de inmediato.");
    }
  };

  // --- PERSISTENCIA AL EDITAR EXISTENTE ---
  const guardarFicha = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedId && setIncidencias) {
      const fichaFormateada = {
        ...formFicha,
        cantidad_dias: formFicha.cantidad_dias ? parseInt(String(formFicha.cantidad_dias), 10) : undefined,
        monto: formFicha.monto ? parseFloat(String(formFicha.monto)) : undefined,
        cuotas: formFicha.cuotas ? parseInt(String(formFicha.cuotas), 10) : undefined,
      };

      const loteActualizado = incidencias.map(n => n.id === selectedId ? { ...n, ...fichaFormateada } as NovedadIncidencia : n);
      setIncidencias(loteActualizado);
      setIsEditing(false);
      alert("✅ Cambios modificados y guardados de forma global.");
    }
  };

  const filteredNovedades = useMemo(() => {
    return incidencias.filter((n) => {
      if (activeTab === "vacaciones" && n.tipo !== "Vacaciones") return false;
      if (activeTab === "general" && n.tipo === "Vacaciones") return false;

      const emp = empleados.find(e => e.id_reloj === n.id_reloj);
      if (!emp) return false;

      const matchSearch = emp.nombre.toLowerCase().includes(search.toLowerCase()) || n.id_reloj.includes(search);
      const matchTipo = activeTab === "vacaciones" ? true : (filterTipo === "Todos" || n.tipo === filterTipo);
      const matchSucursal = filterSucursal === "Todos" || emp.sucursal_principal === filterSucursal;

      return matchSearch && matchTipo && matchSucursal;
    });
  }, [incidencias, activeTab, search, filterTipo, filterSucursal, empleados]);

  const inputClasses = "w-full pl-9 pr-3.5 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-xs outline-none focus:bg-white focus:border-[#3B82F6] transition-all text-[#1F2937] font-sans";
  const selectClasses = "w-full pl-9 pr-8 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-xs font-medium outline-none cursor-pointer focus:bg-white focus:border-[#3B82F6] transition-all text-[#1F2937] font-sans appearance-none";
  const cardClasses = "bg-white border border-[#E5E7EB] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] font-sans";

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start font-sans text-[#111827]">
      
      {/* CUERPO IZQUIERDO DE AUDITORÍA */}
      <div className="flex flex-col gap-5 min-w-0">
        
        {/* RESÚMENES DE CONTINGENCIAS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`${cardClasses} p-4 bg-gradient-to-br from-blue-50/30 to-white flex items-center justify-between`}>
            <div>
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Vacaciones</span>
              <span className="text-base font-extrabold text-[#3B82F6] font-mono mt-0.5">{resumenes.vacs} Colabs.</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-[#3B82F6]"><Palmtree className="w-4 h-4" /></div>
          </div>
          
          <div className={`${cardClasses} p-4 bg-gradient-to-br from-purple-50/30 to-white flex items-center justify-between`}>
            <div>
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Asistencia / Cober.</span>
              <span className="text-base font-extrabold text-purple-600 font-mono mt-0.5">{resumenes.asistencias} Regs.</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center text-purple-600"><UserCheck className="w-4 h-4" /></div>
          </div>

          <div className={`${cardClasses} p-4 bg-gradient-to-br from-amber-50/30 to-white flex items-center justify-between`}>
            <div>
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Balance CXC Total</span>
              <span className="text-sm font-extrabold text-[#D97706] font-mono mt-0.5">{formatMonto(resumenes.totalCXC)}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-[#D97706]"><DollarSign className="w-4 h-4" /></div>
          </div>

          <div className={`${cardClasses} p-4 bg-gradient-to-br from-red-50/30 to-white flex items-center justify-between`}>
            <div>
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Faltantes y Avances</span>
              <span className="text-sm font-extrabold text-[#EF4444] font-mono mt-0.5">{formatMonto(resumenes.totalFaltantes)}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-[#EF4444]"><Receipt className="w-4 h-4" /></div>
          </div>
        </div>

        {/* CONTROLLER TABS */}
        <div className="flex border-b border-[#E5E7EB] gap-2">
          <button 
            type="button" onClick={() => setActiveTab("general")}
            className={`px-5 py-2.5 font-semibold text-xs transition-all border-b-2 -mb-px flex items-center gap-2 ${activeTab === "general" ? "border-slate-900 text-slate-900 font-bold" : "border-transparent text-[#6B7280] hover:text-[#111827]"}`}
          >
            <Clock className="w-4 h-4" /> Gestión de Incidencias y Retenciones
          </button>
          <button 
            type="button" onClick={() => setActiveTab("vacaciones")}
            className={`px-5 py-2.5 font-semibold text-xs transition-all border-b-2 -mb-px flex items-center gap-2 ${activeTab === "vacaciones" ? "border-slate-900 text-slate-900 font-bold" : "border-transparent text-[#6B7280] hover:text-[#111827]"}`}
          >
            <Palmtree className="w-4 h-4" /> Módulo Independiente Vacaciones
          </button>
        </div>

        {/* FILTROS OPERATIVOS */}
        <div className={`${cardClasses} p-4 flex flex-col gap-3`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 w-full items-center">
            <div className="relative w-full">
              <span className="absolute left-3 top-2.5 text-[#9CA3AF]"><Search className="w-4 h-4" /></span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar colaborador..." className={inputClasses} />
            </div>

            {activeTab === "general" ? (
              <div className="relative w-full">
                <span className="absolute left-3 top-2.5 text-[#9CA3AF]"><FileSpreadsheet className="w-4 h-4" /></span>
                <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} className={selectClasses}>
                  <option value="Todos">Todas las Novedades</option>
                  <option value="Licencia Médica">Licencia Médica</option>
                  <option value="Cobertura">Cobertura</option>
                  <option value="Permiso">Permiso</option>
                  <option value="Cuentas por Cobrar (CXC)">Cuentas por Cobrar (CXC)</option>
                  <option value="Vales / Faltantes de caja">Vales / Faltantes de caja</option>
                </select>
              </div>
            ) : (
              <div className="bg-[#EFF6FF] text-[#3B82F6] px-3.5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border border-[#DBEAFE]">
                <Palmtree className="w-4 h-4" /> Listado de Vacaciones
              </div>
            )}

            <div className="relative w-full">
              <span className="absolute left-3 top-2.5 text-[#9CA3AF]"><MapPin className="w-4 h-4" /></span>
              <select value={filterSucursal} onChange={(e) => setFilterSucursal(e.target.value)} className={selectClasses}>
                <option value="Todos">Todas las Sucursales</option>
                {SUCURSALES_DISPONIBLES?.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            <button 
              type="button" 
              onClick={() => { setShowAltaForm(!showAltaForm); setIsEditing(false); }}
              className={`text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 ${showAltaForm ? "bg-red-600 text-white" : "bg-slate-900 text-white"}`}
            >
              {showAltaForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showAltaForm ? "Cancelar Alta" : "Crear Registro"}
            </button>
          </div>
        </div>

        {/* TABLA MAESTRA */}
        <div className={`${cardClasses} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap text-sm table-fixed min-w-[1100px]">
              <thead>
                <tr className="bg-[#F9FAFB] text-[10px] font-bold text-[#6B7280] uppercase border-b h-12">
                  <th className="p-3 pl-5 w-20">ID Reloj</th>
                  <th className="p-3 w-60">Colaborador / Sucursal</th>
                  <th className="p-3 w-44">Tipo Novedad</th>
                  <th className="p-3 w-36">Fecha Inicio</th>
                  <th className="p-3 w-32 text-center">{activeTab === "vacaciones" ? "Días Totales" : "Duración / Cuotas"}</th>
                  <th className="p-3 w-72">Impacto Financiero / Cobertura</th>
                  <th className="p-3 pr-5 text-center w-36">Estado Corte</th>
                </tr>
              </thead>
              <tbody className="divide-y text-[#1F2937]">
                {filteredNovedades.map((n) => {
                  const isSelected = !showAltaForm && selectedId === n.id;
                  const emp = empleados.find(e => e.id_reloj === n.id_reloj);
                  const empCubre = n.id_reloj_cubre ? empleados.find(e => e.id_reloj === n.id_reloj_cubre) : null;

                  return (
                    <tr 
                      key={n.id} onClick={() => { setSelectedId(n.id); setShowAltaForm(false); }}
                      className={`h-14 transition-colors ${isSelected ? "bg-[#EFF6FF]/60 font-medium" : "hover:bg-[#F9FAFB] cursor-pointer"}`}
                    >
                      <td className="p-3 pl-5 font-mono font-bold text-[#6B7280] text-[11px]">{n.id_reloj}</td>
                      <td className="p-3">
                        <div className="font-bold text-[#111827] uppercase text-xs">{emp?.nombre || "No Indexado"}</div>
                        <div className="text-[10px] text-[#6B7280] font-medium mt-0.5">Sucursal: <span className="font-semibold text-[#1F2937] uppercase">{emp?.sucursal_principal}</span></div>
                      </td>
                      <td className="p-3 font-bold text-xs">
                        <div className="flex items-center gap-1.5">
                          {n.tipo === "Vacaciones" && <span className="text-[#3B82F6] flex items-center gap-1"><Palmtree className="w-3.5 h-3.5" /> Vacaciones</span>}
                          {n.tipo === "Cobertura" && <span className="text-emerald-600 flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" /> Cobertura</span>}
                          {n.tipo === "Cuentas por Cobrar (CXC)" && <span className="text-amber-600 flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> CXC Diferida</span>}
                          {n.tipo === "Vales / Faltantes de caja" && <span className="text-red-500 flex items-center gap-1"><Receipt className="w-3.5 h-3.5" /> Faltante Caja</span>}
                        </div>
                      </td>
                      <td className="p-3 font-mono text-[11px]">{n.fecha_inicio}</td>
                      <td className="p-3 text-center font-mono text-xs">
                        {n.tipo === "Cuentas por Cobrar (CXC)" ? (
                          <span className="font-bold text-[#D97706]">{n.cuotas} Quincenas</span>
                        ) : n.tipo === "Vales / Faltantes de caja" ? (
                          <span className="text-slate-400 text-[11px]">Corte Único</span>
                        ) : (
                          <span className="font-bold text-slate-800">{n.cantidad_dias} Días</span>
                        )}
                      </td>
                      <td className="p-3 text-xs">
                        {n.tipo === "Vacaciones" ? (
                          (() => {
                            const log = obtenerLogisticaVacaciones(n.fecha_inicio, Number(n.cantidad_dias) || 1, emp?.sueldo_base);
                            return (
                              <div className="flex flex-col gap-0.5 max-w-[280px]">
                                <span className="text-slate-500">Rango: <span className="font-mono text-[#3B82F6] font-bold">{log.desde} al {log.hasta}</span></span>
                                <span className="text-[10px] text-emerald-600 font-mono font-bold">Adelanto: {formatMonto(log.montoAdelantoTotal)}</span>
                              </div>
                            );
                          })()
                        ) : ["Cuentas por Cobrar (CXC)", "Vales / Faltantes de caja"].includes(n.tipo) ? (
                          <span className="font-mono font-bold text-[#111827] bg-slate-100 px-2 py-0.5 rounded border">
                            Total: {formatMonto(Number(n.monto) || 0)}
                          </span>
                        ) : n.tipo === "Cobertura" && empCubre ? (
                          <span className="text-emerald-700 font-medium">Reemplazo: <strong className="underline uppercase">{empCubre.nombre}</strong></span>
                        ) : (
                          <span className="text-[#6B7280] italic truncate block text-[11px]">{n.comentario}</span>
                        )}
                      </td>
                      <td className="p-3 pr-5 text-center">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${n.estado === "Pendiente Aplicación" ? "bg-amber-50 text-[#F59E0B] border-amber-200" : "bg-emerald-50 text-[#10B981] border-emerald-200"}`}>{n.estado === "Pendiente Aplicación" ? "Pendiente" : "Aplicado"}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PANEL EXPEDIENTE DETALLADO LATERAL */}
      <div className={`${cardClasses} p-5 shadow-lg sticky top-5`}>
        {showAltaForm ? (
          <form onSubmit={ejecutarAlta} className="flex flex-col gap-4 text-xs">
            <div className="flex items-center gap-2.5 border-b pb-3.5 text-slate-800 font-bold">
              <Plus className="w-5 h-5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider">Capturar Novedad</h4>
                <span className="text-[10px] text-[#6B7280] font-normal block">Sección: {activeTab === "vacaciones" ? "Vacaciones Anuales" : "Incidencia Operativa"}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider pl-1">Colaborador</label>
              <select value={nuevo.id_reloj} onChange={e => setNuevo({...nuevo, id_reloj: e.target.value})} className={`${selectClasses} !pl-3.5 bg-white`}>
                {empleados.map(emp => <option key={emp.id_reloj} value={emp.id_reloj}>{emp.nombre.toUpperCase()} (ID: {emp.id_reloj})</option>)}
              </select>
            </div>

            {activeTab === "general" ? (
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider pl-1">Concepto Contable</label>
                <select value={nuevo.tipo} onChange={e => setNuevo({...nuevo, tipo: e.target.value as any, monto: "0", cuotas: "1", cantidad_dias: "1"})} className={`${selectClasses} !pl-3.5 bg-white`}>
                  <option value="Licencia Médica">Licencia Médica</option>
                  <option value="Cobertura">Cobertura (Asistencia Cubierta)</option>
                  <option value="Permiso">Permiso</option>
                  <option value="Cuentas por Cobrar (CXC)">Cuentas por Cobrar (CXC)</option>
                  <option value="Vales / Faltantes de caja">Vales / Faltantes de caja</option>
                </select>
              </div>
            ) : (
              <div className="bg-blue-50 text-[#3B82F6] p-2.5 rounded-lg text-[10px] font-bold border border-blue-100 font-mono">
                SINCRO NOMINAL: DESEMBOLSO DE VACACIONES
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider pl-1">Fecha de Inicio / Incidencia</label>
              <input type="date" required className={`${inputClasses} !pl-3.5 font-mono`} value={nuevo.fecha_inicio} onChange={e => setNuevo({...nuevo, fecha_inicio: e.target.value})} />
            </div>

            {(activeTab === "vacaciones" || nuevo.tipo === "Licencia Médica" || nuevo.tipo === "Permiso" || nuevo.tipo === "Cobertura") ? (
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider pl-1">Cantidad de Días</label>
                <input type="number" min="1" required className={`${inputClasses} !pl-3.5 font-mono`} value={nuevo.cantidad_dias} onChange={e => setNuevo({...nuevo, cantidad_dias: e.target.value})} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider pl-1">Monto (RD$)</label>
                  <input type="number" min="1" step="0.01" required className={`${inputClasses} !pl-3.5 font-mono`} value={nuevo.monto} onChange={e => setNuevo({...nuevo, monto: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider pl-1">Cuotas</label>
                  <input type="number" min="1" disabled={nuevo.tipo === "Vales / Faltantes de caja"} className={`${inputClasses} !pl-3.5 font-mono disabled:opacity-40`} value={nuevo.tipo === "Vales / Faltantes de caja" ? "1" : nuevo.cuotas} onChange={e => setNuevo({...nuevo, cuotas: e.target.value})} />
                </div>
              </div>
            )}

            {activeTab === "vacaciones" && (() => {
              const currentEmp = empleados.find(e => e.id_reloj === nuevo.id_reloj);
              const log = obtenerLogisticaVacaciones(nuevo.fecha_inicio, parseInt(nuevo.cantidad_dias, 10) || 1, currentEmp?.sueldo_base);
              return (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex flex-col gap-1.5 text-[#1E40AF] font-mono text-[10px]">
                  <div><strong>📅 Rango:</strong> {log.desde} al {log.hasta}</div>
                  <div><strong>💵 Adelanto Neto:</strong> {formatMonto(log.montoAdelantoTotal)}</div>
                </div>
              );
            })()}

            {activeTab === "general" && nuevo.tipo === "Cobertura" && (
              <div className="flex flex-col gap-1 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 text-[#065F46]">
                <label className="text-[9px] font-bold text-[#047857] uppercase tracking-wider pl-1">Colaborador que Cubre</label>
                <select value={nuevo.id_reloj_cubre} onChange={e => setNuevo({...nuevo, id_reloj_cubre: e.target.value})} className={`${selectClasses} !pl-3.5 bg-white`}>
                  <option value="Ninguno">-- Seleccionar --</option>
                  {empleados.filter(em => em.id_reloj !== nuevo.id_reloj).map(emp => (
                    <option key={emp.id_reloj} value={emp.id_reloj}>{emp.nombre.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider pl-1">Justificación del Registro</label>
              <input type="text" placeholder="Observaciones..." className={`${inputClasses} !pl-3.5`} value={nuevo.comentario} onChange={e => setNuevo({...nuevo, comentario: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1">
              <button type="button" onClick={() => setShowAltaForm(false)} className="border border-[#E5E7EB] text-[#6B7280] font-bold py-2 rounded-lg text-center">Cancelar</button>
              <button type="submit" className="bg-slate-950 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-1"><Save className="w-4 h-4" /> Guardar Alta</button>
            </div>
          </form>
        ) : novSel ? (
          <form onSubmit={guardarFicha} className="flex flex-col gap-4 text-xs">
            <div className="flex flex-col gap-2 border-b pb-3.5 mb-1">
              <div className="flex items-center gap-2.5 text-slate-800">
                <FileText className="w-5 h-5 shrink-0" />
                <h4 className="font-extrabold font-mono text-sm text-[#111827]">Expediente {novSel.id}</h4>
              </div>
              
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-3 rounded-lg flex flex-col gap-2 text-[11px] font-medium text-[#4B5563]">
                <div>Reloj ID: <strong className="font-mono text-[#111827]">{novSel.id_reloj}</strong></div>
                <div className="truncate">Colaborador: <strong className="text-[#111827] font-bold uppercase">{empAsociado ? empAsociado.nombre : "Sin indexar"}</strong></div>
                <div className="border-t pt-1.5">Inicio: <strong className="font-mono text-[#111827]">{novSel.fecha_inicio}</strong></div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              {!isEditing ? (
                <button type="button" onClick={() => setIsEditing(true)} className="border border-[#E5E7EB] text-[#1F2937] hover:bg-[#F9FAFB] font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs w-full justify-center">
                  <Pencil className="w-3.5 h-3.5" /> Modificar Parámetros
                </button>
              ) : (
                <div className="flex gap-2 w-full">
                  <button type="button" onClick={() => setIsEditing(false)} className="border text-[#6B7280] px-3.5 py-1.5 rounded-lg text-xs flex-1">Cancelar</button>
                  <button type="submit" className="bg-blue-600 text-white font-bold px-4 py-1.5 rounded-lg flex items-center gap-1.5 text-xs flex-1 justify-center">
                    <Save className="w-3.5 h-3.5" /> Guardar
                  </button>
                </div>
              )}
            </div>

            {novSel.tipo !== "Vacaciones" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider pl-1">Concepto Contable</label>
                <select disabled={!isEditing} value={isEditing ? formFicha.tipo : novSel.tipo} onChange={(e) => setFormFicha({ ...formFicha, tipo: e.target.value as any, monto: 0, cuotas: 1, cantidad_dias: 1 })} className={selectClasses}>
                  <option value="Licencia Médica">Licencia Médica</option>
                  <option value="Cobertura">Cobertura</option>
                  <option value="Permiso">Permiso</option>
                  <option value="Cuentas por Cobrar (CXC)">Cuentas por Cobrar (CXC)</option>
                  <option value="Vales / Faltantes de caja">Vales / Faltantes de caja</option>
                </select>
              </div>
            )}

            {(isEditing ? (formFicha.tipo === "Cuentas por Cobrar (CXC)" || formFicha.tipo === "Vales / Faltantes de caja") : (novSel.tipo === "Cuentas por Cobrar (CXC)" || novSel.tipo === "Vales / Faltantes de caja")) ? (
              <div className="grid grid-cols-2 gap-2 bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider">Monto Total</label>
                  <input type="number" step="0.01" disabled={!isEditing} value={isEditing ? (formFicha.monto ?? 0) : (novSel.monto ?? 0)} onChange={(e) => setFormFicha({ ...formFicha, monto: parseFloat(e.target.value) || 0 })} className={`${inputClasses} !pl-3.5 bg-white`} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider">Cuotas</label>
                  <input type="number" min="1" disabled={!isEditing || (isEditing ? formFicha.tipo === "Vales / Faltantes de caja" : novSel.tipo === "Vales / Faltantes de caja")} value={isEditing ? (formFicha.cuotas ?? 1) : (novSel.cuotas ?? 1)} onChange={(e) => setFormFicha({ ...formFicha, cuotas: parseInt(e.target.value, 10) || 1 })} className={`${inputClasses} !pl-3.5 bg-white disabled:opacity-40`} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider pl-1">Duración (Días)</label>
                <input type="number" min="1" disabled={!isEditing} value={isEditing ? (formFicha.cantidad_dias ?? 1) : (novSel.cantidad_dias ?? 1)} onChange={(e) => setFormFicha({ ...formFicha, cantidad_dias: parseInt(e.target.value, 10) || 1 })} className={inputClasses} />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider pl-1">Estado de la Aplicación</label>
              <select disabled={!isEditing} value={isEditing ? formFicha.estado : novSel.estado} onChange={(e) => setFormFicha({ ...formFicha, estado: e.target.value as any })} className={selectClasses}>
                <option value="Pendiente Aplicación">Pendiente Aplicación en Nómina</option>
                <option value="Procesado">Procesado / Cerrado</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider pl-1">Justificación Administrativa</label>
              <textarea disabled={!isEditing} value={isEditing ? formFicha.comentario : novSel.comentario} onChange={(e) => setFormFicha({ ...formFicha, comentario: e.target.value })} className="w-full px-3.5 py-2 bg-[#F9FAFB] border rounded-lg text-xs h-20 text-[#1F2937]" />
            </div>
          </form>
        ) : (
          <div className="text-center text-[#6B7280] italic py-12 bg-[#F9FAFB] rounded-xl border">Seleccione un registro para desplegar el expediente.</div>
        )}
      </div>
    </div>
  );
}