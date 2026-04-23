# Plan de Implementación - Features Pendientes

**Fecha de Creación:** 5 de abril de 2026  
**Última Actualización:** 5 de abril de 2026  
**Estado:** En Progreso

---

## 📊 Resumen de Implementación

### ✅ Completado (3 features)

| Feature | Estado | Archivos Creados/Modificados |
|---------|--------|------------------------------|
| **US-WF-002**: Workflow Executor | ✅ Completo | `components/workflow/workflow-executor.tsx`, `app/api/ai/verify/route.ts`, `app/api/upload/route.ts`, `app/dashboard/workflows/execute/[id]/page.tsx` |
| **US-WF-003**: Workflow Review | ✅ Completo | `components/workflow/workflow-review.tsx`, `app/dashboard/workflows/review/[id]/page.tsx` |
| **US-INV-002**: Stock Alerts + WhatsApp | ✅ Completo | `lib/db/schema.ts` (inventoryAlerts table), `app/api/inventory/alerts/history/[id]/route.ts`, `app/api/cron/stock-check/route.ts` (updated), `lib/services/stock-alert-service.ts` (updated), `lib/services/notification-dispatcher.ts` (updated), `app/dashboard/inventory/alerts/page.tsx` |

### 🔄 Pendiente (9 features)

| Prioridad | Feature | Complejidad Estimada |
|-----------|---------|---------------------|
| **ALTA** | US-INV-003: Batch/FIFO UI | Media |
| **ALTA** | US-WA-002: WhatsApp Workflow Execution | Alta |
| **ALTA** | US-LAB-005: Document Upload R2 | Media |
| **MEDIA** | US-WF-004: Drag-and-Drop Builder | Media |
| **MEDIA** | US-REP-001: Analytics Auto-Refresh + PDF | Baja |
| **MEDIA** | US-REP-002: LFT Violations + Export | Media |
| **BAJA** | US-LAB-002: Break Reminders | Baja |
| **BAJA** | US-LAB-003: Calendar PDF + LFT Validation | Baja |
| **BAJA** | US-LAB-004: Overtime Approval | Baja |

---

## 📋 Features Detalladas

---

### 1. US-INV-003: Batch/FIFO UI

**Prioridad:** ALTA  
**Complejidad:** Media  
**Estado:** ❌ No Implementado

#### Descripción
Completar la gestión de lotes y FIFO con UI de selector de lote visual, reporte de próximos vencimientos como pantalla dedicada, y registro de mermas por caducidad.

#### Lo que Existe
- ✅ Lógica FIFO en `stock-manager.tsx`
- ✅ Tabla `inventoryBatches` con campos: `lotNumber`, `expirationDate`, `currentQuantity`
- ✅ API `/api/inventory/low-stock` funciona
- ✅ Cron job `/api/cron/stock-check` verifica stock

#### Lo que Falta
1. **UI de Selector de Lote Visual**
   - Componente para seleccionar lote al despachar/usar productos
   - Visualización de lotes ordenados por fecha de vencimiento (FIFO)
   - Indicador visual de lotes próximos a vencer

2. **Reporte de Próximos Vencimientos**
   - Página dedicada `/dashboard/inventory/expirations`
   - Filtros por rango de fechas (7, 14, 30 días)
   - Agrupación por sucursal
   - Exportar a CSV/Excel

3. **Registro de Mermas por Caducidad**
   - Formulario para registrar productos vencidos
   - Cálculo de pérdida económica
   - API `/api/inventory/waste` para crear registros
   - Tabla `inventoryWaste` (nueva)

#### Archivos a Crear/Modificar

**Nuevos Archivos:**
```
app/dashboard/inventory/expirations/page.tsx
app/api/inventory/expirations/route.ts
app/api/inventory/waste/route.ts
components/inventory/lot-selector.tsx
components/inventory/expiration-report.tsx
components/inventory/waste-form.tsx
```

**Archivos a Modificar:**
```
lib/db/schema.ts - Agregar tabla inventoryWaste
components/inventory/stock-manager.tsx - Integrar lot selector
```

#### Schema Database (Nuevo)
```sql
CREATE TABLE inventory_waste (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    batch_id UUID REFERENCES inventory_batches(id),
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    
    quantity INTEGER NOT NULL,
    unit TEXT NOT NULL,
    reason TEXT NOT NULL, -- 'EXPIRED', 'DAMAGED', 'QUALITY'
    cost_per_unit DECIMAL(10,2),
    total_loss DECIMAL(10,2),
    
    recorded_by TEXT NOT NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_waste_company ON inventory_waste(company_id);
CREATE INDEX idx_inventory_waste_date ON inventory_waste(recorded_at DESC);
```

