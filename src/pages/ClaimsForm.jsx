import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

import ContactInfo from '../components/form-steps/ContactInfo';
import InsuranceCompany from '../components/form-steps/InsuranceCompany';
import ClaimType from '../components/form-steps/ClaimType';
import ReimbursementDetails from '../components/form-steps/ReimbursementDetails';
import ServiceTypes from '../components/form-steps/ServiceTypes';
import SinisterDescription from '../components/form-steps/SinisterDescription';
import ProgrammingDetails from '../components/form-steps/ProgrammingDetails';
import PersonsInvolved from '../components/form-steps/PersonsInvolved';
import SignatureDocuments from '../components/form-steps/SignatureDocuments';
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
    sinisterDescription: '',
    programmingService: '',
    isCirugiaOrtopedica: undefined,
    personsInvolved: {
      titularAsegurado: {},
      aseguradoAfectado: {},
      titularCuenta: {}
    },
    signatureDocumentOption: '',
    emailForDigitalSignature: '',
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
      setCurrentStep(9); // Documents section step (adjusted for new signature step)
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
      if (!data.sinisterDescription) return 4;
      // Check if persons involved data is complete
      const titular = data.personsInvolved?.titularAsegurado || {};
      if (!titular.nombres) return 5;
    } else if (data.claimType === 'programacion') {
      if (!data.programmingService) return 2;
      // Check if persons involved data is complete
      const titular = data.personsInvolved?.titularAsegurado || {};
      if (!titular.nombres) return 3;
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
      {
        id: 'contact',
        title: 'Información de Contacto',
        component: ContactInfo
      },
      {
        id: 'insurance',
        title: 'Aseguradora',
        component: InsuranceCompany
      },
      {
        id: 'claimType',
        title: 'Tipo de Reclamo',
        component: ClaimType
      }
    ];

    if (formData.claimType === 'reembolso') {
      baseSteps.push(
        {
          id: 'reimbursement',
          title: 'Detalles del Reembolso',
          component: ReimbursementDetails
        },
        {
          id: 'services',
          title: 'Tipos de Servicio',
          component: ServiceTypes
        },
        {
          id: 'description',
          title: 'Descripción del Siniestro',
          component: SinisterDescription
        }
      );
    } else if (formData.claimType === 'programacion') {
      baseSteps.push({
        id: 'programming',
        title: 'Detalles de Programación',
        component: ProgrammingDetails
      });
    }

    if (formData.claimType) {
      baseSteps.push(
        {
          id: 'persons',
          title: 'Personas Involucradas',
          component: PersonsInvolved
        },
        {
          id: 'signature',
          title: 'Documentos de Firma',
          component: SignatureDocuments
        },
        {
          id: 'documents',
          title: 'Documentos',
          component: DocumentsSection
        },
        {
          id: 'terms',
          title: 'Términos y Condiciones',
          component: TermsAndConditions
        }
      );
    }

    return baseSteps;
  };

  const steps = getSteps();
  const currentStepData = steps[currentStep];

  // Validaciones mejoradas
  const validateWhatsApp = (phone) => {
    const phoneRegex = /^\+52\d{10}$/;
    return phoneRegex.test(phone);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const canProceed = () => {
    switch (currentStepData?.id) {
      case 'contact':
        const contactInfo = formData.contactInfo;
        return (
          contactInfo.nombres &&
          contactInfo.apellidoPaterno &&
          contactInfo.apellidoMaterno &&
          contactInfo.email &&
          validateEmail(contactInfo.email) &&
          contactInfo.telefono &&
          validateWhatsApp(contactInfo.telefono)
        );

      case 'insurance':
        return formData.insuranceCompany;

      case 'claimType':
        return formData.claimType;

      case 'reimbursement':
        return formData.reimbursementType && 
               (formData.reimbursementType === 'inicial' || formData.claimNumber);

      case 'services':
        return formData.serviceTypes.length > 0;

      case 'description':
        return formData.sinisterDescription.trim().length > 10;

      case 'programming':
        return formData.programmingService && 
               (formData.programmingService !== 'cirugia' || 
                formData.insuranceCompany !== 'gnp' || 
                formData.isCirugiaOrtopedica !== undefined);

      case 'persons':
        // Verificar que al menos el titular del seguro tenga la información completa
        const titular = formData.personsInvolved.titularAsegurado || {};
        const requiredFields = ['nombres', 'apellidoPaterno', 'apellidoMaterno', 'email', 'telefono'];
        return requiredFields.every(field => titular[field] && titular[field].trim() !== '') &&
               validateEmail(titular.email || '') &&
               validateWhatsApp(titular.telefono || '');

      case 'signature':
        // Check if signature document option is selected
        const hasSignatureDocs = getSignatureDocuments().length > 0;
        if (!hasSignatureDocs) return true; // Skip if no signature documents needed
        
        return formData.signatureDocumentOption && 
               (formData.signatureDocumentOption !== 'email' || 
                (formData.emailForDigitalSignature && validateEmail(formData.emailForDigitalSignature)));

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

  const getSignatureDocuments = () => {
    const documents = [];
    const { insuranceCompany, claimType, programmingService, isCirugiaOrtopedica } = formData;

    if (insuranceCompany === 'gnp') {
      if (claimType === 'reembolso') {
        documents.push(
          'aviso-accidente-enfermedad',
          'formato-reembolso',
          'formato-unico-bancario'
        );
      } else if (claimType === 'programacion') {
        documents.push('aviso-accidente-enfermedad-prog');
        if (programmingService === 'cirugia' && isCirugiaOrtopedica === true) {
          documents.push('formato-cirugia-traumatologia');
        }
      }
    } else if (insuranceCompany === 'axa') {
      if (claimType === 'programacion') {
        documents.push('solicitud-programacion-axa');
      } else if (claimType === 'reembolso') {
        documents.push('solicitud-reembolso-axa');
      }
    }

    return documents;
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
        email_firma_digital: formData.emailForDigitalSignature || null,
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
      <FormHeader 
        currentStep={currentStep} 
        totalSteps={steps.length} 
        formData={formData} 
      />

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
        <FormProgress
          currentStep={currentStep}
          totalSteps={steps.length}
          steps={steps}
        />

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
                <CurrentStepComponent
                  formData={formData}
                  updateFormData={updateFormData}
                />
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