# System Architecture & Workflow Execution Plan

## 🏗️ System Architecture Overview

```mermaid
graph TB
    subgraph "Frontend (Next.js)"
        A[User Interface] --> B[WorkflowExecutor Component]
        A --> C[Review Dashboard]
        A --> D[Inventory Management]
        A --> E[WhatsApp Interface]
        A --> F[Analytics Dashboard]
    end
    
    subgraph "Backend API (Next.js App Router)"
        B --> G[/api/workflows/execute]
        B --> H[/api/workflows/steps]
        C --> I[/api/workflows/review]
        D --> J[/api/inventory]
        D --> K[/api/cron/stock-check]
        E --> L[/api/whatsapp/webhook]
        E --> M[/api/ai/verify]
        F --> N[/api/analytics]
    end
    
    subgraph "Services Layer"
        G --> O[Workflow Execution Service]
        H --> O
        I --> P[Review Service]
        J --> Q[Inventory Service]
        K --> R[Stock Alert Service]
        L --> S[WhatsApp Service]
        M --> T[AI Verification Service]
        N --> U[Analytics Service]
    end
    
    subgraph "External Integrations"
        S --> W[WASENDER API]
        T --> X[OpenAI/Moondream]
        Q --> Y[Cloudflare R2]
        U --> Z[PDF/Excel Export]
    end
    
    subgraph "Database (PostgreSQL)"
        O --> A1[workflow_instances]
        O --> A2[workflow_instance_steps]
        P --> A1
        P --> A2
        Q --> B1[inventory_items]
        Q --> B2[inventory_batches]
        Q --> B3[inventory_movements]
        R --> B1
        R --> B2
        S --> C1[whatsapp_sessions]
        S --> C2[whatsapp_messages]
        T --> D1[verification_logs]
        U --> E1[kpi_definitions]
        U --> E2[kpi_values]
    end
    
    subgraph "Storage"
        Y --> F1[R2 Storage]
        F1 --> G1[Document Files]
        F1 --> G2[Evidence Photos]
    end
```

## 🔄 Workflow Execution Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend API
    participant WS as Workflow Service
    participant AI as AI Service
    participant DB as Database
    participant WSAPI as WhatsApp API
    
    U->>FE: Click "Start Workflow"
    FE->>BE: POST /api/workflows/execute
    BE->>WS: Create workflow instance
    WS->>DB: Save instance & steps
    BE->>FE: Return instance ID
    
    loop For each step
        FE->>U: Display step instructions
        U->>FE: Complete step (photo/text)
        FE->>BE: POST /api/workflows/steps/:stepId/evidence
        BE->>AI: POST /api/ai/verify
        AI->>AI: Process image/text
        AI->>BE: Return confidence score
        BE->>WS: Update step status
        WS->>DB: Save evidence & results
        BE->>FE: Return completion status
    end
    
    FE->>U: Workflow completed
    U->>FE: Request review (if applicable)
    FE->>BE: POST /api/workflows/review
    BE->>WS: Mark as reviewed
    WS->>WSAPI: Send WhatsApp notification
    WSAPI->>U: Confirmation message
```

## 📊 Inventory Management Flow

```mermaid
flowchart TD
    A[Receive Inventory] --> B[Scan Barcode]
    B --> C{Item Exists?}
    C -->|No| D[Create New Item]
    C -->|Yes| E[Check Purchase Order]
    E --> F[Verify Quantity]
    F --> G[Create Batch]
    G --> H[Update Stock]
    H --> I[Generate Receipt]
    
    I --> J{Stock Below Threshold?}
    J -->|Yes| K[Create Stock Alert]
    J -->|No| L[Complete Receiving]
    
    K --> M[Schedule Stock Check]
    M --> N[Send Notifications]
    N --> O[Alert Dashboard]
    
    P[Transfer Request] --> Q[Approve Transfer]
    Q --> R[Update Source Stock]
    R --> S[Mark as In Transit]
    S --> T[Update Destination Stock]
    T --> U[Complete Transfer]
