# 📋 Schema de Templates Mejorados - Pulso HORECA

## Estructura Completa de un Template

```json
{
  "id": "tpl-nombre-v1",
  "nombre": "🎯 Nombre del Workflow",
  "descripcion": "Descripción detallada",
  "tipo": "CATEGORIA",
  "categoria": "CATEGORIA",
  "version": 1,
  "activo": true,
  "requiereIA": true,
  "duracionEstimada": "10-15 min",
  "cumplimientoNormativo": ["NOM-XXX"],
  "tags": ["tag1", "tag2"],
  
  "aiConfig": {
    "provider": "moondream",
    "fallbackProvider": "openai",
    "maxRetries": 2
  },

  "complianceConfig": {
    "complianceType": "NOM-251 | NOM-035 | LABOR_LAW | null",
    "regulationSection": "5.1.2 (Section of regulation)",
    "requiredFrequency": "daily | weekly | monthly | annual",
    "auditable": true,
    "evidenceRequired": true,
    "criticalForCompliance": true
  },
  
  "pasos": [/* ver estructura de pasos */],
  
  "completionActions": [/* acciones automáticas */]
}
```

## Estructura de un Paso

```json
{
  "id": "paso-id",
  "type": "PhotoField | NumberField | YesNo | etc",
  "title": "Título del paso",
  "description": "Descripción opcional",
  "required": true,
  "placeholder": "Texto de ayuda",
  
  // VALIDACIÓN
  "validation": {
    "min": 0,
    "max": 100,
    "minTime": "05:00",
    "maxTime": "08:00",
    "radiusMeters": 100,
    "message": "Mensaje de error personalizado"
  },
  
  // AI VERIFICATION
  "aiVerification": {
    "enabled": true,
    "prompt": "Prompt específico para la IA",
    "threshold": 0.8,
    "expectedConditions": ["condición1", "condición2"],
    "autoFillField": "id-del-campo-a-llenar"
  },
  
  // CONDITIONAL BRANCHING
  "branches": [
    {
      "condition": "value == 'no'",
      "targetStepId": "paso-alternativo"
    }
  ],
  
  // LOGIC RULES & ESCALATION
  "logicRules": [
    {
      "id": "rule_id",
      "condition": "value > 5",
      "severity": "CRITICAL | HIGH | WARNING | PASS",
      "message": "Mensaje descriptivo con {value}",
      
      // REMEDIATION PROTOCOL
      "remediationProtocol": {
        "enabled": true,
        "type": "GUIDED_SELF_FIX",
        "maxAttempts": 2,
        "timeoutMinutes": 20,
        "steps": [
          {
            "instruction": "Paso a seguir",
            "waitSeconds": 300,
            "verification": {
              "type": "thermometer_ocr | ai_photo_verification",
              "targetCondition": "value <= 4"
            }
          }
        ]
      },
      
      // ESCALATION CHAIN
      "escalationChain": [
        {
          "level": 1,
          "triggerAfterMinutes": 0,
          "triggerCondition": "immediate | remediation_failed | no_response",
          "notifyRoles": ["GERENTE", "CHEF"],
          "channel": "whatsapp | call_priority | email",
          "message": "Mensaje con {placeholders}",
          "includeData": {
            "branch_address": true,
            "equipment_id": "REF-01"
          }
        },
        {
          "level": 2,
          "triggerAfterMinutes": 30,
          "triggerCondition": "remediation_failed",
          "notifyRoles": ["TECHNICAL_SERVICE"],
          "channel": "whatsapp",
          "message": "🔧 Soporte técnico requerido"
        },
        {
          "level": 3,
          "triggerAfterMinutes": 120,
          "triggerCondition": "no_technician_response",
          "notifyRoles": ["OWNER"],
          "channel": "call_priority",
          "message": "🆘 Escalación máxima"
        }
      ],
      
      // AUTOMATED ACTIONS
      "actions": [
        {
          "type": "AUTO_REMINDER",
          "delay": 30,
          "message": "Recordatorio automático"
        },
        {
          "type": "CREATE_MAINTENANCE_TICKET",
          "priority": "HIGH",
          "assignTo": "TECHNICAL_SERVICE"
        }
      ]
    }
  ]
}
```

## Completion Actions

```json
"completionActions": [
  {
    "type": "SEND_NOTIFICATION",
    "target": ["GERENTE"],
    "channel": "whatsapp",
    "message": "✅ Workflow completado"
  },
  {
    "type": "UPDATE_BRANCH_STATUS",
    "status": "OPEN | CLOSED",
    "timestamp": "completion_time"
  },
  {
    "type": "GENERATE_PDF_REPORT",
    "template": "report_template_name",
    "includePhotos": true,
    "sendTo": ["GERENTE", "OWNER"]
  },
  {
    "type": "TRIGGER_NEXT_WORKFLOW",
    "workflowId": "tpl-siguiente-workflow",
    "delay": 0
  }
]
```

## Placeholders Disponibles

- `{value}` - Valor del campo actual
- `{employee_name}` - Nombre del empleado
- `{completion_time}` - Hora de completación
- `{branch_name}` - Nombre de la sucursal
- `{ai_result.analysis}` - Análisis de IA
- `{ai_result.detectedIssues}` - Problemas detectados por IA
- `{ai_result.confidence}` - Nivel de confianza de IA

## Severidades

- **PASS**: Todo correcto, sin alertas
- **WARNING**: Advertencia, notificar pero no crítico
- **HIGH**: Prioridad alta, requiere atención
- **CRITICAL**: Crítico, requiere acción inmediata

## Canales de Notificación

- `whatsapp` - Mensaje de WhatsApp
- `call_priority` - Llamada telefónica prioritaria
- `email` - Correo electrónico
- `sms` - Mensaje de texto

## Tipos de Verificación AI

- `OCR` - Lectura de texto/números
- `OBJECT_DETECTION` - Detección de objetos
- `CLEANLINESS_CHECK` - Verificación de limpieza
- `UNIFORM_CHECK` - Verificación de uniformes
- `FOOD_SAFETY` - Seguridad alimentaria

## Roles Disponibles

- `EMPLOYEE` - Empleado general
- `CHEF` - Chef/Cocinero
- `GERENTE` - Gerente de sucursal
- `OWNER` - Dueño/Propietario
- `TECHNICAL_SERVICE` - Servicio técnico
- `SUPERVISOR` - Supervisor

## Ejemplo Completo: Control de Higiene Personal

Ver: `templates/control_calidad/control-higiene-personal-v2-enhanced.json`

Este template incluye:
- ✅ AI verification en fotos de manos, uniforme
- ✅ Branching condicional (si no usa guantes → protocolo)
- ✅ Escalation chains (3 niveles)
- ✅ Remediation protocols (auto-corrección guiada)
- ✅ GPS validation
- ✅ Automated actions al completar
