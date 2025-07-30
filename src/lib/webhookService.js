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
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Fortex-Webhook/1.0',
        'X-Webhook-Event': payload.event,
        'X-Webhook-Timestamp': payload.timestamp,
        ...JSON.parse(webhook.headers || '{}')
      };

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });

      // Log del resultado del webhook
      const logData = {
        webhook_id: webhook.id,
        event: payload.event,
        status_code: response.status,
        success: response.ok,
        response_body: response.ok ? null : await response.text(),
        sent_at: new Date().toISOString()
      };

      // Guardar log en la base de datos
      await supabase
        .from('webhook_logs_r2x4')
        .insert([logData]);

      if (!response.ok) {
        console.error(`Webhook failed for ${webhook.name}: ${response.status} ${response.statusText}`);
      } else {
        console.log(`Webhook sent successfully to ${webhook.name}`);
      }

    } catch (error) {
      console.error(`Error sending webhook to ${webhook.name}:`, error);
      
      // Log del error
      await supabase
        .from('webhook_logs_r2x4')
        .insert([{
          webhook_id: webhook.id,
          event: payload.event,
          status_code: 0,
          success: false,
          response_body: error.message,
          sent_at: new Date().toISOString()
        }]);
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
          // Si ya tenemos una URL (archivo local), la usamos directamente
          if (doc.url && doc.isLocal) {
            // En este caso, no tenemos la URL de Supabase porque el archivo está almacenado localmente
            // en una implementación real, aquí buscaríamos la URL en Storage basada en alguna convención de nombres
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