import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUpload, FiFile, FiTrash2, FiEye } = FiIcons;

const DocumentsSection = ({ formData, updateFormData }) => {
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [previewFile, setPreviewFile] = useState(null);

  const handleFileUpload = (documentType, files) => {
    const newFiles = { ...uploadedFiles };
    if (!newFiles[documentType]) {
      newFiles[documentType] = [];
    }
    
    Array.from(files).forEach(file => {
      newFiles[documentType].push({
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        file: file
      });
    });
    
    setUploadedFiles(newFiles);
    updateFormData('documents', newFiles);
  };

  const removeFile = (documentType, fileIndex) => {
    const newFiles = { ...uploadedFiles };
    if (newFiles[documentType]) {
      newFiles[documentType].splice(fileIndex, 1);
      if (newFiles[documentType].length === 0) {
        delete newFiles[documentType];
      }
    }
    setUploadedFiles(newFiles);
    updateFormData('documents', newFiles);
  };

  const getDocumentRequirements = () => {
    const requirements = {
      forms: [],
      sinisterDocs: [],
      receipts: []
    };

    // Forms section
    requirements.forms.push({
      id: 'forma-aseguradora',
      title: 'Forma de la Aseguradora',
      description: 'Formulario oficial que debe ser firmado'
    });

    // Sinister documents
    if (formData.claimType === 'programacion') {
      requirements.sinisterDocs.push({
        id: 'informe-medico',
        title: 'Informe Médico',
        description: 'Informe médico detallado para programación'
      });

      if (formData.programmingService === 'cirugia' && 
          formData.insuranceCompany === 'gnp' && 
          ['traumatologia', 'ortopedia', 'neurologia'].includes(formData.surgeryType)) {
        requirements.sinisterDocs.push({
          id: 'formato-cirugia',
          title: 'Formato de Programación de Cirugía',
          description: 'Formato específico para cirugías de traumatología, ortopedia o neurología'
        });
      }
    }

    if (formData.claimType === 'reembolso') {
      requirements.sinisterDocs.push({
        id: 'estado-cuenta',
        title: 'Carátula del Estado de Cuenta Bancaria',
        description: 'Para procesar el reembolso'
      });
    }

    // Receipts and documents
    if (formData.claimType === 'reembolso' && formData.serviceTypes) {
      formData.serviceTypes.forEach(service => {
        switch (service) {
          case 'hospital':
            requirements.receipts.push({
              id: 'factura-hospital',
              title: 'Facturas de Hospital',
              description: 'Facturas de servicios hospitalarios'
            });
            break;
          case 'estudios':
            requirements.receipts.push({
              id: 'estudios-archivos',
              title: 'Archivos de Estudios',
              description: 'Resultados de laboratorio e imagenología'
            });
            requirements.receipts.push({
              id: 'facturas-estudios',
              title: 'Facturas de Estudios',
              description: 'Facturas de laboratorio e imagenología'
            });
            break;
          case 'honorarios':
            requirements.receipts.push({
              id: 'recibos-medicos',
              title: 'Recibos y Facturas Médicas',
              description: 'Honorarios de médicos y especialistas'
            });
            break;
          case 'medicamentos':
            requirements.receipts.push({
              id: 'facturas-medicamentos',
              title: 'Facturas de Medicamentos',
              description: 'Facturas de farmacias'
            });
            requirements.receipts.push({
              id: 'recetas-medicamentos',
              title: 'Recetas de Medicamentos',
              description: 'Recetas con dosis y período de administración'
            });
            break;
          case 'terapia':
            requirements.receipts.push({
              id: 'facturas-terapia',
              title: 'Facturas de Terapia',
              description: 'Facturas de terapia y rehabilitación'
            });
            requirements.receipts.push({
              id: 'recetas-terapia',
              title: 'Recetas de Terapias',
              description: 'Prescripciones médicas para terapias'
            });
            requirements.receipts.push({
              id: 'carnet-asistencia',
              title: 'Carnet de Asistencia a Terapias',
              description: 'Registro de asistencia a sesiones'
            });
            break;
        }
      });
    }

    if (formData.claimType === 'programacion') {
      switch (formData.programmingService) {
        case 'cirugia':
          requirements.receipts.push({
            id: 'interpretacion-estudios-cirugia',
            title: 'Interpretación de Estudios',
            description: 'Interpretación de estudios que corroboren el diagnóstico'
          });
          break;
        case 'medicamentos':
          requirements.receipts.push({
            id: 'recetas-prog-medicamentos',
            title: 'Recetas de Medicamentos',
            description: 'Recetas para medicamentos a programar'
          });
          requirements.receipts.push({
            id: 'interpretacion-estudios-med',
            title: 'Interpretación de Estudios (Opcional)',
            description: 'Interpretación de estudios que corroboren el diagnóstico'
          });
          break;
        case 'terapia':
          requirements.receipts.push({
            id: 'bitacora-medico',
            title: 'Bitácora del Médico',
            description: 'Indicación de terapias, sesiones y tiempos'
          });
          requirements.receipts.push({
            id: 'interpretacion-estudios-terapia',
            title: 'Interpretación de Estudios',
            description: 'Interpretación de estudios que corroboren el diagnóstico'
          });
          break;
      }
    }

    return requirements;
  };

  const requirements = getDocumentRequirements();

  const FileUploadArea = ({ document }) => (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-[#204499] transition-colors">
      <input
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => handleFileUpload(document.id, e.target.files)}
        className="hidden"
        id={`upload-${document.id}`}
      />
      <label
        htmlFor={`upload-${document.id}`}
        className="cursor-pointer flex flex-col items-center space-y-3"
      >
        <SafeIcon icon={FiUpload} className="text-3xl text-gray-400" />
        <div className="text-center">
          <p className="font-medium text-gray-700">{document.title}</p>
          <p className="text-sm text-gray-500 mt-1">{document.description}</p>
          <p className="text-xs text-gray-400 mt-2">
            Arrastra archivos aquí o haz clic para seleccionar
          </p>
        </div>
      </label>
    </div>
  );

  const FileList = ({ documentType }) => {
    const files = uploadedFiles[documentType] || [];
    
    if (files.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <SafeIcon icon={FiFile} className="text-3xl mx-auto mb-2" />
          <p>No hay archivos cargados</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {files.map((file, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <SafeIcon icon={FiFile} className="text-lg text-blue-500" />
              <div>
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPreviewFile(file)}
                className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <SafeIcon icon={FiEye} className="text-sm" />
              </button>
              <button
                onClick={() => removeFile(documentType, index)}
                className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
              >
                <SafeIcon icon={FiTrash2} className="text-sm" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const DocumentSection = ({ title, documents, bgColor = "bg-white" }) => (
    <div className={`${bgColor} rounded-xl p-6 shadow-sm`}>
      <h3 className="text-xl font-semibold text-gray-900 mb-6">{title}</h3>
      <div className="space-y-8">
        {documents.map((doc) => (
          <div key={doc.id} className="grid md:grid-cols-2 gap-6">
            <div>
              <FileUploadArea document={doc} />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Archivos Cargados</h4>
              <FileList documentType={doc.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Documentos Requeridos
        </h2>
        <p className="text-gray-600">
          Sube todos los documentos necesarios para procesar tu reclamo
        </p>
      </div>

      {requirements.forms.length > 0 && (
        <DocumentSection
          title="1. Formas de la Aseguradora"
          documents={requirements.forms}
          bgColor="bg-blue-50"
        />
      )}

      {requirements.sinisterDocs.length > 0 && (
        <DocumentSection
          title="2. Documentos del Siniestro"
          documents={requirements.sinisterDocs}
          bgColor="bg-green-50"
        />
      )}

      {requirements.receipts.length > 0 && (
        <DocumentSection
          title="3. Facturas, Recetas y Otros Documentos"
          documents={requirements.receipts}
          bgColor="bg-yellow-50"
        />
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-medium">{previewFile.name}</h3>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              {previewFile.type.startsWith('image/') ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="max-w-full h-auto"
                />
              ) : (
                <p className="text-center py-8 text-gray-500">
                  Vista previa no disponible para este tipo de archivo
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DocumentsSection;