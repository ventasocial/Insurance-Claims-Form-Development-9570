import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import supabase from '../../lib/supabase';

const { FiUpload, FiFile, FiTrash2, FiEye, FiPaperclip } = FiIcons;

const DocumentsSection = ({ formData, updateFormData }) => {
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [previewFile, setPreviewFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [emailToSend, setEmailToSend] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleFileUpload = async (documentType, files) => {
    if (!files || files.length === 0) return;
    
    // Si estamos en modo alternativo, no intentamos subir a Supabase
    if (fallbackMode) {
      handleFallbackUpload(documentType, files);
      return;
    }
    
    setUploading(true);
    setUploadError(null);
    
    try {
      const newFiles = { ...uploadedFiles };
      if (!newFiles[documentType]) {
        newFiles[documentType] = [];
      }

      for (let file of Array.from(files)) {
        // Generar un nombre de archivo único para evitar colisiones
        const fileExt = file.name.split('.').pop();
        const fileName = `${documentType}_${Date.now()}.${fileExt}`;
        const filePath = `public/${formData.insuranceCompany}/${formData.claimType}/${fileName}`;
        
        console.log('Intentando subir archivo:', filePath);

        try {
          // Intento directo en carpeta public que tiene permisos preestablecidos
          const { data, error } = await supabase.storage
            .from('claim_documents')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: true,
              contentType: file.type
            });

          if (error) {
            console.error('Error al subir archivo:', error);
            
            // Si hay error de políticas de seguridad, cambiar a modo alternativo
            if (error.message && error.message.includes('security policy')) {
              setUploadError(`Error de permisos: ${error.message}`);
              setFallbackMode(true);
              setShowEmailForm(true);
              return; // Salir del bucle y mostrar opciones alternativas
            } else {
              setUploadError(`Error al subir ${file.name}: ${error.message}`);
            }
          } else {
            console.log('Archivo subido correctamente:', data);
            
            // Obtener la URL pública del archivo
            const { data: { publicUrl } } = supabase.storage
              .from('claim_documents')
              .getPublicUrl(filePath);

            // Almacenar la información del archivo
            newFiles[documentType].push({
              name: file.name,
              size: file.size,
              type: file.type,
              url: URL.createObjectURL(file), // Para vista previa local
              storagePath: filePath, // Para referencia en la base de datos
              publicUrl: publicUrl // URL para acceso público
            });
          }
        } catch (uploadError) {
          console.error('Error inesperado al subir:', uploadError);
          setUploadError(`Error inesperado: ${uploadError.message}`);
          setFallbackMode(true);
          setShowEmailForm(true);
          return;
        }
      }

      // Actualizar el estado local y el formulario con los archivos subidos exitosamente
      setUploadedFiles(newFiles);
      updateFormData('documents', newFiles);
    } catch (error) {
      console.error('Error inesperado al subir archivos:', error);
      setUploadError('Error inesperado al subir archivos. Por favor, inténtalo de nuevo.');
      setFallbackMode(true);
    } finally {
      setUploading(false);
    }
  };

  // Método alternativo para cuando falla Supabase Storage
  const handleFallbackUpload = (documentType, files) => {
    const newFiles = { ...uploadedFiles };
    if (!newFiles[documentType]) {
      newFiles[documentType] = [];
    }

    for (let file of Array.from(files)) {
      newFiles[documentType].push({
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file), // Para vista previa local
        file: file, // Guardamos el archivo real para enviarlo por email después
        isLocal: true // Indicador de que es un archivo local
      });
    }

    setUploadedFiles(newFiles);
    updateFormData('documents', newFiles);
  };

  const handleSendByEmail = async () => {
    if (!emailToSend || !emailToSend.includes('@')) {
      alert('Por favor, ingresa un correo electrónico válido');
      return;
    }

    // En un caso real, aquí se enviarían los archivos por email
    // Por ahora, solo mostramos un mensaje de confirmación
    alert(`Los documentos se enviarán a: ${emailToSend}\n\nPor favor, espera la confirmación del equipo de soporte.`);
    
    // Actualizar el estado del formulario para indicar que se usó el método de email
    updateFormData('documentsSentByEmail', {
      email: emailToSend,
      timestamp: new Date().toISOString()
    });
  };

  const removeFile = async (documentType, fileIndex) => {
    const newFiles = { ...uploadedFiles };
    
    if (newFiles[documentType]) {
      const fileToRemove = newFiles[documentType][fileIndex];
      
      // Si el archivo se subió a Supabase, intentar eliminarlo del almacenamiento
      if (fileToRemove.storagePath && !fileToRemove.isLocal) {
        try {
          const { error } = await supabase.storage
            .from('claim_documents')
            .remove([fileToRemove.storagePath]);
            
          if (error) {
            console.error('Error al eliminar archivo de Supabase:', error);
          }
        } catch (error) {
          console.error('Error inesperado al eliminar archivo:', error);
        }
      }
      
      // Eliminar el archivo de la lista local
      newFiles[documentType].splice(fileIndex, 1);
      if (newFiles[documentType].length === 0) {
        delete newFiles[documentType];
      }
      
      setUploadedFiles(newFiles);
      updateFormData('documents', newFiles);
    }
  };

  const getDocumentRequirements = () => {
    const requirements = {
      forms: [],
      sinisterDocs: [],
      receipts: []
    };
    
    // Forms section requirements
    if (formData.insuranceCompany === 'gnp') {
      if (formData.claimType === 'reembolso') {
        requirements.forms.push(
          { id: 'aviso-accidente-enfermedad', title: 'Aviso de Accidente o Enfermedad', description: 'Formulario oficial que debe ser firmado' },
          { id: 'formato-reembolso', title: 'Formato de Reembolso', description: 'Formulario para solicitar el reembolso' },
          { id: 'formato-unico-bancario', title: 'Formato Único de Información Bancaria', description: 'Información bancaria para el reembolso' }
        );
      } else if (formData.claimType === 'programacion') {
        requirements.forms.push(
          { id: 'aviso-accidente-enfermedad-prog', title: 'Aviso de Accidente o Enfermedad', description: 'Formulario oficial para programación' }
        );
        
        if (formData.programmingService === 'cirugia' && formData.isCirugiaOrtopedica === true) {
          requirements.forms.push(
            { id: 'formato-cirugia-traumatologia', title: 'Formato de Cirugía de Traumatología, Ortopedia y Neurocirugía', description: 'Formato específico para este tipo de cirugías' }
          );
        }
      }
    } else if (formData.insuranceCompany === 'axa') {
      if (formData.claimType === 'programacion') {
        requirements.forms.push(
          { id: 'solicitud-programacion-axa', title: 'Solicitud de Programación', description: 'Formulario de AXA para programación' }
        );
      } else if (formData.claimType === 'reembolso') {
        requirements.forms.push(
          { id: 'solicitud-reembolso-axa', title: 'Solicitud de Reembolso', description: 'Formulario de AXA para reembolso' }
        );
      }
    }

    // Sinister documents
    if (formData.claimType === 'programacion') {
      requirements.sinisterDocs.push(
        { id: 'informe-medico', title: 'Informe Médico', description: 'Informe médico detallado para programación' }
      );
    }
    
    if (formData.claimType === 'reembolso') {
      requirements.sinisterDocs.push(
        { id: 'estado-cuenta', title: 'Carátula del Estado de Cuenta Bancaria', description: 'Para procesar el reembolso' }
      );
    }
    
    // Receipts and documents
    if (formData.claimType === 'reembolso' && formData.serviceTypes) {
      formData.serviceTypes.forEach(service => {
        switch (service) {
          case 'hospital':
            requirements.receipts.push(
              { id: 'factura-hospital', title: 'Facturas de Hospital', description: 'Facturas de servicios hospitalarios' }
            );
            break;
          case 'estudios':
            requirements.receipts.push(
              { id: 'estudios-archivos', title: 'Archivos de Estudios', description: 'Resultados de laboratorio e imagenología' },
              { id: 'facturas-estudios', title: 'Facturas de Estudios', description: 'Facturas de laboratorio e imagenología' }
            );
            break;
          case 'honorarios':
            requirements.receipts.push(
              { id: 'recibos-medicos', title: 'Recibos y Facturas Médicas', description: 'Honorarios de médicos y especialistas' }
            );
            break;
          case 'medicamentos':
            requirements.receipts.push(
              { id: 'facturas-medicamentos', title: 'Facturas de Medicamentos', description: 'Facturas de farmacias' },
              { id: 'recetas-medicamentos', title: 'Recetas de Medicamentos', description: 'Recetas con dosis y período de administración' }
            );
            break;
          case 'terapia':
            requirements.receipts.push(
              { id: 'facturas-terapia', title: 'Facturas de Terapia', description: 'Facturas de terapia y rehabilitación' },
              { id: 'recetas-terapia', title: 'Recetas de Terapias', description: 'Prescripciones médicas para terapias' },
              { id: 'carnet-asistencia', title: 'Carnet de Asistencia a Terapias', description: 'Registro de asistencia a sesiones' }
            );
            break;
        }
      });
    }
    
    if (formData.claimType === 'programacion') {
      switch (formData.programmingService) {
        case 'cirugia':
          requirements.receipts.push(
            { id: 'interpretacion-estudios-cirugia', title: 'Interpretación de Estudios', description: 'Interpretación de estudios que corroboren el diagnóstico' }
          );
          break;
        case 'medicamentos':
          requirements.receipts.push(
            { id: 'recetas-prog-medicamentos', title: 'Recetas de Medicamentos', description: 'Recetas para medicamentos a programar' },
            { id: 'interpretacion-estudios-med', title: 'Interpretación de Estudios (Opcional)', description: 'Interpretación de estudios que corroboren el diagnóstico' }
          );
          break;
        case 'terapia':
          requirements.receipts.push(
            { id: 'bitacora-medico', title: 'Bitácora del Médico', description: 'Indicación de terapias, sesiones y tiempos' },
            { id: 'interpretacion-estudios-terapia', title: 'Interpretación de Estudios', description: 'Interpretación de estudios que corroboren el diagnóstico' }
          );
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
        disabled={uploading}
      />
      <label
        htmlFor={`upload-${document.id}`}
        className={`cursor-pointer flex flex-col items-center space-y-3 ${uploading ? 'opacity-50' : ''}`}
      >
        {uploading ? (
          <div className="animate-spin w-8 h-8 border-2 border-[#204499] border-t-transparent rounded-full"></div>
        ) : (
          <SafeIcon icon={FiUpload} className="text-3xl text-gray-400" />
        )}
        <div className="text-center">
          <p className="font-medium text-gray-700">{document.title}</p>
          <p className="text-sm text-gray-500 mt-1">{document.description}</p>
          <p className="text-xs text-gray-400 mt-2">
            Arrastra archivos aquí o haz clic para seleccionar
          </p>
          {fallbackMode && (
            <p className="text-xs text-orange-500 mt-1 font-medium">
              Modo alternativo: los archivos se guardarán localmente
            </p>
          )}
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
                {file.isLocal && (
                  <span className="text-xs text-orange-500">Guardado localmente</span>
                )}
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

  // Función para contar el total de archivos subidos
  const getTotalFilesCount = () => {
    let count = 0;
    Object.values(uploadedFiles).forEach(files => {
      count += files.length;
    });
    return count;
  };

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

      {uploadError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 text-red-800 p-4 rounded-lg mb-6"
        >
          <div className="font-medium">Error al subir documentos:</div>
          <p>{uploadError}</p>
        </motion.div>
      )}

      {/* Mensaje de modo alternativo */}
      {fallbackMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6"
        >
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <SafeIcon icon={FiPaperclip} className="text-yellow-600" />
            Método Alternativo de Carga
          </h3>
          <p className="text-gray-700 mb-4">
            Debido a un problema técnico con el almacenamiento, ahora puedes:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-gray-700 mb-4">
            <li>Cargar los documentos localmente en este formulario</li>
            <li>Completar el resto del formulario normalmente</li>
            <li>Al final del proceso, podrás enviar los documentos por correo electrónico</li>
          </ol>
          
          {showEmailForm ? (
            <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico para enviar documentos:
                </label>
                <input 
                  type="email" 
                  value={emailToSend}
                  onChange={(e) => setEmailToSend(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSendByEmail}
                className="bg-[#204499] hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <SafeIcon icon={FiPaperclip} className="text-sm" />
                Enviar Documentos por Email
              </motion.button>
              <p className="text-xs text-gray-500 mt-2">
                * Los documentos se enviarán después de completar el formulario
              </p>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowEmailForm(true)}
              className="bg-[#204499] hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Configurar Envío por Email
            </motion.button>
          )}
        </motion.div>
      )}

      {/* Contador de archivos */}
      {getTotalFilesCount() > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="font-medium text-blue-800 flex items-center gap-2">
            <SafeIcon icon={FiFile} className="text-blue-600" />
            {getTotalFilesCount()} archivo(s) cargado(s) {fallbackMode && "(localmente)"}
          </div>
        </div>
      )}

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
          <div
            className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto"
            onClick={e => e.stopPropagation()}
          >
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