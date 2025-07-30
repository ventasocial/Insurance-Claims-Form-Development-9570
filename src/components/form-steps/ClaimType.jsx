import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiDollarSign, FiCalendar } = FiIcons;

const ClaimType = ({ formData, updateFormData }) => {
  const claimTypes = [
    {
      id: 'reembolso',
      title: 'Reembolso',
      description: 'Solicitar reembolso de gastos médicos ya realizados',
      icon: FiDollarSign,
      color: 'blue'
    },
    {
      id: 'programacion',
      title: 'Programación',
      description: 'Programar servicios médicos futuros',
      icon: FiCalendar,
      color: 'green'
    }
    // Eliminada la opción de Maternidad
  ];

  const handleSelect = (type) => {
    updateFormData('claimType', type);
  };

  const getColorClasses = (color, isSelected) => {
    const colors = {
      blue: isSelected ? 'border-[#204499] bg-blue-50 text-[#204499]' : 'border-gray-200 hover:border-blue-300',
      green: isSelected ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-200 hover:border-green-300'
    };
    return colors[color];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Tipo de Reclamo
        </h2>
        <p className="text-gray-600">
          Selecciona el tipo de reclamo que deseas realizar
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {claimTypes.map((type, index) => (
          <motion.button
            key={type.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelect(type.id)}
            className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${getColorClasses(
              type.color,
              formData.claimType === type.id
            )}`}
          >
            <div className="flex flex-col space-y-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${formData.claimType === type.id ? `bg-${type.color}-100` : 'bg-gray-100'}`}>
                <SafeIcon
                  icon={type.icon}
                  className={`text-2xl ${
                    formData.claimType === type.id
                      ? type.color === 'blue'
                        ? 'text-[#204499]'
                        : `text-${type.color}-600`
                      : 'text-gray-400'
                  }`}
                />
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-2">
                  {type.title}
                </h3>
                <p className={`text-sm ${formData.claimType === type.id ? 'text-gray-700' : 'text-gray-500'}`}>
                  {type.description}
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default ClaimType;