#### Componentes Clave

**LotSelector (`components/inventory/lot-selector.tsx`):**
```tsx
interface LotSelectorProps {
    itemId: string;
    branchId: string;
    quantity: number;
    onSelect: (batchId: string, quantity: number) => void;
}

// Mostrar lotes ordenados por expirationDate (FIFO)
// Resaltar lotes próximos a vencer (< 7 días)
// Deshabilitar lotes vencidos
```

**ExpirationReport (`components/inventory/expiration-report.tsx`):**
```tsx
interface ExpirationReportProps {
    branchId?: string;
    daysAhead: number; // 7, 14, 30
}

// Tabla con: Producto, Lote, Cantidad, Vencimiento, Días Restantes
// Filtros por rango de fechas y sucursal
// Botón exportar CSV
```

#### API Endpoints

**GET /api/inventory/expirations**
```typescript
Query params:
- branchId: string (optional)
- daysAhead: number (default: 7)
- includeExpired: boolean (default: false)

Response:
{
  items: Array<{
    itemId: string;
    itemName: string;
    batchId: string;
    lotNumber: string;
    currentQuantity: number;
    expirationDate: Date;
    daysUntilExpiration: number;
    branchName: string;
  }>;
  summary: {
    totalItems: number;
    expiringSoon: number;
    alreadyExpired: number;
    estimatedLoss: number;
  }
}
```

**POST /api/inventory/waste**
```typescript
Body:
{
  branchId: string;
  batchId: string;
  itemId: string;
  quantity: number;
  unit: string;
  reason: 'EXPIRED' | 'DAMAGED' | 'QUALITY';
  notes?: string;
}

Response:
{
  success: boolean;
  waste: InventoryWaste;
  updatedStock: number;
}
```

---

### 2. US-WA-002: WhatsApp Chat-Based Workflow Execution

**Prioridad:** ALTA  
**Complejidad:** Alta  
**Estado:** 🟡 Parcial (Webhook existe, falta flujo conversacional)

#### Descripción
Implementar flujo conversacional guiado paso a paso donde el bot solicita evidencia por chat, en lugar de redirigir a enlace web.

#### Lo que Existe
- ✅ Webhook `/api/whatsapp/webhook` recibe mensajes
- ✅ Command parser reconoce comandos laborales
- ✅ Labor handler procesa clock in/out, breaks
- ✅ `/api/workflows/public/[token]` para ejecución web
- ✅ `whatsapp-sessions` table

#### Lo que Falta
1. **Flujo Conversacional de Workflows**
   - Estado de conversación persistente (qué workflow, qué paso)
   - Bot solicitar evidencia paso a paso por chat
   - Procesar fotos recibidas y pasarlas a verificación AI
   - Navegación (siguiente paso, anterior, saltar)

2. **Gestión de Estado de Conversación**
   - Tabla `whatsappConversationStates`
   - Tracking: workflowInstanceId, currentStep, pendingEvidence
   - Timeout/expiración de sesiones

3. **Procesamiento de Evidencia por WhatsApp**
   - Recibir imágenes del webhook
   - Subir a storage automáticamente
   - Ejecutar verificación AI
   - Responder con resultado

#### Archivos a Crear/Modificar

**Nuevos Archivos:**
```
app/api/whatsapp/webhook/route.ts (modificar existente)
lib/whatsapp/workflow-conversation-handler.ts
lib/whatsapp/workflow-state-manager.ts
lib/whatsapp/evidence-processor.ts
lib/db/schema.ts - Agregar tabla whatsappConversationStates
```

**Archivos a Modificar:**
```
app/api/whatsapp/webhook/route.ts - Agregar manejo de workflows
lib/whatsapp/message-formatter.ts - Agregar templates de workflows
```

#### Schema Database (Nuevo)
```sql
CREATE TABLE whatsapp_conversation_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_phone TEXT NOT NULL,
    user_id TEXT REFERENCES users(id),
    
    -- Workflow context
    workflow_instance_id TEXT REFERENCES workflow_instances(id),
    current_step_id TEXT,
    step_index INTEGER,
    
    -- State
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, WAITING_EVIDENCE, COMPLETED, TIMEOUT
    last_message_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP,
    
    -- Metadata
    context JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_conv_user ON whatsapp_conversation_states(user_phone);
CREATE INDEX idx_whatsapp_conv_status ON whatsapp_conversation_states(status);
CREATE INDEX idx_whatsapp_conv_expires ON whatsapp_conversation_states(expires_at);
```

#### Flujo de Conversación

```
Usuario: "iniciar limpieza cocina"
Bot: "Encontré el workflow 'Limpieza de Cocina' con 5 pasos.
      ¿Deseas iniciarlo? (Sí/No)"

Usuario: "Sí"
Bot: "✅ Workflow iniciado.
      
      Paso 1 de 5: Limpiar superficie de trabajo
      Por favor envía una foto de la superficie limpia."

[Usuario envía foto]
Bot: "📸 Foto recibida. Analizando...
      
      ✅ Verificación AI: Aprobada (95% confianza)
      La superficie se ve limpia y sin residuos.
      
      Paso 2 de 5: Desinfectar utensilios
      Por favor envía una foto de los utensilios desinfectados."

... (continúa paso a paso)

Bot: "🎉 ¡Workflow completado!
      Puntuación: 100%
      Todos los pasos fueron verificados exitosamente."
```

#### Handler Principal (`lib/whatsapp/workflow-conversation-handler.ts`)
```typescript
export class WorkflowConversationHandler {
    async handleMessage(phone: string, message: string, mediaUrl?: string) {
        // 1. Get or create conversation state
        const state = await StateManager.getState(phone);
        
        // 2. If no active workflow, try to match intent
        if (!state.workflowInstanceId) {
            return await this.handleWorkflowSelection(phone, message);
        }
        
        // 3. If waiting for evidence and media received
        if (state.status === 'WAITING_EVIDENCE' && mediaUrl) {
            return await this.handleEvidenceSubmission(phone, state, mediaUrl);
        }
        
        // 4. Handle navigation commands
        if (message.toLowerCase() === 'siguiente' || message.toLowerCase() === 'next') {
            return await this.advanceStep(phone, state);
        }
        
        // 5. Default: prompt for expected input
        return this.promptForExpectedInput(state);
    }
}
```

#### State Manager (`lib/whatsapp/workflow-state-manager.ts`)
```typescript
export class ConversationStateManager {
    async getState(phone: string): Promise<ConversationState | null> {
        // Query whatsapp_conversation_states
        // Check if expired (expires_at < NOW())
        // Return active state or null
    }
    
    async createState(phone: string, workflowInstanceId: string): Promise<ConversationState> {
        // Create new state
        // Set expires_at to 2 hours from now
        // Return created state
    }
    
    async updateState(phone: string, updates: Partial<ConversationState>): Promise<void> {
        // Update current step, status, context
        // Refresh expires_at
    }
    
    async expireState(phone: string): Promise<void> {
        // Set status = 'TIMEOUT'
    }
}
```

#### Evidence Processor (`lib/whatsapp/evidence-processor.ts`)
```typescript
export class EvidenceProcessor {
    async processEvidence(phone: string, state: ConversationState, mediaUrl: string) {
        // 1. Upload media to storage
        const uploadedUrl = await uploadToStorage(mediaUrl);
        
        // 2. Update step with evidence
        const result = await WorkflowExecutionService.updateStep(
            state.workflowInstanceId,
            state.currentStepId,
            {
                evidenceUrl: uploadedUrl,
                status: 'COMPLETED'
            }
        );
        
        // 3. Get AI verification result
        const aiResult = result.step.aiAnalysis;
        
        // 4. Format response message
        return this.formatVerificationMessage(aiResult);
    }
}
```

#### Message Templates (`lib/whatsapp/message-formatter.ts`)
```typescript
// Agregar al objeto notificationTemplates
workflow_step_prompt: {
    whatsappTemplate: "📋 *Paso {stepIndex} de {totalSteps}*\n\n{stepTitle}\n\n{stepDescription}\n\nPor favor envía {expectedInput}.",
    channels: ["whatsapp"]
},
workflow_evidence_received: {
    whatsappTemplate: "{verificationIcon} *Verificación AI*\n\nConfianza: {confidence}%\nResultado: {reason}\n\n{nextStepPrompt}",
    channels: ["whatsapp"]
},
workflow_completed: {
    whatsappTemplate: "🎉 *¡Workflow Completido!*\n\nWorkflow: {workflowName}\nPuntuación: {score}%\nPasos Completados: {completedSteps}/{totalSteps}\n\n¡Excelente trabajo!",
    channels: ["whatsapp"]
}
```

---

### 3. US-LAB-005: Real Document Upload to R2/Storage

**Prioridad:** ALTA  
**Complejidad:** Media  
**Estado:** 🟡 Parcial (UI existe, upload es stub)

#### Descripción
Implementar subida real de documentos laborales a Cloudflare R2 o storage, con indicadores de documentos faltantes y alertas de vencimiento.

#### Lo que Existe
- ✅ Página `/dashboard/labor/documents` existe
- ✅ API `/api/documents` existe
- ✅ UI de lista de documentos requeridos
- ✅ `api/upload/route.ts` (creado para US-WF-002, upload local)

