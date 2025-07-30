import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { generateMagicLink } from '../lib/magicLink';

const { FiLink, FiCopy, FiMail, FiX, FiCheck } = FiIcons;

const MagicLinkDialog = ({ formData, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [magicLink, setMagicLink] = useState(null);
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleGenerateLink = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const id = await generateMagicLink(formData);
      const baseUrl = window.location.origin + window.location.pathname;
      const link = `${baseUrl}#/form?session=${id}`;
      setMagicLink(link);
    } catch (err) {
      setError('No se pudo generar el enlace. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(magicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSendEmail = async () => {
    if (!email || !email.includes('@')) {
      setError('Por favor ingresa un correo electrónico válido');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would send an email with the magic link
      // For now, we'll just simulate success after a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEmailSent(true);
    } catch (err) {
      setError('No se pudo enviar el correo. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full"
      >
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <SafeIcon icon={FiLink} className="text-[#204499]" />
            Guardar y continuar después
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <SafeIcon icon={FiX} className="text-xl" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Genera un enlace único para guardar tu progreso y continuar completando el formulario más tarde.
          </p>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 text-red-800 p-4 rounded-lg mb-6"
            >
              {error}
            </motion.div>
          )}
          
          {!magicLink ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerateLink}
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                loading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#204499] hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <SafeIcon icon={FiLink} className="text-lg" />
                  Generar Enlace
                </>
              )}
            </motion.button>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 mb-2 font-medium">Tu enlace está listo:</p>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={magicLink}
                    readOnly
                    className="flex-1 py-2 px-3 bg-white border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#204499] text-sm"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="bg-[#204499] hover:bg-blue-700 text-white py-2 px-4 rounded-r-lg transition-colors flex items-center"
                  >
                    <SafeIcon icon={copied ? FiCheck : FiCopy} className="text-sm" />
                  </button>
                </div>
                {copied && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-green-600 mt-1"
                  >
                    ¡Enlace copiado!
                  </motion.p>
                )}
              </div>
              
              <div className="border-t pt-6">
                <h3 className="font-medium text-gray-900 mb-3">Enviar por correo electrónico</h3>
                {!emailSent ? (
                  <>
                    <div className="mb-4">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Ingresa tu correo electrónico"
                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#204499]"
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSendEmail}
                      disabled={loading || !email}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                        loading || !email
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {loading ? (
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <>
                          <SafeIcon icon={FiMail} className="text-lg" />
                          Enviar Enlace
                        </>
                      )}
                    </motion.button>
                  </>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                    <SafeIcon icon={FiCheck} className="text-green-600 text-lg flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800">¡Correo enviado!</p>
                      <p className="text-sm text-green-600 mt-1">
                        Hemos enviado el enlace a {email}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-6">
            Este enlace estará disponible por 7 días. No compartas este enlace con personas no autorizadas.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default MagicLinkDialog;