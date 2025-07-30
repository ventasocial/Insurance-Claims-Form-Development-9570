import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import MagicLinkDialog from './MagicLinkDialog';

const { FiArrowLeft, FiLink } = FiIcons;

const FormHeader = ({ currentStep, totalSteps, formData }) => {
  const navigate = useNavigate();
  const [showMagicLinkDialog, setShowMagicLinkDialog] = useState(false);

  return (
    <>
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <SafeIcon icon={FiArrowLeft} className="text-xl text-gray-600" />
              </motion.button>
              <img
                src="https://storage.googleapis.com/msgsndr/HWRXLf7lstECUAG07eRw/media/685d77c05c72d29e532e823f.png"
                alt="Fortex"
                className="h-8"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Paso {currentStep + 1} de {totalSteps}
              </div>
              {currentStep > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowMagicLinkDialog(true)}
                  className="flex items-center gap-1 text-sm text-[#204499] hover:text-blue-700 transition-colors"
                >
                  <SafeIcon icon={FiLink} className="text-sm" />
                  <span className="hidden sm:inline">Guardar y continuar después</span>
                  <span className="sm:hidden">Guardar</span>
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showMagicLinkDialog && (
        <MagicLinkDialog 
          formData={formData} 
          onClose={() => setShowMagicLinkDialog(false)} 
        />
      )}
    </>
  );
};

export default FormHeader;