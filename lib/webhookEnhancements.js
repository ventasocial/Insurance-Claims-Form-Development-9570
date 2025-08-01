/**
 * Mejoras para webhooks - Agregar datos específicos para GoHighLevel
 * COMPLEMENTA las funciones existentes, no las reemplaza
 */

/**
 * Enriquecer datos del webhook con URLs permanentes para GoHighLevel
 * Esta función se debe llamar ANTES de enviar el webhook a Albato
 */
export const enhanceWebhookDataForGHL = (originalData, req) => {
  try {
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const claimId = originalData.submission_id || originalData.id;
    
    if (!claimId) {
      console.warn('⚠️ No se encontró ID del claim para generar URLs de GHL');
      return originalData;
    }
    
    console.log(`🔗 Generando URLs de GHL para claim: ${claimId}`);
    
    // Datos mejorados para GoHighLevel (mantener todos los originales)
    const enhancedData = {
      ...originalData, // MANTENER todos los datos existentes
      
      // AGREGAR: URLs permanentes para GoHighLevel
      ghl_document_urls: {
        // URLs que GHL puede usar directamente - siempre funcionan
        solicitud_programacion: `${baseUrl}/api/ghl/file/${claimId}/solicitud-programacion-axa/7._Estudios_de_Laboratorio.pdf`,
        informe_medico: `${baseUrl}/api/ghl/file/${claimId}/informe-medico/7._Estudios_de_Laboratorio.pdf`,
        bitacora_medico: `${baseUrl}/api/ghl/file/${claimId}/bitacora-medico/7._Estudios_de_Laboratorio.pdf`,
        interpretacion_estudios: `${baseUrl}/api/ghl/file/${claimId}/interpretacion-estudios-terapia/7._Estudios_de_Laboratorio.pdf`,
        aviso_accidente: `${baseUrl}/api/ghl/file/${claimId}/aviso-accidente-enfermedad/7._Estudios_de_Laboratorio.pdf`,
        formato_reembolso: `${baseUrl}/api/ghl/file/${claimId}/formato-reembolso/7._Estudios_de_Laboratorio.pdf`,
        formato_bancario: `${baseUrl}/api/ghl/file/${claimId}/formato-unico-bancario/7._Estudios_de_Laboratorio.pdf`,
        estado_cuenta: `${baseUrl}/api/ghl/file/${claimId}/estado-cuenta/7._Estudios_de_Laboratorio.pdf`
      },
      
      // AGREGAR: URL para listar todos los archivos
      ghl_files_list_url: `${baseUrl}/api/ghl/claim/${claimId}/files`,
      
      // AGREGAR: URLs de información para debugging
      ghl_info_urls: {
        solicitud_info: `${baseUrl}/api/ghl/info/${claimId}/solicitud-programacion-axa/7._Estudios_de_Laboratorio.pdf`,
        informe_info: `${baseUrl}/api/ghl/info/${claimId}/informe-medico/7._Estudios_de_Laboratorio.pdf`,
        health_check: `${baseUrl}/api/ghl/health`
      },
      
      // AGREGAR: Información adicional para GHL
      ghl_integration: {
        version: '1.0.0',
        total_document_urls: 8,
        access_method: "permanent_urls",
        description: "URLs que siempre funcionan - generan enlaces frescos automáticamente",
        documentation: "Usar ghl_document_urls para acceso directo a archivos",
        last_updated: new Date().toISOString(),
        claim_id: claimId,
        base_url: baseUrl
      }
    };
    
    console.log(`✅ Datos enriquecidos para GHL - Claim: ${claimId}`);
    console.log(`📋 URLs generadas: ${Object.keys(enhancedData.ghl_document_urls).length}`);
    
    return enhancedData;
    
  } catch (error) {
    console.error('❌ Error enriqueciendo datos para GHL:', error);
    // Si hay error, devolver datos originales para no romper el webhook
    return originalData;
  }
};

/**
 * Función para validar que las URLs de GHL estén correctamente formateadas
 */
