/**
 * IMSS Parser Service
 * Generates SUA and IDSE format files for Mexican Social Security (IMSS)
 * 
 * SUA = Sistema Único de Autodeterminación (Salary update reports)
 * IDSE = IMSS Desde Su Empresa (Employee movements: alta, baja, modificación)
 */

export interface IMSSEmployee {
  nss: string;          // Número de Seguro Social (11 dígitos)
  curp: string;         // CURP (18 caracteres)
  rfc: string;          // RFC (13 caracteres)
  name: string;         // Apellido Paterno + Materno + Nombre(s)
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  baseSalaryDaily: number;  // Salario base diario en pesos
  sdi: number;          // Salario Diario Integrado
  hireDate: string;     // DDMMAAAA
  terminationDate?: string;
  workerType: string;   // Tipo de trabajador (1=Permanente, 2=Eventual)
  workWeek: string;     // Jornada (1=Normal, 2=Mixta, 3=Nocturna)
  movementType?: string; // 08=Alta, 02=Baja, 07=Mod salario
}

/**
 * Calculate SDI (Salario Diario Integrado)
 * SDI = Salario Diario × Factor de Integración
 * Factor primer año = 1.0452 (incluye aguinaldo 15 días + prima vacacional 25% de 12 días)
 */
export function calculateSDI(dailySalary: number, yearsOfService: number = 0): number {
  // Vacation days per Mexican LFT
  const vacationDays = getVacationDays(yearsOfService);
  const vacationPremium = vacationDays * 0.25; // 25% prima vacacional
  const aguinaldo = 15; // Minimum 15 days per year

  const integrationFactor = 1 + (aguinaldo + vacationPremium) / 365;
  return Math.round(dailySalary * integrationFactor * 100) / 100;
}

function getVacationDays(yearsOfService: number): number {
  if (yearsOfService <= 0) return 12;
  if (yearsOfService === 1) return 12;
  if (yearsOfService === 2) return 14;
  if (yearsOfService === 3) return 16;
  if (yearsOfService === 4) return 18;
  if (yearsOfService === 5) return 20;
  if (yearsOfService <= 10) return 22;
  if (yearsOfService <= 15) return 24;
  if (yearsOfService <= 20) return 26;
  if (yearsOfService <= 25) return 28;
  if (yearsOfService <= 30) return 30;
  if (yearsOfService <= 35) return 32;
  return 34;
}

/**
 * Format a string to fixed width with right padding
 */
function padRight(str: string, length: number): string {
  return (str || '').substring(0, length).padEnd(length, ' ');
}

/**
 * Format a number to fixed width with left zero padding
 */
function padLeft(str: string, length: number, char: string = '0'): string {
  return (str || '').substring(0, length).padStart(length, char);
}

/**
 * Format date from ISO to DDMMAAAA
 */
function formatDateIMSS(dateStr: string): string {
  if (!dateStr) return '00000000';
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  return `${dd}${mm}${yyyy}`;
}

/**
 * Format salary for IMSS files (7 digits, 2 decimal places, no separator)
 * Example: 350.50 -> "0035050"
 */
function formatSalary(salary: number): string {
  const cents = Math.round(salary * 100);
  return padLeft(cents.toString(), 7);
}

// ============================================================
// SUA FORMAT GENERATOR
// ============================================================

/**
 * Generate SUA format file content
 * Used for salary modification reports (actualizaciones salariales)
 * 
 * Format: Fixed-width text file
 * Each line = 1 employee record
 */
