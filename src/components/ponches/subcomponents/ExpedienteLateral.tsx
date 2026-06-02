"use client";
import React from "react";
import { IdCard, CalendarDays, Wallet, Landmark } from "lucide-react";
import { formatMonto, getAlertaEstilo, minutosATexto } from "../hooks/useAsistenciaUtils";
import type { AsistenciaRecord, Empleado } from "../types";

interface Props {
  empleado?: Empleado;
  registros: AsistenciaRecord[];
  totalDescuento: number;
}

function estadoEstilo(estado: string): string {
  if (estado === "Activo") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (estado.toLowerCase().startsWith("licencia")) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-500 border-slate-200"; // Inactivo u otros
}

/** Par etiqueta/valor compacto. */
function Dato({ label, valor, fuerte }: { label: string; valor: React.ReactNode; fuerte?: boolean }) {
  return (
    <div>
      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">{label}</div>
      <div className={fuerte ? "text-xs font-mono font-bold text-slate-800" : "text-xs text-slate-600"}>
        {valor}
      </div>
    </div>
  );
}

function Seccion({ icon, titulo, children }: { icon: React.ReactNode; titulo: string; children: React.ReactNode }) {
  return (
    <div className="p-4 border-b">
      <div className="flex items-center gap-1.5 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        {icon} {titulo}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">{children}</div>
    </div>
  );
}

export default function ExpedienteLateral({ empleado, registros, totalDescuento }: Props) {
  if (!empleado) {
    return (
      <aside className="hidden lg:flex w-[360px] shrink-0 bg-white border rounded-2xl shadow-sm items-center justify-center p-6">
        <div className="text-center text-slate-400">
          <IdCard className="w-8 h-8 mx-auto opacity-20 mb-2" />
          <p className="text-sm font-medium">Selecciona un colaborador para ver su expediente.</p>
        </div>
      </aside>
    );
  }

  const e = empleado;
  const quincenal = e.sueldo_base / 2;
  const cuentaMask = e.cuenta_bancaria ? "•••• " + e.cuenta_bancaria.slice(-4) : "—";
  const jornada =
    e.tipo_jornada === "Parcial" && e.horas_jornada_parcial
      ? `Parcial · ${e.horas_jornada_parcial}h`
      : e.tipo_jornada;

  const totalDesfase = registros.reduce(
    (acc, r) => acc + r.retraso_minutos + r.salida_temprana_minutos,
    0
  );
  const negativo = totalDescuento < 0;
  const positivo = totalDescuento > 0;

  return (
    <aside className="hidden lg:flex w-[360px] shrink-0 flex-col bg-white border rounded-2xl shadow-sm overflow-hidden">
      {/* Encabezado */}
      <div className="p-5 border-b">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-bold uppercase text-slate-800 truncate">{e.nombre}</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              ID {e.id_reloj} • {e.cargo}
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded-lg text-[9px] border font-black uppercase shrink-0 ${estadoEstilo(e.estado)}`}>
            {e.estado}
          </span>
        </div>
        <div className="flex gap-1.5 mt-2 flex-wrap">
          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-600 uppercase">
            {e.sucursal_principal}
            {e.sucursal_secundaria ? ` + ${e.sucursal_secundaria}` : ""}
          </span>
          {e.exento_ponche && (
            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-indigo-50 text-indigo-600 uppercase border border-indigo-100">
              Exento de ponche
            </span>
          )}
        </div>
      </div>

      {/* Scroll con toda la info */}
      <div className="flex-1 overflow-y-auto">
        {/* NÓMINA */}
        <Seccion icon={<Wallet className="w-3 h-3" />} titulo="Nómina">
          <Dato label="Sueldo mensual" valor={formatMonto(e.sueldo_base)} fuerte />
          <Dato label="Quincenal" valor={formatMonto(quincenal)} fuerte />
          <Dato label="Jornada" valor={jornada} />
          <Dato label="Dependientes TSS" valor={e.cantidad_dependientes_tss} />
          <Dato label="Aplica TSS" valor={e.aplicacion_quincena_tss} />
          <Dato
            label="HE fijas"
            valor={e.horas_extras_fijas ? formatMonto(e.cantidad_horas_extras) : "No"}
          />
          <Dato label="Vales CxC" valor={formatMonto(e.monto_vales_cxc)} />
          <Dato
            label="Deudas"
            valor={
              <span className={e.deudas_pendientes > 0 ? "text-rose-600 font-bold" : ""}>
                {formatMonto(e.deudas_pendientes)}
              </span>
            }
          />
        </Seccion>

        {/* DATOS */}
        <Seccion icon={<Landmark className="w-3 h-3" />} titulo="Datos">
          <Dato label="Cédula" valor={e.cedula} fuerte />
          <Dato label="Ingreso" valor={e.fecha_inicio_contrato || "—"} />
          <Dato label="Banco" valor={e.banco} />
          <Dato label="Cuenta" valor={`${cuentaMask} · ${e.tipo_cuenta_bancaria}`} />
        </Seccion>

        {/* RESUMEN DEL PERIODO */}
        <div className="grid grid-cols-3 divide-x border-b text-center">
          <div className="p-3">
            <div className="text-[9px] text-slate-400 font-bold uppercase">Días</div>
            <div className="text-lg font-black text-slate-700">{registros.length}</div>
          </div>
          <div className="p-3">
            <div className="text-[9px] text-slate-400 font-bold uppercase">Desfase</div>
            <div className="text-lg font-black text-amber-600">{minutosATexto(totalDesfase)}</div>
          </div>
          <div className="p-3">
            <div className="text-[9px] text-slate-400 font-bold uppercase">Impacto</div>
            <div
              className={`text-sm font-mono font-black ${
                negativo ? "text-rose-600" : positivo ? "text-emerald-600" : "text-slate-400"
              }`}
            >
              {totalDescuento === 0 ? "RD$ 0" : (positivo ? "+" : "−") + formatMonto(Math.abs(totalDescuento))}
            </div>
          </div>
        </div>

        {/* DETALLE POR DÍA */}
        <div className="divide-y divide-slate-100">
          {registros.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
              <CalendarDays className="w-6 h-6 opacity-20" />
              Sin registros en el periodo filtrado.
            </div>
          ) : (
            registros.map((r) => (
              <div key={`${r.id_reloj}|${r.fecha}`} className="p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-mono text-slate-600">{r.fecha}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {r.entrada ?? "—"} – {r.salida ?? "—"}
                    {r.turno ? ` · ${r.turno}` : ""}
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-lg text-[9px] border font-black uppercase tracking-tighter shrink-0 ${getAlertaEstilo(
                    r.tipo_incidencia
                  )}`}
                >
                  {r.tipo_incidencia}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}