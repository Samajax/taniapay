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
    // Primera quincena: termina el día 15
    fechaFin = new Date(anio, mes, 15);
  } else {
    // Segunda quincena: termina el último día del mes
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
    // Avanzar a la siguiente quincena
    const dia = fecha.getDate();
    const mes = fecha.getMonth();
    const anio = fecha.getFullYear();
    
    if (dia === 15) {
      // Estamos en fin de primera quincena, pasar a fin de segunda quincena del mismo mes
      fecha = new Date(anio, mes + 1, 0);
    } else {
      // Estamos en fin de segunda quincena, pasar a fin de primera quincena del próximo mes
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

    // Para CXC: la fecha de inicio es la quincena actual
    // y la fecha de fin se calcula según el número de cuotas
    if (nuevo.tipo === "Cuentas por Cobrar (CXC)") {
      // La fecha de inicio es el inicio de la quincena actual
      fechaInicio = obtenerInicioQuincenaActual(fechaSistema);
      // La fecha de fin se calcula desde la fecha de inicio según las cuotas
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

    const creada: Incidencia = {
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
      window.location.reload(); 
    }
  };

  const handleEliminarConConfirmacion = (id: string) => {
    if (!confirm("⚠️ ¿Eliminar este registro permanentemente?\n\nEsta acción no se puede deshacer.")) return;
    eliminarIncidencia(id); 
    setSelectedId("");
  };

  const cardClasses = "bg-white border border-slate-100 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)]";

  const infoPreviaAlta = useMemo(() => {
    const mDias = ["Licencias médicas", "Maternidad", "Permiso", "Falta", "Vacaciones"].includes(nuevo.tipo) ? (parseInt(nuevo.cantidad_dias, 10) || 1) : 1;
    const mMonto = ["Cuentas por Cobrar (CXC)", "Vales / Faltantes de caja", "Tardanza"].includes(nuevo.tipo) ? (parseFloat(nuevo.monto) || 0) : 0;
    const mCuotas = nuevo.tipo === "Vales / Faltantes de caja" ? 1 : (parseInt(nuevo.cuotas, 10) || 1);
    return analizarImpactoIncidencia(nuevo.id_reloj, nuevo.tipo, mDias, mMonto, mCuotas, nuevo.tiene_cobertura);
  }, [nuevo, empleados]);

  return (
    <div className="flex gap-3 bg-gradient-to-br from-slate-50 to-slate-100/50 p-5 rounded-3xl min-h-screen w-full font-sans overflow-hidden">
      
      {/* PANEL PRINCIPAL */}
      <div className="flex-1 flex flex-col gap-5 min-w-0">
    
        {/* ENCABEZADO */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Gestión de Incidencias</h1>
            <p className="text-xs text-slate-400 mt-0.5">Administración de permisos, licencias y ajustes de nómina</p>
          </div>
          <button 
            type="button" 
            onClick={() => { setShowAltaForm(!showAltaForm); setIsEditing(false); setSelectedId(""); }} 
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm ${
              showAltaForm 
                ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100" 
                : "bg-slate-800 text-white hover:bg-slate-900 hover:shadow-md"
            }`}
          >
            {showAltaForm ? <><X className="w-4 h-4" /> Cancelar</> : <><Plus className="w-4 h-4" /> Nueva incidencia</>}
          </button>
        </div>

        {/* TARJETAS DE MÉTRICAS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`${cardClasses} p-4 border-l-4 border-emerald-500`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Licencias activas</p>
                <p className="text-2xl font-black text-slate-800 mt-1">{metricasAdministrador.licenciasActivas}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Médicas / Maternidad</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <UserX className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </div>

          <div className={`${cardClasses} p-4 border-l-4 border-teal-500`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vacaciones</p>
                <p className="text-2xl font-black text-slate-800 mt-1">{metricasAdministrador.vacacionesActivas}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Colaboradores de vacaciones</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-teal-500" />
              </div>
            </div>
          </div>

          <div className={`${cardClasses} p-4 border-l-4 border-amber-500`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Permisos activos</p>
                <p className="text-2xl font-black text-slate-800 mt-1">{metricasAdministrador.permisosActivos}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Sin cobertura de turno</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </div>

          <div className={`${cardClasses} p-4 border-l-4 ${metricasAdministrador.descuentosAcumulados > 0 ? 'border-red-500' : 'border-slate-300'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descuentos aplicados</p>
                <p className={`text-xl font-black font-mono mt-1 ${metricasAdministrador.descuentosAcumulados > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                  {formatMonto(metricasAdministrador.descuentosAcumulados)}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Total quincena actual</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${metricasAdministrador.descuentosAcumulados > 0 ? 'bg-red-50' : 'bg-slate-50'} flex items-center justify-center`}>
                <DollarSign className={`w-5 h-5 ${metricasAdministrador.descuentosAcumulados > 0 ? 'text-red-500' : 'text-slate-400'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* FILTROS */}
        <div className={`${cardClasses} p-3 flex items-center gap-3 flex-wrap shadow-sm`}>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o ID..." className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-slate-300 transition-all text-slate-700" />
          </div>
          
          <div className="relative">
            <FileText className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none cursor-pointer hover:bg-white transition-all appearance-none">
              <option value="Todos">Todos los conceptos</option>
              <option value="Permiso">Permisos</option>
              <option value="Licencias médicas">Licencias médicas</option>
              <option value="Maternidad">Maternidad</option>
              <option value="Cuentas por Cobrar (CXC)">Cuentas por Cobrar</option>
              <option value="Vales / Faltantes de caja">Vales / Faltantes</option>
              <option value="Falta">Faltas</option>
              <option value="Tardanza">Tardanzas</option>
              <option value="Vacaciones">Vacaciones</option>
            </select>
          </div>

          <div className="relative">
            <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <select value={filterSucursal} onChange={e => setFilterSucursal(e.target.value)} className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none cursor-pointer hover:bg-white transition-all appearance-none">
              <option value="Todos">Todas las sucursales</option>
              {SUCURSALES_DISPONIBLES?.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* TABLA DE INCIDENCIAS */}
        <div className={`${cardClasses} overflow-hidden shadow-sm`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider w-64">Colaborador</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider w-40">Sucursal</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider w-44">Concepto</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider w-24 text-center">Plazo</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider w-56">Impacto económico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredNovedades.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <ClipboardList className="w-12 h-12 text-slate-300" />
                        <p className="text-slate-400 font-medium">No hay incidencias registradas</p>
                        <p className="text-xs text-slate-300">Ajusta los filtros o crea una nueva incidencia</p>
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
                        className={`cursor-pointer transition-all duration-150 hover:bg-slate-50/50 ${isSelected ? "bg-emerald-50/40 border-l-4 border-emerald-500" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-800 uppercase">{emp?.nombre || "No asignado"}</div>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">ID: {n.id_reloj}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-600 font-medium">{emp?.sucursal_principal || "—"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${colorTipo}`}>
                            {iconoTipo}
                            {n.tipo}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-mono font-bold text-slate-700">
                            {n.tipo === "Cuentas por Cobrar (CXC)" ? `${n.cuotas || 1} cuota(s)` : `${n.cantidad_dias || 1} día(s)`}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {n.tipo === "Permiso" && n.tiene_cobertura ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                              <span className="text-emerald-700 font-medium text-xs">Cubierto por {empCubreLocal?.nombre?.split(' ')[0] || n.id_reloj_cubre}</span>
                            </div>
                          ) : imp.montoDescuento > 0 ? (
                            <div>
                              <span className="text-red-600 font-mono font-bold">-{formatMonto(imp.montoDescuento)}</span>
                              <p className="text-[10px] text-slate-400 mt-0.5">{imp.subLabel}</p>
                            </div>
                          ) : (
                            <div>
                              <span className="text-emerald-600 font-medium text-xs">{imp.label}</span>
                              <p className="text-[10px] text-slate-400 mt-0.5">{imp.subLabel}</p>
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

      {/* RESIZE HANDLE */}
      <div onMouseDown={startResizing} className="w-1.5 bg-slate-200/50 hover:bg-slate-300 transition-all cursor-col-resize self-stretch shrink-0 mx-0.5 rounded-full" />

      {/* PANEL LATERAL - EXPEDIENTE DETALLADO */}
      <div style={{ width: `${panelWidth}px` }} className="bg-white rounded-2xl shadow-xl sticky top-5 max-h-[calc(100vh-2rem)] overflow-y-auto shrink-0 flex flex-col border border-slate-100">
        {showAltaForm ? (
          /* FORMULARIO DE ALTA */
          <div className="p-6">
            <div className="flex items-center gap-3 pb-5 mb-2 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Plus className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Nueva incidencia</h3>
                <p className="text-xs text-slate-400 mt-0.5">Registrar evento en la nómina</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Selección de colaborador */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Colaborador</label>
                <select 
                  value={nuevo.id_reloj} 
                  onChange={e => setNuevo({...nuevo, id_reloj: e.target.value})} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 cursor-pointer outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
                >
                  {empleados.map(emp => (
                    <option key={emp.id_reloj} value={emp.id_reloj}>
                      {emp.nombre.toUpperCase()} — {emp.cargo} (ID: {emp.id_reloj})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de incidencia */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de incidencia</label>
                <select 
                  value={nuevo.tipo} 
                  onChange={e => setNuevo({...nuevo, tipo: e.target.value as any, monto: "0", cuotas: "1", cantidad_dias: "1", tiene_cobertura: false, id_reloj_cubre: "Ninguno"})} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 cursor-pointer outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
                >
                  <option value="Permiso">📋 Permiso</option>
                  <option value="Licencias médicas">🏥 Licencia médica</option>
                  <option value="Maternidad">👶 Maternidad</option>
                  <option value="Cuentas por Cobrar (CXC)">💰 Cuentas por Cobrar (CXC)</option>
                  <option value="Vales / Faltantes de caja">💸 Vales / Faltantes de caja</option>
                  <option value="Falta">❌ Falta</option>
                  <option value="Tardanza">⏰ Tardanza</option>
                  <option value="Vacaciones">🏖️ Vacaciones</option>
                </select>
              </div>

              {/* Fecha de inicio - Solo visible para tipos que no son CXC */}
              {nuevo.tipo !== "Cuentas por Cobrar (CXC)" && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Fecha de inicio
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input 
                      type="date" 
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all text-slate-700" 
                      value={nuevo.fecha_inicio} 
                      onChange={e => setNuevo({...nuevo, fecha_inicio: e.target.value})} 
                    />
                  </div>
                </div>
              )}
          
              {/* Para CXC, mostrar información de la quincena calculada */}
              {nuevo.tipo === "Cuentas por Cobrar (CXC)" && (
                <div className="bg-blue-50/30 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Programación automática</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-slate-600">Fecha de primera cuota:</span>{' '}
                      <span className="font-bold text-slate-800">{formatDate(obtenerFinQuincenaActual(fechaSistema))}</span>
                    </p>
                    {parseInt(nuevo.cuotas) > 1 && (
                      <p>
                        <span className="text-slate-600">Fecha de última cuota:</span>{' '}
                        <span className="font-bold text-slate-800">
                          {formatDate(calcularFechaFinCXC(obtenerFinQuincenaActual(fechaSistema), parseInt(nuevo.cuotas)))}
                        </span>
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-blue-100">
                      El sistema calculará automáticamente las fechas según el número de cuotas seleccionado.
                    </p>
                  </div>
                </div>
              )}

              {/* Configuración por tipo */}
              {nuevo.tipo === "Permiso" && (
                <div className="bg-indigo-50/30 rounded-xl p-4 space-y-3 border border-indigo-100">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-indigo-300 accent-indigo-600" 
                      checked={nuevo.tiene_cobertura} 
                      onChange={e => setNuevo({...nuevo, tiene_cobertura: e.target.checked, id_reloj_cubre: "Ninguno"})} 
                    />
                    <span className="text-sm font-medium text-indigo-900">Turno será cubierto por otro colaborador</span>
                  </label>
                  {nuevo.tiene_cobertura && (
                    <select 
                      value={nuevo.id_reloj_cubre} 
                      onChange={e => setNuevo({...nuevo, id_reloj_cubre: e.target.value})} 
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm outline-none cursor-pointer"
                    >
                      <option value="Ninguno">— Seleccionar reemplazo —</option>
                      {empleados.filter(em => em.id_reloj !== nuevo.id_reloj).map(emp => (
                        <option key={emp.id_reloj} value={emp.id_reloj}>{emp.nombre}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Días o montos según tipo */}
              {["Licencias médicas", "Maternidad", "Permiso", "Falta", "Vacaciones"].includes(nuevo.tipo) ? (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cantidad de días</label>
                  <input 
                    type="number" 
                    min="1" 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all" 
                    value={nuevo.cantidad_dias} 
                    onChange={e => setNuevo({...nuevo, cantidad_dias: e.target.value})} 
                  />
                </div>
              ) : nuevo.tipo === "Cuentas por Cobrar (CXC)" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Monto total (RD$)</label>
                    <input 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all" 
                      value={nuevo.monto} 
                      onChange={e => setNuevo({...nuevo, monto: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Número de cuotas</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="24"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all" 
                      value={nuevo.cuotas} 
                      onChange={e => setNuevo({...nuevo, cuotas: e.target.value})} 
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Monto (RD$)</label>
                    <input 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all" 
                      value={nuevo.monto} 
                      onChange={e => setNuevo({...nuevo, monto: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cuotas</label>
                    <input 
                      type="number" 
                      min="1" 
                      disabled={nuevo.tipo === "Vales / Faltantes de caja" || nuevo.tipo === "Tardanza"} 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all" 
                      value={nuevo.tipo === "Vales / Faltantes de caja" || nuevo.tipo === "Tardanza" ? "1" : nuevo.cuotas} 
                      onChange={e => setNuevo({...nuevo, cuotas: e.target.value})} 
                    />
                  </div>
                </div>
              )}

              {/* Vista previa del impacto */}
              {infoPreviaAlta.montoDescuento > 0 && (
                <div className={`p-4 rounded-xl ${infoPreviaAlta.porcentajeQuincenal > 60 ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Impacto estimado</span>
                    {infoPreviaAlta.porcentajeQuincenal > 60 && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-red-600">
                        <AlertTriangle className="w-3 h-3" /> Excede límite 60%
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-slate-600">Deducción por cuota:</span>
                    <span className="text-xl font-black font-mono text-red-600">-{formatMonto(infoPreviaAlta.montoDescuento)}</span>
                  </div>
                  {nuevo.tipo === "Cuentas por Cobrar (CXC)" && (
                    <>
                      <div className="flex justify-between items-baseline mt-1">
                        <span className="text-xs text-slate-500">Monto total:</span>
                        <span className="text-sm font-bold text-slate-700">{formatMonto(parseFloat(nuevo.monto) || 0)}</span>
                      </div>
                      <div className="flex justify-between items-baseline mt-1">
                        <span className="text-xs text-slate-500">Número de cuotas:</span>
                        <span className="text-sm font-bold text-slate-700">{parseInt(nuevo.cuotas) || 1}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                        📅 El sistema calculará automáticamente las fechas de cada cuota quincenal
                      </p>
                    </>
                  )}
                  <div className="flex justify-between items-baseline mt-1">
                    <span className="text-xs text-slate-500">Porcentaje del salario:</span>
                    <span className="text-sm font-bold text-slate-700">{infoPreviaAlta.porcentajeQuincenal.toFixed(1)}%</span>
                  </div>
                </div>
              )}

              {/* Comentarios */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Comentarios / notas</label>
                <textarea 
                  rows={3} 
                  placeholder="Detalles administrativos, justificaciones, etc." 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all resize-none" 
                  value={nuevo.comentario} 
                  onChange={e => setNuevo({...nuevo, comentario: e.target.value})} 
                />
              </div>

              {/* Botones de acción */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAltaForm(false)} 
                  className="border border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  onClick={handleGuardarNuevaIncidencia} 
                  className="bg-slate-800 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-slate-900 transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Registrar
                </button>
              </div>
            </div>
          </div>

        ) : novSel ? (
          /* PANEL DE DETALLE */
          <div className="p-6">
            {/* Encabezado */}
            <div className="flex items-start justify-between pb-5 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getColorTipo(novSel.tipo)}`}>
                  {getIconoTipo(novSel.tipo)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getColorTipo(novSel.tipo)}`}>
                      {novSel.tipo}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">ID: {novSel.id_incidencia}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg mt-1">{empAsociado?.nombre || "Colaborador no encontrado"}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{empAsociado?.cargo || "Sin cargo"} • {empAsociado?.sucursal_principal || "Sin sucursal"}</p>
                </div>
              </div>
            </div>

            {/* Información general */}
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50/50 rounded-xl">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha de inicio</p>
                  <p className="text-sm font-mono font-semibold text-slate-700">{formatDate(novSel.fecha_inicio)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha de fin</p>
                  <p className="text-sm font-mono font-semibold text-slate-700">{novSel.fecha_fin ? formatDate(novSel.fecha_fin) : "Indefinido"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha de registro</p>
                  <p className="text-sm font-mono text-slate-600">{formatDateTime(novSel.fecha_registro)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Estado</p>
                  <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Activo
                  </p>
                </div>
              </div>

              {/* Auditoría - Quién creó/modificó */}
              <div className="p-4 bg-slate-50/30 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <History className="w-4 h-4 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Auditoría del registro</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-slate-400">Creado por</p>
                    <p className="font-semibold text-slate-700 flex items-center gap-1">
                      <UserPlus className="w-3 h-3" /> {novSel.creado_por || USUARIO_ACTUAL}
                    </p>
                    <p className="text-[10px] text-slate-400">{novSel.creado_en ? formatDateTime(novSel.creado_en) : formatDateTime(novSel.fecha_registro)}</p>
                  </div>
                  {novSel.modificado_por && (
                    <div>
                      <p className="text-slate-400">Modificado por</p>
                      <p className="font-semibold text-slate-700 flex items-center gap-1">
                        <Pencil className="w-3 h-3" /> {novSel.modificado_por}
                      </p>
                      <p className="text-[10px] text-slate-400">{formatDateTime(novSel.modificado_en || "")}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Detalle específico según tipo */}
              {(() => {
                const imp = analizarImpactoIncidencia(
                  novSel.id_reloj, 
                  novSel.tipo, 
                  novSel.cantidad_dias || 1, 
                  novSel.monto || 0, 
                  novSel.cuotas || 1, 
                  novSel.tiene_cobertura || false
                );
                const esFinanciero = ["Cuentas por Cobrar (CXC)", "Vales / Faltantes de caja", "Tardanza"].includes(novSel.tipo);
                
                return (
                  <div className="space-y-4">
                    {/* Impacto económico */}
                    <div className={`p-5 rounded-xl border-2 ${imp.montoDescuento > 0 ? 'border-red-100 bg-gradient-to-br from-red-50/30 to-white' : 'border-emerald-100 bg-gradient-to-br from-emerald-50/30 to-white'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Impacto económico</span>
                        {imp.porcentajeQuincenal > 60 && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" /> Límite excedido
                          </span>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-sm text-slate-600">{imp.label}:</span>
                        {imp.montoDescuento > 0 ? (
                          <span className="text-2xl font-black font-mono text-red-600">-{formatMonto(imp.montoDescuento)}</span>
                        ) : (
                          <span className="text-lg font-semibold text-emerald-600">Sin deducción</span>
                        )}
                      </div>
                      
                      {imp.subLabel && (
                        <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">{imp.subLabel}</p>
                      )}
                      
                      {esFinanciero && novSel.monto && novSel.monto > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 block">Monto total</span>
                            <span className="font-bold text-slate-700">{formatMonto(novSel.monto)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Cuotas</span>
                            <span className="font-bold text-slate-700">{novSel.cuotas || 1}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Mostrar información de quincena para CXC */}
                      {novSel.tipo === "Cuentas por Cobrar (CXC)" && novSel.fecha_inicio && novSel.fecha_fin && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-2 text-xs">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span className="text-slate-600">Período de aplicación:</span>
                            <span className="font-bold text-slate-800">
                              {formatDate(novSel.fecha_inicio)} al {formatDate(novSel.fecha_fin)}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {novSel.tipo === "Permiso" && novSel.tiene_cobertura && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-2 text-xs">
                            <UserCheck className="w-4 h-4 text-emerald-500" />
                            <span className="text-slate-600">Cubierto por:</span>
                            <span className="font-bold text-slate-800">{empCubre?.nombre || novSel.id_reloj_cubre}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Observaciones */}
                    {novSel.observaciones && novSel.observaciones !== "Registro sin observaciones adicionales" && (
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notas administrativas</span>
                        </div>
                        <p className="text-sm text-slate-600 italic leading-relaxed">"{novSel.observaciones}"</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Botones de acción */}
            <div className="pt-6 mt-4 border-t border-slate-100">
              {!isEditing ? (
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsEditing(true)} 
                    className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-all"
                  >
                    <Pencil className="w-4 h-4" /> Editar
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleEliminarConConfirmacion(novSel.id_incidencia)} 
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 font-semibold rounded-xl text-sm hover:bg-red-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" /> Eliminar
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsEditing(false)} 
                    className="px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button" 
                    onClick={handleEjecutarModificacionFicha} 
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 text-white font-bold rounded-xl text-sm hover:bg-slate-900 transition-all"
                  >
                    <Save className="w-4 h-4" /> Guardar cambios
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Estado vacío */
          <div className="flex flex-col items-center justify-center h-full min-h-[500px] p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <ClipboardList className="w-10 h-10 text-slate-300" />
            </div>
            <h4 className="font-bold text-slate-700 text-lg mb-1">Ninguna incidencia seleccionada</h4>
            <p className="text-sm text-slate-400 max-w-[240px]">
              Haz clic en una fila de la tabla para ver los detalles completos del registro.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}