#### Lo que Falta
1. **Upload Real a R2/Cloudflare**
   - Configurar Cloudflare R2 bucket
   - Integrar SDK de S3-compatible (R2 usa API S3)
   - Endpoint de upload que use R2 en lugar de local
   - URLs firmadas para acceso seguro

2. **Indicadores de Documentos Faltantes**
   - Lista de documentos requeridos por tipo de empleado
   - Checklist visual (✅ presente, ❌ faltante, ⚠️ por vencer)
   - Cálculo de % completitud del expediente

3. **Alertas de Vencimiento**
   - Cron job para revisar documentos próximos a vencer
   - Notificaciones por WhatsApp/email
   - Documentos con fecha de expiración (INE, pasaporte, certificados)

#### Archivos a Crear/Modificar

**Nuevos Archivos:**
```
lib/storage/r2-client.ts
lib/storage/upload-handler.ts
app/api/documents/upload/route.ts
components/labor/document-checklist.tsx
components/labor/document-upload.tsx
lib/cron/document-expiration-check.ts
app/api/cron/document-expiration-check/route.ts
```

**Archivos a Modificar:**
```
app/dashboard/labor/documents/page.tsx
app/api/documents/route.ts
lib/db/schema.ts - Agregar campos expiration_date, is_required
.env - Agregar variables de R2
```

#### Variables de Entorno (.env)
```env
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=pulso-documents
R2_PUBLIC_URL=https://documents.yourdomain.com
```

#### Schema Database (Modificación)
```sql
-- Agregar a documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS expiration_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS document_category TEXT, -- 'IDENTIFICATION', 'CERTIFICATION', 'LEGAL'
ADD COLUMN IF NOT EXISTS storage_url TEXT, -- R2 URL
ADD COLUMN IF NOT EXISTS file_key TEXT; -- R2 object key
```

#### R2 Client (`lib/storage/r2-client.ts`)
```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

export async function uploadToR2(file: Buffer, key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: contentType,
    });
    
    await r2Client.send(command);
    
    return `${process.env.R2_PUBLIC_URL}/${key}`;
}

export async function getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    // Generate presigned URL for private documents
    const command = new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
    });
    
    // Return signed URL
}
```

#### Document Checklist Component (`components/labor/document-checklist.tsx`)
```tsx
interface DocumentChecklistProps {
    employeeId: string;
    documents: Document[];
    requiredDocuments: RequiredDocument[];
}

// Mostrar lista de documentos requeridos
// Para cada documento:
//   - ✅ Si existe y está vigente
//   - ⚠️ Si existe pero está por vencer (< 30 días)
//   - ❌ Si no existe o está vencido
// Barra de progreso: X/Y documentos completos
// Botón "Subir" para documentos faltantes
```

#### Document Expiration Check Cron (`lib/cron/document-expiration-check.ts`)
```typescript
export async function checkExpiringDocuments() {
    // Find documents expiring in next 30 days
    const expiringDocs = await db.query.documents.findMany({
        where: and(
            lte(documents.expirationDate, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
            gte(documents.expirationDate, new Date()),
            eq(documents.status, 'VALID')
        ),
        with: { user: true }
    });
    
    // Send WhatsApp/email notifications
    for (const doc of expiringDocs) {
        await NotificationDispatcher.sendDocumentExpirationAlert({
            userId: doc.user.id,
            documentName: doc.name,
            expirationDate: doc.expirationDate,
            daysUntilExpiration: Math.ceil((doc.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        });
    }
}
```

---

### 4. US-WF-004: Drag-and-Drop in Workflow Template Builder

**Prioridad:** MEDIA  
**Complejidad:** Media  
**Estado:** 🟡 Parcial (Template Editor existe, sin drag-and-drop)

#### Descripción
Agregar drag-and-drop real al builder de workflows para reordenar pasos visualmente.

#### Lo que Existe
- ✅ Template Editor con pasos configurables
- ✅ Añadir pasos secuencialmente
- ✅ Configurar cada paso (tipo, título, descripción)

#### Lo que Falta
1. **Drag-and-Drop Real**
   - Integrar @dnd-kit/core y @dnd-kit/sortable
   - Hacer pasos arrastrables
   - Reordenar pasos al soltar
   - Actualizar orden en template.steps array

2. **UX Improvements**
   - Visual feedback durante drag (ghost, animation)
   - Handle icon para indicar arrastrabilidad
   - Snap to grid o guía visual

#### Archivos a Crear/Modificar

**Nuevos Archivos:**
```
components/workflow/draggable-step.tsx
components/workflow/droppable-area.tsx
```

**Archivos a Modificar:**
```
components/workflow/template-editor.tsx - Integrar DnD
package.json - Agregar @dnd-kit dependencies
```

