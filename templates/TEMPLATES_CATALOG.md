# 📚 Pulso Template Library v2 Enhanced - Catálogo Completo

## 📊 Resumen de 19 Templates

| # | Template | Categoría | Pasos | AI | OCR | Branches | Escalation | Remediation | BLOCK |
|---|----------|-----------|-------|----|-----|----------|------------|-------------|-------|
| 1 | Apertura Restaurante | Operaciones Diarias | 12 | 4 fotos | 1 | 3 | 3 niveles | No | 1 |
| 2 | Cierre Restaurante | Operaciones Diarias | 14 | 2 fotos | 1 | 2 | 3 niveles | Sí | 2 |
| 3 | Limpieza y Sanitización | Operaciones Diarias | 15 | 6 fotos | 0 | 2 | 2 niveles | Sí | 3 |
| 4 | Mantenimiento Equipos V2 | Operaciones Diarias | 12 | 6 fotos | 0 | 1 | 2 niveles | Sí | 1 |
| 5 | Recepción de Mercancía | Control de Calidad | 12 | 3 fotos | 2 | 5 | 3 niveles | No | 2 |
| 6 | Control Higiene Personal | Control de Calidad | 10 | 2 fotos | 0 | 3 | 2 niveles | Sí | 1 |
| 7 | Control de Temperaturas | Control de Calidad | 10 | 1 foto | 4 | 1 | 3 niveles | Sí | 1 |
| 8 | Inspección de Alimentos | Control de Calidad | 10 | 1 foto | 1 | 2 | 2 niveles | Sí | 0 |
| 9 | Checklist Mantenimiento | Mantenimiento | 12 | 2 fotos | 0 | 1 | 1 nivel | No | 0 |
| 10 | Mant. Refrigeradores | Mantenimiento | 10 | 3 fotos | 0 | 2 | 2 niveles | Sí | 0 |
| 11 | Seguridad del Local | Seguridad | 10 | 3 fotos | 1 | 1 | 2 niveles | No | 0 |
| 12 | Control de Accesos | Seguridad | 8 | 1 foto | 1 | 2 | 0 niveles | No | 0 |
| 13 | Sistema Contra Incendios | Compliance | 10 | 3 fotos | 2 | 1 | 3 niveles | Sí | 1 |
| 14 | Fumigación | Compliance | 8 | 2 fotos | 1 | 2 | 2 niveles | Sí | 1 |
| 15 | NOM-035 Encuesta | Compliance | 15 | 0 | 0 | 1 | 0 niveles | No | 0 |
| 16 | Asistencia Diaria | Compliance | 6 | 1 foto | 0 | 0 | 1 nivel | No | 0 |
| 17 | Onboarding Empleado | Recursos Humanos | 12 | 1 foto | 3 | 2 | 1 nivel | No | 0 |
| 18 | Reporte de Incidentes | Atención al Cliente | 10 | 1 foto | 0 | 1 | 3 niveles | No | 1 |
| 19 | Conteo de Inventario | Inventario | 10 | 1 foto | 0 | 1 | 1 nivel | No | 0 |

---

## 1. Operaciones Diarias (4)

### 1.1 🌅 Apertura de Restaurante
**Archivo**: `operaciones_diarias/apertura-restaurante-v2-enhanced.json`

- ✅ AI Verification: Exterior, comedor, cocina, personal (4 fotos)
- ✅ Branching: Luces → reporte mantenimiento, uniforme → corrección
- ✅ Escalation: Gerente (0 min) → Técnico (30 min) → Owner (120 min)
- ✅ GPS Validation: Confirmar ubicación en sucursal
- ✅ Compliance: NOM-251, daily, auditable
- ✅ Completion: Notificación, PDF report, branch status OPEN

### 1.2 🌙 Cierre de Restaurante
**Archivo**: `operaciones_diarias/cierre-restaurante-v2-enhanced.json`

- ✅ AI Verification: Cocina limpia, exterior cerrado (2 fotos)
- ✅ Cash Control: Diferencias automáticas, alertas >$500 → CRITICAL + BLOCK
- ✅ Security Protocol: Puertas, ventanas, alarma (BLOCK si incompleto)
- ✅ Equipment Shutdown: Verificación AI de equipos apagados (BLOCK si encendidos)
- ✅ Compliance: NOM-251, daily, auditable
- ✅ Completion: Sync contabilidad, PDF report, branch status CLOSED

