// Shared constants for equipment forms and components
// This file eliminates duplication between equipment-form and equipment-catalog-form

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
  { value: "QUARTERLY", label: "Trimestral" },
  { value: "SEMIANNUAL", label: "Semestral" },
  { value: "ANNUAL", label: "Anual" },
] as const;

export const equipmentAreas = [
  { value: "BACK_OF_HOUSE", label: "Back of House" },
  { value: "FRONT_OF_HOUSE", label: "Front of House" },
  { value: "STORAGE", label: "Almacén" },
  { value: "OFFICE", label: "Oficina" },
  { value: "OUTDOOR", label: "Exterior" },
] as const;

// Helper to get label from value
export function getEquipmentTypeLabel(value: string): string {
  return equipmentTypes.find(t => t.value === value)?.label || value;
}

export function getMaintenanceFrequencyLabel(value: string): string {
  return maintenanceFrequencies.find(f => f.value === value)?.label || value;
}

export function getAreaLabel(value: string): string {
  return equipmentAreas.find(a => a.value === value)?.label || value;
}
