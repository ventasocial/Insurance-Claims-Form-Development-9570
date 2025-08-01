# Integración GoHighLevel - Documentación

## 📋 Resumen

Esta integración permite que GoHighLevel acceda a los documentos de Supabase Storage usando URLs permanentes que siempre funcionan, sin necesidad de gestionar tokens temporales.

## 🚀 Características

- **URLs Permanentes**: GoHighLevel puede guardar y usar URLs que siempre funcionan
- **Redirección Automática**: Las URLs generan enlaces frescos automáticamente  
- **Sin Tokens**: No necesita gestionar tokens de acceso temporal
- **Compatibilidad Total**: Funciona con el sistema existente sin modificaciones

## 📁 Archivos Agregados

### 1. `routes/ghl-proxy.js`
Rutas API para GoHighLevel:
- `GET /api/ghl/file/:claimId/:fileType/:fileName` - Acceso directo a archivos
- `GET /api/ghl/claim/:claimId/files` - Lista todos los archivos de un claim
- `GET /api/ghl/info/:claimId/:fileType/:fileName` - Información del archivo
- `GET /api/ghl/health` - Estado del servicio

### 2. `lib/webhookEnhancements.js`
Mejoras para webhooks:
- `enhanceWebhookDataForGHL()` - Agrega URLs de GHL a los datos del webhook
- `validateGHLUrls()` - Valida que las URLs estén correctamente formateadas
- Datos de ejemplo para GoHighLevel

### 3. `server-integration-example.js`
Ejemplo de integración completa:
- Cómo agregar las rutas al servidor existente
- Cómo modificar webhooks para incluir datos GHL
- Variables de entorno necesarias
- Funciones de testing

## 🔧 Instalación

### 1. Agregar archivos al proyecto
```bash
# Copiar los archivos a tu proyecto
cp routes/ghl-proxy.js tu-proyecto/routes/
cp lib/webhookEnhancements.js tu-proyecto/lib/
```

### 2. Instalar dependencias (si no las tienes)
```bash
npm install express @supabase/supabase-js
```

### 3. Agregar rutas al servidor
```javascript
// En tu app.js o server.js
import ghlProxyRouter from './routes/ghl-proxy.js';
app.use('/api/ghl', ghlProxyRouter);
```

### 4. Modificar webhook existente
```javascript
import { enhanceWebhookDataForGHL } from './lib/webhookEnhancements.js';

// En tu webhook
const enhancedData = enhanceWebhookDataForGHL(originalData, req);
// Enviar enhancedData a Albato en lugar de originalData
```

### 5. Configurar variables de entorno
```bash
# Agregar a tu .env
BASE_URL=https://tudominio.com
```

## 📊 Datos que Recibe GoHighLevel

Cuando se dispara un webhook, GoHighLevel recibe todos los datos originales MÁS:

```json
{
  "ghl_document_urls": {
    "solicitud_programacion": "https://tudominio.com/api/ghl/file/CLAIM_ID/solicitud-programacion-axa/archivo.pdf",
    "informe_medico": "https://tudominio.com/api/ghl/file/CLAIM_ID/informe-medico/archivo.pdf",
    "bitacora_medico": "https://tudominio.com/api/ghl/file/CLAIM_ID/bitacora-medico/archivo.pdf"
  },
  "ghl_files_list_url": "https://tudominio.com/api/ghl/claim/CLAIM_ID/files",
  "ghl_integration": {
    "version": "1.0.0",
    "total_document_urls": 8,
    "access_method": "permanent_urls",
    "description": "URLs que siempre funcionan"
  }
}
```

## 🔗 Uso en GoHighLevel

### 1. Acceso Directo a Archivos
```javascript
// Las URLs de ghl_document_urls se pueden usar directamente
const pdfUrl = webhook_data.ghl_document_urls.informe_medico;
// Esta URL siempre funcionará - GHL puede guardarla y usarla cuando quiera
```

### 2. Listar Todos los Archivos
```javascript
// Obtener lista completa de archivos disponibles
const response = await fetch(webhook_data.ghl_files_list_url);
const filesData = await response.json();
console.log(`Archivos disponibles: ${filesData.totalFiles}`);
```

### 3. Automatizaciones en GHL
- Guardar URLs en campos personalizados del contacto
- Enviar enlaces de descarga por email/SMS
- Crear triggers basados en documentos disponibles
- Descargar archivos automáticamente para procesamiento

## 🧪 Testing

### 1. Verificar Health Check
```bash
curl https://tudominio.com/api/ghl/health
```

### 2. Probar Lista de Archivos
```bash
curl https://tudominio.com/api/ghl/claim/CLAIM_ID/files
```

### 3. Probar Acceso a Archivo
```bash
curl -I https://tudominio.com/api/ghl/file/CLAIM_ID/informe-medico/archivo.pdf
# Debería devolver 302 redirect si el archivo existe
```

## 🔒 Seguridad

- Las URLs son permanentes pero los enlaces finales son temporales (1 hora)
- Cada acceso genera un nuevo enlace firmado automáticamente
- No se exponen tokens o credenciales a GoHighLevel
- Funciona con las mismas políticas de seguridad de Supabase

## ⚙️ Variables de Entorno

```bash
# Requeridas para GHL
BASE_URL=https://tudominio.com

# Existentes (ya las tienes)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
ALBATO_WEBHOOK_URL=tu_webhook_albato
```

## 🚨 Importante

- **No modifica nada del frontend existente**
- **Compatible con todo el sistema actual**
- **Solo agrega funcionalidad nueva**
- **Mantiene todas las características existentes**

## 📞 Soporte

Si tienes dudas sobre la integración:
1. Revisa los logs del servidor para errores
2. Verifica que BASE_URL esté configurada correctamente
3. Prueba los endpoints de health check
4. Verifica que las credenciales de Supabase sean correctas

## 🎯 Próximos Pasos

1. Implementar los archivos en tu servidor
2. Configurar las variables de entorno
3. Probar los endpoints con curl
4. Configurar GoHighLevel para usar las nuevas URLs
5. Crear automatizaciones en GHL según tus necesidades