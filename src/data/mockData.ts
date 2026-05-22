export interface Empleado {
    id_reloj: string;
    nombre: string;
    cedula: string;
    banco: string;
    cuenta: string;
    sucursal_principal: string;
    sucursal_secundaria: string;
    cargo: string;
    sueldo: number;
    horas_extras_fijas: number;
    fecha_ingreso: string;
    fecha_termino: string;
    sexo?: string;
    fecha_nacimiento?: string;
    exento_ponche: boolean;
    vacaciones_disponibles: number; // <-- NUEVO: Control de días acumulados por ley
  }
  
  export interface AsistenciaRecord {
    id_registro: string;
    id_reloj: string;
    fecha: string;
    hora_entrada: string;
    hora_salida: string;
    retraso_minutos: number;
    error_reloj: boolean;
    tipo_incidencia: "Normal" | "Tardanza" | "Ausencia" | "Error";
  }
  
  export const CONFIG_SISTEMA = {
    FECHA_ACTUAL: "2026-05-18",
    QUINCENA_INICIO: "2026-05-16",
    QUINCENA_FIN: "2026-05-31"
  };
  
  export const EMPLEADOS_INICIALES: Empleado[] = [
    /* ================= TANIA 1 ================= */
    
    { id_reloj:"T1001", nombre:"INGINIO CRISOSTOMO", sucursal_principal:"Tania 1", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"T1002", nombre:"RUTH E. GOMEZ JIMENEZ", sucursal_principal:"Tania 1", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"T1003", nombre:"DULCE MA. JIMENEZ", sucursal_principal:"Tania 1", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"T1004", nombre:"CAROLINA CRISOSTOMO", sucursal_principal:"Tania 1", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"T1005", nombre:"LUIS HERNANDEZ", sucursal_principal:"Tania 1", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"T1006", nombre:"JUAN CARLOS GUZMAN ROJAS", sucursal_principal:"Tania 1", sucursal_secundaria:"Tania 2", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"T1007", nombre:"CAMILA CRISOSTOMO", sucursal_principal:"Tania 1", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"T1008", nombre:"JUAN SANTIAGO ALBERTO", sucursal_principal:"Tania 1", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"T1009", nombre:"ELSA ESMERALDA HDEZ", sucursal_principal:"Tania 1", sucursal_secundaria:"Ninguna", sueldo:30000.00, exento_ponche:true },
    { id_reloj:"T1010", nombre:"MIGUEL A. AMANCIO CONSE", sucursal_principal:"Tania 1", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"T1011", nombre:"MILEDYS CABRERA", sucursal_principal:"Tania 1", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"21", nombre:"RAMON TURBI", sucursal_principal:"Tania 1", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"31", nombre:"MARIA SOL AQUINO", sucursal_principal:"Tania 1", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"T1012", nombre:"JAIRON TORRES CASTRO", sucursal_principal:"Tania 1", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"36", nombre:"ENYELI FRANCHESCA GUERRERO", sucursal_principal:"Tania 1", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"T1013", nombre:"YOHANNA NUÑEZ LIC PARTO", sucursal_principal:"Tania 1", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"T1014", nombre:"RUTH GIRON", sucursal_principal:"Tania 1", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"T1015", nombre:"MARTIRES ENCARNACION", sucursal_principal:"Tania 1", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"T1016", nombre:"CRISTEYBI PEREZ", sucursal_principal:"Tania 1", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"T1017", nombre:"ELISAZABETH MARIA MATOS", sucursal_principal:"Tania 1", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"32", nombre:"FLOR INDHIRA SOTO JAVIER", sucursal_principal:"Tania 1", sucursal_secundaria:"Tania 5", sueldo:30597.83, exento_ponche:false },
    { id_reloj:"T1018", nombre:"JEAN DIEGO CAMACHO", sucursal_principal:"Tania 1", sucursal_secundaria:"Tania 7", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"T1019", nombre:"ALAN DALMAU DISLA", sucursal_principal:"Tania 1", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"T1020", nombre:"JAIBEL BONILLA", sucursal_principal:"Tania 1", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"T1021", nombre:"MARYELIS ALFONSO", sucursal_principal:"Sin sucursal", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"T1022", nombre:"ANYELINA M GERMAN", sucursal_principal:"Tania 1", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"T1023", nombre:"ROBERTO A. PERALTA A.", sucursal_principal:"Tania 1", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"T1024", nombre:"ROSANNY ESTHER AQUINO", sucursal_principal:"Tania 1", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"T1025", nombre:"YARITZA C SILFA COSS", sucursal_principal:"Tania 1", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true },
    
    /* ================= TANIA 2 ================= */
    
    { id_reloj:"8", nombre:"YOLANDA BAUTISTA", sucursal_principal:"Tania 2", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"T1026", nombre:"FELIX MONTAÑO GALVAN", sucursal_principal:"Tania 2", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"12", nombre:"DENNY REYES OLIVARES", sucursal_principal:"Tania 2", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"13", nombre:"DOMINGO RODRIGUEZ", sucursal_principal:"Tania 2", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"19", nombre:"YAMILEISI FIGUEROA BRAND", sucursal_principal:"Tania 2", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"17", nombre:"EDISON PEGUERO", sucursal_principal:"Tania 2", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"41", nombre:"RISMEIRI ANABEL MORA", sucursal_principal:"Tania 2", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"48", nombre:"EMELSSON N BAUTISTA OGANDO", sucursal_principal:"Tania 2", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"49", nombre:"ROSA M MORAN", sucursal_principal:"Tania 2", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"54", nombre:"ADRIAN SOSA", sucursal_principal:"Tania 2", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"60", nombre:"KARLENYS SOLANO", sucursal_principal:"Tania 2", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"64", nombre:"PAMELA CASTILLO", sucursal_principal:"Tania 7", sucursal_secundaria:"Tania 9", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"2", nombre:"CAROLYN RACHEL ROSARIO", sucursal_principal:"Tania 2", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"6", nombre:"DIANA CRISTAL POLANCO FELIZ", sucursal_principal:"Tania 2", sucursal_secundaria:"Tania 4", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"7", nombre:"LICELOT MATEO", sucursal_principal:"Tania 2", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    
    /* ================= TANIA 4 ================= */
    
    { id_reloj:"1", nombre:"HILARIA ALT. RAMIREZ", sucursal_principal:"Tania 4", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"3", nombre:"MARITZABEL CASTILLO", sucursal_principal:"Tania 4", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"4", nombre:"JOSE MIGUEL BOBADILLA", sucursal_principal:"Tania 4", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"6", nombre:"ANA RITA COMPRES", sucursal_principal:"Tania 4", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"11", nombre:"JUAN DIEGO MONTAÑO", sucursal_principal:"Tania 4", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"22", nombre:"IRIS MARGARITA FELIZ", sucursal_principal:"Tania 4", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"13", nombre:"LIDIA FERRERA", sucursal_principal:"Tania 4", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"16", nombre:"YOHANNA RODRIGUEZ", sucursal_principal:"Tania 4", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"18", nombre:"ALBA TALAVERA", sucursal_principal:"Tania 4", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"33", nombre:"JUANA PEREZ", sucursal_principal:"Tania 4", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"T1027", nombre:"ALEJANDRO CRISOSTOMO", sucursal_principal:"Tania 4", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true },
    
    /* ================= TANIA 5 ================= */
    
    { id_reloj:"T1028", nombre:"DELFIN MONTILLA PEREZ", sucursal_principal:"Tania 5", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"5", nombre:"FRANCISCA REYES", sucursal_principal:"Tania 5", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"16", nombre:"ANA IRIS AMARANTE", sucursal_principal:"Tania 5", sucursal_secundaria:"Ninguna", sueldo:24225.60, exento_ponche:false },
    { id_reloj:"4", nombre:"OLGA LIDIA FLORENTINO", sucursal_principal:"Tania 5", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"T1029", nombre:"ARACELIS DISLA HERNANDEZ", sucursal_principal:"Tania 5", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"31", nombre:"MARIA FDA. AQUINO", sucursal_principal:"Tania 5", sucursal_secundaria:"Ninguna", sueldo:24225.60, exento_ponche:false },
    { id_reloj:"25", nombre:"LISBETH BAEZ", sucursal_principal:"Tania 5", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    
    /* ================= TANIA 6 ================= */
    
    { id_reloj:"8", nombre:"SANTOS C LARA TEJEDA", sucursal_principal:"Tania 6", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"14", nombre:"ALEJANDRA BAUTISTA LICENCIA MED", sucursal_principal:"Tania 6", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"10", nombre:"LUIS CORDERO", sucursal_principal:"Tania 6", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"29", nombre:"ANYI PEREZ T6", sucursal_principal:"Tania 6", sucursal_secundaria:"Ninguna", cargo:"CAJERA", sueldo:22495.20, exento_ponche:false },
    { id_reloj:"36", nombre:"NATALY PEREZ OTAÑO", sucursal_principal:"Tania 6", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"38", nombre:"KATHERINE CUSTODIO", sucursal_principal:"Tania 6", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"39", nombre:"PERLA PEREZ", sucursal_principal:"Tania 6", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"40", font_size:"ROSA BELTRE", nombre:"ROSA BELTRE", sucursal_principal:"Tania 6", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    
    /* ================= TANIA 7 ================= */
    
    { id_reloj:"T1030", nombre:"MARIANELYS OGANDO", sucursal_principal:"Tania 7", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"T1031", nombre:"FRANCISCO GUZMAN", sucursal_principal:"Tania 7", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"T1032", nombre:"ALEJANDRA CARABALLO", sucursal_principal:"Tania 7", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"T1033", nombre:"KARLA RUIZ", sucursal_principal:"Tania 7", sucursal_secundaria:"Ninguna", cargo:"CAJERA", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"T1034", nombre:"YACAIRA MONTERO MONTERO", sucursal_principal:"Tania 7", sucursal_secundaria:"Ninguna", cargo:"DEPENDIENTE", sueldo:31146.41, exento_ponche:false },
    { id_reloj:"T1035", nombre:"CAMILA ALTHAHONA", sucursal_principal:"Tania 7", sucursal_secundaria:"Ninguna", sueldo:27000.00, exento_ponche:false },
    
    /* ================= TANIA 8 ================= */
    
    { id_reloj:"2", nombre:"JAVIELA FRIAS VASQUEZ", sucursal_principal:"Tania 8", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"T1036", nombre:"CASANDRA CRISOSTOMO F", sucursal_principal:"Tania 8", sucursal_secundaria:"Ninguna", cargo:"CAJERA", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"7", nombre:"YELEINE RODRIGUEZ", sucursal_principal:"Tania 8", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"T1037", nombre:"BRYAN A CRISOSTOMO GOMEZ", sucursal_principal:"Tania 8", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"28", nombre:"CHARIN ALT. JORGE GUZMAN", sucursal_principal:"Tania 8", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"29", nombre:"LOHANMIS ALMONTE", sucursal_principal:"Tania 8", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    { id_reloj:"30", nombre:"EDUARDO VILLAR CASTRO", sucursal_principal:"Tania 8", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:false },
    
    /* ================= TANIA 9 ================= */
    
    { id_reloj:"T1038", nombre:"YAN CARLOS OLIVERO", sucursal_principal:"Tania 9", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"T1039", nombre:"RUDY HOLGUIN", sucursal_principal:"Tania 9", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"T1040", nombre:"YOSMEILYN GARCIA", sucursal_principal:"Tania 9", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"T1041", nombre:"KATHERINE MORENO", sucursal_principal:"Tania 9", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true },
    { id_reloj:"T1042", nombre:"CAROLY MERCEDES", sucursal_principal:"Tania 9", sucursal_secundaria:"Ninguna", sueldo:27489.60, exento_ponche:true }
    
    ];
  
  export const ASISTENCIA_INICIAL: AsistenciaRecord[] = [
/* ========================================================================== */
  /* ============== REPORTE DETALLADO: TANIA 2 (29 ABRIL - 13 MAYO) ============ */
  /* ========================================================================== */

// === DENNY REYES OLIVARES (ID: 12) ===
{ id_reloj: "12", fecha: "2026-04-29", turno: "08:00-16:00", entrada: "08:17", salida: "16:21", tipo_incidencia: "Tardanza", retraso_minutos: 17, error_reloj: false },
{ id_reloj: "12", fecha: "2026-04-30", turno: "08:00-16:00", entrada: "08:21", salida: "16:08", tipo_incidencia: "Tardanza", retraso_minutos: 21, error_reloj: false },
{ id_reloj: "12", fecha: "2026-05-01", turno: "08:00-16:00", entrada: "08:26", salida: "16:09", tipo_incidencia: "Tardanza", retraso_minutos: 26, error_reloj: false },
{ id_reloj: "12", fecha: "2026-05-02", tipo_incidencia: "Normal", error_reloj: false }, // Día Libre Autorizado
{ id_reloj: "12", fecha: "2026-05-03", turno: "08:00-16:00", entrada: "08:52", salida: "16:28", tipo_incidencia: "Tardanza", retraso_minutos: 52, error_reloj: false },
{ id_reloj: "12", fecha: "2026-05-04", turno: "08:00-16:00", tipo_incidencia: "Ausencia", error_reloj: false }, // No asistió
{ id_reloj: "12", fecha: "2026-05-05", turno: "08:00-16:00", entrada: "08:13", salida: "16:14", tipo_incidencia: "Tardanza", retraso_minutos: 13, error_reloj: false },
{ id_reloj: "12", fecha: "2026-05-06", turno: "08:00-16:00", entrada: "08:32", salida: "16:09", tipo_incidencia: "Tardanza", retraso_minutos: 32, error_reloj: false },
{ id_reloj: "12", fecha: "2026-05-07", turno: "08:00-16:00", entrada: "08:20", salida: "16:00", tipo_incidencia: "Tardanza", retraso_minutos: 20, error_reloj: false },
{ id_reloj: "12", fecha: "2026-05-08", turno: "08:00-16:00", entrada: "08:22", salida: "16:02", tipo_incidencia: "Tardanza", retraso_minutos: 22, error_reloj: false },
{ id_reloj: "12", fecha: "2026-05-09", tipo_incidencia: "Normal", error_reloj: false }, // Día Libre Autorizado
{ id_reloj: "12", fecha: "2026-05-10", turno: "08:00-16:00", entrada: "08:41", salida: "15:59", tipo_incidencia: "Tardanza", retraso_minutos: 41, error_reloj: false },
{ id_reloj: "12", fecha: "2026-05-11", turno: "08:00-16:00", entrada: "08:23", salida: "16:17", tipo_incidencia: "Tardanza", retraso_minutos: 23, error_reloj: false },
{ id_reloj: "12", fecha: "2026-05-12", turno: "08:00-16:00", entrada: "08:37", salida: "16:08", tipo_incidencia: "Tardanza", retraso_minutos: 37, error_reloj: false },
{ id_reloj: "12", fecha: "2026-05-13", turno: "08:00-16:00", entrada: "08:28", salida: "16:14", tipo_incidencia: "Tardanza", retraso_minutos: 28, error_reloj: false },
  ];
  
  export const SUCURSALES_DISPONIBLES = ["Tania 1", "Tania 2", "Tania 3", "Tania 4", "Tania 5"];
  export const CARGOS_DISPONIBLES = ["Farmacéutico", "Cajero", "Vendedor/Cajero", "Supervisor"];
  export const BANCOS_RD = ["Banco BHD", "Banreservas", "Banco Popular"];