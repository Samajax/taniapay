"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { usePay } from "@/context/PayContext";
import { AsistenciaRecord, Empleado, SUCURSALES_DISPONIBLES } from "@/data/mockData";
import { 
  Search, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  MapPin, 
  CalendarDays, 
  Activity, 
  Sparkles, 
  Wrench, 
  Save, 
  UserCheck, 
  Palmtree, 
  Stethoscope, 
  Coins, 
  Settings, 
  User,
  Lock,
  ChevronRight,
  ShieldCheck,
  DollarSign,
  Users,
  Edit3,
  CheckCircle,
  X
} from "lucide-react";

// --- INTERFACES DE CONTROL ADAPTADAS ---
interface AsistenciaRefinada extends AsistenciaRecord {
  sucursal_ponche?: string;
  incidencia_detectada?: string;
  nombre_cubre?: string;
  es_feriado?: boolean;
  minutos_inconsistencia: number;
  es_gracia: boolean;
  minutos_gracia: number;
  entrada_normalizada: string;
  salida_normalizada: string;
}

interface EmpleadoAsistenciaGrupal {
  id_reloj: string;
  nombre: string;
  cargo: string;
  sucursal_principal: string;
  exento: boolean;
  totalDescuento: number;
  alertasAcumuladas: Set<string>;
  records: AsistenciaRefinada[];
}

// --- FUNCIONES AUXILIARES GLOBALES ---
const formatMonto = (val: number) => 
  "RD$ " + val.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getAlertaEstilo = (alerta: string): string => {
  const estilos: Record<string, string> = {
    "Irregularidad": "bg-red-50 text-red-600 border-red-200 font-semibold",
    "Ausencia": "bg-rose-50 text-rose-700 border-rose-200 font-bold",
    "Tardanza": "bg-amber-50 text-amber-700 border-amber-200",
    "Vacaciones": "bg-blue-50 text-blue-700 border-blue-200",
    "Licencia Médica": "bg-purple-50 text-purple-700 border-purple-200",
    "Permiso": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "Cobertura": "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium"
  };
  return estilos[alerta] || "bg-slate-50 text-slate-600 border-slate-200";
};

const renderBadgeAlerta = (alerta: string) => {
  if (!alerta) return null; 
  return (
    <span 
      key={alerta}
      className={`px-2 py-0.5 rounded-lg text-[10px] border font-bold shadow-sm ${getAlertaEstilo(alerta)}`}
    >
      {alerta}
    </span>
  );
};

function formatNombreTurno(turnoString: string, horaEntrada: string): string {
  if (turnoString) {
    const tClean = turnoString.toLowerCase();
    if (tClean.includes("matutino") || tClean.includes("08:00") || tClean.includes("07:30")) return "Matutino";
    if (tClean.includes("vespertino") || tClean.includes("14:30") || tClean.includes("15:00")) return "Vespertino";
  }
  if (!horaEntrada || horaEntrada === "—") return "Matutino";
  const [h] = horaEntrada.split(":").map(Number);
  return h >= 13 ? "Vespertino" : "Matutino";
}