#### Dependencies (package.json)
```json
{
  "@dnd-kit/core": "^6.1.0",
  "@dnd-kit/sortable": "^8.0.0",
  "@dnd-kit/utilities": "^3.2.2"
}
```

#### Implementation Example (`components/workflow/template-editor.tsx`)
```tsx
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DraggableStep } from './draggable-step';

export function TemplateEditor() {
    const [steps, setSteps] = useState<WorkflowStep[]>([]);
    
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );
    
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        
        if (over && active.id !== over.id) {
            setSteps((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };
    
    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
                {steps.map((step, index) => (
                    <DraggableStep key={step.id} step={step} index={index} />
                ))}
            </SortableContext>
        </DndContext>
    );
}
```

#### DraggableStep Component (`components/workflow/draggable-step.tsx`)
```tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

export function DraggableStep({ step, index }: { step: WorkflowStep, index: number }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: step.id
    });
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };
    
    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-4 border rounded">
            <div {...attributes} {...listeners} className="cursor-grab">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
                <span className="font-medium">Paso {index + 1}: {step.title}</span>
            </div>
            {/* Step config controls */}
        </div>
    );
}
```

---

### 5. US-REP-001: Analytics Auto-Refresh + PDF Export

**Prioridad:** MEDIA  
**Complejidad:** Baja  
**Estado:** 🟡 Parcial (Dashboard existe, sin auto-refresh ni PDF)

#### Descripción
Agregar auto-refresh cada 5 minutos al dashboard de analytics y exportar dashboard a PDF.

#### Lo que Existe
- ✅ Dashboard analytics en `/app/dashboard/analytics/page.tsx`
- ✅ KPIs dinámicos con filtros de periodo
- ✅ Botón de refresh manual
- ✅ API `/api/reports/generate` para PDFs básicos

#### Lo que Falta
1. **Auto-Refresh (5 min)**
   - setInterval para refrescar KPIs cada 300,000ms
   - Indicador visual de último refresh
   - Pausar refresh cuando usuario está interactuando

2. **PDF Export from Dashboard**
   - Generar PDF con KPIs, gráficos, tendencias
   - Incluir logo de empresa
   - Formato profesional con tablas y gráficos

#### Archivos a Modificar

**Archivos a Modificar:**
```
app/dashboard/analytics/page.tsx - Agregar auto-refresh y PDF export
app/api/reports/generate/route.ts - Mejorar generación de PDF
components/analytics/dashboard-export-pdf.tsx (nuevo)
```

#### Auto-Refresh Implementation (`app/dashboard/analytics/page.tsx`)
```tsx
const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
const [isAutoRefreshing, setIsAutoRefreshing] = useState(true);
const [userActive, setUserActive] = useState(false);

// Auto-refresh every 5 minutes
useEffect(() => {
    if (!isAutoRefreshing || userActive) return;
    
    const interval = setInterval(() => {
        fetchKpis();
        setLastRefresh(new Date());
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
}, [isAutoRefreshing, userActive]);

// Track user activity (pause refresh when active)
useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const handleActivity = () => {
        setUserActive(true);
        clearTimeout(timeout);
        timeout = setTimeout(() => setUserActive(false), 5 * 60 * 1000);
    };
    
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    
    return () => {
        window.removeEventListener('mousemove', handleActivity);
        window.removeEventListener('keydown', handleActivity);
        clearTimeout(timeout);
    };
}, []);

// UI indicator
<div className="flex items-center gap-2 text-sm text-muted-foreground">
    <RefreshCw className={`h-4 w-4 ${isAutoRefreshing ? 'animate-spin' : ''}`} />
    <span>Última actualización: {lastRefresh.toLocaleTimeString('es-MX')}</span>
    <Button variant="ghost" size="sm" onClick={() => setIsAutoRefreshing(!isAutoRefreshing)}>
        {isAutoRefreshing ? 'Pausar' : 'Reanudar'}
    </Button>
</div>
```

#### PDF Export (`components/analytics/dashboard-export-pdf.tsx`)
```tsx
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function exportDashboardToPDF(kpiData: any, charts: any[]) {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Dashboard Ejecutivo - Pulso', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, 14, 28);
    doc.text(`Empresa: ${companyName}`, 14, 33);
    
    // KPI Summary
    doc.setFontSize(14);
    doc.text('Resumen de KPIs', 14, 45);
    
    const kpiTable = kpiData.kpis.map(kpi => [
        kpi.name,
        kpi.value,
        kpi.trend,
        kpi.status
    ]);
    
    autoTable(doc, {
        startY: 50,
        head: [['KPI', 'Valor', 'Tendencia', 'Estado']],
        body: kpiTable,
    });
    
    // Charts (convert to images)
    let yPos = doc.lastAutoTable.finalY + 10;
    for (const chart of charts) {
        const imgData = await chart.toImage();
        doc.addImage(imgData, 'PNG', 14, yPos, 180, 80);
        yPos += 90;
        
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }
    }
    
    doc.save(`dashboard-${Date.now()}.pdf`);
}
```

