import React,{useState,useEffect,useCallback} from 'react';
import {motion} from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import ContactForm from './ContactForm';

const {FiInfo,FiUsers,FiUser,FiPlus,FiTrash2,FiEdit2,FiMail,FiAlertCircle,FiCheck}=FiIcons;

// Códigos de país más comunes
const COUNTRY_CODES=[
  {code: '+52',country: 'México',flag: '🇲🇽'},
  {code: '+1',country: 'Estados Unidos/Canadá',flag: '🇺🇸'},
  {code: '+34',country: 'España',flag: '🇪🇸'},
  {code: '+33',country: 'Francia',flag: '🇫🇷'},
  {code: '+49',country: 'Alemania',flag: '🇩🇪'},
  {code: '+44',country: 'Reino Unido',flag: '🇬🇧'},
  {code: '+39',country: 'Italia',flag: '🇮🇹'},
  {code: '+55',country: 'Brasil',flag: '🇧🇷'},
  {code: '+54',country: 'Argentina',flag: '🇦🇷'},
  {code: '+57',country: 'Colombia',flag: '🇨🇴'},
  {code: '+58',country: 'Venezuela',flag: '🇻🇪'},
  {code: '+56',country: 'Chile',flag: '🇨🇱'},
  {code: '+51',country: 'Perú',flag: '🇵🇪'}
];

