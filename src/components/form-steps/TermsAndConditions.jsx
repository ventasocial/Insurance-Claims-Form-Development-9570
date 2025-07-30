import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiCheckCircle, FiChevronRight } = FiIcons;

const TermsAndConditions = ({ formData, updateFormData }) => {
  const handleAcceptTerms = (event) => {
    updateFormData('acceptedTerms', event.target.checked);
  };

  const handleAcceptPrivacy = (event) => {
    updateFormData('acceptedPrivacy', event.target.checked);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Términos y Condiciones
        </h2>
        <p className="text-gray-600">
          Antes de enviar tu reclamo, por favor acepta nuestros términos y políticas
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <SafeIcon icon={FiCheckCircle} className="text-lg text-[#204499]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Importante</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Al enviar este formulario de reclamo, confirmas que:
                </p>
                <ul className="text-sm text-gray-600 space-y-2 pl-1">
                  <li className="flex items-start gap-2">
                    <SafeIcon icon={FiChevronRight} className="text-[#204499] flex-shrink-0 mt-1" />
                    <span>Toda la información proporcionada es verdadera y correcta.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <SafeIcon icon={FiChevronRight} className="text-[#204499] flex-shrink-0 mt-1" />
                    <span>Los documentos adjuntos son auténticos y no han sido alterados.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <SafeIcon icon={FiChevronRight} className="text-[#204499] flex-shrink-0 mt-1" />
                    <span>Eres cliente de Fortex y estás autorizado para presentar este reclamo.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="accept-terms"
                checked={formData.acceptedTerms || false}
                onChange={handleAcceptTerms}
                className="mt-1 h-5 w-5 text-[#204499] rounded border-gray-300 focus:ring-[#204499]"
              />
              <div>
                <label htmlFor="accept-terms" className="block font-medium text-gray-900">
                  Acepto los Términos y Condiciones
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  He leído y acepto los{" "}
                  <Link to="/terms" target="_blank" className="text-[#204499] hover:underline">
                    Términos y Condiciones
                  </Link>{" "}
                  para el procesamiento de mi reclamo.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="accept-privacy"
                checked={formData.acceptedPrivacy || false}
                onChange={handleAcceptPrivacy}
                className="mt-1 h-5 w-5 text-[#204499] rounded border-gray-300 focus:ring-[#204499]"
              />
              <div>
                <label htmlFor="accept-privacy" className="block font-medium text-gray-900">
                  Acepto la Política de Privacidad
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Acepto que mis datos sean tratados de acuerdo con la{" "}
                  <Link to="/privacy" target="_blank" className="text-[#204499] hover:underline">
                    Política de Privacidad
                  </Link>.
                </p>
              </div>
            </div>
          </div>

          {(formData.acceptedTerms && formData.acceptedPrivacy) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4"
            >
              <div className="flex items-center gap-2">
                <SafeIcon icon={FiCheckCircle} className="text-green-600 text-lg" />
                <p className="text-green-800 font-medium">
                  ¡Gracias! Ya puedes continuar con el envío de tu reclamo
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TermsAndConditions;