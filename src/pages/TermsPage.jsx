import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiArrowLeft } = FiIcons;

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Términos y Condiciones</h1>
          
          <div className="prose max-w-none text-gray-700 space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Introducción</h2>
              <p>
                Estos Términos y Condiciones regulan el uso del Portal de Reclamos de Fortex, una plataforma exclusiva para clientes de Fortex que les permite gestionar sus reclamos de seguros. Al utilizar nuestra plataforma, usted acepta estos términos en su totalidad. Si no está de acuerdo con estos términos, por favor absténgase de utilizar el portal.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Definiciones</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>"Fortex"</strong> se refiere a la empresa Fortex, prestadora de servicios de gestión de seguros.</li>
                <li><strong>"Portal"</strong> se refiere al Portal de Reclamos de Fortex, incluyendo todas sus funcionalidades.</li>
                <li><strong>"Usuario"</strong> se refiere a cualquier persona que acceda o utilice el Portal de Reclamos de Fortex.</li>
                <li><strong>"Reclamo"</strong> se refiere a cualquier solicitud de reembolso, programación o servicio relacionado con una póliza de seguro.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. Elegibilidad</h2>
              <p>
                El Portal de Reclamos de Fortex está disponible exclusivamente para clientes activos de Fortex. Para utilizar el portal, debe tener una relación comercial vigente con Fortex y ser titular o beneficiario autorizado de una póliza de seguro gestionada por Fortex.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. Presentación de Reclamos</h2>
              <p>
                Al presentar un reclamo a través del Portal, usted declara y garantiza que:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Toda la información proporcionada es verdadera, precisa y completa.</li>
                <li>Todos los documentos subidos son auténticos y no han sido alterados o falsificados.</li>
                <li>Está autorizado para presentar el reclamo en cuestión.</li>
                <li>El reclamo presentado cumple con los términos y condiciones de su póliza de seguro.</li>
              </ul>
              <p className="mt-3">
                Fortex se reserva el derecho de solicitar información o documentación adicional para verificar cualquier reclamo presentado a través del Portal.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Proceso de Revisión</h2>
              <p>
                Todos los reclamos presentados a través del Portal serán revisados por el equipo de Fortex antes de ser enviados a la aseguradora correspondiente. Este proceso de revisión tiene como objetivo garantizar que el reclamo cumpla con todos los requisitos establecidos por la aseguradora.
              </p>
              <p className="mt-3">
                Fortex se reserva el derecho de rechazar cualquier reclamo que no cumpla con los requisitos necesarios o que contenga información incorrecta o fraudulenta.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. Limitación de Responsabilidad</h2>
              <p>
                Fortex actúa únicamente como intermediario entre el cliente y la aseguradora. La decisión final sobre la aprobación o rechazo de un reclamo corresponde exclusivamente a la aseguradora.
              </p>
              <p className="mt-3">
                Fortex no será responsable por ninguna pérdida, daño o perjuicio que pueda resultar de:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>El rechazo de un reclamo por parte de la aseguradora.</li>
                <li>Retrasos en el procesamiento de un reclamo.</li>
                <li>Información incorrecta o incompleta proporcionada por el usuario.</li>
                <li>Problemas técnicos o interrupciones en el servicio del Portal.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Modificaciones a los Términos</h2>
              <p>
                Fortex se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. Las modificaciones entrarán en vigor inmediatamente después de su publicación en el Portal. El uso continuado del Portal después de cualquier modificación constituye la aceptación de los nuevos términos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Contacto</h2>
              <p>
                Si tiene alguna pregunta o inquietud sobre estos Términos y Condiciones, por favor contacte a nuestro equipo de atención al cliente a través del correo electrónico contacto@fortex.com o por teléfono al número proporcionado en el Portal.
              </p>
            </section>
          </div>

          <div className="mt-8 text-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="bg-[#204499] hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Volver al Inicio
            </motion.button>
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
            <a href="/terms" className="text-[#204499] font-medium transition-colors">
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

export default TermsPage;