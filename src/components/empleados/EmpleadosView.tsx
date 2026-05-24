"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { usePay } from "@/context/PayContext";
import { SUCURSALES_DISPONIBLES } from "@/data/mockData";
import { 
  Search, 
  X, 
  Pencil, 
  Save, 
  Users, 
  MapPin, 
  UserPlus, 
  DollarSign, 
  Clock, 
  ShieldCheck,
  Calendar,
  SlidersHorizontal,
  Layers,
  Briefcase
} from "lucide-react";

interface Colaborador {
  id_reloj: string;
  nombre: string;
  cargo: string;
  sucursal_principal: string;
  sucursal_secundaria?: string; 
  sueldo_base: number;
  exento_ponche: boolean;
  horas_extras_fijas: boolean;
  cantidad_horas_extras?: number; 
  monto_vales_cxc?: number;
  fecha_nacimiento?: string;
  fecha_inicio_contrato?: string;
  fecha_fin_contrato?: string;
  cedula?: string;              
  cuenta_bancaria?: string;     
  banco?: string;               
  tipo_jornada: "Completa" | "Parcial"; 
  horas_jornada_parcial?: number;       
  cantidad_dependientes_tss?: number; // 🏥 Cantidad de dependientes adicionales extras
  aplicacion_quincena_tss?: "Primera" | "Segunda" | "Ambas"; // 📅 Quincena de descuento
  estado?: "Activo" | "Inactivo";
}

