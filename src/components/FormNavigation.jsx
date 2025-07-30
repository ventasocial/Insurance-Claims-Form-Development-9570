import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiArrowLeft, FiArrowRight, FiCheck } = FiIcons;

const FormNavigation = ({
  currentStep,
  totalSteps,
  canProceed,
  onNext,
  onPrev,
  onSubmit,
  isSubmitting
}) => {
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="flex justify-between items-center pt-8 mt-8 border-t border-gray-200">
      <motion.button
        whileHover={{ scale: currentStep > 0 ? 1.05 : 1 }}
        whileTap={{ scale: currentStep > 0 ? 0.95 : 1 }}
        onClick={onPrev}
        disabled={currentStep === 0 || isSubmitting}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
          currentStep === 0 || isSubmitting
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <SafeIcon icon={FiArrowLeft} className="text-lg" />
        Anterior
      </motion.button>

      <div className="text-sm text-gray-500">
        {currentStep + 1} de {totalSteps}
      </div>

      <motion.button
        whileHover={{ scale: canProceed ? 1.05 : 1 }}
        whileTap={{ scale: canProceed ? 0.95 : 1 }}
        onClick={isLastStep ? onSubmit : onNext}
        disabled={!canProceed || isSubmitting}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
          canProceed && !isSubmitting
            ? 'bg-[#204499] hover:bg-blue-700 text-white shadow-lg'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isLastStep ? (
          isSubmitting ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
              Enviando...
            </>
          ) : (
            <>
              <SafeIcon icon={FiCheck} className="text-lg" />
              Enviar Reclamo
            </>
          )
        ) : (
          <>
            Siguiente
            <SafeIcon icon={FiArrowRight} className="text-lg" />
          </>
        )}
      </motion.button>
    </div>
  );
};

export default FormNavigation;