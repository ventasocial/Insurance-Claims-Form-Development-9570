import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPill, FiHeart, FiScissors } = FiIcons;

const ProgrammingDetails = ({ formData, updateFormData }) => {
  const programmingServices = [
    {
      id: 'medicamentos',
      title: 'Medicamentos',
      description: 'Autorización para medicamentos especiales',
      icon: FiPill
    },
    {
      id: 'terapia',
      title: 'Terapia o Rehabilitación',
      description: 'Programación de sesiones de terapia',
      icon: FiHeart
    },
    {
      id: 'cirugia',
      title: 'Cirugía',
      description: 'Programación de procedimientos quirúrgicos',
      icon: FiScissors
    }
  ];

  const surgeryTypes = [
    { id: 'traumatologia', title: 'Traumatología' },
    { id: 'ortopedia', title: 'Ortopedia' },
    { id: 'neurologia', title: 'Neurología' }
  ];

  const handleServiceChange = (serviceId) => {
    updateFormData('programmingService', serviceId);
    if (serviceId !== 'cirugia') {
      updateFormData('surgeryType', '');
    }
  };

  const handleSurgeryTypeChange = (surgeryType) => {
    updateFormData('surgeryType', surgeryType);
  };

  const showSurgeryTypes = formData.programmingService === 'cirugia' && formData.insuranceCompany === 'gnp';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Detalles de Programación
        </h2>
        <p className="text-gray-600">
          Selecciona el tipo de servicio que deseas programar
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Tipo de Servicio *
          </label>
          <div className="grid md:grid-cols-3 gap-4">
            {programmingServices.map((service) => (
              <motion.button
                key={service.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleServiceChange(service.id)}
                className={`p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                  formData.programmingService === service.id
                    ? 'border-[#204499] bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    formData.programmingService === service.id
                      ? 'bg-[#204499] text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    <SafeIcon icon={service.icon} className="text-2xl" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg mb-1">
                      {service.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {service.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {showSurgeryTypes && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <label className="block text-sm font-medium text-gray-700">
              Tipo de Cirugía (GNP) *
            </label>
            <div className="grid md:grid-cols-3 gap-4">
              {surgeryTypes.map((surgery) => (
                <motion.button
                  key={surgery.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSurgeryTypeChange(surgery.id)}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    formData.surgeryType === surgery.id
                      ? 'border-[#204499] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium">{surgery.title}</span>
                </motion.button>
              ))}
            </div>
            <p className="text-sm text-gray-500">
              Selecciona el tipo de cirugía si aplica para tu caso con GNP
            </p>
          </motion.div>
        )}

        {formData.programmingService && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4"
          >
            <p className="text-green-800 font-medium">
              Servicio seleccionado: {programmingServices.find(s => s.id === formData.programmingService)?.title}
            </p>
            {showSurgeryTypes && formData.surgeryType && (
              <p className="text-green-600 text-sm mt-1">
                Tipo de cirugía: {surgeryTypes.find(s => s.id === formData.surgeryType)?.title}
              </p>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ProgrammingDetails;