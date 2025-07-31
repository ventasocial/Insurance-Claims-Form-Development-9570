// Función para generar PDF del checklist de documentos
export const generateChecklistPDF = async (formData, documents) => {
  try {
    // Crear el contenido HTML del PDF
    const htmlContent = generateChecklistHTML(formData, documents);
    
    // Crear un blob con el contenido HTML
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Abrir en nueva ventana e imprimir automáticamente
    const printWindow = window.open(url, '_blank');
    
    printWindow.onload = () => {
      // Esperar a que se cargue completamente antes de imprimir
      setTimeout(() => {
        printWindow.print();
        
        // Cerrar la ventana después de imprimir
        setTimeout(() => {
          printWindow.close();
          URL.revokeObjectURL(url);
        }, 1000);
      }, 500);
    };
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

const generateChecklistHTML = (formData, documents) => {
  const currentDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Organizar documentos por categorías
  const categorizedDocs = {
    medical: documents.filter(doc => doc.category === 'medical'),
    forms: documents.filter(doc => doc.category === 'forms'),
    financial: documents.filter(doc => doc.category === 'financial'),
    receipts: documents.filter(doc => doc.category === 'receipts')
  };

  const getCategoryTitle = (category) => {
    switch (category) {
      case 'medical': return 'Documentos Médicos';
      case 'forms': return 'Formularios de la Aseguradora';
      case 'financial': return 'Documentos Financieros';
      case 'receipts': return 'Facturas y Recetas';
      default: return 'Otros Documentos';
    }
  };

  const getClaimTypeText = () => {
    switch (formData.claimType) {
      case 'reembolso': return 'Reembolso';
      case 'programacion': return 'Programación';
      default: return '';
    }
  };

  const getReimbursementTypeText = () => {
    switch (formData.reimbursementType) {
      case 'inicial': return 'Inicial';
      case 'complemento': return 'Complemento';
      default: return '';
    }
  };

  const getServiceTypesText = () => {
    if (!formData.serviceTypes || formData.serviceTypes.length === 0) return '';
    
    const serviceMap = {
      'hospital': 'Hospital',
      'estudios': 'Estudios de Laboratorio e Imagenología',
      'honorarios': 'Honorarios Médicos',
      'medicamentos': 'Medicamentos',
      'terapia': 'Terapia o Rehabilitación'
    };
    
    return formData.serviceTypes.map(type => serviceMap[type] || type).join(', ');
  };

  const getProgrammingServiceText = () => {
    switch (formData.programmingService) {
      case 'medicamentos': return 'Medicamentos';
      case 'terapia': return 'Terapia o Rehabilitación';
      case 'cirugia': return 'Cirugía';
      default: return '';
    }
  };

  const getSignatureOptionText = () => {
    switch (formData.signatureDocumentOption) {
      case 'download': return 'Descarga para Firma Física';
      case 'email': return 'Envío por Email para Firma Digital';
      default: return '';
    }
  };

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Checklist de Documentos - Fortex</title>
      <style>
        @page {
          size: A4;
          margin: 0.5in;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.2;
          color: #333;
          margin: 0;
          padding: 0;
          font-size: 11px;
        }
        
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #204499;
        }
        
        .logo-section {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .logo {
          width: 60px;
          height: auto;
        }
        
        .title-section {
          text-align: center;
          flex-grow: 1;
        }
        
        .title {
          font-size: 16px;
          font-weight: bold;
          color: #204499;
          margin: 0;
        }
        
        .subtitle {
          color: #666;
          font-size: 10px;
          margin: 2px 0 0 0;
        }
        
        .date-section {
          text-align: right;
          font-size: 9px;
          color: #666;
        }
        
        .info-section {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
          border-left: 3px solid #204499;
        }
        
        .info-title {
          font-size: 12px;
          font-weight: bold;
          color: #204499;
          margin: 0 0 8px 0;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          font-size: 9px;
        }
        
        .info-item {
          display: flex;
          justify-content: space-between;
        }
        
        .info-label {
          font-weight: bold;
          color: #204499;
        }
        
        .info-value {
          color: #333;
          text-align: right;
        }
        
        .documents-section {
          margin-bottom: 15px;
        }
        
        .section-title {
          font-size: 13px;
          font-weight: bold;
          color: #204499;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .category-title {
          font-size: 11px;
          font-weight: bold;
          color: #204499;
          margin: 8px 0 4px 0;
          padding-bottom: 2px;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .document-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
          margin-bottom: 8px;
        }
        
        .document-item {
          display: flex;
          align-items: flex-start;
          padding: 4px;
          background: #f8f9fa;
          border-radius: 3px;
          border-left: 2px solid #28a745;
          font-size: 9px;
          break-inside: avoid;
        }
        
        .checkbox {
          width: 12px;
          height: 12px;
          border: 1px solid #ddd;
          margin-right: 6px;
          margin-top: 1px;
          flex-shrink: 0;
          border-radius: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
        }
        
        .document-content {
          flex: 1;
          min-width: 0;
        }
        
        .document-title {
          font-weight: bold;
          color: #333;
          margin-bottom: 1px;
          line-height: 1.1;
        }
        
        .document-description {
          color: #666;
          font-size: 8px;
          line-height: 1.1;
        }
        
        .badges {
          display: flex;
          gap: 2px;
          margin-top: 2px;
          flex-wrap: wrap;
        }
        
        .badge {
          padding: 1px 4px;
          border-radius: 6px;
          font-size: 7px;
          font-weight: bold;
          white-space: nowrap;
        }
        
        .badge-required {
          background: #dc3545;
          color: white;
        }
        
        .badge-signature {
          background: #007bff;
          color: white;
        }
        
        .badge-optional {
          background: #6c757d;
          color: white;
        }
        
        .instructions {
          background: #e7f3ff;
          padding: 10px;
          border-radius: 4px;
          margin-top: 15px;
          border-left: 3px solid #007bff;
          font-size: 9px;
        }
        
        .instructions-title {
          color: #0056b3;
          font-weight: bold;
          margin-bottom: 5px;
          font-size: 10px;
        }
        
        .instructions ul {
          margin: 0;
          padding-left: 12px;
        }
        
        .instructions li {
          margin-bottom: 3px;
          color: #333;
          line-height: 1.2;
        }
        
        .footer {
          text-align: center;
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid #e0e0e0;
          color: #666;
          font-size: 8px;
        }
        
        .footer-title {
          font-weight: bold;
          color: #204499;
          margin-bottom: 3px;
        }
        
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .header {
            page-break-after: avoid;
          }
          
          .document-item {
            page-break-inside: avoid;
          }
          
          .info-section {
            page-break-inside: avoid;
          }
          
          .instructions {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-section">
          <svg class="logo" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="60" fill="#204499"/>
            <text x="100" y="35" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">FORTEX</text>
          </svg>
        </div>
        <div class="title-section">
          <div class="title">Checklist de Documentos para Reclamo</div>
          <div class="subtitle">Portal de Reclamos Fortex</div>
        </div>
        <div class="date-section">
          Generado el<br>${currentDate}
        </div>
      </div>
      
      <div class="info-section">
        <div class="info-title">Información del Reclamo</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Aseguradora:</span>
            <span class="info-value">${formData.insuranceCompany?.toUpperCase() || 'No especificada'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Tipo de Reclamo:</span>
            <span class="info-value">${getClaimTypeText()}</span>
          </div>
          ${formData.claimType === 'reembolso' ? `
            <div class="info-item">
              <span class="info-label">Tipo de Siniestro:</span>
              <span class="info-value">${getReimbursementTypeText()}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Servicios:</span>
              <span class="info-value">${getServiceTypesText()}</span>
            </div>
          ` : ''}
          ${formData.claimType === 'programacion' ? `
            <div class="info-item">
              <span class="info-label">Servicio a Programar:</span>
              <span class="info-value">${getProgrammingServiceText()}</span>
            </div>
          ` : ''}
          <div class="info-item">
            <span class="info-label">Firma de Documentos:</span>
            <span class="info-value">${getSignatureOptionText()}</span>
          </div>
        </div>
      </div>
      
      <div class="documents-section">
        <div class="section-title">📋 Documentos Requeridos</div>
        
        ${Object.entries(categorizedDocs).map(([category, docs]) => {
          if (docs.length === 0) return '';
          
          return `
            <div class="category-title">${getCategoryTitle(category)}</div>
            <div class="document-list">
              ${docs.map(doc => `
                <div class="document-item">
                  <div class="checkbox">☐</div>
                  <div class="document-content">
                    <div class="document-title">${doc.title}</div>
                    <div class="document-description">${doc.description}</div>
                    <div class="badges">
                      ${doc.required ? '<span class="badge badge-required">REQUERIDO</span>' : '<span class="badge badge-optional">OPCIONAL</span>'}
                      ${doc.needsSignature ? '<span class="badge badge-signature">FIRMA</span>' : ''}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `;
        }).join('')}
      </div>
      
      <div class="instructions">
        <div class="instructions-title">📝 Instrucciones Importantes</div>
        <ul>
          <li><strong>Marca cada documento</strong> cuando lo tengas listo y completo</li>
          <li><strong>Documentos con firma:</strong> ${formData.signatureDocumentOption === 'download' 
            ? 'Descarga, imprime, firma y escanea estos documentos antes de subirlos' 
            : 'Estos documentos se enviarán por email para firma digital'}</li>
          <li><strong>Formatos aceptados:</strong> PDF, JPG, JPEG, PNG</li>
          <li><strong>Calidad:</strong> Asegúrate de que todos los documentos sean legibles y estén completos</li>
          <li><strong>Regreso al portal:</strong> Una vez que tengas todos los documentos marcados, regresa al portal de Fortex para continuar</li>
        </ul>
      </div>
      
      <div class="footer">
        <div class="footer-title">Portal de Reclamos Fortex</div>
        <div>Para soporte: asistencia@fortex.mx | Tel: +52 81 8303 2600</div>
        <div>© 2024 Fortex. Todos los derechos reservados.</div>
      </div>
    </body>
    </html>
  `;
};