```

## 💬 WhatsApp Integration Flow

```mermaid
sequenceDiagram
    participant W as WhatsApp User
    participant WA as WhatsApp API
    participant BE as Backend
    participant WS as Workflow Service
    participant AI as AI Service
    
    W->>WA: Send message
    WA->>BE: Webhook POST /api/whatsapp/webhook
    BE->>WS: Parse command
    WS->>BE: Determine action
    
    alt Workflow Execution
        BE->>WS: Start workflow session
        WS->>WA: Send step instructions
        W->>WA: Send evidence (photo/text)
        WA->>BE: Webhook with evidence
        BE->>AI: Verify evidence
        AI->>BE: Return result
        BE->>WA: Send confirmation
        WS->>BE: Update workflow progress
    else User Registration
        BE->>WS: Start registration flow
        WS->>WA: Request company code
        W->>WA: Send company code
        BE->>WS: Validate code
        WS->>WA: Request user info
        W->>WA: Send user details
        BE->>WS: Create user account
        WS->>WA: Send profile link
    else Labor Commands
        BE->>WS: Process labor command
        WS->>BE: Clock in/out/break
        BE->>WS: Update shift records
        WS->>WA: Send confirmation
    end
```

## 🔍 AI Verification Process

```mermaid
flowchart TD
    A[Receive Evidence] --> B[Extract Image/Text]
    B --> C[Pre-process Data]
    C --> D[Send to AI Provider]
    D --> E{Provider Available?}
    E -->|Yes| F[Process with OpenAI]
    E -->|No| G[Process with Moondream]
    F --> H[Get Confidence Score]
    G --> H
    H --> I{Confidence > 85%?}
    I -->|Yes| J[Auto-approve Step]
    I -->|No| K[Mark for Review]
    J --> L[Save Verification Result]
    K --> M[Notify Supervisor]
    L --> N[Update Step Status]
    M --> O[Create Review Task]
    N --> P[Log Verification]
    O --> Q[Add to Review Queue]
```

## 📈 Analytics Dashboard Flow

```mermaid
flowchart TD
    A[User Request Dashboard] --> B[Filter Parameters]
    B --> C[Query KPI Definitions]
    C --> D[Calculate Metrics]
    D --> E[Aggregate Data]
    E --> F[Generate Charts]
    F --> G[Apply Filters]
    G --> H[Format Response]
    H --> I[Send to Frontend]
    
    J[Export Request] --> K[Select Format PDF/Excel]
    K --> L[Generate Report]
    L --> M[Apply Branding]
    M --> N[Download File]
    
    O[Real-time Updates] --> P[WebSocket Connection]
    P --> Q[Push Updates]
    Q --> R[Refresh Dashboard]
```

## 🔐 Security & Performance Considerations

### Security Measures
- **Rate Limiting**: 100 requests/minute per user
- **Authentication**: JWT tokens with 15min expiry
- **Authorization**: Role-based access control
- **Data Encryption**: PII data encrypted at rest
- **Audit Logging**: All actions logged for compliance

### Performance Optimizations
- **Caching**: Redis for frequently accessed data
- **Database Indexes**: Optimized queries for large datasets
- **Pagination**: Efficient data loading for tables
- **Lazy Loading**: Components loaded on demand
- **CDN**: Static assets served via CDN

### Scalability Features
- **Multi-tenant**: Data isolation by company/branch
- **Microservices**: Services can be scaled independently
- **Load Balancing**: Even distribution of requests
- **Database Sharding**: Horizontal scaling for large datasets
- **Auto-scaling**: AWS/GCP auto-scaling groups

---

*This architecture document outlines the technical foundation for implementing the features identified in the user stories audit. The system is designed to be scalable, secure, and maintainable while meeting the compliance requirements for the HORECA industry.*