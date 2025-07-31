import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUser, FiCheck, FiAlertCircle } = FiIcons;

// Códigos de país más comunes
const COUNTRY_CODES = [
  { code: '+52', country: 'México', flag: '🇲🇽' },
  { code: '+1', country: 'Estados Unidos/Canadá', flag: '🇺🇸' },
  { code: '+34', country: 'España', flag: '🇪🇸' },
  { code: '+33', country: 'Francia', flag: '🇫🇷' },
  { code: '+49', country: 'Alemania', flag: '🇩🇪' },
  { code: '+44', country: 'Reino Unido', flag: '🇬🇧' },
  { code: '+39', country: 'Italia', flag: '🇮🇹' },
  { code: '+55', country: 'Brasil', flag: '🇧🇷' },
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  { code: '+57', country: 'Colombia', flag: '🇨🇴' },
  { code: '+58', country: 'Venezuela', flag: '🇻🇪' },
  { code: '+56', country: 'Chile', flag: '🇨🇱' },
  { code: '+51', country: 'Perú', flag: '🇵🇪' }
];

const ContactForm = ({ 
  initialData = {}, 
  onDataChange, 
  title, 
  description, 
  showValidation = true, 
  whatsappOptional = false, 
  hideHeader = false 
}) => {
  // Estado local para los datos del formulario
  const [formData, setFormData] = useState(initialData);
  
  // Estado para validación
  const [isValid, setIsValid] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});
  
  // Estado para el código de país seleccionado
  const [countryCode, setCountryCode] = useState('+52');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Actualizar datos locales cuando cambian los datos iniciales
  useEffect(() => {
    setFormData(initialData);
    
    // Extraer código de país y número si ya existe un teléfono
    if (initialData.telefono) {
      const phone = initialData.telefono;
      const countryCodeMatch = COUNTRY_CODES.find(cc => phone.startsWith(cc.code));
      if (countryCodeMatch) {
        setCountryCode(countryCodeMatch.code);
        setPhoneNumber(phone.substring(countryCodeMatch.code.length));
      } else {
        setPhoneNumber(phone);
      }
    }
  }, [initialData]);

  // Función memoizada para validar el formulario
  const validateForm = useCallback(() => {
    const { nombres, apellidoPaterno, apellidoMaterno, email, telefono } = formData;

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = email && emailRegex.test(email);

    // Validación de teléfono (WhatsApp)
    const phoneRegex = /^\+\d{1,4}\d{10}$/; // Código de país + 10 dígitos
    const isPhoneValid = whatsappOptional 
      ? (telefono ? phoneRegex.test(telefono) : true) 
      : (telefono && phoneRegex.test(telefono));

    return !!(
      nombres &&
      apellidoPaterno &&
      apellidoMaterno &&
      isEmailValid &&
      isPhoneValid
    );
  }, [formData, whatsappOptional]);

  // Validar formulario y notificar cambios
  useEffect(() => {
    const newIsValid = validateForm();
    
    // Solo actualizar si hay cambios
    if (newIsValid !== isValid) {
      setIsValid(newIsValid);
    }

    // Notificar al componente padre si hay cambios
    if (onDataChange) {
      onDataChange(formData, newIsValid);
    }
  }, [formData, validateForm, onDataChange, isValid]);

  // Manejar cambios en los campos
  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Marcar el campo como tocado
    setTouchedFields(prev => ({
      ...prev,
      [field]: true
    }));
  }, []);

  // Manejar cambios en el teléfono
  const handlePhoneChange = useCallback((newPhoneNumber) => {
    setPhoneNumber(newPhoneNumber);
    
    // Solo números, máximo 10 dígitos
    const cleanNumber = newPhoneNumber.replace(/\D/g, '').substring(0, 10);
    const fullPhone = cleanNumber ? `${countryCode}${cleanNumber}` : '';
    
    handleChange('telefono', fullPhone);
  }, [countryCode, handleChange]);

  // Manejar cambios en el código de país
  const handleCountryCodeChange = useCallback((newCountryCode) => {
    setCountryCode(newCountryCode);
    
    // Actualizar el teléfono completo
    const cleanNumber = phoneNumber.replace(/\D/g, '').substring(0, 10);
    const fullPhone = cleanNumber ? `${newCountryCode}${cleanNumber}` : '';
    
    handleChange('telefono', fullPhone);
  }, [phoneNumber, handleChange]);

  // Verificar si un campo tiene error
  const hasError = useCallback((field) => {
    if (!touchedFields[field]) return false;

    switch (field) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !formData.email || !emailRegex.test(formData.email);
      case 'telefono':
        if (whatsappOptional && !formData.telefono) return false;
        const phoneRegex = /^\+\d{1,4}\d{10}$/;
        return !formData.telefono || !phoneRegex.test(formData.telefono);
      default:
        return !formData[field];
    }
  }, [formData, touchedFields, whatsappOptional]);

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      {/* Encabezado */}
      {!hideHeader && title && (
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
      )}

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
            WhatsApp {whatsappOptional ? '(opcional)' : '*'}
          </label>
          <div className="flex">
            <select
              value={countryCode}
              onChange={(e) => handleCountryCodeChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-l-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
            >
              {COUNTRY_CODES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.code}
                </option>
              ))}
            </select>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className={`flex-1 px-3 py-2 border rounded-r-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                hasError('telefono') ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Número a 10 dígitos"
              maxLength={10}
            />
          </div>
          {hasError('telefono') && (
            <p className="text-xs text-red-500 mt-1">
              Ingresa un número válido de 10 dígitos
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