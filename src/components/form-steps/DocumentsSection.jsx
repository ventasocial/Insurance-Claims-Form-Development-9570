import React, {useState, useEffect} from 'react';
import {motion} from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import supabase from '../../lib/supabase';

const {FiUpload, FiFile, FiTrash2, FiEye, FiPaperclip, FiAlertCircle, FiCheckCircle} = FiIcons;

const DocumentsSection = ({formData, updateFormData}) => {
  const [uploadedFiles, setUploadedFiles] = useState(formData.documents || {});
  const [previewFile, setPreviewFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [emailToSend, setEmailToSend] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  useEffect(() => {
    // Crear el bucket 'claims' si no existe
    const createBucketIfNotExists = async () => {
      try {
        const {data, error} = await supabase.storage.getBucket('claims');
        if (error && error.code === 'PGRST116') {
          // Bucket not found
          const {error: createError} = await supabase.storage.createBucket('claims', {
            public: true, // Hacer el bucket público para poder acceder a los archivos
          });
          if (createError) {
            console.error('Error creating bucket:', createError);
          } else {
            console.log('Bucket "claims" created successfully');
          }
        }
      } catch (err) {
        console.error('Error checking bucket:', err);
      }
    };

    createBucketIfNotExists();
  }, []);

  const handleFileUpload = async (documentType, files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);

    try {
      // Store files locally for now, actual upload to Supabase will happen on form submission
      handleLocalUpload(documentType, files);
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadError('Error al subir los archivos. Por favor intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  // Store files locally for now
  const handleLocalUpload = (documentType, files) => {
    const newFiles = {...uploadedFiles};
    if (!newFiles[documentType]) {
      newFiles[documentType] = [];
    }

    for (let file of Array.from(files)) {
      newFiles[documentType].push({
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file), // Para vista previa local
        file: file, // Guardamos el archivo real
        isLocal: true // Indicador de que es un archivo local
      });
    }

    setUploadedFiles(newFiles);
    updateFormData('documents', newFiles);

    // Show email form automatically
    setShowEmailForm(true);
  };

  const handleSendByEmail = async () => {
    if (!emailToSend || !emailToSend.includes('@')) {
      alert('Por favor, ingresa un correo electrónico válido');
      return;
    }

    // Simulate sending files by email
    alert(`Los documentos se enviarán a: ${emailToSend}\n\nPor favor, espera la confirmación del equipo de soporte.`);

    // Update form data to indicate email method was used
    updateFormData('documentsSentByEmail', {
      email: emailToSend,
      timestamp: new Date().toISOString()
    });
  };

  const removeFile = async (documentType, fileIndex) => {
    const newFiles = {...uploadedFiles};
    if (newFiles[documentType]) {
      const fileToRemove = newFiles[documentType][fileIndex];
      
      // Clean up object URL to prevent memory leaks
      if (fileToRemove.url && fileToRemove.isLocal) {
        URL.revokeObjectURL(fileToRemove.url);
      }

      // Remove file from list
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

    // SIEMPRE agregar informe médico para todos los tipos de reclamos y aseguradoras
    requirements.sinisterDocs.push({
      id: 'informe-medico',
      title: 'Informe Médico',
      description: 'Informe médico detallado (Requerido para todos los reclamos)'
    });

    // Forms section requirements - Solo mostrar si se eligió descarga física
    if (formData.signatureDocumentOption === 'download') {
      if (formData.insuranceCompany === 'gnp') {
        if (formData.claimType === 'reembolso') {
          requirements.forms.push(
            {
              id: 'aviso-accidente-enfermedad',
              title: 'Aviso de Accidente o Enfermedad',
              description: 'Formulario oficial que debe ser firmado'
            },
            {
              id: 'formato-reembolso',
              title: 'Formato de Reembolso',
              description: 'Formulario para solicitar el reembolso'
            },
            {
              id: 'formato-unico-bancario',
              title: 'Formato Único de Información Bancaria',
              description: 'Información bancaria para el reembolso'
            }
          );
        } else if (formData.claimType === 'programacion') {
          requirements.forms.push({
            id: 'aviso-accidente-enfermedad-prog',
            title: 'Aviso de Accidente o Enfermedad',
            description: 'Formulario oficial para programación'
          });

          if (formData.programmingService === 'cirugia' && formData.isCirugiaOrtopedica === true) {
            requirements.forms.push({
              id: 'formato-cirugia-traumatologia',
              title: 'Formato de Cirugía de Traumatología, Ortopedia y Neurocirugía',
              description: 'Formato específico para este tipo de cirugías'
            });
          }
        }
      } else if (formData.insuranceCompany === 'axa') {
        if (formData.claimType === 'programacion') {
          requirements.forms.push({
            id: 'solicitud-programacion-axa',
            title: 'Solicitud de Programación',
            description: 'Formulario de AXA para programación'
          });
        } else if (formData.claimType === 'reembolso') {
          requirements.forms.push({
            id: 'solicitud-reembolso-axa',
            title: 'Solicitud de Reembolso',
            description: 'Formulario de AXA para reembolso'
          });
        }
      }
    }

    // Additional sinister documents
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
            requirements.receipts.push(
              {
                id: 'estudios-archivos',
                title: 'Archivos de Estudios',
                description: 'Resultados de laboratorio e imagenología'
              },
              {
                id: 'facturas-estudios',
                title: 'Facturas de Estudios',
                description: 'Facturas de laboratorio e imagenología'
              }
            );
            break;
          case 'honorarios':
            requirements.receipts.push({
              id: 'recibos-medicos',
              title: 'Recibos y Facturas Médicas',
              description: 'Honorarios de médicos y especialistas'
            });
            break;
          case 'medicamentos':
            requirements.receipts.push(
              {
                id: 'facturas-medicamentos',
                title: 'Facturas de Medicamentos',
                description: 'Facturas de farmacias'
              },
              {
                id: 'recetas-medicamentos',
                title: 'Recetas de Medicamentos',
                description: 'Recetas con dosis y período de administración'
              }
            );
            break;
          case 'terapia':
            requirements.receipts.push(
              {
                id: 'facturas-terapia',
                title: 'Facturas de Terapia',
                description: 'Facturas de terapia y rehabilitación'
              },
              {
                id: 'recetas-terapia',
                title: 'Recetas de Terapias',
                description: 'Prescripciones médicas para terapias'
              },
              {
                id: 'carnet-asistencia',
                title: 'Carnet de Asistencia a Terapias',
                description: 'Registro de asistencia a sesiones'
              }
            );
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
          requirements.receipts.push(
            {
              id: 'recetas-prog-medicamentos',
              title: 'Recetas de Medicamentos',
              description: 'Recetas para medicamentos a programar'
            },
            {
              id: 'interpretacion-estudios-med',
              title: 'Interpretación de Estudios (Opcional)',
              description: 'Interpretación de estudios que corroboren el diagnóstico'
            }
          );
          break;
        case 'terapia':
          requirements.receipts.push(
            {
              id: 'bitacora-medico',
              title: 'Bitácora del Médico',
              description: 'Indicación de terapias, sesiones y tiempos'
            },
            {
              id: 'interpretacion-estudios-terapia',
              title: 'Interpretación de Estudios',
              description: 'Interpretación de estudios que corroboren el diagnóstico'
            }
          );
          break;
      }
    }

    return requirements;
  };

  const requirements = getDocumentRequirements();

  const FileUploadArea = ({document}) => (
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
        {uploading && uploadProgress[document.id] ? (
          <div className="w-12 h-12 relative">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div 
              className="absolute inset-0 rounded-full border-4 border-[#204499] border-t-transparent"
              style={{
                transform: `rotate(${uploadProgress[document.id] * 3.6}deg)`,
                transition: 'transform 0.3s ease-in-out'
              }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium">{uploadProgress[document.id]}%</span>
            </div>
          </div>
        ) : uploading ? (
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
        </div>
      </label>
    </div>
  );

  const FileList = ({documentType}) => {
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
            initial={{opacity: 0, y: 10}}
            animate={{opacity: 1, y: 0}}
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

  const DocumentSection = ({title, documents, bgColor = "bg-white"}) => (
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

  // Verificar si todos los documentos requeridos están cargados
  const areAllRequiredDocsUploaded = () => {
    // Siempre necesitamos el informe médico
    if (!uploadedFiles['informe-medico'] || uploadedFiles['informe-medico'].length === 0) {
      return false;
    }

    // Para los documentos de firma, solo verificamos si se eligió descarga física
    if (formData.signatureDocumentOption === 'download') {
      // Verificar que los documentos de firma estén cargados
      const signatureDocs = requirements.forms;
      for (let doc of signatureDocs) {
        if (!uploadedFiles[doc.id] || uploadedFiles[doc.id].length === 0) {
          return false;
        }
      }
    }

    // Verificar otros documentos requeridos
    const otherRequiredDocs = [
      ...requirements.sinisterDocs,
      ...requirements.receipts
    ];

    for (let doc of otherRequiredDocs) {
      if (!uploadedFiles[doc.id] || uploadedFiles[doc.id].length === 0) {
        return false;
      }
    }

    return true;
  };

  return (
    <motion.div
      initial={{opacity: 0, y: 20}}
      animate={{opacity: 1, y: 0}}
      className="space-y-8"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Subir Documentos
        </h2>
        <p className="text-gray-600">
          Sube todos los documentos que marcaste como disponibles en el paso anterior
        </p>
      </div>

      {uploadError && (
        <motion.div
          initial={{opacity: 0, y: -10}}
          animate={{opacity: 1, y: 0}}
          className="bg-red-50 text-red-800 p-4 rounded-lg mb-6"
        >
          <div className="font-medium">Error al subir documentos:</div>
          <p>{uploadError}</p>
        </motion.div>
      )}

      {/* Mostrar información sobre firma digital si está seleccionada */}
      {formData.signatureDocumentOption === 'email' && (
        <motion.div
          initial={{opacity: 0, y: -10}}
          animate={{opacity: 1, y: 0}}
          className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6"
        >
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <SafeIcon icon={FiAlertCircle} className="text-blue-600" />
            Documentos de Firma Digital
          </h3>
          <p className="text-gray-700">
            Has seleccionado recibir los documentos de la aseguradora por email para firma digital. 
            Estos documentos se enviarán directamente a las personas correspondientes y no necesitas subirlos aquí.
          </p>
        </motion.div>
      )}

      {/* Contador de archivos */}
      {getTotalFilesCount() > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="font-medium text-blue-800 flex items-center gap-2">
            <SafeIcon icon={FiFile} className="text-blue-600" />
            {getTotalFilesCount()} archivo(s) cargado(s)
          </div>
        </div>
      )}

      {/* Mostrar sección de documentos de aseguradora solo si se eligió descarga física */}
      {requirements.forms.length > 0 && (
        <DocumentSection
          title="1. Documentos de la Aseguradora"
          documents={requirements.forms}
          bgColor="bg-blue-50"
        />
      )}

      {requirements.sinisterDocs.length > 0 && (
        <DocumentSection
          title={formData.signatureDocumentOption === 'download' ? "2. Documentos del Siniestro" : "1. Documentos del Siniestro"}
          documents={requirements.sinisterDocs}
          bgColor="bg-green-50"
        />
      )}

      {requirements.receipts.length > 0 && (
        <DocumentSection
          title={formData.signatureDocumentOption === 'download' ? "3. Facturas, Recetas y Otros Documentos" : "2. Facturas, Recetas y Otros Documentos"}
          documents={requirements.receipts}
          bgColor="bg-yellow-50"
        />
      )}

      {/* Mensaje si faltan documentos requeridos */}
      {!areAllRequiredDocsUploaded() && (
        <motion.div
          initial={{opacity: 0, y: 10}}
          animate={{opacity: 1, y: 0}}
          className="bg-amber-50 border border-amber-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-2">
            <SafeIcon icon={FiAlertCircle} className="text-amber-600 text-lg" />
            <p className="text-amber-800 font-medium">
              Debes subir todos los documentos marcados como disponibles en el paso anterior para continuar.
            </p>
          </div>
        </motion.div>
      )}

      {/* Mensaje si todos los documentos están cargados */}
      {areAllRequiredDocsUploaded() && (
        <motion.div
          initial={{opacity: 0, y: 10}}
          animate={{opacity: 1, y: 0}}
          className="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-2">
            <SafeIcon icon={FiCheckCircle} className="text-green-600 text-lg" />
            <p className="text-green-800 font-medium">
              ¡Excelente! Has subido todos los documentos requeridos. Puedes continuar con el siguiente paso.
            </p>
          </div>
        </motion.div>
      )}

      {/* File Preview Modal - Mejorado para PDFs */}
      {previewFile && (
        <motion.div
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-6xl max-h-full overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-medium">{previewFile.name}</h3>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
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
              ) : previewFile.type === 'application/pdf' ? (
                <div className="w-full h-96 md:h-[600px]">
                  <iframe
                    src={previewFile.url}
                    type="application/pdf"
                    className="w-full h-full border-0"
                    title={previewFile.name}
                  >
                    <div className="text-center py-8">
                      <SafeIcon icon={FiFile} className="text-6xl text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">
                        Tu navegador no puede mostrar PDFs directamente
                      </p>
                      <a
                        href={previewFile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors inline-block"
                      >
                        Abrir PDF en nueva pestaña
                      </a>
                    </div>
                  </iframe>
                </div>
              ) : (
                <div className="text-center py-8">
                  <SafeIcon icon={FiFile} className="text-6xl text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Vista previa no disponible para este tipo de archivo
                  </p>
                  <a
                    href={previewFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Abrir archivo en nueva pestaña
                  </a>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DocumentsSection;