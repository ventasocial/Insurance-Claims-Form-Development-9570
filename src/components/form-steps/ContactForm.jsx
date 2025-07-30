import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUser, FiCheck, FiAlertCircle } = FiIcons;

const ContactForm = ({ initialData = {}, onDataChange, title, description, showValidation = true }) => {
  // Estado local para los datos del formulario
  const [formData, setFormData] = useState(initialData);
  
  // Estado para validación
  const [isValid, setIsValid] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});
  
  // Actualizar datos locales cuando cambian los datos iniciales
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);
  
  // Validar formulario
  useEffect(() => {
    const validateForm = () => {
      const { nombres, apellidoPaterno, apellidoMaterno, email, telefono } = formData;
      
      // Validación de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isEmailValid = email && emailRegex.test(email);
      
      // Validación de teléfono (WhatsApp)
      const phoneRegex = /^\+52\d{10}$/;
      const isPhoneValid = telefono && phoneRegex.test(telefono);
      
      return !!(
        nombres && 
        apellidoPaterno && 
        apellidoMaterno && 
        isEmailValid && 
        isPhoneValid
      );
    };
    
    const newIsValid = validateForm();
    setIsValid(newIsValid);
    
    // Notificar al componente padre si hay cambios
    if (onDataChange) {
      onDataChange(formData, newIsValid);
    }
  }, [formData, onDataChange]);
  
  // Manejar cambios en los campos
  const handleChange = (field, value) => {
    const newData = { 
      ...formData,
      [field]: value 
    };
    
    setFormData(newData);
    
    // Marcar el campo como tocado
    if (!touchedFields[field]) {
      setTouchedFields({
        ...touchedFields,
        [field]: true
      });
    }
  };
  
  // Verificar si un campo tiene error
  const hasError = (field) => {
    if (!touchedFields[field]) return false;
    
    switch (field) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !formData.email || !emailRegex.test(formData.email);
      case 'telefono':
        const phoneRegex = /^\+52\d{10}$/;
        return !formData.telefono || !phoneRegex.test(formData.telefono);
      default:
        return !formData[field];
    }
  };
  
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 p-2 rounded-full">
            <SafeIcon icon={FiUser} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-lg">{title}</h3>
            {description && <p className="text-sm text-gray-500">{description}</p>}
          </div>
        </div>
        
        {/* Indicador de validación */}
        {showValidation && isValid && (
          <div className="bg-green-100 p-1 rounded-full">
            <SafeIcon icon={FiCheck} className="text-green-600" />
          </div>
        )}
      </div>
      
      {/* Formulario */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre(s) *
          </label>
          <input
            type="text"
            value={formData.nombres || ''}
            onChange={(e) => handleChange('nombres', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
              hasError('nombres') ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Nombre(s)"
          />
          {hasError('nombres') && (
            <p className="text-xs text-red-500 mt-1">
              Ingresa tu nombre
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Apellido Paterno *
          </label>
          <input
            type="text"
            value={formData.apellidoPaterno || ''}
            onChange={(e) => handleChange('apellidoPaterno', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
              hasError('apellidoPaterno') ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Apellido paterno"
          />
          {hasError('apellidoPaterno') && (
            <p className="text-xs text-red-500 mt-1">
              Ingresa tu apellido paterno
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Apellido Materno *
          </label>
          <input
            type="text"
            value={formData.apellidoMaterno || ''}
            onChange={(e) => handleChange('apellidoMaterno', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
              hasError('apellidoMaterno') ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Apellido materno"
          />
          {hasError('apellidoMaterno') && (
            <p className="text-xs text-red-500 mt-1">
              Ingresa tu apellido materno
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            WhatsApp *
          </label>
          <input
            type="tel"
            value={formData.telefono || ''}
            onChange={(e) => handleChange('telefono', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
              hasError('telefono') ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="+528122334455"
          />
          {hasError('telefono') && (
            <p className="text-xs text-red-500 mt-1">
              Formato requerido: +528122334455
            </p>
          )}
          {!hasError('telefono') && !touchedFields.telefono && (
            <p className="text-xs text-gray-500 mt-1">
              Formato: +528122334455
            </p>
          )}
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Correo Electrónico *
          </label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
              hasError('email') ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="correo@ejemplo.com"
          />
          {hasError('email') && (
            <p className="text-xs text-red-500 mt-1">
              Ingresa un correo electrónico válido
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactForm;