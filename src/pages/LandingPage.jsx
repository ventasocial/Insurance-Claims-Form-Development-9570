import React from 'react';
import {motion} from 'framer-motion';
import {useNavigate, Link} from 'react-router-dom';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const {FiFileText, FiCheckCircle, FiMail, FiArrowRight, FiMessageCircle} = FiIcons;

const LandingPage = () => {
  const navigate = useNavigate();

  const steps = [
    {
      number: "01",
      title: "Completa el Formulario",
      description: "Llena la información paso a paso según tu tipo de reclamo"
    },
    {
      number: "02",
      title: "Envío a Fortex",
      description: "Tu información se envía automáticamente a nuestro equipo"
    },
    {
      number: "03",
      title: "Verificación",
      description: "Revisamos y validamos toda tu documentación"
    },
    {
      number: "04",
      title: "Envío a Aseguradora",
      description: "Enviamos tu reclamo completo a la aseguradora correspondiente"
    }
  ];

  const benefits = [
    {
      icon: FiFileText,
      title: "Formulario Inteligente",
      description: "El sistema se adapta automáticamente según tu aseguradora y tipo de reclamo"
    },
    {
      icon: FiCheckCircle,
      title: "Verificación Profesional",
      description: "Nuestro equipo revisa cada documento antes del envío final"
    },
    {
      icon: FiMail,
      title: "Seguimiento Completo",
      description: "Mantente informado sobre el estado de tu reclamo en todo momento"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <motion.header
        initial={{opacity: 0, y: -20}}
        animate={{opacity: 1, y: 0}}
        className="bg-white shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <img
              src="https://storage.googleapis.com/msgsndr/HWRXLf7lstECUAG07eRw/media/685d77c05c72d29e532e823f.png"
              alt="Fortex"
              className="h-12"
            />
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <motion.div
              initial={{opacity: 0, y: 30}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.8}}
            >
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Portal de Reclamos
                <span className="block text-[#204499]">para Clientes Fortex</span>
              </h1>
              <p className="text-xl text-gray-600 mb-4 max-w-3xl mx-auto">
                Sistema exclusivo para clientes de Fortex. Gestiona tus reclamos de seguros de manera fácil y segura con el respaldo de nuestro equipo especializado.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
                <p className="text-blue-800 font-medium">
                  ⚠️ Este portal es de uso exclusivo para clientes de Fortex
                </p>
                <p className="text-blue-600 text-sm mt-1">
                  Si no eres cliente de Fortex, por favor contacta a tu asesor de seguros
                </p>
              </div>
              <motion.button
                whileHover={{scale: 1.05}}
                whileTap={{scale: 0.95}}
                onClick={() => navigate('/form')}
                className="bg-[#204499] hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl text-lg shadow-lg transition-all duration-300 flex items-center gap-3 mx-auto"
              >
                Iniciar Reclamo
                <SafeIcon icon={FiArrowRight} className="text-xl" />
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{opacity: 0, y: 30}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tu Proceso de Reclamo Simplificado
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Como cliente de Fortex, tienes acceso a un sistema diseñado específicamente para hacer más eficiente tu experiencia de reclamos
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{opacity: 0, y: 30}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{delay: index * 0.1}}
                className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow"
              >
                <div className="bg-[#204499] bg-opacity-10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SafeIcon icon={benefit.icon} className="text-2xl text-[#204499]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{opacity: 0, y: 30}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Cómo Funciona el Proceso
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Desde el llenado del formulario hasta el envío a tu aseguradora, nosotros nos encargamos de todo
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{opacity: 0, y: 30}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{delay: index * 0.1}}
                className="relative"
              >
                <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-3xl font-bold text-[#204499] mb-3 flex items-start justify-start">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/4 -right-4 transform -translate-y-1/2">
                    <SafeIcon icon={FiArrowRight} className="text-2xl text-gray-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{opacity: 0, y: 30}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              ¿Necesitas Ayuda?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Nuestro equipo de especialistas está disponible para apoyarte durante todo el proceso de tu reclamo
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-blue-900 mb-4">
                Canales de Soporte Disponibles:
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-blue-800">
                <div>
                  <p className="font-medium">📞 Teléfono</p>
                  <p className="text-sm">Lunes a Viernes 9:00 AM - 6:00 PM</p>
                </div>
                <div>
                  <p className="font-medium">📧 Email</p>
                  <p className="text-sm">Respuesta en máximo 24 horas</p>
                </div>
                <div>
                  <p className="font-medium">💬 WhatsApp</p>
                  <p className="text-sm">Chat directo con nuestro equipo</p>
                </div>
                <div>
                  <p className="font-medium">🕐 Horario</p>
                  <p className="text-sm">Lunes a Viernes 9:00 AM - 6:00 PM</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#204499]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{opacity: 0, y: 30}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true}}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              ¿Listo para iniciar tu reclamo?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Nuestro equipo está listo para ayudarte en cada paso del proceso
            </p>
            <motion.button
              whileHover={{scale: 1.05}}
              whileTap={{scale: 0.95}}
              onClick={() => navigate('/form')}
              className="bg-white hover:bg-gray-50 text-[#204499] font-semibold py-4 px-8 rounded-xl text-lg shadow-lg transition-all duration-300 flex items-center gap-3 mx-auto"
            >
              Comenzar Ahora
              <SafeIcon icon={FiArrowRight} className="text-xl" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <img
                src="https://storage.googleapis.com/msgsndr/HWRXLf7lstECUAG07eRw/media/685d77c08f84bd3c493ed246.png"
                alt="Fortex"
                className="h-8"
              />
              <span className="text-gray-400">© 2024 Fortex. Todos los derechos reservados.</span>
            </div>
            <div className="flex items-center gap-4 text-gray-400">
              <SafeIcon icon={FiMail} className="text-lg" />
              <span>asistencia@fortex.mx</span>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-wrap justify-center md:justify-between items-center gap-4">
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                Términos y Condiciones
              </Link>
              <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Política de Privacidad
              </Link>
            </div>
            <Link to="/admin" className="text-gray-400 hover:text-white text-sm transition-colors">
              Panel de Administrador
            </Link>
          </div>
        </div>
      </footer>

      {/* WhatsApp Widget */}
      <WhatsAppWidget />
    </div>
  );
};