export function generateSUAFile(
  employees: IMSSEmployee[],
  registroPatronal: string,
  fechaMovimiento: string
): string {
  const lines: string[] = [];

  for (const emp of employees) {
    // SUA line format (common format, ~130 chars per line):
    // Pos 1-11:   NSS (11 chars)
    // Pos 12-18:  Salario (7 chars, cents)
    // Pos 19-26:  Fecha movimiento (DDMMAAAA)
    // Pos 27-37:  Registro patronal (11 chars)
    // Pos 38-64:  Apellido paterno (27 chars)
    // Pos 65-91:  Apellido materno (27 chars)
    // Pos 92-118: Nombre(s) (27 chars)
    // Pos 119-120: Tipo trabajador (2 chars)
    // Pos 121-122: Tipo jornada (2 chars)
    // Pos 123-130: Fecha alta IMSS (DDMMAAAA)

    const line = [
      padLeft(emp.nss, 11),                           // NSS
      formatSalary(emp.sdi),                          // SDI en centavos
      formatDateIMSS(fechaMovimiento),                // Fecha movimiento
      padRight(registroPatronal, 11),                 // Registro patronal
      padRight(emp.apellidoPaterno.toUpperCase(), 27),// Apellido paterno
      padRight(emp.apellidoMaterno.toUpperCase(), 27),// Apellido materno
      padRight(emp.nombres.toUpperCase(), 27),        // Nombre(s)
      padLeft(emp.workerType || '1', 2),              // Tipo trabajador
      padLeft(emp.workWeek || '1', 2),                // Tipo jornada
      formatDateIMSS(emp.hireDate),                   // Fecha alta
    ].join('');

    lines.push(line);
  }

  return lines.join('\r\n');
}

// ============================================================
// IDSE FORMAT GENERATOR
// ============================================================

/**
 * Generate IDSE format batch file for employee movements
 * 
 * Movement types:
 * 08 = Alta (new registration)
 * 02 = Baja (deregistration)
 * 07 = Modificación de salario
 */
export function generateIDSEFile(
  employees: IMSSEmployee[],
  registroPatronal: string,
  movementType: '08' | '02' | '07'
): string {
  const lines: string[] = [];

  // Header line
  const header = [
    'HD',                                              // Header identifier
    padRight(registroPatronal, 11),                   // Registro patronal
    padLeft(employees.length.toString(), 5),           // Total registros
    new Date().toISOString().slice(0, 10).replace(/-/g, ''), // Fecha generación AAAAMMDD
    padRight('PULSO_SISTEMA', 20),                    // Sistema generador
  ].join('|');
  lines.push(header);

  // Employee lines
  for (const emp of employees) {
    const line = [
      'DT',                                            // Detail identifier
      padLeft(emp.nss, 11),                            // NSS
      padRight(emp.curp, 18),                          // CURP
      padRight(emp.rfc, 13),                           // RFC
      padRight(emp.apellidoPaterno.toUpperCase(), 27), // Apellido paterno
      padRight(emp.apellidoMaterno.toUpperCase(), 27), // Apellido materno
      padRight(emp.nombres.toUpperCase(), 27),         // Nombre(s)
      formatSalary(emp.sdi),                           // SDI
      movementType,                                    // Tipo movimiento
      formatDateIMSS(emp.hireDate),                    // Fecha movimiento
      padLeft(emp.workerType || '1', 1),               // Tipo trabajador
      padLeft(emp.workWeek || '1', 1),                 // Tipo jornada
      emp.terminationDate ? formatDateIMSS(emp.terminationDate) : '00000000', // Fecha baja
    ].join('|');

    lines.push(line);
  }

  // Trailer line
  const trailer = [
    'TR',                                              // Trailer identifier
    padLeft(employees.length.toString(), 5),            // Total registros
  ].join('|');
  lines.push(trailer);

  return lines.join('\r\n');
}

/**
 * Validate NSS format (11 digits)
 */
export function validateNSS(nss: string): boolean {
  return /^\d{11}$/.test(nss);
}

/**
 * Validate CURP format (18 alphanumeric characters)
 */
export function validateCURP(curp: string): boolean {
  return /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/.test(curp.toUpperCase());
}

/**
 * Validate RFC format (12-13 characters)
 */
export function validateRFC(rfc: string): boolean {
  return /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/.test(rfc.toUpperCase());
}
