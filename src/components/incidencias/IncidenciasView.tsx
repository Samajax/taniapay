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
  DollarSign,
  Calendar,
  Building2,
  FileText,
  CheckCircle,
  UserCheck,
  UserX,
  CreditCard,
  Receipt,
  CalendarDays,
  MoreHorizontal,
  UserPlus,
  History
} from "lucide-react";

// Mock de usuario actual (en producción vendría del auth)
const USUARIO_ACTUAL = "ADMIN_SISTEMA";

function formatMonto(val: number) {
  return "RD$ " + Number(val || 0).toLocaleString("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
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

// Función para obtener el fin de la quincena actual (fecha de inicio del CXC)
const obtenerFinQuincenaActual = (fechaReferenciaStr: string): string => {
  const fecha = new Date(fechaReferenciaStr + "T00:00:00");
  const dia = fecha.getDate();
  const mes = fecha.getMonth();
  const anio = fecha.getFullYear();
  
  let fechaFin: Date;
  
  if (dia <= 15) {
    fechaFin = new Date(anio, mes, 15);
  } else {
    fechaFin = new Date(anio, mes + 1, 0);
  }
  
  return fechaFin.toISOString().split("T")[0];
};

// Función para calcular la fecha de fin de un CXC según el número de cuotas
const calcularFechaFinCXC = (fechaInicioStr: string, cuotas: number): string => {
  if (!fechaInicioStr || cuotas <= 0) return fechaInicioStr;
  
  let fecha = new Date(fechaInicioStr + "T00:00:00");
  let cuotasRestantes = cuotas;
  
  while (cuotasRestantes > 1) {
    const dia = fecha.getDate();
    const mes = fecha.getMonth();
    const anio = fecha.getFullYear();
    
    if (dia === 15) {
      fecha = new Date(anio, mes + 1, 0);
    } else {
      fecha = new Date(anio, mes + 1, 15);
    }
    cuotasRestantes--;
  }
  
  return fecha.toISOString().split("T")[0];
};

const getIconoTipo = (tipo: string) => {
  switch (tipo) {
    case "Permiso": return <UserCheck className="w-3.5 h-3.5" />;
    case "Licencias médicas": return <UserX className="w-3.5 h-3.5" />;
    case "Maternidad": return <UserX className="w-3.5 h-3.5" />;
    case "Cuentas por Cobrar (CXC)": return <CreditCard className="w-3.5 h-3.5" />;
    case "Vales / Faltantes de caja": return <Receipt className="w-3.5 h-3.5" />;
    case "Falta": return <XCircle className="w-3.5 h-3.5" />;
    case "Tardanza": return <Clock className="w-3.5 h-3.5" />;
    case "Vacaciones": return <CalendarDays className="w-3.5 h-3.5" />;
    default: return <MoreHorizontal className="w-3.5 h-3.5" />;
  }
};

const getColorTipo = (tipo: string) => {
  switch (tipo) {
    case "Permiso": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Licencias médicas": return "bg-amber-50 text-amber-700 border-amber-200";
    case "Maternidad": return "bg-purple-50 text-purple-700 border-purple-200";
    case "Cuentas por Cobrar (CXC)": return "bg-blue-50 text-blue-700 border-blue-200";
    case "Vales / Faltantes de caja": return "bg-red-50 text-red-700 border-red-200";
    case "Falta": return "bg-orange-50 text-orange-700 border-orange-200";
    case "Tardanza": return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "Vacaciones": return "bg-teal-50 text-teal-700 border-teal-200";
    default: return "bg-slate-50 text-slate-700 border-slate-200";
  }
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
  const [panelWidth, setPanelWidth] = useState(480); 
  const isResizing = useRef(false);

  const startResizing = React.useCallback((e: React.MouseEvent) => { e.preventDefault(); isResizing.current = true; }, []);
  const stopResizing = React.useCallback(() => { isResizing.current = false; }, []);
  const resize = React.useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const nextWidth = window.innerWidth - e.clientX - 32; 
    if (nextWidth > 400 && nextWidth < 800) setPanelWidth(nextWidth);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", resize); 
    window.addEventListener("mouseup", stopResizing);
    return () => { 
      window.removeEventListener("mousemove", resize); 
      window.removeEventListener("mouseup", stopResizing); 
    };
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
    return incidencias.find((n) => n.id_incidencia === selectedId);
  }, [incidencias, selectedId]);

  const empAsociado = novSel ? empleados.find(e => e.id_reloj === novSel.id_reloj) : null;
  const empCubre = novSel?.id_reloj_cubre ? empleados.find(e => e.id_reloj === novSel.id_reloj_cubre) : null;

  useEffect(() => { 
    if (novSel) { 
      setFormFicha({ ...novSel }); 
      setIsEditing(false); 
    } 
  }, [selectedId, novSel]);

  const analizarImpactoIncidencia = (idReloj: string, tipo: Incidencia["tipo"], dias: number = 1, montoTotal: number = 0, cuotas: number = 1, tieneCobertura: boolean = false) => {
    const empleado = empleados.find(e => e.id_reloj === idReloj);
    const sueldoBaseEmpleado = empleado ? Number(empleado.sueldo_base) : 27489.60;
    const valorDiaDinamico = sueldoBaseEmpleado / 23.83;
    const sueldoQuincenal = sueldoBaseEmpleado / 2;

    let montoDescuento = 0;
    let label = "";
    let subLabel = "";

    switch (tipo) {
      case "Permiso":
        montoDescuento = tieneCobertura ? 0 : dias * valorDiaDinamico;
        label = tieneCobertura ? "Turno cubierto" : "Deducción por ausencia";
        subLabel = tieneCobertura ? "Reemplazo asignado" : `${dias} día(s) sin goce de sueldo`;
        break;
      case "Vales / Faltantes de caja":
        montoDescuento = montoTotal; 
        label = "Faltante en caja";
        subLabel = "Descuento directo quincenal";
        break;
      case "Cuentas por Cobrar (CXC)":
        montoDescuento = cuotas > 0 ? (montoTotal / cuotas) : montoTotal;
        label = "Amortización de préstamo";
        subLabel = `${cuotas} cuota(s) programada(s)`;
        break;
      case "Licencias médicas":
        montoDescuento = dias * valorDiaDinamico;
        label = "Licencia médica";
        subLabel = `${dias} día(s) de incapacidad`;
        break;
      case "Maternidad":
        montoDescuento = dias * valorDiaDinamico;
        label = "Licencia de maternidad";
        subLabel = `${dias} día(s) de licencia`;
        break;
      case "Falta":
        montoDescuento = dias * valorDiaDinamico;
        label = "Falta injustificada";
        subLabel = `${dias} día(s) sin justificación`;
        break;
      case "Tardanza":
        montoDescuento = montoTotal;
        label = "Tardanza registrada";
        subLabel = "Descuento por llegada tarde";
        break;
      case "Vacaciones":
        montoDescuento = 0;
        label = "Período vacacional";
        subLabel = `${dias} día(s) de vacaciones`;
        break;
    }

    const porcentajeQuincenal = sueldoQuincenal > 0 ? (montoDescuento / sueldoQuincenal) * 100 : 0;

    return { 
      montoDescuento, 
      label, 
      subLabel,
      porcentajeQuincenal,
      sueldoQuincenal,
      sueldoBase: sueldoBaseEmpleado,
      valorDia: valorDiaDinamico
    };
  };

  // Métricas calculadas desde incidencias
  const metricasAdministrador = useMemo(() => {
    let licenciasActivas = 0;
    let vacacionesActivas = 0;
    let permisosActivos = 0;
    let descuentosAcumulados = 0;
    let totalPrestamos = 0;
    let totalFaltantes = 0;

    incidencias.forEach(n => {
      const imp = analizarImpactoIncidencia(n.id_reloj, n.tipo, n.cantidad_dias || 1, n.monto || 0, n.cuotas || 1, n.tiene_cobertura || false);
      descuentosAcumulados += imp.montoDescuento;
      
      if (n.tipo === "Licencias médicas" || n.tipo === "Maternidad") licenciasActivas++;
      if (n.tipo === "Vacaciones") vacacionesActivas++;
      if (n.tipo === "Permiso" && !n.tiene_cobertura) permisosActivos++;
      if (n.tipo === "Cuentas por Cobrar (CXC)" && n.monto) totalPrestamos += n.monto;
      if (n.tipo === "Vales / Faltantes de caja" && n.monto) totalFaltantes += n.monto;
    });

    return { licenciasActivas, vacacionesActivas, permisosActivos, descuentosAcumulados, totalPrestamos, totalFaltantes };
  }, [incidencias, empleados]);

  const filteredNovedades = useMemo(() => {
    return incidencias.filter((n) => {
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

    const mDias = ["Licencias médicas", "Maternidad", "Permiso", "Falta", "Vacaciones"].includes(nuevo.tipo) ? (parseInt(nuevo.cantidad_dias, 10) || 1) : 1;
    const mMonto = ["Cuentas por Cobrar (CXC)", "Vales / Faltantes de caja", "Tardanza"].includes(nuevo.tipo) ? (parseFloat(nuevo.monto) || 0) : 0;
    const mCuotas = nuevo.tipo === "Vales / Faltantes de caja" ? 1 : (parseInt(nuevo.cuotas, 10) || 1);

    if (["Cuentas por Cobrar (CXC)", "Vales / Faltantes de caja"].includes(nuevo.tipo) && mMonto <= 0) {
      alert("❌ Error: Por favor introduzca un monto válido mayor a 0.");
      return;
    }

    const ahora = new Date().toISOString();
    let fechaInicio = nuevo.fecha_inicio;
    let fechaFin = "";

    if (nuevo.tipo === "Cuentas por Cobrar (CXC)") {
      fechaInicio = obtenerFinQuincenaActual(fechaSistema);
      fechaFin = calcularFechaFinCXC(fechaInicio, mCuotas);
    } else if (["Licencias médicas", "Maternidad", "Permiso", "Falta", "Vacaciones"].includes(nuevo.tipo)) {
      fechaFin = calcularFechaFinLaborable(nuevo.fecha_inicio, mDias);
    } else {
      fechaFin = nuevo.fecha_inicio;
    }

    const calculoImpacto = analizarImpactoIncidencia(idRelojFinal, nuevo.tipo, mDias, mMonto, mCuotas, nuevo.tiene_cobertura);
    if (calculoImpacto.porcentajeQuincenal > 60 && (nuevo.tipo !== "Permiso" || !nuevo.tiene_cobertura) && nuevo.tipo !== "Vacaciones") {
      const continuar = confirm(
        `⚠️ ADVERTENCIA DE LÍMITE\n\nEl descuento propuesto representa el ${calculoImpacto.porcentajeQuincenal.toFixed(1)}% del salario neto quincenal.\n\nSobrepasa el límite sugerido (60%). ¿Desea proceder?`
      );
      if (!continuar) return;
    }

    const nuevaIncidencia: Incidencia = {
      id_incidencia: `INC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      id_reloj: idRelojFinal,
      tipo: nuevo.tipo,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin || undefined,
      cantidad_dias: mDias,
      tiene_cobertura: nuevo.tipo === "Permiso" ? nuevo.tiene_cobertura : undefined,
      id_reloj_cubre: (nuevo.tipo === "Permiso" && nuevo.tiene_cobertura && nuevo.id_reloj_cubre !== "Ninguno") ? nuevo.id_reloj_cubre : undefined,
      monto: ["Cuentas por Cobrar (CXC)", "Vales / Faltantes de caja", "Tardanza"].includes(nuevo.tipo) ? mMonto : undefined,
      cuotas: mCuotas,
      observaciones: nuevo.comentario.trim() || "Registro sin observaciones adicionales",
      fecha_registro: ahora,
      ya_pagada_adelantada: false,
      creado_por: USUARIO_ACTUAL,
      creado_en: ahora
    };

    const incidenciasExistentes = JSON.parse(localStorage.getItem("taniapay_local_incidencias") || "[]");
    const incidenciasActualizadas = [...incidenciasExistentes, nuevaIncidencia];
    localStorage.setItem("taniapay_local_incidencias", JSON.stringify(incidenciasActualizadas));
    
    if (addIncidencia) {
      addIncidencia(nuevaIncidencia);
    }
    
    alert("✅ Incidencia registrada con éxito.");
    setSelectedId(nuevaIncidencia.id_incidencia);
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
    
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleEjecutarModificacionFicha = () => {
    if (selectedId && incidencias) {
      const ahora = new Date().toISOString();
      const loteActualizado = incidencias.map(n => 
        n.id_incidencia === selectedId ? { 
          ...n, 
          ...formFicha,
          modificado_por: USUARIO_ACTUAL,
          modificado_en: ahora
        } as Incidencia : n
      );
      localStorage.setItem("taniapay_local_incidencias", JSON.stringify(loteActualizado));
      alert("✅ Incidencia modificada con éxito.");
      window.location.reload(); 
    }
  };

  const handleEliminarConConfirmacion = (id: string) => {
    if (!confirm("⚠️ ¿Eliminar este registro permanentemente?\n\nEsta acción no se puede deshacer.")) return;
    
    const incidenciasExistentes = JSON.parse(localStorage.getItem("taniapay_local_incidencias") || "[]");
    const incidenciasActualizadas = incidenciasExistentes.filter((n: Incidencia) => n.id_incidencia !== id);
    localStorage.setItem("taniapay_local_incidencias", JSON.stringify(incidenciasActualizadas));
    
    if (eliminarIncidencia) {
      eliminarIncidencia(id);
    }
    
    alert("✅ Incidencia eliminada.");
    setSelectedId("");
    window.location.reload();
  };

  const cardClasses = "bg-white border border-slate-100/80 rounded-2xl shadow-[0_4px_20px_rgba(241,245,249,0.6)]";
  const inputClasses = "w-full pl-9 pr-3.5 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-xs outline-none focus:bg-white focus:border-emerald-500/80 focus:ring-4 focus:ring-emerald-500/5 transition-all text-slate-700 disabled:opacity-60 disabled:bg-slate-50/50";
  const selectClasses = "w-full pl-9 pr-8 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-xs font-medium outline-none cursor-pointer focus:bg-white focus:border-emerald-500/80 focus:ring-4 focus:ring-emerald-500/5 transition-all text-slate-700 appearance-none disabled:opacity-60 disabled:bg-slate-50/50";

  const infoPreviaAlta = useMemo(() => {
    const mDias = ["Licencias médicas", "Maternidad", "Permiso", "Falta", "Vacaciones"].includes(nuevo.tipo) ? (parseInt(nuevo.cantidad_dias, 10) || 1) : 1;
    const mMonto = ["Cuentas por Cobrar (CXC)", "Vales / Faltantes de caja", "Tardanza"].includes(nuevo.tipo) ? (parseFloat(nuevo.monto) || 0) : 0;
    const mCuotas = nuevo.tipo === "Vales / Faltantes de caja" ? 1 : (parseInt(nuevo.cuotas, 10) || 1);
    return analizarImpactoIncidencia(nuevo.id_reloj, nuevo.tipo, mDias, mMonto, mCuotas, nuevo.tiene_cobertura);
  }, [nuevo, empleados]);

  return (
    <div className="flex gap-1 text-slate-700 bg-[#F8FAFC] p-4 rounded-3xl min-h-screen w-full select-none overflow-hidden font-sans">
      
      {/* PANEL PRINCIPAL */}
      <div className="flex-1 flex flex-col gap-6 min-w-0 pr-2">
    
        {/* INDICADORES TOP */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`${cardClasses} p-5 flex items-center justify-between bg-gradient-to-br from-white to-slate-50/30`}>
            <div>
              <span className="text-[10px] font-bold text-slate-400 tracking-widest block">Licencias Activas</span>
              <span className="text-2xl font-bold text-slate-800 tracking-tight mt-1 block">{metricasAdministrador.licenciasActivas}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50/60 text-emerald-600 flex items-center justify-center border border-emerald-100/50">
              <UserX className="w-4 h-4" />
            </div>
          </div>

          <div className={`${cardClasses} p-5 flex items-center justify-between bg-gradient-to-br from-white to-slate-50/30`}>
            <div>
              <span className="text-[10px] font-bold text-slate-400 tracking-widest block">Vacaciones</span>
              <span className="text-2xl font-bold text-slate-700 tracking-tight mt-1 block">{metricasAdministrador.vacacionesActivas}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-50/60 text-teal-600 flex items-center justify-center border border-teal-100/50">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>

          <div className={`${cardClasses} p-5 flex items-center justify-between bg-gradient-to-br from-white to-slate-50/30`}>
            <div>
              <span className="text-[10px] font-bold text-slate-400 tracking-widest block">Permisos Activos</span>
              <span className="text-2xl font-bold text-slate-700 tracking-tight mt-1 block">{metricasAdministrador.permisosActivos}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50/60 text-amber-600 flex items-center justify-center border border-amber-100/50">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>

          <div className={`${cardClasses} p-5 flex items-center justify-between bg-gradient-to-br from-white to-slate-50/30`}>
            <div>
              <span className="text-[10px] font-bold text-slate-400 tracking-widest block">Descuentos Aplicados</span>
              <span className="text-sm font-bold text-slate-700 tracking-tight mt-1 block font-mono">{formatMonto(metricasAdministrador.descuentosAcumulados)}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50/60 text-red-600 flex items-center justify-center border border-red-100/50">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* BARRA DE BÚSQUEDA Y ALTA */}
        <div className={`${cardClasses} p-4 flex flex-col sm:flex-row gap-3.5 items-center justify-between bg-white`}>
          <div className="relative w-full sm:w-72">
            <span className="absolute left-3 top-3 text-slate-400 pointer-events-none"><Search className="w-4 h-4" /></span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar colaborador..." className={inputClasses} />
          </div>

          <div className="flex gap-2.5 w-full sm:w-auto justify-end items-center">
            <div className="relative min-w-[150px]">
              <span className="absolute left-3 top-3 text-slate-400 pointer-events-none"><FileText className="w-4 h-4" /></span>
              <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} className={`${selectClasses} text-slate-600 font-semibold bg-slate-50/50`}>
                <option value="Todos">Todos los Conceptos</option>
                <option value="Permiso">Permisos</option>
                <option value="Licencias médicas">Licencias Médicas</option>
                <option value="Maternidad">Maternidad</option>
                <option value="Cuentas por Cobrar (CXC)">Cuentas por Cobrar</option>
                <option value="Vales / Faltantes de caja">Vales / Faltantes</option>
                <option value="Falta">Faltas</option>
                <option value="Tardanza">Tardanzas</option>
                <option value="Vacaciones">Vacaciones</option>
              </select>
            </div>
            
            <div className="relative min-w-[150px]">
              <span className="absolute left-3 top-3 text-slate-400 pointer-events-none"><Building2 className="w-4 h-4" /></span>
              <select value={filterSucursal} onChange={(e) => setFilterSucursal(e.target.value)} className={`${selectClasses} text-slate-600 font-semibold bg-slate-50/50`}>
                <option value="Todos">Todas las Sucursales</option>
                {SUCURSALES_DISPONIBLES?.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <button 
              type="button" 
              onClick={() => { setShowAltaForm(!showAltaForm); setIsEditing(false); setSelectedId(""); }}
              className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 ${showAltaForm ? "bg-red-50 text-red-600 hover:bg-red-100/70" : "bg-[#42A873] text-white hover:bg-[#399665] shadow-sm"}`}
            >
              {showAltaForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {showAltaForm ? "Cancelar" : "Nueva Incidencia"}
            </button>
          </div>
        </div>

        {/* TABLA MAESTRA */}
        <div className={`${cardClasses} overflow-hidden bg-white`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs table-fixed min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 h-12">
                  <th className="p-3 pl-6 w-64">Colaborador / ID</th>
                  <th className="p-3 w-40">Sucursal</th>
                  <th className="p-3 w-44">Concepto</th>
                  <th className="p-3 w-24 text-center">Plazo</th>
                  <th className="p-3 w-60">Impacto Económico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {filteredNovedades.length === 0 ? (
                  <tr className="h-32">
                    <td colSpan={5} className="p-3 text-center text-slate-400 italic">
                      <div className="flex flex-col items-center gap-2">
                        <ClipboardList className="w-12 h-12 text-slate-300" />
                        <span>No se encontraron incidencias registradas.</span>
                        <span className="text-[10px]">Haz clic en "Nueva Incidencia" para crear una.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredNovedades.map((n) => {
                    const isSelected = !showAltaForm && selectedId === n.id_incidencia;
                    const emp = empleados.find(e => e.id_reloj === n.id_reloj);
                    const imp = analizarImpactoIncidencia(n.id_reloj, n.tipo, n.cantidad_dias || 1, n.monto || 0, n.cuotas || 1, n.tiene_cobertura || false);
                    const colorTipo = getColorTipo(n.tipo);
                    const iconoTipo = getIconoTipo(n.tipo);
                    const empCubreLocal = n.id_reloj_cubre ? empleados.find(e => e.id_reloj === n.id_reloj_cubre) : null;

                    return (
                      <tr 
                        key={n.id_incidencia} 
                        onClick={() => { setSelectedId(n.id_incidencia); setShowAltaForm(false); }} 
                        className={`h-14 cursor-pointer transition-all ${isSelected ? "bg-emerald-50/30 text-slate-900 font-medium border-l-4 border-emerald-500" : "hover:bg-slate-50/40"}`}
                      >
                        <td className={`p-3 pl-6 ${isSelected && "!pl-5"}`}>
                          <div className="font-bold text-slate-700 uppercase truncate">{emp?.nombre || "No asignado"}</div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">ID: {n.id_reloj}</div>
                        </td>
                        <td className="p-3 uppercase font-medium text-slate-500 truncate">{emp?.sucursal_principal || "—"}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${colorTipo}`}>
                            {iconoTipo}
                            {n.tipo}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-700">
                          {n.tipo === "Cuentas por Cobrar (CXC)" ? `${n.cuotas || 1} cuota(s)` : `${n.cantidad_dias || 1} día(s)`}
                        </td>
                        <td className="p-3 text-xs">
                          {n.tipo === "Permiso" && n.tiene_cobertura ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-700 font-medium">Cubierto por {empCubreLocal?.nombre?.split(' ')[0] || n.id_reloj_cubre}</span>
                            </div>
                          ) : imp.montoDescuento > 0 ? (
                            <div>
                              <span className="text-rose-600 font-mono font-bold">-{formatMonto(imp.montoDescuento)}</span>
                              <p className="text-[9px] text-slate-400 mt-0.5">{imp.subLabel}</p>
                            </div>
                          ) : (
                            <div>
                              <span className="text-emerald-600 font-medium">{imp.label}</span>
                              <p className="text-[9px] text-slate-400 mt-0.5">{imp.subLabel}</p>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DRAG RESIZE GRIP */}
      <div 
        onMouseDown={startResizing}
        className="w-2.5 hover:w-3 bg-transparent hover:bg-slate-200/60 active:bg-slate-300 rounded-full cursor-col-resize transition-all self-stretch shrink-0 mx-0.5 relative z-10"
      />

      {/* PANEL EXPEDIENTE LATERAL */}
      <div 
        style={{ width: `${panelWidth}px` }}
        className={`${cardClasses} p-5 bg-white shadow-md sticky top-5 max-h-[88vh] overflow-y-auto border-slate-200/50 shrink-0 select-text`}
      >
        {showAltaForm ? (
          /* FORMULARIO DE ALTA */
          <form onSubmit={(e) => { e.preventDefault(); handleGuardarNuevaIncidencia(); }} className="flex flex-col gap-4 text-xs">
            <div className="flex flex-col gap-1 border-b border-slate-100 pb-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Nueva Incidencia</h4>
              <span className="text-[10px] text-slate-400">Registrar evento en la nómina</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Colaborador</label>
              <select value={nuevo.id_reloj} onChange={e => setNuevo({...nuevo, id_reloj: e.target.value})} className={`${selectClasses} !pl-3 bg-slate-50`}>
                {empleados.map((emp, idx) => (
                  <option key={`${emp.id_reloj}-${idx}`} value={emp.id_reloj}>
                    {emp.nombre.toUpperCase()} — {emp.cargo} (ID: {emp.id_reloj})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Tipo de Incidencia</label>
              <select value={nuevo.tipo} onChange={e => setNuevo({...nuevo, tipo: e.target.value as any, monto: "0", cuotas: "1", cantidad_dias: "1", tiene_cobertura: false, id_reloj_cubre: "Ninguno"})} className={`${selectClasses} !pl-3 bg-slate-50`}>
                <option value="Permiso">📋 Permiso</option>
                <option value="Licencias médicas">🏥 Licencia Médica</option>
                <option value="Maternidad">👶 Maternidad</option>
                <option value="Cuentas por Cobrar (CXC)">💰 Cuentas por Cobrar (CXC)</option>
                <option value="Vales / Faltantes de caja">💸 Vales / Faltantes de caja</option>
                <option value="Falta">❌ Falta</option>
                <option value="Tardanza">⏰ Tardanza</option>
                <option value="Vacaciones">🏖️ Vacaciones</option>
              </select>
            </div>

            {nuevo.tipo !== "Cuentas por Cobrar (CXC)" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Fecha de Inicio</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input type="date" className={`${inputClasses} !pl-9 font-mono`} value={nuevo.fecha_inicio} onChange={e => setNuevo({...nuevo, fecha_inicio: e.target.value})} />
                </div>
              </div>
            )}

            {nuevo.tipo === "Cuentas por Cobrar (CXC)" && (
              <div className="border border-blue-200 p-3 rounded-xl bg-blue-50/30">
                <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">Programación Automática</span>
                <div className="mt-2 text-[10px] text-slate-600 space-y-1">
                  <p>📅 Primera cuota: <strong>{formatDate(obtenerFinQuincenaActual(fechaSistema))}</strong></p>
                  {parseInt(nuevo.cuotas) > 1 && (
                    <p>📅 Última cuota: <strong>{formatDate(calcularFechaFinCXC(obtenerFinQuincenaActual(fechaSistema), parseInt(nuevo.cuotas)))}</strong></p>
                  )}
                  <p className="text-[9px] text-slate-400 mt-1">El sistema calcula automáticamente las fechas según las cuotas.</p>
                </div>
              </div>
            )}

            {nuevo.tipo === "Permiso" && (
              <div className="border border-indigo-200 p-3 rounded-xl bg-indigo-50/30">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-3.5 h-3.5 rounded border-indigo-300 accent-indigo-600" checked={nuevo.tiene_cobertura} onChange={e => setNuevo({...nuevo, tiene_cobertura: e.target.checked, id_reloj_cubre: "Ninguno"})} />
                  <span className="text-[9px] font-bold text-indigo-700">Turno será cubierto por otro colaborador</span>
                </label>
                {nuevo.tiene_cobertura && (
                  <select value={nuevo.id_reloj_cubre} onChange={e => setNuevo({...nuevo, id_reloj_cubre: e.target.value})} className={`${selectClasses} !pl-3 mt-2 bg-white`}>
                    <option value="Ninguno">— Seleccionar reemplazo —</option>
                    {empleados.filter(em => em.id_reloj !== nuevo.id_reloj).map((emp, idx) => (
                      <option key={`${emp.id_reloj}-${idx}`} value={emp.id_reloj}>{emp.nombre}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {["Licencias médicas", "Maternidad", "Permiso", "Falta", "Vacaciones"].includes(nuevo.tipo) ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Cantidad de Días</label>
                <input type="number" min="1" className={`${inputClasses} !pl-3 font-mono`} value={nuevo.cantidad_dias} onChange={e => setNuevo({...nuevo, cantidad_dias: e.target.value})} />
              </div>
            ) : nuevo.tipo === "Cuentas por Cobrar (CXC)" ? (
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Monto Total (RD$)</label>
                  <input type="number" min="0" step="0.01" className={`${inputClasses} !pl-3 font-mono`} value={nuevo.monto} onChange={e => setNuevo({...nuevo, monto: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Número de Cuotas</label>
                  <input type="number" min="1" max="24" className={`${inputClasses} !pl-3 font-mono`} value={nuevo.cuotas} onChange={e => setNuevo({...nuevo, cuotas: e.target.value})} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Monto (RD$)</label>
                  <input type="number" min="0" step="0.01" className={`${inputClasses} !pl-3 font-mono`} value={nuevo.monto} onChange={e => setNuevo({...nuevo, monto: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Cuotas</label>
                  <input type="number" min="1" disabled={nuevo.tipo === "Vales / Faltantes de caja" || nuevo.tipo === "Tardanza"} className={`${inputClasses} !pl-3 font-mono disabled:opacity-40`} value={nuevo.tipo === "Vales / Faltantes de caja" || nuevo.tipo === "Tardanza" ? "1" : nuevo.cuotas} onChange={e => setNuevo({...nuevo, cuotas: e.target.value})} />
                </div>
              </div>
            )}

            {infoPreviaAlta.montoDescuento > 0 && (
              <div className={`border p-3 rounded-xl ${infoPreviaAlta.porcentajeQuincenal > 60 ? 'border-red-200 bg-red-50/50' : 'border-emerald-200 bg-emerald-50/50'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Impacto Estimado</span>
                  {infoPreviaAlta.porcentajeQuincenal > 60 && (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-red-600">
                      <AlertTriangle className="w-3 h-3" /> Excede límite
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-baseline mt-1">
                  <span className="text-[10px] text-slate-600">Deducción por cuota:</span>
                  <span className="text-sm font-black font-mono text-rose-600">-{formatMonto(infoPreviaAlta.montoDescuento)}</span>
                </div>
                <div className="flex justify-between items-baseline mt-0.5">
                  <span className="text-[9px] text-slate-400">% del salario:</span>
                  <span className="text-[10px] font-bold text-slate-700">{infoPreviaAlta.porcentajeQuincenal.toFixed(1)}%</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Comentarios / Notas</label>
              <textarea rows={3} placeholder="Detalles administrativos..." className={`${inputClasses} resize-none`} value={nuevo.comentario} onChange={e => setNuevo({...nuevo, comentario: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setShowAltaForm(false)} className="border border-slate-200 text-slate-500 font-semibold py-2.5 rounded-xl text-center hover:bg-slate-50 transition-colors">Cancelar</button>
              <button type="submit" className="bg-[#42A873] text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1 hover:bg-[#399665] transition-all"><Save className="w-3.5 h-3.5" /> Registrar</button>
            </div>
          </form>
        ) : novSel ? (
          /* EXPEDIENTE DETALLADO */
          <div className="flex flex-col gap-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Expediente</span>
                <h4 className="font-bold text-slate-800 text-sm truncate uppercase mt-0.5 tracking-tight">{novSel.tipo}</h4>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5 font-medium">ID: {novSel.id_incidencia}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shadow-md shrink-0 ${getColorTipo(novSel.tipo)}`}>
                {getIconoTipo(novSel.tipo)}
              </div>
            </div>

            <div className="bg-slate-50/50 p-4 rounded-xl space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Colaborador</p>
                  <p className="text-xs font-bold text-slate-700 uppercase mt-1">{empAsociado?.nombre || "No asignado"}</p>
                  <p className="text-[10px] text-slate-500">ID: {novSel.id_reloj}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sucursal</p>
                  <p className="text-xs font-semibold text-slate-600 mt-1">{empAsociado?.sucursal_principal || "—"}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50/50 p-3 rounded-xl">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Fecha Inicio</p>
                <p className="text-xs font-mono font-semibold text-slate-700 mt-1">{formatDate(novSel.fecha_inicio)}</p>
              </div>
              <div className="bg-slate-50/50 p-3 rounded-xl">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Fecha Fin</p>
                <p className="text-xs font-mono font-semibold text-slate-700 mt-1">{novSel.fecha_fin ? formatDate(novSel.fecha_fin) : "Indefinido"}</p>
              </div>
            </div>

            <div className="bg-slate-50/50 p-3 rounded-xl">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Registro</p>
              <p className="text-[10px] font-mono text-slate-600 mt-1">{formatDateTime(novSel.fecha_registro)}</p>
              <p className="text-[9px] text-slate-400 mt-0.5">Creado por: {novSel.creado_por || USUARIO_ACTUAL}</p>
              {novSel.modificado_por && <p className="text-[9px] text-slate-400">Modificado por: {novSel.modificado_por}</p>}
            </div>

            {(() => {
              const imp = analizarImpactoIncidencia(novSel.id_reloj, novSel.tipo, novSel.cantidad_dias || 1, novSel.monto || 0, novSel.cuotas || 1, novSel.tiene_cobertura || false);
              return (
                <div className={`border rounded-xl p-4 ${imp.montoDescuento > 0 ? 'border-rose-200 bg-rose-50/30' : 'border-emerald-200 bg-emerald-50/30'}`}>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Impacto Económico</p>
                  {imp.montoDescuento > 0 ? (
                    <>
                      <p className="text-lg font-black font-mono text-rose-600 mt-1">-{formatMonto(imp.montoDescuento)}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{imp.subLabel}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{imp.porcentajeQuincenal.toFixed(1)}% del salario quincenal</p>
                    </>
                  ) : (
                    <p className="text-sm font-semibold text-emerald-600 mt-1">Sin deducción</p>
                  )}
                  {novSel.monto && novSel.monto > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[10px]">
                      <div><span className="text-slate-400">Monto total:</span> <span className="font-bold">{formatMonto(novSel.monto)}</span></div>
                      <div><span className="text-slate-400">Cuotas:</span> <span className="font-bold">{novSel.cuotas || 1}</span></div>
                    </div>
                  )}
                </div>
              );
            })()}

            {novSel.observaciones && novSel.observaciones !== "Registro sin observaciones adicionales" && (
              <div className="bg-slate-50/50 p-3 rounded-xl">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Notas</p>
                <p className="text-[10px] text-slate-600 italic mt-1">{novSel.observaciones}</p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100">
              {!isEditing ? (
                <button type="button" onClick={() => setIsEditing(true)} className="w-full border border-slate-200 text-slate-600 bg-slate-50/40 hover:bg-slate-50 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all">
                  <Pencil className="w-3.5 h-3.5 text-slate-400" /> Modificar Registro
                </button>
              ) : (
                <div className="flex gap-2.5 w-full">
                  <button type="button" onClick={() => setIsEditing(false)} className="border border-slate-200 text-slate-400 py-2.5 rounded-xl flex-1 text-center font-semibold hover:bg-slate-50 transition-colors">Cancelar</button>
                  <button type="button" onClick={handleEjecutarModificacionFicha} className="bg-[#2B4C5E] text-white py-2.5 rounded-xl flex-1 flex items-center justify-center gap-1.5 font-bold hover:bg-[#1E3542] transition-all"><Save className="w-3.5 h-3.5" /> Guardar</button>
                </div>
              )}
            </div>

            <button type="button" onClick={() => handleEliminarConConfirmacion(novSel.id_incidencia)} className="w-full border border-red-200 text-red-600 bg-red-50/40 hover:bg-red-50 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all mt-2">
              <Trash2 className="w-3.5 h-3.5" /> Eliminar Registro
            </button>
          </div>
        ) : (
          <div className="text-center italic text-slate-400 py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <ClipboardList className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            Seleccione una incidencia de la tabla para ver los detalles.
          </div>
        )}
      </div>
    </div>
  );
}