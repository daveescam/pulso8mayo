# 📚 Templates Mejorados - Catálogo Completo

## ✅ Templates Completados (v2 Enhanced)

### 1. 🌅 Apertura de Restaurante
**Archivo**: `operaciones_diarias/apertura-restaurante-v2-enhanced.json`

**Características**:
- ✅ AI Verification: Exterior, comedor, cocina, personal
- ✅ Branching: Luces, uniformes, limpieza exterior
- ✅ Escalation: 3 niveles (Gerente → Técnico → Owner)
- ✅ GPS Validation: Confirmar ubicación en sucursal
- ✅ Automated Actions: Notificaciones, PDF report, status update

**Casos de Uso**:
- Verificación de temperatura ambiente
- Control de personal uniformado
- Inspección de instalaciones
- Fondo de caja inicial

---

### 2. 🌙 Cierre de Restaurante
**Archivo**: `operaciones_diarias/cierre-restaurante-v2-enhanced.json`

**Características**:
- ✅ AI Verification: Cocina limpia, exterior cerrado
- ✅ Cash Control: Diferencias automáticas, alertas por montos altos
- ✅ Security Protocol: Puertas, ventanas, alarma (BLOCK si incompleto)
- ✅ Equipment Shutdown: Verificación de equipos críticos
- ✅ Automated Actions: Sync contabilidad, PDF report

**Casos de Uso**:
- Corte de caja con detección de diferencias
- Protocolo de seguridad completo
- Verificación de equipos apagados
- Control de temperatura al cierre

**Alertas Críticas**:
- Diferencia > $500 → Llamada a Owner
- Equipos críticos encendidos → BLOCK completion
- Temperatura alta → Escalación inmediata

---

### 3. 🧹 Limpieza y Sanitización
**Archivo**: `operaciones_diarias/limpieza-sanitizacion-v2-enhanced.json`

**Características**:
- ✅ AI Verification: Mesas, estufas, refrigeradores, pisos, baños, comedor
- ✅ Chemical Monitoring: Concentración de cloro (ppm)
- ✅ Remediation Protocols: Auto-corrección guiada para áreas sucias
- ✅ Critical Areas Checklist: Tablas, cuchillos, manijas (BLOCK si incompleto)
- ✅ Time Tracking: Alerta si tiempo sospechosamente corto

**Casos de Uso**:
- Limpieza diaria, profunda, o sanitización
- Verificación de productos químicos
- Certificación de áreas críticas
- Control de calidad con IA

**Áreas Verificadas por IA**:
- Mesas de trabajo (threshold 0.8)
- Estufas y hornos (threshold 0.75)
- Refrigeradores (threshold 0.75)
- Pisos (threshold 0.7)
- Baños (threshold 0.75 - CRITICAL)
- Comedor (threshold 0.75)

---

### 4. 📦 Recepción de Mercancía
**Archivo**: `control_calidad/recepcion-mercancia-v2-enhanced.json`

**Características**:
- ✅ AI Verification: Vehículo, productos, remisión (OCR)
- ✅ Temperature Control: Auto-rechazo si > 4°C
- ✅ Quality Checks: Carnes, verduras, fechas de caducidad
- ✅ Supplier Rating: Actualización automática basada en calidad
- ✅ Automated Actions: Claims, inventory update, purchasing alerts

**Casos de Uso**:
- Inspección de vehículo de entrega
- Control de temperatura de productos fríos
- Verificación de cantidades vs orden
- Decisión de aceptar/rechazar

**Decisiones Automáticas**:
- Temp > 4°C → BLOCK + Crear claim
- Productos vencidos → Escalación + Claim
- Rechazo total → Llamada + Notify purchasing

---

### 5. 🧼 Control de Higiene Personal
**Archivo**: `control_calidad/control-higiene-personal-v2-enhanced.json`

**Características**:
- ✅ AI Verification: Manos, uniforme
- ✅ Health Screening: Síntomas (fiebre, diarrea, vómito)
- ✅ Remediation Protocol: Corrección de higiene de manos
- ✅ Critical Blocking: BLOCK si síntomas críticos
- ✅ Automated Actions: Update employee status, send home protocol

**Casos de Uso**:
- Verificación de manos limpias
- Control de uniforme completo
- Detección de heridas
- Screening de salud

**Bloqueos Críticos**:
- Síntomas de enfermedad → BLOCK + Send home
- Higiene de manos fallida después de remediation → Escalación

---

## 📊 Comparativa de Features

| Feature | Apertura | Cierre | Limpieza | Recepción | Higiene |
|---------|----------|--------|----------|-----------|---------|
| AI Verification | 4 fotos | 2 fotos | 6 fotos | 3 fotos | 2 fotos |
| Branching | 3 branches | 2 branches | 2 branches | 5 branches | 3 branches |
| Escalation Levels | 3 | 3 | 2 | 3 | 2 |
| Remediation | No | Sí (cocina) | Sí (múltiple) | No | Sí (manos) |
| GPS Validation | ✅ | ✅ | ❌ | ❌ | ❌ |
| BLOCK Conditions | 1 | 2 | 1 | 2 | 1 |
| Auto Actions | 3 | 4 | 4 | 5 | 2 |

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

## 🚀 Próximos Pasos

### Templates Adicionales Sugeridos
1. **Control de Plagas** - Inspección mensual
2. **Mantenimiento Preventivo** - Equipos críticos
3. **Capacitación de Personal** - Onboarding
4. **Auditoría de Seguridad** - Mensual
5. **Control de Desperdicios** - Diario

### Mejoras al Sistema
1. Implementar backend para todos los features
2. UI para customización de templates
3. Dashboard de analytics por template
4. Sistema de versioning automático
5. Template marketplace

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