**Alertas Críticas**: Diferencia > $500 → Llamada a Owner | Equipos encendidos → BLOCK

### 1.3 🧹 Limpieza y Sanitización
**Archivo**: `operaciones_diarias/limpieza-sanitizacion-v2-enhanced.json`

- ✅ AI Verification: 6 fotos (mesas, estufas, refrigeradores, pisos, baños, comedor)
- ✅ Chemical Monitoring: Concentración de cloro (ppm, 50-200)
- ✅ Remediation Protocols: GUIDED_SELF_FIX para áreas sucias
- ✅ Critical BLOCKing: Tablas de cortar, manijas, baños → BLOCK si AI falla
- ✅ Compliance: NOM-251 Sec 5.2, daily/weekly

### 1.4 🔧 Mantenimiento de Equipos V2
**Archivo**: `operaciones_diarias/mantenimiento-equipos-v2-enhanced.json`

- ✅ AI Verification: 6 fotos (estufa, freidoras, etc.)
- ✅ Logic Rules: Si equipo no funciona → CREATE_MAINTENANCE_TICKET URGENT + BLOCK
- ✅ Remediation: Si equipo sucio → protocolo limpieza guiado
- ✅ Compliance: NOM-251 (indirecto), daily/weekly

---

## 2. Control de Calidad (4)

### 2.1 📦 Recepción de Mercancía
**Archivo**: `control_calidad/recepcion-mercancia-v2-enhanced.json`

- ✅ AI Verification: Vehículo, carnes, verduras (3 fotos) + OCR remisión
- ✅ Temperature Control: Auto-rechazo si > 4°C → CRITICAL + BLOCK + claim
- ✅ Quality Checks: Carnes, verduras, fechas caducidad (OCR)
- ✅ Branching: Aceptar/Rechazar/Aceptar con descuento (5 branches)
- ✅ Compliance: NOM-251 Sec 5.1.2, per-delivery, evidenceRequired

### 2.2 🧼 Control de Higiene Personal
**Archivo**: `control_calidad/control-higiene-personal-v2-enhanced.json`

- ✅ AI Verification: Manos, uniforme (2 fotos)
- ✅ Health Screening: Fiebre, diarrea, vómito, heridas → BLOCK + send home
- ✅ Remediation: Corrección guiada de higiene de manos + re-verificación AI
- ✅ Compliance: NOM-251 Sec 4.2, daily per shift, criticalForCompliance

### 2.3 🌡️ Control de Temperaturas
**Archivo**: `control_calidad/control-temperaturas-v1.json`

- ✅ 4 campos de temperatura (2 refrigeradores, 2 congeladores)
- ✅ OCR de termómetros + AI buffet
- ✅ Logic: Refrig > 4°C → CRITICAL | Congelador > -18°C → HIGH | Cocido < 60°C → WARNING
- ✅ Remediation: Verificar puerta → 15 min → re-verificar
- ✅ Compliance: NOM-251 Sec 5.3, cada 4 horas, criticalForCompliance

### 2.4 🔍 Inspección de Alimentos
**Archivo**: `control_calidad/inspeccion-alimentos-v1.json`

- ✅ AI Verification: Evaluación visual de producto (color, textura, aspecto)
- ✅ OCR: Etiqueta con fecha de caducidad, lote
- ✅ Branching: No apto → registro merma | Dudoso → evaluación supervisor
- ✅ Compliance: NOM-251, per-inspection, auditable

---

## 3. Mantenimiento (2)

### 3.1 🔧 Checklist Mantenimiento General
**Archivo**: `mantenimiento/checklist-mantenimiento-v1.json`

- ✅ AI Verification: HVAC, pisos/paredes, evidencia (2 fotos)
- ✅ Logic Rules: Prioridad Urgente → ticket HIGH | Alta → ticket NORMAL
- ✅ Completion: Crear tickets, notificar gerente
- ✅ Frecuencia: weekly/monthly

### 3.2 ❄️ Mantenimiento Equipos Refrigeradores
**Archivo**: `mantenimiento/mantenimiento-equipos-v1.json`

- ✅ AI Before/After: Condensador, sellos, interior (3 fotos)
- ✅ Branching: Sellos dañados → orden reemplazo | Ruidos → técnico
- ✅ Compliance: NOM-251 (indirecto), monthly

---

## 4. Seguridad (2)

### 4.1 🔒 Seguridad del Local
**Archivo**: `seguridad/seguridad-local-v1.json`

- ✅ AI Verification: Puertas, cámaras CCTV, señalización, extintores OCR (3 fotos)
- ✅ Logic: Extintor vencido → CRITICAL + ticket reemplazo | Cámara no funciona → HIGH
- ✅ Compliance: NOM-002-STPS, monthly

### 4.2 🚪 Control de Accesos
**Archivo**: `seguridad/control-accesos-v1.json`

- ✅ OCR de identificación (INE, pasaporte, etc.)
- ✅ Branching: Proveedor → verificación autorización | Visitante → acompañante
- ✅ Registro: Entrada/salida con timestamps

---

## 5. Compliance (4)

### 5.1 🧯 Inspección Sistema Contra Incendios
**Archivo**: `compliance/inspeccion-sistema-contra-incendios-v1.json`

- ✅ AI + OCR: Extintores (fecha vigencia), señalización, rutas evacuación (3 fotos)
- ✅ Logic: Extintor vencido → CRITICAL + ticket urgente | Ruta bloqueada → HIGH
- ✅ Escalation: Gerente → Owner (24h) → Autoridad (si persiste)
- ✅ Compliance: NOM-002-STPS, monthly/quarterly, criticalForCompliance

### 5.2 🐛 Fumigación
**Archivo**: `compliance/fumigacion-v1.json`

- ✅ OCR de certificado de fumigación (empresa, licencia, vigencia)
- ✅ AI: Verificación que no hay alimentos expuestos post-aplicación
- ✅ Logic: Certificado vencido → CRITICAL + BLOCK | Alimentos expuestos → remediation
- ✅ Compliance: NOM-251 Sec 6.1, monthly/quarterly, evidenceRequired

### 5.3 📋 NOM-035 Encuesta de Clima Laboral
**Archivo**: `compliance/nom-035-survey-v1.json`

- ✅ 12 preguntas tipo Likert (1-5) sobre entorno organizacional
- ✅ Anónima: ID anónimo de empleado, sin AI verification
- ✅ Logic: Puntuación general < 2.5 → WARNING + plan acción | Violencia "siempre" → CRITICAL
- ✅ Completion: Calcular puntuación, reporte anónimo, notificar RH si crítico
- ✅ Compliance: NOM-035-STPS-2018, annual/biannual

### 5.4 ⏰ Asistencia Diaria
**Archivo**: `compliance/daily-attendance-v1.json`

- ✅ GPS Validation: Confirmar ubicación en sucursal
- ✅ AI: Selfie con verificación facial básica
- ✅ Logic: > 15 min tarde → WARNING | > 30 min → HIGH + gerente | Sin break en 6h → WARNING
- ✅ Compliance: LABOR_LAW, daily, auditable

---

## 6. Recursos Humanos (1)

### 6.1 👤 Onboarding de Empleado
**Archivo**: `recursos_humanos/onboarding-empleado-v2-enhanced.json`

- ✅ AI/OCR: Verificación de documentos (INE, RFC, NSS, etc.)
- ✅ Checklist: 8 documentos requeridos
- ✅ SignatureField: Firma de contrato digital
- ✅ Completion: Crear expediente laboral, activar acceso sistema
- ✅ Compliance: LABOR_LAW, per-event, auditable

---

## 7. Atención al Cliente (1)

### 7.1 ⚠️ Reporte de Incidentes
**Archivo**: `atencion_cliente/reporte-incidentes-v2-enhanced.json`

- ✅ AI: Foto del área con análisis de seguridad
- ✅ Logic: Intoxicación/alergia → CRITICAL + OWNER + COFEPRIS | Accidente → HIGH + STPS
- ✅ Escalation: Gerente (inmediato) → Owner (30 min) → Autoridad
- ✅ Compliance: NOM-251, per-event, criticalForCompliance

