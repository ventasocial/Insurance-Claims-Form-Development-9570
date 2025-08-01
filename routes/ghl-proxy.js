import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Inicializar cliente Supabase (usar las mismas credenciales del frontend)
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://zshawnoiwrqznqocxqrr.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

/**
 * Genera una URL temporal firmada para un archivo en Supabase Storage
 * Función equivalente a la del frontend pero para Node.js
 */
const generateSecureFileUrl = async (filePath, expiresIn = 3600) => {
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
 * Genera las rutas de archivos para un claim específico
 * Función equivalente a la del frontend
 */
const getClaimFilePaths = (claimId, fileName = '7._Estudios_de_Laboratorio.pdf') => {
  return {
    solicitud: `${claimId}/solicitud-programacion-axa/${fileName}`,
    informe: `${claimId}/informe-medico/${fileName}`,
    bitacora: `${claimId}/bitacora-medico/${fileName}`,
    interpretacion: `${claimId}/interpretacion-estudios-terapia/${fileName}`,
    aviso: `${claimId}/aviso-accidente-enfermedad/${fileName}`,
    formatoReembolso: `${claimId}/formato-reembolso/${fileName}`,
    formatoBancario: `${claimId}/formato-unico-bancario/${fileName}`,
    estadoCuenta: `${claimId}/estado-cuenta/${fileName}`
  };
};

/**
 * Endpoint principal para GoHighLevel - Redirige directamente al archivo
 * GHL puede usar estas URLs como si fueran permanentes
 */
router.get('/file/:claimId/:fileType/:fileName', async (req, res) => {
  try {
    const { claimId, fileType, fileName } = req.params;
    
    // Construir ruta del archivo usando la misma lógica existente
    const filePath = `${claimId}/${fileType}/${fileName}`;
    
    console.log(`GHL solicitando archivo: ${filePath}`);
    
    // Usar la función implementada para generar URL temporal
    const signedUrl = await generateSecureFileUrl(filePath, 3600);
    
    if (!signedUrl) {
      console.log(`Archivo no encontrado: ${filePath}`);
      return res.status(404).json({ 
        error: 'Archivo no encontrado',
        claimId,
        fileType,
        fileName,
        filePath 
      });
    }
    
    // Log para debugging
    console.log(`✅ GHL accediendo a archivo: ${filePath} -> URL generada`);
    
    // Redirigir directamente - GHL seguirá la redirección automáticamente
    res.redirect(302, signedUrl);
    
  } catch (error) {
    console.error('❌ Error en GHL proxy:', error);
    res.status(500).json({ 
      error: 'Error del servidor',
      message: error.message 
    });
  }
});

/**
 * Endpoint para listar todos los archivos de un claim (útil para GHL)
 */
router.get('/claim/:claimId/files', async (req, res) => {
  try {
    const { claimId } = req.params;
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    
    console.log(`📋 GHL solicitando lista de archivos para claim: ${claimId}`);
    
    // Usar la función existente para obtener rutas de archivos
    const filePaths = getClaimFilePaths(claimId);
    
    // Convertir a formato que GHL puede usar
    const files = [];
    
    for (const [type, path] of Object.entries(filePaths)) {
      // Extraer fileType y fileName de la ruta
      const pathParts = path.split('/');
      const fileType = pathParts[1]; // ej: "solicitud-programacion-axa"
      const fileName = pathParts[2] || '7._Estudios_de_Laboratorio.pdf'; // nombre por defecto
      
      files.push({
        id: `${claimId}-${type}`,
        name: getFileDisplayName(type),
        type: type,
        fileType: fileType,
        fileName: fileName,
        // URL permanente que GHL puede guardar y usar siempre
        url: `${baseUrl}/api/ghl/file/${claimId}/${fileType}/${fileName}`,
        description: `Archivo ${getFileDisplayName(type)} para claim ${claimId}`
      });
    }
    
    console.log(`✅ Enviando ${files.length} archivos a GHL para claim ${claimId}`);
    
    res.json({
      claimId,
      totalFiles: files.length,
      files,
      lastUpdated: new Date().toISOString(),
      baseUrl: `${baseUrl}/api/ghl`,
      note: "URLs son permanentes - generan enlaces frescos automáticamente"
    });
    
  } catch (error) {
    console.error('❌ Error listando archivos para GHL:', error);
    res.status(500).json({ 
      error: 'Error del servidor',
      claimId: req.params.claimId,
      message: error.message 
    });
  }
});

/**
 * Endpoint de información (opcional - para debugging)
 */
router.get('/info/:claimId/:fileType/:fileName', async (req, res) => {
  try {
    const { claimId, fileType, fileName } = req.params;
    const filePath = `${claimId}/${fileType}/${fileName}`;
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    
    console.log(`🔍 GHL verificando archivo: ${filePath}`);
    
    // Verificar si el archivo existe generando una URL temporal
    const signedUrl = await generateSecureFileUrl(filePath, 60); // Solo 1 minuto para verificar
    
    if (!signedUrl) {
      return res.status(404).json({
        exists: false,
        claimId,
        fileType,
        fileName,
        filePath,
        message: 'Archivo no encontrado en el bucket de storage'
      });
    }
    
    res.json({
      exists: true,
      claimId,
      fileType, 
      fileName,
      filePath,
      permanentUrl: `${baseUrl}/api/ghl/file/${claimId}/${fileType}/${fileName}`,
      infoUrl: `${baseUrl}/api/ghl/info/${claimId}/${fileType}/${fileName}`,
      note: "URL permanente disponible para GoHighLevel"
    });
    
  } catch (error) {
    console.error('❌ Error verificando archivo:', error);
    res.status(500).json({ 
      error: 'Error del servidor',
      message: error.message 
    });
  }
});

/**
 * Endpoint de salud del servicio GHL
 */
router.get('/health', (req, res) => {
  res.json({
    service: 'GoHighLevel Proxy',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    supabaseConnected: !!supabase,
    endpoints: {
      file: '/api/ghl/file/:claimId/:fileType/:fileName',
      filesList: '/api/ghl/claim/:claimId/files',
      info: '/api/ghl/info/:claimId/:fileType/:fileName',
      health: '/api/ghl/health'
    }
  });
});

// Función helper para nombres legibles
function getFileDisplayName(type) {
  const displayNames = {
    solicitud: 'Solicitud Programación AXA',
    informe: 'Informe Médico - Estudios de Laboratorio', 
    bitacora: 'Bitácora Médico - Estudios de Laboratorio',
    interpretacion: 'Interpretación Estudios Terapia',
    aviso: 'Aviso de Accidente o Enfermedad',
    formatoReembolso: 'Formato de Reembolso',
    formatoBancario: 'Formato Único Bancario',
    estadoCuenta: 'Estado de Cuenta Bancaria'
  };
  
  return displayNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

export default router;