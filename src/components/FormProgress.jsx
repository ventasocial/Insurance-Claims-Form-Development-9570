import React from 'react';
import { motion } from 'framer-motion';

const FormProgress = ({ currentStep, totalSteps, steps }) => {
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="bg-gray-200 rounded-full h-2 mb-6">
        <motion.div
          className="bg-[#204499] h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between items-center mb-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center flex-1">
            <motion.div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all duration-300 ${
                index <= currentStep
                  ? 'bg-[#204499] border-[#204499] text-white'
                  : 'bg-white border-gray-300 text-gray-400'
              }`}
              initial={{ scale: 0.8 }}
              animate={{ 
                scale: index === currentStep ? 1.1 : 1,
                backgroundColor: index <= currentStep ? '#204499' : '#ffffff'
              }}
              transition={{ duration: 0.3 }}
            >
              {index + 1}
            </motion.div>
            <span className={`text-xs mt-2 text-center px-1 ${
              index <= currentStep ? 'text-[#204499] font-medium' : 'text-gray-400'
            }`}>
              {step.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormProgress;