# Pulso HORECA - Plan de Implementación

**Fecha de Creación**: 17 de marzo de 2026  
**Basado en**: IMPLEMENTACION_ESTADO.md  
**Horizonte**: 8 semanas (MVP Funcional)  
**Objetivo**: Completar fases 1-4 para MVP funcional

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Objetivos del Plan](#objetivos-del-plan)
3. [Sprints y Cronograma](#sprints-y-cronograma)
4. [Plan Detallado por Sprint](#plan-detallado-por-sprint)
5. [Dependencias y Riesgos](#dependencias-y-riesgos)
6. [Criterios de Éxito](#criterios-de-éxito)

---

## 📊 Resumen Ejecutivo

### Estado Actual
- **Progreso General**: 60% completado
- **Fases Completas**: 1 (85%), 2 (75%), 3 (70%)
- **Fases en Progreso**: 4 (40%), 5 (30%), 6 (50%)
- **Fases Pendientes**: 7 (20%), 8 (0%)

### Objetivo del Plan
Alcanzar un **MVP funcional en 8 semanas** completando:
- ✅ Phase 1: Foundation (completar 15% restante)
- ✅ Phase 2: Core Business Logic (completar 25% restante)
- ✅ Phase 3: Workflow Engine (completar 30% restante)
- ✅ Phase 4: Compliance Intelligence (completar 60% restante)

---

## 🎯 Objetivos del Plan

### Objetivos Principales (P0)
1. **Compliance Intelligence completo** - Reportes NOM-251 y NOM-035 funcionales
2. **WhatsApp Integration completa** - Notificaciones y smartlinks operativos
3. **Inventario completo** - Gestión end-to-end de inventarios
4. **Seguridad básica** - Rate limiting y autenticación robusta

### Objetivos Secundarios (P1)
1. **Labor Management UI** - Gestión de turnos funcional
2. **Notificaciones multi-canal** - Email, WhatsApp, in-app
3. **Dashboard de analytics** - Métricas y reportes visuales

### Objetivos Terciarios (P2)
1. **Mejoras de UX** - Pulir interfaces existentes
2. **Documentación** - API y usuario final
3. **Testing** - Tests unitarios y E2E básicos

---

## 📅 Sprints y Cronograma

| Sprint | Fechas | Foco | Entregables Principales |
|--------|--------|------|------------------------|
| **Sprint 1** | Semana 1-2 | Compliance + WhatsApp | Reportes NOM-251, WhatsApp notifications |
| **Sprint 2** | Semana 3-4 | Inventario + Seguridad | Inventory completo, Rate limiting |
| **Sprint 3** | Semana 5-6 | Labor Management + Notificaciones | Shift UI, Notification system |
| **Sprint 4** | Semana 7-8 | Analytics + MVP Polish | Dashboard analytics, Bug fixes |

---

## 📝 Plan Detallado por Sprint

### Sprint 1: Compliance & WhatsApp (Semana 1-2)

#### 🎯 Objetivo: Sistema de compliance funcional y notificaciones WhatsApp operativas

---

#### **Tarea 1.1: Reportes NOM-251** 
**Prioridad**: P0 | **Estimado**: 3 días | **Asignado**: Backend + Frontend

**Subtareas**:
- [ ] 1.1.1 Definir estructura de reporte NOM-251 (COFEPRIS requirements)
- [ ] 1.1.2 Implementar generación PDF con `jspdf` y `jspdf-autotable`
- [ ] 1.1.3 Incluir workflows completados con evidencia
- [ ] 1.1.4 Agregar firmas digitales y timestamps
- [ ] 1.1.5 Calcular porcentajes de compliance automáticamente
- [ ] 1.1.6 Endpoint API: `POST /api/reports/nom-251`
- [ ] 1.1.7 UI: Vista previa de reporte antes de descargar
- [ ] 1.1.8 Testing: Verificar formato cumple requisitos COFEPRIS

**Archivos a crear/modificar**:
```
lib/services/compliance-report-service.ts  (modificar)
app/api/reports/nom-251/route.ts          (nuevo)
components/compliance/nom251-report.tsx   (nuevo)
```

**Criterios de Aceptación**:
- PDF generado con todos los campos requeridos por COFEPRIS
- Incluye lista de workflows completados en el período
- Muestra evidencias (fotos, firmas) incrustadas
- Calcula % de compliance por categoría
- Exportable y descargable

---

#### **Tarea 1.2: Reportes NOM-035**
**Prioridad**: P0 | **Estimado**: 3 días | **Asignado**: Backend + Frontend

**Subtareas**:
- [ ] 1.2.1 Definir estructura de reporte NOM-035 (riesgos psicosociales)
- [ ] 1.2.2 Implementar formato PDF específico
- [ ] 1.2.3 Incluir encuestas y evaluaciones de estrés laboral
- [ ] 1.2.4 Calcular niveles de riesgo por empleado
- [ ] 1.2.5 Generar recomendaciones automáticas
- [ ] 1.2.6 Endpoint API: `POST /api/reports/nom-035`
- [ ] 1.2.7 UI: Dashboard de riesgos psicosociales
- [ ] 1.2.8 Testing: Validar con requisitos STPS

**Archivos a crear/modificar**:
```
lib/services/compliance-report-service.ts  (modificar)
app/api/reports/nom-035/route.ts          (nuevo)
components/compliance/nom035-report.tsx   (nuevo)
components/compliance/psychosocial-dashboard.tsx (nuevo)
```

**Criterios de Aceptación**:
- Reporte formato STPS completo
- Evaluación de riesgos por empleado
- Historial de evaluaciones
- Recomendaciones basadas en resultados

---

#### **Tarea 1.3: WhatsApp Notifications**
**Prioridad**: P0 | **Estimado**: 4 días | **Asignado**: Backend

**Subtareas**:
- [ ] 1.3.1 Configurar WASENDER API completamente
- [ ] 1.3.2 Implementar webhook receiver `/api/whatsapp/webhook`
- [ ] 1.3.3 Crear templates de mensajes (asignaciones, recordatorios, alertas)
- [ ] 1.3.4 Sistema de colas para envío masivo (Upstash QStash)
- [ ] 1.3.5 Delivery tracking y retry logic
- [ ] 1.3.6 Opt-in/opt-out management
- [ ] 1.3.7 Rate limiting para evitar bloqueos de WhatsApp
- [ ] 1.3.8 Testing: Enviar mensajes reales a números de prueba

**Archivos a crear/modificar**:
```
lib/services/whatsapp-service.ts          (modificar)
lib/whatsapp/wasender-client.ts           (modificar)
app/api/whatsapp/webhook/route.ts         (nuevo)
lib/services/notification-dispatcher.ts   (nuevo)
```

**Criterios de Aceptación**:
- Mensajes se envían correctamente vía WASENDER
- Webhook procesa respuestas entrantes
- Templates personalizables por empresa
- Tracking de entrega y lectura
- Reintentos automáticos en caso de fallo

---

#### **Tarea 1.4: Smartlinks con AI Verification**
**Prioridad**: P0 | **Estimado**: 3 días | **Asignado**: Full-stack

**Subtareas**:
- [ ] 1.4.1 Generar smartlinks con token encriptado
- [ ] 1.4.2 Integrar AI verification en flujo de smartlink
- [ ] 1.4.3 Upload de fotos desde WhatsApp → AI → Resultado
- [ ] 1.4.4 Notificar resultado de verificación
- [ ] 1.4.5 Escalado automático si verificación falla
- [ ] 1.4.6 UI: Estado de verificaciones en dashboard
- [ ] 1.4.7 Testing: Flujo completo end-to-end

**Archivos a crear/modificar**:
```
lib/services/smart-link-service.ts        (modificar)
lib/services/ai-service.ts                (modificar)
app/workflows/verify-ai/route.ts          (nuevo)
components/workflow/ai-verification-status.tsx (nuevo)
```

**Criterios de Aceptación**:
- Smartlink contiene workflow ID y token válido
- Foto subida se envía a AI automáticamente
- Resultado de AI notifica al usuario
- Escalado触发 cuando verificación falla

---

#### **Tarea 1.5: Compliance Dashboard**
**Prioridad**: P1 | **Estimado**: 2 días | **Asignado**: Frontend

**Subtareas**:
- [ ] 1.5.1 Scorecards visuales por tipo de compliance
- [ ] 1.5.2 Deadline tracking (próximas auditorías)
- [ ] 1.5.3 Historical trends (gráficos de línea)
- [ ] 1.5.4 Alertas de no-compliance
- [ ] 1.5.5 Drill-down por sucursal/departamento
- [ ] 1.5.6 Export dashboard a PDF

**Archivos a crear/modificar**:
```
components/compliance/compliance-dashboard.tsx (nuevo)
app/dashboard/compliance/page.tsx         (nuevo)
app/api/analytics/compliance/trends/route.ts (nuevo)
```

**Criterios de Aceptación**:
- Visualización clara de compliance rate por categoría
- Lista de deadlines próximos (30 días)
- Gráfico de tendencias históricas
- Alertas visibles para no-compliance crítico

---

### Sprint 2: Inventario & Seguridad (Semana 3-4)

#### 🎯 Objetivo: Sistema de inventarios completo y seguridad reforzada

---

#### **Tarea 2.1: Receiving Workflows**
**Prioridad**: P0 | **Estimado**: 3 días | **Asignado**: Full-stack

**Subtareas**:
- [ ] 2.1.1 Crear workflow template para recepción de inventario
- [ ] 2.1.2 Escanear/ingresar items recibidos
- [ ] 2.1.3 Verificar cantidad vs orden de compra
- [ ] 2.1.4 Registrar batch numbers y fechas de expiración
- [ ] 2.1.5 Actualizar stock automáticamente
- [ ] 2.1.6 Generar reporte de recepción
- [ ] 2.1.7 UI: Interfaz de receiving móvil-friendly
- [ ] 2.1.8 Testing: Proceso completo de recepción

**Archivos a crear/modificar**:
```
lib/services/inventory-service.ts         (modificar)
app/api/inventory/receiving/route.ts      (nuevo)
components/inventory/receiving-workflow.tsx (nuevo)
components/inventory/receiving-form.tsx   (nuevo)
```

**Criterios de Aceptación**:
- Items escaneados/ingresados correctamente
- Compara con orden de compra (si existe)
- Crea batches con expiration dates
- Actualiza inventory en tiempo real
- Genera comprobante de recepción

---

#### **Tarea 2.2: Transferencias entre Sucursales**
**Prioridad**: P1 | **Estimado**: 3 días | **Asignado**: Full-stack

**Subtareas**:
- [ ] 2.2.1 Solicitar transferencia de origen
- [ ] 2.2.2 Aprobar transferencia (gerente)
- [ ] 2.2.3 Registrar envío
- [ ] 2.2.4 Confirmar recepción en destino
- [ ] 2.2.5 Actualizar stock en ambas sucursales
- [ ] 2.2.6 Tracking de transferencia en tránsito
- [ ] 2.2.7 UI: Lista de transferencias pendientes
- [ ] 2.2.8 Testing: Flujo completo de transferencia

**Archivos a crear/modificar**:
```
lib/services/inventory-service.ts         (modificar)
app/api/inventory/transfers/route.ts      (nuevo)
app/api/inventory/transfers/[id]/route.ts (nuevo)
components/inventory/transfer-request.tsx (nuevo)
components/inventory/transfer-list.tsx    (nuevo)
```

**Criterios de Aceptación**:
- Solicitud de transferencia creada
- Aprobación requerida antes de enviar
- Stock disminuye en origen al enviar
- Stock aumenta en destino al recibir
- Historial de transferencias disponible

---

#### **Tarea 2.3: Alerts de Stock Bajo**
**Prioridad**: P0 | **Estimado**: 2 días | **Asignado**: Backend + Frontend

**Subtareas**:
- [ ] 2.3.1 Configurar thresholds por item (minLevel)
- [ ] 2.3.2 Job diario para verificar stock
- [ ] 2.3.3 Generar alertas cuando stock < minLevel
- [ ] 2.3.4 Notificar vía WhatsApp/email a responsables
- [ ] 2.3.5 UI: Dashboard de alertas de stock
- [ ] 2.3.6 Sugerir cantidades de reorden
- [ ] 2.3.7 Testing: Verificar alertas se generan correctamente

**Archivos a crear/modificar**:
```
lib/services/inventory-service.ts         (modificar)
app/api/cron/stock-check/route.ts         (nuevo)
components/inventory/stock-alerts.tsx     (nuevo)
lib/services/notification-service.ts      (modificar)
```

**Criterios de Aceptación**:
- Alertas generadas automáticamente cuando stock < minLevel
- Notificaciones enviadas a responsables
- Dashboard muestra items con stock crítico
- Sugiere cantidad a ordenar basado en histórico

---

#### **Tarea 2.4: Supplier Management UI**
**Prioridad**: P1 | **Estimado**: 2 días | **Asignado**: Frontend

**Subtareas**:
- [ ] 2.4.1 CRUD de proveedores (UI)
- [ ] 2.4.2 Lista de proveedores con búsqueda
- [ ] 2.4.3 Detalle de proveedor (contactos, historial)
- [ ] 2.4.4 Asociar items a proveedores preferidos
- [ ] 2.4.5 Historial de compras por proveedor
- [ ] 2.4.6 Calificación de proveedores (opcional)
- [ ] 2.4.7 Testing: CRUD completo

**Archivos a crear/modificar**:
```
app/dashboard/inventory/suppliers/page.tsx (nuevo)
components/inventory/supplier-list.tsx    (nuevo)
components/inventory/supplier-form.tsx    (nuevo)
components/inventory/supplier-detail.tsx  (nuevo)
```

**Criterios de Aceptación**:
- Alta, baja, modificación de proveedores
- Búsqueda por nombre, RFC, email
- Detalle muestra información completa
- Historial de compras asociado

---

#### **Tarea 2.5: Rate Limiting**
**Prioridad**: P0 | **Estimado**: 2 días | **Asignado**: Backend

**Subtareas**:
- [ ] 2.5.1 Implementar middleware de rate limiting
- [ ] 2.5.2 Configurar límites: 100 req/min por usuario
- [ ] 2.5.3 Límites diferenciados por endpoint (API crítica vs normal)
- [ ] 2.5.4 Headers de rate limit (X-RateLimit-*)
- [ ] 2.5.5 Respuesta 429 con retry-after
- [ ] 2.5.6 Logging de intentos excedidos
- [ ] 2.5.7 Testing: Verificar límites funcionan

**Archivos a crear/modificar**:
```
middleware.ts                               (modificar)
lib/rate-limiter.ts                         (nuevo)
app/api/rate-limit-status/route.ts          (nuevo)
```

**Criterios de Aceptación**:
- 100 requests/minuto por usuario
- Endpoints críticos pueden tener límites diferentes
- Headers indican estado de rate limit
- Respuesta 429 cuando se excede límite
- Logs registran intentos excedidos

---

#### **Tarea 2.6: Refresh Token Rotation**
**Prioridad**: P1 | **Estimado**: 2 días | **Asignado**: Backend

**Subtareas**:
- [ ] 2.6.1 Implementar refresh token rotation en Better Auth
- [ ] 2.6.2 Configurar expiry: access token 15min, refresh token 7 días
- [ ] 2.6.3 Rotar refresh token en cada uso
- [ ] 2.6.4 Invalidar tokens comprometidos
- [ ] 2.6.5 Testing: Flujo de refresh completo

**Archivos a crear/modificar**:
```
lib/auth.ts                                 (modificar)
lib/auth-config.ts                          (nuevo)
```

**Criterios de Aceptación**:
- Access token expira en 15 minutos
- Refresh token permite obtener nuevo access token
- Refresh token se rota en cada uso
- Tokens antiguos se invalidan automáticamente

---

#### **Tarea 2.7: Barcode Scanning**
**Prioridad**: P2 | **Estimado**: 2 días | **Asignado**: Frontend

**Subtareas**:
- [ ] 2.7.1 Integrar librería de barcode scanning (react-qr-barcode-scanner)
- [ ] 2.7.2 UI de escaneo en móvil
- [ ] 2.7.3 Buscar item por barcode escaneado
- [ ] 2.7.4 Mostrar información del item escaneado
- [ ] 2.7.5 Testing: Escanear barcodes reales

**Archivos a crear/modificar**:
```
components/inventory/barcode-scanner.tsx    (nuevo)
components/inventory/scanner-modal.tsx      (nuevo)
```

**Criterios de Aceptación**:
- Cámara se activa para escanear
- Detecta barcode y busca item automáticamente
- Muestra información del item encontrado
- Funciona en dispositivos móviles

---

### Sprint 3: Labor Management & Notificaciones (Semana 5-6)

#### 🎯 Objetivo: Gestión de turnos funcional y sistema de notificaciones completo

---

#### **Tarea 3.1: Schedule Builder UI**
**Prioridad**: P1 | **Estimado**: 4 días | **Asignado**: Frontend

**Subtareas**:
- [ ] 3.1.1 Calendar view semanal/mensual
- [ ] 3.1.2 Drag-and-drop para asignar turnos
- [ ] 3.1.3 Configurar tipos de turno (MATUTINO, VESPERTINO, NOCTURNO, MIXTO)
- [ ] 3.1.4 Asignar empleados a turnos
- [ ] 3.1.5 Configurar horas de trabajo y descansos
- [ ] 3.1.6 Manejar festivos y vacaciones
- [ ] 3.1.7 Publicar schedule (notificar empleados)
- [ ] 3.1.8 Testing: Crear schedule completo

**Archivos a crear/modificar**:
```
app/dashboard/labor/schedule-builder/page.tsx (nuevo)
components/labor/schedule-calendar.tsx    (nuevo)
components/labor/shift-assignment.tsx     (nuevo)
components/labor/schedule-publisher.tsx   (nuevo)
```

**Criterios de Aceptación**:
- Vista de calendario semanal/mensual
- Asignación visual con drag-and-drop
- Configuración de tipos de turno
- Notificación automática al publicar

---

#### **Tarea 3.2: Geolocation Verification**
**Prioridad**: P1 | **Estimado**: 3 días | **Asignado**: Full-stack

**Subtareas**:
- [ ] 3.2.1 Obtener geolocalización en clock-in
- [ ] 3.2.2 Verificar ubicación dentro de radio permitido (sucursales)
- [ ] 3.2.3 Registrar coordenadas en shift session
- [ ] 3.2.4 Alertar si fuera de rango
- [ ] 3.2.5 Configurar radios por sucursal
- [ ] 3.2.6 UI: Mapa de ubicaciones de clock-in
- [ ] 3.2.7 Testing: Verificar geolocalización funciona

**Archivos a crear/modificar**:
```
lib/services/shift-service.ts             (modificar)
app/api/shifts/clock-in/route.ts          (modificar)
components/labor/geolocation-verify.tsx   (nuevo)
components/labor/clock-in-map.tsx         (nuevo)
```

**Criterios de Aceptación**:
- Obtiene coordenadas GPS al hacer clock-in
- Verifica si está dentro de radio de sucursal (ej. 100m)
- Registra ubicación en base de datos
- Alerta si empleado está fuera de rango permitido

---

#### **Tarea 3.3: Attendance Reports**
**Prioridad**: P1 | **Estimado**: 2 días | **Asignado**: Full-stack

**Subtareas**:
- [ ] 3.3.1 Reporte de asistencia por empleado
- [ ] 3.3.2 Reporte de asistencia por sucursal
- [ ] 3.3.3 Calcular horas trabajadas, breaks, overtime
- [ ] 3.3.4 Exportar a Excel/PDF
- [ ] 3.3.5 Filtrar por fecha, departamento, empleado
- [ ] 3.3.6 UI: Dashboard de asistencia
- [ ] 3.3.7 Testing: Generar reportes correctos

**Archivos a crear/modificar**:
```
app/api/reports/attendance/route.ts       (nuevo)
components/labor/attendance-report.tsx    (nuevo)
components/labor/attendance-dashboard.tsx (nuevo)
```

**Criterios de Aceptación**:
- Reporte muestra horas trabajadas por empleado
- Incluye breaks y overtime
- Exportable a Excel y PDF
- Filtros por fecha, sucursal, empleado

---

#### **Tarea 3.4: Notification Preferences UI**
**Prioridad**: P1 | **Estimado**: 2 días | **Asignado**: Frontend

**Subtareas**:
- [ ] 3.4.1 UI de preferencias de notificación
- [ ] 3.4.2 Toggle por canal (WhatsApp, Email, In-app)
- [ ] 3.4.3 Toggle por tipo de evento (asignaciones, alertas, recordatorios)
- [ ] 3.4.4 Guardar preferencias en `notification_preferences`
- [ ] 3.4.5 Testing: Preferencias se guardan correctamente

**Archivos a crear/modificar**:
```
app/dashboard/profile/notifications/page.tsx (nuevo)
components/profile/notification-preferences.tsx (nuevo)
```

**Criterios de Aceptación**:
- Usuario puede activar/desactivar canales
- Usuario puede seleccionar tipos de notificación
- Preferencias se guardan en base de datos
- Sistema respeta preferencias al enviar notificaciones

---

#### **Tarea 3.5: Notification Dispatch System**
**Prioridad**: P0 | **Estimado**: 3 días | **Asignado**: Backend

**Subtareas**:
- [ ] 3.5.1 Sistema de colas para notificaciones (Upstash QStash)
- [ ] 3.5.2 Router de notificaciones (WhatsApp vs Email vs In-app)
- [ ] 3.5.3 Templates de notificaciones personalizables
- [ ] 3.5.4 Batch processing para notificaciones masivas
- [ ] 3.5.5 Retry logic con exponential backoff
- [ ] 3.5.6 Tracking de entrega y fallos
- [ ] 3.5.7 Testing: Enviar notificaciones por todos los canales

**Archivos a crear/modificar**:
```
lib/services/notification-dispatcher.ts   (nuevo)
lib/notifications/notification-router.ts  (nuevo)
lib/notifications/notification-queue.ts   (nuevo)
app/api/notifications/dispatch/route.ts   (nuevo)
```

**Criterios de Aceptación**:
- Notificaciones se encolan y procesan asíncronamente
- Router decide canal basado en preferencias
- Templates permiten personalización
- Reintentos automáticos en caso de fallo
- Tracking de entrega disponible

---

#### **Tarea 3.6: Overtime Calculations**
**Prioridad**: P1 | **Estimado**: 2 días | **Asignado**: Backend

**Subtareas**:
- [ ] 3.6.1 Definir reglas de overtime (ley federal de trabajo)
- [ ] 3.6.2 Calcular horas extras automáticamente
- [ ] 3.6.3 Diferenciar overtime diurno/nocturno/doble
- [ ] 3.6.4 Registrar overtime en shift session
- [ ] 3.6.5 Reporte de overtime por empleado/período
- [ ] 3.6.6 UI: Dashboard de overtime
- [ ] 3.6.7 Testing: Cálculos correctos

**Archivos a crear/modificar**:
```
lib/services/shift-service.ts             (modificar)
lib/services/labor-calculator.ts          (nuevo)
app/api/reports/overtime/route.ts         (nuevo)
components/labor/overtime-dashboard.tsx   (nuevo)
```

**Criterios de Aceptación**:
- Calcula horas extras basado en horas trabajadas
- Aplica reglas de ley federal (2x, 3x)
- Registra overtime en base de datos
- Reporte muestra overtime por empleado y período

---

### Sprint 4: Analytics & MVP Polish (Semana 7-8)

#### 🎯 Objetivo: Dashboard de analytics y preparación para MVP

---

#### **Tarea 4.1: KPI Definitions Schema**
**Prioridad**: P1 | **Estimado**: 2 días | **Asignado**: Backend

**Subtareas**:
- [ ] 4.1.1 Crear tabla `kpi_definitions`
- [ ] 4.1.2 Campos: name, formula, metricType, target, thresholds
- [ ] 4.1.3 Campos: companyId, branchId (multi-tenant)
- [ ] 4.1.4 Migración de base de datos
- [ ] 4.1.5 Seed data con KPIs predefinidos
- [ ] 4.1.6 Testing: CRUD de KPIs funciona

**Archivos a crear/modificar**:
```
lib/db/schema.ts                            (modificar)
drizzle/migrations/0002_*.sql               (nuevo)
lib/services/kpi-service.ts                 (nuevo)
```

**Criterios de Aceptación**:
- Tabla `kpi_definitions` creada con todos los campos
- Migración ejecutada correctamente
- KPIs predefinidos para HORECA (compliance rate, avg workflow time, etc.)
- CRUD funcional vía API

---

#### **Tarea 4.2: KPI Builder UI**
**Prioridad**: P1 | **Estimado**: 3 días | **Asignado**: Frontend

**Subtareas**:
- [ ] 4.2.1 UI para crear KPI personalizado
- [ ] 4.2.2 Definir fórmula (editor de expresiones)
- [ ] 4.2.3 Configurar tipo de métrica (percentage, count, average)
- [ ] 4.2.4 Establecer targets y thresholds
- [ ] 4.2.5 Configurar frecuencia de cálculo
- [ ] 4.2.6 Preview de KPI antes de guardar
- [ ] 4.2.7 Testing: Crear KPI completo

**Archivos a crear/modificar**:
```
app/dashboard/analytics/kpi-builder/page.tsx (nuevo)
components/analytics/kpi-form.tsx         (nuevo)
components/analytics/kpi-formula-editor.tsx (nuevo)
```

**Criterios de Aceptación**:
- Usuario puede crear KPI personalizado
- Fórmula se valida antes de guardar
- Targets y thresholds configurables
- Preview muestra cómo se verá el KPI

---

#### **Tarea 4.3: KPI Dashboard**
**Prioridad**: P1 | **Estimado**: 3 días | **Asignado**: Frontend

**Subtareas**:
- [ ] 4.3.1 Dashboard con múltiples KPIs en tiempo real
- [ ] 4.3.2 Gráficos de línea para tendencias
- [ ] 4.3.3 Gráficos de barra para comparaciones
- [ ] 4.3.4 Drill-down por sucursal/departamento
- [ ] 4.3.5 Filtros por período (día, semana, mes)
- [ ] 4.3.6 Export dashboard a PDF
- [ ] 4.3.7 Testing: Dashboard carga correctamente

**Archivos a crear/modificar**:
```
app/dashboard/analytics/page.tsx          (nuevo)
components/analytics/kpi-dashboard.tsx    (nuevo)
components/analytics/kpi-card.tsx         (nuevo)
components/analytics/kpi-chart.tsx        (nuevo)
```

**Criterios de Aceptación**:
- Múltiples KPIs visibles en dashboard
- Gráficos muestran tendencias históricas
- Drill-down permite ver detalle por sucursal
- Exportable a PDF

---

#### **Tarea 4.4: KPI Alerts**
**Prioridad**: P1 | **Estimado**: 2 días | **Asignado**: Full-stack

**Subtareas**:
- [ ] 4.4.1 Configurar thresholds de alerta por KPI
- [ ] 4.4.2 Monitoreo continuo de KPIs
- [ ] 4.4.3 Trigger alertas cuando KPI cruza threshold
- [ ] 4.4.4 Notificar a responsables
- [ ] 4.4.5 UI: Lista de alertas activas
- [ ] 4.4.6 Acknowledgment de alertas
- [ ] 4.4.7 Testing: Alertas se disparan correctamente

**Archivos a crear/modificar**:
```
lib/services/kpi-alert-service.ts         (nuevo)
app/api/kpi/alerts/route.ts               (nuevo)
components/analytics/kpi-alerts.tsx       (nuevo)
```

**Criterios de Aceptación**:
- Alertas configuradas por threshold
- Alertas se disparan automáticamente
- Notificaciones enviadas a responsables
- UI muestra alertas activas y permite acknowledge

---

#### **Tarea 4.5: Bug Fixes y Polish**
**Prioridad**: P0 | **Estimado**: 4 días | **Asignado**: Todo el equipo

**Subtareas**:
- [ ] 4.5.1 Revisar issues reportados en GitHub
- [ ] 4.5.2 Fix bugs críticos (P0)
- [ ] 4.5.3 Fix bugs menores (P1, P2)
- [ ] 4.5.4 Mejorar UX en flujos problemáticos
- [ ] 4.5.5 Optimizar performance (queries lentas)
- [ ] 4.5.6 Testing: Regression testing general

**Archivos a crear/modificar**:
```
Varios según bugs encontrados
```

**Criterios de Aceptación**:
- Todos los bugs P0 resueltos
- Majority de bugs P1 resueltos
- UX mejorado en flujos críticos
- Performance dentro de límites aceptables (<2s response time)

---

#### **Tarea 4.6: Documentación**
**Prioridad**: P1 | **Estimado**: 2 días | **Asignado**: Technical Writer + Devs

**Subtareas**:
- [ ] 4.6.1 Documentar API endpoints (OpenAPI/Swagger)
- [ ] 4.6.2 Guía de usuario final
- [ ] 4.6.3 Guía de administración
- [ ] 4.6.4 README actualizado
- [ ] 4.6.5 CHANGELOG del MVP
- [ ] 4.6.6 Testing: Revisar documentación con usuarios reales

**Archivos a crear/modificar**:
```
docs/api-reference.md                     (nuevo)
docs/user-guide.md                        (nuevo)
docs/admin-guide.md                       (nuevo)
README.md                                 (modificar)
CHANGELOG.md                              (nuevo)
```

**Criterios de Aceptación**:
- API documentada con ejemplos
- Guía de usuario cubre todos los flujos principales
- README actualizado con setup instructions
- CHANGELOG lista todas las features del MVP

---

#### **Tarea 4.7: Testing E2E**
**Prioridad**: P1 | **Estimado**: 3 días | **Asignado**: QA

**Subtareas**:
- [ ] 4.7.1 Configurar Playwright para E2E testing
- [ ] 4.7.2 Tests para flujos críticos (auth, workflows, compliance)
- [ ] 4.7.3 Tests para API endpoints principales
- [ ] 4.7.4 CI/CD pipeline para tests automáticos
- [ ] 4.7.5 Coverage report (>70% critical paths)
- [ ] 4.7.6 Testing: Todos los tests pasan

**Archivos a crear/modificar**:
```
tests/e2e/auth.spec.ts                    (nuevo)
tests/e2e/workflows.spec.ts               (nuevo)
tests/e2e/compliance.spec.ts              (nuevo)
tests/api/users.spec.ts                   (nuevo)
.github/workflows/e2e-tests.yml           (nuevo)
```

**Criterios de Aceptación**:
- Tests E2E cubren flujos críticos
- Tests de API cubren endpoints principales
- Pipeline ejecuta tests en cada PR
- Coverage >70% en paths críticos

---

#### **Tarea 4.8: MVP Demo Data**
**Prioridad**: P2 | **Estimado**: 1 día | **Asignado**: Backend

**Subtareas**:
- [ ] 4.8.1 Script de seed data para demo
- [ ] 4.8.2 Empresas de ejemplo
- [ ] 4.8.3 Workflows preconfigurados
- [ ] 4.8.4 Datos históricos para analytics
- [ ] 4.8.5 Testing: Demo data carga correctamente

**Archivos a crear/modificar**:
```
scripts/seed-demo-data.ts                 (nuevo)
drizzle/seed-data.sql                     (nuevo)
```

**Criterios de Aceptación**:
- Script genera datos de demo completos
- Incluye empresas, usuarios, workflows
- Datos históricos para mostrar analytics
- Fácil de ejecutar en ambiente de demo

---

## 🔗 Dependencias y Riesgos

### Dependencias Críticas

| Dependencia | Impacto | Mitigación |
|-------------|---------|------------|
| **WASENDER API** | Alto - Sin WhatsApp no hay notificaciones | Tener fallback a email/SMS, contactar soporte Wasender |
| **OpenAI/Moondream** | Alto - AI verification no funciona | Implementar modo manual, tener múltiples proveedores |
| **Neon Database** | Crítico - Sin DB no hay sistema | Configurar backup local, tener connection string alternativo |
| **Upstash QStash** | Medio - Notificaciones asíncronas limitadas | Implementar cola simple en DB como fallback |

### Riesgos del Proyecto

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Retraso en Sprint 1** | Media | Alto | Priorizar NOM-251 sobre NOM-035 si es necesario |
| **WASENDER API no funciona** | Baja | Alto | Plan B: Twilio WhatsApp API o solo email |
| **Cambios de último minuto** | Alta | Medio | Congelar scope al inicio de cada sprint |
| **Performance issues** | Media | Medio | Profiling semanal, optimizar queries desde inicio |
| **Falta de recursos** | Media | Alto | Enfocar en P0 primero, P1 y P2 pueden esperar |

---

## ✅ Criterios de Éxito del MVP

### Funcionales (P0)
- [ ] **Compliance**: Reportes NOM-251 y NOM-035 generados correctamente
- [ ] **WhatsApp**: Notificaciones y smartlinks funcionales
- [ ] **Inventario**: Receiving, transferencias y alerts operativos
- [ ] **Seguridad**: Rate limiting y refresh token rotation activos
- [ ] **Workflows**: Builder y execution 100% funcionales
- [ ] **Auth**: Login, registro y onboarding sin bugs críticos

### No Funcionales (P0)
- [ ] **Performance**: <2s response time para 95% de requests
- [ ] **Disponibilidad**: 99% uptime durante testing
- [ ] **Seguridad**: No hay vulnerabilidades críticas en scan
- [ ] **Multi-tenant**: Aislamiento de datos verificado

### Experiencia de Usuario (P1)
- [ ] **UX**: Flujos principales completados en <3 clicks
- [ ] **Mobile**: Responsive en móviles (320px - 768px)
- [ ] **Accesibilidad**: WCAG 2.1 Level AA básico cumplido
- [ ] **Documentación**: Guías de usuario disponibles

### Testing (P1)
- [ ] **Unit Tests**: >70% coverage en servicios críticos
- [ ] **E2E Tests**: 10+ flujos críticos testeados
- [ ] **Bug Threshold**: 0 bugs P0, <5 bugs P1 abiertos

---

## 📊 Métricas de Progreso

### Tracking Semanal

| Sprint | Story Points | Completado | En Progreso | Pendiente | Bloqueos |
|--------|--------------|------------|-------------|-----------|----------|
| **Sprint 1** | 45 pts | - | - | - | - |
| **Sprint 2** | 40 pts | - | - | - | - |
| **Sprint 3** | 35 pts | - | - | - | - |
| **Sprint 4** | 30 pts | - | - | - | - |

### Definición de Done (DoD)

Una tarea se considera **Done** cuando:
1. ✅ Código implementado y funcional
2. ✅ Tests unitarios escritos y pasando
3. ✅ Code review aprobado por otro desarrollador
4. ✅ Integrado en rama principal sin conflictos
5. ✅ Documentación actualizada (si aplica)
6. ✅ QA testing básico pasado

---

## 🛠️ Recursos Necesarios

### Equipo Recomendado
- **1 Tech Lead / Arquitecto** (tiempo completo)
- **2 Backend Developers** (tiempo completo)
- **2 Frontend Developers** (tiempo completo)
- **1 QA Engineer** (50% tiempo)
- **1 Product Owner** (25% tiempo)

### Infraestructura
- **Desarrollo**: Ambientes dev, staging, production
- **CI/CD**: GitHub Actions o Vercel
- **Monitoreo**: Sentry, LogRocket, o similar
- **Base de Datos**: Neon (production), local (dev)

### Herramientas
- **Gestión de Proyecto**: GitHub Projects, Jira, o Linear
- **Comunicación**: Slack, Discord
- **Documentación**: Notion, Confluence
- **Design**: Figma (si hay cambios de UI)

---

## 📝 Notas Adicionales

### Priorización
- **P0 (Crítico)**: Debe estar en MVP, bloquea release
- **P1 (Alto)**: Importante para MVP, puede tener workaround manual
- **P2 (Medio)**: Nice to have, puede postergarse para post-MVP

### Scope Creep
- Cualquier feature nueva debe ser aprobada por Product Owner
- Features nuevas van al backlog, no al sprint actual
- Re-evaluar prioridad en sprint planning siguiente

### Comunicación
- **Daily Standup**: 15 min, mismo horario cada día
- **Sprint Planning**: Primer día de cada sprint (2 horas)
- **Sprint Review**: Último día de cada sprint (2 horas)
- **Retrospective**: Después del review (1 hora)

---

## 🎯 Próximos Pasos Inmediatos

### Antes de Sprint 1 (Esta semana)
1. [ ] Revisar y aprobar este plan con stakeholders
2. [ ] Configurar GitHub Projects con todas las tareas
3. [ ] Asignar desarrolladores a cada sprint
4. [ ] Verificar acceso a WASENDER API y otros servicios externos
5. [ ] Preparar ambiente de desarrollo y staging

### Día 1 de Sprint 1
1. [ ] Sprint Planning meeting (2 horas)
2. [ ] Desarrolladores toman primeras tareas
3. [ ] Configurar branch de feature para cada tarea
4. [ ] Iniciar desarrollo de Tarea 1.1 (NOM-251)

---

**Documento creado**: 17 de marzo de 2026  
**Próxima revisión**: Inicio de Sprint 1  
**Responsable de actualización**: Tech Lead / Project Manager

---

## 📎 Apéndices

### A. Estimación de Story Points

| Complejidad | Puntos | Ejemplo |
|-------------|--------|---------|
| **Simple** | 1-2 pts | Fix bug menor, cambio de texto |
| **Medium** | 3-5 pts | Feature nueva con complejidad media |
| **Complex** | 8-13 pts | Feature grande con múltiples dependencias |
| **Epic** | 20+ pts | Múltiples sprints, requiere descomposición |

### B. Glosario

| Término | Definición |
|---------|------------|
| **MVP** | Minimum Viable Product - versión mínima funcional |
| **P0/P1/P2** | Prioridad: Crítico, Alto, Medio |
| **Story Points** | Unidad de estimación de esfuerzo |
| **Sprint** | Iteración de desarrollo (2 semanas) |
| **DoD** | Definition of Done - criterios para completar tarea |

### C. Enlaces de Referencia

- [PRD Original](./pulso.md)
- [Estado de Implementación](./IMPLEMENTACION_ESTADO.md)
- [Schema de Base de Datos](./lib/db/schema.ts)
- [Documentación de API](./docs/api-reference.md) (por crear)

---

*Fin del Plan de Implementación*