---

## 8. Inventario (1)

### 8.1 📊 Conteo de Inventario
**Archivo**: `inventory/conteo-inventario-v1.json`

- ✅ AI: Foto de estantería con detección y estimación de stock
- ✅ Logic: Diferencia > 20% → WARNING + gerente | Producto vencido → CRITICAL
- ✅ Completion: Actualizar inventario, reporte discrepancias
- ✅ Compliance: NOM-251 (indirecto), weekly/monthly

---

## 🎯 Patrones Comunes

### Escalation Chain Pattern
```json
{
  "level": 1,
  "triggerAfterMinutes": 0,
  "notifyRoles": ["GERENTE"],
  "channel": "whatsapp",
  "message": "Mensaje con {placeholders}"
}
```

### AI Verification Pattern
```json
{
  "enabled": true,
  "prompt": "Analiza... Verifica: 1) X, 2) Y, 3) Z",
  "threshold": 0.75,
  "expectedConditions": ["condición1", "condición2"]
}
```

### Remediation Protocol Pattern
```json
{
  "enabled": true,
  "type": "GUIDED_SELF_FIX",
  "maxAttempts": 2,
  "timeoutMinutes": 15,
  "steps": [
    {
      "instruction": "Paso a seguir",
      "waitSeconds": 300,
      "verification": {
        "type": "ai_photo_verification",
        "targetCondition": "ai_result.passed == true"
      }
    }
  ]
}
```

---

## 📊 Comparativa de Features Extendida

| Feature | Apertura | Cierre | Limpieza | Mtto V2 | Recepción | Higiene | Temp | Alimentos |
|---------|----------|--------|----------|---------|-----------|---------|------|-----------|
| AI Photos | 4 | 2 | 6 | 6 | 3 | 2 | 1 | 1 |
| OCR | 0 | 0 | 0 | 0 | 2 | 0 | 4 | 1 |
| Branches | 3 | 2 | 2 | 1 | 5 | 3 | 1 | 2 |
| Escalation Lvs | 3 | 3 | 2 | 2 | 3 | 2 | 3 | 2 |
| Remediation | No | Sí | Sí | Sí | No | Sí | Sí | Sí |
| BLOCK Conds | 1 | 2 | 3 | 1 | 2 | 1 | 1 | 0 |

| Feature | Mtto Gen | Mtto Refrig | Seguridad | Accesos | Incendios | Fumigación | NOM-035 | Asistencia |
|---------|----------|-------------|-----------|---------|-----------|------------|---------|------------|
| AI Photos | 2 | 3 | 3 | 1 | 3 | 2 | 0 | 1 |
| OCR | 0 | 0 | 1 | 1 | 2 | 1 | 0 | 0 |
| Branches | 1 | 2 | 1 | 2 | 1 | 2 | 1 | 0 |
| Escalation Lvs | 1 | 2 | 2 | 0 | 3 | 2 | 0 | 1 |
| Remediation | No | Sí | No | No | Sí | Sí | No | No |
| BLOCK Conds | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 |

| Feature | Onboarding | Incidentes | Inventario |
|---------|------------|------------|------------|
| AI Photos | 1 | 1 | 1 |
| OCR | 3 | 0 | 0 |
| Branches | 2 | 1 | 1 |
| Escalation Lvs | 1 | 3 | 1 |
| Remediation | No | No | No |
| BLOCK Conds | 0 | 1 | 0 |

---

## 📖 Documentación de Referencia

- **Schema Completo**: `TEMPLATE_SCHEMA.md`
- **Guía de Usuario**: `user-guide.md`
- **Documentación Técnica**: `technical-documentation.md`

---

## 💡 Notas para Empresas

Estos templates son **bases robustas** que pueden ser personalizadas:

**Personalizable**:
- Thresholds de temperatura
- Roles de escalación
- Mensajes de WhatsApp
- Tiempos de espera
- Productos químicos específicos

**No Personalizable (Core)**:
- Estructura de AI verification
- Lógica de branching
- Sistema de escalación
- Remediation protocols

**Recomendación**: Clonar template → Ajustar a negocio → Activar
