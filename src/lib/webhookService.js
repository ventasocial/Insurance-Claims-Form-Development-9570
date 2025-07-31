import supabase from './supabase';

/** * Servicio para manejar webhooks - Implementación directa sin Edge Functions */
export class WebhookService {
  /** * Dispara todos los webhooks activos para un evento específico * @param {string} event - El evento que disparó el webhook * @param {Object} data - Los datos a enviar en el webhook */
  static async triggerWebhooks(event, data) {
    try {
      console.log(`🚀 Triggering webhooks for event: ${event}`);
      console.log('📦 Data to send:', data);

      // Obtener todos los webhooks activos que escuchan este evento
      const { data: webhooks, error } = await supabase
        .from('webhooks_r2x4')
        .select('*')
        .eq('enabled', true)
        .contains('trigger_events', [event]);

      if (error) {
        console.error('❌ Error fetching webhooks:', error);
        return;
      }

      if (!webhooks || webhooks.length === 0) {
        console.log(`⚠️ No active webhooks found for event: ${event}`);
        return;
      }

      console.log(`✅ Found ${webhooks.length} active webhooks for event: ${event}`);

      // Preparar el payload del webhook
      const payload = {
        event: event,
        timestamp: new Date().toISOString(),
        data: data
      };

      console.log('📤 Final payload being sent:', JSON.stringify(payload, null, 2));

      // Disparar cada webhook directamente (sin Edge Functions)
      const webhookPromises = webhooks.map(webhook =>
        this.sendWebhook(webhook, payload)
      );

      const results = await Promise.allSettled(webhookPromises);

      // Log results
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`✅ Webhook ${webhooks[index].name} sent successfully`);
        } else {
          console.error(`❌ Webhook ${webhooks[index].name} failed:`, result.reason);
        }
      });

      console.log(`🎉 Webhooks triggered for event: ${event}`);
    } catch (error) {
      console.error('💥 Error triggering webhooks:', error);
    }
  }

  /** * Valida si una URL es de Albato * @param {string} url - URL a validar */
  static isAlbatoUrl(url) {
    return url && (url.includes('albato.com') || url.includes('h.albato.com'));
  }

  /** * Envía un webhook directamente * @param {Object} webhook - Configuración del webhook * @param {Object} payload - Datos a enviar */
  static async sendWebhook(webhook, payload) {
    try {
      console.log(`📡 Sending webhook to: ${webhook.name} (${webhook.url})`);
      console.log(`📋 Payload being sent:`, JSON.stringify(payload, null, 2));

      // Headers básicos y compatibles con Albato
      let headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      // Añadir headers específicos para Albato
      if (this.isAlbatoUrl(webhook.url)) {
        headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Fortex-Webhook/1.0'
        };
        console.log('🔗 Using Albato-compatible headers');
      } else {
        // Para URLs que no son de Albato, podemos usar headers adicionales
        headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Fortex-Webhook/1.0',
          'X-Webhook-Event': payload.event || 'unknown',
          'X-Webhook-Source': 'fortex-claims-portal'
        };
      }

      // Parsear headers personalizados de manera segura
      try {
        const customHeaders = webhook.headers ? JSON.parse(webhook.headers) : {};
        // Solo añadir headers personalizados si no es Albato
        if (!this.isAlbatoUrl(webhook.url)) {
          headers = { ...headers, ...customHeaders };
        } else {
          // Para Albato, solo permitir headers básicos
          const allowedHeaders = ['Content-Type', 'Accept', 'User-Agent', 'Authorization'];
          Object.keys(customHeaders).forEach(key => {
            if (allowedHeaders.includes(key)) {
              headers[key] = customHeaders[key];
            }
          });
        }
      } catch (e) {
        console.warn('⚠️ Invalid headers JSON, using default headers:', e);
      }

      // Crear un controlador de aborto para el timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 30000); // 30 segundos de timeout

      console.log('📤 Making HTTP request...');
      console.log('📋 Headers being sent:', JSON.stringify(headers, null, 2));

      // Enviar la petición
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Procesar la respuesta
      const responseText = await response.text();
      const success = response.ok;
      const statusCode = response.status;

      console.log(`📥 Response received: ${statusCode} - ${responseText.substring(0, 200)}`);

      // Registrar el resultado del webhook con manejo de errores mejorado
      try {
        await this.logWebhookResult(
          webhook.id,
          payload,
          success,
          statusCode,
          responseText
        );
      } catch (logError) {
        console.error('💥 Error logging webhook result (but webhook was sent):', logError);
        // No lanzar error aquí para no afectar el envío principal
      }

      return { success, statusCode, responseText };
    } catch (error) {
      console.error(`💥 Error sending webhook to ${webhook.name}:`, error);

      // Registrar el error con manejo de errores mejorado
      try {
        await this.logWebhookResult(
          webhook.id,
          payload,
          false,
          error.name === 'AbortError' ? 408 : 0,
          error.message
        );
      } catch (logError) {
        console.error('💥 Error logging webhook error:', logError);
      }

      throw error;
    }
  }

  /** * Prueba la conectividad con una URL de webhook * @param {string} url - URL a probar */
  static async testConnectivity(url) {
    try {
      console.log(`🔍 Testing connectivity to: ${url}`);

      // Payload de prueba simple
      const testPayload = {
        event: 'connectivity_test',
        timestamp: new Date().toISOString(),
        data: {
          test: true,
          message: 'Test de conectividad desde Fortex',
          source: 'fortex-claims-portal'
        }
      };

      // Headers básicos y compatibles
      let headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      // Añadir headers específicos para Albato
      const isAlbato = this.isAlbatoUrl(url);
      if (isAlbato) {
        headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Fortex-Webhook-Test/1.0'
        };
        console.log('🔗 Using Albato-compatible headers for test');
      } else {
        headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Fortex-Webhook-Test/1.0',
          'X-Test-Request': 'true',
          'X-Webhook-Source': 'fortex-claims-portal'
        };
      }

      // Crear un controlador de aborto para el timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 15000); // 15 segundos de timeout para pruebas

      // Enviar la petición
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(testPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Procesar la respuesta
      const responseText = await response.text();
      const success = response.ok;
      const statusCode = response.status;

      return {
        success,
        status: statusCode,
        statusText: responseText || 'OK',
        method: 'direct-request',
        is_albato: isAlbato
      };
    } catch (error) {
      console.error('💥 Connectivity test failed:', error);

      return {
        success: false,
        error: error.message,
        type: error.name,
        method: 'failed'
      };
    }
  }

  /** * Prueba un webhook con datos completos * @param {Object} webhook - Configuración del webhook */
  static async testWebhookComplete(webhook) {
    try {
      console.log(`🧪 Testing webhook: ${webhook.name} (${webhook.url})`);

      // Datos de prueba que simularían un reclamo real
      const testData = {
        submission_id: 'test-' + Date.now(),
        contact_info: {
          nombres: 'Juan',
          apellido_paterno: 'Pérez',
          apellido_materno: 'García',
          email: 'juan.perez@example.com',
          telefono: '+528122334455',
          full_name: 'Juan Pérez García'
        },
        claim_info: {
          insurance_company: 'gnp',
          claim_type: 'reembolso',
          reimbursement_type: 'inicial',
          service_types: ['hospital', 'medicamentos']
        },
        persons_involved: {
          titular_asegurado: {
            nombres: 'Juan',
            apellido_paterno: 'Pérez',
            apellido_materno: 'García',
            email: 'juan.perez@example.com',
            telefono: '+528122334455',
            full_name: 'Juan Pérez García'
          },
          asegurado_afectado: {
            nombres: 'María',
            apellido_paterno: 'Pérez',
            apellido_materno: 'López',
            email: 'maria.perez@example.com',
            telefono: '+528122334456',
            full_name: 'María Pérez López'
          }
        },
        sinister_description: 'Descripción de prueba del siniestro para verificar el webhook',
        documents_info: {
          uploaded_documents_count: 5,
          document_urls: {
            'informe-medico': [
              {
                name: 'informe-medico-test.pdf',
                type: 'application/pdf',
                size: 1024000,
                url: `${supabase.supabaseUrl}/storage/v1/object/public/claims/test-${Date.now()}/informe-medico/informe-medico-test.pdf`
              }
            ]
          }
        },
        metadata: {
          created_at: new Date().toISOString(),
          status: 'Test',
          source: 'fortex_claims_portal'
        }
      };

      const payload = {
        event: 'test_webhook',
        timestamp: new Date().toISOString(),
        data: testData
      };

      console.log('🧪 Test payload prepared:', JSON.stringify(payload, null, 2));

      // Enviar el webhook de prueba
      const result = await this.sendWebhook(webhook, payload);

      return {
        success: result.success,
        message: `Test completado con status ${result.statusCode}`,
        method: 'direct-request'
      };
    } catch (error) {
      console.error('💥 Complete webhook test failed:', error);

      return {
        success: false,
        error: error.message,
        method: 'failed'
      };
    }
  }

  /** * Reenvía manualmente un webhook fallido * @param {string} logId - ID del log del webhook fallido */
  static async manualRetry(logId) {
    try {
      // Obtener el log del webhook fallido
      const { data: log, error: logError } = await supabase
        .from('webhook_logs_r2x4')
        .select('*')
        .eq('id', logId)
        .single();

      if (logError || !log) {
        throw new Error('Log not found');
      }

      // Obtener la configuración del webhook
      const { data: webhook, error: webhookError } = await supabase
        .from('webhooks_r2x4')
        .select('*')
        .eq('id', log.webhook_id)
        .single();

      if (webhookError || !webhook) {
        throw new Error('Webhook not found');
      }

      if (!webhook.enabled) {
        throw new Error('Webhook is disabled');
      }

      // Parsear el payload original de manera segura
      let payload;
      try {
        payload = JSON.parse(log.payload || log.request_payload || '{}');
      } catch (e) {
        throw new Error('Invalid payload JSON in log');
      }

      // Actualizar el retry count
      payload.retry_count = (log.retry_count || 0) + 1;

      // Enviar el webhook
      await this.sendWebhook(webhook, payload);

      return { success: true, message: 'Webhook retry initiated' };
    } catch (error) {
      console.error('Error in manual retry:', error);
      return { success: false, message: error.message };
    }
  }

  /** * Registra el resultado de un webhook en la base de datos * @param {string} webhookId - ID del webhook * @param {Object} payload - Datos enviados * @param {boolean} success - Si fue exitoso * @param {number} statusCode - Código de estado HTTP * @param {string} responseBody - Cuerpo de la respuesta */
  static async logWebhookResult(webhookId, payload, success, statusCode, responseBody) {
    try {
      // Preparar datos de log con validación
      const logData = {
        webhook_id: webhookId,
        event: payload.event || 'unknown',
        status_code: statusCode || 0,
        success: success === true, // Asegurar que sea boolean
        response_body: responseBody ? responseBody.substring(0, 5000) : '', // Limitar tamaño
        payload: JSON.stringify(payload).substring(0, 10000), // Limitar tamaño del payload
        sent_at: new Date().toISOString(),
        retry_count: payload.retry_count || 0
      };

      console.log('📝 Attempting to log webhook result:', {
        webhook_id: logData.webhook_id,
        event: logData.event,
        success: logData.success,
        status_code: logData.status_code,
        payload_size: logData.payload.length,
        response_size: logData.response_body.length
      });

      const { error } = await supabase
        .from('webhook_logs_r2x4')
        .insert([logData]);

      if (error) {
        console.error('💥 Error logging webhook result:', error);
        console.error('💥 Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });

        // Intentar con datos simplificados si hay error
        const simplifiedLogData = {
          webhook_id: webhookId,
          event: payload.event || 'unknown',
          status_code: statusCode || 0,
          success: success === true,
          response_body: responseBody ? 'Response received' : 'No response',
          payload: JSON.stringify({ event: payload.event, timestamp: payload.timestamp }),
          sent_at: new Date().toISOString(),
          retry_count: 0
        };

        console.log('🔄 Retrying with simplified data...');

        const { error: retryError } = await supabase
          .from('webhook_logs_r2x4')
          .insert([simplifiedLogData]);

        if (retryError) {
          console.error('💥 Failed to log even simplified data:', retryError);
        } else {
          console.log('✅ Logged simplified webhook result');
        }
      } else {
        console.log(`📝 Logged webhook result: ${success ? 'SUCCESS' : 'FAILED'} (${statusCode})`);
      }
    } catch (error) {
      console.error('💥 Error in logWebhookResult function:', error);
    }
  }

  /** * Obtiene las URLs públicas de los documentos subidos a Supabase Storage * @param {string} submissionId - ID de la submisión * @param {Object} documents - Objeto con documentos del formulario * @returns {Promise<Object>} - Objeto con las URLs públicas de los documentos */
  static async getDocumentPublicUrls(submissionId, documents) {
    try {
      if (!documents || Object.keys(documents).length === 0) {
        return {};
      }

      const result = {};

      // Procesar cada tipo de documento
      for (const docType in documents) {
        if (!Array.isArray(documents[docType]) || documents[docType].length === 0) {
          continue;
        }

        result[docType] = [];

        // Para cada documento del tipo, obtener su URL pública
        for (const doc of documents[docType]) {
          // Si ya tenemos una URL (archivo local), construir la URL de Supabase
          if (doc.url && doc.isLocal) {
            // Construir la URL usando la estructura correcta del bucket
            const publicUrl = `${supabase.supabaseUrl}/storage/v1/object/public/claims/${submissionId}/${docType}/${doc.name}`;
            
            result[docType].push({
              name: doc.name,
              type: doc.type,
              size: doc.size,
              url: publicUrl
            });
          }
          // Si es una URL de Supabase Storage
          else if (doc.path) {
            const { data: publicUrl } = supabase.storage
              .from('claims')
              .getPublicUrl(`${submissionId}/${docType}/${doc.path}`);

            result[docType].push({
              name: doc.name || doc.path.split('/').pop(),
              type: doc.type || 'application/octet-stream',
              size: doc.size || 0,
              url: publicUrl.publicUrl
            });
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Error getting document public URLs:', error);
      return {};
    }
  }

  /** * Transforma los datos del formulario para el webhook * @param {Object} formData - Datos del formulario * @param {string} submissionId - ID de la submisión */
  static async transformFormDataForWebhook(formData, submissionId) {
    console.log('🔄 Transforming form data for webhook...');
    console.log('📋 Original form data:', formData);

    // Obtener URLs públicas de los documentos
    const documentUrls = await this.getDocumentPublicUrls(submissionId, formData.documents);

    const transformedData = {
      submission_id: submissionId,
      // Información de contacto
      contact_info: {
        nombres: formData.contactInfo?.nombres,
        apellido_paterno: formData.contactInfo?.apellidoPaterno,
        apellido_materno: formData.contactInfo?.apellidoMaterno,
        email: formData.contactInfo?.email,
        telefono: formData.contactInfo?.telefono,
        full_name: `${formData.contactInfo?.nombres || ''} ${formData.contactInfo?.apellidoPaterno || ''} ${formData.contactInfo?.apellidoMaterno || ''}`.trim()
      },
      // Información del reclamo
      claim_info: {
        insurance_company: formData.insuranceCompany,
        claim_type: formData.claimType,
        reimbursement_type: formData.reimbursementType,
        claim_number: formData.claimNumber,
        service_types: formData.serviceTypes || [],
        programming_service: formData.programmingService,
        surgery_type: formData.isCirugiaOrtopedica ? 'traumatologia_ortopedia_neurologia' : 'other'
      },
      // Personas involucradas
      persons_involved: {
        titular_asegurado: this.transformPersonData(formData.personsInvolved?.titularAsegurado),
        asegurado_afectado: this.transformPersonData(formData.personsInvolved?.aseguradoAfectado),
        titular_cuenta: this.transformPersonData(formData.personsInvolved?.titularCuenta)
      },
      // Descripción del siniestro
      sinister_description: formData.sinisterDescription,
      // Información de documentos
      documents_info: {
        signature_option: formData.signatureDocumentOption,
        documents_sent_by_email: formData.documentsSentByEmail,
        uploaded_documents_count: this.countUploadedDocuments(formData.documents),
        document_urls: documentUrls // Incluir URLs de los documentos
      },
      // Términos y condiciones
      legal_acceptance: {
        accepted_terms: formData.acceptedTerms,
        accepted_privacy: formData.acceptedPrivacy
      },
      // Metadatos
      metadata: {
        created_at: new Date().toISOString(),
        status: 'Enviado',
        source: 'fortex_claims_portal',
        bucket_base_url: `${supabase.supabaseUrl}/storage/v1/object/public/claims/${submissionId}`
      }
    };

    console.log('✅ Transformed data for webhook:', transformedData);
    return transformedData;
  }

  /** * Transforma los datos de una persona para el webhook * @param {Object} personData - Datos de la persona */
  static transformPersonData(personData) {
    if (!personData) return null;

    return {
      nombres: personData.nombres,
      apellido_paterno: personData.apellidoPaterno,
      apellido_materno: personData.apellidoMaterno,
      email: personData.email,
      telefono: personData.telefono,
      full_name: `${personData.nombres || ''} ${personData.apellidoPaterno || ''} ${personData.apellidoMaterno || ''}`.trim()
    };
  }

  /** * Cuenta los documentos subidos * @param {Object} documents - Objeto con documentos */
  static countUploadedDocuments(documents) {
    if (!documents) return 0;

    let count = 0;
    Object.values(documents).forEach(docArray => {
      if (Array.isArray(docArray)) {
        count += docArray.length;
      }
    });

    return count;
  }
}

export default WebhookService;