---

### 6. US-REP-002: LFT Violation Detection + Excel/CSV Export

**Prioridad:** MEDIA  
**Complejidad:** Media  
**Estado:** 🟡 Parcial (Detección existe en labor-compliance, no en reportes generales)

#### Descripción
Agregar detección de violaciones LFT a reportes generales y exportación a Excel/CSV desde dashboards.

#### Lo que Existe
- ✅ API `/api/reports/labor-compliance` detecta violaciones
- ✅ LaborCalculator con reglas LFT (2x, 3x)
- ✅ Overtime alerts service
- ✅ Excel export básico en `/api/reports/generate`

#### Lo que Falta
1. **LFT Violations in General Reports**
   - Incluir violaciones LFT en reporte de cumplimiento
   - Categorizar violaciones (horas extras, breaks, llegadas tarde)
   - Conteo por empleado y por período

2. **Excel/CSV Export from All Dashboards**
   - Analytics dashboard → CSV
   - Labor dashboard → Excel
   - Inventory → CSV
   - Workflows → Excel

#### Archivos a Crear/Modificar

**Nuevos Archivos:**
```
lib/reports/lft-violation-reporter.ts
app/api/reports/lft-violations/route.ts
components/reports/lft-violations-table.tsx
lib/utils/csv-export.ts
```

**Archivos a Modificar:**
```
app/api/reports/labor-compliance/route.ts - Agregar violaciones estructuradas
app/api/reports/generate/route.ts - Agregar más tipos de reporte
app/dashboard/analytics/page.tsx - Botón export CSV
```

#### LFT Violation Types
```typescript
export type LFTViolationType = 
    | 'EXCESSIVE_OVERTIME' // > 3 horas/día o > 9 horas/semana
    | 'MISSED_BREAK' // > 5 horas sin pausa
    | 'LATE_ARRIVAL' // > 15 minutos tarde
    | 'EARLY_DEPARTURE' // Salida antes de hora
    | 'SIXTH_DAY_VIOLATION' // 6 días consecutivos sin descanso
    | 'MINIMUM_WAGE' // Pago por debajo de salario mínimo
    | 'WEEKLY_LIMIT' // > 48 horas semanales;

export interface LFTViolation {
    id: string;
    userId: string;
    userName: string;
    type: LFTViolationType;
    date: Date;
    description: string;
    severity: 'LEVE' | 'GRAVE' | 'MUY_GRAVE';
    article: string; // Artículo LFT violado
    fineRange?: string; // Rango de multa
}
```

#### CSV Export Utility (`lib/utils/csv-export.ts`)
```typescript
export function exportToCSV(data: any[], filename: string, headers?: string[]) {
    if (data.length === 0) return;
    
    const csvHeaders = headers || Object.keys(data[0]);
    const csvRows = data.map(row => 
        csvHeaders.map(header => {
            const value = row[header];
            // Escape quotes and wrap in quotes if contains comma
            const escaped = String(value).replace(/"/g, '""');
            return escaped.includes(',') ? `"${escaped}"` : escaped;
        }).join(',')
    );
    
    const csv = [csvHeaders.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
}
```

---

### 7. US-LAB-002: Automatic Break Reminders

**Prioridad:** BAJA  
**Complejidad:** Baja  
**Estado:** 🟡 Parcial (API existe, sin recordatorios automáticos)

#### Descripción
Agregar recordatorios automáticos de pausa obligatoria (4+ horas sin pausa) y alertas cuando la pausa excede el tiempo.

#### Lo que Existe
- ✅ API `/api/breaks` existe
- ✅ Página `/dashboard/labor/breaks` existe
- ✅ Break tracking en database

#### Lo que Falta
1. **Recordatorios Automáticos**
   - Cron job cada hora revisa sesiones activas
   - Si empleado lleva 4+ horas sin break → enviar recordatorio
   - WhatsApp notification

2. **Alertas de Pausa Excedida**
   - Si break > 30 minutos → alertar supervisor
   - Si break > 60 minutos → marcar como no válido

#### Archivos a Crear/Modificar

**Nuevos Archivos:**
```
lib/cron/break-reminder-check.ts
app/api/cron/break-reminders/route.ts
lib/services/break-reminder-service.ts
```

