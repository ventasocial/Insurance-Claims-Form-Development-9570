import React from 'react';
import { motion } from 'framer-motion';

const SinisterDescription = ({ formData, updateFormData }) => {
  const handleDescriptionChange = (value) => {
    updateFormData('sinisterDescription', value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Descripción del Siniestro
        </h2>
        <p className="text-gray-600">
          Describe brevemente cómo ocurrió el siniestro o evento médico
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descripción del Evento *
        </label>
        <textarea
          value={formData.sinisterDescription || ''}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          rows={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent transition-all duration-300 text-lg resize-none"
          placeholder="Describe cómo ocurrió el siniestro, cuándo sucedió, qué síntomas presentaste, qué tratamiento recibiste, etc. Proporciona todos los detalles relevantes que puedan ayudar a procesar tu reclamo."
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-sm text-gray-500">
            Mínimo 10 caracteres requeridos
          </p>
          <p className={`text-sm ${
            (formData.sinisterDescription || '').length >= 10 
              ? 'text-green-600' 
              : 'text-gray-400'
          }`}>
            {(formData.sinisterDescription || '').length} caracteres
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">
          Información útil para incluir:
        </h3>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• Fecha y hora del incidente</li>
          <li>• Lugar donde ocurrió</li>
          <li>• Síntomas o lesiones presentadas</li>
          <li>• Tratamiento médico recibido</li>
          <li>• Médicos o hospitales involucrados</li>
          <li>• Cualquier circunstancia especial</li>
        </ul>
      </div>
    </motion.div>
  );
};

export default SinisterDescription;