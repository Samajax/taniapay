"use client";
import React, { useState, useMemo } from "react";
import { usePay } from "@/context/PayContext";
import { Empleado, SUCURSALES_DISPONIBLES } from "@/data/mockData";
import { 
  Search, 
  MapPin, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Coins, 
  TrendingDown, 
  AlertCircle,
  Clock,
  Calendar,
  ShieldAlert,
  Calculator,
  UserCheck,
  Palmtree,
  Receipt,
  DollarSign,
  ChevronRight
} from "lucide-react";

// --- FUNCIONES AUXILIARES DE FORMATO ---
const formatMoneda = (val: number) => 
  "RD$ " + val.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function NominaView() {
  const { 
    empleados = [], 
    asistencia = [], 
    incidencias = [] 
  } = usePay();

  // --- ESTADOS DE FILTRADO ---
  const [search, setSearch] = useState("");
  const [filterSucursal, setFilterSucursal] = useState("Todos");
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string | null>("12"); // Denny enfocado por defecto

  // Parámetros Contables del Panel Regulatorio
  const [tasas] = useState({
    diaTrabajoFactor: 23.83,
    afpPorcentaje: 0.0287,  
    sfsPorcentaje: 0.0304,  
    horaBase: 144.20
  });

  // Base de Feriados Oficiales de control interno
  const feriadosRDFechas = useMemo(() => [
    "2026-01-01", "2026-01-05", "2026-01-21", "2026-01-26", 
    "2026-02-27", "2026-04-03", "2026-05-04", "2026-06-04", 
    "2026-08-16", "2026-09-24", "2026-11-09", "2026-12-25"
  ], []);

  // --- MOTOR CONTABLE INTEGRADO ---
  const nominaCalculada = useMemo(() => {
    const parseMins = (h: string) => {
      if (!h || h === "—" || h.trim() === "") return 0;
      const [hrs, mins] = h.split(":").map(Number);
      return hrs * 60 + mins;
    };

    return empleados.map((emp) => {
      const registrosEmpleado = asistencia.filter(p => p.id_reloj === emp.id_reloj);

      let totalMinutosTardanzaPenalizables = 0;
      let totalDiasAusenciaCompleta = 0;
      let totalMinutosExtrasAprobados = 0;

      registrosEmpleado.forEach((rec: any) => {
        const coincidenciaIncidencia = incidencias.find(inc => inc.id_reloj === rec.id_reloj && rec.fecha === inc.fecha_inicio);
        const tieneLicenciaOVacaciones = coincidenciaIncidencia && ["Vacaciones", "Licencia Médica", "Permiso", "Cobertura"].includes(coincidenciaIncidencia.tipo);
        
        if (tieneLicenciaOVacaciones || emp.exento_ponche || rec.error_reloj) {
          return; 
        }

        const entradaEfectiva = rec.entrada || rec.hora_entrada || "—";
        const salidaEfectiva = rec.salida || rec.hora_salida || "—";
        const esFeriado = feriadosRDFechas.includes(rec.fecha);

        const sinPonchesFisicos = (!entradaEfectiva || entradaEfectiva === "—" || entradaEfectiva.trim() === "") && 
                                  (!salidaEfectiva || salidaEfectiva === "—" || salidaEfectiva.trim() === "");

        if (sinPonchesFisicos) {
          if (rec.tipo_incidencia === "Normal" || !rec.tipo_incidencia) {
            return; 
          }
          
          if ((rec.tipo_incidencia === "Ausencia" || rec.tipo_incidencia === "Sanción") && !esFeriado) {
            totalDiasAusenciaCompleta += 1;
          }
          return;
        }

        if (entradaEfectiva !== "—" && entradaEfectiva.trim() !== "") {
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

          let tardanzaEntrada = entradaMins - horaTeoricaEntrada;
          if (tardanzaEntrada < 0) tardanzaEntrada = 0;

          if (tardanzaEntrada > 0 && tardanzaEntrada <= 10) {
            tardanzaEntrada = 0;
          }

          let salidaTemprana = 0;
          if (salidaEfectiva !== "—" && salidaEfectiva.trim() !== "") {
            salidaTemprana = horaTeoricaSalida - salidaMins;
            if (salidaTemprana < 0) salidaTemprana = 0;
          }

          totalMinutosTardanzaPenalizables += (tardanzaEntrada + salidaTemprana);

          if (emp.horas_extras_fijas && salidaMins > horaTeoricaSalida) {
            totalMinutosExtrasAprobados += (salidaMins - horaTeoricaSalida);
          }
        }
      });

      // --- ESTRUCTURA DE LIQUIDACIÓN FINANCIERA ---
      const sueldoMensualBase = emp.sueldo_base || 27489.57; 
      const sueldoQuincenalBruto = sueldoMensualBase / 2;
      const valorDiaRegular = sueldoMensualBase / tasas.diaTrabajoFactor;
      const valorMinutoRegular = tasas.horaBase / 60;

      const montoDescuentoAusencias = totalDiasAusenciaCompleta * valorDiaRegular;
      const montoDescuentoTardanzas = totalMinutosTardanzaPenalizables * valorMinutoRegular;
      const totalRetencionAsistencia = montoDescuentoAusencias + montoDescuentoTardanzas;

      const montoHorasExtras = totalMinutosExtrasAprobados * ((tasas.horaBase * 1.35) / 60);

      // --- SEGREGACIÓN MAESTRA DE INCIDENCIAS ---
      const cxcBaseMaestro = emp.monto_vales_cxc || 0;
      const incidenciasEmpleado = incidencias.filter(inc => inc.id_reloj === emp.id_reloj);
      
      let montoVacacionesQuincena = 0;
      let montoCxcQuincena = cxcBaseMaestro;
      let montoValesQuincena = 0;

      incidenciasEmpleado.forEach((inc) => {
        const typeClean = inc.tipo.toLowerCase();
        const montoItem = Number(inc.monto) || 0;

        if (typeClean.includes("vacaciones")) {
          const diasVac = Number(inc.cantidad_dias) || 1;
          montoVacacionesQuincena += (diasVac * valorDiaRegular);
        } else if (typeClean.includes("cxc") || typeClean.includes("cuentas")) {
          const cuotas = Number(inc.cuotas) || 1;
          montoCxcQuincena += (montoItem / cuotas);
        } else if (typeClean.includes("vale") || typeClean.includes("faltante") || typeClean.includes("descuento")) {
          montoValesQuincena += montoItem;
        }
      });

      const totalFaltantesYAvances = montoCxcQuincena + montoValesQuincena;

      // Base Imponible TSS
      const sueldoNetoAsistencia = Math.max(0, sueldoQuincenalBruto - totalRetencionAsistencia + montoHorasExtras);

      const deduccionAfp = sueldoNetoAsistencia * tasas.afpPorcentaje;
      const deduccionSfs = sueldoNetoAsistencia * tasas.sfsPorcentaje;
      const totalDeduccionesLey = deduccionAfp + deduccionSfs;
      
      const sueldoNetoPagar = Math.max(0, sueldoNetoAsistencia - totalDeduccionesLey - totalFaltantesYAvances);

      return {
        id_reloj: emp.id_reloj,
        nombre: emp.nombre,
        cargo: emp.cargo,
        sucursal: emp.sucursal_principal,
        sueldoQuincenalBruto,
        totalMinutosTardanzaPenalizables,
        totalDiasAusenciaCompleta,
        montoDescuentoAusencias,
        montoDescuentoTardanzas,
        totalRetencionAsistencia,
        montoHorasExtras,
        montoVacacionesQuincena,
        montoCxcQuincena,
        montoValesQuincena,
        totalFaltantesYAvances,
        deduccionAfp,
        deduccionSfs,
        totalDeduccionesLey,
        sueldoNetoPagar
      };
    });
  }, [empleados, asistencia, incidencias, feriadosRDFechas, tasas]);

  // --- CÓMPUTO DE INDICADORES GLOBALES ---
  const metricasGlobales = useMemo(() => {
    let bruto = 0, retenciones = 0, ley = 0, neto = 0;
    let totalVacaciones = 0, totalCxc = 0, totalVales = 0;

    nominaCalculada.forEach(n => {
      bruto += n.sueldoQuincenalBruto;
      retenciones += n.totalRetencionAsistencia;
      ley += n.totalDeduccionesLey;
      neto += n.sueldoNetoPagar;
      totalVacaciones += n.montoVacacionesQuincena;
      totalCxc += n.montoCxcQuincena;
      totalVales += n.montoValesQuincena;
    });

    return { bruto, retenciones, ley, neto, totalVacaciones, totalCxc, totalVales };
  }, [nominaCalculada]);

  const nominaFiltrada = useMemo(() => {
    return nominaCalculada.filter(n => {
      const matchSearch = n.nombre.toLowerCase().includes(search.toLowerCase()) || n.id_reloj.includes(search);
      const matchSucursal = filterSucursal === "Todos" || n.sucursal === filterSucursal;
      return matchSearch && matchSucursal;
    });
  }, [nominaCalculada, search, filterSucursal]);

  const empleadoEnfocado = nominaCalculada.find(n => n.id_reloj === selectedEmpleadoId);

  return (
    <div className="flex flex-col gap-6 w-full font-sans text-slate-800">
      
      {/* SECCIÓN DE MÉTRICAS (KPIs) - REDISEÑADA */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
        {[
          { label: "Masa Bruta", value: metricasGlobales.bruto, color: "text-slate-800", bgIcon: "bg-slate-100" },
          { label: "Dsctos. Ponches", value: metricasGlobales.retenciones, color: "text-amber-600", bgIcon: "bg-amber-50", isNegative: true },
          { label: "Retenciones TSS", value: metricasGlobales.ley, color: "text-blue-600", bgIcon: "bg-blue-50", isNegative: true },
          { label: "Vacaciones Pagadas", value: metricasGlobales.totalVacaciones, color: "text-sky-600", bgIcon: "bg-sky-50" },
          { label: "Descuentos CxC", value: metricasGlobales.totalCxc, color: "text-indigo-600", bgIcon: "bg-indigo-50", isNegative: true },
          { label: "Vales / Faltantes", value: metricasGlobales.totalVales, color: "text-rose-600", bgIcon: "bg-rose-50", isNegative: true },
        ].map((item, idx) => (
          <div key={idx} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
            <span className={`text-base font-black font-mono mt-1 block ${item.color}`}>
              {item.isNegative && item.value > 0 ? "-" : ""}{formatMoneda(item.value)}
            </span>
          </div>
        ))}
        {/* KPI NETO DESTACADO */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-5 border border-emerald-600 shadow-md flex flex-col justify-center text-white relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-4 translate-y-4">
            <DollarSign className="w-20 h-20" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-100 relative z-10">Neto Liquidable</span>
          <span className="text-lg font-black font-mono mt-1 block relative z-10">{formatMoneda(metricasGlobales.neto)}</span>
        </div>
      </div>

      {/* ÁREA CENTRAL: TABLA Y PANEL LATERAL */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6 items-start">
        
        {/* COLUMNA IZQUIERDA: CONTROLES Y TABLA */}
        <div className="flex flex-col gap-5 min-w-0">
          
          {/* BARRA DE HERRAMIENTAS */}
          <div className="bg-white border border-slate-100 rounded-3xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
            <div className="relative w-full sm:w-80">
              <span className="absolute left-4 top-3 text-slate-400 pointer-events-none"><Search className="w-4 h-4" /></span>
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Buscar colaborador o ID..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100 border-none rounded-xl text-xs font-medium outline-none focus:ring-4 focus:ring-slate-100 transition-all text-slate-700 placeholder-slate-400" 
              />
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto justify-end items-center">
              <div className="relative">
                <span className="absolute left-4 top-3 text-slate-400 pointer-events-none"><MapPin className="w-4 h-4" /></span>
                <select 
                  value={filterSucursal} 
                  onChange={e => setFilterSucursal(e.target.value)} 
                  className="pl-10 pr-8 py-2.5 bg-slate-50 hover:bg-slate-100 border-none rounded-xl text-xs font-bold outline-none cursor-pointer focus:ring-4 focus:ring-slate-100 transition-all text-slate-700 appearance-none"
                >
                  <option value="Todos">Todas las Sucursales</option>
                  {SUCURSALES_DISPONIBLES?.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button 
                onClick={() => alert("Generando dispersión bancaria...")} 
                className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" /> Exportar a Banco
              </button>
            </div>
          </div>

          {/* TABLA PRINCIPAL DE NÓMINA */}
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm table-fixed min-w-[1200px]">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 h-14">
                    <th className="p-4 pl-6 w-64">Colaborador</th>
                    <th className="p-4 text-right w-28">Bruto Q.</th>
                    <th className="p-4 text-center w-32">Dscto. Asist.</th>
                    <th className="p-4 text-right w-28">Hrs. Extras</th>
                    <th className="p-4 text-right w-28">TSS (SFS)</th>
                    <th className="p-4 text-right w-28">TSS (AFP)</th>
                    <th className="p-4 text-right w-36">CxC / Vales</th>
                    <th className="p-4 pr-6 text-right w-36 text-emerald-600">Neto a Pagar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {nominaFiltrada.map((n) => {
                    const isSelected = selectedEmpleadoId === n.id_reloj;
                    return (
                      <tr 
                        key={n.id_reloj} 
                        onClick={() => setSelectedEmpleadoId(n.id_reloj)} 
                        className={`h-16 cursor-pointer transition-all ${isSelected ? "bg-indigo-50/50 border-l-4 border-l-indigo-500" : "hover:bg-slate-50 border-l-4 border-l-transparent"}`}
                      >
                        <td className="p-4 pl-6">
                          <div className="font-bold text-xs text-slate-800 tracking-tight">{n.nombre}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-1">ID: {n.id_reloj} • {n.cargo}</div>
                        </td>
                        <td className="p-4 text-right font-mono text-xs font-bold text-slate-600">{formatMoneda(n.sueldoQuincenalBruto)}</td>
                        <td className="p-4 text-center">
                          {n.totalRetencionAsistencia > 0 ? (
                            <div className="inline-flex flex-col items-center justify-center bg-rose-50 border border-rose-100 rounded-lg px-2 py-1">
                              <span className="text-rose-600 font-bold font-mono text-xs">-{formatMoneda(n.totalRetencionAsistencia)}</span>
                              <span className="text-[9px] text-rose-400 font-bold tracking-wider mt-0.5">
                                {n.totalDiasAusenciaCompleta > 0 ? `${n.totalDiasAusenciaCompleta}D ` : ""}
                                {n.totalMinutosTardanzaPenalizables > 0 ? `${n.totalMinutosTardanzaPenalizables}M` : ""}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-300 font-mono text-xs">—</span>
                          )}
                        </td>
                        <td className="p-4 text-right font-mono text-xs font-bold text-emerald-500">
                          {n.montoHorasExtras > 0 ? `+${formatMoneda(n.montoHorasExtras)}` : <span className="text-slate-300 font-normal">—</span>}
                        </td>
                        <td className="p-4 text-right font-mono text-xs text-slate-500">-{formatMoneda(n.deduccionSfs)}</td>
                        <td className="p-4 text-right font-mono text-xs text-slate-500">-{formatMoneda(n.deduccionAfp)}</td>
                        <td className="p-4 text-right font-mono text-xs font-bold text-rose-500">
                          {n.totalFaltantesYAvances > 0 ? `-${formatMoneda(n.totalFaltantesYAvances)}` : <span className="text-slate-300 font-normal">—</span>}
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <span className="font-mono font-black text-emerald-600 text-sm bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                            {formatMoneda(n.sueldoNetoPagar)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: EXPEDIENTE CONTABLE (RECIBO) */}
        <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-xl sticky top-4">
          {empleadoEnfocado ? (
            <div className="flex flex-col gap-6 text-xs animate-fadeIn">
              
              {/* HEADER DEL EMPLEADO */}
              <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg border border-indigo-100">
                  {empleadoEnfocado.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Volante de Pago</span>
                  <h4 className="font-black text-slate-800 text-sm uppercase leading-tight tracking-tight">{empleadoEnfocado.nombre}</h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-1 font-bold">ID: {empleadoEnfocado.id_reloj} • {empleadoEnfocado.sucursal}</p>
                </div>
              </div>

              {/* GRAN TOTAL */}
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 rounded-2xl text-white shadow-md relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10">
                  <DollarSign className="w-32 h-32 -mt-6 -mr-6" />
                </div>
                <span className="text-[10px] uppercase font-bold text-emerald-100 tracking-widest block relative z-10">Neto a Depositar</span>
                <span className="text-3xl font-black font-mono block mt-1 relative z-10">{formatMoneda(empleadoEnfocado.sueldoNetoPagar)}</span>
              </div>

              {/* DESGLOSE (ESTILO RECIBO) */}
              <div className="flex flex-col gap-0">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-1">Desglose de la Transacción</span>

                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 font-medium text-slate-700 flex flex-col gap-3">
                  {/* Ingresos */}
                  <div className="flex justify-between items-center text-slate-800">
                    <span className="text-[11px] font-bold flex items-center gap-2"><Coins className="w-4 h-4 text-emerald-500" /> Sueldo Bruto</span>
                    <span className="font-mono font-black">{formatMoneda(empleadoEnfocado.sueldoQuincenalBruto)}</span>
                  </div>

                  {empleadoEnfocado.montoHorasExtras > 0 && (
                    <div className="flex justify-between items-center text-emerald-700">
                      <span className="text-[11px] font-bold flex items-center gap-2"><Calculator className="w-4 h-4 text-emerald-500" /> Horas Extras</span>
                      <span className="font-mono font-black">+{formatMoneda(empleadoEnfocado.montoHorasExtras)}</span>
                    </div>
                  )}

                  {empleadoEnfocado.montoVacacionesQuincena > 0 && (
                    <div className="flex justify-between items-center text-sky-700">
                      <span className="text-[11px] font-bold flex items-center gap-2"><Palmtree className="w-4 h-4 text-sky-500" /> Vacaciones Pagadas</span>
                      <span className="font-mono font-black">+{formatMoneda(empleadoEnfocado.montoVacacionesQuincena)}</span>
                    </div>
                  )}

                  <div className="border-t border-slate-200/60 my-1"></div>

                  {/* Deducciones Operativas */}
                  {(empleadoEnfocado.totalDiasAusenciaCompleta > 0 || empleadoEnfocado.totalMinutosTardanzaPenalizables > 0) && (
                    <div className="flex flex-col gap-2 pl-2 border-l-2 border-rose-200 py-1">
                      {empleadoEnfocado.totalDiasAusenciaCompleta > 0 && (
                        <div className="flex justify-between items-center text-rose-600">
                          <span className="text-[10px] font-bold">Ausencias ({empleadoEnfocado.totalDiasAusenciaCompleta} días)</span>
                          <span className="font-mono font-bold">-{formatMoneda(empleadoEnfocado.montoDescuentoAusencias)}</span>
                        </div>
                      )}
                      {empleadoEnfocado.totalMinutosTardanzaPenalizables > 0 && (
                        <div className="flex justify-between items-center text-amber-600">
                          <span className="text-[10px] font-bold">Tardanzas ({empleadoEnfocado.totalMinutosTardanzaPenalizables} min)</span>
                          <span className="font-mono font-bold">-{formatMoneda(empleadoEnfocado.montoDescuentoTardanzas)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Deducciones de Ley */}
                  <div className="flex justify-between items-center text-slate-500 mt-1">
                    <span className="text-[10px] font-bold">TSS - Seguro Salud (SFS)</span>
                    <span className="font-mono font-bold">-{formatMoneda(empleadoEnfocado.deduccionSfs)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="text-[10px] font-bold">TSS - Pensión (AFP)</span>
                    <span className="font-mono font-bold">-{formatMoneda(empleadoEnfocado.deduccionAfp)}</span>
                  </div>

                  {/* CxC y Vales */}
                  {(empleadoEnfocado.montoCxcQuincena > 0 || empleadoEnfocado.montoValesQuincena > 0) && (
                    <>
                      <div className="border-t border-slate-200/60 my-1"></div>
                      {empleadoEnfocado.montoCxcQuincena > 0 && (
                        <div className="flex justify-between items-center text-indigo-600">
                          <span className="text-[10px] font-bold flex items-center gap-1.5"><Receipt className="w-3 h-3" /> Amortización CxC</span>
                          <span className="font-mono font-bold">-{formatMoneda(empleadoEnfocado.montoCxcQuincena)}</span>
                        </div>
                      )}
                      {empleadoEnfocado.montoValesQuincena > 0 && (
                        <div className="flex justify-between items-center text-rose-600">
                          <span className="text-[10px] font-bold flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> Vales / Faltantes</span>
                          <span className="font-mono font-bold">-{formatMoneda(empleadoEnfocado.montoValesQuincena)}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* ACCIONES */}
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button 
                  onClick={() => alert("Abriendo PDF del Volante...")} 
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <FileText className="w-4 h-4 text-slate-400" /> Ver Volante
                </button>
                <button 
                  onClick={() => alert("Comprobante enviado al correo.")} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <UserCheck className="w-4 h-4 text-indigo-200" /> Timbrar
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center h-full flex flex-col items-center justify-center py-20 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/80 my-auto">
              <div className="bg-white p-4 rounded-full shadow-sm border border-slate-100 mb-4">
                <Receipt className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-xs font-bold text-slate-500 mb-1">Sin Selección</p>
              <p className="text-[11px] font-medium text-slate-400 leading-relaxed max-w-[200px]">
                Selecciona un colaborador en la tabla para auditar su desglose salarial.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}