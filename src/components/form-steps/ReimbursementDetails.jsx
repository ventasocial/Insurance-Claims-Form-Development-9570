import React from 'react';
import { motion } from 'framer-motion';

const ReimbursementDetails = ({ formData, updateFormData }) => {
  const handleTypeChange = (type) => {
    updateFormData('reimbursementType', type);
    if (type === 'inicial') {
      updateFormData('claimNumber', '');
    }
  };

  const handleClaimNumberChange = (value) => {
    updateFormData('claimNumber', value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Detalles del Reembolso
        </h2>
        <p className="text-gray-600">
          Especifica el tipo de siniestro que deseas reportar
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Tipo de Siniestro *
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleTypeChange('inicial')}
              className={`p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                formData.reimbursementType === 'inicial'
                  ? 'border-[#204499] bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="font-semibold text-lg mb-2">Inicial</h3>
              <p className="text-sm text-gray-600">
                Primera vez que reportas este siniestro
              </p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleTypeChange('complemento')}
              className={`p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                formData.reimbursementType === 'complemento'
                  ? 'border-[#204499] bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="font-semibold text-lg mb-2">Complemento</h3>
              <p className="text-sm text-gray-600">
                Agregar documentos a un reclamo existente
              </p>
            </motion.button>
          </div>
        </div>

        {formData.reimbursementType === 'complemento' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Reclamo *
            </label>
            <input
              type="text"
              value={formData.claimNumber || ''}
              onChange={(e) => handleClaimNumberChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent transition-all duration-300 text-lg"
              placeholder="Ingresa el número de reclamo proporcionado por la aseguradora"
            />
            <p className="text-sm text-gray-500 mt-2">
              Este número te fue proporcionado por la aseguradora al crear el reclamo inicial
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ReimbursementDetails;