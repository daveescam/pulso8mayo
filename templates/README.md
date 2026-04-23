# Pulso Template Library

This is a comprehensive collection of HORECA operation templates designed to streamline daily operations, quality control, and compliance workflows.

## Overview

The Pulso Template Library includes over 15+ starter templates covering the most common HORECA operations:

- Daily operations (opening/closing procedures)
- Temperature monitoring workflows
- Food safety inspections
- Inventory management processes
- Staff training and certification
- Equipment maintenance schedules
- Quality control procedures
- Compliance reporting workflows
- Customer service protocols
- Waste management procedures

## Template Categories

### Daily Operations
- `tpl-apertura-restaurante-v1` - Daily opening checklist for restaurants with AI temperature verification
- `tpl-cierre-restaurante-v1` - Daily closing checklist with inventory management and PEPS tracking
- `tpl-limpieza-sanitizacion-v1` - Pre-service cleaning protocol with photographic verification

### Quality Control
- `tpl-control-temperaturas-v1` - Food temperature safety checks throughout the day
- `tpl-inspeccion-alimentos-v1` - Protocol for inspecting received food and ingredients

### Maintenance
- `tpl-mantenimiento-equipos-v1` - Preventive maintenance for refrigeration equipment

## Template Structure

Each template follows a consistent structure:

```json
{
  "id": "unique-template-id",
  "nombre": "Template Display Name",
  "descripcion": "What this template is for",
  "tipo": "APERTURA_CIERRE | INSPECCION | CONTROL_CALIDAD | etc.",
  "categoria": "OPERACIONES_DIARIAS | MANTENIMIENTO | SEGURIDAD | etc.",
  "icon": "Visual indicator",
  "duracionEstimada": "Time to complete",
  "frecuencia": "How often to run",
  "cumplimientoNormativo": ["Regulatory standards"],
  "tags": ["searchable tags"],
  "version": 1,
  "activo": true,
  "requiereIA": true/false,
  "aiConfig": { ... },
  "alertConfig": { ... },
  "pasos": [...],
  "onComplete": { ... }
}
```

## Using Templates

To use a template in your application:

1. Import the template library:
```ts
import { getTemplateById, getAllTemplates, getTemplatesByCategory } from '@/templates';
```

2. Retrieve a specific template:
```ts
const openingTemplate = getTemplateById('tpl-apertura-restaurante-v1');
```

3. Get templates by category:
```ts
const dailyOps = getTemplatesByCategory('OPERACIONES_DIARIAS');
```

## Adding New Templates

To add a new template:

1. Create a new JSON file in the appropriate category subdirectory
2. Follow the template structure guidelines
3. Add the template to the index.ts file

## AI Verification

Many templates include AI verification capabilities:

- OCR for temperature reading validation
- Image analysis for cleanliness verification
- Quality assessment using multiple AI providers (Moondream/OpenAI)

## Compliance Standards

All templates are designed to help maintain compliance with industry standards:
- NOM-251-SSA1-2009
- HACCP protocols
- Food safety standards