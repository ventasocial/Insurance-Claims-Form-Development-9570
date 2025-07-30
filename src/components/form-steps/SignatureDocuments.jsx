import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiDownload, FiMail, FiFileText, FiCheck } = FiIcons;

const SignatureDocuments = ({ formData, updateFormData }) => {
  const [selectedOption, setSelectedOption] = useState(formData.signatureDocumentOption || '');
  const [emailForDigitalSignature, setEmailForDigitalSignature] = useState(formData.emailForDigitalSignature || '');

  const handleOptionChange = (option) => {
    setSelectedOption(option);
    updateFormData('signatureDocumentOption', option);
    if (option !== 'email') {
      setEmailForDigitalSignature('');
      updateFormData('emailForDigitalSignature', '');
    }
  };

  const handleEmailChange = (email) => {
    setEmailForDigitalSignature(email);
    updateFormData('emailForDigitalSignature', email);
  };

  const getSignatureDocuments = () => {
    const documents = [];
    const { insuranceCompany, claimType, programmingService, isCirugiaOrtopedica } = formData;

    // Document URLs mapping
    const documentUrls = {
      'aviso-accidente-enfermedad': 'https://storage.googleapis.com/msgsndr/HWRXLf7lstECUAG07eRw/media/685ad998b91260b431827d0f.pdf',
      'formato-reembolso': 'https://storage.googleapis.com/msgsndr/HWRXLf7lstECUAG07eRw/media/685ad9983daa6bf9a84498d9.pdf',
      'formato-unico-bancario': 'https://storage.googleapis.com/msgsndr/HWRXLf7lstECUAG07eRw/media/685ad9ea2b37dce8e382a9f9.pdf',
      'formato-cirugia-traumatologia': 'https://storage.googleapis.com/msgsndr/HWRXLf7lstECUAG07eRw/media/685ad9d24bfc6127d1808e9b.pdf',
      'solicitud-programacion-axa': 'https://storage.googleapis.com/msgsndr/HWRXLf7lstECUAG07eRw/media/687faba88ffd9e2c5eb0920a.pdf',
      'solicitud-reembolso-axa': 'https://storage.googleapis.com/msgsndr/HWRXLf7lstECUAG07eRw/media/687faba8023a389f1e952dd6.pdf'
    };

    if (insuranceCompany === 'gnp') {
      if (claimType === 'reembolso') {
        documents.push(
          {
            id: 'aviso-accidente-enfermedad',
            name: 'Aviso de Accidente o Enfermedad GNP',
            url: documentUrls['aviso-accidente-enfermedad']
          },
          {
            id: 'formato-reembolso',
            name: 'Formato de Reembolso GNP',
            url: documentUrls['formato-reembolso']
          },
          {
            id: 'formato-unico-bancario',
            name: 'Formato Único de Información Bancaria GNP',
            url: documentUrls['formato-unico-bancario']
          }
        );
      } else if (claimType === 'programacion') {
        documents.push(
          {
            id: 'aviso-accidente-enfermedad-prog',
            name: 'Aviso de Accidente o Enfermedad GNP',
            url: documentUrls['aviso-accidente-enfermedad']
          }
        );
        if (programmingService === 'cirugia' && isCirugiaOrtopedica === true) {
          documents.push(
            {
              id: 'formato-cirugia-traumatologia',
              name: 'Formato de Cirugía de Traumatología, Ortopedia y Neurocirugía',
              url: documentUrls['formato-cirugia-traumatologia']
            }
          );
        }
      }
    } else if (insuranceCompany === 'axa') {
      if (claimType === 'programacion') {
        documents.push(
          {
            id: 'solicitud-programacion-axa',
            name: 'Solicitud de Programación AXA',
            url: documentUrls['solicitud-programacion-axa']
          }
        );
      } else if (claimType === 'reembolso') {
        documents.push(
          {
            id: 'solicitud-reembolso-axa',
            name: 'Solicitud de Reembolso AXA',
            url: documentUrls['solicitud-reembolso-axa']
          }
        );
      }
    }

    return documents;
  };

  const documents = getSignatureDocuments();

  if (documents.length === 0) {
    return null;
  }

  const handleDownloadDocument = (document) => {
    // Open the document URL in a new tab for download
    window.open(document.url, '_blank');
  };

  const handleSendByEmail = () => {
    if (!emailForDigitalSignature) {
      alert('Por favor ingresa un email válido');
      return;
    }

    // Simulate sending documents by email
    alert(`Los documentos se enviarán a: ${emailForDigitalSignature}\n\nRecibirás los formularios por correo electrónico para firma digital.`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Documentos de Firma
        </h2>
        <p className="text-gray-600">
          Selecciona cómo deseas obtener los documentos que requieren tu firma
        </p>
      </div>

      {/* Documents List */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <SafeIcon icon={FiFileText} className="text-lg" />
          Documentos que requieren firma:
        </h3>
        <ul className="space-y-2">
          {documents.map((doc, index) => (
            <li key={doc.id} className="flex items-center gap-2 text-blue-800">
              <SafeIcon icon={FiCheck} className="text-green-600 flex-shrink-0" />
              <span>{doc.name}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Options */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ¿Cómo deseas recibir estos documentos?
        </h3>

        {/* Download Option */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`border-2 rounded-lg p-6 cursor-pointer transition-all duration-300 ${
            selectedOption === 'download'
              ? 'border-[#204499] bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => handleOptionChange('download')}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <input
                type="radio"
                name="signatureOption"
                value="download"
                checked={selectedOption === 'download'}
                onChange={() => handleOptionChange('download')}
                className="mt-1 h-4 w-4 text-[#204499] border-gray-300 focus:ring-[#204499]"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <SafeIcon icon={FiDownload} className="text-[#204499] text-xl" />
                <h4 className="font-semibold text-gray-900">Descargar para Firma Física</h4>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Descarga los documentos, imprímelos, fírmalos físicamente y súbelos junto con los demás documentos.
              </p>
              {selectedOption === 'download' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3"
                >
                  {documents.map((doc) => (
                    <motion.button
                      key={doc.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDownloadDocument(doc)}
                      className="w-full bg-[#204499] hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <SafeIcon icon={FiDownload} className="text-sm" />
                      Descargar: {doc.name}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Email Option */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`border-2 rounded-lg p-6 cursor-pointer transition-all duration-300 ${
            selectedOption === 'email'
              ? 'border-[#204499] bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => handleOptionChange('email')}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <input
                type="radio"
                name="signatureOption"
                value="email"
                checked={selectedOption === 'email'}
                onChange={() => handleOptionChange('email')}
                className="mt-1 h-4 w-4 text-[#204499] border-gray-300 focus:ring-[#204499]"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <SafeIcon icon={FiMail} className="text-[#204499] text-xl" />
                <h4 className="font-semibold text-gray-900">Envío por Email para Firma Digital</h4>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Recibe los documentos por correo electrónico para firmarlos digitalmente y enviarlos de vuelta.
              </p>
              {selectedOption === 'email' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correo Electrónico para Firma Digital *
                    </label>
                    <input
                      type="email"
                      value={emailForDigitalSignature}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent transition-all duration-300"
                      placeholder="correo@ejemplo.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Puede ser diferente al email de contacto si lo deseas
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSendByEmail}
                    disabled={!emailForDigitalSignature}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      emailForDigitalSignature
                        ? 'bg-[#204499] hover:bg-blue-700 text-white'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <SafeIcon icon={FiMail} className="text-lg" />
                    Enviar Documentos por Email
                  </motion.button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {selectedOption && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-2">
            <SafeIcon icon={FiCheck} className="text-green-600 text-lg" />
            <p className="text-green-800 font-medium">
              Opción seleccionada: {selectedOption === 'download' ? 'Descarga para Firma Física' : 'Envío por Email para Firma Digital'}
            </p>
          </div>
          {selectedOption === 'email' && emailForDigitalSignature && (
            <p className="text-green-600 text-sm mt-1">
              Los documentos se enviarán a: {emailForDigitalSignature}
            </p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default SignatureDocuments;