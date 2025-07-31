import React,{useState,useEffect} from 'react';
import {motion} from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const {FiFileText,FiCheckCircle,FiDownload,FiExternalLink,FiAlertTriangle,FiInfo,FiMail}=FiIcons;

const DocumentChecklist=({formData,updateFormData})=> {
const [checkedItems,setCheckedItems]=useState(formData.documentChecklist || {});
const [signatureOption,setSignatureOption]=useState(formData.signatureDocumentOption || '');

useEffect(()=> {
// Pre-seleccionar todos los documentos requeridos si es primera vez
if (Object.keys(checkedItems).length===0) {
const requiredDocs=getRequiredDocuments().filter(doc=> doc.required);
const defaultChecked={};
requiredDocs.forEach(doc=> {
defaultChecked[doc.id]=false;
});
setCheckedItems(defaultChecked);
updateFormData('documentChecklist',defaultChecked);
}
},[formData.insuranceCompany,formData.claimType,formData.programmingService,formData.isCirugiaOrtopedica,formData.serviceTypes]);

const handleCheckChange=(itemId,checked)=> {
const newCheckedItems={...checkedItems,[itemId]: checked};
setCheckedItems(newCheckedItems);
updateFormData('documentChecklist',newCheckedItems);
};

const handleSignatureOptionChange=(option)=> {
setSignatureOption(option);
updateFormData('signatureDocumentOption',option);
};

const getRequiredDocuments=()=> {
const documents=[];
const {insuranceCompany,claimType,programmingService,isCirugiaOrtopedica,serviceTypes}=formData;

// Informe Médico - SIEMPRE requerido
documents.push({
id: 'informe-medico',
title: 'Informe Médico',
description: 'Informe médico detallado del diagnóstico y tratamiento',
required: true,
downloadUrl: insuranceCompany==='axa' 
? 'https://storage.googleapis.com/msgsndr/HWRXLf7lstECUAG07eRw/media/687fabaa8ffd9e2c5eb0920b.pdf' 
: 'https://storage.googleapis.com/msgsndr/HWRXLf7lstECUAG07eRw/media/685ad9983daa6bf9a84498d9.pdf',
category: 'medical'
});

// Documentos específicos por aseguradora y tipo de reclamo
if (insuranceCompany==='gnp') {
if (claimType==='reembolso') {
documents.push(
{
id: 'aviso-accidente-enfermedad',
title: 'Aviso de Accidente o Enfermedad GNP',
description: 'Formulario oficial que debe ser firmado por el asegurado',
required: true,
downloadUrl: 'https://storage.googleapis.com/msgsndr/HWRXLf7lstECUAG07eRw/media/685ad998b91260b431827d0f.pdf',
category: 'forms',
needsSignature: true
},
{
id: 'formato-reembolso',
title: 'Formato de Reembolso GNP',
description: 'Formulario para solicitar el reembolso',
required: true,
downloadUrl: 'https://storage.googleapis.com/msgsndr/HWRXLf7lstECUAG07eRw/media/685ad9983daa6bf9a84498d9.pdf',
category: 'forms',
needsSignature: true
},
{
id: 'formato-unico-bancario',
title: 'Formato Único de Información Bancaria GNP',
description: 'Información bancaria para el reembolso',
required: true,
downloadUrl: 'https://storage.googleapis.com/msgsndr/HWRXLf7lstECUAG07eRw/media/685ad9ea2b37dce8e382a9f9.pdf',
category: 'forms',
needsSignature: true
},
{
id: 'estado-cuenta',
title: 'Carátula del Estado de Cuenta Bancaria',
description: 'Para procesar el reembolso',
required: true,
category: 'financial'
}
);
} else if (claimType==='programacion') {
documents.push({
id: 'aviso-accidente-enfermedad-prog',
title: 'Aviso de Accidente o Enfermedad GNP',
description: 'Formulario oficial para programación',
required: true,
downloadUrl: 'https://storage.googleapis.com/msgsndr/HWRXLf7lstECUAG07eRw/media/685ad998b91260b431827d0f.pdf',
category: 'forms',
needsSignature: true
});

if (programmingService==='cirugia' && isCirugiaOrtopedica===true) {
documents.push({
id: 'formato-cirugia-traumatologia',
title: 'Formato de Cirugía de Traumatología,Ortopedia y Neurocirugía',
description: 'Formato específico para este tipo de cirugías',
required: true,
downloadUrl: 'https://storage.googleapis.com/msgsndr/HWRXLf7lstECUAG07eRw/media/685ad9d24bfc6127d1808e9b.pdf',
category: 'forms',
needsSignature: true
});
}
}
} else if (insuranceCompany==='axa') {
if (claimType==='programacion') {
documents.push({
id: 'solicitud-programacion-axa',
title: 'Solicitud de Programación AXA',
description: 'Formulario de AXA para programación',
required: true,
downloadUrl: 'https://storage.googleapis.com/msgsndr/HWRXLf7lstECUAG07eRw/media/687faba88ffd9e2c5eb0920a.pdf',
category: 'forms',
needsSignature: true
});
} else if (claimType==='reembolso') {
documents.push({
id: 'solicitud-reembolso-axa',
title: 'Solicitud de Reembolso AXA',
description: 'Formulario de AXA para reembolso',
required: true,
downloadUrl: 'https://storage.googleapis.com/msgsndr/HWRXLf7lstECUAG07eRw/media/687faba8023a389f1e952dd6.pdf',
category: 'forms',
needsSignature: true
});
}
}

// Documentos adicionales según servicios seleccionados (solo para reembolso)
if (claimType==='reembolso' && serviceTypes) {
serviceTypes.forEach(service=> {
switch (service) {
case 'hospital':
documents.push({
id: 'factura-hospital',
title: 'Facturas de Hospital',
description: 'Facturas de servicios hospitalarios',
required: true,
category: 'receipts'
});
break;
case 'estudios':
documents.push(
{
id: 'estudios-archivos',
title: 'Archivos de Estudios',
description: 'Resultados de laboratorio e imagenología',
required: true,
category: 'receipts'
},
{
id: 'facturas-estudios',
title: 'Facturas de Estudios',
description: 'Facturas de laboratorio e imagenología',
required: true,
category: 'receipts'
}
);
break;
case 'honorarios':
documents.push({
id: 'recibos-medicos',
title: 'Recibos y Facturas Médicas',
description: 'Honorarios de médicos y especialistas',
required: true,
category: 'receipts'
});
break;
case 'medicamentos':
documents.push(
{
id: 'facturas-medicamentos',
title: 'Facturas de Medicamentos',
description: 'Facturas de farmacias',
required: true,
category: 'receipts'
},
{
id: 'recetas-medicamentos',
title: 'Recetas de Medicamentos',
description: 'Recetas con dosis y período de administración',
required: true,
category: 'receipts'
}
);
break;
case 'terapia':
documents.push(
{
id: 'facturas-terapia',
title: 'Facturas de Terapia',
description: 'Facturas de terapia y rehabilitación',
required: true,
category: 'receipts'
},
{
id: 'recetas-terapia',
title: 'Recetas de Terapias',
description: 'Prescripciones médicas para terapias',
required: true,
category: 'receipts'
},
{
id: 'carnet-asistencia',
title: 'Carnet de Asistencia a Terapias',
description: 'Registro de asistencia a sesiones',
required: true,
category: 'receipts'
}
);
break;
}
});
}

// Documentos adicionales para programación
if (claimType==='programacion') {
switch (programmingService) {
case 'cirugia':
documents.push({
id: 'interpretacion-estudios-cirugia',
title: 'Interpretación de Estudios',
description: 'Interpretación de estudios que corroboren el diagnóstico',
required: true,
category: 'receipts'
});
break;
case 'medicamentos':
documents.push(
{
id: 'recetas-prog-medicamentos',
title: 'Recetas de Medicamentos',
description: 'Recetas para medicamentos a programar',
required: true,
category: 'receipts'
},
{
id: 'interpretacion-estudios-med',
title: 'Interpretación de Estudios (Opcional)',
description: 'Interpretación de estudios que corroboren el diagnóstico',
required: false,
category: 'receipts'
}
);
break;
case 'terapia':
documents.push(
{
id: 'bitacora-medico',
title: 'Bitácora del Médico',
description: 'Indicación de terapias,sesiones y tiempos',
required: true,
category: 'receipts'
},
{
id: 'interpretacion-estudios-terapia',
title: 'Interpretación de Estudios',
description: 'Interpretación de estudios que corroboren el diagnóstico',
required: true,
category: 'receipts'
}
);
break;
}
}

return documents;
};

const documents=getRequiredDocuments();
const requiredDocuments=documents.filter(doc=> doc.required);
const optionalDocuments=documents.filter(doc=> !doc.required);
const signatureDocuments=documents.filter(doc=> doc.needsSignature);

// Filtrar documentos que requieren firma si la opción de firma es por email
const filteredRequiredDocuments=signatureOption==='email' 
? requiredDocuments.filter(doc=> !doc.needsSignature) 
: requiredDocuments;

// Recalcular el conteo de documentos requeridos marcados
const checkedRequiredCount=filteredRequiredDocuments.filter(doc=> checkedItems[doc.id]).length;
const allRequiredChecked=filteredRequiredDocuments.length > 0 && checkedRequiredCount===filteredRequiredDocuments.length;

const getCategoryColor=(category)=> {
switch (category) {
case 'medical': return 'border-indigo-200 bg-indigo-50'; // Cambio de rojo a índigo
case 'forms': return 'border-blue-200 bg-blue-50';
case 'financial': return 'border-green-200 bg-green-50';
case 'receipts': return 'border-yellow-200 bg-yellow-50';
default: return 'border-gray-200 bg-gray-50';
}
};

const getCategoryIcon=(category)=> {
switch (category) {
case 'medical': return FiFileText;
case 'forms': return FiFileText;
case 'financial': return FiFileText;
case 'receipts': return FiFileText;
default: return FiFileText;
}
};

const DocumentItem=({document,isOptional=false})=> (
<motion.div
initial={{opacity: 0,y: 10}}
animate={{opacity: 1,y: 0}}
className={`border-2 rounded-lg p-4 transition-all duration-300 ${
checkedItems[document.id] 
? 'border-green-500 bg-green-50' 
: getCategoryColor(document.category)
}`}
>
<div className="flex items-start gap-3">
<div className="flex items-center">
<input
type="checkbox"
id={document.id}
checked={checkedItems[document.id] || false}
onChange={(e)=> handleCheckChange(document.id,e.target.checked)}
className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
required={document.required && (!document.needsSignature || signatureOption !=='email')}
/>
</div>
<div className="flex-1">
<div className="flex items-center gap-2 mb-1">
<SafeIcon 
icon={getCategoryIcon(document.category)} 
className={`text-lg ${
checkedItems[document.id] 
? 'text-green-600' 
: 'text-gray-500'
}`} 
/>
<h3 className={`font-semibold ${
checkedItems[document.id] 
? 'text-green-800' 
: 'text-gray-900'
}`}>
{document.title}
{document.required && (!document.needsSignature || signatureOption !=='email') && (
<span className="text-indigo-600 ml-1">*</span> // Cambio de rojo a índigo
)}
</h3>
{!document.required && (
<span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
Opcional
</span>
)}
{document.needsSignature && (
<span className="text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded-full">
Requiere firma
</span>
)}
</div>
<p className={`text-sm ${
checkedItems[document.id] 
? 'text-green-700' 
: 'text-gray-600'
} mb-2`}>
{document.description}
</p>
{document.downloadUrl && (
<motion.button
whileHover={{scale: 1.02}}
whileTap={{scale: 0.98}}
onClick={()=> window.open(document.downloadUrl,'_blank')}
className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
>
<SafeIcon icon={FiDownload} className="text-sm" />
Descargar formato
<SafeIcon icon={FiExternalLink} className="text-xs" />
</motion.button>
)}
</div>
</div>
</motion.div>
);

return (
<motion.div
initial={{opacity: 0,y: 20}}
animate={{opacity: 1,y: 0}}
className="space-y-6"
>
<div className="text-center mb-8">
<h2 className="text-3xl font-bold text-gray-900 mb-2">
Documentos Requeridos
</h2>
<p className="text-gray-600">
Antes de continuar,asegúrate de tener todos los documentos necesarios para tu reclamo
</p>
</div>

{/* Progress indicator */}
<div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
<div className="flex items-center gap-3">
<div className={`w-10 h-10 rounded-full flex items-center justify-center ${
allRequiredChecked 
? 'bg-green-500' 
: 'bg-indigo-500' // Cambio de gris a índigo para indicar "en progreso"
}`}>
<SafeIcon 
icon={allRequiredChecked ? FiCheckCircle : FiInfo} 
className={`text-lg ${
allRequiredChecked 
? 'text-white' 
: 'text-white'
}`} 
/>
</div>
<div>
<h3 className="font-semibold text-gray-900">
Progreso: {checkedRequiredCount} de {filteredRequiredDocuments.length} documentos requeridos
</h3>
<p className="text-sm text-gray-600">
{allRequiredChecked 
? '¡Perfecto! Tienes todos los documentos requeridos' 
: 'Marca cada documento que tengas listo para subir'
}
</p>
</div>
</div>
{filteredRequiredDocuments.length > 0 && (
<div className="mt-3">
<div className="w-full bg-gray-200 rounded-full h-2">
<div 
className="bg-green-500 h-2 rounded-full transition-all duration-300" 
style={{width: `${(checkedRequiredCount / filteredRequiredDocuments.length) * 100}%`}} 
/>
</div>
</div>
)}
</div>

{/* Important notice */}
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
<div className="flex items-start gap-3">
<SafeIcon icon={FiAlertTriangle} className="text-blue-600 text-lg flex-shrink-0 mt-0.5" />
<div>
<h3 className="font-semibold text-blue-900 mb-2">Importante:</h3>
<ul className="text-blue-800 text-sm space-y-1">
<li>• Los documentos con enlaces de descarga deben ser llenados y firmados antes de subirlos</li>
<li>• Asegúrate de que todos los documentos estén legibles y completos</li>
<li>• Los formatos aceptados son: PDF,JPG,JPEG,PNG</li>
<li>• Debes marcar todos los documentos requeridos para continuar</li>
</ul>
</div>
</div>
</div>

{/* Signature Documents Section */}
{signatureDocuments.length > 0 && (
<div className="space-y-4 mb-8">
<h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
<SafeIcon icon={FiFileText} className="text-blue-600" />
Documentos que Requieren Firma
</h3>

<div className="space-y-4 mb-6">
<p className="text-gray-700">
Algunos documentos requieren tu firma. Selecciona cómo deseas obtener y firmar estos documentos:
</p>

<div className="grid md:grid-cols-2 gap-4">
{/* Download Option */}
<motion.div
whileHover={{scale: 1.02}}
className={`border-2 rounded-lg p-6 cursor-pointer transition-all duration-300 ${
signatureOption==='download' 
? 'border-[#204499] bg-blue-50' 
: 'border-gray-200 hover:border-gray-300'
}`}
onClick={()=> handleSignatureOptionChange('download')}
>
<div className="flex items-start gap-4">
<div className="flex-shrink-0">
<input
type="radio"
name="signatureOption"
value="download"
checked={signatureOption==='download'}
onChange={()=> handleSignatureOptionChange('download')}
className="mt-1 h-4 w-4 text-[#204499] border-gray-300 focus:ring-[#204499]"
required={true}
/>
</div>
<div className="flex-1">
<div className="flex items-center gap-3 mb-2">
<SafeIcon icon={FiDownload} className="text-[#204499] text-xl" />
<h4 className="font-semibold text-gray-900">Descargar para Firma Física</h4>
</div>
<p className="text-gray-600 text-sm">
Descarga los documentos,imprímelos,fírmalos físicamente y súbelos junto con los demás documentos.
</p>
</div>
</div>
</motion.div>

{/* Email Option */}
<motion.div
whileHover={{scale: 1.02}}
className={`border-2 rounded-lg p-6 cursor-pointer transition-all duration-300 ${
signatureOption==='email' 
? 'border-[#204499] bg-blue-50' 
: 'border-gray-200 hover:border-gray-300'
}`}
onClick={()=> handleSignatureOptionChange('email')}
>
<div className="flex items-start gap-4">
<div className="flex-shrink-0">
<input
type="radio"
name="signatureOption"
value="email"
checked={signatureOption==='email'}
onChange={()=> handleSignatureOptionChange('email')}
className="mt-1 h-4 w-4 text-[#204499] border-gray-300 focus:ring-[#204499]"
required={true}
/>
</div>
<div className="flex-1">
<div className="flex items-center gap-3 mb-2">
<SafeIcon icon={FiMail} className="text-[#204499] text-xl" />
<h4 className="font-semibold text-gray-900">Envío por Email para Firma Digital</h4>
</div>
<p className="text-gray-600 text-sm">
Recibe los documentos por correo electrónico para firmarlos digitalmente y enviarlos de vuelta.
</p>
</div>
</div>
</motion.div>
</div>

{signatureOption==='download' && (
<motion.div
initial={{opacity: 0,height: 0}}
animate={{opacity: 1,height: 'auto'}}
className="bg-gray-50 rounded-lg p-4 border border-gray-200"
>
<h4 className="font-medium text-gray-900 mb-3">Documentos para descargar:</h4>
<div className="space-y-2">
{signatureDocuments.map((doc)=> (
<motion.button
key={doc.id}
whileHover={{scale: 1.02}}
whileTap={{scale: 0.98}}
onClick={()=> window.open(doc.downloadUrl,'_blank')}
className="w-full bg-[#204499] hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
>
<SafeIcon icon={FiDownload} className="text-sm" />
Descargar: {doc.title}
</motion.button>
))}
</div>
<p className="text-sm text-gray-500 mt-3">
Después de descargar,imprimir y firmar estos documentos,deberás subirlos en la sección "Subir Documentos".
</p>
</motion.div>
)}

{signatureOption==='email' && (
<motion.div
initial={{opacity: 0,height: 0}}
animate={{opacity: 1,height: 'auto'}}
className="bg-gray-50 rounded-lg p-4 border border-gray-200"
>
<div className="flex items-center gap-3 mb-2">
<SafeIcon icon={FiInfo} className="text-blue-600" />
<h4 className="font-medium text-gray-900">Información sobre firma digital</h4>
</div>
<p className="text-gray-600 text-sm mb-3">
Los documentos se enviarán automáticamente por correo electrónico a las personas correspondientes para su firma digital. No necesitarás subir estos documentos manualmente en la siguiente sección.
</p>
<p className="text-sm text-blue-600 font-medium">
Se utilizarán los correos electrónicos proporcionados en la sección "Personas Involucradas".
</p>
</motion.div>
)}
</div>
</div>
)}

{/* Required Documents */}
{filteredRequiredDocuments.length > 0 && (
<div className="space-y-4">
<h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
<SafeIcon icon={FiFileText} className="text-indigo-600" /> {/* Cambio de rojo a índigo */}
Documentos Requeridos
</h3>
<div className="grid gap-4">
{filteredRequiredDocuments.map((document)=> (
<DocumentItem key={document.id} document={document} />
))}
</div>
</div>
)}

{/* Optional Documents */}
{optionalDocuments.length > 0 && (
<div className="space-y-4">
<h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
<SafeIcon icon={FiFileText} className="text-gray-600" />
Documentos Opcionales
</h3>
<div className="grid gap-4">
{optionalDocuments.map((document)=> (
<DocumentItem key={document.id} document={document} isOptional />
))}
</div>
</div>
)}

{/* Ready indicator */}
{allRequiredChecked && signatureOption && (
<motion.div
initial={{opacity: 0,y: 10}}
animate={{opacity: 1,y: 0}}
className="bg-green-50 border border-green-200 rounded-lg p-4"
>
<div className="flex items-center gap-2">
<SafeIcon icon={FiCheckCircle} className="text-green-600 text-lg" />
<p className="text-green-800 font-medium">
¡Excelente! Has marcado todos los documentos requeridos y seleccionado cómo manejar los documentos que requieren firma. Puedes continuar con el siguiente paso.
</p>
</div>
</motion.div>
)}

{/* Missing requirements indicator */}
{!(allRequiredChecked && signatureOption) && (
<motion.div
initial={{opacity: 0,y: 10}}
animate={{opacity: 1,y: 0}}
className="bg-amber-50 border border-amber-200 rounded-lg p-4"
>
<div className="flex items-center gap-2">
<SafeIcon icon={FiAlertTriangle} className="text-amber-600 text-lg" />
<p className="text-amber-800 font-medium">
Para continuar,debes:
{!allRequiredChecked && (
<span className="block mt-1">• Marcar todos los documentos requeridos como disponibles</span>
)}
{!signatureOption && (
<span className="block mt-1">• Seleccionar cómo deseas manejar los documentos que requieren firma</span>
)}
</p>
</div>
</motion.div>
)}
</motion.div>
);
};

export default DocumentChecklist;