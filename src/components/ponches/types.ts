// ponches/types.ts
// Contratos centrales del modulo. Una sola fuente para los tipos.

// ───────────────────────── Dominio ─────────────────────────

export interface Empleado {
    id_reloj: string;
    nombre: string;
    cargo: string;
    sucursal_principal: string;
    sucursal_secundaria: string;
    sueldo_base: number;
    exento_ponche: boolean;
    horas_extras_fijas: boolean;
    cantidad_horas_extras: number;
    monto_vales_cxc: number;
    fecha_nacimiento: string;
    fecha_inicio_contrato: string;
    fecha_fin_contrato: string;
    cedula: string;
    banco: string;
    cuenta_bancaria: string;
    tipo_cuenta_bancaria: "Corriente" | "Ahorros";
    tipo_jornada: "Completa" | "Parcial";
    horas_jornada_parcial?: number;
    cantidad_dependientes_tss: number;
    aplicacion_quincena_tss: "Primera" | "Segunda" | "Ambas";
    estado: string; // "Activo" | "Inactivo" | "Licencia Maternidad" | ...
    deudas_pendientes: number;
    /** Turno por defecto "08:00-16:00" — respaldo cuando el dia viene sin turno. */
    turno_default?: string;
  }
  
  /** Incidencias de RRHH (vacaciones, licencia, permiso). NO son del ponche. */
  export interface Incidencia {
    id_incidencia: string;
    id_reloj: string;
    tipo: string;
    fecha_inicio: string; // ISO
    fecha_fin: string; // ISO
    observaciones?: string;
  }
  
  /** Tasas para convertir incidencias en dinero. */
  export interface Tasas {
    diaTrabajo: number;
    hora: number;
    feriado: number;
  }
  
  // ───────────────────────── Ponches ─────────────────────────
  
  export type TipoIncidencia =
    | "Correcto"
    | "Tardanza"
    | "Salida Temprana"
    | "Ausencia"
    | "Libre"
    | "Feriado"
    | "Horario No Configurado"
    | "Revisar";
  
  export interface AsistenciaRecord {
    id_reloj: string;
    fecha: string; // ISO "2026-04-30"
    sucursal: string;
    turno: string | null; // "08:00-16:00" | null
    entrada: string | null;
    salida: string | null;
    tipo_incidencia: TipoIncidencia;
    retraso_minutos: number;
    salida_temprana_minutos: number;
    error_reloj: boolean;
    /** Horas extras APROBADAS de ese día, en minutos. Solo suma si alguien la aprobó. */
    horas_extras_aprobadas_min?: number;
  }
  
  // ───────────────────────── Vista ─────────────────────────
  
  export interface FiltrosPonches {
    search: string;
    sucursal: string;
    fecha: string;
    soloErrores: boolean;
  }
  
  export type AgruparPor = "ninguno" | "sucursal" | "empleado" | "incidencia" | "turno";
  
  export interface GrupoEmpleado {
    id_reloj: string;
    nombre: string;
    cargo: string;
    sucursal: string;
    totalDescuento: number;
    totalRetrasoMin: number;
    alertas: Set<string>;
    registros: AsistenciaRecord[];
  }
  
  export interface MetricasPonches {
    errores: number;
    descuentos: number; // total negativo (retenciones)
    sumas: number; // total positivo (feriados trabajados + HE aprobadas)
  }