export const equipmentTypes = [
  { value: "REFRIGERATOR", label: "Refrigerador" },
  { value: "FREEZER", label: "Congelador" },
  { value: "OVEN", label: "Horno" },
  { value: "STOVE", label: "Estufa" },
  { value: "GRILL", label: "Parrilla" },
  { value: "FRYER", label: "Freidora" },
  { value: "DISHWASHER", label: "Lavavajillas" },
  { value: "COFFEE_MACHINE", label: "Cafetera" },
  { value: "BLENDER", label: "Licuadora" },
  { value: "MIXER", label: "Batidora" },
  { value: "EXHAUST_HOOD", label: "Campana Extractora" },
  { value: "AIR_CONDITIONER", label: "Aire Acondicionado" },
  { value: "FIRE_SUPPRESSION", label: "Sistema Contra Incendios" },
  { value: "SECURITY_CAMERA", label: "Cámara de Seguridad" },
  { value: "POS_SYSTEM", label: "Sistema POS" },
  { value: "OTHER", label: "Otro" },
] as const;

export const maintenanceFrequencies = [
  { value: "DAILY", label: "Diario" },
  { value: "WEEKLY", label: "Semanal" },
  { value: "BIWEEKLY", label: "Quincenal" },
  { value: "MONTHLY", label: "Mensual" },
  { value: "BIMONTHLY", label: "Bimestral" },
  { value: "QUARTERLY", label: "Trimestral" },
  { value: "SEMIANNUAL", label: "Semestral" },
  { value: "ANNUAL", label: "Anual" },
  { value: "CUSTOM", label: "Personalizado" },
] as const;

export const equipmentAreas = [
  { value: "BACK_OF_HOUSE", label: "Back of House" },
  { value: "FRONT_OF_HOUSE", label: "Front of House" },
  { value: "STORAGE", label: "Almacén" },
  { value: "OFFICE", label: "Oficina" },
  { value: "OUTDOOR", label: "Exterior" },
] as const;

export const complianceServiceTypes = [
  { value: "FUMIGATION", label: "Fumigación" },
  { value: "FIRE_SYSTEM_CHECK", label: "Sistema Contra Incendios" },
  { value: "ELECTRICAL_INSPECTION", label: "Inspección Eléctrica" },
  { value: "GAS_INSPECTION", label: "Inspección de Gas" },
  { value: "WATER_QUALITY", label: "Calidad del Agua" },
  { value: "AIR_QUALITY", label: "Calidad del Aire" },
  { value: "PEST_CONTROL", label: "Control de Plagas" },
  { value: "HYGIENE_AUDIT", label: "Auditoría de Higiene" },
  { value: "SAFETY_INSPECTION", label: "Inspección de Seguridad" },
  { value: "OTHER", label: "Otro" },
] as const;

export const maintenanceTypes = [
  { value: "PREVENTIVE", label: "Preventivo" },
  { value: "CORRECTIVE", label: "Correctivo" },
  { value: "INSPECTION", label: "Inspección" },
  { value: "CLEANING", label: "Limpieza" },
  { value: "CALIBRATION", label: "Calibración" },
  { value: "EMERGENCY", label: "Emergencia" },
] as const;

export const providerTypes = [
  { value: "INTERNAL", label: "Interno" },
  { value: "EXTERNAL", label: "Externo" },
  { value: "CERTIFIED", label: "Certificado" },
] as const;

export const serviceProviderServiceTypes = [
  "Mantenimiento General",
  "Refrigeración",
  "Electricidad",
  "Plomería",
  "Carpintería",
  "Pintura",
  "Limpieza",
  "Jardinería",
  "Seguridad",
  "IT/Sistemas",
  "Fumigación",
  "Sistemas Contra Incendios",
  "Aire Acondicionado",
  "Equipos de Cocina",
  "Electrodomésticos",
] as const;

export const complianceServiceAreas = [
  "Cocina",
  "Área de Comedor",
  "Almacén",
  "Baños",
  "Oficinas",
  "Exterior",
  "Estacionamiento",
  "Área de Carga",
  "Sótano",
  "Azotea",
] as const;

export function getEquipmentTypeLabel(value: string): string {
  return equipmentTypes.find(t => t.value === value)?.label || value;
}

export function getMaintenanceFrequencyLabel(value: string): string {
  return maintenanceFrequencies.find(f => f.value === value)?.label || value;
}

export function getAreaLabel(value: string): string {
  return equipmentAreas.find(a => a.value === value)?.label || value;
}

export function getComplianceServiceTypeLabel(value: string): string {
  return complianceServiceTypes.find(t => t.value === value)?.label || value;
}

export function getMaintenanceTypeLabel(value: string): string {
  return maintenanceTypes.find(t => t.value === value)?.label || value;
}

export function getProviderTypeLabel(value: string): string {
  return providerTypes.find(t => t.value === value)?.label || value;
}
