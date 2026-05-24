"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { usePay, Incidencia } from "@/context/PayContext";
import { SUCURSALES_DISPONIBLES } from "@/data/mockData";
import { 
  Search, 
  Plus, 
  X, 
  Save, 
  Clock, 
  Pencil,
  Trash2,
  AlertTriangle,
  ClipboardList,
  User,
  DollarSign
} from "lucide-react";

function formatMonto(val: number) {
  return "RD$ " + Number(val || 0).toLocaleString("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const calcularFechaFinLaborable = (fechaInicioStr: string, diasLaborables: number): string => {
  if (!fechaInicioStr || diasLaborables <= 0) return fechaInicioStr;
  let fecha = new Date(fechaInicioStr + "T00:00:00");
  let diasContados = 0;

  while (diasContados < diasLaborables) {
    if (fecha.getDay() !== 0) { 
      diasContados++;
    }
    if (diasContados < diasLaborables) {
      fecha.setDate(fecha.getDate() + 1);
    }
  }
  return fecha.toISOString().split("T")[0];
};

export default function IncidenciasView() {
  const { 
    empleados = [], 
    incidencias = [], 
    addIncidencia, 
    eliminarIncidencia, 
    fechaSistema = "2026-05-24" 
  } = usePay();

  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("Todos");
  const [filterSucursal, setFilterSucursal] = useState("Todos");
  
  const [selectedId, setSelectedId] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [showAltaForm, setShowAltaForm] = useState(false);

  // --- PANEL RESIZABLE ---
  const [panelWidth, setPanelWidth] = useState(420); 
  const isResizing = useRef(false);

  const startResizing = React.useCallback((e: React.MouseEvent) => { e.preventDefault(); isResizing.current = true; }, []);
  const stopResizing = React.useCallback(() => { isResizing.current = false; }, []);
  const resize = React.useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const nextWidth = window.innerWidth - e.clientX - 32; 
    if (nextWidth > 380 && nextWidth < 700) setPanelWidth(nextWidth);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", resize); window.addEventListener("mouseup", stopResizing);
    return () => { window.removeEventListener("mousemove", resize); window.removeEventListener("mouseup", stopResizing); };
  }, [resize, stopResizing]);

  // Captura de datos
  const [nuevo, setNuevo] = useState({
    id_reloj: "", 
    tipo: "Permiso" as Incidencia["tipo"],
    fecha_inicio: fechaSistema,
    cantidad_dias: "1",
    tiene_cobertura: false,
    id_reloj_cubre: "Ninguno",
    monto: "0",
    cuotas: "1",
    comentario: ""
  });

  useEffect(() => {
    if (empleados.length > 0 && !nuevo.id_reloj) {
      setNuevo(prev => ({ ...prev, id_reloj: empleados[0].id_reloj }));
    }
  }, [empleados, nuevo.id_reloj]);

  const [formFicha, setFormFicha] = useState<Partial<Incidencia>>({});
  
  const novSel = useMemo(() => {
    return incidencias.find((n) => n.id_incidencia === selectedId && n.tipo !== "Vacaciones");
  }, [incidencias, selectedId]);

  const empAsociado = novSel ? empleados.find(e => e.id_reloj === novSel.id_reloj) : null;

  useEffect(() => { 
    if (novSel) { 
      setFormFicha({ ...novSel }); 
      setIsEditing(false); 
    } 
  }, [selectedId, novSel]);

  const analizarImpactoIncidencia = (idReloj: string, tipo: Incidencia["tipo"], dias: number = 1, montoTotal: number = 0, cuotas: number = 1, tieneCobertura: boolean = false) => {
    const empleado = empleados.find(e => e.id_reloj === idReloj);
    const sueldoBaseEmpleado = empleado ? Number(empleado.sueldo_base || empleado.sueldo) : 27489.60;
    const valorDiaDinamico = sueldoBaseEmpleado / 23.83;
    const sueldoQuincenal = sueldoBaseEmpleado / 2;

    let montoDescuento = 0;
    let label = "";

    switch (tipo) {
      case "Permiso":
        montoDescuento = tieneCobertura ? 0 : dias * valorDiaDinamico;
        label = tieneCobertura ? "Turno cubierto por reemplazo." : `Deducción de ${dias} día(s).`;
        break;
      case "Vales / Faltantes de caja":
        montoDescuento = montoTotal; 
        label = "Descuento por faltante quincenal.";
        break;
      case "Cuentas por Cobrar (CXC)":
        montoDescuento = cuotas > 0 ? (montoTotal / cuotas) : montoTotal;
        label = "Amortización de préstamo.";
        break;
    }

    const porcentajeQuincenal = sueldoQuincenal > 0 ? (montoDescuento / sueldoQuincenal) * 100 : 0;

    return { 
      montoDescuento, 
      label, 
      porcentajeQuincenal,
      sueldoQuincenal,
      sueldoBase: sueldoBaseEmpleado
    };
  };

  const metricasAdministrador = useMemo(() => {
    let tardanzasMesMonto = 0;
    let faltasAcumuladasDias = 0;
    let licenciasMedicasActivas = 0;
    let vacacionesTomadasDiasTotal = 0;
    let descuentosAcumuladosQuincena = 0;

    empleados.forEach(e => {
      tardanzasMesMonto += e.tardanzas_quincena_actual_monto || 0;
      faltasAcumuladasDias += e.faltas_acumuladas_cuenta || 0;
      vacacionesTomadasDiasTotal += e.vacaciones_tomadas || 0;
    });

    incidencias.forEach(n => {
      if (n.tipo === "Vacaciones") return;
      const imp = analizarImpactoIncidencia(n.id_reloj, n.tipo, n.cantidad_dias || 1, n.monto || 0, n.cuotas || 1, n.tiene_cobertura || false);
      descuentosAcumuladosQuincena += imp.montoDescuento;
      if (n.tipo === "Licencias médicas") licenciasMedicasActivas++;
    });

    return { tardanzasMesMonto, faltasAcumuladasDias, licenciasMedicasActivas, vacacionesTomadasDiasTotal, descuentosAcumuladosQuincena };
  }, [incidencias, empleados]);

  const filteredNovedades = useMemo(() => {
    return incidencias.filter((n) => {
      if (n.tipo === "Vacaciones") return false;
      const emp = empleados.find(e => e.id_reloj === n.id_reloj);
      if (!emp) return false;
      return (emp.nombre.toLowerCase().includes(search.toLowerCase()) || n.id_reloj.includes(search)) && 
             (filterTipo === "Todos" || n.tipo === filterTipo) && 
             (filterSucursal === "Todos" || emp.sucursal_principal === filterSucursal);
    });
  }, [incidencias, search, filterTipo, filterSucursal, empleados]);

  const handleGuardarNuevaIncidencia = () => {
    const idRelojFinal = nuevo.id_reloj || (empleados.length > 0 ? empleados[0].id_reloj : "");
    if (!idRelojFinal) return alert("❌ Error: Seleccione un colaborador válido.");

    const mDias = ["Licencias médicas", "Maternidad", "Permiso"].includes(nuevo.tipo) ? (parseInt(nuevo.cantidad_dias, 10) || 1) : 1;
    const mMonto = ["Cuentas por Cobrar (CXC)", "Vales / Faltantes de caja"].includes(nuevo.tipo) ? (parseFloat(nuevo.monto) || 0) : 0;
    const mCuotas = nuevo.tipo === "Vales / Faltantes de caja" ? 1 : (parseInt(nuevo.cuotas, 10) || 1);

    if (["Cuentas por Cobrar (CXC)", "Vales / Faltantes de caja"].includes(nuevo.tipo) && mMonto <= 0) {
      alert("❌ Error: Por favor introduzca un monto válido mayor a 0.");
      return;
    }

    const calculoImpacto = analizarImpactoIncidencia(idRelojFinal, nuevo.tipo, mDias, mMonto, mCuotas, nuevo.tiene_cobertura);
    if (calculoImpacto.porcentajeQuincenal > 60) {
      const continuar = confirm(
        `⚠️ ADVERTENCIA DE LÍMITE:\n\nEl descuento propuesto representa el ${calculoImpacto.porcentajeQuincenal.toFixed(1)}% del salario neto quincenal.\n\nSobrepasa el límite sugerido (60%). ¿Desea proceder?`
      );
      if (!continuar) return;
    }

    const creada: Incidencia = {
      id_incidencia: `INC-${Math.floor(100 + Math.random() * 900)}`,
      id_reloj: idRelojFinal, 
      tipo: nuevo.tipo, 
      fecha_inicio: nuevo.fecha_inicio || fechaSistema,
      fecha_fin: ["Licencias médicas", "Maternidad", "Permiso"].includes(nuevo.tipo) ? calcularFechaFinLaborable(nuevo.fecha_inicio || fechaSistema, mDias) : (nuevo.fecha_inicio || fechaSistema),
      cantidad_dias: mDias,
      tiene_cobertura: nuevo.tipo === "Permiso" ? nuevo.tiene_cobertura : undefined,
      id_reloj_cubre: (nuevo.tipo === "Permiso" && nuevo.tiene_cobertura) ? nuevo.id_reloj_cubre : undefined,
      monto: ["Cuentas por Cobrar (CXC)", "Vales / Faltantes de caja"].includes(nuevo.tipo) ? mMonto : undefined,
      cuotas: mCuotas,
      observaciones: nuevo.comentario.trim() || "Procesado sin observaciones",
      fecha_registro: fechaSistema,
      ya_pagada_adelantada: false
    };

    addIncidencia(creada); 
    setSelectedId(creada.id_incidencia); 
    setShowAltaForm(false);

    setNuevo({
      id_reloj: empleados.length > 0 ? empleados[0].id_reloj : "",
      tipo: "Permiso",
      fecha_inicio: fechaSistema,
      cantidad_dias: "1",
      tiene_cobertura: false,
      id_reloj_cubre: "Ninguno",
      monto: "0",
      cuotas: "1",
      comentario: ""
    });
  };

  const handleEjecutarModificacionFicha = () => {
    if (selectedId && incidencias) {
      const loteActualizado = incidencias.map(n => 
        n.id_incidencia === selectedId ? { ...n, ...formFicha } as Incidencia : n
      );
      localStorage.setItem("taniapay_local_incidencias", JSON.stringify(loteActualizado));
      window.location.reload(); 
    }
  };

  const handleEliminarConConfirmacion = (id: string) => {
    if (!confirm("¿Eliminar registro definitivo de la quincena?")) return;
    eliminarIncidencia(id); 
    setSelectedId("");
  };

  const cardClasses = "bg-white border border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(241,245,249,0.3)]";

  const infoPreviaAlta = useMemo(() => {
    const mDias = ["Licencias médicas", "Maternidad", "Permiso"].includes(nuevo.tipo) ? (parseInt(nuevo.cantidad_dias, 10) || 1) : 1;
    const mMonto = ["Cuentas por Cobrar (CXC)", "Vales / Faltantes de caja"].includes(nuevo.tipo) ? (parseFloat(nuevo.monto) || 0) : 0;
    const mCuotas = nuevo.tipo === "Vales / Faltantes de caja" ? 1 : (parseInt(nuevo.cuotas, 10) || 1);
    return analizarImpactoIncidencia(nuevo.id_reloj, nuevo.tipo, mDias, mMonto, mCuotas, nuevo.tiene_cobertura);
  }, [nuevo, empleados]);

  return (
    <div className="flex gap-2 bg-[#F8FAFC] p-4 rounded-3xl min-h-screen w-full select-none font-sans overflow-hidden text-slate-700">
      
      {/* CUERPO CENTRAL DE LA TABLA */}
      <div className="flex-1 flex flex-col gap-4 min-w-0 pr-1">
        
        {/* CABECERA PRINCIPAL CON ACCIÓN PRIMARIA A LA DERECHA */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="px-1 font-bold text-base text-[#2B4C5E] flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" /> Registro y Control de Incidencias Operativas
          </div>
          <button 
            type="button" 
            onClick={() => { setShowAltaForm(!showAltaForm); setIsEditing(false); }} 
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 ${showAltaForm ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-slate-700 text-white hover:bg-slate-600"}`}
          >
            {showAltaForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAltaForm ? "Cancelar" : "Crear Incidencia"}
          </button>
        </div>

        {/* PANEL DE MÈTRICAS ACTUALIZADO (TODAS BLANCAS CON COMUNICACIÓN DE ESTADO REAL) */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className={`${cardClasses} p-3.5 border-l-4 border-amber-500`}>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Tardanzas Mes</span>
            <span className="text-sm font-bold font-mono text-slate-800 mt-1 block">{formatMonto(metricasAdministrador.tardanzasMesMonto)}</span>
          </div>
          <div className={`${cardClasses} p-3.5 border-l-4 border-rose-500`}>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Faltas Acumuladas</span>
            <span className="text-sm font-extrabold text-slate-800 mt-1 block">{metricasAdministrador.faltasAcumuladasDias} Ausencias</span>
          </div>
          <div className={`${cardClasses} p-3.5 border-l-4 border-indigo-500`}>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Licencias Activas</span>
            <span className="text-sm font-extrabold text-slate-800 mt-1 block">{metricasAdministrador.licenciasMedicasActivas} Médicas</span>
          </div>
          <div className={`${cardClasses} p-3.5 border-l-4 border-emerald-500`}>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Vacaciones Tomadas</span>
            <span className="text-sm font-extrabold text-slate-800 mt-1 block">{metricasAdministrador.vacacionesTomadasDiasTotal} Días</span>
          </div>
          <div className={`${cardClasses} p-3.5 border-l-4 ${metricasAdministrador.descuentosAcumuladosQuincena > 0 ? "border-rose-500" : "border-emerald-500"}`}>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Descuentos Aplicados</span>
            <span className={`text-sm font-bold font-mono mt-1 block ${metricasAdministrador.descuentosAcumuladosQuincena > 0 ? "text-rose-600" : "text-emerald-600"}`}>
              {formatMonto(metricasAdministrador.descuentosAcumuladosQuincena)}
            </span>
          </div>
        </div>

        {/* BARRA SECUNDARIA EXCLUSIVA PARA FILTROS */}
        <div className="bg-white border border-slate-100 rounded-2xl p-2.5 flex items-center gap-2 shadow-sm">
          <div className="relative w-60">
            <span className="absolute left-2.5 top-2.5 text-slate-400"><Search className="w-3.5 h-3.5" /></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar colaborador..." className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white text-slate-700" />
          </div>
          <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className="pl-2 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 outline-none cursor-pointer">
            <option value="Todos">Todos los Conceptos</option>
            <option value="Permiso">Permisos</option>
            <option value="Licencias médicas">Licencias médicas</option>
            <option value="Maternidad">Maternidad</option>
            <option value="Cuentas por Cobrar (CXC)">Cuentas por Cobrar (CXC)</option>
            <option value="Vales / Faltantes de caja">Vales / Faltantes de caja</option>
          </select>
          <select value={filterSucursal} onChange={e => setFilterSucursal(e.target.value)} className="pl-2 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 outline-none cursor-pointer">
            <option value="Todos">Todas las Sucursales</option>
            {SUCURSALES_DISPONIBLES?.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* TABLA MAESTRA DE 5 COLUMNAS OPTIMIZADA */}
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm flex-1">
          <div className="overflow-x-auto h-full">
            <table className="w-full text-left text-xs table-fixed min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 h-10 sticky top-0 z-10">
                  <th className="p-2.5 pl-5 w-64">Colaborador / Reloj ID</th>
                  <th className="p-2.5 w-48">Sucursal</th>
                  <th className="p-2.5 w-40">Concepto</th>
                  <th className="p-2.5 w-28 text-center">Plazo / Días</th>
                  <th className="p-2.5 w-60">Impacto Financiero Aplicado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {filteredNovedades.map((n) => {
                  const isSelected = !showAltaForm && selectedId === n.id_incidencia;
                  const emp = empleados.find(e => e.id_reloj === n.id_reloj);
                  const empCubre = n.id_reloj_cubre ? empleados.find(e => e.id_reloj === n.id_reloj_cubre) : null;
                  const imp = analizarImpactoIncidencia(n.id_reloj, n.tipo, n.cantidad_dias || 1, n.monto || 0, n.cuotas || 1, n.tiene_cobertura || false);

                  return (
                    <tr 
                      key={n.id_incidencia} 
                      onClick={() => { setSelectedId(n.id_incidencia); setShowAltaForm(false); }} 
                      className={`h-12 cursor-pointer transition-all ${isSelected ? "bg-emerald-50/30 text-slate-900 border-l-4 border-emerald-500 font-bold" : "hover:bg-slate-50/30"}`}
                    >
                      <td className="p-2.5 pl-5">
                        <div className="font-bold text-slate-700 uppercase truncate">{emp?.nombre || "No Indexado"}</div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">ID: {n.id_reloj}</div>
                      </td>
                      <td className="p-2.5 uppercase font-medium text-slate-500 truncate">{emp?.sucursal_principal}</td>
                      <td className="p-2.5 font-bold text-slate-700">{n.tipo}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-slate-800">
                        {n.tipo === "Cuentas por Cobrar (CXC)" ? `${n.cuotas || 1} Qs` : `${n.cantidad_dias || 1} d`}
                      </td>
                      <td className="p-2.5 text-xs truncate">
                        {n.tipo === "Permiso" && n.tiene_cobertura ? (
                          <span className="text-emerald-700 font-medium bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg text-[10px]">Cubierto por: <strong className="uppercase">{empCubre?.nombre || n.id_reloj_cubre}</strong></span>
                        ) : imp.montoDescuento > 0 ? (
                          <span className="text-rose-600 font-mono font-bold">Deducción: -{formatMonto(imp.montoDescuento)}</span>
                        ) : (
                          <span className="text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-lg text-[10px]">{imp.label}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DRAG GRIP CON VISIBILIDAD EN HOVER MEJORADA */}
      <div onMouseDown={startResizing} className="w-1.5 hover:bg-slate-300 transition-colors cursor-col-resize self-stretch shrink-0 mx-0.5 rounded-full" />

      {/* PANEL EXPEDIENTE LATERAL */}
      <div style={{ width: `${panelWidth}px` }} className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-md sticky top-4 max-h-[92vh] overflow-y-auto shrink-0 flex flex-col gap-5">
        
        {/* CABECERA FIJA CON CONTEXTO ID */}
        <div className="border-b pb-2.5 border-slate-100 flex justify-between items-center shrink-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detalle del registro</span>
          {!showAltaForm && selectedId && (
            <span className="font-mono bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-lg text-[11px] border">
              {selectedId}
            </span>
          )}
        </div>

        {showAltaForm ? (
          /* FORMULARIO DE ALTA */
          <div className="flex flex-col gap-4 text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Colaborador</label>
              <select value={nuevo.id_reloj} onChange={e => setNuevo({...nuevo, id_reloj: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 cursor-pointer">
                {empleados.map(emp => <option key={emp.id_reloj} value={emp.id_reloj}>{emp.nombre.toUpperCase()} (ID: {emp.id_reloj})</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Concepto</label>
              <select value={nuevo.tipo} onChange={e => setNuevo({...nuevo, tipo: e.target.value as any, monto: "0", cuotas: "1", cantidad_dias: "1", tiene_cobertura: false, id_reloj_cubre: "Ninguno"})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 cursor-pointer">
                <option value="Permiso">Permiso</option>
                <option value="Licencias médicas">Licencia Médica</option>
                <option value="Maternidad">Maternidad</option>
                <option value="Cuentas por Cobrar (CXC)">Cuentas por Cobrar (CXC)</option>
                <option value="Vales / Faltantes de caja">Vales / Faltantes de caja</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Fecha Inicial</label>
              <input type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-xs focus:bg-white" value={nuevo.fecha_inicio} onChange={e => setNuevo({...nuevo, fecha_inicio: e.target.value})} />
            </div>

            {nuevo.tipo === "Permiso" && (
              <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-bold select-none">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 accent-emerald-500" checked={nuevo.tiene_cobertura} onChange={e => setNuevo({...nuevo, tiene_cobertura: e.target.checked, id_reloj_cubre: "Ninguno"})} />
                  <span>¿Turno cubierto?</span>
                </label>
                {nuevo.tiene_cobertura && (
                  <select value={nuevo.id_reloj_cubre} onChange={e => setNuevo({...nuevo, id_reloj_cubre: e.target.value})} className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none cursor-pointer">
                    <option value="Ninguno">-- Seleccionar Reemplazo --</option>
                    {empleados.filter(em => em.id_reloj !== nuevo.id_reloj).map(emp => <option key={emp.id_reloj} value={emp.id_reloj}>{emp.nombre}</option>)}
                  </select>
                )}
              </div>
            )}

            {(["Licencias médicas", "Maternidad", "Permiso"].includes(nuevo.tipo)) ? (
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Días</label>
                <input type="number" min="1" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-xs" value={nuevo.cantidad_dias} onChange={e => setNuevo({...nuevo, cantidad_dias: e.target.value})} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Monto Total (RD$)</label>
                  <input type="number" min="0" step="0.01" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-xs" value={nuevo.monto} onChange={e => setNuevo({...nuevo, monto: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Cuotas</label>
                  <input type="number" min="1" disabled={nuevo.tipo === "Vales / Faltantes de caja"} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono disabled:opacity-50" value={nuevo.tipo === "Vales / Faltantes de caja" ? "1" : nuevo.cuotas} onChange={e => setNuevo({...nuevo, cuotas: e.target.value})} />
                </div>
              </div>
            )}

            {infoPreviaAlta.montoDescuento > 0 && (
              <div className={`p-3 rounded-xl border text-[11px] flex flex-col gap-1.5 ${infoPreviaAlta.porcentajeQuincenal > 60 ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-slate-50 border-slate-200"}`}>
                <div className="flex justify-between font-mono">
                  <span>Deducción Estimada:</span>
                  <span className="font-bold text-slate-800">-{formatMonto(infoPreviaAlta.montoDescuento)}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Comentario</label>
              <textarea placeholder="Notas administrativas obligatorias..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs h-14 outline-none focus:bg-white resize-none text-slate-700" value={nuevo.comentario} onChange={e => setNuevo({...nuevo, comentario: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t">
              <button type="button" onClick={() => setShowAltaForm(false)} className="border border-slate-200 text-slate-500 font-semibold py-1.5 rounded-xl">Cancelar</button>
              <button type="button" onClick={handleGuardarNuevaIncidencia} className="bg-[#2B4C5E] text-white font-bold py-1.5 rounded-xl transition-all hover:bg-[#1E3542]">Guardar Registro</button>
            </div>
          </div>
        ) : novSel ? (
          /* AUDITORÍA CONTABLE VISTA DETALLE */
          <div className="flex flex-col gap-5 text-xs h-full justify-between animate-fadeIn">
            <div className="flex flex-col gap-4">
              
              {/* FILA DE COLABORADOR E INCLUSIÓN EXPLÍCITA DE SUELDO BASE */}
              <div className="flex flex-col">
                <span className="text-slate-800 font-black text-xs tracking-wider uppercase font-sans">
                  {novSel.tipo === "Cuentas por Cobrar (CXC)" ? "CUENTAS POR COBRAR" : novSel.tipo.toUpperCase()}
                </span>
                <span className="text-slate-700 font-bold uppercase mt-2 text-[13px] tracking-normal">
                  {empAsociado ? empAsociado.nombre : "No Indexado"}
                </span>
                <div className="text-[10px] text-slate-400 uppercase font-medium mt-0.5 flex flex-col gap-0.5">
                  <span>Sucursal: {empAsociado?.sucursal_principal || "No Asignada"}</span>
                  <span className="text-slate-500 font-semibold font-mono mt-0.5 bg-slate-50 px-2 py-1 border border-slate-100 rounded-lg self-start flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" /> Sueldo Base: {formatMonto(empAsociado?.sueldo_base || 0)}
                  </span>
                </div>
              </div>

              {!isEditing ? (
                (() => {
                  const esAjusteFinanciero = ["Cuentas por Cobrar (CXC)", "Vales / Faltantes de caja"].includes(novSel.tipo);
                  const d = novSel.cantidad_dias || 1;
                  const m = novSel.monto || 0;
                  const c = novSel.cuotas || 1;
                  const imp = analizarImpactoIncidencia(novSel.id_reloj, novSel.tipo, d, m, c, novSel.tiene_cobertura || false);

                  const totalDeuda = esAjusteFinanciero ? m : imp.montoDescuento;
                  const descuentoAhora = imp.montoDescuento;
                  const restante = Math.max(0, totalDeuda - descuentoAhora);
                  const cuotasFaltantes = novSel.tipo === "Cuentas por Cobrar (CXC)" ? Math.max(0, c - 1) : 0;

                  return (
                    <div className="flex flex-col gap-4">
                      
                      {esAjusteFinanciero ? (
                        /* 📊 ESQUEMA CONTABLE DE 3 DATOS PRINCIPALES */
                        <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 flex flex-col gap-3.5 font-sans relative">
                          {imp.porcentajeQuincenal > 60 && (
                            <div className="absolute top-3 right-3 text-rose-500" title="Excede el 60% legal">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                          )}
                          
                          <div>
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total de la deuda:</span>
                            <span className="text-slate-800 font-bold text-base font-mono block mt-0.5">
                              {formatMonto(totalDeuda)}
                            </span>
                          </div>

                          <div className="border-t border-slate-200/60 pt-3">
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Cuánto se descuenta ahora:</span>
                            <span className="text-rose-600 font-extrabold text-base font-mono block mt-0.5">
                              -{formatMonto(descuentoAhora)}
                            </span>
                          </div>

                          <div className="border-t border-slate-200/60 pt-3 grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Cuánto queda (Restante):</span>
                              <span className="text-slate-700 font-bold text-[13px] font-mono block mt-0.5">
                                {formatMonto(restante)}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Cuántas cuotas faltan:</span>
                              <span className="text-slate-700 font-bold text-[13px] block mt-0.5">
                                {novSel.tipo === "Vales / Faltantes de caja" ? "0 cuotas" : `${cuotasFaltantes} cuota${cuotasFaltantes !== 1 ? "s" : ""}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* CONTROL PARA AUSENCIAS O LICENCIAS */
                        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 text-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Monto de Deducción</span>
                          <span className="text-xl font-black font-mono text-rose-600 block mt-1">
                            {imp.montoDescuento > 0 ? `-${formatMonto(imp.montoDescuento)}` : "RD$ 0.00"}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium block mt-1.5 font-sans bg-white border py-1 px-2 rounded-lg inline-block">{imp.label}</span>
                        </div>
                      )}

                      {/* DATOS DE COBERTURA Y VIGENCIA RETRAÍDOS DE LA TABLA */}
                      <div className="flex flex-col gap-2 border-t pt-3 border-slate-100 font-sans text-[11px] text-slate-400">
                        <div className="flex justify-between"><span>Vigencia/Rango:</span><span className="font-mono text-slate-600 font-semibold">{novSel.fecha_inicio} {novSel.fecha_fin && `al ${novSel.fecha_fin}`}</span></div>
                        <div className="flex justify-between"><span>Registrado el:</span><span className="font-mono text-slate-600">{novSel.fecha_registro}</span></div>
                        {novSel.observaciones && <div className="text-[10px] text-slate-500 italic mt-2 bg-slate-50 p-2.5 border border-slate-100 rounded-xl">Nota: "{novSel.observaciones}"</div>}
                      </div>

                    </div>
                  );
                })()
              ) : (
                /* FORMULARIO LATERAL INTERNO DE EDICIÓN */
                <div className="flex flex-col gap-3 animate-fadeIn">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Concepto</label>
                    <select value={formFicha.tipo} onChange={(e) => setFormFicha({ ...formFicha, tipo: e.target.value as any, monto: 0, cuotas: 1, cantidad_dias: 1 })} className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs">
                      <option value="Permiso">Permiso</option>
                      <option value="Licencias médicas">Licencia Médica</option>
                      <option value="Maternidad">Maternidad</option>
                      <option value="Cuentas por Cobrar (CXC)">Cuentas por Cobrar (CXC)</option>
                      <option value="Vales / Faltantes de caja">Vales / Faltantes de caja</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Fecha de Inicio</label>
                    <input type="date" className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs font-mono" value={formFicha.fecha_inicio || ""} onChange={e => setFormFicha({...formFicha, fecha_inicio: e.target.value})} />
                  </div>

                  {(["Licencias médicas", "Maternidad", "Permiso"].includes(formFicha.tipo || "")) ? (
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] text-slate-400 font-bold uppercase">Días</label>
                      <input type="number" min="1" className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs font-mono" value={formFicha.cantidad_dias ?? 1} onChange={e => setFormFicha({...formFicha, cantidad_dias: parseInt(e.target.value, 10) || 1})} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase">Monto</label>
                        <input type="number" step="0.01" className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs font-mono" value={formFicha.monto ?? 0} onChange={e => setFormFicha({...formFicha, monto: parseFloat(e.target.value) || 0})} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase">Cuotas</label>
                        <input type="number" min="1" disabled={formFicha.tipo === "Vales / Faltantes de caja"} className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs font-mono disabled:opacity-40" value={formFicha.tipo === "Vales / Faltantes de caja" ? 1 : (formFicha.cuotas ?? 1)} onChange={e => setFormFicha({...formFicha, cuotas: parseInt(e.target.value, 10) || 1})} />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Observaciones</label>
                    <textarea className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs h-14 resize-none" value={formFicha.observaciones || ""} onChange={e => setFormFicha({...formFicha, observaciones: e.target.value})} />
                  </div>
                </div>
              )}
            </div>

            {/* BOTÓN DISPARADOR DE EDICIÓN DE FICHA LOCAL */}
            <div className="pt-3 border-t border-slate-100">
              {!isEditing ? (
                <button type="button" onClick={() => setIsEditing(true)} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all">
                  <Pencil className="w-3.5 h-3.5" /> Editar Registro
                </button>
              ) : (
                <div className="flex gap-2 w-full">
                  <button type="button" onClick={() => setIsEditing(false)} className="border border-slate-200 text-slate-400 py-1.5 rounded-xl flex-1 text-center font-semibold">Cancelar</button>
                  <button type="button" onClick={handleEjecutarModificacionFicha} className="bg-[#2B4C5E] text-white py-1.5 rounded-xl flex-1 flex items-center justify-center gap-1.5 font-bold"><Save className="w-3.5 h-3.5" /> Guardar</button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ESTADO VACÍO REGULADO CON ICONO E INSTRUCCIÓN EXACTA */
          <div className="text-center text-slate-400 h-full flex flex-col items-center justify-center py-24 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/80 my-auto">
            <ClipboardList className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-[11px] font-medium tracking-normal font-sans text-slate-400 leading-relaxed max-w-[180px]">
              Selecciona un registro para ver el desglose
            </p>
          </div>
        )}
      </div>
    </div>
  );
}