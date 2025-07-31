import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import InsuranceCompany from '../components/form-steps/InsuranceCompany';
import ClaimType from '../components/form-steps/ClaimType';
import ReimbursementDetails from '../components/form-steps/ReimbursementDetails';
import ServiceTypes from '../components/form-steps/ServiceTypes';
import ProgrammingDetails from '../components/form-steps/ProgrammingDetails';
import PersonsInvolved from '../components/form-steps/PersonsInvolved';
import DocumentChecklist from '../components/form-steps/DocumentChecklist';
import SinisterDescription from '../components/form-steps/SinisterDescription';
import DocumentsSection from '../components/form-steps/DocumentsSection';
import TermsAndConditions from '../components/form-steps/TermsAndConditions';
import FormProgress from '../components/FormProgress';
import FormNavigation from '../components/FormNavigation';
import Breadcrumb from '../components/Breadcrumb';
import FormHeader from '../components/FormHeader';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import supabase from '../lib/supabase';
import { getFormDataFromMagicLink, updateMagicLinkFormData } from '../lib/magicLink';
import WebhookService from '../lib/webhookService';

const { FiAlertCircle } = FiIcons;

const ClaimsForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [sessionError, setSessionError] = useState(null);

  const [formData, setFormData] = useState({
    contactInfo: {},
    insuranceCompany: '',
    claimType: '',
    reimbursementType: '',
    claimNumber: '',
    serviceTypes: [],
    programmingService: '',
    isCirugiaOrtopedica: undefined,
    personsInvolved: {
      titularAsegurado: {},
      aseguradoAfectado: {},
      titularCuenta: {}
    },
    documentChecklist: {},
    sinisterDescription: '',
    signatureDocumentOption: '',
    documents: {},
    documentsSentByEmail: null,
    acceptedTerms: false,
    acceptedPrivacy: false
  });

  // Check for session parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const session = urlParams.get('session');

    if (session) {
      setSessionId(session);
      setLoadingSession(true);
      setSessionError(null);

      getFormDataFromMagicLink(session)
        .then(savedFormData => {
          setFormData(savedFormData);
          // Determine which step to go to based on the saved data
          const stepToNavigate = determineStepFromFormData(savedFormData);
          setCurrentStep(stepToNavigate);
        })
        .catch(error => {
          console.error('Error loading session:', error);
          setSessionError('No se pudo cargar la sesión guardada. El enlace podría haber expirado.');
        })
        .finally(() => {
          setLoadingSession(false);
        });
    }

    // Parse URL parameters for specific document fields
    const missingDocs = urlParams.get('missing');
    if (missingDocs && !session) {
      // Jump to documents section if specific documents are missing
      setCurrentStep(8); // Documents section step (adjusted for new order)
    }
  }, [location]);

  // Function to determine which step to navigate to based on form data
  const determineStepFromFormData = (data) => {
    // Logic to determine the appropriate step based on form completion
    if (!data.insuranceCompany) return 0;
    if (!data.claimType) return 1;
    if (data.claimType === 'reembolso') {
      if (!data.reimbursementType) return 2;
      if (!data.serviceTypes || data.serviceTypes.length === 0) return 3;
      // Check if document checklist is complete
      if (!Object.keys(data.documentChecklist || {}).length) return 4;
      // Check if persons involved data is complete
      const contactInfo = data.contactInfo || {};
      if (!contactInfo.nombres) return 5;
    } else if (data.claimType === 'programacion') {
      if (!data.programmingService) return 2;
      // Check if document checklist is complete
      if (!Object.keys(data.documentChecklist || {}).length) return 3;
      // Check if persons involved data is complete
      const contactInfo = data.contactInfo || {};
      if (!contactInfo.nombres) return 4;
    }
    // Default to the first step if we can't determine
    return 0;
  };

  // Update magic link session when form data changes
  useEffect(() => {
    // Only update if we have a valid session and we're not initially loading
    if (sessionId && !loadingSession && Object.keys(formData).length > 0) {
      updateMagicLinkFormData(sessionId, formData)
        .catch(error => {
          console.error('Error updating session:', error);
        });
    }
  }, [formData, sessionId, loadingSession]);

  const updateFormData = (section, data) => {
    setFormData(prev => ({
      ...prev,
      [section]: data
    }));
  };

  const getSteps = () => {
    const baseSteps = [
      { id: 'insurance', title: 'Aseguradora', component: InsuranceCompany },
      { id: 'claimType', title: 'Tipo de Reclamo', component: ClaimType }
    ];

    if (formData.claimType === 'reembolso') {
      baseSteps.push(
        { id: 'reimbursement', title: 'Detalles del Reembolso', component: ReimbursementDetails },
        { id: 'services', title: 'Tipos de Servicio', component: ServiceTypes }
      );
    } else if (formData.claimType === 'programacion') {
      baseSteps.push(
        { id: 'programming', title: 'Detalles de Programación', component: ProgrammingDetails }
      );
    }

    if (formData.claimType) {
      baseSteps.push(
        { id: 'checklist', title: 'Documentos Requeridos', component: DocumentChecklist },
        { id: 'persons', title: 'Personas Involucradas', component: PersonsInvolved },
        { id: 'description', title: 'Descripción del Siniestro', component: SinisterDescription },
        { id: 'documents', title: 'Subir Documentos', component: DocumentsSection },
        { id: 'terms', title: 'Términos y Condiciones', component: TermsAndConditions }
      );
    }

    return baseSteps;
  };

  const steps = getSteps();
  const currentStepData = steps[currentStep];

  // Validaciones mejoradas
  const validateWhatsApp = (phone) => {
    if (!phone) return false;
    const phoneRegex = /^\+\d{1,4}\d{10}$/; // Código de país + 10 dígitos
    return phoneRegex.test(phone);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const canProceed = () => {
    switch (currentStepData?.id) {
      case 'insurance':
        return formData.insuranceCompany;
      case 'claimType':
        return formData.claimType;
      case 'reimbursement':
        return formData.reimbursementType && 
               (formData.reimbursementType === 'inicial' || formData.claimNumber);
      case 'services':
        return formData.serviceTypes.length > 0;
      case 'programming':
        return formData.programmingService && 
               (formData.programmingService !== 'cirugia' || 
                formData.insuranceCompany !== 'gnp' || 
                formData.isCirugiaOrtopedica !== undefined);
      case 'checklist':
        // Verificar que al menos los documentos requeridos estén marcados y se haya seleccionado una opción de firma
        const requiredDocs = getRequiredDocuments();
        // Si la opción de firma es por email, no verificar los documentos que requieren firma
        const docsToCheck = formData.signatureDocumentOption === 'email' 
          ? requiredDocs.filter(doc => !doc.needsSignature) 
          : requiredDocs;
        return docsToCheck.every(doc => formData.documentChecklist && formData.documentChecklist[doc.id]) &&
               formData.signatureDocumentOption !== undefined && 
               formData.signatureDocumentOption !== '';
      case 'persons':
        // Verificar que la información de contacto esté completa
        const contactInfo = formData.contactInfo;
        const contactValid = contactInfo &&
          contactInfo.nombres &&
          contactInfo.apellidoPaterno &&
          contactInfo.apellidoMaterno &&
          contactInfo.email &&
          validateEmail(contactInfo.email) &&
          contactInfo.telefono &&
          validateWhatsApp(contactInfo.telefono);

        // Si se eligió firma por email, verificar también las personas involucradas
        if (formData.signatureDocumentOption === 'email') {
          // Verificar que al menos el titular del seguro tenga la información completa
          const titular = formData.personsInvolved.titularAsegurado || {};
          const titularValid = titular.nombres &&
            titular.apellidoPaterno &&
            titular.apellidoMaterno &&
            titular.email &&
            validateEmail(titular.email);
          // WhatsApp es opcional para titular
          const titularPhoneValid = !titular.telefono || validateWhatsApp(titular.telefono);

          // Verificar el asegurado afectado
          const afectado = formData.personsInvolved.aseguradoAfectado || {};
          const afectadoValid = afectado.nombres &&
            afectado.apellidoPaterno &&
            afectado.apellidoMaterno &&
            afectado.email &&
            validateEmail(afectado.email);
          // WhatsApp es opcional para afectado
          const afectadoPhoneValid = !afectado.telefono || validateWhatsApp(afectado.telefono);

          // Si es reembolso, verificar también el titular de la cuenta
          let cuentaValid = true;
          if (formData.claimType === 'reembolso') {
            const cuenta = formData.personsInvolved.titularCuenta || {};
            cuentaValid = cuenta.nombres &&
              cuenta.apellidoPaterno &&
              cuenta.apellidoMaterno &&
              cuenta.email &&
              validateEmail(cuenta.email);
            // WhatsApp es opcional para titular de cuenta
            const cuentaPhoneValid = !cuenta.telefono || validateWhatsApp(cuenta.telefono);
            cuentaValid = cuentaValid && cuentaPhoneValid;
          }

          return contactValid && titularValid && titularPhoneValid && 
                 afectadoValid && afectadoPhoneValid && cuentaValid;
        }

        // Si se eligió descarga física, solo verificar contactInfo
        return contactValid;
      case 'description':
        return formData.sinisterDescription && formData.sinisterDescription.trim().length > 10;
      case 'documents':
        // Verificar que el informe médico esté presente
        const documents = formData.documents || {};
        return documents['informe-medico'] && documents['informe-medico'].length > 0;
      case 'terms':
        return formData.acceptedTerms && formData.acceptedPrivacy;
      default:
        return true;
    }
  };

  // Helper function to get required documents based on form data
  const getRequiredDocuments = () => {
    const documents = [];
    const { insuranceCompany, claimType, programmingService, isCirugiaOrtopedica, serviceTypes } = formData;

    // Informe Médico - SIEMPRE requerido
    documents.push({
      id: 'informe-medico',
      title: 'Informe Médico',
      description: 'Informe médico detallado del diagnóstico y tratamiento',
      required: true
    });

    // Documentos específicos por aseguradora y tipo de reclamo
    if (insuranceCompany === 'gnp') {
      if (claimType === 'reembolso') {
        documents.push(
          {
            id: 'aviso-accidente-enfermedad',
            title: 'Aviso de Accidente o Enfermedad GNP',
            description: 'Formulario oficial que debe ser firmado por el asegurado',
            required: true,
            needsSignature: true
          },
          {
            id: 'formato-reembolso',
            title: 'Formato de Reembolso GNP',
            description: 'Formulario para solicitar el reembolso',
            required: true,
            needsSignature: true
          },
          {
            id: 'formato-unico-bancario',
            title: 'Formato Único de Información Bancaria GNP',
            description: 'Información bancaria para el reembolso',
            required: true,
            needsSignature: true
          },
          {
            id: 'estado-cuenta',
            title: 'Carátula del Estado de Cuenta Bancaria',
            description: 'Para procesar el reembolso',
            required: true
          }
        );
      } else if (claimType === 'programacion') {
        documents.push({
          id: 'aviso-accidente-enfermedad-prog',
          title: 'Aviso de Accidente o Enfermedad GNP',
          description: 'Formulario oficial para programación',
          required: true,
          needsSignature: true
        });

        if (programmingService === 'cirugia' && isCirugiaOrtopedica === true) {
          documents.push({
            id: 'formato-cirugia-traumatologia',
            title: 'Formato de Cirugía de Traumatología, Ortopedia y Neurocirugía',
            description: 'Formato específico para este tipo de cirugías',
            required: true,
            needsSignature: true
          });
        }
      }
    } else if (insuranceCompany === 'axa') {
      if (claimType === 'programacion') {
        documents.push({
          id: 'solicitud-programacion-axa',
          title: 'Solicitud de Programación AXA',
          description: 'Formulario de AXA para programación',
          required: true,
          needsSignature: true
        });
      } else if (claimType === 'reembolso') {
        documents.push({
          id: 'solicitud-reembolso-axa',
          title: 'Solicitud de Reembolso AXA',
          description: 'Formulario de AXA para reembolso',
          required: true,
          needsSignature: true
        });
      }
    }

    // Solo incluir documentos adicionales si están definidos los campos necesarios
    if (claimType === 'reembolso' && serviceTypes) {
      serviceTypes.forEach(service => {
        switch (service) {
          case 'hospital':
            documents.push({
              id: 'factura-hospital',
              title: 'Facturas de Hospital',
              description: 'Facturas de servicios hospitalarios',
              required: true
            });
            break;
          case 'estudios':
            documents.push(
              {
                id: 'estudios-archivos',
                title: 'Archivos de Estudios',
                description: 'Resultados de laboratorio e imagenología',
                required: true
              },
              {
                id: 'facturas-estudios',
                title: 'Facturas de Estudios',
                description: 'Facturas de laboratorio e imagenología',
                required: true
              }
            );
            break;
          case 'honorarios':
            documents.push({
              id: 'recibos-medicos',
              title: 'Recibos y Facturas Médicas',
              description: 'Honorarios de médicos y especialistas',
              required: true
            });
            break;
          case 'medicamentos':
            documents.push(
              {
                id: 'facturas-medicamentos',
                title: 'Facturas de Medicamentos',
                description: 'Facturas de farmacias',
                required: true
              },
              {
                id: 'recetas-medicamentos',
                title: 'Recetas de Medicamentos',
                description: 'Recetas con dosis y período de administración',
                required: true
              }
            );
            break;
          case 'terapia':
            documents.push(
              {
                id: 'facturas-terapia',
                title: 'Facturas de Terapia',
                description: 'Facturas de terapia y rehabilitación',
                required: true
              },
              {
                id: 'recetas-terapia',
                title: 'Recetas de Terapias',
                description: 'Prescripciones médicas para terapias',
                required: true
              },
              {
                id: 'carnet-asistencia',
                title: 'Carnet de Asistencia a Terapias',
                description: 'Registro de asistencia a sesiones',
                required: true
              }
            );
            break;
        }
      });
    }

    // Documentos adicionales para programación
    if (claimType === 'programacion') {
      switch (programmingService) {
        case 'cirugia':
          documents.push({
            id: 'interpretacion-estudios-cirugia',
            title: 'Interpretación de Estudios',
            description: 'Interpretación de estudios que corroboren el diagnóstico',
            required: true
          });
          break;
        case 'medicamentos':
          documents.push(
            {
              id: 'recetas-prog-medicamentos',
              title: 'Recetas de Medicamentos',
              description: 'Recetas para medicamentos a programar',
              required: true
            },
            {
              id: 'interpretacion-estudios-med',
              title: 'Interpretación de Estudios (Opcional)',
              description: 'Interpretación de estudios que corroboren el diagnóstico',
              required: false
            }
          );
          break;
        case 'terapia':
          documents.push(
            {
              id: 'bitacora-medico',
              title: 'Bitácora del Médico',
              description: 'Indicación de terapias, sesiones y tiempos',
              required: true
            },
            {
              id: 'interpretacion-estudios-terapia',
              title: 'Interpretación de Estudios',
              description: 'Interpretación de estudios que corroboren el diagnóstico',
              required: true
            }
          );
          break;
      }
    }

    return documents.filter(doc => doc.required);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      console.log('Iniciando envío del formulario...');

      // Preparar los datos para enviar a Supabase
      const reclamacionData = {
        contacto_nombres: formData.contactInfo.nombres,
        contacto_apellido_paterno: formData.contactInfo.apellidoPaterno,
        contacto_apellido_materno: formData.contactInfo.apellidoMaterno,
        contacto_email: formData.contactInfo.email,
        contacto_telefono: formData.contactInfo.telefono,
        aseguradora: formData.insuranceCompany,
        tipo_reclamo: formData.claimType,
        tipo_reembolso: formData.reimbursementType || null,
        numero_reclamo: formData.claimNumber || null,
        tipos_servicio: formData.serviceTypes || [],
        descripcion_siniestro: formData.sinisterDescription || null,
        servicio_programacion: formData.programmingService || null,
        tipo_cirugia: formData.isCirugiaOrtopedica ? 'traumatologia_ortopedia_neurologia' : null,
        titular_asegurado: formData.personsInvolved.titularAsegurado || null,
        asegurado_afectado: formData.personsInvolved.aseguradoAfectado || null,
        titular_cuenta: formData.personsInvolved.titularCuenta || null,
        opcion_documentos_firma: formData.signatureDocumentOption || null,
        documentos: formData.documents || {},
        documentos_por_email: formData.documentsSentByEmail || null,
        estado: 'Enviado',
        aceptacion_terminos: formData.acceptedTerms,
        aceptacion_privacidad: formData.acceptedPrivacy,
        session_id: sessionId || null
      };

      console.log('Enviando datos del reclamo:', reclamacionData);

      // Guardar en Supabase
      const { data, error } = await supabase
        .from('reclamaciones_r2x4')
        .insert(reclamacionData)
        .select();

      if (error) {
        console.error('Error en la respuesta de Supabase:', error);
        throw error;
      }

      console.log('Reclamo enviado exitosamente:', data);

      // Subir documentos al storage de Supabase
      const submissionId = data[0].id;

      // Primero subimos los documentos al bucket de Storage
      if (formData.documents && Object.keys(formData.documents).length > 0) {
        console.log('Subiendo documentos al storage...');
        for (const docType in formData.documents) {
          if (Array.isArray(formData.documents[docType])) {
            for (const doc of formData.documents[docType]) {
              if (doc.file && doc.isLocal) {
                const filePath = `${submissionId}/${docType}/${doc.name}`;
                const { error: uploadError } = await supabase.storage
                  .from('claims')
                  .upload(filePath, doc.file, {
                    cacheControl: '3600',
                    upsert: false
                  });

                if (uploadError) {
                  console.error(`Error uploading file ${doc.name}:`, uploadError);
                }
              }
            }
          }
        }
      }

      // Disparar webhooks después de guardar exitosamente
      try {
        console.log('Preparando datos para webhooks...');
        const webhookData = await WebhookService.transformFormDataForWebhook(formData, data[0].id);
        console.log('Datos preparados para webhook:', webhookData);

        console.log('Disparando webhooks...');
        await WebhookService.triggerWebhooks('form_submitted', webhookData);
        console.log('Webhooks disparados exitosamente');
      } catch (webhookError) {
        console.error('Error al disparar webhooks:', webhookError);
        // No fallar el envío del formulario si los webhooks fallan
      }

      // Navegar a la página de agradecimiento con los datos del reclamo
      navigate('/thank-you', {
        state: {
          formData: formData,
          submissionId: data[0].id
        }
      });
    } catch (error) {
      console.error('Error al enviar el reclamo:', error);
      // Mensaje de error más detallado para ayudar en la depuración
      let errorMessage = 'Hubo un error al enviar el formulario. Por favor intenta de nuevo.';
      if (error.message) {
        errorMessage += ' Detalle: ' + error.message;
      }
      setSubmitError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const CurrentStepComponent = currentStepData?.component;

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#204499] border-t-transparent rounded-full mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cargando formulario</h2>
          <p className="text-gray-600">Estamos recuperando tu información guardada...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <FormHeader currentStep={currentStep} totalSteps={steps.length} formData={formData} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Session error message */}
        {sessionError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 text-red-800 p-4 rounded-lg mb-6 flex items-center gap-3"
          >
            <SafeIcon icon={FiAlertCircle} className="text-xl flex-shrink-0" />
            <div>
              <p className="font-medium">Error al cargar la sesión</p>
              <p className="text-sm mt-1">{sessionError}</p>
            </div>
          </motion.div>
        )}

        {/* Breadcrumb */}
        <Breadcrumb formData={formData} />

        {/* Progress Bar */}
        <FormProgress currentStep={currentStep} totalSteps={steps.length} steps={steps} />

        {/* Form Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mt-8"
        >
          {submitError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 text-red-800 p-4 rounded-lg mb-6 flex items-center gap-3"
            >
              <SafeIcon icon={FiAlertCircle} className="text-xl flex-shrink-0" />
              <div>
                <p className="font-medium">Error al enviar el formulario</p>
                <p className="text-sm mt-1">{submitError}</p>
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {CurrentStepComponent && (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <CurrentStepComponent formData={formData} updateFormData={updateFormData} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <FormNavigation
            currentStep={currentStep}
            totalSteps={steps.length}
            canProceed={canProceed() && !submitting}
            onNext={nextStep}
            onPrev={prevStep}
            onSubmit={handleSubmit}
            isSubmitting={submitting}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default ClaimsForm;