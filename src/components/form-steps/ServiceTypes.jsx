import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiHome, FiActivity, FiUserCheck, FiPill, FiHeart } = FiIcons;

const ServiceTypes = ({ formData, updateFormData }) => {
  const serviceTypes = [
    {
      id: 'hospital',
      title: 'Hospital',
      description: 'Servicios hospitalarios y de internación',
      icon: FiHome
    },
    {
      id: 'estudios',
      title: 'Estudios de Laboratorio e Imagenología',
      description: 'Análisis clínicos, rayos X, resonancias, etc.',
      icon: FiActivity
    },
    {
      id: 'terapia',
      title: 'Terapia o Rehabilitación',
      description: 'Fisioterapia, rehabilitación física, etc.',
      icon: FiHeart
    },
    {
      id: 'honorarios',
      title: 'Honorarios Médicos',
      description: 'Consultas médicas y servicios profesionales',
      icon: FiUserCheck
    },
    {
      id: 'medicamentos',
      title: 'Medicamentos',
      description: 'Medicinas prescritas por el médico',
      icon: FiPill
    }
  ];

  const handleToggleService = (serviceId) => {
    const currentServices = formData.serviceTypes || [];
    const updatedServices = currentServices.includes(serviceId)
      ? currentServices.filter(id => id !== serviceId)
      : [...currentServices, serviceId];
    
    updateFormData('serviceTypes', updatedServices);
  };

  const isSelected = (serviceId) => {
    return (formData.serviceTypes || []).includes(serviceId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Tipos de Servicio
        </h2>
        <p className="text-gray-600">
          Selecciona todos los tipos de servicios que incluye tu reclamo
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {serviceTypes.map((service, index) => (
          <motion.button
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleToggleService(service.id)}
            className={`p-4 rounded-lg border-2 transition-all duration-300 text-left ${
              isSelected(service.id)
                ? 'border-[#204499] bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isSelected(service.id) ? 'bg-[#204499] text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                <SafeIcon icon={service.icon} className="text-lg" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">
                  {service.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {service.description}
                </p>
              </div>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                isSelected(service.id)
                  ? 'border-[#204499] bg-[#204499]'
                  : 'border-gray-300'
              }`}>
                {isSelected(service.id) && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {(formData.serviceTypes || []).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <p className="text-green-800 font-medium">
            Has seleccionado {(formData.serviceTypes || []).length} tipo(s) de servicio
          </p>
          <p className="text-green-600 text-sm mt-1">
            En los siguientes pasos se solicitarán los documentos específicos para cada tipo seleccionado
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ServiceTypes;