"use client";
import React, { useState, useMemo, useEffect } from "react";
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
  monto_vales_cxc?: number;
  fecha_nacimiento?: string;
  fecha_inicio_contrato?: string;
  fecha_fin_contrato?: string;
  cedula?: string;              
  cuenta_bancaria?: string;     
  banco?: string;               
  tipo_jornada: "Completa" | "Parcial"; 
  horas_jornada_parcial?: number;       
  estado?: "Activo" | "Inactivo";
}

const formatMoneda = (val: number) => {
  const numeroLimpio = Number(val || 0);
  return "RD$ " + numeroLimpio.toLocaleString("es-DO", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
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

  const [nuevo, setNuevo] = useState({
    id_reloj: "", nombre: "", cargo: "", sucursal_principal: "Farma Tania I", sucursal_secundaria: "Ninguna",
    sueldo_base: "27489.57", exento_ponche: false, horas_extras_fijas: false, monto_vales_cxc: "0",
    fecha_nacimiento: "", fecha_inicio_contrato: "2026-01-01", fecha_fin_contrato: "",
    cedula: "", cuenta_bancaria: "", banco: "Banreservas", tipo_jornada: "Completa" as "Completa" | "Parcial",
    horas_jornada_parcial: "8"
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
      setFormFicha({ tipo_jornada: "Completa", sucursal_secundaria: "Ninguna", horas_jornada_parcial: 8, ...empSel });
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
      sueldo_base: parseFloat(nuevo.sueldo_base) || 0, exento_ponche: nuevo.exento_ponche, horas_extras_fijas: nuevo.horas_extras_fijas,
      monto_vales_cxc: parseFloat(nuevo.monto_vales_cxc) || 0, fecha_nacimiento: nuevo.fecha_nacimiento || undefined,
      fecha_inicio_contrato: nuevo.fecha_inicio_contrato || undefined, fecha_fin_contrato: nuevo.fecha_fin_contrato || undefined,
      cedula: nuevo.cedula.trim() || undefined, cuenta_bancaria: nuevo.cuenta_bancaria.trim() || undefined, banco: nuevo.banco,
      tipo_jornada: nuevo.tipo_jornada, horas_jornada_parcial: nuevo.tipo_jornada === "Parcial" ? (parseInt(nuevo.horas_jornada_parcial, 10) || 0) : undefined, estado: "Activo"
    };

    if (setEmpleados) {
      setEmpleados([...empleados, creado]);
      setSelectedEmpleadoId(creado.id_reloj);
      setShowAltaForm(false);
      setNuevo({
        id_reloj: "", nombre: "", cargo: "", sucursal_principal: "Farma Tania I", sucursal_secundaria: "Ninguna", sueldo_base: "27489.57",
        exento_ponche: false, horas_extras_fijas: false, monto_vales_cxc: "0", fecha_nacimiento: "", fecha_inicio_contrato: "2026-01-01",
        fecha_fin_contrato: "", cedula: "", cuenta_bancaria: "", banco: "Banreservas", tipo_jornada: "Completa", horas_jornada_parcial: "8"
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
        horas_jornada_parcial: formFicha.tipo_jornada === "Parcial" ? (parseInt(String(formFicha.horas_jornada_parcial), 10) || 0) : undefined,
        sucursal_secundaria: formFicha.sucursal_secundaria === "Ninguna" ? undefined : formFicha.sucursal_secundaria
      };

      const loteActualizado = empleados.map(e => e.id_reloj === selectedEmpleadoId ? { ...e, ...fichaFormateada } as Colaborador : e);
      setEmpleados(loteActualizado);
      setIsEditing(false);
      alert("✅ Ficha de empleado actualizada.");
    }
  };

  // --- MOTOR FILTRADO AVANZADO ---
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

  // --- MOTOR DE AGRUPACIÓN DINÁMICA ---
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

  const cardClasses = "bg-white border border-[#E5E7EB] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] font-sans";
  const inputClasses = "w-full pl-9 pr-3.5 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-xs outline-none focus:bg-white focus:border-[#3B82F6] transition-all text-[#1F2937] font-sans disabled:opacity-70";
  const selectClasses = "w-full pl-9 pr-8 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-xs font-medium outline-none cursor-pointer focus:bg-white focus:border-[#3B82F6] transition-all text-[#1F2937] font-sans appearance-none disabled:opacity-70";

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 items-start font-sans text-[#111827]">
      
      {/* SECCIÓN IZQUIERDA */}
      <div className="flex flex-col gap-5 min-w-0">
        
        {/* INDICADORES TOP */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`${cardClasses} p-4 bg-gradient-to-br from-slate-50 to-white flex items-center justify-between`}>
            <div>
              <span className="text-[10px] font-bold text-[#6B7280] uppercase block">Plantilla Total</span>
              <span className="text-base font-extrabold text-slate-900 font-mono mt-0.5">{metricasGlobales.activos} Empleados</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-800"><Users className="w-4 h-4" /></div>
          </div>
          <div className={`${cardClasses} p-4 bg-gradient-to-br from-amber-50/40 to-white flex items-center justify-between`}>
            <div>
              <span className="text-[10px] font-bold text-[#6B7280] uppercase block">Exentos Ponche</span>
              <span className="text-base font-extrabold text-amber-600 font-mono mt-0.5">{metricasGlobales.exentos} Colabs.</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-amber-500"><ShieldCheck className="w-4 h-4" /></div>
          </div>
          <div className={`${cardClasses} p-4 bg-gradient-to-br from-emerald-50/40 to-white flex items-center justify-between`}>
            <div>
              <span className="text-[10px] font-bold text-[#6B7280] uppercase block">Horas Extras</span>
              <span className="text-base font-extrabold text-emerald-600 font-mono mt-0.5">{metricasGlobales.conHorasExtras} Contratos</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500"><Clock className="w-4 h-4" /></div>
          </div>
          <div className={`${cardClasses} p-4 bg-gradient-to-br from-blue-50/40 to-white flex items-center justify-between`}>
            <div>
              <span className="text-[10px] font-bold text-[#6B7280] uppercase block">Nómina Bruta Mensual</span>
              <span className="text-sm font-extrabold text-blue-600 font-mono mt-0.5">{formatMoneda(metricasGlobales.nominaTeoricaMensual)}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><DollarSign className="w-4 h-4" /></div>
          </div>
        </div>

        {/* BARRA DE BÚSQUEDA Y ALTA */}
        <div className={`${cardClasses} p-4 flex flex-col sm:flex-row gap-3.5 items-center justify-between`}>
          <div className="relative w-full sm:w-72">
            <span className="absolute left-3 top-2.5 text-[#9CA3AF] pointer-events-none"><Search className="w-4 h-4" /></span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, cargo, ID, cédula..." className={inputClasses} />
          </div>

          <div className="flex gap-2 w-full sm:w-auto justify-end items-center">
            <div className="relative min-w-[150px]">
              <span className="absolute left-3 top-2.5 text-[#9CA3AF] pointer-events-none"><Layers className="w-4 h-4" /></span>
              <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)} className={`${selectClasses} text-slate-800 font-bold bg-slate-50`}>
                <option value="Ninguno">❌ SIN AGRUPAR</option>
                <option value="sucursal">📂 AGRUPAR POR SUCURSAL</option>
                <option value="cargo">📂 AGRUPAR POR PUESTO</option>
                <option value="jornada">📂 AGRUPAR POR JORNADA</option>
              </select>
            </div>
            
            <button 
              type="button" 
              onClick={() => { setShowAltaForm(!showAltaForm); setIsEditing(false); }}
              className={`text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-sm flex items-center gap-1.5 ${showAltaForm ? "bg-red-600 text-white" : "bg-slate-900 text-white"}`}
            >
              {showAltaForm ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {showAltaForm ? "Cancelar Alta" : "Nuevo Ingreso"}
            </button>
          </div>
        </div>

        {/* PANEL DE FILTROS AVANZADOS */}
        <div className={`${cardClasses} p-4 bg-gradient-to-r from-slate-50/50 to-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3`}>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-[#9CA3AF] pointer-events-none"><MapPin className="w-3.5 h-3.5" /></span>
            <select value={filterSucursal} onChange={(e) => setFilterSucursal(e.target.value)} className={selectClasses}>
              <option value="Todos">Ubicación: Todas</option>
              {SUCURSALES_DISPONIBLES?.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-2.5 text-[#9CA3AF] pointer-events-none"><Briefcase className="w-3.5 h-3.5" /></span>
            <select value={filterJornada} onChange={(e) => setFilterJornada(e.target.value)} className={selectClasses}>
              <option value="Todos">Régimen: Todos</option>
              <option value="Completa">Jornada Completa</option>
              <option value="Parcial">Jornada Parcial</option>
            </select>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-2.5 text-[#9CA3AF] pointer-events-none"><Clock className="w-3.5 h-3.5" /></span>
            <select value={filterPonche} onChange={(e) => setFilterPonche(e.target.value)} className={selectClasses}>
              <option value="Todos">Reloj: Todos</option>
              <option value="Registra">Poncha Obligatorio</option>
              <option value="Exento">Exento de Ponches</option>
            </select>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-2.5 text-[#9CA3AF] pointer-events-none"><SlidersHorizontal className="w-3.5 h-3.5" /></span>
            <select value={filterExtras} onChange={(e) => setFilterExtras(e.target.value)} className={selectClasses}>
              <option value="Todos">Horas Extras: Todas</option>
              <option value="Autorizadas">H.E. Habilitadas</option>
              <option value="No Autorizadas">Sin Horas Extras</option>
            </select>
          </div>
        </div>

        {/* TABLA MAESTRA CON SOPORTE DE AGRUPACIÓN */}
        <div className={`${cardClasses} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm table-fixed min-w-[1100px]">
              <thead>
                <tr className="bg-[#F9FAFB] text-[10px] font-bold text-[#6B7280] uppercase tracking-wider border-b border-[#E5E7EB] h-12">
                  <th className="p-3 pl-5 w-20">ID Reloj</th>
                  <th className="p-3 w-60">Colaborador / Puesto</th>
                  <th className="p-3 w-32 text-center">Fecha Inicio</th>
                  <th className="p-3 w-32 text-center">Fecha Fin</th>
                  <th className="p-3 w-20 text-center">Edad</th>
                  <th className="p-3 w-52">Sucursales</th>
                  <th className="p-3 text-right w-32">Sueldo Base</th>
                  <th className="p-3 text-center w-36">Jornada / Ponche</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-[#1F2937]">
                {empleadosAgrupados.map((grupo) => (
                  <React.Fragment key={grupo.key}>
                    {groupBy !== "Ninguno" && (
                      <tr className="bg-slate-100/70 h-8 font-sans">
                        <td colSpan={8} className="p-2 pl-5 text-[10px] font-extrabold text-slate-700 uppercase tracking-widest bg-slate-50 border-y border-slate-200">
                          {grupo.key} <span className="text-blue-600 font-mono ml-1.5 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100">{grupo.list.length} Colaboradores</span>
                        </td>
                      </tr>
                    )}
                    
                    {grupo.list.length === 0 ? (
                      <tr className="h-12"><td colSpan={8} className="p-3 text-center text-slate-400 italic text-xs">Ningún colaborador coincide con los filtros aplicados en este bloque.</td></tr>
                    ) : (
                      grupo.list.map((n, index) => {
                        const isSelected = !showAltaForm && selectedEmpleadoId === n.id_reloj;
                        const edadNum = calcularEdadNum(n.fecha_nacimiento);
                        
                        return (
                          <tr 
                            key={`${n.id_reloj}-${index}`} 
                            onClick={() => { setSelectedEmpleadoId(n.id_reloj); setShowAltaForm(false); }}
                            className={`h-14 cursor-pointer transition-colors ${isSelected ? "bg-[#EFF6FF]/60 font-medium" : "hover:bg-white hover:bg-[#F9FAFB]"}`}
                          >
                            <td className="p-3 pl-5 font-mono font-bold text-slate-400 text-xs">{n.id_reloj}</td>
                            <td className="p-3">
                              <div className="font-bold text-xs uppercase tracking-wide text-slate-900">{n.nombre.toUpperCase()}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{n.cedula || "—"}</div>
                            </td>
                            <td className="p-3 text-center font-mono text-xs text-slate-600">{n.fecha_inicio_contrato || "—"}</td>
                            <td className="p-3 text-center font-mono text-xs text-slate-600">
                              {n.fecha_fin_contrato ? <span className="text-amber-600">{n.fecha_fin_contrato}</span> : <span className="text-slate-400">Indefinido</span>}
                            </td>
                            <td className="p-3 text-center font-mono text-xs font-semibold text-slate-700">{edadNum !== null ? `${edadNum}ª` : "—"}</td>
                            
                            <td className="p-3 text-[11px] text-slate-600">
                              <div className="font-semibold uppercase text-slate-800 truncate">{n.sucursal_principal}</div>
                              {n.sucursal_secundaria && n.sucursal_secundaria !== "Ninguna" && (
                                <div className="text-[9px] text-blue-600 font-medium mt-0.5 truncate">SEC: {n.sucursal_secundaria.toUpperCase()}</div>
                              )}
                            </td>

                            <td className="p-3 text-right font-mono text-xs font-bold text-slate-700">{formatMoneda(n.sueldo_base)}</td>
                            
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {n.tipo_jornada === "Parcial" && (
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase border bg-purple-50 border-purple-100 text-purple-700">
                                    {n.horas_jornada_parcial}h
                                  </span>
                                )}
                                {!n.exento_ponche && (
                                  <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" title="Requiere marcas de reloj biométrico" />
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

      {/* PANEL EXPEDIENTE LATERAL CONMUTABLE */}
      <div className={`${cardClasses} p-5 shadow-lg sticky top-5 max-h-[85vh] overflow-y-auto`}>
        {showAltaForm ? (
          <form onSubmit={ejecutarAlta} className="flex flex-col gap-3.5 text-xs">
            <div className="flex items-center gap-2 border-b pb-3 text-slate-900 font-bold">
              <UserPlus className="w-5 h-5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider">Alta de Colaborador</h4>
                <span className="text-[10px] text-[#6B7280] font-normal block">Ingreso de perfil al sistema biométrico</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1 col-span-1">
                <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider pl-1">ID Reloj</label>
                <input type="text" required placeholder="Ej: 45" className={`${inputClasses} !pl-3.5 font-mono font-bold`} value={nuevo.id_reloj} onChange={e => setNuevo({...nuevo, id_reloj: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider pl-1">Nombre Completo</label>
                <input type="text" required placeholder="Ej: JUAN PÉREZ" className={`${inputClasses} !pl-3.5 uppercase`} value={nuevo.nombre} onChange={e => setNuevo({...nuevo, nombre: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider pl-1">Cédula Identidad</label>
                <input type="text" placeholder="001-0000000-0" className={`${inputClasses} !pl-3.5 font-mono`} value={nuevo.cedula} onChange={e => setNuevo({...nuevo, cedula: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider pl-1">Cargo / Puesto</label>
                <input type="text" required placeholder="Ej: Auxiliar" className={`${inputClasses} !pl-3.5`} value={nuevo.cargo} onChange={e => setNuevo({...nuevo, cargo: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider pl-1">Sucursal Principal</label>
                <select value={nuevo.sucursal_principal} onChange={e => setNuevo({...nuevo, sucursal_principal: e.target.value})} className={`${selectClasses} !pl-3.5 bg-white`}>
                  {SUCURSALES_DISPONIBLES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider pl-1">Sucursal Secundaria</label>
                <select value={nuevo.sucursal_secundaria} onChange={e => setNuevo({...nuevo, sucursal_secundaria: e.target.value})} className={`${selectClasses} !pl-3.5 bg-white`}>
                  <option value="Ninguna">NINGUNA</option>
                  {SUCURSALES_DISPONIBLES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-slate-50 border p-3 rounded-xl flex flex-col gap-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider border-b pb-1">Datos de Dispersión de Nómina</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider">Banco Receptor</label>
                  <select value={nuevo.banco} onChange={e => setNuevo({...nuevo, banco: e.target.value})} className={`${selectClasses} !pl-3.5 bg-white`}>
                    <option value="Banreservas">Banreservas</option>
                    <option value="Banco Popular">Banco Popular</option>
                    <option value="Banco BHD">Banco BHD</option>
                    <option value="Scotiabank">Scotiabank</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider">No. Cuenta Bancaria</label>
                  <input type="text" placeholder="9600000000" className={`${inputClasses} !pl-3.5 font-mono`} value={nuevo.cuenta_bancaria} onChange={e => setNuevo({...nuevo, cuenta_bancaria: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="bg-purple-50/40 border border-purple-100 p-3 rounded-xl flex flex-col gap-2">
              <span className="text-[9px] font-bold text-purple-700 uppercase tracking-wider border-b border-purple-100 pb-1">Régimen Horario Diario</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-purple-600 uppercase tracking-wider">Tipo de Régimen</label>
                  <select value={nuevo.tipo_jornada} onChange={e => setNuevo({...nuevo, tipo_jornada: e.target.value as any})} className={`${selectClasses} !pl-3.5 bg-white`}>
                    <option value="Completa">Jornada Completa</option>
                    <option value="Parcial">Horas Parciales</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-purple-600 uppercase tracking-wider">Horas Diarias</label>
                  <input type="number" min="1" max="12" disabled={nuevo.tipo_jornada === "Completa"} className={`${inputClasses} !pl-3.5 font-mono disabled:opacity-40 bg-white`} value={nuevo.tipo_jornada === "Completa" ? "8" : nuevo.horas_jornada_parcial} onChange={e => setNuevo({...nuevo, horas_jornada_parcial: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider">F. Nacimiento</label>
                <input type="date" className={`${inputClasses} !pl-2 font-mono`} value={nuevo.fecha_nacimiento} onChange={e => setNuevo({...nuevo, fecha_nacimiento: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider">Inicio Contrato</label>
                <input type="date" required className={`${inputClasses} !pl-2 font-mono`} value={nuevo.fecha_inicio_contrato} onChange={e => setNuevo({...nuevo, fecha_inicio_contrato: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider">Fin Contrato</label>
                <input type="date" className={`${inputClasses} !pl-2 font-mono`} value={nuevo.fecha_fin_contrato} onChange={e => setNuevo({...nuevo, fecha_fin_contrato: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider">Sueldo Mensual</label>
                <input type="number" step="0.01" required className={`${inputClasses} !pl-3 font-mono font-bold`} value={nuevo.sueldo_base} onChange={e => setNuevo({...nuevo, sueldo_base: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider">CxC Base Maestro</label>
                <input type="number" step="0.01" className={`${inputClasses} !pl-3 font-mono`} value={nuevo.monto_vales_cxc} onChange={e => setNuevo({...nuevo, monto_vales_cxc: e.target.value})} />
              </div>
            </div>

            <div className="bg-white border p-3 rounded-xl flex flex-col gap-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" className="w-4 h-4 rounded accent-slate-900" checked={nuevo.exento_ponche} onChange={e => setNuevo({...nuevo, exento_ponche: e.target.checked})} />
                <span className="font-bold text-slate-800">Exento de Reloj Biométrico</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer select-none border-t pt-2.5">
                <input type="checkbox" className="w-4 h-4 rounded accent-slate-900" checked={nuevo.horas_extras_fijas} onChange={e => setNuevo({...nuevo, horas_extras_fijas: e.target.checked})} />
                <span className="font-bold text-slate-800">Habilitar Horas Extras</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button type="button" onClick={() => setShowAltaForm(false)} className="border text-[#6B7280] font-bold py-2 rounded-lg text-center hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="bg-emerald-600 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-1 shadow-sm"><Save className="w-4 h-4" /> Guardar Alta</button>
            </div>
          </form>
        ) : empSel ? (
          <form onSubmit={guardarFicha} className="flex flex-col gap-3.5 text-xs">
            <div className="border-b border-[#E5E7EB] pb-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-black shadow-md">
                {empSel.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-bold text-[#3B82F6] uppercase block">Expediente de Personal</span>
                <h4 className="font-bold text-[#111827] text-xs truncate uppercase leading-tight">{empSel.nombre}</h4>
                <p className="text-[10px] text-[#6B7280] font-mono mt-0.5">
                  ID: {empSel.id_reloj} · Edad: <strong className="text-slate-800 font-mono">{calcularEdadNum(empSel.fecha_nacimiento) !== null ? `${calcularEdadNum(empSel.fecha_nacimiento)} años` : "—"}</strong>
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              {!isEditing ? (
                <button type="button" onClick={() => setIsEditing(true)} className="border border-[#E5E7EB] text-[#1F2937] hover:bg-[#F9FAFB] font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs shadow-sm w-full justify-center">
                  <Pencil className="w-3.5 h-3.5" /> Modificar Parámetros de Ficha
                </button>
              ) : (
                <div className="flex gap-2 w-full">
                  <button type="button" onClick={() => setIsEditing(false)} className="border text-[#6B7280] px-3.5 py-1.5 rounded-lg text-xs flex-1">Cancelar</button>
                  <button type="submit" className="bg-blue-600 text-white font-bold px-4 py-1.5 rounded-lg flex items-center gap-1.5 text-xs shadow-sm flex-1 justify-center"><Save className="w-3.5 h-3.5" /> Guardar Cambios</button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider pl-1">Cédula</label>
                <input type="text" disabled={!isEditing} className={`${inputClasses} font-mono`} value={isEditing ? (formFicha.cedula ?? "") : (empSel.cedula ?? "")} onChange={e => setFormFicha({...formFicha, cedula: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider pl-1">Nombre Completo</label>
                <input type="text" disabled={!isEditing} className={`${inputClasses} uppercase`} value={isEditing ? formFicha.nombre : empSel.nombre} onChange={e => setFormFicha({...formFicha, nombre: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider pl-1">Puesto / Cargo</label>
                <input type="text" disabled={!isEditing} className={inputClasses} value={isEditing ? formFicha.cargo : empSel.cargo} onChange={e => setFormFicha({...formFicha, cargo: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider pl-1">Fecha Nacimiento</label>
                <input type="date" disabled={!isEditing} className={`${inputClasses} font-mono`} value={isEditing ? (formFicha.fecha_nacimiento ?? "") : (empSel.fecha_nacimiento ?? "")} onChange={e => setFormFicha({...formFicha, fecha_nacimiento: e.target.value})} />
              </div>
            </div>

            {/* 🛡️ CORREGIDO AQUÍ: Renderizado del selector de sucursales con mapeo limpio sin variables rotas */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider pl-1">Sucursal Principal</label>
                <select disabled={!isEditing} value={isEditing ? formFicha.sucursal_principal : empSel.sucursal_principal} onChange={e => setFormFicha({...formFicha, sucursal_principal: e.target.value})} className={selectClasses}>
                  {SUCURSALES_DISPONIBLES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider pl-1">Sucursal Secundaria</label>
                <select disabled={!isEditing} value={isEditing ? (formFicha.sucursal_secundaria ?? "Ninguna") : (empSel.sucursal_secundaria ?? "Ninguna")} onChange={e => setFormFicha({...formFicha, sucursal_secundaria: e.target.value})} className={selectClasses}>
                  <option value="Ninguna">NINGUNA</option>
                  {SUCURSALES_DISPONIBLES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-slate-50 border p-3 rounded-xl flex flex-col gap-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block border-b pb-1">Cuenta de Depósito Quincenal</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider">Entidad Financiera</label>
                  <select disabled={!isEditing} value={isEditing ? formFicha.banco : empSel.banco} onChange={e => setFormFicha({...formFicha, banco: e.target.value})} className={selectClasses}>
                    <option value="Banreservas">Banreservas</option>
                    <option value="Banco Popular">Banco Popular</option>
                    <option value="Banco BHD">Banco BHD</option>
                    <option value="Scotiabank">Scotiabank</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider">Número de Cuenta</label>
                  <input type="text" disabled={!isEditing} className={`${inputClasses} font-mono bg-white`} value={isEditing ? (formFicha.cuenta_bancaria ?? "") : (empSel.cuenta_bancaria ?? "")} onChange={e => setFormFicha({...formFicha, cuenta_bancaria: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="bg-purple-50/40 border border-purple-100 p-3 rounded-xl flex flex-col gap-2">
              <span className="text-[9px] font-bold text-purple-700 uppercase tracking-wider block border-b border-purple-100 pb-1">Cómputo Horario Legal Diario</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-purple-600 uppercase tracking-wider">Régimen Laboral</label>
                  <select disabled={!isEditing} value={isEditing ? formFicha.tipo_jornada : (empSel.tipo_jornada ?? "Completa")} onChange={e => setFormFicha({...formFicha, tipo_jornada: e.target.value as any})} className={selectClasses}>
                    <option value="Completa">Completa (8h/día)</option>
                    <option value="Parcial">Parcial (Por Horas)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-purple-600 uppercase tracking-wider">Horas Diarias</label>
                  <input type="number" min="1" max="12" disabled={!isEditing || (isEditing ? formFicha.tipo_jornada === "Completa" : empSel.tipo_jornada !== "Parcial")} className={`${inputClasses} font-mono bg-white`} value={isEditing ? (formFicha.tipo_jornada === "Completa" ? "8" : (formFicha.horas_jornada_parcial ?? "")) : (empSel.tipo_jornada === "Parcial" ? (empSel.horas_jornada_parcial ?? "") : "8")} onChange={e => setFormFicha({...formFicha, horas_jornada_parcial: parseInt(e.target.value, 10) || 0})} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-[#F9FAFB] p-3 rounded-xl border border-[#E5E7EB]">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider">Sueldo Mensual</label>
                <input type="number" step="0.01" disabled={!isEditing} className={`${inputClasses} bg-white font-mono font-bold`} value={isEditing ? (formFicha.sueldo_base ?? 0) : (empSel.sueldo_base ?? 0)} onChange={e => setFormFicha({...formFicha, sueldo_base: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider">Inicio Contrato</label>
                <input type="date" disabled={!isEditing} className={`${inputClasses} bg-white font-mono`} value={isEditing ? (formFicha.fecha_inicio_contrato ?? "") : (empSel.fecha_inicio_contrato ?? "")} onChange={e => setFormFicha({...formFicha, fecha_inicio_contrato: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider">Fin Contrato</label>
                <input type="date" disabled={!isEditing} className={`${inputClasses} bg-white font-mono`} value={isEditing ? (formFicha.fecha_fin_contrato ?? "") : (empSel.fecha_fin_contrato ?? "")} onChange={e => setFormFicha({...formFicha, fecha_fin_contrato: e.target.value})} />
              </div>
            </div>

            <div className="border-t pt-2 flex flex-col gap-2.5">
              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border cursor-pointer select-none">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Exención de Asistencia</span>
                  <span className="text-[10px] text-slate-400 font-normal">Ignorar marcas del ponche</span>
                </div>
                <input type="checkbox" disabled={!isEditing} className="w-4 h-4 accent-slate-900" checked={isEditing ? formFicha.exento_ponche : empSel.exento_ponche} onChange={e => setFormFicha({...formFicha, exento_ponche: e.target.checked})} />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border cursor-pointer select-none">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Aprobación de Horas Extras</span>
                  <span className="text-[10px] text-slate-400 font-normal">Habilitar factor 1.35x quincenal</span>
                </div>
                <input type="checkbox" disabled={!isEditing} className="w-4 h-4 accent-slate-900" checked={isEditing ? formFicha.horas_extras_fijas : empSel.horas_extras_fijas} onChange={e => setFormFicha({...formFicha, horas_extras_fijas: e.target.checked})} />
              </label>
            </div>
          </form>
        ) : (
          <div className="text-center italic text-[#6B7280] py-16 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">Seleccione un colaborador del maestro para desplegar su expediente completo.</div>
        )}
      </div>

    </div>
  );
}