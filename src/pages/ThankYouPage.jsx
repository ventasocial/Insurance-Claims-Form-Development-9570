import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiCheckCircle, FiFileText, FiArrowRight, FiHome, FiClock } = FiIcons;

const ThankYouPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { formData, submissionId } = location.state || {};

  useEffect(() => {
    // Si no hay datos del formulario, redirigir a la página de inicio
    if (!formData) {
      navigate('/');
    }
  }, [formData, navigate]);

  // Función para contar los documentos subidos
  const countDocuments = () => {
    if (!formData?.documents) return 0;
    
    let count = 0;
    Object.values(formData.documents).forEach(docArray => {
      count += docArray.length;
    });
    return count;
  };

  // Función para mostrar el tipo de reclamo en español
  const getClaimTypeText = () => {
    switch (formData?.claimType) {
      case 'reembolso':
        return 'Reembolso';
      case 'programacion':
        return 'Programación';
      case 'maternidad':
        return 'Maternidad';
      default:
        return '';
    }
  };

  // Obtener el nombre completo del titular
  const getTitularName = () => {
    const titular = formData?.personsInvolved?.titularAsegurado || {};
    if (titular.nombres) {
      return `${titular.nombres} ${titular.apellidoPaterno || ''} ${titular.apellidoMaterno || ''}`.trim();
    }
    return '';
  };

  // Si no hay datos del formulario, mostrar un mensaje de error
  if (!formData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Información no disponible</h1>
          <p className="text-gray-600 mb-6">No se encontró información del reclamo.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-[#204499] hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <img 
              src="https://storage.googleapis.com/msgsndr/HWRXLf7lstECUAG07eRw/media/685d77c05c72d29e532e823f.png"
              alt="Fortex"
              className="h-8"
            />
            <div className="text-sm text-gray-600">
              Portal de Reclamos
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {/* Success Header */}
          <div className="bg-green-500 text-white px-6 py-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <SafeIcon icon={FiCheckCircle} className="text-green-500 text-4xl" />
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">¡Reclamo Enviado!</h1>
            <p className="text-xl opacity-90">
              Tu reclamo ha sido recibido correctamente
            </p>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8">
            <div className="space-y-6">
              {/* Resumen del Reclamo */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <SafeIcon icon={FiFileText} className="text-[#204499]" />
                  Resumen del Reclamo
                </h2>

                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Número de Referencia</p>
                      <p className="font-semibold text-gray-900">{submissionId || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tipo de Reclamo</p>
                      <p className="font-semibold text-gray-900">{getClaimTypeText()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Aseguradora</p>
                      <p className="font-semibold text-gray-900">
                        {formData.insuranceCompany?.toUpperCase() || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Documentos Enviados</p>
                      <p className="font-semibold text-gray-900">{countDocuments()}</p>
                    </div>
                  </div>

                  {getTitularName() && (
                    <div>
                      <p className="text-sm text-gray-500">Titular del Seguro</p>
                      <p className="font-semibold text-gray-900">{getTitularName()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Próximos Pasos */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <SafeIcon icon={FiArrowRight} className="text-[#204499]" />
                  Próximos Pasos
                </h2>

                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
                      <SafeIcon icon={FiClock} className="text-[#204499] text-xl" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Revisión de Documentos</h3>
                      <p className="text-gray-600">
                        El equipo de Fortex revisará cuidadosamente todos los documentos que has enviado y se asegurará de que cumplan con los requisitos de la aseguradora.
                      </p>
                      
                      <ul className="mt-4 space-y-2 text-gray-600">
                        <li className="flex items-start gap-2">
                          <span className="text-[#204499] font-bold">•</span>
                          <span>Si se requiere información adicional o correcciones en los documentos, te contactaremos a través del correo electrónico o teléfono proporcionado.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#204499] font-bold">•</span>
                          <span>Una vez verificada toda la documentación, enviaremos tu reclamo a la aseguradora para su procesamiento.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#204499] font-bold">•</span>
                          <span>Te mantendremos informado sobre el estado de tu reclamo durante todo el proceso.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirmación por Email */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <SafeIcon icon={FiCheckCircle} className="text-green-600 text-lg" />
                  <h3 className="font-semibold text-gray-900">Confirmación Enviada</h3>
                </div>
                <p className="text-gray-600">
                  Hemos enviado un correo electrónico de confirmación a{" "}
                  <span className="font-medium">{formData.contactInfo?.email}</span> con los detalles de tu reclamo.
                </p>
              </div>

              {/* Botón de Regreso */}
              <div className="flex justify-center pt-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/')}
                  className="bg-[#204499] hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl shadow-md transition-colors flex items-center gap-2"
                >
                  <SafeIcon icon={FiHome} className="text-lg" />
                  Volver al Inicio
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600 text-sm">
            © 2024 Fortex. Todos los derechos reservados.
          </p>
          <div className="mt-2 flex justify-center gap-4 text-sm">
            <a href="/terms" className="text-gray-500 hover:text-[#204499] transition-colors">
              Términos y Condiciones
            </a>
            <a href="/privacy" className="text-gray-500 hover:text-[#204499] transition-colors">
              Política de Privacidad
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ThankYouPage;