export const validateGHLUrls = (enhancedData) => {
  try {
    const { ghl_document_urls, ghl_files_list_url, ghl_integration } = enhancedData;
    
    const validationResults = {
      valid: true,
      errors: [],
      warnings: [],
      urlsCount: 0
    };
    
    // Validar URLs de documentos
    if (ghl_document_urls && typeof ghl_document_urls === 'object') {
      const urls = Object.values(ghl_document_urls);
      validationResults.urlsCount = urls.length;
      
      urls.forEach((url, index) => {
        if (typeof url !== 'string' || !url.startsWith('http')) {
          validationResults.valid = false;
          validationResults.errors.push(`URL inválida en posición ${index}: ${url}`);
        }
      });
    } else {
      validationResults.valid = false;
      validationResults.errors.push('ghl_document_urls no encontrado o no es un objeto');
    }
    
    // Validar URL de lista de archivos
    if (!ghl_files_list_url || !ghl_files_list_url.startsWith('http')) {
      validationResults.valid = false;
      validationResults.errors.push('ghl_files_list_url inválida');
    }
    
    // Validar información de integración
    if (!ghl_integration || !ghl_integration.claim_id) {
      validationResults.warnings.push('Información de integración GHL incompleta');
    }
    
    if (validationResults.valid) {
      console.log(`✅ Validación GHL exitosa - ${validationResults.urlsCount} URLs válidas`);
    } else {
      console.error('❌ Errores en validación GHL:', validationResults.errors);
    }
    
    return validationResults;
    
  } catch (error) {
    console.error('❌ Error en validación GHL:', error);
    return {
      valid: false,
      errors: [`Error de validación: ${error.message}`],
      warnings: [],
      urlsCount: 0
    };
  }
};

/**
 * Función de ejemplo de cómo integrar en el webhook existente
 */
export const exampleWebhookIntegration = async (originalClaimData, req, res) => {
  try {
    console.log('🚀 Procesando webhook con mejoras GHL...');
    
    // 1. Enriquecer datos con URLs de GHL
    const enhancedData = enhanceWebhookDataForGHL(originalClaimData, req);
    
    // 2. Validar URLs generadas
    const validation = validateGHLUrls(enhancedData);
    
    if (!validation.valid) {
      console.warn('⚠️ Validación GHL falló, enviando datos originales');
      // Continuar con datos originales si hay problemas
    }
    
    // 3. Enviar a Albato (con datos mejorados)
    const albato_response = await fetch(process.env.ALBATO_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(enhancedData) // Datos mejorados con URLs de GHL
    });
    
    if (!albato_response.ok) {
      throw new Error(`Error enviando a Albato: ${albato_response.status}`);
    }
    
    console.log('✅ Webhook enviado exitosamente a Albato/GHL');
    console.log(`📊 Datos incluidos: ${validation.urlsCount} URLs de documentos`);
    
    // 4. Responder al cliente
    res.json({
      success: true,
      message: 'Webhook procesado exitosamente',
      ghl_integration: {
        enabled: true,
        urls_generated: validation.urlsCount,
        validation_passed: validation.valid
      },
      claim_id: enhancedData.ghl_integration?.claim_id
    });
    
  } catch (error) {
    console.error('❌ Error en webhook con integración GHL:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      ghl_integration: {
        enabled: false,
        error: 'Failed to enhance data for GHL'
      }
    });
  }
};

// Ejemplo de datos que llegarán a GoHighLevel después de la mejora
export const exampleEnhancedDataForGHL = {
  // ... todos los campos originales del webhook ...
  submission_id: "5b46bd8c-d0ab-415e-b957-a507b5e09b7d",
  contact_info: {
    nombres: "Juan",
    apellido_paterno: "Pérez",
    // ... resto de datos de contacto ...
  },
  
  // NUEVOS campos para GoHighLevel:
  ghl_document_urls: {
    solicitud_programacion: "https://tudominio.com/api/ghl/file/5b46bd8c-d0ab-415e-b957-a507b5e09b7d/solicitud-programacion-axa/7._Estudios_de_Laboratorio.pdf",
    informe_medico: "https://tudominio.com/api/ghl/file/5b46bd8c-d0ab-415e-b957-a507b5e09b7d/informe-medico/7._Estudios_de_Laboratorio.pdf",
    bitacora_medico: "https://tudominio.com/api/ghl/file/5b46bd8c-d0ab-415e-b957-a507b5e09b7d/bitacora-medico/7._Estudios_de_Laboratorio.pdf",
    interpretacion_estudios: "https://tudominio.com/api/ghl/file/5b46bd8c-d0ab-415e-b957-a507b5e09b7d/interpretacion-estudios-terapia/7._Estudios_de_Laboratorio.pdf"
  },
  ghl_files_list_url: "https://tudominio.com/api/ghl/claim/5b46bd8c-d0ab-415e-b957-a507b5e09b7d/files",
  ghl_integration: {
    version: '1.0.0',
    total_document_urls: 8,
    access_method: "permanent_urls",
    description: "URLs que siempre funcionan - generan enlaces frescos automáticamente",
    claim_id: "5b46bd8c-d0ab-415e-b957-a507b5e09b7d",
    last_updated: "2025-01-20T20:30:00.000Z"
  }
};