const formatMoneda = (val: number) => {
  const numeroLimpio = Number(val || 0);
  return "RD$ " + numeroLimpio.toLocaleString("es-DO", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

const calcularMontoHorasExtras = (sueldo: number, horas: number): number => {
  if (!sueldo || !horas) return 0;
  const valorHoraNormal = sueldo / (23.83 * 8);
  return horas * valorHoraNormal * 1.35;
};

const calcularEdadNum = (fechaNacStr?: string): number | null => {
  if (!fechaNacStr) return null;
  const nacimiento = new Date(fechaNacStr + "T00:00:00");
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
};

export default function EmpleadosView() {
  const { empleados = [], setEmpleados } = usePay();

  // --- ESTADOS DE FILTRADO, BÚSQUEDA Y AGRUPACIÓN ---
  const [search, setSearch] = useState("");
  const [filterSucursal, setFilterSucursal] = useState("Todos");
  const [filterJornada, setFilterJornada] = useState("Todos");
  const [filterPonche, setFilterPonche] = useState("Todos");
  const [filterExtras, setFilterExtras] = useState("Todos");
  const [groupBy, setGroupBy] = useState<"Ninguno" | "sucursal" | "cargo" | "jornada">("Ninguno");
  
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string>("");
  const [showAltaForm, setShowAltaForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // --- LÓGICA DE CONTROL DE ANCHO AJUSTABLE (RESIZABLE) ---
  const [panelWidth, setPanelWidth] = useState(430); 
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
    if (nextWidth > 340 && nextWidth < 700) {
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
    id_reloj: "", nombre: "", cargo: "", sucursal_principal: "Farma Tania I", sucursal_secundaria: "Ninguna",
    sueldo_base: "27489.57", exento_ponche: false, horas_extras_fijas: false, cantidad_horas_extras: "0", monto_vales_cxc: "0",
    fecha_nacimiento: "", fecha_inicio_contrato: "2026-01-01", fecha_fin_contrato: "",
    cedula: "", cuenta_bancaria: "", banco: "Banreservas", tipo_jornada: "Completa" as "Completa" | "Parcial",
    horas_jornada_parcial: "8", cantidad_dependientes_tss: "0", aplicacion_quincena_tss: "Segunda" as "Primera" | "Segunda" | "Ambas"
  });

  const [formFicha, setFormFicha] = useState<Partial<Colaborador>>({});

  const empSel = useMemo(() => empleados.find(e => e.id_reloj === selectedEmpleadoId), [empleados, selectedEmpleadoId]);

  useEffect(() => {
    if (empleados.length > 0 && !selectedEmpleadoId) {
      setSelectedEmpleadoId(empleados[0].id_reloj);
    }
  }, [empleados, selectedEmpleadoId]);

  useEffect(() => {
    if (empSel) {
      setFormFicha({ 
        tipo_jornada: "Completa", 
        sucursal_secundaria: "Ninguna", 
        horas_jornada_parcial: 8, 
        cantidad_horas_extras: 0, 
        cantidad_dependientes_tss: 0, 
        aplicacion_quincena_tss: "Segunda", 
        ...empSel 
      });
      setIsEditing(false);
    }
  }, [selectedEmpleadoId, empSel]);

  const metricasGlobales = useMemo(() => {
    let activos = 0, exentos = 0, conHorasExtras = 0, nominaTeoricaMensual = 0;
    empleados.forEach(e => {
      activos++;
      if (e.exento_ponche) exentos++;
      if (e.horas_extras_fijas) conHorasExtras++;
      nominaTeoricaMensual += (Number(e.sueldo_base) || 0);
    });
    return { activos, exentos, conHorasExtras, nominaTeoricaMensual };
  }, [empleados]);

  const ejecutarAlta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevo.id_reloj || !nuevo.nombre || !nuevo.cargo) return alert("❌ Error: ID, Nombre y Cargo son obligatorios.");
    if (empleados.some(em => em.id_reloj === nuevo.id_reloj.trim())) return alert(`⚠️ Conflicto: El ID de Reloj ya existe.`);

    const creado: Colaborador = {
      id_reloj: nuevo.id_reloj.trim(), nombre: nuevo.nombre.trim(), cargo: nuevo.cargo.trim(),
      sucursal_principal: nuevo.sucursal_principal, sucursal_secundaria: nuevo.sucursal_secundaria === "Ninguna" ? undefined : nuevo.sucursal_secundaria,
      sueldo_base: parseFloat(nuevo.sueldo_base) || 0, exento_ponche: nuevo.exento_ponche, 
      horas_extras_fijas: nuevo.horas_extras_fijas,
      cantidad_horas_extras: nuevo.horas_extras_fijas ? (parseInt(nuevo.cantidad_horas_extras, 10) || 0) : undefined,
      monto_vales_cxc: parseFloat(nuevo.monto_vales_cxc) || 0, fecha_nacimiento: nuevo.fecha_nacimiento || undefined,
      fecha_inicio_contrato: nuevo.fecha_inicio_contrato || undefined, fecha_fin_contrato: nuevo.fecha_fin_contrato || undefined,
      cedula: nuevo.cedula.trim() || undefined, cuenta_bancaria: nuevo.cuenta_bancaria.trim() || undefined, banco: nuevo.banco,
      tipo_jornada: nuevo.tipo_jornada, 
      horas_jornada_parcial: nuevo.tipo_jornada === "Parcial" ? (parseFloat(nuevo.horas_jornada_parcial) || 0) : undefined,
      cantidad_dependientes_tss: parseInt(nuevo.cantidad_dependientes_tss, 10) || 0,
      aplicacion_quincena_tss: nuevo.aplicacion_quincena_tss,
      estado: "Activo"
    };

    if (setEmpleados) {
      setEmpleados([...empleados, creado]);
      setSelectedEmpleadoId(creado.id_reloj);
      setShowAltaForm(false);
      setNuevo({
        id_reloj: "", nombre: "", cargo: "", sucursal_principal: "Farma Tania I", sucursal_secundaria: "Ninguna", sueldo_base: "27489.57",
        exento_ponche: false, horas_extras_fijas: false, cantidad_horas_extras: "0", monto_vales_cxc: "0", fecha_nacimiento: "", fecha_inicio_contrato: "2026-01-01",
        fecha_fin_contrato: "", cedula: "", cuenta_bancaria: "", banco: "Banreservas", tipo_jornada: "Completa", horas_jornada_parcial: "8",
        cantidad_dependientes_tss: "0", aplicacion_quincena_tss: "Segunda"
      });
      alert("✅ Colaborador registrado con éxito.");
    }
  };

  const guardarFicha = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmpleadoId && setEmpleados) {
      const { ...formFichaClean } = formFicha;
      const fichaFormateada = {
        ...formFichaClean,
        sueldo_base: parseFloat(String(formFicha.sueldo_base)) || 0,
        monto_vales_cxc: parseFloat(String(formFicha.monto_vales_cxc)) || 0,
        horas_jornada_parcial: formFicha.tipo_jornada === "Parcial" ? (parseFloat(String(formFicha.horas_jornada_parcial)) || 0) : undefined,
        cantidad_horas_extras: formFicha.horas_extras_fijas ? (parseInt(String(formFicha.cantidad_horas_extras), 10) || 0) : undefined,
        cantidad_dependientes_tss: parseInt(String(formFicha.cantidad_dependientes_tss), 10) || 0,
        aplicacion_quincena_tss: formFicha.aplicacion_quincena_tss || "Segunda",
        sucursal_secundaria: formFicha.sucursal_secundaria === "Ninguna" ? undefined : formFicha.sucursal_secundaria
      };

      const loteActualizado = empleados.map(e => e.id_reloj === selectedEmpleadoId ? { ...e, ...fichaFormateada } as Colaborador : e);
      setEmpleados(loteActualizado);
      setIsEditing(false);
      alert("✅ Ficha de empleado actualizada.");
    }
  };

  const empleadosFiltrados = useMemo(() => {
    return empleados.filter(e => {
      const matchSearch = e.nombre.toLowerCase().includes(search.toLowerCase()) || e.id_reloj.includes(search) || e.cargo.toLowerCase().includes(search.toLowerCase()) || (e.cedula && e.cedula.includes(search));
      const matchSucursal = filterSucursal === "Todos" || e.sucursal_principal === filterSucursal || e.sucursal_secundaria === filterSucursal;
      const matchJornada = filterJornada === "Todos" || e.tipo_jornada === filterJornada;
      const matchPonche = filterPonche === "Todos" || (filterPonche === "Registra" ? !e.exento_ponche : e.exento_ponche);
      const matchExtras = filterExtras === "Todos" || e.horas_extras_fijas === (filterExtras === "Autorizadas");

      return matchSearch && matchSucursal && matchJornada && matchPonche && matchExtras;
    });
  }, [empleados, search, filterSucursal, filterJornada, filterPonche, filterExtras]);

  const empleadosAgrupados = useMemo(() => {
    if (groupBy === "Ninguno") {
      return [{ key: "Todos los Colaboradores", list: empleadosFiltrados }];
    }

    const mapa = new Map<string, Colaborador[]>();

    empleadosFiltrados.forEach(emp => {
      let claveGrupo = "No Especificado";
      if (groupBy === "sucursal") claveGrupo = emp.sucursal_principal;
      else if (groupBy === "cargo") claveGrupo = emp.cargo;
      else if (groupBy === "jornada") claveGrupo = emp.tipo_jornada === "Completa" ? "Jornada Completa" : "Jornada Parcial / Reducida";

      if (!mapa.has(claveGrupo)) mapa.set(claveGrupo, []);
      mapa.get(claveGrupo)!.push(emp);
    });

    return Array.from(mapa.entries()).map(([key, list]) => ({ key, list }));
  }, [empleadosFiltrados, groupBy]);

  const cardClasses = "bg-white border border-slate-100/80 rounded-2xl shadow-[0_4px_20px_rgba(241,245,249,0.6)]";
  const inputClasses = "w-full pl-9 pr-3.5 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-xs outline-none focus:bg-white focus:border-emerald-500/80 focus:ring-4 focus:ring-emerald-500/5 transition-all text-slate-700 disabled:opacity-60 disabled:bg-slate-50/50";
  const selectClasses = "w-full pl-9 pr-8 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-xs font-medium outline-none cursor-pointer focus:bg-white focus:border-emerald-500/80 focus:ring-4 focus:ring-emerald-500/5 transition-all text-slate-700 appearance-none disabled:opacity-60 disabled:bg-slate-50/50";

  return (
    <div className="flex gap-1 text-slate-700 bg-[#F8FAFC] p-4 rounded-3xl min-h-screen w-full select-none overflow-hidden font-sans">
      
      {/* SECCIÓN IZQUIERDA: MAESTRO E INDICADORES */}
      <div className="flex-1 flex flex-col gap-6 min-w-0 pr-2">
        
        {/* INDICADORES TOP */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`${cardClasses} p-5 flex items-center justify-between bg-gradient-to-br from-white to-slate-50/30`}>
            <div>
              <span className="text-[10px] font-bold text-slate-400 tracking-widest block">Plantilla</span>
              <span className="text-2xl font-bold text-slate-800 tracking-tight mt-1 block">{metricasGlobales.activos}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50/60 text-emerald-600 flex items-center justify-center border border-emerald-100/50"><Users className="w-4 h-4" /></div>
          </div>
          
          <div className={`${cardClasses} p-5 flex items-center justify-between bg-gradient-to-br from-white to-slate-50/30`}>
            <div>
              <span className="text-[10px] font-bold text-slate-400 tracking-widest block">Exentos</span>
              <span className="text-2xl font-bold text-slate-700 tracking-tight mt-1 block">{metricasGlobales.exentos}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center border border-slate-100"><ShieldCheck className="w-4 h-4" /></div>
          </div>

          <div className={`${cardClasses} p-5 flex items-center justify-between bg-gradient-to-br from-white to-slate-50/30`}>
            <div>
              <span className="text-[10px] font-bold text-slate-400 tracking-widest block">Horas Extras</span>
              <span className="text-2xl font-bold text-slate-700 tracking-tight mt-1 block">{metricasGlobales.conHorasExtras}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center border border-slate-100"><Clock className="w-4 h-4" /></div>
          </div>

          <div className="bg-[#2B4C5E] border border-[#233F4E] rounded-2xl p-5 flex items-center justify-between shadow-[0_8px_30px_rgba(35,63,78,0.15)] relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
            <div>
              <span className="text-[10px] font-bold text-slate-300/80 tracking-widest block">Nómina Base</span>
              <span className="text-sm font-bold text-white font-mono mt-2 block tracking-wide">{formatMoneda(metricasGlobales.nominaTeoricaMensual)}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 text-emerald-400 flex items-center justify-center"><DollarSign className="w-4 h-4" /></div>
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
              <span className="absolute left-3 top-3 text-slate-400 pointer-events-none"><Layers className="w-4 h-4" /></span>
              <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)} className={`${selectClasses} text-slate-600 font-semibold bg-slate-50/50`}>
                <option value="Ninguno">Sin Agrupar</option>
                <option value="sucursal">Por Sucursal</option>
                <option value="cargo">Por Puesto</option>
                <option value="jornada">Por Jornada</option>
              </select>
            </div>
            
            <button 
              type="button" 
              onClick={() => { setShowAltaForm(!showAltaForm); setIsEditing(false); }}
              className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 ${showAltaForm ? "bg-red-50 text-red-600 hover:bg-red-100/70" : "bg-[#42A873] text-white hover:bg-[#399665] shadow-sm"}`}
            >
              {showAltaForm ? <X className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
              {showAltaForm ? "Cancelar" : "Nuevo Ingreso"}
            </button>
          </div>
        </div>

        {/* PANEL DE FILTROS AVANZADOS */}
        <div className={`${cardClasses} p-3.5 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3`}>
          <div className="relative">
            <span className="absolute left-3 top-3 text-slate-400 pointer-events-none"><MapPin className="w-3.5 h-3.5" /></span>
            <select value={filterSucursal} onChange={(e) => setFilterSucursal(e.target.value)} className={selectClasses}>
              <option value="Todos">Todas las Sucursales</option>
              {SUCURSALES_DISPONIBLES?.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-3 text-slate-400 pointer-events-none"><Briefcase className="w-3.5 h-3.5" /></span>
            <select value={filterJornada} onChange={(e) => setFilterJornada(e.target.value)} className={selectClasses}>
              <option value="Todos">Todos los Regímenes</option>
              <option value="Completa">Jornada Completa</option>
              <option value="Parcial">Jornada Parcial</option>
            </select>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-3 text-slate-400 pointer-events-none"><Clock className="w-3.5 h-3.5" /></span>
            <select value={filterPonche} onChange={(e) => setFilterPonche(e.target.value)} className={selectClasses}>
              <option value="Todos">Todos los Ponches</option>
              <option value="Registra">Poncha Obligatorio</option>
              <option value="Exento">Exento de Ponche</option>
            </select>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-3 text-slate-400 pointer-events-none"><SlidersHorizontal className="w-3.5 h-3.5" /></span>
            <select value={filterExtras} onChange={(e) => setFilterExtras(e.target.value)} className={selectClasses}>
              <option value="Todos">Horas Extras: Todas</option>
              <option value="Autorizadas">H.E. Habilitadas</option>
              <option value="No Autorizadas">Sin Horas Extras</option>
            </select>
          </div>
        </div>

        {/* TABLA MAESTRA */}
        <div className={`${cardClasses} overflow-hidden bg-white`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs table-fixed min-w-[1200px]">
              <thead>
                <tr className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 h-12">
                  <th className="p-3 pl-6 w-20">ID Reloj</th>
                  <th className="p-3 w-56">Colaborador / Puesto</th>
                  <th className="p-3 w-28 text-center">Fecha Inicio</th>
                  <th className="p-3 w-28 text-center">Fecha Fin</th>
                  <th className="p-3 w-16 text-center">Edad</th>
                  <th className="p-3 w-48">Sucursales</th>
                  <th className="p-3 text-right w-28">Monto H.E.</th>
                  <th className="p-3 text-right w-30">Sueldo Base</th>
                  <th className="p-3 text-center w-36">Jornada / Ponche</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {empleadosAgrupados.map((grupo) => (
                  <React.Fragment key={grupo.key}>
                    {groupBy !== "Ninguno" && (
                      <tr className="bg-slate-50/30 h-9">
                        <td colSpan={9} className="p-2 pl-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-y border-slate-100">
                          {grupo.key} <span className="text-emerald-700 font-bold ml-1.5 bg-emerald-50 px-2 py-0.5 rounded-full text-[9px]">{grupo.list.length}</span>
                        </td>
                      </tr>
                    )}
                    
                    {grupo.list.length === 0 ? (
                      <tr className="h-12"><td colSpan={9} className="p-3 text-center text-slate-400 italic">No se encontraron colaboradores.</td></tr>
                    ) : (
                      grupo.list.map((n, index) => {
                        const isSelected = !showAltaForm && selectedEmpleadoId === n.id_reloj;
                        const edadNum = calcularEdadNum(n.fecha_nacimiento);
                        const montoHE = calcularMontoHorasExtras(n.sueldo_base, n.cantidad_horas_extras || 0);
                        
                        return (
                          <tr 
                            key={`${n.id_reloj}-${index}`} 
                            onClick={() => { setSelectedEmpleadoId(n.id_reloj); setShowAltaForm(false); }}
                            className={`h-14 cursor-pointer transition-all ${isSelected ? "bg-emerald-50/30 text-slate-900 font-medium border-l-4 border-emerald-500" : "hover:bg-slate-50/40"}`}
                          >
                            <td className={`p-3 pl-6 font-mono text-slate-400 font-semibold ${isSelected && "!pl-5 text-emerald-600"}`}>{n.id_reloj}</td>
                            <td className="p-3">
                              <div className="font-bold text-slate-700 uppercase truncate">{n.nombre}</div>
                              <div className="text-[10px] text-slate-400 tracking-wide mt-0.5 font-medium">{n.cargo}</div>
                            </td>
                            <td className="p-3 text-center font-mono text-slate-500">{n.fecha_inicio_contrato || "—"}</td>
                            <td className="p-3 text-center font-mono text-slate-500">
                              {n.fecha_fin_contrato ? <span className="text-amber-600 font-medium">{n.fecha_fin_contrato}</span> : <span className="text-slate-300">Indefinido</span>}
                            </td>
                            <td className="p-3 text-center font-mono text-slate-600">{edadNum !== null ? `${edadNum}ª` : "—"}</td>
                            
                            <td className="p-3 text-slate-500 font-medium">
                              <div className="uppercase truncate text-slate-600">{n.sucursal_principal}</div>
                              {n.sucursal_secundaria && n.sucursal_secundaria !== "Ninguna" && (
                                <div className="text-[9px] text-slate-400 mt-0.5 truncate font-normal">Sec: {n.sucursal_secundaria}</div>
                              )}
                            </td>

                            <td className="p-3 text-right font-mono">
                              {n.horas_extras_fijas && (n.cantidad_horas_extras || 0) > 0 ? (
                                <div className="flex flex-col items-end">
                                  <span className="font-semibold text-emerald-600">{formatMoneda(montoHE)}</span>
                                  <span className="text-[9px] text-slate-400 font-sans">{n.cantidad_horas_extras}h</span>
                                </div>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>

                            <td className="p-3 text-right font-mono font-bold text-slate-700">{formatMoneda(n.sueldo_base)}</td>
                            
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-2.5">
                                {n.tipo_jornada === "Parcial" && (
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-[#399665] border border-emerald-100/60">
                                    {n.horas_jornada_parcial}h
                                  </span>
                                )}
                                {!n.exento_ponche && (
                                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </React.Fragment>
                ))}
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
          <form onSubmit={ejecutarAlta} className="flex flex-col gap-4 text-xs">
            <div className="flex flex-col gap-1 border-b border-slate-100 pb-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Alta de Personal</h4>
              <span className="text-[10px] text-slate-400">Crear nuevo expediente en el sistema</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="flex flex-col gap-1.5 col-span-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">ID Reloj</label>
                <input type="text" required placeholder="Ej: 45" className={`${inputClasses} !pl-3 font-mono font-semibold`} value={nuevo.id_reloj} onChange={e => setNuevo({...nuevo, id_reloj: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Nombre Completo</label>
                <input type="text" required placeholder="JUAN PÉREZ" className={`${inputClasses} !pl-3 uppercase font-medium`} value={nuevo.nombre} onChange={e => setNuevo({...nuevo, nombre: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Cédula</label>
                <input type="text" placeholder="001-0000000-0" className={`${inputClasses} !pl-3 font-mono`} value={nuevo.cedula} onChange={e => setNuevo({...nuevo, cedula: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Cargo / Puesto</label>
                <input type="text" required placeholder="Ej: Auxiliar" className={`${inputClasses} !pl-3`} value={nuevo.cargo} onChange={e => setNuevo({...nuevo, cargo: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Sucursal Principal</label>
                <select value={nuevo.sucursal_principal} onChange={e => setNuevo({...nuevo, sucursal_principal: e.target.value})} className={`${selectClasses} !pl-3 bg-slate-50`}>
                  {SUCURSALES_DISPONIBLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Sucursal Secundaria</label>
                <select value={nuevo.sucursal_secundaria} onChange={e => setNuevo({...nuevo, sucursal_secundaria: e.target.value})} className={`${selectClasses} !pl-3 bg-slate-50`}>
                  <option value="Ninguna">Ninguna</option>
                  {SUCURSALES_DISPONIBLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50 flex flex-col gap-2.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Dispersión de Nómina</span>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <select value={nuevo.banco} onChange={e => setNuevo({...nuevo, banco: e.target.value})} className={`${selectClasses} !pl-2.5 bg-white`}>
                    <option value="Banreservas">Banreservas</option>
                    <option value="Banco Popular">Banco Popular</option>
                    <option value="Banco BHD">Banco BHD</option>
                    <option value="Scotiabank">Scotiabank</option>
                  </select>
                </div>
                <div>
                  <input type="text" placeholder="No. Cuenta" className={`${inputClasses} !pl-2.5 font-mono bg-white`} value={nuevo.cuenta_bancaria} onChange={e => setNuevo({...nuevo, cuenta_bancaria: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50 flex flex-col gap-2.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Estructura Horaria</span>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <select value={nuevo.tipo_jornada} onChange={e => setNuevo({...nuevo, tipo_jornada: e.target.value as any})} className={`${selectClasses} !pl-2.5 bg-white`}>
                    <option value="Completa">Jornada Completa</option>
                    <option value="Parcial">Horas Parciales</option>
                  </select>
                </div>
                <div>
                  <input type="number" min="1" max="12" step="0.5" placeholder="Horas diarias" disabled={nuevo.tipo_jornada === "Completa"} className={`${inputClasses} !pl-2.5 font-mono disabled:opacity-40 bg-white`} value={nuevo.tipo_jornada === "Completa" ? "8" : nuevo.horas_jornada_parcial} onChange={e => setNuevo({...nuevo, horas_jornada_parcial: e.target.value})} />
                </div>
              </div>
            </div>

            {/* 🏥 CONFIGURACIÓN TSS EN FORMULARIO DE ALTA */}
            <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50 flex flex-col gap-2.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Parámetros TSS</span>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-medium text-slate-400">Dependientes Extras</label>
                  <input type="number" min="0" max="10" className={`${inputClasses} !pl-3 bg-white font-mono`} value={nuevo.cantidad_dependientes_tss} onChange={e => setNuevo({...nuevo, cantidad_dependientes_tss: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-medium text-slate-400">Quincena Descuento</label>
                  <select value={nuevo.aplicacion_quincena_tss} onChange={e => setNuevo({...nuevo, aplicacion_quincena_tss: e.target.value as any})} className={`${selectClasses} !pl-3 bg-white`}>
                    <option value="Primera">1ra Quincena</option>
                    <option value="Segunda">2da Quincena (Fin de Mes)</option>
                    <option value="Ambas">Dividir en Ambas</option>
                  </select>
                </div>
              </div>
              {parseInt(nuevo.cantidad_dependientes_tss, 10) > 0 && (
                <div className="text-[10px] text-emerald-600 font-semibold bg-emerald-50/50 border border-emerald-100 p-2 rounded-xl text-center">
                  Monto a descontar: {formatMoneda(parseInt(nuevo.cantidad_dependientes_tss, 10) * 1919.78)}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Nacimiento</label>
                <input type="date" className={`${inputClasses} !pl-2 font-mono`} value={nuevo.fecha_nacimiento} onChange={e => setNuevo({...nuevo, fecha_nacimiento: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Inicio</label>
                <input type="date" required className={`${inputClasses} !pl-2 font-mono`} value={nuevo.fecha_inicio_contrato} onChange={e => setNuevo({...nuevo, fecha_inicio_contrato: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Fin</label>
                <input type="date" className={`${inputClasses} !pl-2 font-mono`} value={nuevo.fecha_fin_contrato} onChange={e => setNuevo({...nuevo, fecha_fin_contrato: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Salario Base</label>
                <input type="number" step="0.01" required className={`${inputClasses} !pl-3 font-mono font-bold text-slate-700`} value={nuevo.sueldo_base} onChange={e => setNuevo({...nuevo, sueldo_base: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Vales CxC</label>
                <input type="number" step="0.01" className={`${inputClasses} !pl-3 font-mono`} value={nuevo.monto_vales_cxc} onChange={e => setNuevo({...nuevo, monto_vales_cxc: e.target.value})} />
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-1.5 pl-0.5">
              <label className="flex items-center gap-2.5 cursor-pointer select-none text-slate-600 font-medium">
                <input type="checkbox" className="w-4 h-4 rounded-lg border-slate-300 text-emerald-600 accent-[#42A873]" checked={nuevo.exento_ponche} onChange={e => setNuevo({...nuevo, exento_ponche: e.target.checked})} />
                <span>Exento de Reloj Biométrico</span>
              </label>
              
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none text-slate-600 font-medium">
                  <input type="checkbox" className="w-4 h-4 rounded-lg border-slate-300 text-emerald-600 accent-[#42A873]" checked={nuevo.horas_extras_fijas} onChange={e => setNuevo({...nuevo, horas_extras_fijas: e.target.checked})} />
                  <span>Autorizar Horas Extras Fijas</span>
                </label>
                {nuevo.horas_extras_fijas && (
                  <div className="pl-6 flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Horas quincenales</label>
                    <input type="number" className={`${inputClasses} bg-white !pl-3 font-mono`} placeholder="Cantidad de horas" value={nuevo.cantidad_horas_extras} onChange={e => setNuevo({...nuevo, cantidad_horas_extras: e.target.value})} />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setShowAltaForm(false)} className="border border-slate-200 text-slate-500 font-semibold py-2.5 rounded-xl text-center hover:bg-slate-50 transition-colors">Cancelar</button>
              <button type="submit" className="bg-[#42A873] text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1 hover:bg-[#399665] transition-all"><Save className="w-3.5 h-3.5" /> Registrar Alta</button>
            </div>
          </form>
        ) : empSel ? (
          /* EXPEDIENTE DETALLADO */
          <form onSubmit={guardarFicha} className="flex flex-col gap-4 text-xs">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Expediente</span>
                <h4 className="font-bold text-slate-800 text-sm truncate uppercase mt-0.5 tracking-tight">{empSel.nombre}</h4>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5 font-medium">
                  ID Reloj: {empSel.id_reloj} · {calcularEdadNum(empSel.fecha_nacimiento) !== null ? `${calcularEdadNum(empSel.fecha_nacimiento)} años` : "—"}
                </p>
              </div>
              
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#2B4C5E] to-[#1E3542] text-emerald-400 flex items-center justify-center text-sm font-bold shadow-md shrink-0">
                {empSel.nombre.charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="w-full">
              {!isEditing ? (
                <button type="button" onClick={() => setIsEditing(true)} className="w-full border border-slate-200 text-slate-600 bg-slate-50/40 hover:bg-slate-50 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all">
                  <Pencil className="w-3.5 h-3.5 text-slate-400" /> Modificar Expediente
                </button>
              ) : (
                <div className="flex gap-2.5 w-full">
                  <button type="button" onClick={() => setIsEditing(false)} className="border border-slate-200 text-slate-400 py-2.5 rounded-xl flex-1 text-center font-semibold hover:bg-slate-50 transition-colors">Cancelar</button>
                  <button type="submit" className="bg-[#2B4C5E] text-white py-2.5 rounded-xl flex-1 flex items-center justify-center gap-1.5 font-bold hover:bg-[#1E3542] transition-all"><Save className="w-3.5 h-3.5" /> Guardar</button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Cédula</label>
                  <input type="text" disabled={!isEditing} className={`${inputClasses} font-mono`} value={isEditing ? (formFicha.cedula ?? "") : (empSel.cedula ?? "")} onChange={e => setFormFicha({...formFicha, cedula: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Nombre Completo</label>
                  <input type="text" disabled={!isEditing} className={`${inputClasses} uppercase font-medium`} value={isEditing ? formFicha.nombre : empSel.nombre} onChange={e => setFormFicha({...formFicha, nombre: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Puesto / Cargo</label>
                  <input type="text" disabled={!isEditing} className={inputClasses} value={isEditing ? formFicha.cargo : empSel.cargo} onChange={e => setFormFicha({...formFicha, cargo: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Fecha Nacimiento</label>
                  <input type="date" disabled={!isEditing} className={`${inputClasses} font-mono`} value={isEditing ? (formFicha.fecha_nacimiento ?? "") : (empSel.fecha_nacimiento ?? "")} onChange={e => setFormFicha({...formFicha, fecha_nacimiento: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Sucursal Principal</label>
                  <select disabled={!isEditing} value={isEditing ? formFicha.sucursal_principal : empSel.sucursal_principal} onChange={e => setFormFicha({...formFicha, sucursal_principal: e.target.value})} className={selectClasses}>
                    {SUCURSALES_DISPONIBLES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Sucursal Secundaria</label>
                  <select disabled={!isEditing} value={isEditing ? (formFicha.sucursal_secundaria ?? "Ninguna") : (empSel.sucursal_secundaria ?? "Ninguna")} onChange={e => setFormFicha({...formFicha, sucursal_secundaria: e.target.value})} className={selectClasses}>
                    <option value="Ninguna">Ninguna</option>
                    {SUCURSALES_DISPONIBLES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* SECCIÓN BANCARIA */}
            <div className="border border-slate-100 rounded-2xl p-3 bg-slate-50/50 space-y-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1">Cuenta de Dispersión</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 font-semibold pl-0.5">Banco</label>
                  <select disabled={!isEditing} value={isEditing ? formFicha.banco : empSel.banco} onChange={e => setFormFicha({...formFicha, banco: e.target.value})} className={selectClasses}>
                    <option value="Banreservas">Banreservas</option>
                    <option value="Banco Popular">Banco Popular</option>
                    <option value="Banco BHD">Banco BHD</option>
                    <option value="Scotiabank">Scotiabank</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 font-semibold pl-0.5">No. Cuenta</label>
                  <input type="text" disabled={!isEditing} className={`${inputClasses} font-mono bg-white`} value={isEditing ? (formFicha.cuenta_bancaria ?? "") : (empSel.cuenta_bancaria ?? "")} onChange={e => setFormFicha({...formFicha, cuenta_bancaria: e.target.value})} />
                </div>
              </div>
            </div>

            {/* REGIMEN OPERATIVO */}
            <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 space-y-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1">Régimen Operativo</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 font-semibold pl-0.5">Jornada</label>
                  <select disabled={!isEditing} value={isEditing ? formFicha.tipo_jornada : (empSel.tipo_jornada ?? "Completa")} onChange={e => setFormFicha({...formFicha, tipo_jornada: e.target.value as any})} className={selectClasses}>
                    <option value="Completa">Completa (8h)</option>
                    <option value="Parcial">Parcial (Por Horas)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 font-semibold pl-0.5">Cómputo Horas</label>
                  <input type="number" min="1" max="12" step="0.5" disabled={!isEditing || (isEditing ? formFicha.tipo_jornada === "Completa" : empSel.tipo_jornada !== "Parcial")} className={`${inputClasses} font-mono bg-white`} value={isEditing ? (formFicha.tipo_jornada === "Completa" ? "8" : (formFicha.horas_jornada_parcial ?? "")) : (empSel.tipo_jornada === "Parcial" ? (empSel.horas_jornada_parcial ?? "") : "8")} onChange={e => setFormFicha({...formFicha, horas_jornada_parcial: parseFloat(e.target.value) || 0})} />
                </div>
              </div>
            </div>

            {/* 🏥 SECCIÓN CONTROL TSS ADICIONAL (EXPEDIENTE) */}
            <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 space-y-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1">Cálculo de Descuentos TSS</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 font-semibold pl-0.5">Dependientes Extras</label>
                  <input type="number" min="0" max="10" disabled={!isEditing} className={`${inputClasses} font-mono bg-white !pl-3`} value={isEditing ? (formFicha.cantidad_dependientes_tss ?? 0) : (empSel.cantidad_dependientes_tss ?? 0)} onChange={e => setFormFicha({...formFicha, cantidad_dependientes_tss: parseInt(e.target.value, 10) || 0})} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 font-semibold pl-0.5">Período Retención</label>
                  <select disabled={!isEditing} value={isEditing ? (formFicha.aplicacion_quincena_tss ?? "Segunda") : (empSel.aplicacion_quincena_tss ?? "Segunda")} onChange={e => setFormFicha({...formFicha, aplicacion_quincena_tss: e.target.value as any})} className={selectClasses}>
                    <option value="Primera">1ra Quincena</option>
                    <option value="Segunda">2da Quincena (Fin de Mes)</option>
                    <option value="Ambas">Dividir en Ambas</option>
                  </select>
                </div>
              </div>
              
              {/* Cálculo en tiempo real del dinero extra de TSS */}
              {((isEditing ? formFicha.cantidad_dependientes_tss : empSel.cantidad_dependientes_tss) || 0) > 0 && (
                <div className="text-[10px] text-emerald-600 bg-emerald-50/40 font-semibold p-2 rounded-xl text-center border border-emerald-100/50 mt-1">
                  Retención Adicional: {formatMoneda(((isEditing ? formFicha.cantidad_dependientes_tss : empSel.cantidad_dependientes_tss) || 0) * 1919.78)}
                </div>
              )}
            </div>

            {/* SECCIÓN DE FECHAS DE CONTRATACIÓN Y SALARIO */}
            <div className="grid grid-cols-3 gap-2 border border-slate-100 p-3 rounded-2xl bg-slate-50/50">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Sueldo Base</label>
                <input type="number" step="0.01" disabled={!isEditing} className={`${inputClasses} bg-white font-mono font-bold text-slate-700`} value={isEditing ? (formFicha.sueldo_base ?? 0) : (empSel.sueldo_base ?? 0)} onChange={e => setFormFicha({...formFicha, sueldo_base: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">F. Ingreso</label>
                <input type="date" disabled={!isEditing} className={`${inputClasses} bg-white font-mono text-slate-600 !pl-2 pr-1`} value={isEditing ? (formFicha.fecha_inicio_contrato ?? "") : (empSel.fecha_inicio_contrato ?? "")} onChange={e => setFormFicha({...formFicha, fecha_inicio_contrato: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">F. Término</label>
                <input type="date" disabled={!isEditing} className={`${inputClasses} bg-white font-mono text-slate-600 !pl-2 pr-1`} value={isEditing ? (formFicha.fecha_fin_contrato ?? "") : (empSel.fecha_fin_contrato ?? "")} onChange={e => setFormFicha({...formFicha, fecha_fin_contrato: e.target.value})} />
              </div>
            </div>

            {/* CONTROL DE ASISTENCIA Y H.E. */}
            <div className="pt-2 flex flex-col gap-2.5 border-t border-slate-100">
              <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50/50 cursor-pointer select-none transition-colors">
                <div>
                  <span className="font-bold text-slate-700 block text-xs">Exención de Asistencia</span>
                  <span className="text-[10px] text-slate-400">Ignorar marcas del reloj biométrico</span>
                </div>
                <input type="checkbox" disabled={!isEditing} className="w-4 h-4 rounded-lg border-slate-300 accent-[#42A873]" checked={isEditing ? formFicha.exento_ponche : empSel.exento_ponche} onChange={e => setFormFicha({...formFicha, exento_ponche: e.target.checked})} />
              </label>

              <div className="border border-slate-100 rounded-xl p-2.5 bg-slate-50/20 space-y-2">
                <label className="flex items-center justify-between cursor-pointer select-none transition-colors">
                  <div>
                    <span className="font-bold text-slate-700 block text-xs">Aprobación de Horas Extras</span>
                    <span className="text-[10px] text-slate-400">Habilitar horas fijas quincenales</span>
                  </div>
                  <input type="checkbox" disabled={!isEditing} className="w-4 h-4 rounded-lg border-slate-300 accent-[#42A873]" checked={isEditing ? formFicha.horas_extras_fijas : empSel.horas_extras_fijas} onChange={e => setFormFicha({...formFicha, horas_extras_fijas: e.target.checked})} />
                </label>
                
                {(isEditing ? formFicha.horas_extras_fijas : empSel.horas_extras_fijas) && (
                  <div className="pt-1 flex items-center justify-between gap-4">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Cantidad quincenal:</span>
                    <input type="number" disabled={!isEditing} className={`${inputClasses} bg-white !pl-3 max-w-[120px] font-mono font-bold text-slate-700`} value={isEditing ? (formFicha.cantidad_horas_extras ?? 0) : (empSel.cantidad_horas_extras ?? 0)} onChange={e => setFormFicha({...formFicha, cantidad_horas_extras: parseInt(e.target.value, 10) || 0})} />
                  </div>
                )}
              </div>
            </div>
          </form>
        ) : (
          <div className="text-center italic text-slate-400 py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">Seleccione un colaborador del maestro para desplegar su expediente completo.</div>
        )}
      </div>

    </div>
  );
}