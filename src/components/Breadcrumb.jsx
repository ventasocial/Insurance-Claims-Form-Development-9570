import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiChevronRight } = FiIcons;

const Breadcrumb = ({ formData }) => {
  // Función para obtener los elementos del breadcrumb basado en el formData
  const getBreadcrumbItems = () => {
    const items = [];
    
    // Aseguradora
    if (formData.insuranceCompany) {
      const insuranceMap = {
        'gnp': 'GNP',
        'axa': 'AXA'
      };
      items.push(insuranceMap[formData.insuranceCompany] || formData.insuranceCompany);
    }
    
    // Tipo de reclamo
    if (formData.claimType) {
      const claimTypeMap = {
        'reembolso': 'Reembolso',
        'programacion': 'Programación'
      };
      items.push(claimTypeMap[formData.claimType] || formData.claimType);
    }
    
    // Tipo de reembolso (si aplica)
    if (formData.claimType === 'reembolso' && formData.reimbursementType) {
      const reimbursementTypeMap = {
        'inicial': 'Inicial',
        'complemento': 'Complemento'
      };
      items.push(reimbursementTypeMap[formData.reimbursementType] || formData.reimbursementType);
    }
    
    // Servicios seleccionados (si aplica)
    if (formData.serviceTypes && formData.serviceTypes.length > 0) {
      const serviceTypeMap = {
        'hospital': 'Hospital',
        'estudios': 'Estudios',
        'honorarios': 'Honorarios',
        'medicamentos': 'Medicamentos',
        'terapia': 'Terapia'
      };
      
      const serviceNames = formData.serviceTypes.map(type => serviceTypeMap[type] || type);
      items.push(serviceNames.join(', '));
    }
    
    // Tipo de programación (si aplica)
    if (formData.claimType === 'programacion' && formData.programmingService) {
      const programmingMap = {
        'medicamentos': 'Medicamentos',
        'terapia': 'Terapia',
        'cirugia': 'Cirugía'
      };
      items.push(programmingMap[formData.programmingService] || formData.programmingService);
      
      // Tipo de cirugía (si aplica)
      if (formData.programmingService === 'cirugia' && formData.isCirugiaOrtopedica !== undefined) {
        items.push(formData.isCirugiaOrtopedica ? 'Traumatología/Ortopedia' : 'Otro tipo');
      }
    }
    
    return items;
  };
  
  const breadcrumbItems = getBreadcrumbItems();
  
  if (breadcrumbItems.length === 0) {
    return null;
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-100 rounded-lg px-4 py-2 mb-6 overflow-x-auto"
    >
      <div className="flex items-center space-x-2 text-sm whitespace-nowrap">
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <SafeIcon 
                icon={FiChevronRight} 
                className="text-gray-400 flex-shrink-0" 
              />
            )}
            <span 
              className={`${
                index === breadcrumbItems.length - 1
                  ? 'font-semibold text-[#204499]'
                  : 'text-gray-600'
              }`}
            >
              {item}
            </span>
          </React.Fragment>
        ))}
      </div>
    </motion.div>
  );
};

export default Breadcrumb;