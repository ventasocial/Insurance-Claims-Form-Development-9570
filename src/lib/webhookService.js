import supabase from './supabase';

/**
 * Servicio para manejar webhooks - Optimizado para Albato con solución CORS
 */
export class WebhookService {
  /**
   * Dispara todos los webhooks activos para un evento específico
   * @param {string} event - El evento que disparó el webhook
   * @param {Object} data - Los datos a enviar en el webhook
   */
  static async triggerWebhooks(event, data) {
    try {
      console.log(`Triggering webhooks for event: ${event}`);
      
      // Obtener todos los webhooks activos que escuchan este evento
      const { data: webhooks, error } = await supabase
        .from('webhooks_r2x4')
        .select('*')
        .eq('enabled', true)
        .contains('trigger_events', [event]);

      if (error) {
        console.error('Error fetching webhooks:', error);
        return;
      }

      if (!webhooks || webhooks.length === 0) {
        console.log(`No active webhooks found for event: ${event}`);
        return;
      }

      console.log(`Found ${webhooks.length} active webhooks for event: ${event}`);

      // Preparar el payload del webhook
      const payload = {
        event: event,
        timestamp: new Date().toISOString(),
        data: data
      };

      // Disparar cada webhook usando la función Edge de Supabase
      const webhookPromises = webhooks.map(webhook => 
        this.sendWebhookViaEdgeFunction(webhook, payload)
      );

      await Promise.allSettled(webhookPromises);
      console.log(`Webhooks triggered for event: ${event}`);
    } catch (error) {
      console.error('Error triggering webhooks:', error);
    }
  }

  /**
   * Valida si una URL es de Albato
   * @param {string} url - URL a validar
   */
  static isAlbatoUrl(url) {
    return url && (url.includes('albato.com') || url.includes('h.albato.com'));
  }

  /**
   * Envía un webhook usando la función Edge de Supabase para evitar CORS
   * @param {Object} webhook - Configuración del webhook
   * @param {Object} payload - Datos a enviar
   */
  static async sendWebhookViaEdgeFunction(webhook, payload) {
    try {
      console.log(`Sending webhook via Edge Function to: ${webhook.name} (${webhook.url})`);
      
      // Parsear headers de manera segura
      let parsedHeaders = {};
      try {
        parsedHeaders = webhook.headers ? JSON.parse(webhook.headers) : {};
      } catch (e) {
        console.warn('Invalid headers JSON, using empty object:', e);
        parsedHeaders = {};
      }

      // Preparar datos para la función Edge
      const edgeFunctionPayload = {
        webhook_url: webhook.url,
        payload: payload,
        headers: parsedHeaders,
        webhook_id: webhook.id,
        is_albato: this.isAlbatoUrl(webhook.url)
      };

      // Llamar a la función Edge de Supabase
      const { data, error } = await supabase.functions.invoke('send-webhook', {
        body: edgeFunctionPayload
      });

      if (error) {
        console.error(`Edge function error for webhook ${webhook.name}:`, error);
        
        // Log del error
        await this.logWebhookResult(webhook.id, payload, false, 0, error.message);
        return;
      }

      console.log(`Webhook sent successfully via Edge Function to ${webhook.name}:`, data);
      
      // Log del resultado exitoso
      await this.logWebhookResult(webhook.id, payload, data.success, data.status_code, data.response_body);

    } catch (error) {
      console.error(`Error sending webhook via Edge Function to ${webhook.name}:`, error);
      
      // Log del error
      await this.logWebhookResult(webhook.id, payload, false, 0, error.message);
    }
  }

