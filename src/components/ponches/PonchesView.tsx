"use client";
import React, { useMemo, useState } from "react";
import { usePay } from "@/context/PayContext";
import { SUCURSALES_DISPONIBLES } from "@/data/mockData";
import { Search, AlertTriangle, FileText, DollarSign, Upload, UserX, Plus } from "lucide-react";

import { useAsistenciaEnriquecida } from "./hooks/useAsistenciaEnriquecida";
import { formatMonto } from "./hooks/useAsistenciaUtils";
import type { FiltrosPonches } from "./types";
import type { ReporteImportacion } from "./lib/parsearArchivo";

import HistorialPonchesTable from "./subcomponents/HistorialPonchesTable";
import ResumenAlertasTable from "./subcomponents/ResumenAlertasTable";
import ExpedienteLateral from "./subcomponents/ExpedienteLateral";
import NuevoRegistroForm from "./subcomponents/NuevoRegistroForm";

const card = "bg-white border border-slate-100 rounded-2xl shadow-sm transition-all";

export default function PonchesView() {
  const {
    empleados,
    asistencia,
    incidencias,
    configTasas,
    importarArchivo,
    corregirPonche,
    eliminarRegistro,
    actualizarTurno,
    agregarRegistro,
  } = usePay();

  const [filtros, setFiltros] = useState<FiltrosPonches>({
    search: "",
    sucursal: "Todos",
    fecha: "Todos",
    soloErrores: false,
  });
  const [tab, setTab] = useState<"historial" | "resumen">("historial");
  const [selectedIdReloj, setSelectedIdReloj] = useState("");
  const [reporte, setReporte] = useState<ReporteImportacion | null>(null);
  const [mostrarNuevo, setMostrarNuevo] = useState(false);

  const setFiltro = (patch: Partial<FiltrosPonches>) =>
    setFiltros((f) => ({ ...f, ...patch }));

  const { registrosFiltrados, grupos, metricas } = useAsistenciaEnriquecida({
    asistencia,
    empleados,
    incidencias,
    tasas: configTasas,
    filtros,
  });

  const fechasDisponibles = useMemo(
    () => Array.from(new Set(asistencia.map((r) => r.fecha))).sort(),
    [asistencia]
  );

  const empleadoSel = empleados.find((e) => e.id_reloj === selectedIdReloj);
  const registrosSel = registrosFiltrados.filter((r) => r.id_reloj === selectedIdReloj);
  const totalSel = grupos.find((g) => g.id_reloj === selectedIdReloj)?.totalDescuento ?? 0;

  const onImportar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const texto = await file.text();
    const suc = filtros.sucursal === "Todos" ? SUCURSALES_DISPONIBLES[0] : filtros.sucursal;
    setReporte(importarArchivo(texto, suc));
    e.target.value = ""; // permite re-subir el mismo archivo
  };

  return (
    <div className="flex gap-4 p-4 bg-[#F8FAFC] min-h-screen w-full font-sans">
      <div className="flex-1 flex flex-col gap-5 min-w-0">
        {/* MÉTRICAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setFiltro({ soloErrores: !filtros.soloErrores })}
            className={`${card} p-5 flex items-center justify-between text-left cursor-pointer hover:border-red-200 ${
              filtros.soloErrores ? "ring-2 ring-red-500/20" : ""
            }`}
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Por Revisar
              </span>
              <span className="text-2xl font-black text-rose-600 block">{metricas.errores}</span>
            </div>
            <div className="bg-rose-50 p-2.5 rounded-xl text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </button>

          <div className={`${card} p-5 flex items-center justify-between`}>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Ausencias
              </span>
              <span className="text-2xl font-black text-amber-500 block">{metricas.ausencias}</span>
            </div>
            <div className="bg-amber-50 p-2.5 rounded-xl text-amber-500">
              <UserX className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl shadow-lg flex items-center justify-between text-white">
            <div>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                Impacto en Nómina
              </span>
              <span className="text-xl font-mono font-bold block text-emerald-400">
                {formatMonto(metricas.impactoNomina)}
              </span>
            </div>
            <div className="bg-white/10 p-2.5 rounded-xl text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* FILTROS + IMPORTAR */}
        <div className="bg-white p-3 border rounded-2xl flex flex-col sm:flex-row gap-3 items-center shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              value={filtros.search}
              onChange={(e) => setFiltro({ search: e.target.value })}
              placeholder="Buscar colaborador..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border rounded-xl text-xs outline-none"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={filtros.sucursal}
              onChange={(e) => setFiltro({ sucursal: e.target.value })}
              className="flex-1 sm:w-40 px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold text-slate-600 cursor-pointer outline-none"
            >
              <option value="Todos">Todas las Sucursales</option>
              {SUCURSALES_DISPONIBLES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={filtros.fecha}
              onChange={(e) => setFiltro({ fecha: e.target.value })}
              className="flex-1 sm:w-36 px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold text-slate-600 cursor-pointer outline-none"
            >
              <option value="Todos">Todas las fechas</option>
              {fechasDisponibles.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <label className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-white cursor-pointer flex items-center gap-2 hover:bg-slate-700 transition-all">
              <Upload className="w-3.5 h-3.5" /> Importar
              <input type="file" accept=".txt,.csv,.tsv" onChange={onImportar} className="hidden" />
            </label>
            <button
              onClick={() => setMostrarNuevo((v) => !v)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                mostrarNuevo ? "bg-emerald-100 text-emerald-700" : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              <Plus className="w-3.5 h-3.5" /> Nuevo
            </button>
          </div>
        </div>

        {/* NUEVO REGISTRO */}
        {mostrarNuevo && (
          <NuevoRegistroForm
            empleados={empleados}
            onAgregar={(idReloj, fecha, turno, entrada, salida) => {
              agregarRegistro(idReloj, fecha, turno, entrada, salida);
              setMostrarNuevo(false);
            }}
            onCerrar={() => setMostrarNuevo(false)}
          />
        )}

        {/* REPORTE DE IMPORTACIÓN */}
        {reporte && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-800 flex flex-wrap gap-x-5 gap-y-1">
            <span className="font-bold">Importado: {reporte.sucursal}</span>
            <span>Filas leídas: {reporte.filasLeidas}</span>
            <span>Días generados: {reporte.diasGenerados}</span>
            <span>Duplicados consolidados: {reporte.duplicadosConsolidados}</span>
            <span className="text-rose-700 font-semibold">Por revisar: {reporte.paraRevisar}</span>
            <span>Ausencias: {reporte.ausencias}</span>
            <button onClick={() => setReporte(null)} className="ml-auto underline">
              ocultar
            </button>
          </div>
        )}

        {/* TABS */}
        <div className="flex gap-2">
          {[
            { id: "historial", label: "Historial de Ponches", icon: <FileText /> },
            { id: "resumen", label: "Resumen Alertas", icon: <AlertTriangle /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as "historial" | "resumen")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                tab === t.id ? "bg-slate-800 text-white shadow-md" : "bg-white text-slate-500 border"
              }`}
            >
              {React.cloneElement(t.icon, { className: "w-3.5 h-3.5" })} {t.label}
            </button>
          ))}
        </div>

        {/* TABLA */}
        <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
          {tab === "resumen" ? (
            <ResumenAlertasTable
              grupos={grupos}
              selectedIdReloj={selectedIdReloj}
              setSelectedIdReloj={setSelectedIdReloj}
            />
          ) : (
            <HistorialPonchesTable
              registros={registrosFiltrados}
              empleados={empleados}
              tasas={configTasas}
              selectedIdReloj={selectedIdReloj}
              setSelectedIdReloj={setSelectedIdReloj}
              onCorregir={corregirPonche}
              onEliminar={eliminarRegistro}
              onAsignarTurno={actualizarTurno}
            />
          )}
        </div>
      </div>

      <ExpedienteLateral
        empleado={empleadoSel}
        registros={registrosSel}
        totalDescuento={totalSel}
      />
    </div>
  );
}