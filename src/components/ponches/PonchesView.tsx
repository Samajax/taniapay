"use client";
import React, { useState, useMemo } from "react";
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
  Lock
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
const formatMontoMoneda = (val: number) => 
  "RD$ " + val.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getAlertaEstilo = (alerta: string): string => {
  const estilos: Record<string, string> = {
    "Irregularidad": "bg-red-50 text-red-600 border-red-200 font-semibold animate-pulse",
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
      className={`px-2 py-0.5 rounded text-[10px] border font-bold inline-block shadow-sm ${getAlertaEstilo(alerta)}`}
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

function formatTiempoNovedad(minutos: number, tipoAlerta: string): string {
  if (tipoAlerta === "Ausencia") return "1 Día";
  if (["Vacaciones", "Licencia Médica", "Cobertura", ""].includes(tipoAlerta)) return "0 min";
  return `${minutos || 0} min`;
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
  const [selectedIdReloj, setSelectedIdReloj] = useState<string>("12");

  // Estados locales para enmiendas manuales
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

  // --- ENGINE CONTABLE DE ASISTENCIA BLINDADO ---
  const calcularDescuentoPonche = (record: AsistenciaRefinada, emp: Empleado | undefined) => {
    if (!emp || emp.exento_ponche || record.error_reloj) return 0;
    
    // 🛡️ REGLA: Si el día es feriado, queda exento de cualquier retención en nómina
    if (record.es_feriado) return 0; 

    // 🛡️ REGLA: Si es un día libre / descanso (Normal sin marcas físicas), no se descuenta nada
    const sinPonches = (!record.entrada_normalizada || record.entrada_normalizada === "—") && 
                       (!record.salida_normalizada || record.salida_normalizada === "—");

    if (sinPonches && (record.tipo_incidencia === "Normal" || !record.tipo_incidencia)) {
      return 0; 
    }

    if (record.incidencia_detectada && ["Licencia Médica", "Vacaciones", "Permiso", "Cobertura"].includes(record.incidencia_detectada)) {
      return 0;
    }

    // Caso Ausencia legítima (Tiene asignada una falta explícita en el reporte biométrico)
    if (sinPonches && (record.tipo_incidencia === "Ausencia" || record.tipo_incidencia === "Sanción")) {
      return tasas.diaTrabajo; 
    }

    // Tardanzas netas acumuladas (minutos reales fuera del periodo de gracia)
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

        // Minutos de gracia visuales (Hasta 10 minutos tolerados de gracia)
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

      // Alertas biométricas que requieren acción inmediata
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
    if (!horaEntradaManual || !horaSalidaManual) return alert("Parámetros incompletos.");
    if (corregirPoncheIndividual) {
      corregirPoncheIndividual(id_registro, horaEntradaManual, horaSalidaManual);
    }
    setEditingRecordId(null);
    alert("✅ Registro biométrico actualizado correctamente.");
  };

  const handleCorregirLoteMasivo = () => {
    if (confirm("¿Desea aplicar el saneamiento automático sobre todos los ponches incompletos detectados?")) {
      if (corregirTodosErroresMasivo) {
        corregirTodosErroresMasivo();
      }
      alert("⚡ Limpieza masiva completada de forma exitosa.");
    }
  };

  const inputClasses = "w-full pl-9 pr-3.5 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-xs outline-none focus:bg-white focus:border-[#3B82F6] transition-all text-[#1F2937] font-sans";
  const selectClasses = "w-full pl-9 pr-8 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-xs font-medium outline-none cursor-pointer focus:bg-white focus:border-[#3B82F6] transition-all text-[#1F2937] font-sans appearance-none";
  const cardClasses = "bg-white border border-[#E5E7EB] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] font-sans";

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start font-sans text-[#111827]">
      
      {/* CUERPO CENTRAL DE PRODUCCIÓN */}
      <div className="flex flex-col gap-5 min-w-0">
        
        {/* INDICADORES TOP */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <button type="button" onClick={() => setSubTab("errores")} className={`${cardClasses} p-5 text-left transition-all ${subTab === "errores" ? "border-red-500 ring-2 ring-red-500/10 bg-red-50/10" : ""}`}>
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1.5"><XCircle className="w-4 h-4" /> Alertas de Usuario (Acción Requ.)</span>
            <span className="text-xl font-extrabold font-mono block mt-1 text-red-600">{conteoErroresReloj} Incompletos</span>
          </button>
          
          <button type="button" onClick={() => setSubTab("tardanzas")} className={`${cardClasses} p-5 text-left transition-all ${subTab === "tardanzas" ? "border-amber-500 ring-2 ring-amber-500/10 bg-amber-50/10" : ""}`}>
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5"><Clock className="w-4 h-4" /> Alertas Activas</span>
            <span className="text-xl font-extrabold text-amber-600 font-mono block mt-1">{idsEmpleadosConTardanzasGlobal.size} Afectados</span>
          </button>
          
          <div className="bg-white border border-[#E5E7EB] border-l-4 border-l-slate-800 p-5 rounded-xl shadow-sm flex flex-col justify-center">
            <span className="text-[10px] font-bold text-[#6B7280] uppercase block">Deducciones Totales de Nómina</span>
            <span className="text-xl font-extrabold text-red-600 font-mono block mt-1">{formatMontoMoneda(montoTotalDescontarGlobal)}</span>
          </div>
        </div>

        {/* CONTROLES Y FILTROS */}
        <div className="flex flex-col gap-3">
          <div className={`${cardClasses} p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 items-center`}>
            <div className="relative w-full">
              <span className="absolute left-3 top-2.5 text-[#9CA3AF] pointer-events-none"><Search className="w-4 h-4" /></span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar colaborador..." className={inputClasses} />
            </div>
            <div className="relative w-full">
              <span className="absolute left-3 top-2.5 text-[#9CA3AF] pointer-events-none"><CalendarDays className="w-4 h-4" /></span>
              <select value={filterFecha} onChange={(e) => setFilterFecha(e.target.value)} className={selectClasses}>
                <option value="Todos">Todas las Fechas</option>
                {listaFechasUnicas.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="relative w-full">
              <span className="absolute left-3 top-2.5 text-[#9CA3AF] pointer-events-none"><Activity className="w-4 h-4" /></span>
              <select value={filterNovedad} onChange={(e) => setFilterNovedad(e.target.value)} className={selectClasses}>
                <option value="Todos">Todas las Alertas</option>
                <option value="Tardanza">Tardanzas</option>
                <option value="Vacaciones">Vacaciones</option>
                <option value="Licencia">Licencias Médicas</option>
                <option value="Permiso">Permisos</option>
                <option value="Irregularidad">Irregularidades</option>
              </select>
            </div>
            <div className="relative w-full">
              <span className="absolute left-3 top-2.5 text-[#9CA3AF] pointer-events-none"><MapPin className="w-4 h-4" /></span>
              <select value={filterSucursal} onChange={(e) => setFilterSucursal(e.target.value)} className={selectClasses}>
                <option value="Todos">Farmacias: Todas</option>
                {SUCURSALES_DISPONIBLES?.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button 
              type="button" 
              onClick={() => setSubTab("config")}
              className="w-full bg-slate-900 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Settings className="w-4 h-4" /> Configuración Tasas
            </button>
          </div>
        </div>

        {/* NAVEGACIÓN SUBTABS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-[#E5E7EB] p-0.5 rounded-xl shadow-sm text-center font-semibold">
          <button onClick={() => setSubTab("tardanzas")} className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${subTab === "tardanzas" ? "bg-amber-50 text-amber-700 border border-amber-200" : "text-slate-500"}`}>
            <Clock className="w-4 h-4" /> Resumen Alertas
          </button>
          <button onClick={() => setSubTab("errores")} className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${subTab === "errores" ? "bg-red-50 text-red-700 border border-red-200" : "text-slate-500"}`}>
            <AlertTriangle className="w-4 h-4" /> Errores Biométricos ({conteoErroresReloj})
          </button>
          <button onClick={() => setSubTab("todos")} className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${subTab === "todos" ? "bg-slate-900 text-white" : "text-slate-500"}`}>
            <FileText className="w-4 h-4" /> Historial de Ponches
          </button>
          <button onClick={() => setSubTab("config")} className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${subTab === "config" ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-slate-500"}`}>
            <Settings className="w-4 h-4" /> Feriados e Indicadores
          </button>
        </div>

        {/* PANEL CONFIGURACIÓN REGULATORIO */}
        {subTab === "config" ? (
          <div className="flex flex-col gap-5">
            <div className={`${cardClasses} p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 border-slate-300`}>
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-600" /> Panel de Control Regulatorio
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingConfig(!isEditingConfig)}
                className={`text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm ${
                  isEditingConfig ? "bg-emerald-600 text-white" : "bg-white border border-slate-300"
                }`}
              >
                {isEditingConfig ? <><Save className="w-4 h-4" /> Guardar Cambios</> : <><Lock className="w-4 h-4 text-slate-500" /> Modificar Parámetros</>}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
              <div className={`${cardClasses} p-5 flex flex-col gap-4`}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5"><Coins className="w-4 h-4" /> Parámetros de Cómputo</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-[#6B7280] uppercase block mb-1">Día Trabajo Regular</label>
                    <input type="number" step="0.01" disabled={!isEditingConfig} className="w-full border px-3 py-2 rounded-lg font-mono font-bold bg-slate-50" value={tasas.diaTrabajo} onChange={e => setTasas({...tasas, diaTrabajo: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#6B7280] uppercase block mb-1">Hora Base</label>
                    <input type="number" step="0.01" disabled={!isEditingConfig} className="w-full border px-3 py-2 rounded-lg font-mono font-bold bg-slate-50" value={tasas.hora} onChange={e => setTasas({...tasas, hora: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>
              </div>

              <div className={`${cardClasses} p-5 flex flex-col gap-4`}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5"><CalendarDays className="w-4 h-4" /> Feriados Oficiales RD 2026</h4>
                <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto border p-2 bg-slate-50 rounded-xl">
                  {feriadosRD.map(f => (
                    <div key={f.id} className="flex items-center justify-between text-xs bg-white p-2 rounded shadow-sm border">
                      <span className="font-bold text-slate-700 truncate">{f.nombre}</span>
                      <span className="font-mono text-slate-400 text-[11px]">{f.fecha}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* TABLAS GENERALES */
          <div className={`${cardClasses} overflow-hidden`}>
            <div className="overflow-x-auto">
              {subTab === "tardanzas" ? (
                <table className="w-full text-left text-sm table-fixed min-w-[950px]">
                  <thead>
                    <tr className="bg-[#F9FAFB] text-[10px] font-bold text-[#6B7280] uppercase tracking-wider border-b border-[#E5E7EB] h-12">
                      <th className="p-3 pl-5 w-84">Colaborador</th>
                      <th className="p-3 w-48">Farmacia Base</th>
                      <th className="p-3 text-center w-56">Alertas Simplificadas</th>
                      <th className="p-3 pr-5 text-right w-36">Retención Quincenal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] text-[#1F2937]">
                    {listaGroupedTardanzas.map((g) => (
                      <tr key={g.id_reloj} onClick={() => setSelectedIdReloj(g.id_reloj)} className={`h-14 transition-colors ${selectedIdReloj === g.id_reloj ? "bg-[#EFF6FF]/60 font-medium" : "hover:bg-[#F9FAFB] cursor-pointer"}`}>
                        <td className="p-3 pl-5 text-[#111827]">
                          <div className="font-bold text-xs uppercase tracking-wide">{g.nombre.toUpperCase()}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {g.id_reloj} · {g.cargo}</div>
                        </td>
                        <td className="p-3 text-[#6B7280] uppercase">{g.sucursal_principal}</td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center gap-1 flex-wrap">
                            {Array.from(g.alertasAcumuladas).map(a => renderBadgeAlerta(a))}
                          </div>
                        </td>
                        <td className="p-3 pr-5 text-right font-mono font-bold text-red-600">
                          {g.totalDescuento > 0 ? formatMontoMoneda(g.totalDescuento) : <span className="text-emerald-600">RD$ 0.00</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left text-sm table-fixed min-w-[1200px]">
                  <thead>
                    <tr className="bg-[#F9FAFB] text-[10px] font-bold text-[#6B7280] uppercase tracking-wider border-b border-[#E5E7EB] h-12">
                      <th className="p-3 pl-5 w-28">Fecha</th>
                      <th className="p-3 w-64">Colaborador</th>
                      <th className="p-3 w-24 text-center">Turno</th>
                      <th className="p-3 w-32 text-center">Sucursal</th>
                      <th className="p-3 w-22 font-mono">Entrada</th>
                      <th className="p-3 w-22 font-mono">Salida</th>
                      <th className="p-3 text-center w-36">Estado Alerta</th>
                      <th className="p-3 text-center w-32">Métrica Tiempo</th>
                      <th className="p-3 text-center w-32">Acción</th>
                      <th className="p-3 pr-5 text-right w-32">A Descontar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] text-[#1F2937]">
                    {registrosFiltradosAvanzados.map((rec) => {
                      const emp = empleados.find((e) => e.id_reloj === rec.id_reloj);
                      const descuento = calcularDescuentoPonche(rec, emp);
                      const alertaTexto = obtenerAlertaSimplificada(rec, emp);
                      const tieneErrorBiometrico = rec.error_reloj === true;
                      const esAusenciaTotal = (!rec.entrada_normalizada || rec.entrada_normalizada === "—") && rec.turno;

                      return (
                        <tr key={rec.id_registro} onClick={() => setSelectedIdReloj(rec.id_reloj)} className={`h-14 transition-colors ${selectedIdReloj === rec.id_reloj ? "bg-[#EFF6FF]/60 font-medium" : "hover:bg-[#F9FAFB] cursor-pointer"}`}>
                          <td className="p-3 pl-5 font-mono text-[#6B7280]">
                            {rec.es_feriado && <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1 rounded mr-1">F</span>}
                            {rec.fecha}
                          </td>
                          <td className="p-3 text-[#111827]">
                            <div className="font-bold text-xs uppercase tracking-wide">{(emp?.nombre || "No Indexado").toUpperCase()}</div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {rec.id_reloj} · {emp?.cargo || "Sin Cargo"}</div>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 text-[10px] font-bold border rounded ${formatNombreTurno(rec.turno, rec.entrada_normalizada) === "Matutino" ? "bg-sky-50 text-sky-700 border-sky-100" : "bg-purple-50 text-purple-700 border-purple-100"}`}>
                              {formatNombreTurno(rec.turno, rec.entrada_normalizada)}
                            </span>
                          </td>
                          <td className="p-3 text-center uppercase text-[#4B5563] text-xs font-medium">{rec.sucursal_ponche}</td>
                          <td className="p-3 font-mono text-[#1F2937] font-bold">{rec.entrada_normalizada}</td>
                          <td className="p-3 font-mono text-[#1F2937] font-bold">{rec.salida_normalizada}</td>
                          <td className="p-3 text-center">{renderBadgeAlerta(alertaTexto)}</td>
                          <td className="p-3 text-center font-mono text-xs font-bold text-[#4B5563]">
                            {/* 🛡️ REQUERIMIENTO COMPILADO: Control ciego cromático y matemático de feriados y días libres */}
                            {rec.es_feriado ? (
                              <span className="text-blue-700 bg-blue-50 px-2 py-0.5 border border-blue-200 rounded">Feriado</span>
                            ) : esAusenciaTotal ? (
                              <span className="text-rose-700 bg-rose-50 px-2 py-0.5 border border-rose-200 rounded">-1 Día</span>
                            ) : rec.es_gracia ? (
                              <span className="text-slate-400 font-medium text-[11px] italic">Gracia {rec.minutos_gracia} min</span>
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
                                className="border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white px-2.5 py-1 rounded text-[10px] font-extrabold flex items-center gap-1 transition-colors"
                              >
                                <Wrench className="w-3 h-3" /> Arreglar Ponche
                              </button>
                            )}
                          </td>
                          <td className="p-3 pr-5 text-right font-mono font-bold">
                            {descuento > 0 ? <span className="text-red-600">{formatMontoMoneda(descuento)}</span> : <span className="text-emerald-600">RD$ 0.00</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            {subTab === "errores" && conteoErroresReloj > 0 && (
              <div className="p-3.5 bg-slate-50 border-t flex justify-end">
                <button type="button" onClick={handleCorregirLoteMasivo} className="bg-red-600 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm"><Sparkles className="w-4 h-4" /> Saneamiento Masivo</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PANEL EXPEDIENTE LATERAL */}
      <div className={`${cardClasses} p-5 shadow-lg sticky top-5`}>
        {empleadoSeleccionadoObjeto ? (
          <div className="flex flex-col gap-4 text-xs">
            <div className="border-b pb-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center text-slate-700 font-bold shadow-inner">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-bold text-[#9CA3AF] uppercase block tracking-wider">Expediente Enfocado</span>
                <h4 className="font-bold text-[#111827] text-xs truncate uppercase leading-tight">{empleadoSeleccionadoObjeto.nombre}</h4>
                <p className="text-[10px] text-[#6B7280] font-mono mt-0.5">ID: {empleadoSeleccionadoObjeto.id_reloj} · Farma Tania</p>
              </div>
            </div>

            <div className="p-3.5 bg-red-50/60 border border-red-100 rounded-xl">
              <span className="text-[10px] font-bold text-red-700 uppercase block tracking-wider">Total a Descontar esta Quincena</span>
              <span className="text-lg font-extrabold font-mono text-red-600 block mt-0.5">
                {totalDescuentoEmpleadoSeleccionado > 0 ? formatMontoMoneda(totalDescuentoEmpleadoSeleccionado) : "RD$ 0.00"}
              </span>
            </div>

            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block -mb-1 pl-1">Auditoría Diaria</span>
            
            <div className="flex flex-col gap-3 max-h-[450px] overflow-y-auto pr-1">
              {ponchesDelSeleccionadoSidelateral.map((p) => {
                const descDia = calcularDescuentoPonche(p, empleadoSeleccionadoObjeto);
                const isEditingThis = editingRecordId === p.id_registro;
                const esAusenciaTotalDia = (!p.entrada_normalizada || p.entrada_normalizada === "—") && p.turno;

                return (
                  <div key={p.id_registro} className={`p-3 rounded-lg border flex flex-col gap-2 transition-all ${p.error_reloj ? "border-red-200 bg-red-50/20" : "border-[#E5E7EB] bg-[#F9FAFB]"}`}>
                    <div className="flex justify-between font-mono font-bold text-xs">
                      <span className="text-[#4B5563]">{p.fecha}</span>
                      <span className={descDia > 0 ? "text-red-600" : "text-emerald-600 font-semibold"}>
                        {descDia > 0 ? `-${formatMontoMoneda(descDia)}` : "RD$ 0.00"}
                      </span>
                    </div>

                    {isEditingThis ? (
                      <div className="bg-white p-2.5 rounded-lg border border-[#3B82F6] flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" value={horaEntradaManual} onChange={e => setHoraEntradaManual(e.target.value)} className="border px-2 py-1 font-mono text-center text-xs rounded bg-[#F9FAFB]" />
                          <input type="text" value={horaSalidaManual} onChange={e => setHoraSalidaManual(e.target.value)} className="border px-2 py-1 font-mono text-center text-xs rounded bg-[#F9FAFB]" />
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 mt-1">
                          <button type="button" onClick={() => setEditingRecordId(null)} className="bg-slate-100 text-slate-600 text-[10px] font-bold py-1 rounded">Cancelar</button>
                          <button type="button" onClick={() => handleCorregirIndividual(p.id_registro)} className="bg-[#3B82F6] text-white text-[10px] font-bold py-1 rounded flex items-center justify-center gap-1"><Save className="w-3 h-3" /> Guardar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2 bg-white p-2 rounded border border-[#E5E7EB]">
                        <div className="grid grid-cols-2 font-mono text-[10px] text-[#111827] flex-1">
                          <div>In: <strong>{p.entrada_normalizada}</strong></div>
                          <div>Out: <strong>{p.salida_normalizada}</strong></div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => {
                            setEditingRecordId(p.id_registro);
                            setHoraEntradaManual(p.entrada_normalizada !== "—" ? p.entrada_normalizada : "08:00");
                            setHoraSalidaManual(p.salida_normalizada !== "—" ? p.salida_normalizada : "16:00");
                          }}
                          className="text-[#3B82F6] p-1 rounded transition-colors"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[10px]">
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-700">
                        Turno: {formatNombreTurno(p.turno, p.entrada_normalizada)}
                      </span>
                      <span className="font-mono text-[#6B7280] font-semibold">
                        {p.es_feriado ? (
                          "Feriado"
                        ) : esAusenciaTotalDia ? (
                          "-1 Día"
                        ) : p.es_gracia ? (
                          `Gracia ${p.minutos_gracia} min`
                        ) : p.minutos_inconsistencia > 0 ? (
                          `-${p.minutos_inconsistencia} min`
                        ) : (
                          "0 min"
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center italic text-[#6B7280] py-12 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">Seleccione un colaborador del maestro quincenal.</div>
        )}
      </div>

    </div>
  );
}