export default function PonchesView() {
  const { 
    empleados = [], 
    asistencia = [], 
    incidencias = [], 
    corregirPoncheIndividual, 
    corregirTodosErroresMasivo
  } = usePay();
  
  // --- ESTADOS DE FILTRADO Y NAVEGACIÓN ---
  const [subTab, setSubTab] = useState<"tardanzas" | "errores" | "todos" | "config">("tardanzas");
  const [search, setSearch] = useState("");
  const [filterSucursal, setFilterSucursal] = useState("Todos");
  const [filterNovedad, setFilterNovedad] = useState("Todos"); 
  const [filterFecha, setFilterFecha] = useState("Todos"); 
  const [selectedIdReloj, setSelectedIdReloj] = useState<string>("");

  // Estados locales para enmiendas manuales en el panel lateral
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [horaEntradaManual, setHoraEntradaManual] = useState("08:00");
  const [horaSalidaManual, setHoraSalidaManual] = useState("16:00");

  // Parámetros de Configuración Económica
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [tasas, setTasas] = useState({
    diaTrabajo: 1153.57,
    hora: 144.20,
    he: 194.67,
    feriado: 288.40,
    tssDependiente: 1919.78
  });

  // Base Oficial de Feriados RD 2026
  const [feriadosRD, setFeriadosRD] = useState([
    { id: 1, fecha: "2026-01-01", nombre: "Año Nuevo (Inamovible)", confirmado: true },
    { id: 2, fecha: "2026-01-05", nombre: "Día de los Santos Reyes (Movido)", confirmado: true },
    { id: 3, fecha: "2026-01-21", nombre: "Día de Nuestra Señora de la Altagracia", confirmado: true },
    { id: 4, fecha: "2026-01-26", nombre: "Natalicio de Juan Pablo Duarte", confirmado: true },
    { id: 5, fecha: "2026-02-27", nombre: "Día de la Independencia Nacional", confirmado: true },
    { id: 6, fecha: "2026-04-03", nombre: "Viernes Santo", confirmado: true },
    { id: 7, fecha: "2026-05-04", nombre: "Día del Trabajo (Movido)", confirmado: true },
    { id: 8, fecha: "2026-06-04", nombre: "Día de Corpus Christi", confirmado: true },
    { id: 9, fecha: "2026-08-16", nombre: "Día de la Restauración", confirmado: true },
    { id: 10, fecha: "2026-09-24", nombre: "Día de Nuestra Señora de las Mercedes", confirmado: true },
    { id: 11, fecha: "2026-11-09", nombre: "Día de la Constitución (Movido)", confirmado: true },
    { id: 12, fecha: "2026-12-25", nombre: "Día de Navidad", confirmado: true },
  ]);

  // --- PANEL RESIZABLE ---
  const [panelWidth, setPanelWidth] = useState(430); 
  const isResizing = useRef(false);

  const startResizing = React.useCallback((e: React.MouseEvent) => { e.preventDefault(); isResizing.current = true; }, []);
  const stopResizing = React.useCallback(() => { isResizing.current = false; }, []);
  const resize = React.useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const nextWidth = window.innerWidth - e.clientX - 32; 
    if (nextWidth > 340 && nextWidth < 700) setPanelWidth(nextWidth);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", resize); 
    window.addEventListener("mouseup", stopResizing);
    return () => { 
      window.removeEventListener("mousemove", resize); 
      window.removeEventListener("mouseup", stopResizing); 
    };
  }, [resize, stopResizing]);

  // --- ENGINE CONTABLE DE ASISTENCIA BLINDADO ---
  const calcularDescuentoPonche = (record: AsistenciaRefinada, emp: Empleado | undefined) => {
    if (!emp || emp.exento_ponche || record.error_reloj) return 0;
    
    if (record.es_feriado) return 0; 

    const sinPonches = (!record.entrada_normalizada || record.entrada_normalizada === "—") && 
                       (!record.salida_normalizada || record.salida_normalizada === "—");

    if (sinPonches && (record.tipo_incidencia === "Normal" || !record.tipo_incidencia)) {
      return 0; 
    }

    if (record.incidencia_detectada && ["Licencia Médica", "Vacaciones", "Permiso", "Cobertura"].includes(record.incidencia_detectada)) {
      return 0;
    }

    if (sinPonches && (record.tipo_incidencia === "Ausencia" || record.tipo_incidencia === "Sanción")) {
      return tasas.diaTrabajo; 
    }

    if (record.minutos_inconsistencia > 0 && !record.es_gracia) {
      return record.minutos_inconsistencia * (tasas.hora / 60);
    }

    return 0;
  };

  const obtenerAlertaSimplificada = (record: AsistenciaRefinada, emp: Empleado | undefined) => {
    if (!emp) return "";
    if (record.incidencia_detectada === "Vacaciones") return "Vacaciones";
    if (record.incidencia_detectada === "Cobertura") return "Cobertura";
    if (record.incidencia_detectada === "Licencia Médica") return "Licencia Médica";
    if (record.incidencia_detectada === "Permiso") return "Permiso";
    if (record.error_reloj) return "Irregularidad";
    
    const sinPonches = (!record.entrada_normalizada || record.entrada_normalizada === "—") && 
                       (!record.salida_normalizada || record.salida_normalizada === "—");

    if (sinPonches && (record.tipo_incidencia === "Normal" || !record.tipo_incidencia)) {
      return "";
    }

    if (sinPonches && (record.tipo_incidencia === "Ausencia" || record.tipo_incidencia === "Sanción")) {
      return record.es_feriado ? "" : "Ausencia";
    }

    if (record.minutos_inconsistencia > 0 && !emp.exento_ponche && !record.es_gracia) return "Tardanza";
    return "";
  };

  // --- PROCESAMIENTO QUINCENAL ACTIVO ---
  const asistenciaEnriquecida: AsistenciaRefinada[] = useMemo(() => {
    const parseMins = (h: string) => {
      if (!h || h === "—" || h.trim() === "") return 0;
      const [hrs, mins] = h.split(":").map(Number);
      return hrs * 60 + mins;
    };

    return asistencia.map((rec: any) => {
      const coincidencia = incidencias.find(inc => inc.id_reloj === rec.id_reloj && rec.fecha === inc.fecha_inicio);
      let incidencia_detectada = coincidencia ? coincidencia.tipo : undefined;
      let nombre_cubre = undefined;

      if (coincidencia && coincidencia.tipo === "Cobertura" && coincidencia.id_reloj_cubre) {
        const colabCubre = empleados.find(e => e.id_reloj === coincidencia.id_reloj_cubre);
        nombre_cubre = colabCubre ? colabCubre.nombre : `ID: ${coincidencia.id_reloj_cubre}`;
      }

      const empFarma = empleados.find(e => e.id_reloj === rec.id_reloj);
      const sucursal_ponche = empFarma ? empFarma.sucursal_principal : "Tania 2";
      const es_feriado = feriadosRD.some(f => f.fecha === rec.fecha && f.confirmado);

      const esVacaciones = incidencia_detectada === "Vacaciones";
      const entradaEfectiva = esVacaciones ? "—" : (rec.entrada || rec.hora_entrada || "—");
      const salidaEfectiva = esVacaciones ? "—" : (rec.salida || rec.hora_salida || "—");

      let minutes_inconsistencia = 0;
      let es_gracia = false;
      let minutes_gracia = 0;

      if (entradaEfectiva !== "—" && entradaEfectiva.trim() !== "" && !esVacaciones) {
        const entradaMins = parseMins(entradaEfectiva);
        const salidaMins = parseMins(salidaEfectiva);
        
        let horaTeoricaEntrada = 8 * 60;
        let horaTeoricaSalida = 16 * 60;

        if (rec.turno && rec.turno.includes("-")) {
          const [tEntrada, tSalida] = rec.turno.split("-");
          const [hE, mE] = tEntrada.split(":").map(Number);
          const [hS, mS] = tSalida.split(":").map(Number);
          horaTeoricaEntrada = hE * 60 + mE;
          horaTeoricaSalida = hS * 60 + mS;
        } else {
          const [h] = entradaEfectiva.split(":").map(Number);
          if (h >= 13) {
            horaTeoricaEntrada = 14 * 60 + 30; 
            horaTeoricaSalida = 22 * 60 + 30;
          }
        }

        let tardanza_entrada = entradaMins - horaTeoricaEntrada;
        if (tardanza_entrada < 0) tardanza_entrada = 0;

        if (tardanza_entrada > 0 && tardanza_entrada <= 10) {
          es_gracia = true;
          minutes_gracia = tardanza_entrada;
          tardanza_entrada = 0; 
        }

        let salida_temprana = 0;
        if (salidaEfectiva !== "—" && salidaEfectiva.trim() !== "") {
          salida_temprana = horaTeoricaSalida - salidaMins;
          if (salida_temprana < 0) salida_temprana = 0;
        }

        minutes_inconsistencia = tardanza_entrada + salida_temprana;
      }

      let error_reloj_calculado = rec.error_reloj;
      if (!esVacaciones && entradaEfectiva !== "—" && entradaEfectiva.trim() !== "" && (salidaEfectiva === "—" || salidaEfectiva.trim() === "")) {
        error_reloj_calculado = true;
      }
      if (!esVacaciones && (entradaEfectiva === "—" || entradaEfectiva.trim() === "") && salidaEfectiva !== "—" && salidaEfectiva.trim() !== "") {
        error_reloj_calculado = true;
      }

      return { 
        ...rec, 
        error_reloj: error_reloj_calculado,
        entrada_normalizada: entradaEfectiva,
        salida_normalizada: salidaEfectiva,
        minutos_inconsistencia: minutes_inconsistencia,
        es_gracia,
        minutos_gracia: minutes_gracia,
        minutos_extras: 0, 
        incidencia_detectada,
        nombre_cubre,
        es_feriado,
        sucursal_ponche 
      };
    });
  }, [asistencia, incidencias, empleados, feriadosRD]);

  const listaFechasUnicas = useMemo(() => Array.from(new Set(asistenciaEnriquecida.map(a => a.fecha))).sort(), [asistenciaEnriquecida]);
  const registrosErroresReloj = useMemo(() => asistenciaEnriquecida.filter(a => a.error_reloj === true), [asistenciaEnriquecida]);
  const conteoErroresReloj = registrosErroresReloj.length;

  const { montoTotalDescontarGlobal, idsEmpleadosConTardanzasGlobal } = useMemo(() => {
    let descuentoTotal = 0;
    const empleadosAfectados = new Set<string>();

    asistenciaEnriquecida.forEach((rec) => {
      const emp = empleados.find((e) => e.id_reloj === rec.id_reloj);
      descuentoTotal += calcularDescuentoPonche(rec, emp);
      if (emp) {
        const alerta = obtenerAlertaSimplificada(rec, emp);
        if (["Tardanza", "Ausencia", "Irregularidad"].includes(alerta)) {
          empleadosAfectados.add(rec.id_reloj);
        }
      }
    });

    return { montoTotalDescontarGlobal: descuentoTotal, idsEmpleadosConTardanzasGlobal: empleadosAfectados };
  }, [asistenciaEnriquecida, empleados, tasas]);

  const registrosFiltradosAvanzados = useMemo(() => {
    if (subTab === "errores") return registrosErroresReloj;

    return asistenciaEnriquecida.filter((rec) => {
      const emp = empleados.find((e) => e.id_reloj === rec.id_reloj);
      if (!emp) return false;

      const alertaTexto = obtenerAlertaSimplificada(rec, emp);
      const matchSearch = emp.nombre.toLowerCase().includes(search.toLowerCase()) || rec.id_reloj.includes(search);
      const matchSucursal = filterSucursal === "Todos" || emp.sucursal_principal === filterSucursal || rec.sucursal_ponche === filterSucursal;
      
      let matchNovedad = true;
      if (filterNovedad === "Tardanza") matchNovedad = alertaTexto === "Tardanza";
      if (filterNovedad === "Licencia") matchNovedad = alertaTexto === "Licencia Médica";
      if (filterNovedad === "Permiso") matchNovedad = alertaTexto === "Permiso";
      if (filterNovedad === "Vacaciones") matchNovedad = alertaTexto === "Vacaciones";
      if (filterNovedad === "Irregularidad") matchNovedad = alertaTexto === "Irregularidad";

      const matchFecha = filterFecha === "Todos" || rec.fecha === filterFecha;

      return matchSearch && matchSucursal && matchNovedad && matchFecha;
    });
  }, [asistenciaEnriquecida, registrosErroresReloj, subTab, search, filterSucursal, filterNovedad, filterFecha, empleados]);

  const listaGroupedTardanzas = useMemo(() => {
    const mapa: Record<string, EmpleadoAsistenciaGrupal> = {};
    registrosFiltradosAvanzados.forEach((rec) => {
      const emp = empleados.find((e) => e.id_reloj === rec.id_reloj);
      if (!emp) return;
      if (subTab === "tardanzas" && rec.tipo_incidencia === "Normal" && !rec.incidencia_detectada) return;

      if (!mapa[rec.id_reloj]) {
        mapa[rec.id_reloj] = {
          id_reloj: emp.id_reloj, nombre: emp.nombre, cargo: emp.cargo, sucursal_principal: emp.sucursal_principal,
          exento: emp.exento_ponche, totalDescuento: 0, alertasAcumuladas: new Set<string>(), records: []
        };
      }
      mapa[rec.id_reloj].totalDescuento += calcularDescuentoPonche(rec, emp);
      mapa[rec.id_reloj].records.push(rec);
      const alertaStr = obtenerAlertaSimplificada(rec, emp);
      if (alertaStr) mapa[rec.id_reloj].alertasAcumuladas.add(alertaStr);
    });
    return Object.values(mapa);
  }, [registrosFiltradosAvanzados, subTab, empleados]);

  const empleadoSeleccionadoObjeto = empleados.find(e => e.id_reloj === selectedIdReloj);
  const ponchesDelSeleccionadoSidelateral = asistenciaEnriquecida.filter(p => p.id_reloj === selectedIdReloj);

  const totalDescuentoEmpleadoSeleccionado = useMemo(() => {
    if (!empleadoSeleccionadoObjeto) return 0;
    return ponchesDelSeleccionadoSidelateral.reduce((acc, p) => acc + calcularDescuentoPonche(p, empleadoSeleccionadoObjeto), 0);
  }, [ponchesDelSeleccionadoSidelateral, empleadoSeleccionadoObjeto, tasas]);

  const handleCorregirIndividual = (id_registro: string) => {
    if (!horaEntradaManual || !horaSalidaManual) return alert("❌ Parámetros incompletos.");
    if (corregirPoncheIndividual) {
      corregirPoncheIndividual(id_registro, horaEntradaManual, horaSalidaManual);
      setEditingRecordId(null);
      alert("✅ Registro biométrico actualizado correctamente.");
      setTimeout(() => window.location.reload(), 500);
    }
  };

  const handleCorregirLoteMasivo = () => {
    if (confirm("¿Desea aplicar el saneamiento automático sobre todos los ponches incompletos detectados?")) {
      if (corregirTodosErroresMasivo) {
        corregirTodosErroresMasivo();
      }
      alert("⚡ Limpieza masiva completada de forma exitosa.");
    }
  };

  const cardClasses = "bg-white border border-slate-100/80 rounded-2xl shadow-[0_4px_20px_rgba(241,245,249,0.6)]";
  const inputClasses = "w-full pl-9 pr-3.5 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-xs outline-none focus:bg-white focus:border-emerald-500/80 focus:ring-4 focus:ring-emerald-500/5 transition-all text-slate-700 disabled:opacity-60 disabled:bg-slate-50/50";
  const selectClasses = "w-full pl-9 pr-8 py-2.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-xs font-medium outline-none cursor-pointer focus:bg-white focus:border-emerald-500/80 focus:ring-4 focus:ring-emerald-500/5 transition-all text-slate-700 appearance-none disabled:opacity-60 disabled:bg-slate-50/50";

  return (
    <div className="flex gap-1 text-slate-700 bg-[#F8FAFC] p-4 rounded-3xl min-h-screen w-full select-none overflow-hidden font-sans">
      
      {/* PANEL PRINCIPAL */}
      <div className="flex-1 flex flex-col gap-6 min-w-0 pr-2">
        
        {/* INDICADORES TOP */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            onClick={() => setSubTab("errores")} 
            className={`${cardClasses} p-5 flex items-center justify-between bg-gradient-to-br from-white to-slate-50/30 cursor-pointer transition-all hover:shadow-md ${subTab === "errores" ? "ring-2 ring-red-500/20 border-red-200" : ""}`}
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Alertas Biométricas</span>
              <span className="text-2xl font-bold text-red-600 tracking-tight mt-1 block">{conteoErroresReloj}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Registros incompletos</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50/60 text-red-600 flex items-center justify-center border border-red-100/50">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div 
            onClick={() => setSubTab("tardanzas")} 
            className={`${cardClasses} p-5 flex items-center justify-between bg-gradient-to-br from-white to-slate-50/30 cursor-pointer transition-all hover:shadow-md ${subTab === "tardanzas" ? "ring-2 ring-amber-500/20 border-amber-200" : ""}`}
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Alertas Activas</span>
              <span className="text-2xl font-bold text-amber-600 tracking-tight mt-1 block">{idsEmpleadosConTardanzasGlobal.size}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Colaboradores afectados</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50/60 text-amber-600 flex items-center justify-center border border-amber-100/50">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className={`${cardClasses} p-5 flex items-center justify-between bg-gradient-to-br from-slate-800 to-slate-900 text-white relative overflow-hidden`}>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
            <div>
              <span className="text-[10px] font-bold text-slate-300/80 tracking-widest block">Total Deducciones</span>
              <span className="text-xl font-bold font-mono tracking-tight mt-1 block">{formatMonto(montoTotalDescontarGlobal)}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Quincena actual</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* BARRA DE BÚSQUEDA Y FILTROS */}
        <div className={`${cardClasses} p-4 flex flex-col sm:flex-row gap-3.5 items-center justify-between bg-white`}>
          <div className="relative w-full sm:w-72">
            <span className="absolute left-3 top-3 text-slate-400 pointer-events-none"><Search className="w-4 h-4" /></span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar colaborador..." className={inputClasses} />
          </div>

          <div className="flex gap-2.5 w-full sm:w-auto justify-end items-center flex-wrap">
            <div className="relative min-w-[150px]">
              <span className="absolute left-3 top-3 text-slate-400 pointer-events-none"><CalendarDays className="w-4 h-4" /></span>
              <select value={filterFecha} onChange={(e) => setFilterFecha(e.target.value)} className={selectClasses}>
                <option value="Todos">Todas las Fechas</option>
                {listaFechasUnicas.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            
            <div className="relative min-w-[150px]">
              <span className="absolute left-3 top-3 text-slate-400 pointer-events-none"><Activity className="w-4 h-4" /></span>
              <select value={filterNovedad} onChange={(e) => setFilterNovedad(e.target.value)} className={selectClasses}>
                <option value="Todos">Todas las Alertas</option>
                <option value="Tardanza">Tardanzas</option>
                <option value="Vacaciones">Vacaciones</option>
                <option value="Licencia">Licencias Médicas</option>
                <option value="Permiso">Permisos</option>
                <option value="Irregularidad">Irregularidades</option>
              </select>
            </div>

            <div className="relative min-w-[150px]">
              <span className="absolute left-3 top-3 text-slate-400 pointer-events-none"><MapPin className="w-4 h-4" /></span>
              <select value={filterSucursal} onChange={(e) => setFilterSucursal(e.target.value)} className={selectClasses}>
                <option value="Todos">Todas las Sucursales</option>
                {SUCURSALES_DISPONIBLES?.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <button 
              type="button" 
              onClick={() => setSubTab("config")}
              className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 ${subTab === "config" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              <Settings className="w-3.5 h-3.5" /> Configuración
            </button>
          </div>
        </div>

        {/* NAVEGACIÓN SUBTABS */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: "tardanzas", label: "Resumen Alertas", icon: <Clock className="w-3.5 h-3.5" />, color: "amber" },
            { id: "errores", label: "Errores Biométricos", icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "red" },
            { id: "todos", label: "Historial de Ponches", icon: <FileText className="w-3.5 h-3.5" />, color: "slate" },
            { id: "config", label: "Feriados e Indicadores", icon: <Settings className="w-3.5 h-3.5" />, color: "blue" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                subTab === tab.id 
                  ? `bg-${tab.color}-50 text-${tab.color}-700 border border-${tab.color}-200 shadow-sm` 
                  : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* PANEL CONFIGURACIÓN REGULATORIO */}
        {subTab === "config" ? (
          <div className="flex flex-col gap-5">
            <div className={`${cardClasses} p-5 bg-white`}>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-slate-500" /> Panel de Control Regulatorio
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Parámetros de cómputo y feriados oficiales</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingConfig(!isEditingConfig)}
                  className={`text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
                    isEditingConfig ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {isEditingConfig ? <><Save className="w-3.5 h-3.5" /> Guardar Cambios</> : <><Lock className="w-3.5 h-3.5" /> Modificar Parámetros</>}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/30">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-3">
                    <Coins className="w-3.5 h-3.5" /> Parámetros de Cómputo
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Día Trabajo</label>
                      <input type="number" step="0.01" disabled={!isEditingConfig} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs" value={tasas.diaTrabajo} onChange={e => setTasas({...tasas, diaTrabajo: parseFloat(e.target.value) || 0})} />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Hora Base</label>
                      <input type="number" step="0.01" disabled={!isEditingConfig} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs" value={tasas.hora} onChange={e => setTasas({...tasas, hora: parseFloat(e.target.value) || 0})} />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Hora Extra</label>
                      <input type="number" step="0.01" disabled={!isEditingConfig} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs" value={tasas.he} onChange={e => setTasas({...tasas, he: parseFloat(e.target.value) || 0})} />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Feriado</label>
                      <input type="number" step="0.01" disabled={!isEditingConfig} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs" value={tasas.feriado} onChange={e => setTasas({...tasas, feriado: parseFloat(e.target.value) || 0})} />
                    </div>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/30">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 mb-3">
                    <CalendarDays className="w-3.5 h-3.5" /> Feriados Oficiales RD 2026
                  </h4>
                  <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto">
                    {feriadosRD.map(f => (
                      <div key={f.id} className="flex items-center justify-between text-xs bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                        <span className="font-bold text-slate-700 truncate text-[10px]">{f.nombre}</span>
                        <span className="font-mono text-slate-400 text-[10px]">{f.fecha}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* TABLAS GENERALES */
          <div className={`${cardClasses} overflow-hidden bg-white`}>
            <div className="overflow-x-auto">
              {subTab === "tardanzas" ? (
                <table className="w-full text-left text-xs table-fixed min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 h-12">
                      <th className="p-3 pl-6 w-80">Colaborador</th>
                      <th className="p-3 w-48">Sucursal</th>
                      <th className="p-3 text-center w-56">Alertas</th>
                      <th className="p-3 pr-6 text-right w-36">Retención Quincenal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {listaGroupedTardanzas.length === 0 ? (
                      <tr className="h-32">
                        <td colSpan={4} className="p-3 text-center text-slate-400 italic">No hay alertas registradas para los filtros seleccionados.</td>
                      </tr>
                    ) : (
                      listaGroupedTardanzas.map((g) => (
                        <tr 
                          key={g.id_reloj} 
                          onClick={() => setSelectedIdReloj(g.id_reloj)} 
                          className={`h-14 cursor-pointer transition-all hover:bg-slate-50/40 ${selectedIdReloj === g.id_reloj ? "bg-emerald-50/30 border-l-4 border-emerald-500" : ""}`}
                        >
                          <td className={`p-3 pl-6 ${selectedIdReloj === g.id_reloj ? "!pl-5" : ""}`}>
                            <div className="font-bold text-slate-700 uppercase truncate">{g.nombre}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {g.id_reloj} · {g.cargo}</div>
                          </td>
                          <td className="p-3 uppercase font-medium text-slate-500">{g.sucursal_principal}</td>
                          <td className="p-3 text-center">
                            <div className="flex justify-center gap-1 flex-wrap">
                              {Array.from(g.alertasAcumuladas).map(a => renderBadgeAlerta(a))}
                            </div>
                          </td>
                          <td className="p-3 pr-6 text-right font-mono font-bold">
                            {g.totalDescuento > 0 ? (
                              <span className="text-rose-600">{formatMonto(g.totalDescuento)}</span>
                            ) : (
                              <span className="text-emerald-600">RD$ 0.00</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left text-xs table-fixed min-w-[1100px]">
                  <thead>
                    <tr className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 h-12">
                      <th className="p-3 pl-6 w-28">Fecha</th>
                      <th className="p-3 w-64">Colaborador</th>
                      <th className="p-3 w-24 text-center">Turno</th>
                      <th className="p-3 w-32">Sucursal</th>
                      <th className="p-3 w-22 font-mono text-center">Entrada</th>
                      <th className="p-3 w-22 font-mono text-center">Salida</th>
                      <th className="p-3 text-center w-36">Alerta</th>
                      <th className="p-3 text-center w-32">Métrica</th>
                      <th className="p-3 text-center w-32">Acción</th>
                      <th className="p-3 pr-6 text-right w-32">Descuento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {registrosFiltradosAvanzados.length === 0 ? (
                      <tr className="h-32">
                        <td colSpan={10} className="p-3 text-center text-slate-400 italic">No hay registros para los filtros seleccionados.</td>
                      </tr>
                    ) : (
                      registrosFiltradosAvanzados.map((rec) => {
                        const emp = empleados.find((e) => e.id_reloj === rec.id_reloj);
                        const descuento = calcularDescuentoPonche(rec, emp);
                        const alertaTexto = obtenerAlertaSimplificada(rec, emp);
                        const tieneErrorBiometrico = rec.error_reloj === true;
                        const esAusenciaTotal = (!rec.entrada_normalizada || rec.entrada_normalizada === "—") && rec.turno;

                        return (
                          <tr 
                            key={rec.id_registro} 
                            onClick={() => setSelectedIdReloj(rec.id_reloj)} 
                            className={`h-14 cursor-pointer transition-all hover:bg-slate-50/40 ${selectedIdReloj === rec.id_reloj ? "bg-emerald-50/30 border-l-4 border-emerald-500" : ""}`}
                          >
                            <td className={`p-3 pl-6 font-mono text-slate-500 ${selectedIdReloj === rec.id_reloj ? "!pl-5" : ""}`}>
                              {rec.es_feriado && <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded mr-1">F</span>}
                              {rec.fecha}
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-700 uppercase truncate">{(emp?.nombre || "No Indexado").toUpperCase()}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {rec.id_reloj} · {emp?.cargo || "Sin Cargo"}</div>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${formatNombreTurno(rec.turno, rec.entrada_normalizada) === "Matutino" ? "bg-sky-50 text-sky-700 border border-sky-200" : "bg-purple-50 text-purple-700 border border-purple-200"}`}>
                                {formatNombreTurno(rec.turno, rec.entrada_normalizada)}
                              </span>
                            </td>
                            <td className="p-3 uppercase font-medium text-slate-500 text-[10px]">{rec.sucursal_ponche}</td>
                            <td className="p-3 font-mono font-bold text-slate-700 text-center">{rec.entrada_normalizada}</td>
                            <td className="p-3 font-mono font-bold text-slate-700 text-center">{rec.salida_normalizada}</td>
                            <td className="p-3 text-center">{renderBadgeAlerta(alertaTexto)}</td>
                            <td className="p-3 text-center font-mono font-bold text-slate-600">
                              {rec.es_feriado ? (
                                <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg text-[10px]">Feriado</span>
                              ) : esAusenciaTotal ? (
                                <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg text-[10px]">-1 Día</span>
                              ) : rec.es_gracia ? (
                                <span className="text-slate-400 text-[10px] italic">Gracia {rec.minutos_gracia} min</span>
                              ) : rec.minutos_inconsistencia > 0 ? (
                                <span className="text-red-600">-{rec.minutos_inconsistencia} min</span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {tieneErrorBiometrico && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedIdReloj(rec.id_reloj);
                                    setEditingRecordId(rec.id_registro);
                                    setHoraEntradaManual(rec.entrada_normalizada !== "—" ? rec.entrada_normalizada : "08:00");
                                    setHoraSalidaManual(rec.salida_normalizada !== "—" ? rec.salida_normalizada : "16:00");
                                  }}
                                  className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                                >
                                  <Wrench className="w-3 h-3" /> Corregir
                                </button>
                              )}
                            </td>
                            <td className="p-3 pr-6 text-right font-mono font-bold">
                              {descuento > 0 ? (
                                <span className="text-rose-600">{formatMonto(descuento)}</span>
                              ) : (
                                <span className="text-emerald-600">RD$ 0.00</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
            {subTab === "errores" && conteoErroresReloj > 0 && (
              <div className="p-3.5 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                <button 
                  type="button" 
                  onClick={handleCorregirLoteMasivo} 
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Saneamiento Masivo
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DRAG RESIZE GRIP */}
      <div 
        onMouseDown={startResizing}
        className="w-2.5 hover:w-3 bg-transparent hover:bg-slate-200/60 active:bg-slate-300 rounded-full cursor-col-resize transition-all self-stretch shrink-0 mx-0.5 relative z-10"
      />

      {/* PANEL EXPEDIENTE LATERAL CON EDICIÓN DE PONCHES */}
      <div 
        style={{ width: `${panelWidth}px` }}
        className={`${cardClasses} p-5 bg-white shadow-md sticky top-5 max-h-[88vh] overflow-y-auto border-slate-200/50 shrink-0 select-text`}
      >
        {empleadoSeleccionadoObjeto ? (
          <div className="flex flex-col gap-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Expediente de Asistencia</span>
                <h4 className="font-bold text-slate-800 text-sm truncate uppercase mt-0.5 tracking-tight">{empleadoSeleccionadoObjeto.nombre}</h4>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5 font-medium">ID: {empleadoSeleccionadoObjeto.id_reloj} · {empleadoSeleccionadoObjeto.cargo}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 text-emerald-400 flex items-center justify-center text-sm font-bold shadow-md shrink-0">
                {empleadoSeleccionadoObjeto.nombre.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Tarjeta de total a descontar */}
            <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-rose-600 uppercase tracking-wider">Total a Descontar</span>
                <span className="text-lg font-black font-mono text-rose-600">
                  {totalDescuentoEmpleadoSeleccionado > 0 ? formatMonto(totalDescuentoEmpleadoSeleccionado) : "RD$ 0.00"}
                </span>
              </div>
              <p className="text-[9px] text-slate-400 mt-1">Suma de todas las deducciones quincenales</p>
            </div>

            {/* Lista de ponches del colaborador - EDITABLE */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Registros Diarios</span>
                <span className="text-[9px] text-slate-400">Click en ✏️ para editar</span>
              </div>
              <div className="flex flex-col gap-2 max-h-[450px] overflow-y-auto pr-1">
                {ponchesDelSeleccionadoSidelateral.length === 0 ? (
                  <div className="text-center text-slate-400 italic py-8 bg-slate-50/50 rounded-xl">No hay registros de asistencia</div>
                ) : (
                  ponchesDelSeleccionadoSidelateral.map((p) => {
                    const descDia = calcularDescuentoPonche(p, empleadoSeleccionadoObjeto);
                    const isEditingThis = editingRecordId === p.id_registro;
                    const esAusenciaTotalDia = (!p.entrada_normalizada || p.entrada_normalizada === "—") && p.turno;
                    const alertaTexto = obtenerAlertaSimplificada(p, empleadoSeleccionadoObjeto);
                    const tieneError = p.error_reloj;

                    return (
                      <div 
                        key={p.id_registro} 
                        className={`border rounded-xl p-3 transition-all ${
                          tieneError 
                            ? "border-red-200 bg-red-50/20" 
                            : isEditingThis 
                              ? "border-emerald-300 bg-emerald-50/30 ring-1 ring-emerald-200" 
                              : "border-slate-100 bg-slate-50/30"
                        }`}
                      >
                        {/* Fecha y total del día */}
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-600 text-[11px]">{p.fecha}</span>
                            {tieneError && (
                              <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Error</span>
                            )}
                            {isEditingThis && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full">Editando</span>
                            )}
                          </div>
                          <span className={descDia > 0 ? "text-rose-600 font-bold font-mono" : "text-emerald-600 font-semibold"}>
                            {descDia > 0 ? `-${formatMonto(descDia)}` : "RD$ 0.00"}
                          </span>
                        </div>

                        {/* Formulario de edición o visualización */}
                        {isEditingThis ? (
                          <div className="bg-white p-3 rounded-xl border border-emerald-200 mb-2 shadow-sm">
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <div>
                                <label className="text-[9px] font-bold text-slate-400 block mb-1">Hora Entrada</label>
                                <input 
                                  type="time" 
                                  value={horaEntradaManual} 
                                  onChange={e => setHoraEntradaManual(e.target.value)} 
                                  className="w-full border border-slate-200 px-2 py-1.5 font-mono text-center text-xs rounded-lg bg-slate-50 focus:border-emerald-500 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-slate-400 block mb-1">Hora Salida</label>
                                <input 
                                  type="time" 
                                  value={horaSalidaManual} 
                                  onChange={e => setHoraSalidaManual(e.target.value)} 
                                  className="w-full border border-slate-200 px-2 py-1.5 font-mono text-center text-xs rounded-lg bg-slate-50 focus:border-emerald-500 focus:outline-none"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <button 
                                type="button" 
                                onClick={() => {
                                  setEditingRecordId(null);
                                  setHoraEntradaManual("08:00");
                                  setHoraSalidaManual("16:00");
                                }} 
                                className="bg-slate-100 text-slate-600 text-[10px] font-bold py-1.5 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-1"
                              >
                                <X className="w-3 h-3" /> Cancelar
                              </button>
                              <button 
                                type="button" 
                                onClick={() => handleCorregirIndividual(p.id_registro)} 
                                className="bg-emerald-600 text-white text-[10px] font-bold py-1.5 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1"
                              >
                                <CheckCircle className="w-3 h-3" /> Guardar Cambios
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-lg border border-slate-100 mb-2">
                            <div className="grid grid-cols-2 gap-4 font-mono text-[11px] font-bold text-slate-700 flex-1">
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400">🕐 Entrada:</span>
                                <span className={`${tieneError ? "text-red-600" : "text-slate-700"}`}>
                                  {p.entrada_normalizada}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400">🕒 Salida:</span>
                                <span className={`${tieneError ? "text-red-600" : "text-slate-700"}`}>
                                  {p.salida_normalizada}
                                </span>
                              </div>
                            </div>
                            {tieneError && (
                              <button 
                                type="button" 
                                onClick={() => {
                                  setEditingRecordId(p.id_registro);
                                  setHoraEntradaManual(p.entrada_normalizada !== "—" ? p.entrada_normalizada : "08:00");
                                  setHoraSalidaManual(p.salida_normalizada !== "—" ? p.salida_normalizada : "16:00");
                                }}
                                className="bg-amber-100 hover:bg-amber-200 text-amber-700 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" /> Corregir
                              </button>
                            )}
                          </div>
                        )}

                        {/* Información de alerta y métrica */}
                        <div className="flex justify-between items-center text-[10px] pt-1">
                          <div className="flex gap-1">
                            {renderBadgeAlerta(alertaTexto)}
                            <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-slate-100 text-slate-600">
                              {formatNombreTurno(p.turno, p.entrada_normalizada)}
                            </span>
                          </div>
                          <span className="font-mono text-slate-500 font-semibold">
                            {p.es_feriado ? (
                              <span className="text-blue-600 flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Feriado</span>
                            ) : esAusenciaTotalDia ? (
                              <span className="text-rose-600">-1 Día</span>
                            ) : p.es_gracia ? (
                              <span className="text-slate-400">Gracia {p.minutos_gracia} min</span>
                            ) : p.minutos_inconsistencia > 0 ? (
                              <span className="text-red-600">-{p.minutos_inconsistencia} min</span>
                            ) : (
                              "✅ En horario"
                            )}
                          </span>
                        </div>

                        {/* Mensaje de ayuda para edición */}
                        {tieneError && !isEditingThis && (
                          <p className="text-[9px] text-amber-600 mt-2 pt-1 border-t border-dashed border-amber-200">
                            ⚠️ Este registro tiene inconsistencias. Haz clic en "Corregir" para ajustar los horarios.
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Instrucciones de edición */}
            <div className="mt-2 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
              <p className="text-[9px] text-slate-400 text-center">
                ✏️ Los registros con error pueden ser corregidos manualmente. 
                <br />Los cambios afectarán el cálculo de descuentos.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center italic text-slate-400 py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            Seleccione un colaborador de la tabla<br />
            para ver y editar su expediente de asistencia.
          </div>
        )}
      </div>
    </div>
  );
}