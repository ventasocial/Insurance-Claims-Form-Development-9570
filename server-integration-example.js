/**
 * Ejemplo de cómo integrar las nuevas funcionalidades GHL en tu servidor existente
 * ESTE ARCHIVO ES SOLO DE REFERENCIA - Adapta el código a tu estructura existente
 */

// ========================================
// 1. IMPORTACIONES (Agregar a tu server.js)
// ========================================

import express from 'express';
import cors from 'cors';
// ... otras importaciones existentes ...

// NUEVA importación para rutas GHL
import ghlProxyRouter from './routes/ghl-proxy.js';

// NUEVA importación para mejoras de webhook
import { enhanceWebhookDataForGHL, validateGHLUrls } from './lib/webhookEnhancements.js';

// ========================================
// 2. CONFIGURACIÓN DEL SERVIDOR (Modificar tu server.js)
// ========================================

const app = express();

// Middleware existente (MANTENER todo)
app.use(cors());
app.use(express.json());
// ... otros middlewares existentes ...

// Rutas existentes (MANTENER todas)
// NOTA: Estas son variables de ejemplo - reemplaza con tus rutas reales
const authRouter = express.Router(); // Ejemplo - usa tu router real
const claimsRouter = express.Router(); // Ejemplo - usa tu router real

app.use('/api/auth', authRouter);
app.use('/api/claims', claimsRouter);
// ... otras rutas existentes ...

// NUEVA ruta para GoHighLevel (AGREGAR)
app.use('/api/ghl', ghlProxyRouter);

// ========================================
// 3. MODIFICAR WEBHOOK EXISTENTE
// ========================================

// Tu webhook existente - SOLO modificar para agregar datos GHL
app.post('/webhook/claim-created', async (req, res) => {
  try {
    console.log('📥 Webhook recibido - procesando para Albato/GHL...');
    
    // Tu lógica existente para procesar el claim (MANTENER)
    const claimData = req.body;
    
    // Validaciones existentes (MANTENER todas)
    if (!claimData.submission_id) {
      return res.status(400).json({ error: 'ID de submission requerido' });
    }
    
    // NUEVA funcionalidad: Enriquecer con datos para GHL
    const enhancedData = enhanceWebhookDataForGHL(claimData, req);
    
    // NUEVA funcionalidad: Validar URLs generadas
    const validation = validateGHLUrls(enhancedData);
    
    if (!validation.valid) {
      console.warn('⚠️ URLs de GHL no válidas, usando datos originales');
    }
    
    // Enviar a Albato (MODIFICAR para usar datos enriquecidos)
    const albato_response = await fetch(process.env.ALBATO_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // CAMBIO: usar enhancedData en lugar de claimData
      body: JSON.stringify(validation.valid ? enhancedData : claimData)
    });
    
    if (!albato_response.ok) {
      throw new Error(`Error enviando a Albato: ${albato_response.status}`);
    }
    
    console.log('✅ Webhook enviado exitosamente a Albato/GHL');
    console.log(`📊 URLs de GHL incluidas: ${validation.urlsCount}`);
    
    // Respuesta mejorada (MODIFICAR tu respuesta existente)
    res.json({
      success: true,
      message: 'Webhook procesado exitosamente',
      claim_id: claimData.submission_id,
      // NUEVO: información sobre integración GHL
      ghl_integration: {
        enabled: true,
        urls_generated: validation.urlsCount,
        validation_passed: validation.valid,
        files_list_url: enhancedData.ghl_files_list_url
      }
    });
    
  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      ghl_integration: {
        enabled: false,
        error: 'Failed to process GHL integration'
      }
    });
  }
});

// ========================================
// 4. NUEVOS ENDPOINTS DE UTILIDAD (Opcionales)
// ========================================

// Endpoint para verificar integración GHL
app.get('/api/ghl-status', (req, res) => {
  res.json({
    service: 'GoHighLevel Integration',
    status: 'active',
    version: '1.0.0',
    endpoints: {
      file_proxy: '/api/ghl/file/:claimId/:fileType/:fileName',
      files_list: '/api/ghl/claim/:claimId/files',
      file_info: '/api/ghl/info/:claimId/:fileType/:fileName',
      health_check: '/api/ghl/health'
    },
    documentation: {
      description: 'URLs permanentes para acceso a documentos desde GoHighLevel',
      usage: 'Las URLs se generan automáticamente en cada webhook y siempre funcionan',
      example_file_url: `${process.env.BASE_URL || 'https://tudominio.com'}/api/ghl/file/CLAIM_ID/FILE_TYPE/FILE_NAME`
    }
  });
});

// ========================================
// 5. VARIABLES DE ENTORNO NECESARIAS
// ========================================

/*
Agregar a tu archivo .env:

# Existentes (ya tienes estas)
SUPABASE_URL=https://zshawnoiwrqznqocxqrr.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
ALBATO_WEBHOOK_URL=tu_url_albato

# NUEVA variable requerida para GHL
BASE_URL=https://tudominio.com

# Opcional: Puerto del servidor
PORT=3000
*/

// ========================================
// 6. EJEMPLO DE USO EN GOHIGHLEVEL
// ========================================

/*
Cuando GoHighLevel reciba el webhook, tendrá acceso a estas URLs:

1. URLs directas a archivos (permanentes):
   - ghl_document_urls.solicitud_programacion
   - ghl_document_urls.informe_medico
   - ghl_document_urls.bitacora_medico
   - etc.

2. URL para listar todos los archivos:
   - ghl_files_list_url

3. URLs de información para debugging:
   - ghl_info_urls.solicitud_info
   - ghl_info_urls.health_check

Ejemplo de uso en GHL:
- Guardar las URLs en campos personalizados del contacto
- Usar las URLs para descargar archivos automáticamente
- Mostrar enlaces de descarga en emails o SMS
- Crear automatizaciones basadas en la disponibilidad de documentos
*/

// ========================================
// 7. TESTING DE LA INTEGRACIÓN
// ========================================

// Función para probar la integración GHL
const testGHLIntegration = async () => {
  try {
    const testClaimId = 'test-' + Date.now();
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    
    console.log('🧪 Probando integración GHL...');
    
    // Test 1: Health check
    const healthResponse = await fetch(`${baseUrl}/api/ghl/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);
    
    // Test 2: Files list (debería devolver 404 para claim inexistente)
    const filesResponse = await fetch(`${baseUrl}/api/ghl/claim/${testClaimId}/files`);
    console.log('📋 Files list status:', filesResponse.status);
    
    // Test 3: File info (debería devolver 404 para archivo inexistente)
    const infoResponse = await fetch(`${baseUrl}/api/ghl/info/${testClaimId}/informe-medico/test.pdf`);
    console.log('📄 File info status:', infoResponse.status);
    
    console.log('✅ Integración GHL lista para usar');
    
  } catch (error) {
    console.error('❌ Error probando integración GHL:', error);
  }
};

// Ejecutar test si es desarrollo
if (process.env.NODE_ENV === 'development') {
  // testGHLIntegration();
}

export default app;