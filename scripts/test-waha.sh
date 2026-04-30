#!/bin/bash
# Script de prueba para WAHA NOWEB
# Ejecutar después de configurar el servidor WAHA

WAHA_URL="http://localhost:3001"
SESSION="test-session"
PHONE="5215512345678"  # Cambiar a un número real de prueba

echo "=== Pruebas WAHA NOWEB ==="
echo ""

# 1. Ping
echo "1. Verificando WAHA..."
curl -s $WAHA_URL/api/ping
echo ""
echo ""

# 2. Crear sesión
echo "2. Creando sesión..."
curl -s -X POST $WAHA_URL/api/sessions \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"$SESSION\", \"config\": {\"noweb\": {\"store\": {\"enabled\": true, \"fullSync\": false}, \"markOnline\": true}}}"
echo ""
echo ""

# 3. Verificar estado
echo "3. Verificando estado (esperar 5 segundos)..."
sleep 5
curl -s $WAHA_URL/api/sessions/$SESSION
echo ""
echo ""

# 4. Obtener QR (si aplica)
echo "4. Obteniendo código QR..."
curl -s $WAHA_URL/api/sessions/$SESSION/auth/qr
echo ""
echo ""

echo "=== Siga estos pasos ==="
echo "1. Abra WhatsApp en su teléfono"
echo "2. Vaya a Configuración > Dispositivos vinculados"
echo "3. Escanee el código QR mostrado arriba"
echo "4. Espere a que el estado cambie a 'WORKING'"
echo "5. Ejecute: ./scripts/test-waha-send.sh"
echo ""

# Guardar variables para el siguiente script
echo "export WAHA_URL=$WAHA_URL" > .waha-test.env
echo "export SESSION=$SESSION" >> .waha-test.env
echo "export PHONE=$PHONE" >> .waha-test.env
