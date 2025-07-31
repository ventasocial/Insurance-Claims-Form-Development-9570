import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import supabase from '../lib/supabase';
import WebhookService from '../lib/webhookService';

const {
  FiArrowLeft,
  FiRefreshCw,
  FiFilter,
  FiDownload,
  FiEye,
  FiClock,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiFileText,
  FiZap,
  FiInfo,
  FiTrash2
} = FiIcons;

const WebhookLogsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get webhook ID from URL params if navigating from specific webhook
  const searchParams = new URLSearchParams(location.search);
  const webhookIdFromUrl = searchParams.get('webhook_id');
  
  const [webhookLogs, setWebhookLogs] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryingLogs, setRetryingLogs] = useState(new Set());
  const [selectedLogForDetails, setSelectedLogForDetails] = useState(null);
  
  // Filtros
  const [filters, setFilters] = useState({
    webhook_id: webhookIdFromUrl || 'all',
    success: 'all',
    event: 'all',
    dateFrom: '',
    dateTo: '',
    searchTerm: ''
  });

  // Eventos disponibles
  const availableEvents = [
    { id: 'form_submitted', name: 'Formulario Enviado' },
    { id: 'form_updated', name: 'Formulario Actualizado' },
    { id: 'document_uploaded', name: 'Documento Subido' },
    { id: 'test_webhook', name: 'Webhook de Prueba' },
    { id: 'connectivity_test', name: 'Test de Conectividad' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchWebhookLogs();
  }, [filters]);

  const fetchData = async () => {
    try {
      // Obtener webhooks para el filtro
      const { data: webhooksData, error: webhooksError } = await supabase
        .from('webhooks_r2x4')
        .select('*')
        .order('created_at', { ascending: false });

      if (webhooksError) throw webhooksError;
      setWebhooks(webhooksData || []);

      // Obtener logs
      await fetchWebhookLogs();
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const fetchWebhookLogs = async () => {
    try {
      let query = supabase
        .from('webhook_logs_r2x4')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(100);

      // Aplicar filtros
      if (filters.webhook_id !== 'all') {
        query = query.eq('webhook_id', filters.webhook_id);
      }

      if (filters.success !== 'all') {
        query = query.eq('success', filters.success === 'success');
      }

      if (filters.event !== 'all') {
        query = query.eq('event', filters.event);
      }

      if (filters.dateFrom) {
        query = query.gte('sent_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('sent_at', filters.dateTo + 'T23:59:59');
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data || [];

      // Filtro de búsqueda por texto
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filteredData = filteredData.filter(log =>
          log.event?.toLowerCase().includes(searchLower) ||
          log.response_body?.toLowerCase().includes(searchLower) ||
          log.payload?.toLowerCase().includes(searchLower)
        );
      }

      setWebhookLogs(filteredData);
    } catch (err) {
      console.error('Error fetching webhook logs:', err);
      setError('Error al cargar los logs del webhook');
    }
  };

  const handleRetryWebhook = async (logId) => {
    setRetryingLogs(prev => new Set([...prev, logId]));
    try {
      const result = await WebhookService.manualRetry(logId);
      if (result.success) {
        alert('Reintento de webhook iniciado correctamente');
        // Refrescar logs después de un breve delay
        setTimeout(() => {
          fetchWebhookLogs();
        }, 2000);
      } else {
        alert(`Error al reintentar webhook: ${result.message}`);
      }
    } catch (error) {
      console.error('Error retrying webhook:', error);
      alert('Error al reintentar el webhook');
    } finally {
      setRetryingLogs(prev => {
        const newSet = new Set(prev);
        newSet.delete(logId);
        return newSet;
      });
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      webhook_id: 'all',
      success: 'all',
      event: 'all',
      dateFrom: '',
      dateTo: '',
      searchTerm: ''
    });
  };

  const exportLogs = () => {
    try {
      const csvContent = [
        // Headers
        ['Fecha', 'Webhook', 'Evento', 'Estado', 'Código', 'Reintentos'].join(','),
        // Data
        ...webhookLogs.map(log => [
          new Date(log.sent_at).toLocaleString(),
          webhooks.find(w => w.id === log.webhook_id)?.name || 'Webhook eliminado',
          log.event,
          log.success ? 'Éxito' : 'Error',
          log.status_code,
          log.retry_count || 0
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `webhook-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Error al exportar los logs');
    }
  };

  const getStatusBadge = (log) => {
    if (log.success) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Éxito</span>;
    } else {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Error</span>;
    }
  };

  const getRetryBadge = (retryCount) => {
    if (retryCount > 0) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Reintento {retryCount}</span>;
    }
    return null;
  };

  const formatPayload = (payload) => {
    try {
      const parsed = JSON.parse(payload);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return payload;
    }
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
                onClick={() => navigate('/admin')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <SafeIcon icon={FiArrowLeft} className="text-xl text-gray-600" />
              </motion.button>
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <SafeIcon icon={FiFileText} className="text-2xl text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Historial de Webhooks</h1>
                  <p className="text-gray-600">Registro completo de envíos de webhooks</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchWebhookLogs}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <SafeIcon icon={FiRefreshCw} className="text-lg" />
                Actualizar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportLogs}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <SafeIcon icon={FiDownload} className="text-lg" />
                Exportar
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
            className="bg-red-50 text-red-800 p-4 rounded-lg mb-6 flex items-center gap-3"
          >
            <SafeIcon icon={FiAlertCircle} className="text-xl flex-shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <SafeIcon icon={FiZap} className="text-xl text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Envíos</p>
                <p className="text-2xl font-bold text-gray-900">{webhookLogs.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <SafeIcon icon={FiCheck} className="text-xl text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Exitosos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {webhookLogs.filter(log => log.success).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-3 rounded-lg">
                <SafeIcon icon={FiX} className="text-xl text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Fallidos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {webhookLogs.filter(log => !log.success).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <SafeIcon icon={FiRefreshCw} className="text-xl text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Reintentos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {webhookLogs.filter(log => (log.retry_count || 0) > 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <SafeIcon icon={FiFilter} className="text-lg text-gray-600" />
            <h3 className="font-medium text-gray-900">Filtros</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Webhook Filter */}
            <select
              value={filters.webhook_id}
              onChange={(e) => handleFilterChange('webhook_id', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent text-sm"
            >
              <option value="all">Todos los webhooks</option>
              {webhooks.map(webhook => (
                <option key={webhook.id} value={webhook.id}>
                  {webhook.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filters.success}
              onChange={(e) => handleFilterChange('success', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent text-sm"
            >
              <option value="all">Todos los estados</option>
              <option value="success">Solo éxitos</option>
              <option value="error">Solo errores</option>
            </select>

            {/* Event Filter */}
            <select
              value={filters.event}
              onChange={(e) => handleFilterChange('event', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent text-sm"
            >
              <option value="all">Todos los eventos</option>
              {availableEvents.map(event => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>

            {/* Date From */}
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent text-sm"
              placeholder="Fecha desde"
            />

            {/* Date To */}
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent text-sm"
              placeholder="Fecha hasta"
            />

            {/* Search */}
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              placeholder="Buscar en logs..."
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent text-sm"
            />
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Limpiar filtros
            </button>
            <div className="text-sm text-gray-600">
              Mostrando {webhookLogs.length} registros
            </div>
          </div>
        </motion.div>

        {/* Logs Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Webhook
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Evento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {webhookLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <SafeIcon icon={FiClock} className="text-4xl text-gray-300 mb-4" />
                        <p className="text-lg font-medium mb-2">No hay registros de webhooks</p>
                        <p className="text-sm">No se encontraron logs con los filtros aplicados</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  webhookLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.sent_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {webhooks.find(w => w.id === log.webhook_id)?.name || 'Webhook eliminado'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-900">{log.event}</span>
                          {getRetryBadge(log.retry_count)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <SafeIcon 
                            icon={log.success ? FiCheck : FiX} 
                            className={`${log.success ? 'text-green-600' : 'text-red-600'} text-lg`} 
                          />
                          {getStatusBadge(log)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          log.status_code >= 200 && log.status_code < 300 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {log.status_code || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedLogForDetails(log)}
                            className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <SafeIcon icon={FiEye} className="text-sm" />
                          </motion.button>
                          
                          {!log.success && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleRetryWebhook(log.id)}
                              disabled={retryingLogs.has(log.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                retryingLogs.has(log.id)
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                              }`}
                              title="Reintentar webhook"
                            >
                              {retryingLogs.has(log.id) ? (
                                <div className="animate-spin w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full" />
                              ) : (
                                <SafeIcon icon={FiRefreshCw} className="text-sm" />
                              )}
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Log Details Modal */}
        {selectedLogForDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-auto">
              <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
                <h3 className="font-medium text-lg">
                  Detalles del Log - {selectedLogForDetails.event}
                </h3>
                <button
                  onClick={() => setSelectedLogForDetails(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Información del Envío</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Fecha:</span>
                        <span className="text-sm text-gray-900">
                          {new Date(selectedLogForDetails.sent_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Webhook:</span>
                        <span className="text-sm text-gray-900">
                          {webhooks.find(w => w.id === selectedLogForDetails.webhook_id)?.name || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Evento:</span>
                        <span className="text-sm text-gray-900">{selectedLogForDetails.event}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Estado:</span>
                        <span className="text-sm text-gray-900">
                          {selectedLogForDetails.success ? 'Éxito' : 'Error'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Código:</span>
                        <span className="text-sm text-gray-900">{selectedLogForDetails.status_code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Reintentos:</span>
                        <span className="text-sm text-gray-900">{selectedLogForDetails.retry_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payload enviado */}
                {selectedLogForDetails.payload && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Payload Enviado</h4>
                    <pre className="bg-gray-800 text-white p-4 rounded-lg text-xs overflow-x-auto">
                      {formatPayload(selectedLogForDetails.payload)}
                    </pre>
                  </div>
                )}

                {/* Respuesta recibida */}
                {selectedLogForDetails.response_body && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Respuesta Recibida</h4>
                    <pre className="bg-gray-800 text-white p-4 rounded-lg text-xs overflow-x-auto">
                      {selectedLogForDetails.response_body}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default WebhookLogsPage;