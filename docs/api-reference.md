# Pulso HORECA API Reference

This document outlines the primary REST APIs available in the Pulso HORECA MVP. All endpoints are prefixed with `/api`.

## Authentication & Authorization

All endpoints (unless marked explicitly as public) require an active session. The Pulso system uses `better-auth` for managing sessions. A session token cookie must be included in requests.

---

## 1. Compliance & Reports

### 1.1 Get NOM-251 Reports
`GET /api/reports/nom-251`

**Query Parameters:**
- `branchId` (string) - Branch UID to filter
- `startDate` (ISO Date string) - Starting range
- `endDate` (ISO Date string) - Ending range

**Response:** Returns a compiled PDF buffer (`application/pdf`).

### 1.2 Get NOM-035 Reports
`GET /api/reports/nom-035`

**Query Parameters:**
- `branchId` (string) - Branch UID to filter
- `startDate` (ISO Date string) - Starting range
- `endDate` (ISO Date string) - Ending range

**Response:** Returns a compiled PDF buffer (`application/pdf`) with Employee psychometric distributions.

---

## 2. Webhooks & Integrations

### 2.1 WhatsApp Webhook Receiver
`POST /api/whatsapp/webhook`

Receives inbound payloads from Wasender.

**Body Payload Details:**
- `message` (object) - The incoming chat structure from Wasender 
- Has handling for commands: `opt-in`, `opt-out`, `soporte`, and automated AI parsing.

**Response:** `200 OK`

---

## 3. Inventory & Alerts

### 3.1 Fetch Inventory Alerts
`GET /api/inventory/alerts/history`

Retrieves stock shortages and low notifications.

**Query Parameters:**
- `status` (string, optional) - e.g. "ACTIVE", "VIEWED", "RESOLVED"
- `type` (string, optional) - e.g. "LOW_STOCK", "OUT_OF_STOCK"

**Response JSON Example:**
```json
{
  "data": [
    {
       "id": "uuid",
       "type": "LOW_STOCK",
       "severity": "ALTA",
       "currentStock": 5,
       "minLevel": 15
    }
  ],
  "summary": { "active": 1, "resolved": 5 }
}
```

### 3.2 Execute Cron Stock Check
`POST /api/cron/stock-check`

Manually trigger the cron task that generates system-wide `LOW_STOCK` / `OUT_OF_STOCK` alerts.

**Headers:**
- `Authorization: Bearer <CRON_SECRET>`

**Response JSON Example:**
```json
{
  "success": true,
  "alertsCount": 4,
  "notificationsSent": 2
}
```

---

## 4. Labor & HR

### 4.1 Create Bulk Shifts
`POST /api/shifts/bulk`

Upserts multiple user scheduled shifts into the database.

**Body JSON:**
```json
{
  "shifts": [
    {
      "userId": "uuid",
      "shiftDate": "2026-05-12",
      "startTime": "09:00",
      "endTime": "18:00",
      "role": "COCINERO"
    }
  ]
}
```
