// data/mockData.ts
// Semilla del sistema. Los tipos viven en ponches/types.ts (no se redefinen aqui).
import type { Empleado, AsistenciaRecord, Tasas } from "@/components/ponches/types";

export const CONFIG_SISTEMA = {
  FECHA_ACTUAL: "2026-05-18",
  QUINCENA_INICIO: "2026-05-16",
  QUINCENA_FIN: "2026-05-31",
};

// Tasas para convertir incidencias en dinero (RD$).
export const TASAS_INICIALES: Tasas = {
  diaTrabajo: 1153.57,
  hora: 144.2,
  feriado: 1153.57,
};

/* ========================================================================== */
/* ============================ EMPLEADOS =================================== */
/* ========================================================================== */

export const EMPLEADOS_INICIALES: Empleado[] = [
  // ───── SUCURSAL T1 — Administrativo / Oficina (exentos de ponche) ─────
  {
    id_reloj: "T1001", nombre: "INGINIO CRISÓSTOMO", cargo: "Gerente Operativo",
    sucursal_principal: "T1", sucursal_secundaria: "", sueldo_base: 45000.0,
    exento_ponche: true, horas_extras_fijas: false, cantidad_horas_extras: 0, monto_vales_cxc: 500.0,
    fecha_nacimiento: "1985-03-15", fecha_inicio_contrato: "2020-01-15", fecha_fin_contrato: "",
    cedula: "001-1234567-8", banco: "Banreservas", cuenta_bancaria: "12345678901234567890",
    tipo_cuenta_bancaria: "Corriente", tipo_jornada: "Completa", horas_jornada_parcial: undefined,
    cantidad_dependientes_tss: 2, aplicacion_quincena_tss: "Segunda", estado: "Activo", deudas_pendientes: 0,
  },
  {
    id_reloj: "T1002", nombre: "RUTH E. GÓMEZ JIMÉNEZ", cargo: "Encargada de Farmacia",
    sucursal_principal: "T1", sucursal_secundaria: "", sueldo_base: 38000.0,
    exento_ponche: true, horas_extras_fijas: false, cantidad_horas_extras: 0, monto_vales_cxc: 500.0,
    fecha_nacimiento: "1988-07-22", fecha_inicio_contrato: "2020-03-10", fecha_fin_contrato: "",
    cedula: "001-2345678-9", banco: "Banco Popular", cuenta_bancaria: "98765432109876543210",
    tipo_cuenta_bancaria: "Ahorros", tipo_jornada: "Completa", horas_jornada_parcial: undefined,
    cantidad_dependientes_tss: 1, aplicacion_quincena_tss: "Primera", estado: "Activo", deudas_pendientes: 0,
  },
  {
    id_reloj: "T1003", nombre: "DULCE MA. JIMÉNEZ", cargo: "Administradora",
    sucursal_principal: "T1", sucursal_secundaria: "", sueldo_base: 42000.0,
    exento_ponche: true, horas_extras_fijas: false, cantidad_horas_extras: 0, monto_vales_cxc: 500.0,
    fecha_nacimiento: "1986-11-10", fecha_inicio_contrato: "2020-01-15", fecha_fin_contrato: "",
    cedula: "001-3456789-0", banco: "Banreservas", cuenta_bancaria: "11223344556677889900",
    tipo_cuenta_bancaria: "Corriente", tipo_jornada: "Completa", horas_jornada_parcial: undefined,
    cantidad_dependientes_tss: 0, aplicacion_quincena_tss: "Segunda", estado: "Activo", deudas_pendientes: 1500.0,
  },
  {
    id_reloj: "T1004", nombre: "CAROLINA CRISÓSTOMO", cargo: "Supervisora de Cajas",
    sucursal_principal: "T1", sucursal_secundaria: "", sueldo_base: 35000.0,
    exento_ponche: true, horas_extras_fijas: false, cantidad_horas_extras: 0, monto_vales_cxc: 500.0,
    fecha_nacimiento: "1990-05-18", fecha_inicio_contrato: "2020-02-20", fecha_fin_contrato: "",
    cedula: "001-4567890-1", banco: "Banco BHD", cuenta_bancaria: "55667788990011223344",
    tipo_cuenta_bancaria: "Ahorros", tipo_jornada: "Completa", horas_jornada_parcial: undefined,
    cantidad_dependientes_tss: 2, aplicacion_quincena_tss: "Ambas", estado: "Activo", deudas_pendientes: 0,
  },
  {
    id_reloj: "T1005", nombre: "LUIS HERNÁNDEZ", cargo: "Encargado de Inventario",
    sucursal_principal: "T1", sucursal_secundaria: "", sueldo_base: 32000.0,
    exento_ponche: true, horas_extras_fijas: false, cantidad_horas_extras: 0, monto_vales_cxc: 400.0,
    fecha_nacimiento: "1992-08-25", fecha_inicio_contrato: "2021-01-10", fecha_fin_contrato: "",
    cedula: "001-5678901-2", banco: "Scotiabank", cuenta_bancaria: "99887766554433221100",
    tipo_cuenta_bancaria: "Corriente", tipo_jornada: "Completa", horas_jornada_parcial: undefined,
    cantidad_dependientes_tss: 1, aplicacion_quincena_tss: "Primera", estado: "Activo", deudas_pendientes: 0,
  },
  {
    id_reloj: "T1006", nombre: "JUAN CARLOS GUZMÁN ROJAS", cargo: "Soporte de Sistemas",
    sucursal_principal: "T1", sucursal_secundaria: "T2", sueldo_base: 38000.0,
    exento_ponche: true, horas_extras_fijas: true, cantidad_horas_extras: 3500.0, monto_vales_cxc: 400.0,
    fecha_nacimiento: "1995-02-14", fecha_inicio_contrato: "2021-03-01", fecha_fin_contrato: "",
    cedula: "001-6789012-3", banco: "Banreservas", cuenta_bancaria: "44332211009988776655",
    tipo_cuenta_bancaria: "Ahorros", tipo_jornada: "Completa", horas_jornada_parcial: undefined,
    cantidad_dependientes_tss: 0, aplicacion_quincena_tss: "Segunda", estado: "Activo", deudas_pendientes: 0,
  },
  {
    id_reloj: "T1007", nombre: "CAMILA CRISÓSTOMO", cargo: "Coordinadora de Ventas",
    sucursal_principal: "T1", sucursal_secundaria: "", sueldo_base: 36000.0,
    exento_ponche: true, horas_extras_fijas: true, cantidad_horas_extras: 2500.0, monto_vales_cxc: 500.0,
    fecha_nacimiento: "1989-09-30", fecha_inicio_contrato: "2020-06-15", fecha_fin_contrato: "",
    cedula: "001-7890123-4", banco: "Banco Popular", cuenta_bancaria: "77665544332211009988",
    tipo_cuenta_bancaria: "Corriente", tipo_jornada: "Completa", horas_jornada_parcial: undefined,
    cantidad_dependientes_tss: 1, aplicacion_quincena_tss: "Primera", estado: "Activo", deudas_pendientes: 500.0,
  },
  {
    id_reloj: "T1008", nombre: "JUAN SANTIAGO ALBERTO", cargo: "Asesor Farmacéutico",
    sucursal_principal: "T1", sucursal_secundaria: "", sueldo_base: 41000.0,
    exento_ponche: true, horas_extras_fijas: false, cantidad_horas_extras: 0, monto_vales_cxc: 400.0,
    fecha_nacimiento: "1993-12-05", fecha_inicio_contrato: "2021-08-20", fecha_fin_contrato: "",
    cedula: "001-8901234-5", banco: "Banco BHD", cuenta_bancaria: "66554433221100998877",
    tipo_cuenta_bancaria: "Ahorros", tipo_jornada: "Completa", horas_jornada_parcial: undefined,
    cantidad_dependientes_tss: 0, aplicacion_quincena_tss: "Segunda", estado: "Activo", deudas_pendientes: 0,
  },
  {
    id_reloj: "T1009", nombre: "ELSA ESMERALDA HDEZ", cargo: "Regente Farmacéutica",
    sucursal_principal: "T1", sucursal_secundaria: "", sueldo_base: 55000.0,
    exento_ponche: true, horas_extras_fijas: false, cantidad_horas_extras: 0, monto_vales_cxc: 500.0,
    fecha_nacimiento: "1982-03-20", fecha_inicio_contrato: "2019-11-01", fecha_fin_contrato: "",
    cedula: "001-9012345-6", banco: "Banreservas", cuenta_bancaria: "55443322110099887766",
    tipo_cuenta_bancaria: "Corriente", tipo_jornada: "Completa", horas_jornada_parcial: undefined,
    cantidad_dependientes_tss: 3, aplicacion_quincena_tss: "Ambas", estado: "Activo", deudas_pendientes: 0,
  },

  // ───── SUCURSAL T2 — Ventas / Atención ─────
  {
    id_reloj: "8", nombre: "YOLANDA BAUTISTA", cargo: "Encargada Tania II",
    sucursal_principal: "T2", sucursal_secundaria: "", sueldo_base: 32000.0,
    exento_ponche: false, horas_extras_fijas: true, cantidad_horas_extras: 2704.98, monto_vales_cxc: 300.0,
    fecha_nacimiento: "1987-06-12", fecha_inicio_contrato: "2020-02-01", fecha_fin_contrato: "",
    cedula: "002-1234567-8", banco: "Banco Popular", cuenta_bancaria: "12348765432109876543",
    tipo_cuenta_bancaria: "Ahorros", tipo_jornada: "Completa", horas_jornada_parcial: undefined,
    cantidad_dependientes_tss: 2, aplicacion_quincena_tss: "Primera", estado: "Activo", deudas_pendientes: 0,
  },
  {
    id_reloj: "T1026", nombre: "FÉLIX MONTAÑO GALVÁN", cargo: "Supervisor Operativo",
    sucursal_principal: "T2", sucursal_secundaria: "", sueldo_base: 35000.0,
    exento_ponche: true, horas_extras_fijas: true, cantidad_horas_extras: 5571.0, monto_vales_cxc: 400.0,
    fecha_nacimiento: "1991-09-08", fecha_inicio_contrato: "2021-01-15", fecha_fin_contrato: "",
    cedula: "002-2345678-9", banco: "Banreservas", cuenta_bancaria: "23459876543210987654",
    tipo_cuenta_bancaria: "Corriente", tipo_jornada: "Completa", horas_jornada_parcial: undefined,
    cantidad_dependientes_tss: 1, aplicacion_quincena_tss: "Segunda", estado: "Activo", deudas_pendientes: 2000.0,
  },
  {
    id_reloj: "12", nombre: "DENNY REYES OLIVARES", cargo: "Dependiente",
    sucursal_principal: "T2", sucursal_secundaria: "", sueldo_base: 28900.0,
    exento_ponche: false, horas_extras_fijas: false, cantidad_horas_extras: 0, monto_vales_cxc: 200.0,
    fecha_nacimiento: "1994-11-25", fecha_inicio_contrato: "2021-06-10", fecha_fin_contrato: "",
    cedula: "002-3456789-0", banco: "Banco BHD", cuenta_bancaria: "34560987654321098765",
    tipo_cuenta_bancaria: "Ahorros", tipo_jornada: "Completa", horas_jornada_parcial: undefined,
    cantidad_dependientes_tss: 0, aplicacion_quincena_tss: "Primera", estado: "Activo", deudas_pendientes: 0,
  },

  // ───── SUCURSAL T4 — Soporte ─────
  {
    id_reloj: "1", nombre: "HILARIA ALT. RAMIREZ", cargo: "Encargada Tania IV",
    sucursal_principal: "T4", sucursal_secundaria: "", sueldo_base: 30000.0,
    exento_ponche: false, horas_extras_fijas: true, cantidad_horas_extras: 500.0, monto_vales_cxc: 300.0,
    fecha_nacimiento: "1985-12-01", fecha_inicio_contrato: "2020-08-15", fecha_fin_contrato: "",
    cedula: "004-1234567-8", banco: "Banreservas", cuenta_bancaria: "12345098765432109876",
    tipo_cuenta_bancaria: "Ahorros", tipo_jornada: "Completa", horas_jornada_parcial: undefined,
    cantidad_dependientes_tss: 0, aplicacion_quincena_tss: "Segunda", estado: "Activo", deudas_pendientes: 750.0,
  },
  {
    id_reloj: "13", nombre: "LIDIA FERRERA", cargo: "Servicios Generales",
    sucursal_principal: "T4", sucursal_secundaria: "", sueldo_base: 25000.0,
    exento_ponche: false, horas_extras_fijas: false, cantidad_horas_extras: 0, monto_vales_cxc: 200.0,
    fecha_nacimiento: "1990-04-18", fecha_inicio_contrato: "2021-02-20", fecha_fin_contrato: "",
    cedula: "004-2345678-9", banco: "Banco Popular", cuenta_bancaria: "23456109876543210987",
    tipo_cuenta_bancaria: "Corriente", tipo_jornada: "Completa", horas_jornada_parcial: undefined,
    cantidad_dependientes_tss: 2, aplicacion_quincena_tss: "Primera", estado: "Activo", deudas_pendientes: 0,
  },

  // ───── SUCURSAL T6 ─────
  {
    // id corregido: chocaba con YOLANDA BAUTISTA (ambos tenian id_reloj "8")
    id_reloj: "65", nombre: "SANTOS C LARA TEJEDA", cargo: "Encargado Tania VI",
    sucursal_principal: "T6", sucursal_secundaria: "", sueldo_base: 31000.0,
    exento_ponche: false, horas_extras_fijas: true, cantidad_horas_extras: 1557.36, monto_vales_cxc: 300.0,
    fecha_nacimiento: "1988-07-14", fecha_inicio_contrato: "2020-05-10", fecha_fin_contrato: "",
    cedula: "006-1234567-8", banco: "Scotiabank", cuenta_bancaria: "12345210987654321098",
    tipo_cuenta_bancaria: "Ahorros", tipo_jornada: "Completa", horas_jornada_parcial: undefined,
    cantidad_dependientes_tss: 1, aplicacion_quincena_tss: "Ambas", estado: "Activo", deudas_pendientes: 0,
  },
  {
    id_reloj: "10", nombre: "LUIS CORDERO", cargo: "Dependiente",
    sucursal_principal: "T6", sucursal_secundaria: "", sueldo_base: 29000.0,
    exento_ponche: false, horas_extras_fijas: true, cantidad_horas_extras: 5485.63, monto_vales_cxc: 200.0,
    fecha_nacimiento: "1992-10-22", fecha_inicio_contrato: "2021-03-15", fecha_fin_contrato: "",
    cedula: "006-2345678-9", banco: "Banreservas", cuenta_bancaria: "23456321098765432109",
    tipo_cuenta_bancaria: "Corriente", tipo_jornada: "Completa", horas_jornada_parcial: undefined,
    cantidad_dependientes_tss: 0, aplicacion_quincena_tss: "Segunda", estado: "Activo", deudas_pendientes: 1200.0,
  },

  // ───── Jornada Parcial ─────
  {
    id_reloj: "36", nombre: "ENYELI FRANCHESCA GUERRERO", cargo: "Cajera",
    sucursal_principal: "T1", sucursal_secundaria: "", sueldo_base: 18900.0,
    exento_ponche: false, horas_extras_fijas: false, cantidad_horas_extras: 0, monto_vales_cxc: 150.0,
    fecha_nacimiento: "1995-08-30", fecha_inicio_contrato: "2022-01-10", fecha_fin_contrato: "",
    cedula: "001-0123456-7", banco: "Banco Popular", cuenta_bancaria: "99887766554433221101",
    tipo_cuenta_bancaria: "Ahorros", tipo_jornada: "Parcial", horas_jornada_parcial: 4,
    cantidad_dependientes_tss: 0, aplicacion_quincena_tss: "Primera", estado: "Activo", deudas_pendientes: 0,
  },
  {
    id_reloj: "49", nombre: "ROSA M MORAN", cargo: "Cajera Fin de Semana",
    sucursal_principal: "T2", sucursal_secundaria: "", sueldo_base: 15000.0,
    exento_ponche: false, horas_extras_fijas: false, cantidad_horas_extras: 0, monto_vales_cxc: 100.0,
    fecha_nacimiento: "1993-11-15", fecha_inicio_contrato: "2022-02-01", fecha_fin_contrato: "",
    cedula: "002-0123456-7", banco: "Banco BHD", cuenta_bancaria: "88776655443322110012",
    tipo_cuenta_bancaria: "Ahorros", tipo_jornada: "Parcial", horas_jornada_parcial: 6,
    cantidad_dependientes_tss: 1, aplicacion_quincena_tss: "Segunda", estado: "Activo", deudas_pendientes: 0,
  },
  {
    id_reloj: "33", nombre: "JUANA PÉREZ", cargo: "Auxiliar Operativa",
    sucursal_principal: "T4", sucursal_secundaria: "", sueldo_base: 17000.0,
    exento_ponche: false, horas_extras_fijas: false, cantidad_horas_extras: 0, monto_vales_cxc: 150.0,
    fecha_nacimiento: "1996-03-20", fecha_inicio_contrato: "2022-03-15", fecha_fin_contrato: "",
    cedula: "004-0123456-7", banco: "Banreservas", cuenta_bancaria: "77665544332211009913",
    tipo_cuenta_bancaria: "Ahorros", tipo_jornada: "Parcial", horas_jornada_parcial: 5,
    cantidad_dependientes_tss: 0, aplicacion_quincena_tss: "Primera", estado: "Activo", deudas_pendientes: 300.0,
  },
  {
    id_reloj: "T1021", nombre: "MARYELIS ALFONSO", cargo: "Pasante Operativa",
    sucursal_principal: "T1", sucursal_secundaria: "", sueldo_base: 12000.0,
    exento_ponche: true, horas_extras_fijas: false, cantidad_horas_extras: 0, monto_vales_cxc: 100.0,
    fecha_nacimiento: "1998-01-10", fecha_inicio_contrato: "2024-01-15", fecha_fin_contrato: "2024-07-15",
    cedula: "001-1234567-9", banco: "Banco Popular", cuenta_bancaria: "66554433221100998814",
    tipo_cuenta_bancaria: "Ahorros", tipo_jornada: "Parcial", horas_jornada_parcial: 4,
    cantidad_dependientes_tss: 0, aplicacion_quincena_tss: "Segunda", estado: "Activo", deudas_pendientes: 0,
  },

  // ───── En licencia ─────
  {
    id_reloj: "T1016", nombre: "YOHANNA NÚÑEZ", cargo: "No especificado",
    sucursal_principal: "T1", sucursal_secundaria: "", sueldo_base: 27489.6,
    exento_ponche: false, horas_extras_fijas: false, cantidad_horas_extras: 0, monto_vales_cxc: 200.0,
    fecha_nacimiento: "1990-05-15", fecha_inicio_contrato: "2021-01-10", fecha_fin_contrato: "",
    cedula: "001-2345678-0", banco: "Banco BHD", cuenta_bancaria: "55443322110099887715",
    tipo_cuenta_bancaria: "Corriente", tipo_jornada: "Completa", horas_jornada_parcial: undefined,
    cantidad_dependientes_tss: 2, aplicacion_quincena_tss: "Ambas", estado: "Licencia Maternidad", deudas_pendientes: 0,
  },
  {
    id_reloj: "T1064", nombre: "ALEJANDRA BAUTISTA", cargo: "No especificado",
    sucursal_principal: "T6", sucursal_secundaria: "", sueldo_base: 27489.6,
    exento_ponche: false, horas_extras_fijas: false, cantidad_horas_extras: 0, monto_vales_cxc: 200.0,
    fecha_nacimiento: "1992-08-20", fecha_inicio_contrato: "2021-03-15", fecha_fin_contrato: "",
    cedula: "006-2345678-0", banco: "Banreservas", cuenta_bancaria: "44332211009988776616",
    tipo_cuenta_bancaria: "Ahorros", tipo_jornada: "Completa", horas_jornada_parcial: undefined,
    cantidad_dependientes_tss: 1, aplicacion_quincena_tss: "Primera", estado: "Licencia Médica", deudas_pendientes: 500.0,
  },

  // ───── Casos especiales ─────
  {
    id_reloj: "31", nombre: "MARÍA SOL AQUINO", cargo: "Cajera Comercial",
    sucursal_principal: "T1", sucursal_secundaria: "", sueldo_base: 29000.0,
    exento_ponche: false, horas_extras_fijas: true, cantidad_horas_extras: 615.0, monto_vales_cxc: 300.0,
    fecha_nacimiento: "1994-02-28", fecha_inicio_contrato: "2022-06-01", fecha_fin_contrato: "",
    cedula: "001-3456789-1", banco: "Scotiabank", cuenta_bancaria: "33221100998877665517",
    tipo_cuenta_bancaria: "Corriente", tipo_jornada: "Completa", horas_jornada_parcial: undefined,
    cantidad_dependientes_tss: 0, aplicacion_quincena_tss: "Segunda", estado: "Activo", deudas_pendientes: 2500.0,
  },
  {
    id_reloj: "21", nombre: "RAMÓN TURBI", cargo: "Dependiente de Farmacia",
    sucursal_principal: "T1", sucursal_secundaria: "", sueldo_base: 28900.0,
    exento_ponche: false, horas_extras_fijas: false, cantidad_horas_extras: 0, monto_vales_cxc: 200.0,
    fecha_nacimiento: "1991-12-10", fecha_inicio_contrato: "2022-01-20", fecha_fin_contrato: "",
    cedula: "001-4567890-2", banco: "Banco Popular", cuenta_bancaria: "22110099887766554418",
    tipo_cuenta_bancaria: "Ahorros", tipo_jornada: "Completa", horas_jornada_parcial: undefined,
    cantidad_dependientes_tss: 3, aplicacion_quincena_tss: "Primera", estado: "Inactivo", deudas_pendientes: 0,
  },
  {
    id_reloj: "64", nombre: "PAMELA CASTILLO", cargo: "Auxiliar Flotante",
    sucursal_principal: "T7", sucursal_secundaria: "T9", sueldo_base: 28000.0,
    exento_ponche: false, horas_extras_fijas: false, cantidad_horas_extras: 0, monto_vales_cxc: 250.0,
    fecha_nacimiento: "1995-07-05", fecha_inicio_contrato: "2022-08-01", fecha_fin_contrato: "",
    cedula: "007-1234567-8", banco: "Banco BHD", cuenta_bancaria: "11009988776655443319",
    tipo_cuenta_bancaria: "Ahorros", tipo_jornada: "Completa", horas_jornada_parcial: undefined,
    cantidad_dependientes_tss: 2, aplicacion_quincena_tss: "Ambas", estado: "Activo", deudas_pendientes: 800.0,
  },
];

