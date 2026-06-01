// ponches/hooks/useAsistenciaUtils.ts
// Helpers PUROS del módulo de ponches. Sin lógica de negocio y sin React.
// La decisión de incidencias y el cálculo de dinero viven en ponches/lib/.

/**
 * "HH:MM" -> minutos desde medianoche.
 * Devuelve null cuando no hay hora válida ("", "—", null, undefined).
 */
export function parseMinutos(hora: string | null | undefined): number | null {
    if (!hora || hora === "—" || hora.trim() === "") return null;
    const [h, m] = hora.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  }
  
  /**
   * minutos -> texto legible: 75 -> "1h 15m", 40 -> "40m", -20 -> "-20m".
   */
  export function minutosATexto(min: number): string {
    if (!min) return "0m";
    const signo = min < 0 ? "-" : "";
    const abs = Math.abs(min);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    return `${signo}${h > 0 ? `${h}h ` : ""}${m}m`.trim();
  }
  
  /**
   * Formato de moneda dominicana: 1153.5 -> "RD$ 1,153.50".
   */
  export function formatMonto(val: number): string {
    return (
      "RD$ " +
      val.toLocaleString("es-DO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }
  
  /**
   * Mapa visual: clases Tailwind por tipo de incidencia.
   * Es solo presentación; no toma ninguna decisión de negocio.
   */
  export function getAlertaEstilo(tipo: string): string {
    const estilos: Record<string, string> = {
      "Correcto": "bg-emerald-50 text-emerald-700 border-emerald-200",
      "Tardanza": "bg-amber-50 text-amber-700 border-amber-200",
      "Salida Temprana": "bg-orange-50 text-orange-700 border-orange-200",
      "Ausencia": "bg-rose-50 text-rose-700 border-rose-200 font-bold",
      "Libre": "bg-slate-50 text-slate-500 border-slate-200",
      "Feriado": "bg-blue-50 text-blue-700 border-blue-200",
      "Horario No Configurado": "bg-slate-100 text-slate-600 border-slate-300",
      "Revisar": "bg-red-50 text-red-600 border-red-200 font-semibold",
    };
    return estilos[tipo] || "bg-slate-50 text-slate-600 border-slate-200";
  }