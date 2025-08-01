import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import supabase from '../lib/supabase';
import WebhookManager from '../components/WebhookManager';
import { useClaimDocuments, SecureFileLink } from '../utils/secureFiles';

const {
  FiArrowLeft, FiUsers, FiFileText, FiCheckCircle, FiClock, FiExternalLink,
  FiDownload, FiLogOut, FiSettings, FiMessageCircle, FiSearch, FiFilter,
  FiArchive, FiTrash2, FiCalendar, FiCheck, FiX, FiZap, FiEye
} = FiIcons;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('submissions');
  const [selectedItems, setSelectedItems] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [selectedSubmissionForFiles, setSelectedSubmissionForFiles] = useState(null);

  // Filtros
  const [filters, setFilters] = useState({
    searchTerm: '',
    aseguradora: '',
    tipoReclamo: '',
    fechaInicio: '',
    fechaFin: '',
    estado: ''
  });

  const [whatsappConfig, setWhatsappConfig] = useState({
    number: '+528122095020',
    message: 'Hola, necesito ayuda con mi reclamo de seguro. Soy cliente de Fortex.',
    enabled: true
  });

  const [stats, setStats] = useState({
    total: 0,
    enviados: 0,
    pendientes: 0,
    documentos: 0,
    archivados: 0
  });

  useEffect(() => {
    fetchData();
  }, [showArchived]);

  useEffect(() => {
    applyFilters();
  }, [submissions, filters]);

  const fetchData = async () => {
    try {
      // Obtener todas las reclamaciones
      const { data, error } = await supabase
        .from('reclamaciones_r2x4')
        .select('*')
        .eq('archived', showArchived)
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
        archived: item.archived || false,
        documentos: Object.keys(item.documentos || {}).reduce((acc, key) => {
          return acc + (item.documentos[key]?.length || 0);
        }, 0),
        rawDocuments: item.documentos // Agregar documentos completos para acceso seguro
      }));

      setSubmissions(formattedData);

      // Calcular estadísticas (incluir todos los registros, no solo los filtrados)
      const allData = await supabase
        .from('reclamaciones_r2x4')
        .select('*');

      if (allData.data) {
        const newStats = {
          total: allData.data.filter(s => !s.archived).length,
          enviados: allData.data.filter(s => s.estado === 'Enviado' && !s.archived).length,
          pendientes: allData.data.filter(s => s.estado === 'Pendiente' && !s.archived).length,
          archivados: allData.data.filter(s => s.archived).length,
          documentos: allData.data
            .filter(s => !s.archived)
            .reduce((acc, s) => {
              return acc + Object.keys(s.documentos || {}).reduce((docAcc, key) => {
                return docAcc + (s.documentos[key]?.length || 0);
              }, 0);
            }, 0)
        };
        setStats(newStats);
      }
    } catch (err) {
      console.error('Error al cargar los datos:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...submissions];

    // Filtro de búsqueda por nombre
    if (filters.searchTerm) {
      filtered = filtered.filter(item =>
        item.nombre.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    // Filtro por aseguradora
    if (filters.aseguradora) {
      filtered = filtered.filter(item => item.aseguradora === filters.aseguradora);
    }

    // Filtro por tipo de reclamo
    if (filters.tipoReclamo) {
      filtered = filtered.filter(item => item.tipoReclamo === filters.tipoReclamo);
    }

    // Filtro por estado
    if (filters.estado) {
      filtered = filtered.filter(item => item.estado === filters.estado);
    }

    // Filtro por fecha de inicio
    if (filters.fechaInicio) {
      filtered = filtered.filter(item => item.fecha >= filters.fechaInicio);
    }

    // Filtro por fecha de fin
    if (filters.fechaFin) {
      filtered = filtered.filter(item => item.fecha <= filters.fechaFin);
    }

    setFilteredSubmissions(filtered);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      aseguradora: '',
      tipoReclamo: '',
      fechaInicio: '',
      fechaFin: '',
      estado: ''
    });
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(filteredSubmissions.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId, checked) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleBulkArchive = async () => {
    if (selectedItems.length === 0) return;

    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from('reclamaciones_r2x4')
        .update({ archived: !showArchived })
        .in('id', selectedItems);

      if (error) throw error;

      // Refresh data
      await fetchData();
      setSelectedItems([]);
      const action = showArchived ? 'restaurados' : 'archivados';
      alert(`${selectedItems.length} registro(s) ${action} correctamente`);
    } catch (err) {
      console.error('Error en acción masiva:', err);
      alert('Error al realizar la acción masiva');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleWhatsAppConfigSave = () => {
    localStorage.setItem('whatsappConfig', JSON.stringify(whatsappConfig));
    alert('Configuración de WhatsApp guardada correctamente');
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'Enviado': return 'bg-green-100 text-green-800';
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const generateReturnUrl = (submission) => {
    const baseUrl = window.location.origin + '/#/form';
    const missingDocs = 'informe-medico,factura-hospital';
    return `${baseUrl}?missing=${missingDocs}&id=${submission.id}`;
  };

  const getUniqueValues = (field) => {
    return [...new Set(submissions.map(item => item[field]))].filter(Boolean);
  };

  // Componente para mostrar archivos del submission
  const SubmissionFilesModal = ({ submission, onClose }) => {
    const { documentUrls, loading: urlsLoading, error: urlsError } = useClaimDocuments(
      supabase, 
      submission.rawDocuments, 
      submission.id
    );

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-auto">
          <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
            <h3 className="font-medium text-lg">
              Documentos de {submission.nombre}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          <div className="p-6">
            {urlsLoading && (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">
                  Generando enlaces seguros... {Math.round((documentUrls.processedFiles / documentUrls.totalFiles) * 100) || 0}%
                </p>
              </div>
            )}

            {urlsError && (
              <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-4">
                Error al cargar documentos: {urlsError}
              </div>
            )}

            {!urlsLoading && Object.keys(documentUrls).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay documentos disponibles para este reclamo
              </div>
            )}

            {!urlsLoading && Object.keys(documentUrls).length > 0 && (
              <div className="space-y-6">
                {Object.entries(documentUrls).map(([docType, docs]) => (
                  <div key={docType} className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 capitalize">
                      {docType.replace(/-/g, ' ')}
                    </h4>
                    <div className="space-y-2">
                      {docs.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-3">
                            <SafeIcon icon={FiFileText} className="text-blue-500" />
                            <div>
                              <p className="font-medium text-sm">{doc.name}</p>
                              <p className="text-xs text-gray-500">
                                {doc.size ? `${(doc.size / 1024 / 1024).toFixed(2)} MB` : 'Tamaño desconocido'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {doc.success ? (
                              <a
                                href={doc.secureUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <SafeIcon icon={FiEye} className="text-sm" />
                                Ver
                              </a>
                            ) : (
                              <span className="text-red-500 text-sm">
                                Error al generar enlace
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <SafeIcon icon={FiArrowLeft} className="text-xl text-gray-600" />
              </motion.button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Panel de Administrador</h1>
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
                <span className="hidden sm:inline">Cerrar Sesión</span>
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
            <nav className="flex space-x-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab('submissions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
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
                onClick={() => setActiveTab('webhooks')}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'webhooks'
                    ? 'border-[#204499] text-[#204499]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <SafeIcon icon={FiZap} className="text-lg" />
                  Webhooks
                </div>
              </button>
              <button
                onClick={() => setActiveTab('whatsapp')}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-4 md:p-6 rounded-xl shadow-sm"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="bg-blue-100 p-2 md:p-3 rounded-lg">
                    <SafeIcon icon={FiUsers} className="text-lg md:text-2xl text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-gray-600">Total Envíos</p>
                    <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-4 md:p-6 rounded-xl shadow-sm"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="bg-green-100 p-2 md:p-3 rounded-lg">
                    <SafeIcon icon={FiCheckCircle} className="text-lg md:text-2xl text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-gray-600">Enviados</p>
                    <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.enviados}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-4 md:p-6 rounded-xl shadow-sm"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="bg-yellow-100 p-2 md:p-3 rounded-lg">
                    <SafeIcon icon={FiClock} className="text-lg md:text-2xl text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-gray-600">Pendientes</p>
                    <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.pendientes}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white p-4 md:p-6 rounded-xl shadow-sm"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="bg-purple-100 p-2 md:p-3 rounded-lg">
                    <SafeIcon icon={FiFileText} className="text-lg md:text-2xl text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-gray-600">Documentos</p>
                    <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.documentos}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white p-4 md:p-6 rounded-xl shadow-sm"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="bg-gray-100 p-2 md:p-3 rounded-lg">
                    <SafeIcon icon={FiArchive} className="text-lg md:text-2xl text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-gray-600">Archivados</p>
                    <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.archivados}</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Filters and Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6"
            >
              <div className="flex flex-col lg:flex-row gap-4 mb-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o email..."
                      value={filters.searchTerm}
                      onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Toggle archived */}
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showArchived}
                      onChange={(e) => setShowArchived(e.target.checked)}
                      className="w-4 h-4 text-[#204499] border-gray-300 rounded focus:ring-[#204499]"
                    />
                    <span className="text-sm text-gray-700">Ver archivados</span>
                  </label>
                </div>
              </div>

              {/* Filters Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                {/* Aseguradora Filter */}
                <select
                  value={filters.aseguradora}
                  onChange={(e) => handleFilterChange('aseguradora', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent text-sm"
                >
                  <option value="">Todas las aseguradoras</option>
                  {getUniqueValues('aseguradora').map(value => (
                    <option key={value} value={value}>{value.toUpperCase()}</option>
                  ))}
                </select>

                {/* Tipo Reclamo Filter */}
                <select
                  value={filters.tipoReclamo}
                  onChange={(e) => handleFilterChange('tipoReclamo', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent text-sm"
                >
                  <option value="">Todos los tipos</option>
                  {getUniqueValues('tipoReclamo').map(value => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>

                {/* Estado Filter */}
                <select
                  value={filters.estado}
                  onChange={(e) => handleFilterChange('estado', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent text-sm"
                >
                  <option value="">Todos los estados</option>
                  {getUniqueValues('estado').map(value => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>

                {/* Fecha Inicio */}
                <input
                  type="date"
                  value={filters.fechaInicio}
                  onChange={(e) => handleFilterChange('fechaInicio', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent text-sm"
                  placeholder="Fecha inicio"
                />

                {/* Fecha Fin */}
                <input
                  type="date"
                  value={filters.fechaFin}
                  onChange={(e) => handleFilterChange('fechaFin', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent text-sm"
                  placeholder="Fecha fin"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between">
                <div className="flex flex-wrap gap-2">
                  {selectedItems.length > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleBulkArchive}
                      disabled={bulkActionLoading}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        bulkActionLoading
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : showArchived
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                      }`}
                    >
                      {bulkActionLoading ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <SafeIcon icon={showArchived ? FiCheck : FiArchive} className="text-sm" />
                      )}
                      {showArchived ? `Restaurar (${selectedItems.length})` : `Archivar (${selectedItems.length})`}
                    </motion.button>
                  )}
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    <SafeIcon icon={FiX} className="text-sm" />
                    Limpiar Filtros
                  </button>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-[#204499] hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <SafeIcon icon={FiDownload} className="text-sm" />
                  Exportar
                </motion.button>
              </div>

              {/* Results count */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Mostrando {filteredSubmissions.length} de {submissions.length} registros
                  {showArchived && " archivados"}
                </p>
              </div>
            </motion.div>

            {/* Submissions Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedItems.length === filteredSubmissions.length && filteredSubmissions.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="w-4 h-4 text-[#204499] border-gray-300 rounded focus:ring-[#204499]"
                        />
                      </th>
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
                    {filteredSubmissions.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                          No hay envíos registrados {showArchived ? "archivados" : ""} con los filtros aplicados
                        </td>
                      </tr>
                    ) : (
                      filteredSubmissions.map((submission) => (
                        <tr key={submission.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(submission.id)}
                              onChange={(e) => handleSelectItem(submission.id, e.target.checked)}
                              className="w-4 h-4 text-[#204499] border-gray-300 rounded focus:ring-[#204499]"
                            />
                          </td>
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
                            {submission.aseguradora.toUpperCase()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {submission.tipoReclamo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {submission.fecha}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                submission.estado
                              )}`}
                            >
                              {submission.estado}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <span>{submission.documentos}</span>
                              {submission.documentos > 0 && (
                                <button
                                  onClick={() => setSelectedSubmissionForFiles(submission)}
                                  className="text-blue-600 hover:text-blue-800 transition-colors"
                                  title="Ver documentos"
                                >
                                  <SafeIcon icon={FiEye} className="text-sm" />
                                </button>
                              )}
                            </div>
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

        {/* Webhooks Tab */}
        {activeTab === 'webhooks' && <WebhookManager />}

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
                  <p className="text-sm text-gray-600 mb-3">{whatsappConfig.message}</p>
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

        {/* Modal para ver archivos */}
        {selectedSubmissionForFiles && (
          <SubmissionFilesModal
            submission={selectedSubmissionForFiles}
            onClose={() => setSelectedSubmissionForFiles(null)}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;