/* ========================================================================== */
/* ============================ ASISTENCIA ================================= */
/* ========================================================================== */
// Sembrada con IDs que SI existen en el roster de arriba (uno por tipo).
// La sucursal del registro = sucursal_principal del empleado.
// Coherente con feriados.ts: 2026-05-04 es Dia del Trabajo (Feriado).

export const ASISTENCIA_INICIAL: AsistenciaRecord[] = [
  // Correcto: 1 min tarde, dentro de la gracia
  { id_reloj: "36", fecha: "2026-04-30", sucursal: "T1", turno: "08:00-16:00", entrada: "08:01", salida: "16:00", tipo_incidencia: "Correcto", retraso_minutos: 1, salida_temprana_minutos: 0, error_reloj: false },
  // Tardanza: entro 1h04 tarde
  { id_reloj: "12", fecha: "2026-04-30", sucursal: "T2", turno: "07:30-15:30", entrada: "08:34", salida: "15:48", tipo_incidencia: "Tardanza", retraso_minutos: 64, salida_temprana_minutos: 0, error_reloj: false },
  // Tarde Y salio temprano (se llenan los dos campos)
  { id_reloj: "31", fecha: "2026-04-30", sucursal: "T1", turno: "08:00-17:00", entrada: "08:30", salida: "16:49", tipo_incidencia: "Tardanza", retraso_minutos: 30, salida_temprana_minutos: 11, error_reloj: false },
  // Salida temprana: se fue 2h54 antes
  { id_reloj: "33", fecha: "2026-05-02", sucursal: "T4", turno: "09:00-17:00", entrada: "07:53", salida: "14:06", tipo_incidencia: "Salida Temprana", retraso_minutos: 0, salida_temprana_minutos: 174, error_reloj: false },
  // Ausencia: tenia turno, no poncho (20/05 no es feriado)
  { id_reloj: "1", fecha: "2026-05-20", sucursal: "T4", turno: "07:30-15:30", entrada: null, salida: null, tipo_incidencia: "Ausencia", retraso_minutos: 0, salida_temprana_minutos: 0, error_reloj: false },
  // Libre: sin turno y sin ponche (dia de descanso)
  { id_reloj: "10", fecha: "2026-05-02", sucursal: "T6", turno: null, entrada: null, salida: null, tipo_incidencia: "Libre", retraso_minutos: 0, salida_temprana_minutos: 0, error_reloj: false },
  // Feriado: el 04/05 esta en la lista; trabajo -> recargo, sin penalizar
  { id_reloj: "49", fecha: "2026-05-04", sucursal: "T2", turno: "07:30-15:30", entrada: "08:55", salida: "22:32", tipo_incidencia: "Feriado", retraso_minutos: 0, salida_temprana_minutos: 0, error_reloj: false },
  // Revisar: entrada sin salida (ponche incompleto)
  { id_reloj: "13", fecha: "2026-04-30", sucursal: "T4", turno: "08:00-16:00", entrada: "08:37", salida: null, tipo_incidencia: "Revisar", retraso_minutos: 0, salida_temprana_minutos: 0, error_reloj: true },
  // Revisar: turno cruzado (vespertino pero poncho de manana)
  { id_reloj: "21", fecha: "2026-05-13", sucursal: "T1", turno: "15:00-23:00", entrada: "07:28", salida: "15:36", tipo_incidencia: "Revisar", retraso_minutos: 0, salida_temprana_minutos: 0, error_reloj: true },
  // Horario No Configurado: turno Default -> turno null, no se penaliza
  { id_reloj: "64", fecha: "2026-05-25", sucursal: "T7", turno: null, entrada: "16:47", salida: "23:24", tipo_incidencia: "Horario No Configurado", retraso_minutos: 0, salida_temprana_minutos: 0, error_reloj: false },
];

/* ========================================================================== */
/* ============================ CATALOGOS ================================== */
/* ========================================================================== */
// Alineado a los codigos reales del roster (sucursal_principal).
export const SUCURSALES_DISPONIBLES = ["T1", "T2", "T4", "T6", "T7"];
export const BANCOS_RD = ["Banreservas", "Banco Popular", "Banco BHD", "Scotiabank"];