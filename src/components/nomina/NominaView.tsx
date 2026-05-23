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
  Receipt
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
          // Logística legal: calcular el valor proporcional quincenal si se procesan las vacaciones
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

  // --- CÓMPUTO DE INDICADORES GLOBALES (ACTUALIZADO) ---
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
  const cardClasses = "bg-white border border-[#E5E7EB] rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] font-sans";
  const selectClasses = "pl-9 pr-8 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-xs font-medium outline-none cursor-pointer focus:bg-white focus:border-[#3B82F6] transition-all text-[#1F2937] appearance-none";

  return (
    <div className="flex flex-col gap-5 w-full text-[#111827]">
      
      {/* SECCIÓN DE CARDS SUPERIORES COMPLETA (RESPONSIVA CON LOS NUEVOS CONTADORES) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <div className={`${cardClasses} p-4 border-l-4 border-l-slate-900`}>
          <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Masa Bruta</span>
          <span className="text-base font-black font-mono text-slate-800 mt-1 block">{formatMoneda(metricasGlobales.bruto)}</span>
        </div>
        <div className={`${cardClasses} p-4 border-l-4 border-l-amber-500`}>
          <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Dsctos. Ponches</span>
          <span className="text-base font-black font-mono text-amber-600 mt-1 block">-{formatMoneda(metricasGlobales.retenciones)}</span>
        </div>
        <div className={`${cardClasses} p-4 border-l-4 border-l-blue-600`}>
          <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Retenciones TSS</span>
          <span className="text-base font-black font-mono text-blue-600 mt-1 block">-{formatMoneda(metricasGlobales.ley)}</span>
        </div>
        {/* NUEVA CARD: VACACIONES */}
        <div className={`${cardClasses} p-4 border-l-4 border-l-sky-500`}>
          <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Vacaciones Pagadas</span>
          <span className="text-base font-black font-mono text-sky-600 mt-1 block">{formatMoneda(metricasGlobales.totalVacaciones)}</span>
        </div>
        {/* NUEVA CARD: CXC */}
        <div className={`${cardClasses} p-4 border-l-4 border-l-indigo-500`}>
          <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Descuentos CxC</span>
          <span className="text-base font-black font-mono text-indigo-600 mt-1 block">-{formatMoneda(metricasGlobales.totalCxc)}</span>
        </div>
        {/* NUEVA CARD: VALES Y FALTANTES */}
        <div className={`${cardClasses} p-4 border-l-4 border-l-rose-500`}>
          <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Vales y Faltantes</span>
          <span className="text-base font-black font-mono text-rose-600 mt-1 block">-{formatMoneda(metricasGlobales.totalVales)}</span>
        </div>
        <div className={`${cardClasses} p-4 border-l-4 border-l-emerald-600 bg-gradient-to-br from-emerald-50/20 to-transparent`}>
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Neto Liquidable</span>
          <span className="text-base font-black font-mono text-emerald-600 mt-1 block">{formatMoneda(metricasGlobales.neto)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6 items-start">
        {/* SECCIÓN DE TABLA Y FILTROS */}
        <div className="flex flex-col gap-5 min-w-0">
          {/* BARRA DE FILTROS */}
          <div className={`${cardClasses} p-4 flex flex-col sm:flex-row gap-3 items-center justify-between`}>
            <div className="relative w-full sm:w-72">
              <span className="absolute left-3 top-2.5 text-[#9CA3AF] pointer-events-none"><Search className="w-4 h-4" /></span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por colaborador o ID..." className="w-full pl-9 pr-3.5 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-xs outline-none focus:bg-white focus:border-[#3B82F6] transition-all" />
            </div>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-[#9CA3AF] pointer-events-none"><MapPin className="w-4 h-4" /></span>
                <select value={filterSucursal} onChange={e => setFilterSucursal(e.target.value)} className={selectClasses}>
                  <option value="Todos">Todas las Sucursales</option>
                  {SUCURSALES_DISPONIBLES?.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button onClick={() => alert("Generando dispersión bancaria...")} className="px-3 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm"><FileSpreadsheet className="w-4 h-4" /> Exportar Quincena</button>
            </div>
          </div>

          {/* TABLA PRINCIPAL */}
          <div className={`${cardClasses} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm table-fixed min-w-[1300px]">
                <thead>
                  <tr className="bg-[#F9FAFB] text-[10px] font-bold text-[#6B7280] uppercase tracking-wider border-b border-[#E5E7EB] h-12">
                    <th className="p-3 pl-5 w-64">Colaborador</th>
                    <th className="p-3 text-right w-28">Bruto Q.</th>
                    <th className="p-3 text-center w-36">Dscto. Ponche</th>
                    <th className="p-3 text-right w-28">Horas Ext.</th>
                    <th className="p-3 text-right w-28">SFS (ARS)</th>
                    <th className="p-3 text-right w-28">AFP</th>
                    <th className="p-3 text-right w-36">Faltantes y Avances</th>
                    <th className="p-3 pr-5 text-right w-36">Neto a Pagar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] text-[#1F2937]">
                  {nominaFiltrada.map((n) => (
                    <tr 
                      key={n.id_reloj} 
                      onClick={() => setSelectedEmpleadoId(n.id_reloj)} 
                      className={`h-14 cursor-pointer transition-colors ${selectedEmpleadoId === n.id_reloj ? "bg-[#EFF6FF]/60 font-medium" : "hover:bg-[#F9FAFB]"}`}
                    >
                      <td className="p-3 pl-5 text-[#111827]">
                        <div className="font-bold text-xs uppercase tracking-wide">{n.nombre.toUpperCase()}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {n.id_reloj} · {n.cargo}</div>
                      </td>
                      <td className="p-3 text-right font-mono text-xs font-semibold text-slate-600">{formatMoneda(n.sueldoQuincenalBruto)}</td>
                      <td className="p-3 text-center font-mono text-xs">
                        {n.totalRetencionAsistencia > 0 ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="text-red-600 font-bold">-{formatMoneda(n.totalRetencionAsistencia)}</span>
                            <span className="text-[9px] text-slate-400 font-medium">
                              {n.totalDiasAusenciaCompleta > 0 ? `${n.totalDiasAusenciaCompleta}f ` : ""}
                              {n.totalMinutosTardanzaPenalizables > 0 ? `${n.totalMinutosTardanzaPenalizables}m` : ""}
                            </span>
                          </div>
                        ) : ""}
                      </td>
                      <td className="p-3 text-right font-mono text-xs text-emerald-600 font-medium">
                        {n.montoHorasExtras > 0 ? `+${formatMoneda(n.montoHorasExtras)}` : "—"}
                      </td>
                      <td className="p-3 text-right font-mono text-xs text-slate-500">-{formatMoneda(n.deduccionSfs)}</td>
                      <td className="p-3 text-right font-mono text-xs text-slate-500">-{formatMoneda(n.deduccionAfp)}</td>
                      <td className="p-3 text-right font-mono text-xs text-rose-600 font-medium">
                        {n.totalFaltantesYAvances > 0 ? `-${formatMoneda(n.totalFaltantesYAvances)}` : "—"}
                      </td>
                      <td className="p-3 pr-5 text-right font-mono font-bold text-emerald-600 text-xs">{formatMoneda(n.sueldoNetoPagar)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* EXPEDIENTE CONTABLE LATERAL ACTUALIZADO */}
        <div className={`${cardClasses} p-5 shadow-lg sticky top-5`}>
          {empleadoEnfocado ? (
            <div className="flex flex-col gap-4 text-xs">
              <div className="border-b border-[#E5E7EB] pb-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#EFF6FF] text-blue-600 flex items-center justify-center font-black shadow-inner">
                  {empleadoEnfocado.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-bold text-[#9CA3AF] uppercase block tracking-wider">Volante de Pago Digital</span>
                  <h4 className="font-bold text-[#111827] text-xs truncate uppercase leading-tight">{empleadoEnfocado.nombre}</h4>
                  <p className="text-[10px] text-[#6B7280] font-mono mt-0.5">ID: {empleadoEnfocado.id_reloj} · Farma Tania</p>
                </div>
              </div>

              <div className="p-4 bg-emerald-600 text-white rounded-xl shadow-sm text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-100 tracking-widest block">Neto Depositado en Cuenta</span>
                <span className="text-xl font-black font-mono block mt-1">{formatMoneda(empleadoEnfocado.sueldoNetoPagar)}</span>
              </div>

              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block mb-1">Desglose de la Transacción</span>

              <div className="flex flex-col gap-2.5 bg-[#F9FAFB] p-3.5 rounded-xl border border-[#E5E7EB] font-medium text-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-[#6B7280] flex items-center gap-1"><Coins className="w-3.5 h-3.5" /> (+) Sueldo Quincenal Bruto</span>
                  <span className="font-mono font-bold text-slate-800">{formatMoneda(empleadoEnfocado.sueldoQuincenalBruto)}</span>
                </div>

                {empleadoEnfocado.montoHorasExtras > 0 && (
                  <div className="flex justify-between items-center text-emerald-600">
                    <span className="text-[11px] flex items-center gap-1"><Calculator className="w-3.5 h-3.5" /> (+) Horas Extras Autorizadas</span>
                    <span className="font-mono font-bold">+{formatMoneda(empleadoEnfocado.montoHorasExtras)}</span>
                  </div>
                )}

                {empleadoEnfocado.montoVacacionesQuincena > 0 && (
                  <div className="flex justify-between items-center text-sky-600">
                    <span className="text-[11px] flex items-center gap-1"><Palmtree className="w-3.5 h-3.5" /> (+) Vacaciones Aprobadas</span>
                    <span className="font-mono font-bold">+{formatMoneda(empleadoEnfocado.montoVacacionesQuincena)}</span>
                  </div>
                )}

                {empleadoEnfocado.totalDiasAusenciaCompleta > 0 && (
                  <div className="flex justify-between items-center text-red-600 pl-4 border-l border-red-200">
                    <span className="text-[11px] flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> (-) Ausencias ({empleadoEnfocado.totalDiasAusenciaCompleta} d)</span>
                    <span className="font-mono font-bold">-{formatMoneda(empleadoEnfocado.montoDescuentoAusencias)}</span>
                  </div>
                )}

                {empleadoEnfocado.totalMinutosTardanzaPenalizables > 0 && (
                  <div className="flex justify-between items-center text-amber-600 pl-4 border-l border-amber-200">
                    <span className="text-[11px] flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> (-) Tardanzas ({empleadoEnfocado.totalMinutosTardanzaPenalizables} m)</span>
                    <span className="font-mono font-bold">-{formatMoneda(empleadoEnfocado.montoDescuentoTardanzas)}</span>
                  </div>
                )}

                <div className="border-t border-[#E5E7EB] my-1"></div>

                <div className="flex justify-between items-center text-slate-500">
                  <span className="text-[11px] flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5" /> (-) Seguro Salud (SFS / ARS)</span>
                  <span className="font-mono font-bold">-{formatMoneda(empleadoEnfocado.deduccionSfs)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span className="text-[11px] flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5" /> (-) Fondo Pensiones (AFP)</span>
                  <span className="font-mono font-bold">-{formatMoneda(empleadoEnfocado.deduccionAfp)}</span>
                </div>

                {empleadoEnfocado.montoCxcQuincena > 0 && (
                  <div className="flex justify-between items-center text-indigo-600 border-t pt-1">
                    <span className="text-[11px] flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> (-) Descuento por CxC</span>
                    <span className="font-mono font-bold">-{formatMoneda(empleadoEnfocado.montoCxcQuincena)}</span>
                  </div>
                )}

                {empleadoEnfocado.montoValesQuincena > 0 && (
                  <div className="flex justify-between items-center text-rose-600">
                    <span className="text-[11px] flex items-center gap-1"><Receipt className="w-3.5 h-3.5" /> (-) Vales y Faltantes</span>
                    <span className="font-mono font-bold">-{formatMoneda(empleadoEnfocado.montoValesQuincena)}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <button onClick={() => alert("Abriendo PDF del Volante...")} className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-[#4B5563] font-bold text-center flex items-center justify-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-500" /> Ver Volante
                </button>
                <button onClick={() => alert("Comprobante enviado al correo.")} className="p-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 text-center flex items-center justify-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Timbrar Pago
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center italic text-[#6B7280] py-16 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">Seleccione un colaborador del maestro para auditar su desglose salarial quincenal.</div>
          )}
        </div>
      </div>

    </div>
  );
}