// WhatsApp Widget Component
const WhatsAppWidget = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [whatsappNumber, setWhatsappNumber] = React.useState('+528183032600'); // Número actualizado

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent('Hola, necesito ayuda con mi reclamo de seguro. Soy cliente de Fortex.');
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <>
      {/* WhatsApp Button */}
      <motion.div
        initial={{scale: 0}}
        animate={{scale: 1}}
        transition={{delay: 2, type: "spring", stiffness: 500, damping: 30}}
        className="fixed bottom-6 right-6 z-50"
      >
        <motion.button
          whileHover={{scale: 1.1}}
          whileTap={{scale: 0.9}}
          onClick={() => setIsOpen(!isOpen)}
          className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300"
        >
          <SafeIcon icon={FiMessageCircle} className="text-2xl" />
        </motion.button>
      </motion.div>

      {/* WhatsApp Popup */}
      {isOpen && (
        <motion.div
          initial={{opacity: 0, y: 20, scale: 0.8}}
          animate={{opacity: 1, y: 0, scale: 1}}
          exit={{opacity: 0, y: 20, scale: 0.8}}
          className="fixed bottom-24 right-6 z-50 bg-white rounded-lg shadow-xl p-6 w-80 border"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <SafeIcon icon={FiMessageCircle} className="text-white text-lg" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Soporte Fortex</h3>
                <p className="text-sm text-green-600">En línea</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <div className="mb-4">
            <p className="text-gray-600 text-sm mb-3">
              ¡Hola! 👋 Soy parte del equipo de Fortex. ¿En qué puedo ayudarte con tu reclamo?
            </p>
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
              <p className="font-medium mb-1">Horario de atención:</p>
              <p>Lunes a Viernes</p>
              <p>9:00 AM - 6:00 PM</p>
            </div>
          </div>
          <motion.button
            whileHover={{scale: 1.02}}
            whileTap={{scale: 0.98}}
            onClick={handleWhatsAppClick}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <SafeIcon icon={FiMessageCircle} className="text-lg" />
            Iniciar Chat
          </motion.button>
        </motion.div>
      )}
    </>
  );
};

export default LandingPage;