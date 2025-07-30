import React from 'react';
import { motion } from 'framer-motion';

const ContactInfo = ({ formData, updateFormData }) => {
  const handleChange = (field, value) => {
    updateFormData('contactInfo', {
      ...formData.contactInfo,
      [field]: value
    });
  };

  // Validación de WhatsApp
  const validateWhatsApp = (phone) => {
    const phoneRegex = /^\+52\d{10}$/;
    return phoneRegex.test(phone);
  };

  // Validación de email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isWhatsAppValid = validateWhatsApp(formData.contactInfo?.telefono || '');
  const isEmailValid = validateEmail(formData.contactInfo?.email || '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Información de Contacto
        </h2>
        <p className="text-gray-600">
          Ingresa tus datos de contacto para iniciar el proceso
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre(s) *
          </label>
          <input
            type="text"
            value={formData.contactInfo?.nombres || ''}
            onChange={(e) => handleChange('nombres', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent transition-all duration-300 text-lg"
            placeholder="Ingresa tu(s) nombre(s)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Apellido Paterno *
          </label>
          <input
            type="text"
            value={formData.contactInfo?.apellidoPaterno || ''}
            onChange={(e) => handleChange('apellidoPaterno', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent transition-all duration-300 text-lg"
            placeholder="Apellido paterno"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Apellido Materno *
          </label>
          <input
            type="text"
            value={formData.contactInfo?.apellidoMaterno || ''}
            onChange={(e) => handleChange('apellidoMaterno', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent transition-all duration-300 text-lg"
            placeholder="Apellido materno"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            WhatsApp *
          </label>
          <input
            type="tel"
            value={formData.contactInfo?.telefono || ''}
            onChange={(e) => handleChange('telefono', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent transition-all duration-300 text-lg ${
              formData.contactInfo?.telefono && !isWhatsAppValid 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300'
            }`}
            placeholder="+528122334455"
          />
          {formData.contactInfo?.telefono && !isWhatsAppValid && (
            <p className="text-red-500 text-sm mt-1">
              Formato requerido: +528122334455 (código de país +52 seguido de 10 dígitos)
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Correo Electrónico *
          </label>
          <input
            type="email"
            value={formData.contactInfo?.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent transition-all duration-300 text-lg ${
              formData.contactInfo?.email && !isEmailValid 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300'
            }`}
            placeholder="tu@email.com"
          />
          {formData.contactInfo?.email && !isEmailValid && (
            <p className="text-red-500 text-sm mt-1">
              Ingresa un correo electrónico válido (ejemplo: usuario@dominio.com)
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ContactInfo;