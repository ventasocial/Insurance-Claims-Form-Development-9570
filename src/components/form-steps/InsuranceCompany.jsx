import React from 'react';
import { motion } from 'framer-motion';

const InsuranceCompany = ({ formData, updateFormData }) => {
  const companies = [
    {
      id: 'gnp',
      name: 'GNP',
      logo: 'https://storage.googleapis.com/msgsndr/HWRXLf7lstECUAG07eRw/media/6889b7c3c625b807234efbbb.png'
    },
    {
      id: 'axa',
      name: 'AXA', 
      logo: 'https://storage.googleapis.com/msgsndr/HWRXLf7lstECUAG07eRw/media/6889b7c3b67b66d426854871.png'
    },
    {
      id: 'qualitas',
      name: 'Qualitas',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Qualitas_logo.svg/1200px-Qualitas_logo.svg.png'
    }
  ];

  const handleSelect = (companyId) => {
    updateFormData('insuranceCompany', companyId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Selecciona tu Aseguradora
        </h2>
        <p className="text-gray-600">
          Elige la compañía de seguros con la que tienes tu póliza
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {companies.map((company, index) => (
          <motion.button
            key={company.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelect(company.id)}
            className={`p-6 rounded-xl border-2 transition-all duration-300 ${
              formData.insuranceCompany === company.id
                ? 'border-[#204499] bg-blue-50 shadow-lg'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <img
                  src={company.logo}
                  alt={company.name}
                  className="max-w-16 max-h-16 object-contain"
                />
              </div>
              <span className="font-semibold text-lg text-gray-900">
                {company.name}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default InsuranceCompany;