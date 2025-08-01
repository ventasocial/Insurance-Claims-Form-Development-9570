import { useState, useEffect, useCallback } from 'react';
import React from 'react';

/**
 * Genera una URL temporal firmada para un archivo en Supabase Storage
 * @param {Object} supabase - Cliente de Supabase
 * @param {string} filePath - Ruta del archivo en el bucket
 * @param {number} expiresIn - Tiempo de expiración en segundos (default: 3600 = 1 hora)
 * @returns {Promise<string|null>} URL firmada o null si hay error
 */
export const generateSecureFileUrl = async (supabase, filePath, expiresIn = 3600) => {
  try {
    const { data, error } = await supabase
      .storage
      .from('claims')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Error generando URL firmada:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
};

/**
 * Procesa múltiples archivos y genera URLs seguras
 * @param {Object} supabase - Cliente de Supabase
 * @param {Array} filePaths - Array de rutas de archivos
 * @returns {Promise<Array>} Array de objetos con path y URL
 */
export const generateMultipleSecureUrls = async (supabase, filePaths) => {
  const results = [];
  
  for (const filePath of filePaths) {
    const url = await generateSecureFileUrl(supabase, filePath);
    results.push({
      path: filePath,
      url: url,
      fileName: filePath.split('/').pop(),
      success: url !== null
    });
  }
  
  return results;
};

/**
 * Hook de React para manejar URLs de archivos seguros
 * @param {Object} supabase - Cliente de Supabase
 * @param {string} filePath - Ruta del archivo
 * @returns {Object} Estado con URL, loading, error y función refresh
 */
export const useSecureFileUrl = (supabase, filePath) => {
  const [state, setState] = useState({
    url: null,
    loading: true,
    error: null,
    expiresAt: null
  });

  const generateUrl = useCallback(async () => {
    if (!filePath) {
      setState({
        url: null,
        loading: false,
        error: null,
        expiresAt: null
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const url = await generateSecureFileUrl(supabase, filePath);
      
      if (url) {
        setState({
          url,
          loading: false,
          error: null,
          expiresAt: new Date(Date.now() + 3600000) // +1 hora
        });
      } else {
        setState({
          url: null,
          loading: false,
          error: 'No se pudo generar la URL del archivo',
          expiresAt: null
        });
      }
    } catch (error) {
      setState({
        url: null,
        loading: false,
        error: error.message,
        expiresAt: null
      });
    }
  }, [supabase, filePath]);

  useEffect(() => {
    generateUrl();
  }, [generateUrl]);

  // Auto-refresh cuando la URL esté cerca de expirar
  useEffect(() => {
    if (state.expiresAt && state.url) {
      const timeUntilExpiry = state.expiresAt.getTime() - Date.now();
      // Renovar 5 minutos antes de que expire
      const refreshTime = Math.max(0, timeUntilExpiry - 300000);
      
      const timeout = setTimeout(() => {
        generateUrl();
      }, refreshTime);

      return () => clearTimeout(timeout);
    }
  }, [state.expiresAt, state.url, generateUrl]);

  return {
    ...state,
    refresh: generateUrl
  };
};

/**
 * Componente React para mostrar un archivo con URL segura
 */
export const SecureFileLink = ({ 
  supabase, 
  filePath, 
  fileName, 
  children,
  className = '',
  onError = () => {},
  onSuccess = () => {},
  downloadable = false
}) => {
  const { url, loading, error, refresh } = useSecureFileUrl(supabase, filePath);

  React.useEffect(() => {
    if (error) onError(error);
    if (url) onSuccess(url);
  }, [error, url, onError, onSuccess]);

  if (loading) {
    return (
      <span className={`${className} flex items-center gap-2`}>
        <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        Generando enlace seguro...
      </span>
    );
  }

  if (error) {
    return (
      <span className={`${className} text-red-500 flex items-center gap-2`}>
        ❌ Error: {error}
        <button 
          onClick={refresh}
          className="ml-2 text-blue-500 underline hover:text-blue-700 transition-colors"
        >
          Reintentar
        </button>
      </span>
    );
  }

  if (!url) {
    return (
      <span className={`${className} text-gray-500`}>
        ❌ Archivo no disponible
      </span>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${className} text-blue-600 hover:text-blue-800 transition-colors`}
      download={downloadable ? fileName : undefined}
    >
      {children || fileName || '📄 Ver archivo'}
    </a>
  );
};

/**
 * Hook para manejar múltiples archivos de un claim
 * @param {Object} supabase - Cliente de Supabase
 * @param {Object} documents - Objeto con documentos del claim
 * @param {string} submissionId - ID del submission
 * @returns {Object} Estado con URLs, loading, error
 */
export const useClaimDocuments = (supabase, documents, submissionId) => {
  const [state, setState] = useState({
    documentUrls: {},
    loading: true,
    error: null,
    totalFiles: 0,
    processedFiles: 0
  });

  const generateUrls = useCallback(async () => {
    if (!documents || !submissionId) {
      setState({
        documentUrls: {},
        loading: false,
        error: null,
        totalFiles: 0,
        processedFiles: 0
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const documentUrls = {};
      let totalFiles = 0;
      let processedFiles = 0;

      // Contar total de archivos
      for (const docType in documents) {
        if (Array.isArray(documents[docType])) {
          totalFiles += documents[docType].length;
        }
      }

      setState(prev => ({ ...prev, totalFiles }));

      // Procesar cada tipo de documento
      for (const docType in documents) {
        if (!Array.isArray(documents[docType]) || documents[docType].length === 0) {
          continue;
        }

        documentUrls[docType] = [];

        // Para cada documento del tipo, obtener su URL segura
        for (const doc of documents[docType]) {
          try {
            let filePath;
            
            // Si ya tenemos una URL de Supabase Storage, extraer el path
            if (doc.url && doc.url.includes('/storage/v1/object/public/claims/')) {
              const urlParts = doc.url.split('/storage/v1/object/public/claims/');
              filePath = urlParts[1];
            } 
            // Si es un archivo local con path construido
            else if (doc.path) {
              filePath = `${submissionId}/${docType}/${doc.path}`;
            }
            // Construir path basado en el nombre del archivo
            else if (doc.name) {
              filePath = `${submissionId}/${docType}/${doc.name}`;
            }

            if (filePath) {
              const secureUrl = await generateSecureFileUrl(supabase, filePath);
              
              documentUrls[docType].push({
                name: doc.name,
                type: doc.type,
                size: doc.size,
                originalUrl: doc.url,
                secureUrl: secureUrl,
                filePath: filePath,
                success: secureUrl !== null
              });
            } else {
              // Si no podemos determinar el path, mantener el documento sin URL segura
              documentUrls[docType].push({
                name: doc.name,
                type: doc.type,
                size: doc.size,
                originalUrl: doc.url,
                secureUrl: null,
                filePath: null,
                success: false
              });
            }
          } catch (docError) {
            console.error(`Error procesando documento ${doc.name}:`, docError);
            documentUrls[docType].push({
              name: doc.name,
              type: doc.type,
              size: doc.size,
              originalUrl: doc.url,
              secureUrl: null,
              filePath: null,
              success: false,
              error: docError.message
            });
          }

          processedFiles++;
          setState(prev => ({ ...prev, processedFiles }));
        }
      }

      setState({
        documentUrls,
        loading: false,
        error: null,
        totalFiles,
        processedFiles
      });

    } catch (error) {
      console.error('Error generando URLs de documentos:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  }, [supabase, documents, submissionId]);

  useEffect(() => {
    generateUrls();
  }, [generateUrls]);

  return {
    ...state,
    refresh: generateUrls
  };
};

/**
 * Tipos de archivos específicos para el claim
 */
export const CLAIM_FILE_TYPES = {
  SOLICITUD: 'solicitud-programacion-axa',
  INFORME: 'informe-medico',
  BITACORA: 'bitacora-medico',
  INTERPRETACION: 'interpretacion-estudios-terapia',
  AVISO: 'aviso-accidente-enfermedad',
  FORMATO_REEMBOLSO: 'formato-reembolso',
  FORMATO_BANCARIO: 'formato-unico-bancario',
  ESTADO_CUENTA: 'estado-cuenta',
  FACTURAS: 'facturas',
  RECETAS: 'recetas'
};

/**
 * Genera las rutas de archivos para un claim específico
 * @param {string} claimId - ID del claim
 * @param {string} fileName - Nombre del archivo
 * @returns {Object} Objeto con las rutas de los diferentes tipos de archivos
 */
export const getClaimFilePaths = (claimId, fileName = '') => {
  return {
    solicitud: `${claimId}/${CLAIM_FILE_TYPES.SOLICITUD}/${fileName}`,
    informe: `${claimId}/${CLAIM_FILE_TYPES.INFORME}/${fileName}`,
    bitacora: `${claimId}/${CLAIM_FILE_TYPES.BITACORA}/${fileName}`,
    interpretacion: `${claimId}/${CLAIM_FILE_TYPES.INTERPRETACION}/${fileName}`,
    aviso: `${claimId}/${CLAIM_FILE_TYPES.AVISO}/${fileName}`,
    formatoReembolso: `${claimId}/${CLAIM_FILE_TYPES.FORMATO_REEMBOLSO}/${fileName}`,
    formatoBancario: `${claimId}/${CLAIM_FILE_TYPES.FORMATO_BANCARIO}/${fileName}`,
    estadoCuenta: `${claimId}/${CLAIM_FILE_TYPES.ESTADO_CUENTA}/${fileName}`
  };
};

/**
 * Convierte URLs públicas existentes a URLs seguras
 * @param {Object} supabase - Cliente de Supabase
 * @param {string} publicUrl - URL pública de Supabase Storage
 * @returns {Promise<string|null>} URL segura o null si hay error
 */
export const convertPublicUrlToSecure = async (supabase, publicUrl) => {
  try {
    // Extraer el path del archivo de la URL pública
    const match = publicUrl.match(/\/storage\/v1\/object\/public\/claims\/(.+)$/);
    if (!match) {
      console.error('URL pública no válida:', publicUrl);
      return null;
    }

    const filePath = match[1];
    return await generateSecureFileUrl(supabase, filePath);
  } catch (error) {
    console.error('Error convirtiendo URL pública a segura:', error);
    return null;
  }
};