**Archivos a Modificar:**
```
lib/db/schema.ts - Agregar campos a breaks (reminderSent, exceeded)
```

#### Break Reminder Service (`lib/services/break-reminder-service.ts`)
```typescript
export class BreakReminderService {
    static async checkAndSendReminders() {
        // Find active shift sessions without breaks in last 4 hours
        const sessions = await db.query.shiftSessions.findMany({
            where: and(
                eq(shiftSessions.status, 'ACTIVE'),
                sql`${shiftSessions.startedAt} < NOW() - INTERVAL '4 hours'`,
                sql`NOT EXISTS (
                    SELECT 1 FROM breaks b 
                    WHERE b.session_id = ${shiftSessions.id} 
                    AND b.started_at > NOW() - INTERVAL '4 hours'
                )`
            ),
            with: { user: true }
        });
        
        for (const session of sessions) {
            // Send WhatsApp reminder
            await WhatsAppNotificationService.sendBreakReminder({
                userId: session.user.id,
                userName: session.user.name,
                hoursWorked: 4,
                branchName: session.branchName
            });
            
            // Mark reminder sent
            await db.update(shiftSessions)
                .set({ breakReminderSent: true })
                .where(eq(shiftSessions.id, session.id));
        }
    }
    
    static async checkExceededBreaks() {
        // Find breaks that exceeded 30 minutes
        const exceededBreaks = await db.query.breaks.findMany({
            where: and(
                eq(breaks.status, 'COMPLETED'),
                sql`EXTRACT(EPOCH FROM (${breaks.endedAt} - ${breaks.startedAt})) > 1800` // 30 min
            ),
            with: { user: true, session: true }
        });
        
        for (const break_ of exceededBreaks) {
            // Alert supervisor
            await NotificationDispatcher.sendBreakExceededAlert({
                userId: break_.user.id,
                supervisorId: break_.session.supervisorId,
                breakDuration: Math.floor((break_.endedAt - break_.startedAt) / 60000),
                branchId: break_.session.branchId
            });
        }
    }
}
```

---

### 8. US-LAB-003: Calendar PDF Export + LFT Conflict Validation

**Prioridad:** BAJA  
**Complejidad:** Baja  
**Estado:** 🟡 Parcial (Scheduler existe, sin export ni validación)

#### Descripción
Agregar exportar calendario de turnos a PDF y validación visual de conflictos LFT (6 días consecutivos).

#### Lo que Existe
- ✅ WeeklyShiftPlanner y RecurringShiftBuilder
- ✅ Schedule builder conectado a backend real
- ✅ Calendar UI

#### Lo que Falta
1. **PDF Export de Calendario**
   - Generar PDF del calendario mensual/semanal
   - Incluir turnos por empleado
   - Formato imprimible

2. **Validación de Conflictos LFT**
   - Detectar 6+ días consecutivos sin descanso
   - Detectar > 48 horas semanales
   - Marcar visualmente en calendario (rojo/amarillo)

#### Archivos a Crear/Modificar

**Nuevos Archivos:**
```
lib/reports/schedule-calendar-pdf.ts
components/labor/lft-conflict-validator.tsx
lib/services/lft-conflict-detector.ts
```

**Archivos a Modificar:**
```
components/labor/unified-shift-scheduler.tsx - Agregar validación visual
app/dashboard/labor/schedule/page.tsx - Botón export PDF
```

#### LFT Conflict Detector (`lib/services/lft-conflict-detector.ts`)
```typescript
export class LFTConflictDetector {
    static detectConflicts(schedule: ShiftSchedule[]): LFTConflict[] {
        const conflicts: LFTConflict[] = [];
        
        // Group by employee
        const byEmployee = groupBy(schedule, 'userId');
        
        for (const [userId, shifts] of Object.entries(byEmployee)) {
            // Check 6 consecutive days
            const consecutiveDays = this.findConsecutiveDays(shifts);
            if (consecutiveDays >= 6) {
                conflicts.push({
                    userId,
                    type: 'SIXTH_DAY_VIOLATION',
                    severity: 'GRAVE',
                    description: `${consecutiveDays} días consecutivos sin descanso`,
                    article: 'Artículo 69 LFT',
                    dates: shifts.map(s => s.date)
                });
            }
            
            // Check weekly hours
            const weeklyHours = this.calculateWeeklyHours(shifts);
            if (weeklyHours > 48) {
                conflicts.push({
                    userId,
                    type: 'WEEKLY_LIMIT_EXCEEDED',
                    severity: 'MUY_GRAVE',
                    description: `${weeklyHours} horas en la semana (máx 48)`,
                    article: 'Artículo 61 LFT',
                    dates: shifts.map(s => s.date)
                });
            }
        }
        
        return conflicts;
    }
}
```

