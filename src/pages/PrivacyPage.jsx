import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiArrowLeft } = FiIcons;

const PrivacyPage = () => {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Política de Privacidad</h1>
          
          <div className="prose max-w-none text-gray-700 space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Introducción</h2>
              <p>
                En Fortex, nos comprometemos a proteger la privacidad y seguridad de la información personal de nuestros clientes. Esta Política de Privacidad describe cómo recopilamos, utilizamos, almacenamos y protegemos su información personal cuando utiliza nuestro Portal de Reclamos.
              </p>
              <p className="mt-3">
                Al utilizar nuestro Portal de Reclamos, usted acepta las prácticas descritas en esta Política de Privacidad. Si no está de acuerdo con esta política, por favor absténgase de utilizar nuestro portal.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Información que Recopilamos</h2>
              <p>
                Recopilamos la siguiente información personal cuando usted utiliza nuestro Portal de Reclamos:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Información de identificación:</strong> Nombre completo, fecha de nacimiento, identificación oficial, etc.</li>
                <li><strong>Información de contacto:</strong> Dirección de correo electrónico, número de teléfono, dirección postal.</li>
                <li><strong>Información médica:</strong> Diagnósticos, tratamientos, historiales médicos y cualquier otra información médica relevante para su reclamo.</li>
                <li><strong>Información financiera:</strong> Detalles bancarios para procesar reembolsos.</li>
                <li><strong>Documentos:</strong> Facturas, recetas médicas, informes médicos y cualquier otro documento que usted suba al portal.</li>
                <li><strong>Información sobre su póliza:</strong> Número de póliza, aseguradora, tipo de cobertura, etc.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. Cómo Utilizamos su Información</h2>
              <p>
                Utilizamos la información recopilada para los siguientes propósitos:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Procesar y gestionar sus reclamos de seguro.</li>
                <li>Comunicarnos con usted sobre el estado de sus reclamos.</li>
                <li>Verificar su identidad y prevenir fraudes.</li>
                <li>Cumplir con requisitos legales y regulatorios.</li>
                <li>Mejorar nuestros servicios y la experiencia del usuario en el portal.</li>
                <li>Proporcionar soporte al cliente.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. Compartiendo su Información</h2>
              <p>
                Podemos compartir su información personal con las siguientes partes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Aseguradoras:</strong> Compartimos la información necesaria con las aseguradoras para procesar sus reclamos.</li>
                <li><strong>Proveedores de servicios:</strong> Podemos compartir información con proveedores de servicios que nos ayudan a operar nuestro portal y procesar reclamos.</li>
                <li><strong>Autoridades reguladoras:</strong> Podemos divulgar información cuando sea requerido por ley o por autoridades reguladoras.</li>
              </ul>
              <p className="mt-3">
                No vendemos, alquilamos ni comercializamos su información personal a terceros para fines de marketing.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Seguridad de la Información</h2>
              <p>
                Implementamos medidas de seguridad técnicas, administrativas y físicas para proteger su información personal contra accesos no autorizados, pérdida, uso indebido o alteración. Estas medidas incluyen:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encriptación de datos sensibles.</li>
                <li>Controles de acceso estrictos.</li>
                <li>Auditorías de seguridad regulares.</li>
                <li>Capacitación de personal en prácticas de seguridad de datos.</li>
              </ul>
              <p className="mt-3">
                A pesar de nuestros esfuerzos, ningún método de transmisión o almacenamiento electrónico es 100% seguro. Por lo tanto, no podemos garantizar la seguridad absoluta de su información.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. Sus Derechos</h2>
              <p>
                Usted tiene los siguientes derechos con respecto a su información personal:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Derecho a acceder a su información personal.</li>
                <li>Derecho a rectificar información incorrecta o incompleta.</li>
                <li>Derecho a solicitar la eliminación de su información (sujeto a requisitos legales).</li>
                <li>Derecho a restringir el procesamiento de su información.</li>
                <li>Derecho a la portabilidad de datos.</li>
                <li>Derecho a presentar una queja ante una autoridad de protección de datos.</li>
              </ul>
              <p className="mt-3">
                Para ejercer cualquiera de estos derechos, por favor contáctenos a través de los medios proporcionados en la sección de contacto.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Retención de Datos</h2>
              <p>
                Conservamos su información personal durante el tiempo necesario para cumplir con los propósitos para los que fue recopilada, incluido el cumplimiento de requisitos legales, resolución de disputas y aplicación de nuestros acuerdos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Cambios a esta Política</h2>
              <p>
                Podemos actualizar esta Política de Privacidad periódicamente para reflejar cambios en nuestras prácticas o requisitos legales. Le notificaremos sobre cambios significativos publicando la nueva política en nuestro portal o por otros medios apropiados.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">9. Contacto</h2>
              <p>
                Si tiene preguntas o inquietudes sobre esta Política de Privacidad o el tratamiento de sus datos personales, por favor contáctenos a:
              </p>
              <p className="mt-3">
                Email: privacidad@fortex.com<br />
                Teléfono: +52 81 2209 5020
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
            <a href="/terms" className="text-gray-500 hover:text-[#204499] transition-colors">
              Términos y Condiciones
            </a>
            <a href="/privacy" className="text-[#204499] font-medium transition-colors">
              Política de Privacidad
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPage;