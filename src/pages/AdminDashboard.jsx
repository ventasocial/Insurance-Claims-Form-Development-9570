import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import supabase from '../lib/supabase';

const { 
  FiArrowLeft, FiUsers, FiFileText, FiCheckCircle, FiClock, 
  FiExternalLink, FiDownload, FiLogOut, FiSettings, FiMessageCircle 
} = FiIcons;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('submissions');
  const [whatsappConfig, setWhatsappConfig] = useState({
    number: '+528122095020',
    message: 'Hola, necesito ayuda con mi reclamo de seguro. Soy cliente de Fortex.',
    enabled: true
  });
  const [stats, setStats] = useState({
    total: 0,
    enviados: 0,
    pendientes: 0,
    documentos: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener todas las reclamaciones
        const { data, error } = await supabase
          .from('reclamaciones_r2x4')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transformar los datos para el formato que necesitamos
        const formattedData = data.map(item => ({
          id: item.id,
          nombre: `${item.contacto_nombres} ${item.contacto_apellido_paterno} ${item.contacto_apellido_materno}`,
          email: item.contacto_email,
          aseguradora: item.aseguradora,
          tipoReclamo: item.tipo_reclamo,
          fecha: new Date(item.created_at).toISOString().split('T')[0],
          estado: item.estado,
          documentos: Object.keys(item.documentos || {}).reduce((acc, key) => {
            return acc + (item.documentos[key]?.length || 0);
          }, 0)
        }));

        setSubmissions(formattedData);

        // Calcular estadísticas
        const newStats = {
          total: formattedData.length,
          enviados: formattedData.filter(s => s.estado === 'Enviado').length,
          pendientes: formattedData.filter(s => s.estado === 'Pendiente').length,
          documentos: formattedData.reduce((acc, s) => acc + s.documentos, 0)
        };

        setStats(newStats);
      } catch (err) {
        console.error('Error al cargar los datos:', err);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleWhatsAppConfigSave = () => {
    // En una implementación real, esto se guardaría en la base de datos
    localStorage.setItem('whatsappConfig', JSON.stringify(whatsappConfig));
    alert('Configuración de WhatsApp guardada correctamente');
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'Enviado':
        return 'bg-green-100 text-green-800';
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const generateReturnUrl = (submission) => {
    const baseUrl = window.location.origin + '/#/form';
    const missingDocs = 'informe-medico,factura-hospital'; // Example missing documents
    return `${baseUrl}?missing=${missingDocs}&id=${submission.id}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-[#204499] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
              <h1 className="text-2xl font-bold text-gray-900">Panel de Administrador</h1>
            </div>
            <div className="flex items-center gap-4">
              <img 
                src="https://storage.googleapis.com/msgsndr/HWRXLf7lstECUAG07eRw/media/685d77c05c72d29e532e823f.png"
                alt="Fortex"
                className="h-8"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
              >
                <SafeIcon icon={FiLogOut} className="text-gray-600" />
                Cerrar Sesión
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 text-red-800 p-4 rounded-lg mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('submissions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'submissions'
                    ? 'border-[#204499] text-[#204499]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <SafeIcon icon={FiFileText} className="text-lg" />
                  Envíos
                </div>
              </button>
              <button
                onClick={() => setActiveTab('whatsapp')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'whatsapp'
                    ? 'border-[#204499] text-[#204499]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <SafeIcon icon={FiMessageCircle} className="text-lg" />
                  WhatsApp
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Submissions Tab */}
        {activeTab === 'submissions' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-xl shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <SafeIcon icon={FiUsers} className="text-2xl text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Envíos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-6 rounded-xl shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <SafeIcon icon={FiCheckCircle} className="text-2xl text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Enviados</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.enviados}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-6 rounded-xl shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <SafeIcon icon={FiClock} className="text-2xl text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pendientes</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendientes}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white p-6 rounded-xl shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <SafeIcon icon={FiFileText} className="text-2xl text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Documentos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.documentos}</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Submissions Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Registro de Envíos</h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-[#204499] hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <SafeIcon icon={FiDownload} className="text-sm" />
                    Exportar
                  </motion.button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aseguradora
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo de Reclamo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Documentos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {submissions.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                          No hay envíos registrados
                        </td>
                      </tr>
                    ) : (
                      submissions.map((submission) => (
                        <tr key={submission.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {submission.nombre}
                              </div>
                              <div className="text-sm text-gray-500">
                                {submission.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {submission.aseguradora}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {submission.tipoReclamo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {submission.fecha}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(submission.estado)}`}>
                              {submission.estado}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {submission.documentos}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                const url = generateReturnUrl(submission);
                                navigator.clipboard.writeText(url);
                                alert('URL copiada al portapapeles');
                              }}
                              className="text-[#204499] hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                              <SafeIcon icon={FiExternalLink} className="text-sm" />
                              Generar URL
                            </motion.button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}

        {/* WhatsApp Configuration Tab */}
        {activeTab === 'whatsapp' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-100 p-3 rounded-lg">
                <SafeIcon icon={FiMessageCircle} className="text-2xl text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Configuración de WhatsApp</h2>
                <p className="text-gray-600">Configura el widget de WhatsApp para el sitio web</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={whatsappConfig.enabled}
                    onChange={(e) => setWhatsappConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="font-medium text-gray-900">Habilitar widget de WhatsApp</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de WhatsApp
                </label>
                <input
                  type="text"
                  value={whatsappConfig.number}
                  onChange={(e) => setWhatsappConfig(prev => ({ ...prev, number: e.target.value }))}
                  placeholder="+52 81 2209 5020"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Incluye el código de país (ej: +52 para México)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje predeterminado
                </label>
                <textarea
                  value={whatsappConfig.message}
                  onChange={(e) => setWhatsappConfig(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  placeholder="Mensaje que se enviará automáticamente cuando el usuario haga clic en el widget"
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">Vista previa del widget:</h3>
                <div className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <SafeIcon icon={FiMessageCircle} className="text-white text-lg" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Soporte Fortex</h4>
                      <p className="text-sm text-green-600">En línea</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {whatsappConfig.message}
                  </p>
                  <div className="bg-green-500 text-white py-2 px-4 rounded-lg text-sm text-center">
                    Iniciar Chat
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleWhatsAppConfigSave}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <SafeIcon icon={FiSettings} className="text-lg" />
                  Guardar Configuración
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;