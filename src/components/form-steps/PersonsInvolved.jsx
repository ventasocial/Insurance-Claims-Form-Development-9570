import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import ContactForm from './ContactForm';

const { FiInfo, FiCopy } = FiIcons;

const PersonsInvolved = ({ formData, updateFormData }) => {
  // Determinar si mostrar el titular de cuenta bancaria
  const showTitularCuenta = formData.claimType === 'reembolso';
  
  // Estados para validación
  const [validSections, setValidSections] = useState({
    contactInfo: false,
    titularAsegurado: false,
    aseguradoAfectado: false,
    titularCuenta: false
  });

  // Flag para evitar bucles infinitos durante la copia de datos
  const [isCopying, setIsCopying] = useState(false);

  // Función memoizada para validar un formulario de contacto
  const validateContactData = useCallback((data) => {
    if (!data) return false;
    
    const { nombres, apellidoPaterno, apellidoMaterno, email, telefono } = data;
    
    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = email && emailRegex.test(email);
    
    // Validación de teléfono (WhatsApp) - opcional para personas involucradas excepto contactInfo
    const phoneRegex = /^\+52\d{10}$/;
    const isPhoneValid = telefono ? phoneRegex.test(telefono) : true; // Opcional
    
    return !!(
      nombres && 
      apellidoPaterno && 
      apellidoMaterno && 
      isEmailValid && 
      isPhoneValid
    );
  }, []);

  // Validación especial para contactInfo (teléfono obligatorio)
  const validateContactInfo = useCallback((data) => {
    if (!data) return false;
    
    const { nombres, apellidoPaterno, apellidoMaterno, email, telefono } = data;
    
    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = email && emailRegex.test(email);
    
    // Validación de teléfono (WhatsApp) - OBLIGATORIO para contactInfo
    const phoneRegex = /^\+52\d{10}$/;
    const isPhoneValid = telefono && phoneRegex.test(telefono);
    
    return !!(
      nombres && 
      apellidoPaterno && 
      apellidoMaterno && 
      isEmailValid && 
      isPhoneValid
    );
  }, []);

  // Validar todas las secciones cuando cambien los datos
  useEffect(() => {
    // No validar durante la copia para evitar bucles
    if (isCopying) return;

    const newValidSections = {
      contactInfo: validateContactInfo(formData.contactInfo),
      titularAsegurado: validateContactData(formData.personsInvolved?.titularAsegurado),
      aseguradoAfectado: validateContactData(formData.personsInvolved?.aseguradoAfectado),
      titularCuenta: showTitularCuenta ? validateContactData(formData.personsInvolved?.titularCuenta) : true
    };

    // Solo actualizar si hay cambios reales
    const hasChanges = Object.keys(newValidSections).some(
      key => newValidSections[key] !== validSections[key]
    );

    if (hasChanges) {
      setValidSections(newValidSections);
    }
  }, [
    formData.contactInfo,
    formData.personsInvolved,
    showTitularCuenta,
    validateContactData,
    validateContactInfo,
    isCopying,
    validSections
  ]);

  // Manejar cambios en el formulario de contacto
  const handleContactFormChange = useCallback((type, data, isValid) => {
    // No procesar cambios durante la copia
    if (isCopying) return;

    if (type === 'contactInfo') {
      updateFormData('contactInfo', data);
    } else {
      const updatedPersonsInvolved = { 
        ...formData.personsInvolved || {}, 
        [type]: data 
      };
      updateFormData('personsInvolved', updatedPersonsInvolved);
    }
    
    // Actualizar estado de validación inmediatamente
    setValidSections(prev => ({ 
      ...prev, 
      [type]: isValid 
    }));
  }, [formData.personsInvolved, updateFormData, isCopying]);

  // Función para copiar datos del contacto a otro formulario
  const copyContactData = useCallback((targetType) => {
    if (!formData.contactInfo) return;

    // Activar flag de copia
    setIsCopying(true);

    // Crear una copia de los datos del contacto
    const copiedData = { ...formData.contactInfo };
    
    // Actualizar los datos
    const updatedPersonsInvolved = { 
      ...formData.personsInvolved || {},
      [targetType]: copiedData
    };
    
    updateFormData('personsInvolved', updatedPersonsInvolved);
    
    // Actualizar validación para el campo copiado
    const isValid = validateContactData(copiedData);
    setValidSections(prev => ({ 
      ...prev, 
      [targetType]: isValid 
    }));

    // Desactivar flag de copia después de un breve delay
    setTimeout(() => {
      setIsCopying(false);
    }, 100);
  }, [formData.contactInfo, formData.personsInvolved, updateFormData, validateContactData]);

  // Calcular progreso general
  const totalSections = showTitularCuenta ? 4 : 3;
  const completedSections = Object.values({
    contactInfo: validSections.contactInfo,
    titularAsegurado: validSections.titularAsegurado,
    aseguradoAfectado: validSections.aseguradoAfectado,
    titularCuenta: showTitularCuenta ? validSections.titularCuenta : true
  }).filter(Boolean).length;
  const progress = (completedSections / totalSections) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Información de Personas Involucradas
        </h2>
        <p className="text-gray-600">
          Completa la información de todas las personas relacionadas con el reclamo
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2">
          <SafeIcon icon={FiInfo} className="text-blue-600 flex-shrink-0" />
          <p className="text-blue-800 text-sm">
            Por favor completa la información de las personas involucradas. Esta información es necesaria para el proceso de firma digital y comunicaciones relacionadas con el reclamo.
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progreso:</span>
          <span className="text-sm font-medium text-gray-700">
            {completedSections} de {totalSections} secciones completas
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Información de contacto */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-1">
        <div className="bg-white rounded-lg">
          <ContactForm
            title="Información de Contacto"
            description="Persona que reporta el reclamo"
            initialData={formData.contactInfo || {}}
            onDataChange={(data, isValid) => handleContactFormChange('contactInfo', data, isValid)}
          />
        </div>
      </div>

      {/* Formularios de personas */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-1">
        <div className="bg-white rounded-lg">
          <div className="flex justify-between items-center px-6 pt-6">
            <h3 className="font-medium text-lg">Asegurado Titular</h3>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => copyContactData('titularAsegurado')}
              disabled={isCopying}
              className={`flex items-center gap-2 font-medium transition-colors ${
                isCopying 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              <SafeIcon icon={FiCopy} className="text-sm" />
              Copiar datos del contacto
            </motion.button>
          </div>
          <div className="px-6 pb-6">
            <ContactForm
              title=""
              description="Titular de la póliza"
              initialData={formData.personsInvolved?.titularAsegurado || {}}
              onDataChange={(data, isValid) => handleContactFormChange('titularAsegurado', data, isValid)}
              showValidation={true}
              whatsappOptional={true}
              hideHeader={true}
            />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-1">
        <div className="bg-white rounded-lg">
          <div className="flex justify-between items-center px-6 pt-6">
            <h3 className="font-medium text-lg">Asegurado Afectado</h3>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => copyContactData('aseguradoAfectado')}
              disabled={isCopying}
              className={`flex items-center gap-2 font-medium transition-colors ${
                isCopying 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-green-600 hover:text-green-800'
              }`}
            >
              <SafeIcon icon={FiCopy} className="text-sm" />
              Copiar datos del contacto
            </motion.button>
          </div>
          <div className="px-6 pb-6">
            <ContactForm
              title=""
              description="Persona que requiere atención"
              initialData={formData.personsInvolved?.aseguradoAfectado || {}}
              onDataChange={(data, isValid) => handleContactFormChange('aseguradoAfectado', data, isValid)}
              showValidation={true}
              whatsappOptional={true}
              hideHeader={true}
            />
          </div>
        </div>
      </div>

      {showTitularCuenta && (
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-1">
          <div className="bg-white rounded-lg">
            <div className="flex justify-between items-center px-6 pt-6">
              <h3 className="font-medium text-lg">Titular de Cuenta Bancaria</h3>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => copyContactData('titularCuenta')}
                disabled={isCopying}
                className={`flex items-center gap-2 font-medium transition-colors ${
                  isCopying 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-purple-600 hover:text-purple-800'
                }`}
              >
                <SafeIcon icon={FiCopy} className="text-sm" />
                Copiar datos del contacto
              </motion.button>
            </div>
            <div className="px-6 pb-6">
              <ContactForm
                title=""
                description="Para reembolsos"
                initialData={formData.personsInvolved?.titularCuenta || {}}
                onDataChange={(data, isValid) => handleContactFormChange('titularCuenta', data, isValid)}
                showValidation={true}
                whatsappOptional={true}
                hideHeader={true}
              />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PersonsInvolved;