---

### 9. US-LAB-004: Overtime Approval Flow

**Prioridad:** BAJA  
**Complejidad:** Baja  
**Estado:** 🟡 Parcial (Cálculo existe, sin flujo de aprobación)

#### Descripción
Implementar flujo de aprobación/rechazo de horas extras.

#### Lo que Existe
- ✅ LaborCalculator con reglas LFT completas
- ✅ Dashboard de overtime conectado a datos reales
- ✅ Overtime calculation service

#### Lo que Falta
1. **Approval Workflow**
   - Empleado solicita horas extras
   - Supervisor recibe notificación
   - Supervisor aprueba/rechaza con comentario
   - Estado tracking (PENDING, APPROVED, REJECTED)

2. **UI de Gestión**
   - Lista de solicitudes pendientes
   - Historial de aprobaciones
   - Filtros por estado, fecha, empleado

#### Archivos a Crear/Modificar

**Nuevos Archivos:**
```
app/api/overtime/requests/route.ts
app/api/overtime/requests/[id]/approve/route.ts
app/api/overtime/requests/[id]/reject/route.ts
components/labor/overtime-request-form.tsx
components/labor/overtime-approval-list.tsx
app/dashboard/labor/overtime/requests/page.tsx
```

**Archivos a Modificar:**
```
lib/db/schema.ts - Agregar tabla overtimeRequests
lib/services/labor-calculator.ts - Integrar con approval flow
```

#### Schema Database (Nuevo)
```sql
CREATE TABLE overtime_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    supervisor_id TEXT REFERENCES users(id),
    
    request_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    estimated_hours DECIMAL(4,2),
    reason TEXT NOT NULL,
    
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    reviewed_by TEXT,
    reviewed_at TIMESTAMP,
    review_comment TEXT,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_overtime_req_user ON overtime_requests(user_id);
CREATE INDEX idx_overtime_req_status ON overtime_requests(status);
```

---

## 🎯 Plan de Implementación Sugerido

### Sprint 1 (Features ALTAS)
1. **US-INV-003**: Batch/FIFO UI (2-3 días)
2. **US-LAB-005**: Document Upload R2 (2 días)
3. **US-WA-002**: WhatsApp Workflow (4-5 días)

### Sprint 2 (Features MEDIAS)
4. **US-WF-004**: Drag-and-Drop Builder (1-2 días)
5. **US-REP-001**: Analytics Auto-Refresh + PDF (1 día)
6. **US-REP-002**: LFT Violations + Export (2 días)

### Sprint 3 (Features BAJAS)
7. **US-LAB-002**: Break Reminders (1 día)
8. **US-LAB-003**: Calendar PDF + LFT Validation (1 día)
9. **US-LAB-004**: Overtime Approval (1-2 días)

**Total Estimado:** 15-18 días de desarrollo

---

## 📝 Notas para el Agente de Implementación

1. **Seguir el patrón existente**: Revisar componentes y APIs ya implementadas (US-WF-002, US-WF-003, US-INV-002) para mantener consistencia.

2. **Base de datos**: Usar `npx drizzle-kit push` después de modificar `lib/db/schema.ts`.

3. **Autenticación**: Usar `auth.api.getSession()` de `@/lib/auth` para proteger endpoints.

4. **Notificaciones WhatsApp**: Usar `NotificationDispatcher.sendInventoryAlert()` como referencia para nuevos tipos de notificación.

5. **UI Components**: Usar shadcn/ui (ya instalado) para mantener consistencia visual.

6. **Testing**: Probar cada feature individualmente antes de pasar a la siguiente.

7. **Commits**: Hacer commits atómicos por feature con mensajes descriptivos.

---

## 🔗 Referencias Cruzadas

### Archivos de Referencia (Ya Implementados)
- **Workflow Executor**: `components/workflow/workflow-executor.tsx`
- **Workflow Review**: `components/workflow/workflow-review.tsx`
- **Stock Alerts**: `app/dashboard/inventory/alerts/page.tsx`
- **Notification Dispatcher**: `lib/services/notification-dispatcher.ts`
- **Stock Alert Service**: `lib/services/stock-alert-service.ts`
- **Cron Jobs**: `app/api/cron/stock-check/route.ts`

### Patrones a Seguir
- **API Routes**: Ver `app/api/inventory/alerts/[id]/route.ts`
- **Components**: Ver `components/workflow/workflow-executor.tsx`
- **Services**: Ver `lib/services/stock-alert-service.ts`
- **Database Schema**: Ver `lib/db/schema.ts` (líneas 756-801 para inventoryAlerts)

---

**Fin del Documento de Plan de Implementación**
