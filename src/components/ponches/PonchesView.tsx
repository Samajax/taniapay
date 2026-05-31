"use client";
import React, { useState, useMemo } from "react";
import { usePay } from "@/context/PayContext";
import { SUCURSALES_DISPONIBLES } from "@/data/mockData";
import { 
  Search, Clock, AlertTriangle, FileText, 
  DollarSign, Edit3, X, Sparkles 
} from "lucide-react";

import { 
  formatMonto, calcularDescuentoPonche, obtenerAlertaSimplificada, 
  obtenerMinutosPenalizados, 
  AsistenciaRefinada, EmpleadoAsistenciaGrupal 
} from "./hooks/useAsistenciaUtils";
import ResumenAlertasTable from "./subcomponents/ResumenAlertasTable";
import HistorialPonchesTable from "./subcomponents/HistorialPonchesTable";
import ExpedienteLateral from "./subcomponents/ExpedienteLateral";

export default function PonchesView() {
  const { 
    empleados = [], 
    asistencia = [], 
    incidencias = [], 
    corregirPoncheIndividual, 
    corregirTodosErroresMasivo,
    aprobarHorasExtras,
    configTasas,
    // --- NUEVAS FUNCIONES DESESTRUCTURADAS ---
    agregarNuevoRegistroAsistencia,
    eliminarRegistroAsistencia,
    actualizarTurnoOEstado
  } = usePay();
  
  // --- ESTADOS DE UI ---
  const [modoEdicionActivo, setModoEdicionActivo] = useState(false);
  const [subTab, setSubTab] = useState<"tardanzas" | "errores" | "todos">("todos");
  const [search, setSearch] = useState("");
  const [filterSucursal, setFilterSucursal] = useState("Todos");
  const [filterFecha, setFilterFecha] = useState("Todos"); 
  const [selectedIdReloj, setSelectedIdReloj] = useState<string>(""); 

  const [editandoRegistroId, setEditandoRegistroId] = useState<string | null>(null);
  const [nuevaEntrada, setNuevaEntrada] = useState("");
  const [nuevaSalida, setNuevaSalida] = useState("");
  const [panelWidth] = useState(450); 

  const [feriadosRD] = useState([
    { fecha: "2026-01-01", nombre: "Año Nuevo" },
    { fecha: "2026-04-03", nombre: "Viernes Santo" },
    { fecha: "2026-05-04", nombre: "Día del Trabajo" }
  ]);

  // --- MOTOR DE ENRIQUECIMIENTO ---
  const asistenciaEnriquecida: AsistenciaRefinada[] = useMemo(() => {
    const parseMins = (h: string) => {
      if (!h || h === "—" || h.trim() === "") return 0;
      const [hrs, mins] = h.split(":").map(Number);
      return hrs * 60 + mins;
    };

    const registrosOrdenados = [...asistencia].sort((a, b) => a.fecha.localeCompare(b.fecha));
    const contadoresLibres: Record<string, number> = {};

    return registrosOrdenados.map((rec) => {
      const emp = empleados.find(e => e.id_reloj === rec.id_reloj);
      const esFeriado = feriadosRD.some(f => f.fecha === rec.fecha) || rec.turno === "FERIADO";
      const coincidenciaInc = incidencias.find(inc => inc.id_reloj === rec.id_reloj && rec.fecha === inc.fecha_inicio);
      
      const entrada = rec.entrada || "—";
      const salida = rec.salida || "—";
      const tienePonche = entrada !== "—";

      let es_dia_libre = rec.turno === "LIBRE";
      if (!tienePonche && !esFeriado && !coincidenciaInc && rec.turno !== "LIBRE") {
        contadoresLibres[rec.id_reloj] = (contadoresLibres[rec.id_reloj] || 0) + 1;
        if (contadoresLibres[rec.id_reloj] <= 2) es_dia_libre = true;
      }

      let tardanzaMins = 0;
      let extrasMins = 0;
      let requiereConfirmacionHE = false;

      if (tienePonche && emp && !es_dia_libre && rec.turno !== "FERIADO") {
        const tEntrada = parseMins(entrada);
        const tSalida = parseMins(salida);
        const tTeoEntrada = parseMins(emp.hora_inicio_turno || "08:00");
        const tTeoSalida = parseMins(emp.hora_fin_turno || "17:00");

        if (tEntrada > tTeoEntrada + 10) tardanzaMins = tEntrada - tTeoEntrada;
        if (tSalida > tTeoSalida) extrasMins = tSalida - tTeoSalida;
        if (extrasMins > 0 && tardanzaMins > 0) requiereConfirmacionHE = true;
      }

      const minsPenalizados = obtenerMinutosPenalizados(
        { ...rec, entrada_normalizada: entrada, salida_normalizada: salida, es_feriado: esFeriado, es_dia_libre }, 
        emp
      );

      return { 
        ...rec, 
        entrada_normalizada: entrada,
        salida_normalizada: salida,
        es_feriado: esFeriado, 
        es_dia_libre,
        incidencia_detectada: coincidenciaInc?.tipo,
        minutos_tardanza: tardanzaMins,
        minutos_extras: extrasMins,
        minutos_penalizados: minsPenalizados,
        requiereConfirmacionHE,
        sucursal_ponche: emp?.sucursal_principal || "Tania 1"
      };
    });
  }, [asistencia, incidencias, empleados, feriadosRD]);

  // --- FILTRADO ---
  const registrosFiltrados = useMemo(() => {
    return asistenciaEnriquecida.filter((rec) => {
      const emp = empleados.find(e => e.id_reloj === rec.id_reloj);
      if (!emp) return false;
      const matchSearch = emp.nombre.toLowerCase().includes(search.toLowerCase()) || rec.id_reloj.includes(search);
      const matchSucursal = filterSucursal === "Todos" || emp.sucursal_principal === filterSucursal;
      const matchFecha = filterFecha === "Todos" || rec.fecha === filterFecha;
      
      if (subTab === "errores") return matchSearch && matchSucursal && matchFecha && rec.error_reloj;
      return matchSearch && matchSucursal && matchFecha;
    });
  }, [asistenciaEnriquecida, subTab, search, filterSucursal, filterFecha, empleados]);

  // --- AGRUPACIÓN ---
  const listaGrouped = useMemo(() => {
    const mapa: Record<string, EmpleadoAsistenciaGrupal> = {};
    registrosFiltrados.forEach((rec) => {
      const emp = empleados.find(e => e.id_reloj === rec.id_reloj);
      if (!emp) return;
      if (!mapa[rec.id_reloj]) {
        mapa[rec.id_reloj] = { 
          id_reloj: emp.id_reloj, nombre: emp.nombre, cargo: emp.cargo, 
          sucursal_principal: emp.sucursal_principal, exento: emp.exento_ponche, 
          totalDescuento: 0, 
          totalMinutosPenalizados: 0,
          alertasAcumuladas: new Set(), records: [] 
        };
      }
      const monto = calcularDescuentoPonche(rec, emp, configTasas);
      mapa[rec.id_reloj].totalDescuento += monto;
      mapa[rec.id_reloj].totalMinutosPenalizados += (rec.minutos_penalizados || 0);
      mapa[rec.id_reloj].records.push(rec);
      const alerta = obtenerAlertaSimplificada(rec, emp);
      if (alerta && alerta !== "Correcto") mapa[rec.id_reloj].alertasAcumuladas.add(alerta);
    });
    return Object.values(mapa);
  }, [registrosFiltrados, empleados, configTasas]);

  // --- MANEJADORES ---
  const handleEdit = (rec: any) => {
    const idUnicoFila = `${rec.id_reloj}-${rec.fecha}`;
    setEditandoRegistroId(idUnicoFila);
    setNuevaEntrada(rec.entrada_normalizada !== "—" ? rec.entrada_normalizada : "08:00");
    setNuevaSalida(rec.salida_normalizada !== "—" ? rec.salida_normalizada : "17:00");
  };

  const handleSave = (idCompuesto: string) => {
    if (corregirPoncheIndividual) {
      corregirPoncheIndividual(idCompuesto, nuevaEntrada, nuevaSalida);
      setEditandoRegistroId(null);
      setModoEdicionActivo(false);
    }
  };

  const handleAprobarHE = (idCompuesto: string) => {
    if (aprobarHorasExtras) {
      aprobarHorasExtras(idCompuesto);
    }
  };

  const cardClasses = "bg-white border border-slate-100 rounded-2xl shadow-sm transition-all";

  return (
    <div className="flex gap-4 p-4 bg-[#F8FAFC] min-h-screen w-full font-sans">
      <div className="flex-1 flex flex-col gap-5 min-w-0">
        
        {/* PANEL DE MÉTRICAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div onClick={() => setSubTab("errores")} className={`${cardClasses} p-5 flex items-center justify-between cursor-pointer hover:border-red-200 ${subTab === "errores" ? "ring-2 ring-red-500/10" : ""}`}>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Errores Biométricos</span>
              <span className="text-2xl font-black text-rose-600 block">{asistenciaEnriquecida.filter(a => a.error_reloj).length}</span>
            </div>
            <div className="bg-rose-50 p-2.5 rounded-xl text-rose-600"><AlertTriangle className="w-5 h-5" /></div>
          </div>
          <div className={`${cardClasses} p-5 flex items-center justify-between`}>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">HE por Autorizar</span>
              <span className="text-2xl font-black text-orange-500 block">{asistenciaEnriquecida.filter(a => a.requiereConfirmacionHE && !a.he_aprobada).length}</span>
            </div>
            <div className="bg-orange-50 p-2.5 rounded-xl text-orange-500"><Clock className="w-5 h-5" /></div>
          </div>
          <div className="bg-slate-900 p-5 rounded-2xl shadow-lg flex items-center justify-between text-white">
            <div>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Impacto en Nómina</span>
              <span className="text-xl font-mono font-bold block text-emerald-400">
                {formatMonto(listaGrouped.reduce((acc, curr) => acc + curr.totalDescuento, 0))}
              </span>
            </div>
            <div className="bg-white/10 p-2.5 rounded-xl text-emerald-400"><DollarSign className="w-5 h-5" /></div>
          </div>
        </div>

        {/* CONTROLES DE FILTRADO */}
        <div className="bg-white p-3 border rounded-2xl flex flex-col sm:flex-row gap-3 items-center shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar colaborador..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border rounded-xl text-xs outline-none" />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select value={filterSucursal} onChange={e => setFilterSucursal(e.target.value)} className="flex-1 sm:w-44 px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold text-slate-600 cursor-pointer outline-none">
              <option value="Todos">Todas las Sucursales</option>
              {SUCURSALES_DISPONIBLES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={() => setModoEdicionActivo(!modoEdicionActivo)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${modoEdicionActivo ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"}`}>
              {modoEdicionActivo ? <><X className="w-3.5 h-3.5" /> Cancelar</> : <><Edit3 className="w-3.5 h-3.5" /> Modo Edición</>}
            </button>
          </div>
        </div>

        {/* TABS NATIVAS */}
        <div className="flex gap-2">
          {[{ id: "todos", label: "Historial de Ponches", icon: <FileText /> }, { id: "tardanzas", label: "Resumen Alertas", icon: <AlertTriangle /> }].map(tab => (
            <button key={tab.id} onClick={() => setSubTab(tab.id as any)} className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${subTab === tab.id ? "bg-slate-800 text-white shadow-md" : "bg-white text-slate-500 border"}`}>
              {React.cloneElement(tab.icon as any, { className: "w-3.5 h-3.5" })} {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
          <div className="flex gap-2 p-3 bg-slate-50/50 border-b items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tabla Operativa</span>
            {subTab === "errores" && (
              <button onClick={corregirTodosErroresMasivo} className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all">
                <Sparkles className="w-3 h-3" /> Ejecutar Saneamiento Masivo
              </button>
            )}
          </div>
          {subTab === "tardanzas" ? (
            <ResumenAlertasTable listaGroupedTardanzas={listaGrouped} selectedIdReloj={selectedIdReloj} setSelectedIdReloj={setSelectedIdReloj} />
          ) : (
            <HistorialPonchesTable 
              registros={registrosFiltrados} 
              empleados={empleados} 
              tasas={configTasas} 
              selectedIdReloj={selectedIdReloj} 
              setSelectedIdReloj={setSelectedIdReloj}
              editandoRegistroId={editandoRegistroId} 
              nuevaEntrada={nuevaEntrada} 
              nuevaSalida={nuevaSalida}
              setNuevaEntrada={setNuevaEntrada} 
              setNuevaSalida={setNuevaSalida}
              iniciarEdicion={handleEdit} 
              guardarEdicion={handleSave} 
              cancelarEdicion={() => setEditandoRegistroId(null)}
              aprobarHE={handleAprobarHE}
              // --- VINCULACIÓN DE NUEVAS FUNCIONES ---
              modoEdicionActivo={modoEdicionActivo}
              onAgregar={agregarNuevoRegistroAsistencia}
              onEliminar={eliminarRegistroAsistencia}
              onCambiarTurno={actualizarTurnoOEstado}
            />
          )}
        </div>
      </div>

      <ExpedienteLateral 
        panelWidth={panelWidth} 
        empleado={empleados.find(e => e.id_reloj === selectedIdReloj)} 
        records={asistenciaEnriquecida.filter(p => p.id_reloj === selectedIdReloj)}
        tasas={configTasas} editandoPanelId={null} panelNuevaEntrada="" panelNuevaSalida=""
        setPanelNuevaEntrada={() => {}} setPanelNuevaSalida={() => {}}
        iniciarEdicionPanel={() => {}} cancelarEdicionPanel={() => {}} guardarEdicionPanel={() => {}}
        totalDescuentoEmpleado={listaGrouped.find(g => g.id_reloj === selectedIdReloj)?.totalDescuento || 0}
      />
    </div>
  );
}