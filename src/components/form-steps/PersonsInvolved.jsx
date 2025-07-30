import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUser, FiUserCheck, FiPhone, FiMail } = FiIcons;

const PersonsInvolved = ({ formData, updateFormData }) => {
  const [activeTab, setActiveTab] = useState('contactInfo');
  const [tabsCompleted, setTabsCompleted] = useState({});

  // Determinar qué pestañas mostrar basado en el tipo de reclamo
  const getPersonTypes = () => {
    const baseTypes = [
      {
        id: 'contactInfo',
        title: 'Contacto',
        description: 'Quien reporta el reclamo'
      },
      {
        id: 'titularAsegurado',
        title: 'Asegurado Titular',
        description: 'Titular de la póliza'
      },
      {
        id: 'aseguradoAfectado',
        title: 'Asegurado Afectado',
        description: 'Persona que requiere atención'
      }
    ];

    // Agregar titular de cuenta bancaria solo si es reembolso
    if (formData.claimType === 'reembolso') {
      baseTypes.push({
        id: 'titularCuenta',
        title: 'Titular Cuenta Bancaria',
        description: 'Para reembolsos'
      });
    }

    return baseTypes;
  };

  const personTypes = getPersonTypes();

  // Si el activeTab ya no está en personTypes, resetear a la primera pestaña
  useEffect(() => {
    if (!personTypes.some(type => type.id === activeTab)) {
      setActiveTab(personTypes[0].id);
    }
  }, [personTypes.length]); // Solo depende de la longitud, no del array completo

  // Función simplificada para manejar cambios en los campos del formulario
  const handlePersonDataChange = (personType, field, value) => {
    if (personType === 'contactInfo') {
      const updatedContactInfo = { ...formData.contactInfo, [field]: value };
      updateFormData('contactInfo', updatedContactInfo);
    } else {
      const updatedPersonsInvolved = {
        ...formData.personsInvolved,
        [personType]: { ...(formData.personsInvolved?.[personType] || {}), [field]: value }
      };
      updateFormData('personsInvolved', updatedPersonsInvolved);
    }
  };

  // Función separada para actualizar el estado de completado
  const updateTabCompletion = (personType) => {
    let isComplete = false;
    if (personType === 'contactInfo') {
      const contactInfo = formData.contactInfo || {};
      isComplete = validatePersonData(contactInfo);
    } else {
      const personData = formData.personsInvolved?.[personType] || {};
      isComplete = validatePersonData(personData);
    }

    setTabsCompleted(prev => ({ ...prev, [personType]: isComplete }));
  };

  // Validar si los datos de una persona están completos
  const validatePersonData = (data) => {
    if (!data) return false;
    
    // Verificar campos obligatorios
    const requiredFields = ['nombres', 'apellidoPaterno', 'apellidoMaterno', 'email', 'telefono'];
    const hasAllFields = requiredFields.every(field => data[field] && data[field].trim() !== '');
    
    if (!hasAllFields) return false;
    
    // Validar formato de email y teléfono
    return validateEmail(data.email) && validateWhatsApp(data.telefono);
  };

  const handleSameAsContact = (personType, checked) => {
    if (checked) {
      const contactData = {
        nombres: formData.contactInfo?.nombres || '',
        apellidoPaterno: formData.contactInfo?.apellidoPaterno || '',
        apellidoMaterno: formData.contactInfo?.apellidoMaterno || '',
        telefono: formData.contactInfo?.telefono || '',
        email: formData.contactInfo?.email || ''
      };
      const updatedPersonsInvolved = {
        ...formData.personsInvolved,
        [personType]: contactData
      };
      updateFormData('personsInvolved', updatedPersonsInvolved);
    } else {
      // Al desmarcar, limpiamos los campos pero mantenemos la estructura
      const updatedPersonsInvolved = {
        ...formData.personsInvolved,
        [personType]: {
          nombres: '',
          apellidoPaterno: '',
          apellidoMaterno: '',
          telefono: '',
          email: ''
        }
      };
      updateFormData('personsInvolved', updatedPersonsInvolved);
    }
  };

  const isContactDataSame = (personType) => {
    const personData = formData.personsInvolved?.[personType] || {};
    const contactInfo = formData.contactInfo || {};
    return (
      personData.nombres === contactInfo.nombres &&
      personData.apellidoPaterno === contactInfo.apellidoPaterno &&
      personData.apellidoMaterno === contactInfo.apellidoMaterno &&
      personData.telefono === contactInfo.telefono &&
      personData.email === contactInfo.email
    );
  };

  // Validación de WhatsApp
  const validateWhatsApp = (phone) => {
    if (!phone) return false;
    const phoneRegex = /^\+52\d{10}$/;
    return phoneRegex.test(phone);
  };

  // Validación de email
  const validateEmail = (email) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Manejar el avance a la siguiente pestaña
  const handleNextTab = () => {
    const currentIndex = personTypes.findIndex(type => type.id === activeTab);
    if (currentIndex < personTypes.length - 1) {
      setActiveTab(personTypes[currentIndex + 1].id);
    }
  };

  // Manejar el retroceso a la pestaña anterior
  const handlePrevTab = () => {
    const currentIndex = personTypes.findIndex(type => type.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(personTypes[currentIndex - 1].id);
    }
  };

  // Actualizar estado de completado cuando cambien los datos
  useEffect(() => {
    personTypes.forEach(type => {
      updateTabCompletion(type.id);
    });
  }, [formData.contactInfo, formData.personsInvolved]);

  const ContactInfoForm = () => {
    const contactInfo = formData.contactInfo || {};
    const isWhatsAppValid = validateWhatsApp(contactInfo.telefono || '');
    const isEmailValid = validateEmail(contactInfo.email || '');

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <SafeIcon icon={FiPhone} className="text-blue-600" />
            <div>
              <h3 className="font-medium text-blue-900">Contacto</h3>
              <p className="text-sm text-blue-700">
                Esta es la información de la persona que está reportando el reclamo y será contactada por Fortex.
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre(s) *
            </label>
            <input
              type="text"
              value={contactInfo.nombres || ''}
              onChange={(e) => handlePersonDataChange('contactInfo', 'nombres', e.target.value)}
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
              value={contactInfo.apellidoPaterno || ''}
              onChange={(e) => handlePersonDataChange('contactInfo', 'apellidoPaterno', e.target.value)}
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
              value={contactInfo.apellidoMaterno || ''}
              onChange={(e) => handlePersonDataChange('contactInfo', 'apellidoMaterno', e.target.value)}
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
              value={contactInfo.telefono || ''}
              onChange={(e) => handlePersonDataChange('contactInfo', 'telefono', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent transition-all duration-300 text-lg ${
                contactInfo.telefono && !isWhatsAppValid ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="+528122334455"
            />
            {contactInfo.telefono && !isWhatsAppValid && (
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
              value={contactInfo.email || ''}
              onChange={(e) => handlePersonDataChange('contactInfo', 'email', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent transition-all duration-300 text-lg ${
                contactInfo.email && !isEmailValid ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="tu@email.com"
            />
            {contactInfo.email && !isEmailValid && (
              <p className="text-red-500 text-sm mt-1">
                Ingresa un correo electrónico válido (ejemplo: usuario@dominio.com)
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const PersonForm = ({ personType }) => {
    const personData = formData.personsInvolved?.[personType] || {};
    const isSameAsContact = isContactDataSame(personType);
    const isWhatsAppValid = validateWhatsApp(personData.telefono || '');
    const isEmailValid = validateEmail(personData.email || '');

    return (
      <div className="space-y-6">
        {/* Same as contact checkbox */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isSameAsContact}
              onChange={(e) => handleSameAsContact(personType, e.target.checked)}
              className="w-4 h-4 text-[#204499] border-gray-300 rounded focus:ring-[#204499]"
            />
            <div className="flex items-center gap-2">
              <SafeIcon icon={FiUserCheck} className="text-[#204499]" />
              <span className="font-medium text-[#204499]">
                Esta información es la misma que la del contacto
              </span>
            </div>
          </label>
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre(s) *
              </label>
              <input
                type="text"
                value={personData.nombres || ''}
                onChange={(e) => handlePersonDataChange(personType, 'nombres', e.target.value)}
                disabled={isSameAsContact}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent transition-all duration-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Nombre(s)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apellido Paterno *
              </label>
              <input
                type="text"
                value={personData.apellidoPaterno || ''}
                onChange={(e) => handlePersonDataChange(personType, 'apellidoPaterno', e.target.value)}
                disabled={isSameAsContact}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent transition-all duration-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Apellido paterno"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apellido Materno *
              </label>
              <input
                type="text"
                value={personData.apellidoMaterno || ''}
                onChange={(e) => handlePersonDataChange(personType, 'apellidoMaterno', e.target.value)}
                disabled={isSameAsContact}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent transition-all duration-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Apellido materno"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp *
              </label>
              <input
                type="tel"
                value={personData.telefono || ''}
                onChange={(e) => handlePersonDataChange(personType, 'telefono', e.target.value)}
                disabled={isSameAsContact}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent transition-all duration-300 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  personData.telefono && !isWhatsAppValid && !isSameAsContact ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="+528122334455"
              />
              {personData.telefono && !isWhatsAppValid && !isSameAsContact && (
                <p className="text-red-500 text-sm mt-1">
                  Formato requerido: +528122334455 (código de país +52 seguido de 10 dígitos)
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico *
            </label>
            <input
              type="email"
              value={personData.email || ''}
              onChange={(e) => handlePersonDataChange(personType, 'email', e.target.value)}
              disabled={isSameAsContact}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent transition-all duration-300 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                personData.email && !isEmailValid && !isSameAsContact ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="correo@email.com"
            />
            {personData.email && !isEmailValid && !isSameAsContact && (
              <p className="text-red-500 text-sm mt-1">
                Ingresa un correo electrónico válido (ejemplo: usuario@dominio.com)
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Verificar si todos los tabs necesarios están completos
  const areAllTabsCompleted = () => {
    return personTypes.every(type => tabsCompleted[type.id]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Información de Personas Involucradas
        </h2>
        <p className="text-gray-600">
          Completa la información de todas las personas relacionadas con el reclamo
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 overflow-x-auto">
          {personTypes.map((person) => (
            <button
              key={person.id}
              onClick={() => setActiveTab(person.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === person.id
                  ? 'border-[#204499] text-[#204499]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <SafeIcon icon={person.id === 'contactInfo' ? FiMail : FiUser} className="text-lg" />
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    {person.title}
                    {tabsCompleted[person.id] && (
                      <SafeIcon icon={FiUserCheck} className="text-green-500 ml-1" />
                    )}
                  </div>
                  <div className="text-xs text-gray-400">{person.description}</div>
                </div>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Form Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gray-50 rounded-lg p-6"
      >
        {activeTab === 'contactInfo' ? (
          <ContactInfoForm />
        ) : (
          <PersonForm personType={activeTab} />
        )}
      </motion.div>

      {/* Navigation within tabs */}
      <div className="flex justify-between pt-4">
        <button
          onClick={handlePrevTab}
          disabled={activeTab === personTypes[0].id}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === personTypes[0].id
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
        >
          Anterior
        </button>
        {activeTab !== personTypes[personTypes.length - 1].id ? (
          <button
            onClick={handleNextTab}
            className="px-4 py-2 bg-[#204499] text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Siguiente
          </button>
        ) : (
          <div className="flex items-center">
            {!areAllTabsCompleted() && (
              <p className="text-amber-600 mr-2 text-sm">
                Por favor completa todos los formularios
              </p>
            )}
          </div>
        )}
      </div>

      {/* Progress indicator */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-gray-700">Progreso:</span>
          <div className="flex gap-1">
            {personTypes.map((person) => (
              <div
                key={person.id}
                className={`w-3 h-3 rounded-full ${
                  tabsCompleted[person.id] ? 'bg-green-500' : 'bg-gray-300'
                }`}
                title={person.title}
              />
            ))}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-[#204499] h-2 rounded-full transition-all duration-300"
            style={{
              width: `${(Object.values(tabsCompleted).filter(Boolean).length / personTypes.length) * 100}%`
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default PersonsInvolved;