  /**
   * Envía un webhook directamente (fallback para casos específicos)
   * @param {Object} webhook - Configuración del webhook
   * @param {Object} payload - Datos a enviar
   */
  static async sendWebhookDirect(webhook, payload) {
    try {
      console.log(`Sending webhook directly to: ${webhook.name} (${webhook.url})`);
      
      // Validar URL
      if (!webhook.url || (!webhook.url.startsWith('http://') && !webhook.url.startsWith('https://'))) {
        throw new Error('Invalid webhook URL format');
      }

      const headers = this.prepareHeaders(webhook, payload);

      // Configuración para la petición directa
      const fetchOptions = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
        mode: 'no-cors', // Cambiar a no-cors para evitar problemas de CORS
        credentials: 'omit',
        redirect: 'follow'
      };

      // Usar AbortController para timeout
      const controller = new AbortController();
      const timeoutDuration = this.isAlbatoUrl(webhook.url) ? 45000 : 30000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

      fetchOptions.signal = controller.signal;

      const response = await fetch(webhook.url, fetchOptions);
      clearTimeout(timeoutId);

      // Con mode: 'no-cors', no podemos leer la respuesta, pero podemos detectar si llegó
      const success = true; // Asumimos éxito si no hay error
      const statusCode = response.type === 'opaque' ? 200 : response.status;

      // Log del resultado
      await this.logWebhookResult(webhook.id, payload, success, statusCode, null);

      console.log(`Webhook sent directly to ${webhook.name} (assumed success due to no-cors mode)`);

    } catch (error) {
      console.error(`Error sending webhook directly to ${webhook.name}:`, error);
      
      let errorMessage = error.message;
      let statusCode = 0;

      if (error.name === 'AbortError') {
        errorMessage = `Request timeout (${this.isAlbatoUrl(webhook.url) ? '45' : '30'}s)`;
        statusCode = 408;
      }

      // Log del error
      await this.logWebhookResult(webhook.id, payload, false, statusCode, errorMessage);
    }
  }

  /**
   * Prepara headers específicos para el webhook
   * @param {Object} webhook - Configuración del webhook
   * @param {Object} payload - Datos a enviar
   */
  static prepareHeaders(webhook, payload) {
    // Parsear headers de manera segura
    let parsedHeaders = {};
    try {
      parsedHeaders = webhook.headers ? JSON.parse(webhook.headers) : {};
    } catch (e) {
      console.warn('Invalid headers JSON, using empty object:', e);
      parsedHeaders = {};
    }

    const baseHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Fortex-Webhook/1.0',
      'X-Webhook-Event': payload.event,
      'X-Webhook-Timestamp': payload.timestamp,
      'X-Webhook-Source': 'fortex-claims-portal'
    };

    // Headers específicos para Albato
    if (this.isAlbatoUrl(webhook.url)) {
      baseHeaders['X-Requested-With'] = 'XMLHttpRequest';
      baseHeaders['Cache-Control'] = 'no-cache';
    }

    return { ...baseHeaders, ...parsedHeaders };
  }

  /**
   * Registra el resultado de un webhook en la base de datos
   * @param {string} webhookId - ID del webhook
   * @param {Object} payload - Datos enviados
   * @param {boolean} success - Si fue exitoso
   * @param {number} statusCode - Código de estado HTTP
   * @param {string} responseBody - Cuerpo de la respuesta
   */
  static async logWebhookResult(webhookId, payload, success, statusCode, responseBody) {
    try {
      const logData = {
        webhook_id: webhookId,
        event: payload.event,
        status_code: statusCode,
        success: success,
        response_body: responseBody,
        payload: JSON.stringify(payload),
        sent_at: new Date().toISOString(),
        retry_count: 0
      };

      await supabase
        .from('webhook_logs_r2x4')
        .insert([logData]);
    } catch (error) {
      console.error('Error logging webhook result:', error);
    }
  }

  /**
   * Prueba la conectividad con una URL de webhook usando diferentes métodos
   * @param {string} url - URL a probar
   */
  static async testConnectivity(url) {
    try {
      console.log(`Testing connectivity to: ${url}`);

      // Método 1: Intentar con Edge Function primero
      try {
        const { data, error } = await supabase.functions.invoke('test-webhook-connectivity', {
          body: { webhook_url: url }
        });

        if (!error && data) {
          return {
            success: data.success,
            status: data.status_code || 200,
            statusText: data.response_body || 'OK',
            method: 'edge-function'
          };
        }
      } catch (edgeError) {
        console.warn('Edge function test failed, trying direct method:', edgeError);
      }

      // Método 2: Prueba directa con no-cors (fallback)
      const testPayload = {
        event: 'connectivity_test',
        timestamp: new Date().toISOString(),
        test: true,
        data: {
          message: 'Test de conectividad desde Fortex',
          source: 'fortex-claims-portal'
        }
      };

      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Fortex-Webhook-Test/1.0',
        'X-Test-Request': 'true'
      };

      // Headers específicos para Albato
      if (this.isAlbatoUrl(url)) {
        headers['X-Requested-With'] = 'XMLHttpRequest';
        headers['Cache-Control'] = 'no-cache';
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(testPayload),
        mode: 'no-cors', // Usar no-cors para evitar problemas de CORS
        credentials: 'omit',
        redirect: 'follow',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Con no-cors, response.type será 'opaque' si la petición llegó
      const success = response.type === 'opaque' || response.ok;

      return {
        success: success,
        status: success ? 200 : 0,
        statusText: success ? 'Connection successful (no-cors mode)' : 'Connection failed',
        method: 'direct-no-cors'
      };

    } catch (error) {
      console.error('Connectivity test failed:', error);
      
      return {
        success: false,
        error: error.message,
        type: error.name,
        method: 'failed'
      };
    }
  }

  /**
   * Prueba un webhook con datos completos usando diferentes métodos
   * @param {Object} webhook - Configuración del webhook
   */
  static async testWebhookComplete(webhook) {
    try {
      console.log(`Testing webhook: ${webhook.name} (${webhook.url})`);

      // Datos de prueba que simularían un reclamo real
      const testData = {
        event: 'test_webhook',
        timestamp: new Date().toISOString(),
        data: {
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
          sinister_description: 'Descripción de prueba del siniestro',
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
            status: 'Enviado',
            source: 'fortex_claims_portal'
          }
        }
      };

      // Método 1: Intentar con Edge Function primero
      try {
        const result = await this.sendWebhookViaEdgeFunction(webhook, testData);
        return {
          success: true,
          message: 'Test enviado via Edge Function',
          method: 'edge-function'
        };
      } catch (edgeError) {
        console.warn('Edge function test failed, trying direct method:', edgeError);
      }

      // Método 2: Envío directo con no-cors (fallback)
      await this.sendWebhookDirect(webhook, testData);
      
      return {
        success: true,
        message: 'Test enviado directamente (no-cors mode)',
        method: 'direct-no-cors'
      };

    } catch (error) {
      console.error('Complete webhook test failed:', error);
      
      return {
        success: false,
        error: error.message,
        method: 'failed'
      };
    }
  }

  // ... resto de métodos sin cambios ...

  /**
   * Reenvía manualmente un webhook fallido
   * @param {string} logId - ID del log del webhook fallido
   */
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
        payload = JSON.parse(log.payload);
      } catch (e) {
        throw new Error('Invalid payload JSON in log');
      }

      // Enviar el webhook usando Edge Function
      await this.sendWebhookViaEdgeFunction(webhook, payload);

      return { success: true, message: 'Webhook retry initiated' };
    } catch (error) {
      console.error('Error in manual retry:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Obtiene las URLs públicas de los documentos subidos a Supabase Storage
   * @param {string} submissionId - ID de la submisión
   * @param {Object} documents - Objeto con documentos del formulario
   * @returns {Promise<Object>} - Objeto con las URLs públicas de los documentos
   */
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
            result[docType].push({
              name: doc.name,
              type: doc.type,
              size: doc.size,
              url: `${supabase.supabaseUrl}/storage/v1/object/public/claims/${submissionId}/${docType}/${doc.name}`
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

  /**
   * Transforma los datos del formulario para el webhook
   * @param {Object} formData - Datos del formulario
   * @param {string} submissionId - ID de la submisión
   */
  static async transformFormDataForWebhook(formData, submissionId) {
    // Obtener URLs públicas de los documentos
    const documentUrls = await this.getDocumentPublicUrls(submissionId, formData.documents);

    return {
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
  }

  /**
   * Transforma los datos de una persona para el webhook
   * @param {Object} personData - Datos de la persona
   */
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

  /**
   * Cuenta los documentos subidos
   * @param {Object} documents - Objeto con documentos
   */
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