const PersonsInvolved=({formData,updateFormData})=> {
  // Determinar si mostrar el titular de cuenta bancaria
  const showTitularCuenta=formData.claimType==='reembolso';
  
  // Determinar si mostrar los formularios adicionales (solo si se eligió firma por email)
  const showAdditionalForms=formData.signatureDocumentOption==='email';
  
  // Estados para la gestión de personas
  const [personas,setPersonas]=useState([]);
  const [asignacionRoles,setAsignacionRoles]=useState({
    asegurado_titular: null,
    asegurado_afectado: null,
    titular_cuenta_bancaria: null
  });
  
  const [showPersonForm,setShowPersonForm]=useState(false);
  const [editingPersonId,setEditingPersonId]=useState(null);
  const [targetRole,setTargetRole]=useState(null); // Nuevo estado para saber a qué rol se está agregando
  const [personFormData,setPersonFormData]=useState({
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    email: '',
    telefono: ''
  });
  
  // Estados para validación
  const [validSections,setValidSections]=useState({
    contactInfo: false,
    asignaciones: false
  });
  
  // Flag para evitar bucles infinitos
  const [isUpdating,setIsUpdating]=useState(false);

  // Estados para el formulario de persona
  const [countryCode,setCountryCode]=useState('+52');
  const [phoneNumber,setPhoneNumber]=useState('');
  const [touchedFields,setTouchedFields]=useState({});

  // Función para validar datos de contacto
  const validateContactData=useCallback((data)=> {
    if (!data) return false;
    const {nombres,apellidoPaterno,apellidoMaterno,email}=data;
    
    // Validación de email
    const emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid=email && emailRegex.test(email);
    
    return !!(nombres && apellidoPaterno && apellidoMaterno && isEmailValid);
  },[]);

  // Validación especial para contactInfo (teléfono obligatorio)
  const validateContactInfo=useCallback((data)=> {
    if (!data) return false;
    const {nombres,apellidoPaterno,apellidoMaterno,email,telefono}=data;
    
    // Validación de email
    const emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid=email && emailRegex.test(email);
    
    // Validación de teléfono (WhatsApp) - OBLIGATORIO para contactInfo
    const phoneRegex=/^\+\d{1,4}\d{10}$/;
    const isPhoneValid=telefono && phoneRegex.test(telefono);
    
    return !!(nombres && apellidoPaterno && apellidoMaterno && isEmailValid && isPhoneValid);
  },[]);

  // Inicializar personas con la información de contacto
  useEffect(()=> {
    if (formData.contactInfo && Object.keys(formData.contactInfo).length > 0) {
      const personaContacto={
        id: 'contacto',
        nombres: formData.contactInfo.nombres || '',
        apellidoPaterno: formData.contactInfo.apellidoPaterno || '',
        apellidoMaterno: formData.contactInfo.apellidoMaterno || '',
        email: formData.contactInfo.email || '',
        telefono: formData.contactInfo.telefono || '',
        roles: ['contacto'],
        isContacto: true,
        fullName: `${formData.contactInfo.nombres || ''} ${formData.contactInfo.apellidoPaterno || ''} ${formData.contactInfo.apellidoMaterno || ''}`.trim()
      };

      setPersonas(prev=> {
        const existing=prev.find(p=> p.id==='contacto');
        if (!existing) {
          return [personaContacto];
        } else {
          return prev.map(p=> p.id==='contacto' ? personaContacto : p);
        }
      });
    }
  },[formData.contactInfo]);

  // Cargar asignaciones existentes desde formData
  useEffect(()=> {
    if (formData.personsInvolved && !isUpdating) {
      const nuevaAsignacion={...asignacionRoles};
      
      // Mapear datos existentes a personas y asignaciones
      if (formData.personsInvolved.titularAsegurado && Object.keys(formData.personsInvolved.titularAsegurado).length > 0) {
        const data=formData.personsInvolved.titularAsegurado;
        const personId=findOrCreatePerson(data);
        nuevaAsignacion.asegurado_titular=personId;
      }
      
      if (formData.personsInvolved.aseguradoAfectado && Object.keys(formData.personsInvolved.aseguradoAfectado).length > 0) {
        const data=formData.personsInvolved.aseguradoAfectado;
        const personId=findOrCreatePerson(data);
        nuevaAsignacion.asegurado_afectado=personId;
      }
      
      if (formData.personsInvolved.titularCuenta && Object.keys(formData.personsInvolved.titularCuenta).length > 0) {
        const data=formData.personsInvolved.titularCuenta;
        const personId=findOrCreatePerson(data);
        nuevaAsignacion.titular_cuenta_bancaria=personId;
      }
      
      setAsignacionRoles(nuevaAsignacion);
    }
  },[formData.personsInvolved]);

  // Función para encontrar o crear una persona
  const findOrCreatePerson=(data)=> {
    // Buscar si ya existe una persona con el mismo email
    const existingPerson=personas.find(p=> p.email===data.email);
    if (existingPerson) {
      return existingPerson.id;
    }
    
    // Crear nueva persona
    const newPersonId=`persona_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;
    const newPerson={
      id: newPersonId,
      nombres: data.nombres || '',
      apellidoPaterno: data.apellidoPaterno || '',
      apellidoMaterno: data.apellidoMaterno || '',
      email: data.email || '',
      telefono: data.telefono || '',
      roles: [],
      isContacto: false,
      fullName: `${data.nombres || ''} ${data.apellidoPaterno || ''} ${data.apellidoMaterno || ''}`.trim()
    };

    setPersonas(prev=> [...prev,newPerson]);
    return newPersonId;
  };

  // Validar todas las secciones cuando cambien los datos
  useEffect(()=> {
    if (isUpdating) return;

    const contactValid=validateContactInfo(formData.contactInfo);
    let asignacionesValid=true;

    if (showAdditionalForms) {
      // Verificar que todos los roles requeridos estén asignados
      const rolesRequeridos=['asegurado_titular','asegurado_afectado'];
      if (showTitularCuenta) {
        rolesRequeridos.push('titular_cuenta_bancaria');
      }

      asignacionesValid=rolesRequeridos.every(rol=> asignacionRoles[rol] !==null);

      // Verificar que no haya emails duplicados
      if (asignacionesValid) {
        const emailsUsados=new Set();
        const personasAsignadas=rolesRequeridos
          .map(rol=> asignacionRoles[rol])
          .filter(Boolean)
          .map(personId=> personas.find(p=> p.id===personId))
          .filter(Boolean);

        for (const persona of personasAsignadas) {
          if (emailsUsados.has(persona.email)) {
            asignacionesValid=false;
            break;
          }
          emailsUsados.add(persona.email);
        }
      }
    }

    setValidSections({
      contactInfo: contactValid,
      asignaciones: asignacionesValid
    });
  },[
    formData.contactInfo,
    asignacionRoles,
    personas,
    showAdditionalForms,
    showTitularCuenta,
    validateContactInfo,
    isUpdating
  ]);

  // Actualizar formData cuando cambien las asignaciones
  useEffect(()=> {
    if (isUpdating) return;

    setIsUpdating(true);
    const updatedPersonsInvolved={
      titularAsegurado: asignacionRoles.asegurado_titular 
        ? personas.find(p=> p.id===asignacionRoles.asegurado_titular) || {} 
        : {},
      aseguradoAfectado: asignacionRoles.asegurado_afectado 
        ? personas.find(p=> p.id===asignacionRoles.asegurado_afectado) || {} 
        : {},
      titularCuenta: asignacionRoles.titular_cuenta_bancaria 
        ? personas.find(p=> p.id===asignacionRoles.titular_cuenta_bancaria) || {} 
        : {}
    };

    updateFormData('personsInvolved',updatedPersonsInvolved);
    setTimeout(()=> setIsUpdating(false),100);
  },[asignacionRoles,personas]);

  // Manejar cambios en el formulario de contacto
  const handleContactFormChange=useCallback((type,data,isValid)=> {
    if (isUpdating) return;
    
    if (type==='contactInfo') {
      updateFormData('contactInfo',data);
    }
    
    setValidSections(prev=> ({
      ...prev,
      [type]: isValid
    }));
  },[updateFormData,isUpdating]);

  // Funciones para manejar personas
  const handleAddPersonForRole=(role)=> {
    setPersonFormData({
      nombres: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      email: '',
      telefono: ''
    });
    setCountryCode('+52');
    setPhoneNumber('');
    setTouchedFields({});
    setEditingPersonId(null);
    setTargetRole(role);
    setShowPersonForm(true);
  };

  const handleEditPerson=(personId)=> {
    const person=personas.find(p=> p.id===personId);
    if (person && !person.isContacto) {
      // Extraer código de país y número si ya existe un teléfono
      if (person.telefono) {
        const phone=person.telefono;
        const countryCodeMatch=COUNTRY_CODES.find(cc=> phone.startsWith(cc.code));
        if (countryCodeMatch) {
          setCountryCode(countryCodeMatch.code);
          setPhoneNumber(phone.substring(countryCodeMatch.code.length));
        } else {
          setPhoneNumber(phone);
        }
      } else {
        setCountryCode('+52');
        setPhoneNumber('');
      }

      setPersonFormData({
        nombres: person.nombres,
        apellidoPaterno: person.apellidoPaterno,
        apellidoMaterno: person.apellidoMaterno,
        email: person.email,
        telefono: person.telefono
      });
      setTouchedFields({});
      setEditingPersonId(personId);
      setTargetRole(null);
      setShowPersonForm(true);
    }
  };

  // Manejar cambios en el formulario de persona
  const handlePersonFormChange=(field,value)=> {
    setPersonFormData(prev=> ({
      ...prev,
      [field]: value
    }));
    
    // Marcar el campo como tocado
    setTouchedFields(prev=> ({
      ...prev,
      [field]: true
    }));
  };

  // Manejar cambios en el teléfono
  const handlePhoneChange=(newPhoneNumber)=> {
    setPhoneNumber(newPhoneNumber);
    // Solo números, máximo 10 dígitos
    const cleanNumber=newPhoneNumber.replace(/\D/g,'').substring(0,10);
    const fullPhone=cleanNumber ? `${countryCode}${cleanNumber}` : '';
    handlePersonFormChange('telefono',fullPhone);
  };

  // Manejar cambios en el código de país
  const handleCountryCodeChange=(newCountryCode)=> {
    setCountryCode(newCountryCode);
    // Actualizar el teléfono completo
    const cleanNumber=phoneNumber.replace(/\D/g,'').substring(0,10);
    const fullPhone=cleanNumber ? `${newCountryCode}${cleanNumber}` : '';
    handlePersonFormChange('telefono',fullPhone);
  };

  // Verificar si un campo tiene error
  const hasError=(field)=> {
    if (!touchedFields[field]) return false;
    
    switch (field) {
      case 'email':
        const emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !personFormData.email || !emailRegex.test(personFormData.email);
      case 'telefono':
        // WhatsApp es opcional para personas (no para contactInfo)
        if (!personFormData.telefono) return false;
        const phoneRegex=/^\+\d{1,4}\d{10}$/;
        return !phoneRegex.test(personFormData.telefono);
      default:
        return !personFormData[field];
    }
  };

  // Verificar si el email ya existe
  const emailExists=(email,excludePersonId=null)=> {
    // Verificar contra la persona de contacto
    if (formData.contactInfo?.email===email) {
      return true;
    }
    
    // Verificar contra otras personas
    return personas.some(p=> 
      p.email===email && 
      p.id !==excludePersonId && 
      p.id !=='contacto'
    );
  };

  const handleSavePerson=()=> {
    // Validar campos requeridos
    if (!personFormData.nombres || !personFormData.apellidoPaterno || !personFormData.apellidoMaterno || !personFormData.email) {
      alert('Por favor completa todos los campos requeridos (nombres, apellidos y email)');
      return;
    }

    // Validar email
    const emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(personFormData.email)) {
      alert('Por favor ingresa un correo electrónico válido');
      return;
    }

    // Verificar email único
    if (emailExists(personFormData.email,editingPersonId)) {
      alert('Ya existe una persona con este correo electrónico');
      return;
    }

    // Validar teléfono si está presente
    if (personFormData.telefono) {
      const phoneRegex=/^\+\d{1,4}\d{10}$/;
      if (!phoneRegex.test(personFormData.telefono)) {
        alert('El formato del teléfono no es válido. Debe incluir código de país y 10 dígitos');
        return;
      }
    }

    if (editingPersonId) {
      // Editar persona existente
      setPersonas(prev=> prev.map(p=> 
        p.id===editingPersonId 
          ? {
              ...p,
              ...personFormData,
              fullName: `${personFormData.nombres} ${personFormData.apellidoPaterno} ${personFormData.apellidoMaterno}`.trim()
            }
          : p
      ));
    } else {
      // Agregar nueva persona
      const newPersonId=`persona_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;
      const newPerson={
        id: newPersonId,
        ...personFormData,
        roles: [],
        isContacto: false,
        fullName: `${personFormData.nombres} ${personFormData.apellidoPaterno} ${personFormData.apellidoMaterno}`.trim()
      };

      setPersonas(prev=> [...prev,newPerson]);

      // Si se está agregando para un rol específico, asignar automáticamente
      if (targetRole) {
        setAsignacionRoles(prev=> ({
          ...prev,
          [targetRole]: newPersonId
        }));
      }
    }

    setShowPersonForm(false);
    setEditingPersonId(null);
    setTargetRole(null);
  };

  const handleDeletePerson=(personId)=> {
    const person=personas.find(p=> p.id===personId);
    if (person && !person.isContacto) {
      if (confirm(`¿Estás seguro de que quieres eliminar a ${person.fullName}?`)) {
        // Remover asignaciones
        setAsignacionRoles(prev=> {
          const newAsignacion={...prev};
          Object.keys(newAsignacion).forEach(rol=> {
            if (newAsignacion[rol]===personId) {
              newAsignacion[rol]=null;
            }
          });
          return newAsignacion;
        });

        // Remover persona
        setPersonas(prev=> prev.filter(p=> p.id !==personId));
      }
    }
  };

  const handleAsignarRol=(rol,personId)=> {
    setAsignacionRoles(prev=> ({
      ...prev,
      [rol]: personId
    }));
  };

  const getRolLabel=(rol)=> {
    const labels={
      asegurado_titular: 'Asegurado Titular',
      asegurado_afectado: 'Asegurado Afectado',
      titular_cuenta_bancaria: 'Titular de Cuenta Bancaria'
    };
    return labels[rol] || rol;
  };

  const getRolDescription=(rol)=> {
    const descriptions={
      asegurado_titular: 'Titular de la póliza de seguro',
      asegurado_afectado: 'Persona que requiere la atención médica',
      titular_cuenta_bancaria: 'Persona titular de la cuenta donde se depositará el reembolso'
    };
    return descriptions[rol] || '';
  };

  const getRolesRequeridos=()=> {
    const roles=['asegurado_titular','asegurado_afectado'];
    if (showTitularCuenta) {
      roles.push('titular_cuenta_bancaria');
    }
    return roles;
  };

  // Calcular progreso
  const rolesRequeridos=getRolesRequeridos();
  const rolesAsignados=rolesRequeridos.filter(rol=> asignacionRoles[rol] !==null).length;
  const progress=rolesRequeridos.length > 0 ? (rolesAsignados / rolesRequeridos.length) * 100 : 100;

  return (
    <motion.div
      initial={{opacity: 0,y: 20}}
      animate={{opacity: 1,y: 0}}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Personas que Firmarán los Documentos
        </h2>
        <p className="text-gray-600">
          Identifica quién firmará cada documento requerido para tu reclamo
        </p>
      </div>

      {/* Información sobre firma digital */}
      {showAdditionalForms && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <SafeIcon icon={FiInfo} className="text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Firma Digital Seleccionada</h3>
              <p className="text-blue-800 text-sm mb-3">
                Como has elegido recibir los documentos por email para firma digital, necesitamos identificar las personas que firmarán cada documento.
              </p>
              <ul className="text-blue-700 text-xs space-y-1">
                <li>• Los documentos se enviarán automáticamente a los correos proporcionados</li>
                <li>• Cada persona recibirá solo los documentos que debe firmar</li>
                <li>• Una misma persona puede tener múltiples roles</li>
                <li>• Cada persona debe tener un email único</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Progress bar - Solo mostrar si hay formularios adicionales */}
      {showAdditionalForms && (
        <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progreso de asignaciones:</span>
            <span className="text-sm font-medium text-gray-700">
              {rolesAsignados} de {rolesRequeridos.length} roles asignados
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{width: `${Math.min(progress,100)}%`}} 
            />
          </div>
        </div>
      )}

      {/* Información de contacto */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-1">
        <div className="bg-white rounded-lg">
          <ContactForm
            title="Persona de Contacto"
            description="Persona que reporta el reclamo y recibirá las comunicaciones"
            initialData={formData.contactInfo || {}}
            onDataChange={(data,isValid)=> handleContactFormChange('contactInfo',data,isValid)}
          />
        </div>
      </div>

      {/* Formularios adicionales solo si se eligió firma por email */}
      {showAdditionalForms && (
        <>
          {/* Asignación de roles */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Asignación de Roles
            </h3>
            <p className="text-gray-600 text-sm">
              Selecciona qué persona corresponde a cada rol requerido para la firma de documentos.
            </p>

            <div className="grid gap-6">
              {getRolesRequeridos().map(rol=> (
                <div key={rol} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{getRolLabel(rol)}</h3>
                      <p className="text-sm text-gray-600">{getRolDescription(rol)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {asignacionRoles[rol] && (
                        <SafeIcon icon={FiCheck} className="text-green-600 text-xl" />
                      )}
                      <motion.button
                        whileHover={{scale: 1.05}}
                        whileTap={{scale: 0.95}}
                        onClick={()=> handleAddPersonForRole(rol)}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium transition-colors hover:bg-blue-700"
                      >
                        <SafeIcon icon={FiPlus} className="text-sm" />
                        Agregar Persona
                      </motion.button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {personas.length===0 ? (
                      <div className="text-center py-4 text-gray-500">
                        <p className="text-sm">No hay personas disponibles para asignar</p>
                        <p className="text-xs mt-1">Agrega personas para poder asignar roles</p>
                      </div>
                    ) : (
                      personas.map(persona=> (
                        <label 
                          key={persona.id} 
                          className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                        >
                          <input
                            type="radio"
                            name={rol}
                            value={persona.id}
                            checked={asignacionRoles[rol]===persona.id}
                            onChange={()=> handleAsignarRol(rol,persona.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {persona.fullName}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <SafeIcon icon={FiMail} className="text-xs" />
                              {persona.email}
                            </div>
                            {persona.isContacto && (
                              <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                Persona de contacto
                              </span>
                            )}
                          </div>
                          {!persona.isContacto && (
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileHover={{scale: 1.05}}
                                whileTap={{scale: 0.95}}
                                onClick={(e)=> {
                                  e.preventDefault();
                                  handleEditPerson(persona.id);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <SafeIcon icon={FiEdit2} className="text-sm" />
                              </motion.button>
                              <motion.button
                                whileHover={{scale: 1.05}}
                                whileTap={{scale: 0.95}}
                                onClick={(e)=> {
                                  e.preventDefault();
                                  handleDeletePerson(persona.id);
                                }}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <SafeIcon icon={FiTrash2} className="text-sm" />
                              </motion.button>
                            </div>
                          )}
                        </label>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen de asignaciones */}
          {rolesAsignados > 0 && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Resumen de Asignaciones</h3>
              <div className="space-y-3">
                {rolesRequeridos.map(rol=> {
                  const persona=personas.find(p=> p.id===asignacionRoles[rol]);
                  return (
                    <div key={rol} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                      <span className="text-gray-600 font-medium">{getRolLabel(rol)}:</span>
                      {persona ? (
                        <div className="text-right">
                          <div className="font-medium text-gray-900">{persona.fullName}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <SafeIcon icon={FiMail} className="text-xs" />
                            {persona.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No asignado</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Validación de emails únicos */}
          {(()=> {
            const emailsUsados=new Set();
            const emailsDuplicados=new Set();
            const personasAsignadas=rolesRequeridos
              .map(rol=> asignacionRoles[rol])
              .filter(Boolean)
              .map(personId=> personas.find(p=> p.id===personId))
              .filter(Boolean);

            personasAsignadas.forEach(persona=> {
              if (emailsUsados.has(persona.email)) {
                emailsDuplicados.add(persona.email);
              }
              emailsUsados.add(persona.email);
            });

            if (emailsDuplicados.size > 0) {
              return (
                <motion.div
                  initial={{opacity: 0,y: 10}}
                  animate={{opacity: 1,y: 0}}
                  className="bg-red-50 border border-red-200 rounded-lg p-4"
                >
                  <div className="flex items-center gap-2">
                    <SafeIcon icon={FiAlertCircle} className="text-red-600 text-lg" />
                    <p className="text-red-800 font-medium">
                      Error: Emails duplicados detectados
                    </p>
                  </div>
                  <p className="text-red-600 text-sm mt-1">
                    Cada persona debe tener un email único. Emails duplicados: {Array.from(emailsDuplicados).join(', ')}
                  </p>
                </motion.div>
              );
            }
            return null;
          })()}
        </>
      )}

      {/* Modal para agregar/editar persona */}
      {showPersonForm && (
        <motion.div
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{opacity: 0,scale: 0.9}}
            animate={{opacity: 1,scale: 1}}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingPersonId ? 'Editar Persona' : 'Agregar Nueva Persona'}
                {targetRole && ` - ${getRolLabel(targetRole)}`}
              </h3>
              <button
                onClick={()=> setShowPersonForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre(s) *
                </label>
                <input
                  type="text"
                  value={personFormData.nombres}
                  onChange={(e)=> handlePersonFormChange('nombres',e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    hasError('nombres') ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Nombre(s)"
                />
                {hasError('nombres') && (
                  <p className="text-xs text-red-500 mt-1">
                    Ingresa el nombre
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido Paterno *
                </label>
                <input
                  type="text"
                  value={personFormData.apellidoPaterno}
                  onChange={(e)=> handlePersonFormChange('apellidoPaterno',e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    hasError('apellidoPaterno') ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Apellido paterno"
                />
                {hasError('apellidoPaterno') && (
                  <p className="text-xs text-red-500 mt-1">
                    Ingresa el apellido paterno
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido Materno *
                </label>
                <input
                  type="text"
                  value={personFormData.apellidoMaterno}
                  onChange={(e)=> handlePersonFormChange('apellidoMaterno',e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    hasError('apellidoMaterno') ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Apellido materno"
                />
                {hasError('apellidoMaterno') && (
                  <p className="text-xs text-red-500 mt-1">
                    Ingresa el apellido materno
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  value={personFormData.email}
                  onChange={(e)=> handlePersonFormChange('email',e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    hasError('email') || (touchedFields.email && emailExists(personFormData.email,editingPersonId)) 
                      ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="correo@ejemplo.com"
                />
                {hasError('email') && (
                  <p className="text-xs text-red-500 mt-1">
                    Ingresa un correo electrónico válido
                  </p>
                )}
                {touchedFields.email && emailExists(personFormData.email,editingPersonId) && (
                  <p className="text-xs text-red-500 mt-1">
                    Este correo electrónico ya está en uso
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp (opcional)
                </label>
                <div className="flex">
                  <select
                    value={countryCode}
                    onChange={(e)=> handleCountryCodeChange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-l-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  >
                    {COUNTRY_CODES.map((country)=> (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e)=> handlePhoneChange(e.target.value)}
                    className={`flex-1 px-3 py-2 border rounded-r-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                      hasError('telefono') ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Número a 10 dígitos"
                    maxLength={10}
                  />
                </div>
                {hasError('telefono') && (
                  <p className="text-xs text-red-500 mt-1">
                    Ingresa un número válido de 10 dígitos
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={()=> setShowPersonForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <motion.button
                whileHover={{scale: 1.05}}
                whileTap={{scale: 0.95}}
                onClick={handleSavePerson}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                {editingPersonId ? 'Actualizar' : 'Agregar'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PersonsInvolved;