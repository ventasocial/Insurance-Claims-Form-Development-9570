import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import supabase from '../lib/supabase';
import WebhookService from '../lib/webhookService';

const {
  FiLink,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiToggleLeft,
  FiToggleRight,
  FiSave,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiSettings,
  FiZap,
  FiList,
  FiWifi,
  FiInfo,
  FiExternalLink
} = FiIcons;

const WebhookManager = () => {
  const navigate = useNavigate();
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState(null);
  const [testingWebhook, setTestingWebhook] = useState(null);
  const [testingConnectivity, setTestingConnectivity] = useState(new Set());

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    enabled: true,
    trigger_events: ['form_submitted'],
    headers: {},
    description: ''
  });

  // Eventos disponibles
  const availableEvents = [
    { id: 'form_submitted', name: 'Formulario Enviado', description: 'Se dispara cuando se envía un nuevo reclamo' },
    { id: 'form_updated', name: 'Formulario Actualizado', description: 'Se dispara cuando se actualiza un reclamo existente' },
    { id: 'document_uploaded', name: 'Documento Subido', description: 'Se dispara cuando se sube un nuevo documento' }
  ];

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const { data, error } = await supabase
        .from('webhooks_r2x4')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebhooks(data || []);
    } catch (err) {
      console.error('Error fetching webhooks:', err);
      setError('Error al cargar los webhooks');
    } finally {
      setLoading(false);
    }
  };

  const testConnectivity = async (webhook) => {
    setTestingConnectivity(prev => new Set([...prev, webhook.id]));
    try {
      const result = await WebhookService.testConnectivity(webhook.url);
      if (result.success) {
        alert(`✅ Conectividad exitosa!\n\nMétodo: ${result.method}\nStatus: ${result.status}\nResponse: ${result.statusText || 'OK'}\n\n✅ La URL está funcionando correctamente.`);
      } else {
        let errorMsg = `❌ Error de conectividad:\n\n`;
        errorMsg += `Método probado: ${result.method || 'unknown'}\n`;
        if (result.type === 'TypeError' || result.error?.includes('fetch')) {
          errorMsg += `Tipo: Error de red/CORS\n\n`;
          errorMsg += `💡 Soluciones posibles:\n`;
          errorMsg += `1. Verifica que la URL esté correcta\n`;
          errorMsg += `2. Asegúrate de que el webhook esté activo en Albato\n`;
          errorMsg += `3. Revisa que no haya espacios o caracteres especiales\n\n`;
          errorMsg += `ℹ️ Nota: Los errores de CORS son normales desde el navegador.\n`;
          errorMsg += `Los webhooks reales se enviarán correctamente desde el servidor.`;
        } else {
          errorMsg += `Error: ${result.error}`;
        }
        alert(errorMsg);
      }
    } catch (error) {
      alert(`Error al probar conectividad: ${error.message}`);
    } finally {
      setTestingConnectivity(prev => {
        const newSet = new Set(prev);
        newSet.delete(webhook.id);
        return newSet;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const webhookData = {
        ...formData,
        headers: JSON.stringify(formData.headers),
        trigger_events: formData.trigger_events
      };

      if (editingWebhook) {
        const { error } = await supabase
          .from('webhooks_r2x4')
          .update(webhookData)
          .eq('id', editingWebhook.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('webhooks_r2x4')
          .insert([webhookData]);
        if (error) throw error;
      }

      await fetchWebhooks();
      resetForm();
      alert(editingWebhook ? 'Webhook actualizado correctamente' : 'Webhook creado correctamente');
    } catch (err) {
      console.error('Error saving webhook:', err);
      setError('Error al guardar el webhook');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      enabled: true,
      trigger_events: ['form_submitted'],
      headers: {},
      description: ''
    });
    setShowAddForm(false);
    setEditingWebhook(null);
  };

  const handleEdit = (webhook) => {
    // Parsear headers de manera segura
    let parsedHeaders = {};
    try {
      parsedHeaders = webhook.headers ? JSON.parse(webhook.headers) : {};
    } catch (e) {
      console.warn('Invalid headers JSON:', e);
      parsedHeaders = {};
    }

    setFormData({
      name: webhook.name,
      url: webhook.url,
      enabled: webhook.enabled,
      trigger_events: webhook.trigger_events || ['form_submitted'],
      headers: parsedHeaders,
      description: webhook.description || ''
    });
    setEditingWebhook(webhook);
    setShowAddForm(true);
  };

  const handleDelete = async (webhookId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este webhook?')) return;

    try {
      const { error } = await supabase
        .from('webhooks_r2x4')
        .delete()
        .eq('id', webhookId);
      if (error) throw error;

      await fetchWebhooks();
      alert('Webhook eliminado correctamente');
    } catch (err) {
      console.error('Error deleting webhook:', err);
      setError('Error al eliminar el webhook');
    }
  };

  const toggleWebhook = async (webhook) => {
    try {
      const { error } = await supabase
        .from('webhooks_r2x4')
        .update({ enabled: !webhook.enabled })
        .eq('id', webhook.id);
      if (error) throw error;

      await fetchWebhooks();
    } catch (err) {
      console.error('Error toggling webhook:', err);
      setError('Error al cambiar el estado del webhook');
    }
  };

  const testWebhook = async (webhook) => {
    setTestingWebhook(webhook.id);
    try {
      // Validar URL antes de enviar
      if (!webhook.url || !webhook.url.startsWith('http')) {
        throw new Error('URL del webhook inválida');
      }

      const result = await WebhookService.testWebhookComplete(webhook);
      if (result.success) {
        alert(`✅ Webhook de prueba enviado correctamente!\n\nMétodo: ${result.method}\nMensaje: ${result.message}\n\n✅ Revisa tu integración en Albato para ver los datos recibidos.`);
      } else {
        alert(`❌ Error en webhook de prueba\n\nMétodo: ${result.method}\nError: ${result.error}\n\n💡 Verifica:\n• Que el webhook esté activo en Albato\n• Que la URL sea correcta\n• Que la configuración permita el acceso`);
      }
    } catch (err) {
      console.error('Error testing webhook:', err);
      let errorMessage = '❌ Error al probar el webhook:\n\n';
      if (err.name === 'AbortError') {
        errorMessage += 'Timeout - El webhook tardó demasiado en responder\n\n';
        errorMessage += 'Posibles causas:\n• Albato está procesando lentamente\n• Problemas de conectividad\n• El webhook no está configurado';
      } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage += 'Error de conectividad\n\n';
        errorMessage += 'Posibles causas:\n• URL incorrecta\n• Webhook no activo en Albato\n• Problema de CORS\n• Falta de conexión a internet\n\n';
        errorMessage += 'ℹ️ Nota: Los webhooks reales funcionarán correctamente desde el servidor.';
      } else {
        errorMessage += err.message;
      }
      alert(errorMessage);
    } finally {
      setTestingWebhook(null);
    }
  };

  const handleHeaderChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      headers: { ...prev.headers, [key]: value }
    }));
  };

  const addHeader = () => {
    const key = prompt('Nombre del header:');
    if (key) {
      const value = prompt('Valor del header:');
      if (value !== null) {
        handleHeaderChange(key, value);
      }
    }
  };

  const removeHeader = (key) => {
    setFormData(prev => {
      const newHeaders = { ...prev.headers };
      delete newHeaders[key];
      return { ...prev, headers: newHeaders };
    });
  };

  const viewWebhookLogs = (webhookId = null) => {
    if (webhookId) {
      navigate(`/webhook-logs?webhook_id=${webhookId}`);
    } else {
      navigate('/webhook-logs');
    }
  };

  if (loading && webhooks.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-[#204499] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 p-3 rounded-lg">
            <SafeIcon icon={FiZap} className="text-2xl text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Webhooks</h2>
            <p className="text-gray-600">Configura webhooks para integrar con sistemas externos</p>
          </div>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => viewWebhookLogs()}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <SafeIcon icon={FiList} className="text-lg" />
            Ver Historial Completo
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddForm(true)}
            className="bg-[#204499] hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <SafeIcon icon={FiPlus} className="text-lg" />
            Nuevo Webhook
          </motion.button>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 text-red-800 p-4 rounded-lg flex items-center gap-3"
        >
          <SafeIcon icon={FiAlertCircle} className="text-xl flex-shrink-0" />
          <p>{error}</p>
        </motion.div>
      )}

      {/* Información sobre CORS y soluciones */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <SafeIcon icon={FiInfo} className="text-blue-600 text-xl flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Importante: Sobre Errores de CORS</h3>
            <p className="text-blue-800 text-sm mb-3">
              Los errores de CORS (Cross-Origin Resource Sharing) son normales cuando se prueban webhooks desde el navegador. Esto no afecta el funcionamiento real de los webhooks cuando se envían desde el servidor.
            </p>
            <div className="bg-blue-100 rounded-lg p-4 mb-4">
              <p className="text-blue-800 text-sm font-medium mb-2">¿Qué significa esto?</p>
              <ul className="text-blue-700 text-xs space-y-1">
                <li>• Los navegadores bloquean peticiones a dominios externos por seguridad</li>
                <li>• Los webhooks reales se envían desde el servidor, no desde el navegador</li>
                <li>• Si ves "Error de CORS", el webhook probablemente funcione correctamente en producción</li>
                <li>• Los formularios enviados por usuarios activarán los webhooks sin problemas</li>
              </ul>
            </div>
            <div className="bg-blue-100 rounded-lg p-3">
              <p className="text-blue-800 text-sm font-medium mb-2">Para probar webhooks de Albato:</p>
              <ul className="text-blue-700 text-xs space-y-1">
                <li>• Usa "Probar Conectividad" para verificar la URL</li>
                <li>• Envía un formulario de prueba completo</li>
                <li>• Revisa los logs en Albato para confirmar la recepción</li>
                <li>• Los datos se enviarán correctamente incluso si el test muestra errores de CORS</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Información sobre Albato */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <SafeIcon icon={FiSettings} className="text-green-600 text-xl flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-green-900 mb-2">Integración con Albato y GoHighLevel</h3>
            <p className="text-green-800 text-sm mb-3">
              Los webhooks configurados aquí se dispararán automáticamente cuando se envíen formularios de reclamo. Usa Albato como integrador para conectar con GoHighLevel u otros sistemas CRM.
            </p>
            <div className="bg-green-100 rounded-lg p-4 mb-4">
              <p className="text-green-800 text-sm font-medium mb-2">Configuración recomendada para Albato:</p>
              <ul className="text-green-700 text-xs space-y-1">
                <li>• Copia exactamente la URL que Albato te proporciona</li>
                <li>• No incluyas espacios o caracteres especiales</li>
                <li>• Asegúrate de que el webhook esté activo en Albato</li>
                <li>• Usa el botón "Probar Conectividad" antes del test completo</li>
              </ul>
            </div>
            <div className="bg-green-100 rounded-lg p-3">
              <p className="text-green-800 text-sm font-medium mb-2">Datos que se envían en el webhook:</p>
              <ul className="text-green-700 text-xs space-y-1">
                <li>• Información de contacto completa</li>
                <li>• Detalles del reclamo (tipo, aseguradora, servicios)</li>
                <li>• Información de personas involucradas</li>
                <li>• Descripción del siniestro</li>
                <li>• URLs de documentos subidos</li>
                <li>• Estado del reclamo y timestamps</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {editingWebhook ? 'Editar Webhook' : 'Nuevo Webhook'}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <SafeIcon icon={FiX} className="text-xl" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Webhook *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent"
                  placeholder="ej: Albato - Nuevos Reclamos"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL del Webhook *
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent"
                  placeholder="https://h.albato.com/wh/38/..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Copia exactamente la URL que te proporciona Albato
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent resize-none"
                rows={3}
                placeholder="Descripción opcional del propósito de este webhook"
              />
            </div>

            {/* Eventos que disparan el webhook */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Eventos que disparan el webhook
              </label>
              <div className="space-y-3">
                {availableEvents.map(event => (
                  <label key={event.id} className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.trigger_events.includes(event.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            trigger_events: [...prev.trigger_events, event.id]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            trigger_events: prev.trigger_events.filter(id => id !== event.id)
                          }));
                        }
                      }}
                      className="mt-1 w-4 h-4 text-[#204499] border-gray-300 rounded focus:ring-[#204499]"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{event.name}</div>
                      <div className="text-sm text-gray-500">{event.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Headers personalizados */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Headers Personalizados
                </label>
                <button
                  type="button"
                  onClick={addHeader}
                  className="text-[#204499] hover:text-blue-700 text-sm font-medium transition-colors"
                >
                  + Agregar Header
                </button>
              </div>
              {Object.keys(formData.headers).length > 0 ? (
                <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                  {Object.entries(formData.headers).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => {
                          const newKey = e.target.value;
                          const newHeaders = { ...formData.headers };
                          delete newHeaders[key];
                          newHeaders[newKey] = value;
                          setFormData(prev => ({ ...prev, headers: newHeaders }));
                        }}
                        className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded"
                        placeholder="Header name"
                      />
                      <span className="text-gray-500">:</span>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleHeaderChange(key, e.target.value)}
                        className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded"
                        placeholder="Header value"
                      />
                      <button
                        type="button"
                        onClick={() => removeHeader(key)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <SafeIcon icon={FiTrash2} className="text-sm" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No hay headers personalizados configurados</p>
              )}
            </div>

            {/* Estado */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="w-4 h-4 text-[#204499] border-gray-300 rounded focus:ring-[#204499]"
                />
                <span className="text-sm font-medium text-gray-700">Webhook habilitado</span>
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.05 }}
                whileTap={{ scale: loading ? 1 : 0.95 }}
                className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  loading 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-[#204499] hover:bg-blue-700 text-white'
                }`}
              >
                {loading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <SafeIcon icon={FiSave} className="text-lg" />
                )}
                {editingWebhook ? 'Actualizar' : 'Guardar'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Webhooks List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Webhooks Configurados</h3>
        </div>
        {webhooks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <SafeIcon icon={FiLink} className="text-4xl mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No hay webhooks configurados</p>
            <p className="text-sm">Crea tu primer webhook para comenzar a integrar con sistemas externos</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">{webhook.name}</h4>
                      <button
                        onClick={() => toggleWebhook(webhook)}
                        className={`transition-colors ${
                          webhook.enabled ? 'text-green-600' : 'text-gray-400'
                        }`}
                      >
                        <SafeIcon 
                          icon={webhook.enabled ? FiToggleRight : FiToggleLeft} 
                          className="text-2xl" 
                        />
                      </button>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        webhook.enabled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {webhook.enabled ? 'Activo' : 'Inactivo'}
                      </span>
                      {WebhookService.isAlbatoUrl(webhook.url) && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          Albato
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2 break-all">{webhook.url}</p>
                    {webhook.description && (
                      <p className="text-sm text-gray-500 mb-3">{webhook.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {webhook.trigger_events?.map(event => {
                        const eventInfo = availableEvents.find(e => e.id === event);
                        return (
                          <span key={event} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {eventInfo?.name || event}
                          </span>
                        );
                      })}
                    </div>
                    <div className="text-xs text-gray-400">
                      Creado: {new Date(webhook.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => viewWebhookLogs(webhook.id)}
                      className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Ver logs"
                    >
                      <SafeIcon icon={FiList} className="text-lg" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => testConnectivity(webhook)}
                      disabled={testingConnectivity.has(webhook.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        testingConnectivity.has(webhook.id)
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-green-100 text-green-600 hover:bg-green-200'
                      }`}
                      title="Probar conectividad"
                    >
                      {testingConnectivity.has(webhook.id) ? (
                        <div className="animate-spin w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full" />
                      ) : (
                        <SafeIcon icon={FiWifi} className="text-lg" />
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => testWebhook(webhook)}
                      disabled={testingWebhook === webhook.id || !webhook.enabled}
                      className={`p-2 rounded-lg transition-colors ${
                        testingWebhook === webhook.id || !webhook.enabled
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                      }`}
                      title="Probar webhook con datos completos"
                    >
                      {testingWebhook === webhook.id ? (
                        <div className="animate-spin w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full" />
                      ) : (
                        <SafeIcon icon={FiZap} className="text-lg" />
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEdit(webhook)}
                      className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors"
                      title="Editar webhook"
                    >
                      <SafeIcon icon={FiEdit} className="text-lg" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(webhook.id)}
                      className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                      title="Eliminar webhook"
                    >
                      <SafeIcon icon={FiTrash2} className="text-lg" />
                    </motion.button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WebhookManager;