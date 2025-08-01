import supabase from './supabase';
import { generateSecureFileUrl } from '../utils/secureFiles';

/**
 * Servicio para manejar webhooks - Implementación directa sin Edge Functions
 */
export class WebhookService {
  /**
   * Dispara todos los webhooks activos para un evento específico
   * @param {string} event - El evento que disparó el webhook
   * @param {Object} data - Los datos a enviar en el webhook
   */
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

      // Disparar cada webhook directamente
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

  /**
   * Valida si una URL es de Albato
   * @param {string} url - URL a validar
   */
  static isAlbatoUrl(url) {
    return url && (url.includes('albato.com') || url.includes('h.albato.com'));
  }

  /**
   * Envía un webhook directamente
   * @param {Object} webhook - Configuración del webhook
   * @param {Object} payload - Datos a enviar
   */
  static async sendWebhook(webhook, payload) {
    try {
      console.log(`📡 Sending webhook to: ${webhook.name} (${webhook.url})`);

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

      // Registrar el resultado del webhook
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
      }

      return { success, statusCode, responseText };
    } catch (error) {
      console.error(`💥 Error sending webhook to ${webhook.name}:`, error);

      // Registrar el error
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

  /**
   * Prueba la conectividad con una URL de webhook
   * @param {string} url - URL a probar
   */
  static async testConnectivity(url) {
    try {
      console.log(`🔍 Testing connectivity to: ${url}`);

      const testPayload = {
        event: 'connectivity_test',
        timestamp: new Date().toISOString(),
        data: {
          test: true,
          message: 'Test de conectividad desde Fortex',
          source: 'fortex-claims-portal'
        }
      };

      // Headers básicos
      let headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      const isAlbato = this.isAlbatoUrl(url);
      if (isAlbato) {
        headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Fortex-Webhook-Test/1.0'
        };
      } else {
        headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Fortex-Webhook-Test/1.0',
          'X-Test-Request': 'true',
          'X-Webhook-Source': 'fortex-claims-portal'
        };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 15000); // 15 segundos para pruebas

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(testPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

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

  /**
   * Prueba un webhook con datos completos
   * @param {Object} webhook - Configuración del webhook
   */
  static async testWebhookComplete(webhook) {
    try {
      console.log(`🧪 Testing webhook: ${webhook.name} (${webhook.url})`);

      // Datos de prueba
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
        event: payload.event || 'unknown',
        status_code: statusCode || 0,
        success: success === true,
        response_body: responseBody ? responseBody.substring(0, 5000) : '',
        payload: JSON.stringify(payload).substring(0, 10000),
        sent_at: new Date().toISOString(),
        retry_count: payload.retry_count || 0
      };

      const { error } = await supabase
        .from('webhook_logs_r2x4')
        .insert([logData]);

      if (error) {
        console.error('💥 Error logging webhook result:', error);
      } else {
        console.log(`📝 Logged webhook result: ${success ? 'SUCCESS' : 'FAILED'} (${statusCode})`);
      }
    } catch (error) {
      console.error('💥 Error in logWebhookResult function:', error);
    }
  }

  /**
   * Transforma los datos del formulario para el webhook
   * @param {Object} formData - Datos del formulario
   * @param {string} submissionId - ID de la submisión
   */
  static async transformFormDataForWebhook(formData, submissionId) {
    console.log('🔄 Transforming form data for webhook...');

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
        uploaded_documents_count: this.countUploadedDocuments(formData.documents)
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
        source: 'fortex_claims_portal'
      }
    };

    console.log('✅ Transformed data for webhook:', transformedData);
    return transformedData;
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