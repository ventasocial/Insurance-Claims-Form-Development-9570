import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import ContactForm from './ContactForm';

const { FiInfo, FiUserPlus } = FiIcons;

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

  // Manejar cambios en el formulario de contacto
  const handleContactFormChange = (type, data, isValid) => {
    if (type === 'contactInfo') {
      updateFormData('contactInfo', data);
    } else {
      const updatedPersonsInvolved = {
        ...formData.personsInvolved || {},
        [type]: data
      };
      updateFormData('personsInvolved', updatedPersonsInvolved);
    }

    // Actualizar estado de validación
    setValidSections(prev => ({
      ...prev,
      [type]: isValid
    }));
  };

  // Inicializar validaciones al montar el componente
  useEffect(() => {
    // Esta inicialización se hará automáticamente 
    // cuando los componentes ContactForm validen sus datos
  }, []);

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

      {/* Formularios de personas */}
      <ContactForm 
        title="Información de Contacto"
        description="Persona que reporta el reclamo"
        initialData={formData.contactInfo || {}}
        onDataChange={(data, isValid) => handleContactFormChange('contactInfo', data, isValid)}
      />

      <ContactForm 
        title="Asegurado Titular"
        description="Titular de la póliza"
        initialData={formData.personsInvolved?.titularAsegurado || {}}
        onDataChange={(data, isValid) => handleContactFormChange('titularAsegurado', data, isValid)}
      />

      <ContactForm 
        title="Asegurado Afectado"
        description="Persona que requiere atención"
        initialData={formData.personsInvolved?.aseguradoAfectado || {}}
        onDataChange={(data, isValid) => handleContactFormChange('aseguradoAfectado', data, isValid)}
      />

      {showTitularCuenta && (
        <ContactForm 
          title="Titular de Cuenta Bancaria"
          description="Para reembolsos"
          initialData={formData.personsInvolved?.titularCuenta || {}}
          onDataChange={(data, isValid) => handleContactFormChange('titularCuenta', data, isValid)}
        />
      )}

      {/* Botón para agregar persona adicional (opcional) */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
      >
        <SafeIcon icon={FiUserPlus} className="text-gray-600" />
        <span>Agregar otra persona</span>
      </motion.button>
    </motion.div>
  );
};

export default PersonsInvolved;