// data/feriados.ts
// Lista editable de feriados. Vive en el módulo de ponches (no en RRHH).
// El parser solo usa las fechas; el nombre es para mostrar.

export interface Feriado {
    fecha: string; // ISO "2026-01-01"
    nombre: string;
  }
  
  // OJO: en RD varios feriados se trasladan al lunes (Ley 139-97), así que las
  // fechas MOVIBLES cambian cada año. Abajo van tu semilla + los fijos.
  // Los movibles quedan como recordatorio para que confirmes el día de 2026.
  export const FERIADOS: Feriado[] = [
    { fecha: "2026-01-01", nombre: "Año Nuevo" },
    { fecha: "2026-01-21", nombre: "Día de la Altagracia" },
    { fecha: "2026-02-27", nombre: "Día de la Independencia" },
    { fecha: "2026-04-03", nombre: "Viernes Santo" },
    { fecha: "2026-05-04", nombre: "Día del Trabajo" },
    { fecha: "2026-09-24", nombre: "Día de las Mercedes" },
    { fecha: "2026-12-25", nombre: "Navidad" },
    // Movibles (se trasladan a lunes — confirmar fecha 2026):
    //   Día de Reyes (~6 ene), Duarte (~26 ene),
    //   Restauración (~16 ago), Constitución (~6 nov).
  ];
  
  /** Solo las fechas ISO — es lo que recibe parsearArchivo({ feriados }). */
  export const fechasFeriado = (): string[] => FERIADOS.map((f) => f.fecha);