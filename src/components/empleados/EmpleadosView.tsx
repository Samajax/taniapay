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
  ShieldCheck 
} from "lucide-react";

interface Colaborador {
  id_reloj: string;
  nombre: string;
  cargo: string;
  sucursal_principal: string;
  sueldo_base: number;
  exento_ponche: boolean;
  horas_extras_fijas: boolean;
  monto_vales_cxc?: number;
  estado?: "Activo" | "Inactivo";
}

// 🛡️ SOLUCIÓN AL ERROR DE COMPILACIÓN: Blindaje absoluto contra valores nulos o indefinidos
const formatMoneda = (val: number) => {
  const numeroLimpio = Number(val || 0);
  return "RD$ " + numeroLimpio.toLocaleString("es-DO", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

export default function EmpleadosView() {
  const { empleados = [], setEmpleados } = usePay();

  // --- ESTADOS DE FILTRADO Y SELECCIÓN ---
  const [search, setSearch] = useState("");
  const [filterSucursal, setFilterSucursal] = useState("Todos");
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string>("");
  const [showAltaForm, setShowAltaForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Formulario operativo reactivo para Altas
  const [nuevo, setNuevo] = useState({
    id_reloj: "",
    nombre: "",
    cargo: "",
    sucursal_principal: "Farma Tania I",
    sueldo_base: "27489.57",
    exento_ponche: false,
    horas_extras_fijas: false,
    monto_vales_cxc: "0"
  });

  const [formFicha, setFormFicha] = useState<Partial<Colaborador>>({});

  const empSel = useMemo(() => empleados.find(e => e.id_reloj === selectedEmpleadoId), [empleados, selectedEmpleadoId]);

  // Selección automática del primer colaborador al cargar la pantalla
  useEffect(() => {
    if (empleados.length > 0 && !selectedEmpleadoId) {
      setSelectedEmpleadoId(empleados[0].id_reloj);
    }
  }, [empleados, selectedEmpleadoId]);

  // Sincronizar el expediente lateral con el empleado seleccionado
  useEffect(() => {
    if (empSel) {
      setFormFicha({ ...empSel });
      setIsEditing(false);
    }
  }, [selectedEmpleadoId, empSel]);

  // --- CONTADORES DEL ESTADO MAESTRO DE PERSONAL ---
  const metricasGlobales = useMemo(() => {
    let activos = 0;
    let exentos = 0;
    let conHorasExtras = 0;
    let nominaTeoricaMensual = 0;

    empleados.forEach(e => {
      activos++;
      if (e.exento_ponche) exentos++;
      if (e.horas_extras_fijas) conHorasExtras++;
      nominaTeoricaMensual += (Number(e.sueldo_base) || 0);
    });

    return { activos, exentos, conHorasExtras, nominaTeoricaMensual };
  }, [empleados]);

  // --- PERSISTENCIA: ALTA DE NUEVO COLABORADOR INTERCONECTADO ---
  const ejecutarAlta = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nuevo.id_reloj || !nuevo.nombre || !nuevo.cargo) {
      return alert("❌ Error: El ID, Nombre y Cargo son campos estrictamente obligatorios.");
    }

    const existeId = empleados.some(em => em.id_reloj === nuevo.id_reloj.trim());
    if (existeId) {
      return alert(`⚠️ Conflicto: El ID de Reloj [${nuevo.id_reloj}] ya está asignado a otro colaborador.`);
    }

    const creado: Colaborador = {
      id_reloj: nuevo.id_reloj.trim(),
      nombre: nuevo.nombre.trim(),
      cargo: nuevo.cargo.trim(),
      sucursal_principal: nuevo.sucursal_principal,
      sueldo_base: parseFloat(nuevo.sueldo_base) || 0,
      exento_ponche: nuevo.exento_ponche,
      horas_extras_fijas: nuevo.horas_extras_fijas,
      monto_vales_cxc: parseFloat(nuevo.monto_vales_cxc) || 0,
      estado: "Activo"
    };

    if (setEmpleados) {
      setEmpleados([...empleados, creado]);
      setSelectedEmpleadoId(creado.id_reloj);
      setShowAltaForm(false);
      
      setNuevo({
        id_reloj: "",
        nombre: "",
        cargo: "",
        sucursal_principal: "Farma Tania I",
        sueldo_base: "27489.57",
        exento_ponche: false,
        horas_extras_fijas: false,
        monto_vales_cxc: "0"
      });
      alert("✅ Colaborador registrado globalmente. Nómina y Ponches ya reconocen sus nuevas reglas contractuales.");
    }
  };

  // --- PERSISTENCIA: ACTUALIZACIÓN DE EXPEDIENTE ---
  const guardarFicha = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmpleadoId && setEmpleados) {
      const { ...formFichaClean } = formFicha;
      
      const fichaFormateada = {
        ...formFichaClean,
        sueldo_base: parseFloat(String(formFicha.sueldo_base)) || 0,
        monto_vales_cxc: parseFloat(String(formFicha.monto_vales_cxc)) || 0,
      };

      const loteActualizado = empleados.map(e => e.id_reloj === selectedEmpleadoId ? { ...e, ...fichaFormateada } : e);
      setEmpleados(loteActualizado);
      setIsEditing(false);
      alert("✅ Parámetros contractuales actualizados en tiempo real para todo el sistema.");
    }
  };

  // --- FILTRADO DE LA TABLA MAESTRA ---
  const empleadosFiltrados = useMemo(() => {
    return empleados.filter(e => {
      const matchSearch = e.nombre.toLowerCase().includes(search.toLowerCase()) || e.id_reloj.includes(search) || e.cargo.toLowerCase().includes(search.toLowerCase());
      const matchSucursal = filterSucursal === "Todos" || e.sucursal_principal === filterSucursal;
      return matchSearch && matchSucursal;
    });
  }, [empleados, search, filterSucursal]);

  const cardClasses = "bg-white border border-[#E5E7EB] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] font-sans";
  const inputClasses = "w-full pl-9 pr-3.5 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-xs outline-none focus:bg-white focus:border-[#3B82F6] transition-all text-[#1F2937] font-sans";
  const selectClasses = "w-full pl-9 pr-8 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-xs font-medium outline-none cursor-pointer focus:bg-white focus:border-[#3B82F6] transition-all text-[#1F2937] font-sans appearance-none";

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start font-sans text-[#111827]">
      
      {/* SECCIÓN IZQUIERDA: INDICADORES Y MAESTRO */}
      <div className="flex flex-col gap-5 min-w-0">
        
        {/* INDICADORES TOP */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`${cardClasses} p-4 bg-gradient-to-br from-slate-50 to-white flex items-center justify-between`}>
            <div>
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Plantilla Total</span>
              <span className="text-base font-extrabold text-slate-900 font-mono mt-0.5">{metricasGlobales.activos} Empleados</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-800"><Users className="w-4 h-4" /></div>
          </div>
          <div className={`${cardClasses} p-4 bg-gradient-to-br from-amber-50/40 to-white flex items-center justify-between`}>
            <div>
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Exentos Ponche</span>
              <span className="text-base font-extrabold text-amber-600 font-mono mt-0.5">{metricasGlobales.exentos} Colabs.</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-amber-500"><ShieldCheck className="w-4 h-4" /></div>
          </div>
          <div className={`${cardClasses} p-4 bg-gradient-to-br from-emerald-50/40 to-white flex items-center justify-between`}>
            <div>
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Horas Extras Fijadas</span>
              <span className="text-base font-extrabold text-emerald-600 font-mono mt-0.5">{metricasGlobales.conHorasExtras} Contratos</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500"><Clock className="w-4 h-4" /></div>
          </div>
          <div className={`${cardClasses} p-4 bg-gradient-to-br from-blue-50/40 to-white flex items-center justify-between`}>
            <div>
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Nómina Bruta Mensual</span>
              <span className="text-sm font-extrabold text-blue-600 font-mono mt-0.5">{formatMoneda(metricasGlobales.nominaTeoricaMensual)}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><DollarSign className="w-4 h-4" /></div>
          </div>
        </div>

        {/* BARRA DE HERRAMIENTAS */}
        <div className={`${cardClasses} p-4 flex flex-col sm:flex-row gap-3.5 items-center justify-between`}>
          <div className="relative w-full sm:w-72">
            <span className="absolute left-3 top-2.5 text-[#9CA3AF] pointer-events-none"><Search className="w-4 h-4" /></span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, cargo o ID..." className={inputClasses} />
          </div>

          <div className="flex gap-2 w-full sm:w-auto justify-end items-center">
            <div className="relative min-w-[160px]">
              <span className="absolute left-3 top-2.5 text-[#9CA3AF] pointer-events-none"><MapPin className="w-4 h-4" /></span>
              <select value={filterSucursal} onChange={(e) => setFilterSucursal(e.target.value)} className={selectClasses}>
                <option value="Todos">Todas las Sucursales</option>
                {SUCURSALES_DISPONIBLES?.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
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

        {/* TABLA PRINCIPAL DE COLABORADORES */}
        <div className={`${cardClasses} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm table-fixed min-w-[900px]">
              <thead>
                <tr className="bg-[#F9FAFB] text-[10px] font-bold text-[#6B7280] uppercase tracking-wider border-b border-[#E5E7EB] h-12">
                  <th className="p-3 pl-5 w-20">ID Reloj</th>
                  <th className="p-3 w-64">Colaborador / Puesto</th>
                  <th className="p-3 w-48">Sucursal Principal</th>
                  <th className="p-3 text-right w-36">Sueldo Base</th>
                  <th className="p-3 text-center w-32">Parámetros</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-[#1F2937]">
                {empleadosFiltrados.map((n, index) => {
                  const isSelected = !showAltaForm && selectedEmpleadoId === n.id_reloj;
                  return (
                    <tr 
                      key={`${n.id_reloj}-${index}`} 
                      onClick={() => { setSelectedEmpleadoId(n.id_reloj); setShowAltaForm(false); }}
                      className={`h-14 cursor-pointer transition-colors ${isSelected ? "bg-[#EFF6FF]/60 font-medium" : "hover:bg-[#F9FAFB]"}`}
                    >
                      <td className="p-3 pl-5 font-mono font-bold text-slate-400 text-xs">{n.id_reloj}</td>
                      <td className="p-3">
                        <div className="font-bold text-xs uppercase tracking-wide text-slate-900">{n.nombre.toUpperCase()}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{n.cargo}</div>
                      </td>
                      <td className="p-3 text-xs uppercase text-slate-500 font-medium">{n.sucursal_principal}</td>
                      {/* 🛡️ CONSUMO PROTEGIDO AQUÍ */}
                      <td className="p-3 text-right font-mono text-xs font-bold text-slate-700">{formatMoneda(n.sueldo_base)}</td>
                      <td className="p-3 text-center">
                        <div className="inline-flex gap-1.5">
                          {n.exento_ponche && <span className="bg-amber-50 border border-amber-200 text-[9px] text-amber-700 font-bold px-1.5 py-0.5 rounded uppercase">Exento</span>}
                          {n.horas_extras_fijas && <span className="bg-emerald-50 border border-emerald-200 text-[9px] text-emerald-700 font-bold px-1.5 py-0.5 rounded uppercase">H.E.</span>}
                          {!n.exento_ponche && !n.horas_extras_fijas && <span className="text-slate-300 text-xs font-mono">—</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PANEL EXPEDIENTE LATERAL CONMUTABLE */}
      <div className={`${cardClasses} p-5 shadow-lg sticky top-5`}>
        {showAltaForm ? (
          <form onSubmit={ejecutarAlta} className="flex flex-col gap-4 text-xs">
            <div className="flex items-center gap-2 border-b pb-3.5 text-slate-900 font-bold">
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

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider pl-1">Cargo u Ocupación</label>
              <input type="text" required placeholder="Ej: Auxiliar de Farmacia" className={`${inputClasses} !pl-3.5`} value={nuevo.cargo} onChange={e => setNuevo({...nuevo, cargo: e.target.value})} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider pl-1">Sucursal de Asignación</label>
              <select value={nuevo.sucursal_principal} onChange={e => setNuevo({...nuevo, sucursal_principal: e.target.value})} className={`${selectClasses} !pl-3.5 bg-white`}>
                {SUCURSALES_DISPONIBLES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider pl-1">Sueldo Base Mensual</label>
                <input type="number" step="0.01" required className={`${inputClasses} !pl-3.5 font-mono font-bold`} value={nuevo.sueldo_base} onChange={e => setNuevo({...nuevo, sueldo_base: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider pl-1">CxC Base Maestro</label>
                <input type="number" step="0.01" className={`${inputClasses} !pl-3.5 font-mono`} value={nuevo.monto_vales_cxc} onChange={e => setNuevo({...nuevo, monto_vales_cxc: e.target.value})} />
              </div>
            </div>

            <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-3.5 rounded-xl flex flex-col gap-3 mt-1">
              <span className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider block border-b pb-1">Cláusulas de Control</span>
              
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" className="w-4 h-4 border-[#E5E7EB] rounded accent-slate-900" checked={nuevo.exento_ponche} onChange={e => setNuevo({...nuevo, exento_ponche: e.target.checked})} />
                <div>
                  <span className="font-bold block text-slate-800">Exento de Reloj Biométrico</span>
                  <span className="text-[10px] text-slate-400 font-normal">No se le aplicarán descuentos por tardanzas o ausencias.</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none border-t pt-2.5">
                <input type="checkbox" className="w-4 h-4 border-[#E5E7EB] rounded accent-slate-900" checked={nuevo.horas_extras_fijas} onChange={e => setNuevo({...nuevo, horas_extras_fijas: e.target.checked})} />
                <div>
                  <span className="font-bold block text-slate-800">Cálculo de Horas Extras Habilitado</span>
                  <span className="text-[10px] text-slate-400 font-normal">Permite computar el tiempo extra sobre su salida en nómina.</span>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button type="button" onClick={() => setShowAltaForm(false)} className="border border-[#E5E7EB] text-[#6B7280] font-bold py-2 rounded-lg text-center hover:bg-slate-50">Cancelar</button>
              <button type="submit" className="bg-emerald-600 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-1 shadow-sm"><Save className="w-4 h-4" /> Guardar Alta</button>
            </div>
          </form>
        ) : empSel ? (
          /* EXPEDIENTE DETALLADO DE COLABORADOR SELECCIONADO */
          <form onSubmit={guardarFicha} className="flex flex-col gap-4 text-xs">
            <div className="border-b border-[#E5E7EB] pb-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-black shadow-md">
                {empSel.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-bold text-[#3B82F6] uppercase block tracking-wider">Ficha de Empleado</span>
                <h4 className="font-bold text-[#111827] text-xs truncate uppercase leading-tight">{empSel.nombre}</h4>
                <p className="text-[10px] text-[#6B7280] font-mono mt-0.5">ID Reloj: {empSel.id_reloj} · Activo</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              {!isEditing ? (
                <button type="button" onClick={() => setIsEditing(true)} className="border border-[#E5E7EB] text-[#1F2937] hover:bg-[#F9FAFB] font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs shadow-sm w-full justify-center">
                  <Pencil className="w-3.5 h-3.5" /> Editar Parámetros Contractuales
                </button>
              ) : (
                <div className="flex gap-2 w-full">
                  <button type="button" onClick={() => setIsEditing(false)} className="border text-[#6B7280] px-3.5 py-1.5 rounded-lg text-xs flex-1">Cancelar</button>
                  <button type="submit" className="bg-blue-600 text-white font-bold px-4 py-1.5 rounded-lg flex items-center gap-1.5 text-xs shadow-sm flex-1 justify-center"><Save className="w-3.5 h-3.5" /> Guardar Cambios</button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider pl-1">Nombre Completo</label>
              <input type="text" disabled={!isEditing} className={`${inputClasses} uppercase`} value={isEditing ? formFicha.nombre : empSel.nombre} onChange={e => setFormFicha({...formFicha, nombre: e.target.value})} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider pl-1">Puesto / Cargo</label>
              <input type="text" disabled={!isEditing} className={inputClasses} value={isEditing ? formFicha.cargo : empSel.cargo} onChange={e => setFormFicha({...formFicha, cargo: e.target.value})} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider pl-1">Sucursal Operativa</label>
              <select disabled={!isEditing} value={isEditing ? formFicha.sucursal_principal : empSel.sucursal_principal} onChange={e => setFormFicha({...formFicha, sucursal_principal: e.target.value})} className={selectClasses}>
                {SUCURSALES_DISPONIBLES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-[#F9FAFB] p-3 rounded-xl border border-[#E5E7EB]">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider">Sueldo Mensual</label>
                <input type="number" step="0.01" disabled={!isEditing} className={`${inputClasses} bg-white font-mono font-bold`} value={isEditing ? (formFicha.sueldo_base ?? 0) : (empSel.sueldo_base ?? 0)} onChange={e => setFormFicha({...formFicha, sueldo_base: e.target.value})} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider">Monto Vales CxC</label>
                <input type="number" step="0.01" disabled={!isEditing} className={`${inputClasses} bg-white font-mono`} value={isEditing ? (formFicha.monto_vales_cxc ?? 0) : (empSel.monto_vales_cxc ?? 0)} onChange={e => setFormFicha({...formFicha, monto_vales_cxc: e.target.value})} />
              </div>
            </div>

            <div className="border-t pt-3 flex flex-col gap-3">
              <span className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider block">Estado de Reglas Contractuales</span>
              
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Exención de Asistencia</span>
                  <span className="text-[10px] text-slate-400 font-normal">Ignorar marcas del ponche</span>
                </div>
                <input type="checkbox" disabled={!isEditing} className="w-4 h-4 accent-slate-900" checked={isEditing ? formFicha.exento_ponche : empSel.exento_ponche} onChange={e => setFormFicha({...formFicha, exento_ponche: e.target.checked})} />
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Aprobación de Horas Extras</span>
                  <span className="text-[10px] text-slate-400 font-normal">Habilitar factor 1.35x quincenal</span>
                </div>
                <input type="checkbox" disabled={!isEditing} className="w-4 h-4 accent-slate-900" checked={isEditing ? formFicha.horas_extras_fijas : empSel.horas_extras_fijas} onChange={e => setFormFicha({...formFicha, horas_extras_fijas: e.target.checked})} />
              </div>
            </div>
          </form>
        ) : (
          <div className="text-center italic text-[#6B7280] py-16 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">Seleccione un colaborador del maestro para desplegar su expediente completo.</div>
        )}
      </div>

    </div>
  );
}