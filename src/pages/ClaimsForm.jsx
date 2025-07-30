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
import DocumentsSection from '../components/form-steps/DocumentsSection';
import FormProgress from '../components/FormProgress';
import FormNavigation from '../components/FormNavigation';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import supabase from '../lib/supabase';

const { FiArrowLeft } = FiIcons;

const ClaimsForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [formData, setFormData] = useState({
    contactInfo: {},
    insuranceCompany: '',
    claimType: '',
    reimbursementType: '',
    claimNumber: '',
    serviceTypes: [],
    sinisterDescription: '',
    programmingService: '',
    surgeryType: '',
    personsInvolved: {
      titularAsegurado: {},
      aseguradoAfectado: {},
      titularCuenta: {}
    },
    documents: {}
  });

  // Parse URL parameters for specific document fields
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const missingDocs = urlParams.get('missing');
    if (missingDocs) {
      // Jump to documents section if specific documents are missing
      setCurrentStep(8); // Documents section step
    }
  }, [location]);

  const updateFormData = (section, data) => {
    setFormData(prev => ({
      ...prev,
      [section]: data
    }));
  };

  const getSteps = () => {
    const baseSteps = [
      { id: 'contact', title: 'Información de Contacto', component: ContactInfo },
      { id: 'insurance', title: 'Aseguradora', component: InsuranceCompany },
      { id: 'claimType', title: 'Tipo de Reclamo', component: ClaimType }
    ];

    if (formData.claimType === 'reembolso') {
      baseSteps.push(
        { id: 'reimbursement', title: 'Detalles del Reembolso', component: ReimbursementDetails },
        { id: 'services', title: 'Tipos de Servicio', component: ServiceTypes },
        { id: 'description', title: 'Descripción del Siniestro', component: SinisterDescription }
      );
    } else if (formData.claimType === 'programacion') {
      baseSteps.push(
        { id: 'programming', title: 'Detalles de Programación', component: ProgrammingDetails }
      );
    }

    if (formData.claimType && formData.claimType !== 'maternidad') {
      baseSteps.push(
        { id: 'persons', title: 'Personas Involucradas', component: PersonsInvolved },
        { id: 'documents', title: 'Documentos', component: DocumentsSection }
      );
    }

    return baseSteps;
  };

  const steps = getSteps();
  const currentStepData = steps[currentStep];

  const canProceed = () => {
    switch (currentStepData?.id) {
      case 'contact':
        return formData.contactInfo.nombres && 
               formData.contactInfo.apellidoPaterno && 
               formData.contactInfo.apellidoMaterno && 
               formData.contactInfo.email && 
               formData.contactInfo.telefono;
      case 'insurance':
        return formData.insuranceCompany;
      case 'claimType':
        return formData.claimType;
      case 'reimbursement':
        return formData.reimbursementType && (formData.reimbursementType === 'inicial' || formData.claimNumber);
      case 'services':
        return formData.serviceTypes.length > 0;
      case 'description':
        return formData.sinisterDescription.trim().length > 10;
      case 'programming':
        return formData.programmingService;
      case 'persons':
        // Check if at least titular asegurado has required fields
        const titular = formData.personsInvolved.titularAsegurado || {};
        return titular.nombres && titular.apellidoPaterno && titular.apellidoMaterno && titular.email && titular.telefono;
      default:
        return true;
    }
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
        tipo_cirugia: formData.surgeryType || null,
        titular_asegurado: formData.personsInvolved.titularAsegurado || null,
        asegurado_afectado: formData.personsInvolved.aseguradoAfectado || null,
        titular_cuenta: formData.personsInvolved.titularCuenta || null,
        documentos: formData.documents || {},
        estado: 'Enviado',
      };

      // Guardar en Supabase
      const { data, error } = await supabase
        .from('reclamaciones_r2x4')
        .insert(reclamacionData)
        .select();

      if (error) {
        throw error;
      }

      console.log('Reclamo enviado exitosamente:', data);
      alert('Formulario enviado exitosamente. Recibirás una confirmación por correo electrónico.');
      navigate('/');
    } catch (error) {
      console.error('Error al enviar el reclamo:', error);
      setSubmitError('Hubo un error al enviar el formulario. Por favor intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const CurrentStepComponent = currentStepData?.component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <SafeIcon icon={FiArrowLeft} className="text-xl text-gray-600" />
              </motion.button>
              <img 
                src="https://storage.googleapis.com/msgsndr/HWRXLf7lstECUAG07eRw/media/685d77c05c72d29e532e823f.png"
                alt="Fortex"
                className="h-8"
              />
            </div>
            <div className="text-sm text-gray-600">
              Paso {currentStep + 1} de {steps.length}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              className="bg-red-50 text-red-800 p-4 rounded-lg mb-6"
            >
              {submitError}
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