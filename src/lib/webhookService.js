import supabase from './supabase';

/**
 * Servicio para manejar webhooks
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

      // Disparar cada webhook
      const webhookPromises = webhooks.map(webhook => 
        this.sendWebhook(webhook, payload)
      );

      await Promise.allSettled(webhookPromises);
      console.log(`Webhooks triggered for event: ${event}`);
    } catch (error) {
      console.error('Error triggering webhooks:', error);
    }
  }

  /**
   * Envía un webhook individual
   * @param {Object} webhook - Configuración del webhook
   * @param {Object} payload - Datos a enviar
   */
  static async sendWebhook(webhook, payload) {
    try {
      console.log(`Sending webhook to: ${webhook.name} (${webhook.url})`);
      
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Fortex-Webhook/1.0',
        'X-Webhook-Event': payload.event,
        'X-Webhook-Timestamp': payload.timestamp,
        ...JSON.parse(webhook.headers || '{}')
      };

      // Usar AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      let responseBody = null;
      let success = response.ok;

      // Leer la respuesta solo si hay error
      if (!response.ok) {
        try {
          responseBody = await response.text();
        } catch (e) {
          responseBody = `Failed to read response: ${e.message}`;
        }
      }

      // Log del resultado del webhook
      const logData = {
        webhook_id: webhook.id,
        event: payload.event,
        status_code: response.status,
        success: success,
        response_body: responseBody,
        payload: JSON.stringify(payload),
        sent_at: new Date().toISOString(),
        retry_count: 0
      };

      // Guardar log en la base de datos
      await supabase
        .from('webhook_logs_r2x4')
        .insert([logData]);

      if (!response.ok) {
        console.error(`Webhook failed for ${webhook.name}: ${response.status} ${response.statusText}`);
        console.error('Response body:', responseBody);
        
        // Programar reintento automático
        await this.scheduleRetry(webhook, payload, 1);
      } else {
        console.log(`Webhook sent successfully to ${webhook.name}`);
      }

    } catch (error) {
      console.error(`Error sending webhook to ${webhook.name}:`, error);
      
      let errorMessage = error.message;
      let statusCode = 0;

      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout (30s)';
        statusCode = 408;
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Network error or invalid URL';
        statusCode = 0;
      }

      // Log del error
      const logData = {
        webhook_id: webhook.id,
        event: payload.event,
        status_code: statusCode,
        success: false,
        response_body: errorMessage,
        payload: JSON.stringify(payload),
        sent_at: new Date().toISOString(),
        retry_count: 0
      };

      await supabase
        .from('webhook_logs_r2x4')
        .insert([logData]);

      // Programar reintento automático
      await this.scheduleRetry(webhook, payload, 1);
    }
  }

  /**
   * Programa un reintento para un webhook fallido
   * @param {Object} webhook - Configuración del webhook
   * @param {Object} payload - Datos originales
   * @param {number} retryCount - Número de intento
   */
  static async scheduleRetry(webhook, payload, retryCount) {
    const maxRetries = 3;
    
    if (retryCount > maxRetries) {
      console.log(`Max retries reached for webhook ${webhook.name}`);
      return;
    }

    // Delays progresivos: 1min, 5min, 15min
    const delays = [60000, 300000, 900000]; // en milisegundos
    const delay = delays[retryCount - 1] || delays[delays.length - 1];

    console.log(`Scheduling retry ${retryCount} for webhook ${webhook.name} in ${delay/1000} seconds`);

    setTimeout(async () => {
      await this.retryWebhook(webhook, payload, retryCount);
    }, delay);
  }

  /**
   * Reintenta enviar un webhook
   * @param {Object} webhook - Configuración del webhook
   * @param {Object} payload - Datos originales
   * @param {number} retryCount - Número de intento
   */
  static async retryWebhook(webhook, payload, retryCount) {
    try {
      console.log(`Retrying webhook ${webhook.name} (attempt ${retryCount})`);
      
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Fortex-Webhook/1.0',
        'X-Webhook-Event': payload.event,
        'X-Webhook-Timestamp': payload.timestamp,
        'X-Webhook-Retry': retryCount.toString(),
        ...JSON.parse(webhook.headers || '{}')
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      let responseBody = null;
      let success = response.ok;

      if (!response.ok) {
        try {
          responseBody = await response.text();
        } catch (e) {
          responseBody = `Failed to read response: ${e.message}`;
        }
      }

      // Log del resultado del reintento
      const logData = {
        webhook_id: webhook.id,
        event: payload.event,
        status_code: response.status,
        success: success,
        response_body: responseBody,
        payload: JSON.stringify(payload),
        sent_at: new Date().toISOString(),
        retry_count: retryCount
      };

      await supabase
        .from('webhook_logs_r2x4')
        .insert([logData]);

      if (!response.ok) {
        console.error(`Webhook retry ${retryCount} failed for ${webhook.name}: ${response.status}`);
        // Programar siguiente reintento
        await this.scheduleRetry(webhook, payload, retryCount + 1);
      } else {
        console.log(`Webhook retry ${retryCount} successful for ${webhook.name}`);
      }

    } catch (error) {
      console.error(`Error in webhook retry ${retryCount} for ${webhook.name}:`, error);
      
      let errorMessage = error.message;
      let statusCode = 0;

      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout (30s)';
        statusCode = 408;
      }

      const logData = {
        webhook_id: webhook.id,
        event: payload.event,
        status_code: statusCode,
        success: false,
        response_body: errorMessage,
        payload: JSON.stringify(payload),
        sent_at: new Date().toISOString(),
        retry_count: retryCount
      };

      await supabase
        .from('webhook_logs_r2x4')
        .insert([logData]);

      // Programar siguiente reintento
      await this.scheduleRetry(webhook, payload, retryCount + 1);
    }
  }

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

      // Parsear el payload original
      const payload = JSON.parse(log.payload);

      // Enviar el webhook
      await this.retryWebhook(webhook, payload, (log.retry_count || 0) + 1);

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