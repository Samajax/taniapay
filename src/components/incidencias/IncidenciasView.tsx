"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
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
  TrendingDown, 
  ShieldAlert,
  CheckCircle,
  Trash2,
  AlertTriangle,
  UserPlus
} from "lucide-react";

interface NovedadIncidencia {
  id: string;
  id_reloj: string;
  tipo: 
    | "Permiso"
    | "Licencias médicas"
    | "Maternidad"
    | "Cuentas por Cobrar (CXC)" 
    | "Vales / Faltantes de caja"
    | "Vacaciones"; // Mantenido exclusivamente para la pestaña de Vacaciones de ley
  fecha_inicio: string;
  cantidad_dias?: number;
  tiene_cobertura?: boolean;
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

const obtenerDiasVacacionesPorLey = (fechaInicioContratoStr?: string): number => {
  if (!fechaInicioContratoStr) return 14;
  const inicio = new Date(fechaInicioContratoStr + "T00:00:00");
  const hoy = new Date();
  let anios = hoy.getFullYear() - inicio.getFullYear();
  const mes = hoy.getMonth() - inicio.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < inicio.getDate())) {
    anios--;
  }
  return anios > 5 ? 18 : 14;
};

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

  // --- CONTROL DE ANCHO AJUSTABLE ---
  const [panelWidth, setPanelWidth] = useState(440); 
  const isResizing = useRef(false);

  const startResizing = React.useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    isResizing.current = true;
  }, []);

  const stopResizing = React.useCallback(() => {
    isResizing.current = false;
  }, []);

  const resize = React.useCallback((mouseMoveEvent: MouseEvent) => {
    if (!isResizing.current) return;
    const nextWidth = window.innerWidth - mouseMoveEvent.clientX - 32; 
    if (nextWidth > 360 && nextWidth < 750) {
      setPanelWidth(nextWidth);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  const [nuevo, setNuevo] = useState({
    id_reloj: "12", 
    tipo: "Permiso" as NovedadIncidencia["tipo"],
    fecha_inicio: fechaSistema || "2026-05-21",
    cantidad_dias: "1",
    tiene_cobertura: false,
    id_reloj_cubre: "Ninguno",
    monto: "0",
    cuotas: "1",
    comentario: ""
  });

  const [formFicha, setFormFicha] = useState<Partial<NovedadIncidencia>>({});
  
  const novSel = useMemo(() => incidencias.find((n) => n.id === selectedId), [incidencias, selectedId]);
  const empAsociado = novSel ? empleados.find(e => e.id_reloj === novSel.id_reloj) : null;

  useEffect(() => {
    if (activeTab === "vacaciones") {
      const colab = empleados.find(e => e.id_reloj === nuevo.id_reloj);
      if (colab) {
        const diasDerecho = obtenerDiasVacacionesPorLey(colab.fecha_inicio_contrato);
        setNuevo(prev => ({ ...prev, cantidad_dias: String(diasDerecho) }));
      }
    }
  }, [nuevo.id_reloj, activeTab, empleados]);

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

  // 🧮 LÓGICA DE NEGOCIO Y CÁLCULO DE INCIDENCIAS
  const analizarImpactoIncidencia = (idReloj: string, tipo: NovedadIncidencia["tipo"], dias: number = 1, montoTotal: number = 0, cuotas: number = 1, tieneCobertura: boolean = false) => {
    const empleado = empleados.find(e => e.id_reloj === idReloj);
    const sueldoBaseEmpleado = empleado ? Number(empleado.sueldo_base) : 27489.60;
    const valorDiaDinamico = sueldoBaseEmpleado / 23.83;

    switch (tipo) {
      case "Permiso":
        if (tieneCobertura) {
          return { afectaTSS: false, descuentaSalario: false, montoDescuento: 0, label: "Permiso Cubierto: No aplica descuento de salario" };
        } else {
          return { afectaTSS: true, descuentaSalario: true, montoDescuento: dias * valorDiaDinamico, label: `Permiso no cubierto: Descuento de ${dias} día(s) basado en salario` };
        }
      case "Vales / Faltantes de caja":
        return { afectaTSS: false, descuentaSalario: true, montoDescuento: montoTotal, label: "Descuento total e inmediato en la misma quincena" };
      case "Cuentas por Cobrar (CXC)":
        const calculoCuota = cuotas > 0 ? (montoTotal / cuotas) : montoTotal;
        return { afectaTSS: false, descuentaSalario: true, montoDescuento: calculoCuota, label: `Cuota quincenal fija amortizada en ${cuotas} pagos` };
      case "Vacaciones":
        return { afectaTSS: false, descuentaSalario: true, montoDescuento: dias * valorDiaDinamico, label: "Adelanto financiero por vacaciones liquidadas" };
      case "Licencias médicas":
        return { afectaTSS: false, descuentaSalario: false, montoDescuento: 0, label: "Licencia Médica Aprobada: Sueldo base protegido por SISALRIL" };
      case "Maternidad":
        return { afectaTSS: false, descuentaSalario: false, montoDescuento: 0, label: "Licencia de Parto: Sueldo íntegro (Sisalril reembolsa a empresa)" };
      default:
        return { afectaTSS: false, descuentaSalario: false, montoDescuento: 0, label: "Exención Contable Regular" };
    }
  };

  const resumenes = useMemo(() => {
    let vacs = 0, asistencias = 0, totalCXC = 0, totalFaltantes = 0;
    incidencias.forEach(n => {
      const montoNum = Number(n.monto) || 0;
      if (n.tipo === "Vacaciones") vacs++;
      else if (["Permiso", "Licencias médicas", "Maternidad"].includes(n.tipo)) asistencias++;
      else if (n.tipo === "Cuentas por Cobrar (CXC)") totalCXC += montoNum;
      else if (n.tipo === "Vales / Faltantes de caja") totalFaltantes += montoNum;
    });
    return { vacs, asistencias, totalCXC, totalFaltantes };
  }, [incidencias]);

  const ejecutarAlta = (e: React.FormEvent) => {
    e.preventDefault();
    const tipoFinal = activeTab === "vacaciones" ? "Vacaciones" : nuevo.tipo;

    if (tipoFinal === "Permiso" && nuevo.tiene_cobertura && nuevo.id_reloj_cubre === "Ninguno") {
      return alert("❌ Error: Si el permiso es cubierto, debe seleccionar el colaborador de reemplazo.");
    }

    const creada: NovedadIncidencia = {
      id: `NOV-${Math.floor(100 + Math.random() * 900)}`,
      id_reloj: nuevo.id_reloj,
      tipo: tipoFinal,
      fecha_inicio: nuevo.fecha_inicio,
      cantidad_dias: ["Vacaciones", "Licencias médicas", "Maternidad", "Permiso"].includes(tipoFinal) ? parseInt(nuevo.cantidad_dias, 10) : undefined,
      tiene_cobertura: tipoFinal === "Permiso" ? nuevo.tiene_cobertura : undefined,
      id_reloj_cubre: (tipoFinal === "Permiso" && nuevo.tiene_cobertura) ? nuevo.id_reloj_cubre : undefined,
      monto: ["Cuentas por Cobrar (CXC)", "Vales / Faltantes de caja"].includes(tipoFinal) ? parseFloat(nuevo.monto) : undefined,
      cuotas: tipoFinal === "Cuentas por Cobrar (CXC)" ? parseInt(nuevo.cuotas, 10) : undefined,
      comentario: nuevo.comentario.trim() || "Sin observaciones administrativas",
      estado: "Pendiente Aplicación"
    };

    if (setIncidencias) {
      setIncidencias([creada, ...incidencias]);
      setSelectedId(creada.id);
      setShowAltaForm(false);
      alert("✅ Registro de incidencia guardado.");
    }
  };

  const guardarFicha = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedId && setIncidencias) {
      const fichaFormateada = {
        ...formFicha,
        cantidad_dias: formFicha.cantidad_dias ? parseInt(String(formFicha.cantidad_dias), 10) : undefined,
        monto: formFicha.monto ? parseFloat(String(formFicha.monto)) : undefined,
        cuotas: formFicha.cuotas ? parseInt(String(formFicha.cuotas), 10) : undefined,
        tiene_cobertura: formFicha.tipo === "Permiso" ? formFicha.tiene_cobertura : undefined,
        id_reloj_cubre: (formFicha.tipo === "Permiso" && formFicha.tiene_cobertura) ? formFicha.id_reloj_cubre : undefined,
      };

      const loteActualizado = incidencias.map(n => n.id === selectedId ? { ...n, ...fichaFormateada } as NovedadIncidencia : n);
      setIncidencias(loteActualizado);
      setIsEditing(false);
      alert("✅ Cambios modificados con éxito.");
    }
  };

  const cambiarEstadoRapido = (id: string, nuevoEstado: "Procesado" | "Pendiente Aplicación") => {
    if (!setIncidencias) return;
    const loteActualizado = incidencias.map(n => n.id === id ? { ...n, estado: nuevoEstado } as NovedadIncidencia : n);
    setIncidencias(loteActualizado);
  };

  const eliminarIncidenciaRapido = (id: string) => {
    if (!setIncidencias || !confirm("¿Desea eliminar esta incidencia?")) return;
    const loteFiltrado = incidencias.filter(n => n.id !== id);
    setIncidencias(loteFiltrado);
    setSelectedId("");
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

  const cardClasses = "bg-white border border-slate-100/80 rounded-2xl shadow-[0_4px_20px_rgba(241,245,249,0.6)]";
  const inputClasses = "w-full pl-9 pr-3.5 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-xs outline-none focus:bg-white focus:border-emerald-500/80 focus:ring-4 focus:ring-emerald-500/5 transition-all text-slate-700";
  const selectClasses = "w-full pl-9 pr-8 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-xs font-medium outline-none cursor-pointer focus:bg-white focus:border-emerald-500/80 transition-all text-slate-700 appearance-none";

  return (
    <div className="flex gap-1 text-slate-700 bg-[#F8FAFC] p-4 rounded-3xl min-h-screen w-full select-none overflow-hidden font-sans">
      
      {/* CUERPO IZQUIERDO */}
      <div className="flex-1 flex flex-col gap-6 min-w-0 pr-2">
        
        {/* INDICADORES */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`${cardClasses} p-5 flex items-center justify-between`}>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Vacaciones Activas</span>
              <span className="text-xl font-bold text-slate-800 tracking-tight mt-1 block">{resumenes.vacs} Colabs.</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50"><Palmtree className="w-4 h-4" /></div>
          </div>
          
          <div className={`${cardClasses} p-5 flex items-center justify-between`}>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Novedades Operativas</span>
              <span className="text-xl font-bold text-slate-700 tracking-tight mt-1 block">{resumenes.asistencias} Regs.</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center border border-slate-100"><UserCheck className="w-4 h-4" /></div>
          </div>

          <div className={`${cardClasses} p-5 flex items-center justify-between`}>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Vales / Faltantes quincena</span>
              <span className="text-sm font-bold text-slate-700 font-mono mt-2 block">{formatMonto(resumenes.totalFaltantes)}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center border border-slate-100"><Receipt className="w-4 h-4" /></div>
          </div>

          <div className="bg-[#2B4C5E] rounded-2xl p-5 flex items-center justify-between shadow-md relative overflow-hidden">
            <div>
              <span className="text-[10px] font-bold text-slate-300/80 uppercase tracking-widest block">Balance General CXC</span>
              <span className="text-sm font-bold text-white font-mono mt-2 block">{formatMonto(resumenes.totalCXC)}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 text-emerald-400 flex items-center justify-center"><DollarSign className="w-4 h-4" /></div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex border-b border-slate-200 gap-2">
          <button 
            type="button" onClick={() => { setActiveTab("general"); setFilterTipo("Todos"); }}
            className={`px-5 py-3 font-bold text-xs transition-all border-b-2 -mb-px flex items-center gap-2 ${activeTab === "general" ? "border-[#42A873] text-[#2B4C5E]" : "border-transparent text-slate-400 hover:text-slate-700"}`}
          >
            <Clock className="w-4 h-4" /> Registro de Incidencias Operativas
          </button>
          <button 
            type="button" onClick={() => { setActiveTab("vacaciones"); setFilterTipo("Vacaciones"); }}
            className={`px-5 py-3 font-bold text-xs transition-all border-b-2 -mb-px flex items-center gap-2 ${activeTab === "vacaciones" ? "border-[#42A873] text-[#2B4C5E]" : "border-transparent text-slate-400 hover:text-slate-700"}`}
          >
            <Palmtree className="w-4 h-4" /> Módulo Vacaciones (Lunes a Sábado)
          </button>
        </div>

        {/* FILTROS */}
        <div className={`${cardClasses} p-4 flex flex-col gap-3 bg-white`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 w-full items-center">
            <div className="relative w-full">
              <span className="absolute left-3 top-3 text-slate-400"><Search className="w-4 h-4" /></span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar colaborador..." className={inputClasses} />
            </div>

            {activeTab === "general" ? (
              <div className="relative w-full">
                <span className="absolute left-3 top-3 text-slate-400"><FileSpreadsheet className="w-4 h-4" /></span>
                <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} className={selectClasses}>
                  <option value="Todos">Todos los conceptos</option>
                  <option value="Permiso">Permisos</option>
                  <option value="Licencias médicas">Licencias médicas</option>
                  <option value="Maternidad">Maternidad</option>
                  <option value="Cuentas por Cobrar (CXC)">Cuentas por Cobrar (CXC)</option>
                  <option value="Vales / Faltantes de caja">Vales / Faltantes de caja</option>
                </select>
              </div>
            ) : (
              <div className="bg-emerald-50 text-[#399665] px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-emerald-100">
                <Palmtree className="w-4 h-4" /> Rol de Vacaciones de Ley
              </div>
            )}

            <div className="relative w-full">
              <span className="absolute left-3 top-3 text-slate-400"><MapPin className="w-3.5 h-3.5" /></span>
              <select value={filterSucursal} onChange={(e) => setFilterSucursal(e.target.value)} className={selectClasses}>
                <option value="Todos">Todas las Sucursales</option>
                {SUCURSALES_DISPONIBLES?.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            <button 
              type="button" onClick={() => { setShowAltaForm(!showAltaForm); setIsEditing(false); }}
              className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 ${showAltaForm ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-slate-700 text-white hover:bg-slate-600"}`}
            >
              {showAltaForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showAltaForm ? "Cancelar Registro" : "Crear Incidencia"}
            </button>
          </div>
        </div>

        {/* TABLA MAESTRA */}
        <div className={`${cardClasses} overflow-hidden bg-white`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs table-fixed min-w-[1200px]">
              <thead>
                <tr className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 h-11">
                  <th className="p-2.5 pl-6 w-20">ID Reloj</th>
                  <th className="p-2.5 w-56">Colaborador / Sucursal</th>
                  <th className="p-2.5 w-44">Tipo Incidencia</th>
                  <th className="p-2.5 w-28 text-center">Fecha Inicio</th>
                  <th className="p-2.5 w-28 text-center">{activeTab === "vacaciones" ? "Días Ley" : "Duración / Cuotas"}</th>
                  <th className="p-2.5 w-68">Impacto Quincenal / Logística de Cobertura</th>
                  <th className="p-2.5 text-center w-28">Estado Nom.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {filteredNovedades.map((n) => {
                  const isSelected = !showAltaForm && selectedId === n.id;
                  const emp = empleados.find(e => e.id_reloj === n.id_reloj);
                  const empCubre = n.id_reloj_cubre ? empleados.find(e => e.id_reloj === n.id_reloj_cubre) : null;
                  const imp = analizarImpactoIncidencia(n.id_reloj, n.tipo, n.cantidad_dias, n.monto, n.cuotas, n.tiene_cobertura);

                  return (
                    <tr 
                      key={n.id} onClick={() => { setSelectedId(n.id); setShowAltaForm(false); }}
                      className={`h-12 transition-all ${isSelected ? "bg-emerald-50/30 text-slate-900 font-medium border-l-4 border-emerald-500" : "hover:bg-slate-50/40 cursor-pointer"}`}
                    >
                      <td className={`p-2.5 pl-6 font-mono text-slate-400 font-semibold ${isSelected && "!pl-5 text-emerald-600"}`}>{n.id_reloj}</td>
                      <td className="p-2.5">
                        <div className="font-bold text-slate-700 uppercase truncate">{emp?.nombre || "No Registrado"}</div>
                        <div className="text-[10px] text-slate-400 uppercase truncate">{emp?.sucursal_principal}</div>
                      </td>
                      <td className="p-2.5 font-bold text-slate-700">{n.tipo}</td>
                      <td className="p-2.5 text-center font-mono text-slate-500">{n.fecha_inicio}</td>
                      <td className="p-2.5 text-center font-mono">
                        {n.tipo === "Cuentas por Cobrar (CXC)" ? (
                          <span className="font-bold text-amber-600">{n.cuotas} Cuotas</span>
                        ) : ["Vales / Faltantes de caja"].includes(n.tipo) ? (
                          <span className="text-slate-400 text-[10px]">Cierre Completo</span>
                        ) : (
                          <span className="font-bold text-slate-800">{n.cantidad_dias} Días</span>
                        )}
                      </td>
                      <td className="p-2.5 text-xs">
                        {n.tipo === "Vacaciones" ? (
                          (() => {
                            const log = calcularFechaFinLaborable(n.fecha_inicio, Number(n.cantidad_dias) || 1);
                            const sueldo = emp ? Number(emp.sueldo_base) : 27489.60;
                            return (
                              <div className="flex flex-col">
                                <span className="text-slate-500">Regreso: <span className="font-bold text-slate-700">{log}</span></span>
                                <span className="text-[10px] text-emerald-600 font-mono font-bold">Adelanto: {formatMonto((Number(n.cantidad_dias) || 1) * (sueldo / 23.83))}</span>
                              </div>
                            );
                          })()
                        ) : n.tipo === "Permiso" && n.tiene_cobertura ? (
                          <span className="text-emerald-700 font-medium bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">
                            Cubierto por: <strong className="uppercase">{empCubre?.nombre || "ID: " + n.id_reloj_cubre}</strong>
                          </span>
                        ) : imp.descuentaSalario ? (
                          <div className="flex flex-col">
                            <span className="text-red-500 font-mono font-bold">Deducción Q: -{formatMonto(imp.montoDescuento)}</span>
                            <span className="text-[9px] text-slate-400 truncate block max-w-[240px]">{imp.label}</span>
                          </div>
                        ) : (
                          <span className="text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 text-[10px]">
                            {imp.label}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-center">
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

      {/* DRAG RESIZE GRIP */}
      <div onMouseDown={startResizing} className="w-2 bg-transparent hover:bg-slate-200/60 active:bg-slate-300 rounded-full cursor-col-resize transition-all self-stretch shrink-0 mx-0.5 relative z-10" />

      {/* PANEL EXPEDIENTE LATERAL */}
      <div style={{ width: `${panelWidth}px` }} className={`${cardClasses} p-5 bg-white shadow-md sticky top-5 max-h-[88vh] overflow-y-auto shrink-0 select-text`}>
        {showAltaForm ? (
          /* REGISTRO NUEVO */
          <form onSubmit={ejecutarAlta} className="flex flex-col gap-4 text-xs">
            <div className="flex flex-col gap-1 border-b border-slate-100 pb-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Capturar Novedad</h4>
              <span className="text-[10px] text-slate-400">Canalización autorizada de incidencias</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Colaborador</label>
              <select value={nuevo.id_reloj} onChange={e => setNuevo({...nuevo, id_reloj: e.target.value})} className={`${selectClasses} !pl-3 bg-white`}>
                {empleados.map(emp => <option key={emp.id_reloj} value={emp.id_reloj}>{emp.nombre.toUpperCase()} (ID: {emp.id_reloj})</option>)}
              </select>
            </div>

            {activeTab === "general" ? (
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Concepto de Incidencia</label>
                <select value={nuevo.tipo} onChange={e => setNuevo({...nuevo, tipo: e.target.value as any, monto: "0", cuotas: "1", cantidad_dias: "1", tiene_cobertura: false, id_reloj_cubre: "Ninguno"})} className={`${selectClasses} !pl-3 bg-white`}>
                  <option value="Permiso">Permiso</option>
                  <option value="Licencias médicas">Licencias médicas</option>
                  <option value="Maternidad">Maternidad</option>
                  <option value="Cuentas por Cobrar (CXC)">Cuentas por Cobrar (CXC)</option>
                  <option value="Vales / Faltantes de caja">Vales / Faltantes de caja</option>
                </select>
              </div>
            ) : (
              <div className="bg-emerald-50 text-[#399665] p-2.5 rounded-xl text-[10px] font-bold text-center">PLANIFICADOR DE VACACIONES (LUNES A SÁBADO)</div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Fecha de Efectividad</label>
              <input type="date" required className={`${inputClasses} !pl-3 font-mono`} value={nuevo.fecha_inicio} onChange={e => setNuevo({...nuevo, fecha_inicio: e.target.value})} />
            </div>

            {/* LÓGICA DE COBERTURA DINÁMICA EXCLUSIVA PARA PERMISOS */}
            {activeTab === "general" && nuevo.tipo === "Permiso" && (
              <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl flex flex-col gap-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer select-none text-slate-700 font-bold">
                  <input type="checkbox" className="w-4 h-4 rounded-lg border-slate-300 text-emerald-600 accent-[#42A873]" checked={nuevo.tiene_cobertura} onChange={e => setNuevo({...nuevo, tiene_cobertura: e.target.checked, id_reloj_cubre: "Ninguno"})} />
                  <span>¿El turno fue cubierto por otro empleado?</span>
                </label>
                
                {nuevo.tiene_cobertura && (
                  <div className="flex flex-col gap-1 animate-fadeIn">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Colaborador de Reemplazo</label>
                    <select value={nuevo.id_reloj_cubre} onChange={e => setNuevo({...nuevo, id_reloj_cubre: e.target.value})} className={`${selectClasses} !pl-3 bg-white`}>
                      <option value="Ninguno">-- Seleccionar Colaborador --</option>
                      {empleados.filter(em => em.id_reloj !== nuevo.id_reloj).map(emp => (
                        <option key={emp.id_reloj} value={emp.id_reloj}>{emp.nombre.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {((activeTab === "vacaciones" || ["Licencias médicas", "Maternidad", "Permiso"].includes(nuevo.tipo))) ? (
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Días de Extensión</label>
                <input type="number" min="1" required className={`${inputClasses} !pl-3 font-mono`} value={nuevo.cantidad_dias} onChange={e => setNuevo({...nuevo, cantidad_dias: e.target.value})} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Monto Total (RD$)</label>
                  <input type="number" min="1" step="0.01" required className={`${inputClasses} !pl-3 font-mono`} value={nuevo.monto} onChange={e => setNuevo({...nuevo, monto: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Dividir en Cuotas</label>
                  <input type="number" min="1" disabled={nuevo.tipo !== "Cuentas por Cobrar (CXC)"} className={`${inputClasses} !pl-3 font-mono disabled:opacity-40 bg-white`} value={nuevo.tipo !== "Cuentas por Cobrar (CXC)" ? "1" : nuevo.cuotas} onChange={e => setNuevo({...nuevo, cuotas: e.target.value})} />
                </div>
              </div>
            )}

            {activeTab === "general" && (() => {
              const info = analizarImpactoIncidencia(nuevo.id_reloj, nuevo.tipo, parseInt(nuevo.cantidad_dias, 10) || 1, parseFloat(nuevo.monto) || 0, parseInt(nuevo.cuotas, 10) || 1, nuevo.tiene_cobertura);
              return (
                <div className={`p-3 rounded-xl border text-[11px] ${info.descuentaSalario ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                  <div className="font-bold flex items-center gap-1 text-[10px] uppercase">
                    {info.descuentaSalario ? <TrendingDown className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                    Impacto Quincenal Previsto
                  </div>
                  <div className="mt-1 font-medium">{info.descuentaSalario ? `Monto a deducir en esta quincena: ${formatMonto(info.montoDescuento)}` : info.label}</div>
                </div>
              );
            })()}

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Comentario / Justificación</label>
              <input type="text" placeholder="Observaciones de RRHH..." className={`${inputClasses} !pl-3`} value={nuevo.comentario} onChange={e => setNuevo({...nuevo, comentario: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setShowAltaForm(false)} className="border border-slate-200 text-slate-500 font-semibold py-2 rounded-xl">Cancelar</button>
              <button type="submit" className="bg-slate-700 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-1"><Save className="w-4 h-4" /> Registrar</button>
            </div>
          </form>
        ) : novSel ? (
          /* EXPEDIENTE DETALLADO */
          <form onSubmit={guardarFicha} className="flex flex-col gap-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Expediente Único</span>
                <h4 className="font-bold text-slate-800 text-sm mt-0.5">{novSel.id} · {novSel.tipo}</h4>
              </div>
            </div>

            {/* ACCIONES DE RESPUESTA RÁPIDA */}
            <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl flex flex-col gap-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Estado y Cierre de Incidencia</span>
              <div className="grid grid-cols-2 gap-2">
                {novSel.estado === "Pendiente Aplicación" ? (
                  <button type="button" onClick={() => cambiarEstadoRapido(novSel.id, "Procesado")} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 shadow-sm"><CheckCircle className="w-3.5 h-3.5" /> Aplicar</button>
                ) : (
                  <button type="button" onClick={() => cambiarEstadoRapido(novSel.id, "Pendiente Aplicación")} className="border border-amber-300 bg-amber-50 text-amber-700 py-1.5 rounded-lg flex items-center justify-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Reabrir</button>
                )}
                <button type="button" onClick={() => eliminarIncidenciaRapido(novSel.id)} className="bg-red-50 text-red-600 font-bold py-1.5 rounded-lg border border-red-200 flex items-center justify-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Eliminar</button>
              </div>
            </div>

            <div className="w-full">
              {!isEditing ? (
                <button type="button" onClick={() => setIsEditing(true)} className="w-full border border-slate-200 text-slate-600 bg-slate-50/40 py-2 rounded-xl flex items-center justify-center gap-1.5 font-bold">
                  <Pencil className="w-3.5 h-3.5 text-slate-400" /> Editar Registro
                </button>
              ) : (
                <div className="flex gap-2.5 w-full">
                  <button type="button" onClick={() => setIsEditing(false)} className="border border-slate-200 text-slate-400 py-2 rounded-xl flex-1 text-center font-semibold">Cancelar</button>
                  <button type="submit" className="bg-[#2B4C5E] text-white py-2 rounded-xl flex-1 flex items-center justify-center gap-1.5 font-bold"><Save className="w-3.5 h-3.5" /> Guardar</button>
                </div>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-200/50 p-3 rounded-xl flex flex-col gap-1 text-[11px] text-slate-500">
              <div>Empleado Reloj ID: <strong className="font-mono text-slate-800">{novSel.id_reloj}</strong></div>
              <div className="truncate">Nombre: <strong className="text-slate-800 font-bold uppercase">{empAsociado?.nombre || "Sin indexar"}</strong></div>
              <div>Sueldo Base Mensual: <strong className="text-slate-800 font-mono">{formatMonto(empAsociado ? Number(empAsociado.sueldo_base) : 27489.60)}</strong></div>
            </div>

            {novSel.tipo !== "Vacaciones" && (
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Concepto</label>
                <select disabled={!isEditing} value={isEditing ? formFicha.tipo : novSel.tipo} onChange={(e) => setFormFicha({ ...formFicha, tipo: e.target.value as any, monto: 0, cuotas: 1, cantidad_dias: 1, tiene_cobertura: false, id_reloj_cubre: "Ninguno" })} className={selectClasses}>
                  <option value="Permiso">Permiso</option>
                  <option value="Licencias médicas">Licencias médicas</option>
                  <option value="Maternidad">Maternidad</option>
                  <option value="Cuentas por Cobrar (CXC)">Cuentas por Cobrar (CXC)</option>
                  <option value="Vales / Faltantes de caja">Vales / Faltantes de caja</option>
                </select>
              </div>
            )}

            {/* CONTROL DE PARÁMETROS EDITABLES DE COBERTURA */}
            {formFicha.tipo === "Permiso" || (!isEditing && novSel.tipo === "Permiso") && (
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-bold">
                  <input type="checkbox" disabled={!isEditing} className="w-4 h-4 rounded text-emerald-600 focus:ring-0" checked={isEditing ? formFicha.tiene_cobertura : novSel.tiene_cobertura} onChange={e => setFormFicha({...formFicha, tiene_cobertura: e.target.checked, id_reloj_cubre: "Ninguno"})} />
                  <span>¿Turno Cubierto?</span>
                </label>
                {(isEditing ? formFicha.tiene_cobertura : novSel.tiene_cobertura) && (
                  <div className="flex flex-col gap-1 mt-1">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Reemplazo Autorizado</label>
                    <select disabled={!isEditing} value={isEditing ? formFicha.id_reloj_cubre : novSel.id_reloj_cubre} onChange={e => setFormFicha({...formFicha, id_reloj_cubre: e.target.value})} className={selectClasses}>
                      <option value="Ninguno">-- Seleccionar --</option>
                      {empleados.map(emp => <option key={emp.id_reloj} value={emp.id_reloj}>{emp.nombre}</option>)}
                    </select>
                  </div>
                )}
              </div>
            )}

            {(isEditing ? ["Cuentas por Cobrar (CXC)", "Vales / Faltantes de caja"].includes(formFicha.tipo || "") : ["Cuentas por Cobrar (CXC)", "Vales / Faltantes de caja"].includes(novSel.tipo)) ? (
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Monto Total</label>
                  <input type="number" step="0.01" disabled={!isEditing} value={isEditing ? (formFicha.monto ?? 0) : (novSel.monto ?? 0)} onChange={(e) => setFormFicha({ ...formFicha, monto: parseFloat(e.target.value) || 0 })} className={`${inputClasses} !pl-3 bg-white font-mono`} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Cuotas</label>
                  <input type="number" min="1" disabled={!isEditing || (isEditing ? formFicha.tipo !== "Cuentas por Cobrar (CXC)" : novSel.tipo !== "Cuentas por Cobrar (CXC)")} value={isEditing ? (formFicha.cuotas ?? 1) : (novSel.cuotas ?? 1)} onChange={(e) => setFormFicha({ ...formFicha, cuotas: parseInt(e.target.value, 10) || 1 })} className={`${inputClasses} !pl-3 bg-white font-mono`} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Duración Temporal (Días)</label>
                <input type="number" min="1" disabled={!isEditing} value={isEditing ? (formFicha.cantidad_dias ?? 1) : (novSel.cantidad_dias ?? 1)} onChange={(e) => setFormFicha({ ...formFicha, cantidad_dias: parseInt(e.target.value, 10) || 1 })} className={`${inputClasses} font-mono`} />
              </div>
            )}

            {/* IMPACTO REAL */}
            {(() => {
              const tActivo = isEditing ? formFicha.tipo : novSel.tipo;
              const dActivos = isEditing ? formFicha.cantidad_dias : novSel.cantidad_dias;
              const mActivo = isEditing ? formFicha.monto : novSel.monto;
              const cActivas = isEditing ? formFicha.cuotas : novSel.cuotas;
              const cobActiva = isEditing ? formFicha.tiene_cobertura : novSel.tiene_cobertura;

              const info = analizarImpactoIncidencia(novSel.id_reloj, tActivo as any, dActivos, mActivo, cActivas, cobActiva);
              return (
                <div className={`p-3 rounded-xl border text-[11px] ${info.descuentaSalario ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                  <div className="font-bold uppercase tracking-wide text-[10px]">Impacto Contable Quincenal Real</div>
                  <div className="mt-1 font-medium">
                    {info.descuentaSalario 
                      ? `Se debitará en nómina de esta quincena: ${formatMonto(info.montoDescuento)}. ${info.label}` 
                      : info.label}
                  </div>
                </div>
              );
            })()}

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Notas de Control Administrativo</label>
              <textarea disabled={!isEditing} value={isEditing ? formFicha.comentario : novSel.comentario} onChange={(e) => setFormFicha({ ...formFicha, comentario: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs h-16 outline-none focus:bg-white resize-none font-medium" />
            </div>
          </form>
        ) : (
          <div className="text-center text-slate-400 italic py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">Seleccione un registro para desplegar los detalles contables.</div>
        )}
      </div>
    </div>
  );
}