"use client";
import React, { useState, useMemo } from "react";
import { usePay } from "@/context/PayContext";
import { Empleado, SUCURSALES_DISPONIBLES } from "@/data/mockData";
import { 
  Search, 
  MapPin, 
  Download, 
  FileText, 
  Coins, 
  TrendingDown, 
  AlertCircle,
  Clock,
  Calendar
} from "lucide-react";

// --- FUNCIONES AUXILIARES DE FORMATO ---
const formatMoneda = (val: number) => 
  "RD$ " + val.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatNombreTurno(turnoString: string): string {
  if (turnoString) {
    const tClean = turnoString.toLowerCase();
    if (tClean.includes("matutino") || tClean.includes("08:00") || tClean.includes("07:30")) return "Matutino";
    if (tClean.includes("vespertino") || tClean.includes("14:30") || tClean.includes("15:00")) return "Vespertino";
  }
  return "Matutino";
}

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

  // --- MOTOR CONTABLE INTEGRADO Y CORREGIDO ---
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

      registrosEmpleado.forEach((rec: any) => {
        const coincidenciaIncidencia = incidencias.find(inc => inc.id_reloj === rec.id_reloj && rec.fecha === inc.fecha_inicio);
        const tieneLicenciaOVacaciones = coincidenciaIncidencia && ["Vacaciones", "Licencia Médica", "Permiso", "Cobertura"].includes(coincidenciaIncidencia.tipo);
        
        // Exenciones inmediatas aprobadas administrativamente
        if (tieneLicenciaOVacaciones || emp.exento_ponche || rec.error_reloj) {
          return; 
        }

        const entradaEfectiva = rec.entrada || rec.hora_entrada || "—";
        const salidaEfectiva = rec.salida || rec.hora_salida || "—";
        const esFeriado = feriadosRDFechas.includes(rec.fecha);

        const sinPonchesFisicos = (!entradaEfectiva || entradaEfectiva === "—" || entradaEfectiva.trim() === "") && 
                                  (!salidaEfectiva || salidaEfectiva === "—" || salidaEfectiva.trim() === "");

        // 🛡️ SOLUCIÓN AL ERROR DE PERSISTENCIA (BLINDAJE DE DÍAS LIBRES):
        // Si el registro no tiene ponches físicos, evaluamos de forma estricta.
        if (sinPonchesFisicos) {
          // Si el archivo plano lo categoriza como "Normal" o el campo está vacío, es un Descanso/Día Libre. NO penalizar.
          if (rec.tipo_incidencia === "Normal" || !rec.tipo_incidencia) {
            return; 
          }
          
          // ÚNICA CONDICIÓN PARA CONFIGURAR AUSENCIA: Que se marque explícitamente como Falta o Ausencia y no sea feriado
          if ((rec.tipo_incidencia === "Ausencia" || rec.tipo_incidencia === "Sanción") && !esFeriado) {
            totalDiasAusenciaCompleta += 1;
          }
          return;
        }

        // B. CASO TARDANZA SEGURO: Segregación exacta por minutos sobre marcas reales
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

          // Respetar regla quincenal de los 10 minutos de gracia corporativa
          if (tardanzaEntrada > 0 && tardanzaEntrada <= 10) {
            tardanzaEntrada = 0;
          }

          let salidaTemprana = 0;
          if (salidaEfectiva !== "—" && salidaEfectiva.trim() !== "") {
            salidaTemprana = horaTeoricaSalida - salidaMins;
            if (salidaTemprana < 0) salidaTemprana = 0;
          }

          totalMinutosTardanzaPenalizables += (tardanzaEntrada + salidaTemprana);
        }
      });

      // --- ESTRUCTURA DE LIQUIDACIÓN FINANCIERA ---
      const sueldoMensualBase = emp.sueldo_base || 27489.57; 
      const sueldoQuincenalBruto = sueldoMensualBase / 2;
      const valorDiaRegular = sueldoMensualBase / tasas.diaTrabajoFactor;
      
      // Cálculo del costo exacto por minuto basado en la hora configurada (RD$ 144.20 / 60)
      const valorMinutoRegular = tasas.horaBase / 60;

      const montoDescuentoAusencias = totalDiasAusenciaCompleta * valorDiaRegular;
      const montoDescuentoTardanzas = totalMinutosTardanzaPenalizables * valorMinutoRegular;
      const totalRetencionAsistencia = montoDescuentoAusencias + montoDescuentoTardanzas;

      // Base imponible final sujeta a las retenciones del Estado Dominicano
      const sueldoNetoAsistencia = Math.max(0, sueldoQuincenalBruto - totalRetencionAsistencia);

      const deduccionAfp = sueldoNetoAsistencia * tasas.afpPorcentaje;
      const deduccionSfs = sueldoNetoAsistencia * tasas.sfsPorcentaje;
      const totalDeduccionesLey = deduccionAfp + deduccionSfs;
      const sueldoNetoPagar = Math.max(0, sueldoNetoAsistencia - totalDeduccionesLey);

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
    nominaCalculada.forEach(n => {
      bruto += n.sueldoQuincenalBruto;
      retenciones += n.totalRetencionAsistencia;
      ley += n.totalDeduccionesLey;
      neto += n.sueldoNetoPagar;
    });
    return { bruto, retenciones, ley, neto };
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

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6 items-start font-sans text-[#111827]">
      
      {/* CUERPO CENTRAL */}
      <div className="flex flex-col gap-5 min-w-0">
        
        {/* RESUMEN TARJETAS TOP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`${cardClasses} p-4 border-l-4 border-l-slate-900`}>
            <span className="text-[10px] font-bold text-[#6B7280] uppercase block">Masa Salarial Bruta</span>
            <span className="text-lg font-black font-mono text-slate-800 mt-1 block">{formatMoneda(metricasGlobales.bruto)}</span>
          </div>
          <div className={`${cardClasses} p-4 border-l-4 border-l-amber-500`}>
            <span className="text-[10px] font-bold text-[#6B7280] uppercase block">Descuentos por Ponches</span>
            <span className="text-lg font-black font-mono text-amber-600 mt-1 block">-{formatMoneda(metricasGlobales.retenciones)}</span>
          </div>
          <div className={`${cardClasses} p-4 border-l-4 border-l-blue-600`}>
            <span className="text-[10px] font-bold text-[#6B7280] uppercase block">Retenciones TSS (Ley)</span>
            <span className="text-lg font-black font-mono text-blue-600 mt-1 block">-{formatMoneda(metricasGlobales.ley)}</span>
          </div>
          <div className={`${cardClasses} p-4 border-l-4 border-l-emerald-600`}>
            <span className="text-[10px] font-bold text-emerald-700 uppercase block">Total Neto Liquidable</span>
            <span className="text-lg font-black font-mono text-emerald-600 mt-1 block">{formatMoneda(metricasGlobales.neto)}</span>
          </div>
        </div>

        {/* FILTROS */}
        <div className={`${cardClasses} p-4 flex flex-col sm:flex-row gap-3 items-center justify-between`}>
          <div className="relative w-full sm:w-72">
            <span className="absolute left-3 top-2.5 text-[#9CA3AF]"><Search className="w-4 h-4" /></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por colaborador..." className="w-full pl-9 pr-3.5 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-xs outline-none focus:bg-white" />
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <select value={filterSucursal} onChange={e => setFilterSucursal(e.target.value)} className="p-2 border rounded-lg text-xs bg-[#F9FAFB]">
              <option value="Todos">Todas las Sucursales</option>
              {SUCURSALES_DISPONIBLES?.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={() => alert("Exportando data quincenal...")} className="px-3 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg flex items-center gap-1.5"><Download className="w-4 h-4" /> Exportar</button>
          </div>
        </div>

        {/* TABLA DE NÓMINA */}
        <div className={`${cardClasses} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm table-fixed min-w-[1000px]">
              <thead>
                <tr className="bg-[#F9FAFB] text-[10px] font-bold text-[#6B7280] uppercase border-b h-12">
                  <th className="p-3 pl-5 w-72">Colaborador</th>
                  <th className="p-3 w-40">Sucursal Base</th>
                  <th className="p-3 text-right w-36">Bruto Quincenal</th>
                  <th className="p-3 text-center w-40">Descuento Ponche</th>
                  <th className="p-3 text-right w-32">Deducción Ley</th>
                  <th className="p-3 pr-5 text-right w-36">Neto a Pagar</th>
                </tr>
              </thead>
              <tbody className="divide-y text-[#1F2937]">
                {nominaFiltrada.map((n) => (
                  <tr key={n.id_reloj} onClick={() => setSelectedEmpleadoId(n.id_reloj)} className={`h-14 cursor-pointer transition-colors ${selectedIdReloj === n.id_reloj ? "bg-[#EFF6FF]/60 font-medium" : "hover:bg-[#F9FAFB]"}`}>
                    <td className="p-3 pl-5">
                      <div className="font-bold text-xs uppercase">{n.nombre.toUpperCase()}</div>
                      <div className="text-[10px] text-slate-500 font-mono">ID: {n.id_reloj} · {n.cargo}</div>
                    </td>
                    <td className="p-3 uppercase text-xs text-slate-500">{n.sucursal}</td>
                    <td className="p-3 text-right font-mono text-xs">{formatMoneda(n.sueldoQuincenalBruto)}</td>
                    <td className="p-3 text-center">
                      {n.totalRetencionAsistencia > 0 ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="text-red-600 font-bold font-mono text-xs">-{formatMoneda(n.totalRetencionAsistencia)}</span>
                          <span className="text-[9px] text-slate-400 font-medium">
                            {n.totalDiasAusenciaCompleta > 0 ? `${n.totalDiasAusenciaCompleta}f ` : ""}
                            {n.totalMinutosTardanzaPenalizables > 0 ? `${n.totalMinutosTardanzaPenalizables}m` : ""}
                          </span>
                        </div>
                      ) : (
                        <span className="text-emerald-600 text-xs font-bold">Limpio (✔)</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono text-xs text-slate-500">-{formatMoneda(n.totalDeduccionesLey)}</td>
                    <td className="p-3 pr-5 text-right font-mono font-bold text-emerald-600 text-xs">{formatMoneda(n.sueldoNetoPagar)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* EXPEDIENTE CONTABLE LATERAL */}
      <div className={`${cardClasses} p-5 shadow-lg sticky top-5`}>
        {empleadoEnfocado ? (
          <div className="flex flex-col gap-4 text-xs">
            <div className="border-b pb-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#EFF6FF] text-blue-600 flex items-center justify-center font-black">
                {empleadoEnfocado.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-bold text-[#9CA3AF] uppercase block">Volante de Pago Digital</span>
                <h4 className="font-bold text-[#111827] text-xs truncate uppercase">{empleadoEnfocado.nombre}</h4>
                <p className="text-[10px] text-[#6B7280] font-mono mt-0.5">ID: {empleadoEnfocado.id_reloj} · Farma Tania</p>
              </div>
            </div>

            <div className="p-4 bg-emerald-600 text-white rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-100 tracking-widest block">Neto Depositado en Cuenta</span>
              <span className="text-xl font-black font-mono block mt-1">{formatMoneda(empleadoEnfocado.sueldoNetoPagar)}</span>
            </div>

            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block mb-1">Desglose de la Transacción</span>

            <div className="flex flex-col gap-2.5 bg-[#F9FAFB] p-3.5 rounded-xl border font-medium text-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-[#6B7280] flex items-center gap-1"><Coins className="w-3.5 h-3.5" /> (+) Sueldo Quincenal Bruto</span>
                <span className="font-mono font-bold text-slate-800">{formatMoneda(empleadoEnfocado.sueldoQuincenalBruto)}</span>
              </div>

              {empleadoEnfocado.totalDiasAusenciaCompleta > 0 && (
                <div className="flex justify-between items-center text-red-600 pl-4 border-l border-red-200">
                  <span className="text-[11px] flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> (-) Ausencias ({empleadoEnfocado.totalDiasAusenciaCompleta} Día/s)</span>
                  <span className="font-mono font-bold">-{formatMoneda(empleadoEnfocado.montoDescuentoAusencias)}</span>
                </div>
              )}

              {empleadoEnfocado.totalMinutosTardanzaPenalizables > 0 && (
                <div className="flex justify-between items-center text-amber-600 pl-4 border-l border-amber-200">
                  <span className="text-[11px] flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> (-) Tardanzas ({empleadoEnfocado.totalMinutosTardanzaPenalizables} min)</span>
                  <span className="font-mono font-bold">-{formatMoneda(empleadoEnfocado.montoDescuentoTardanzas)}</span>
                </div>
              )}

              <div className="border-t my-1"></div>

              <div className="flex justify-between items-center text-slate-500">
                <span className="text-[11px] flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5" /> (-) Seguro Salud (SFS 3.04%)</span>
                <span className="font-mono font-bold">-{formatMoneda(empleadoEnfocado.deduccionSfs)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-[11px] flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5" /> (-) Fondo Pensiones (AFP 2.87%)</span>
                <span className="font-mono font-bold">-{formatMoneda(empleadoEnfocado.deduccionAfp)}</span>
              </div>
            </div>

            {empleadoEnfocado.totalRetencionAsistencia > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg flex items-start gap-2 text-[11px]">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  Deducciones aplicadas por un total de <strong>{formatMoneda(empleadoEnfocado.totalRetencionAsistencia)}</strong> correspondientes a la quincena auditada.
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center italic text-[#6B7280] py-16 bg-[#F9FAFB] rounded-xl border">Seleccione un colaborador.</div>
        )}
      </div>

    </div>
  );
}