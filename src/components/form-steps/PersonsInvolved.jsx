import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import ContactForm from './ContactForm';

const { FiInfo, FiCopy, FiCheck, FiUsers, FiUser, FiPlus, FiTrash2, FiEdit2, FiMail, FiAlertCircle } = FiIcons;

const PersonsInvolved = ({ formData, updateFormData }) => {
  // Determinar si mostrar el titular de cuenta bancaria
  const showTitularCuenta = formData.claimType === 'reembolso';
  
  // Determinar si mostrar los formularios adicionales (solo si se eligió firma por email)
  const showAdditionalForms = formData.signatureDocumentOption === 'email';

  // Estados para la gestión de personas
  const [personas, setPersonas] = useState([]);
  const [asignacionRoles, setAsignacionRoles] = useState({
    asegurado_titular: null,
    asegurado_afectado: null,
    titular_cuenta_bancaria: null
  });
  
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [editingPersonId, setEditingPersonId] = useState(null);
  const [personFormData, setPersonFormData] = useState({
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    email: '',
    telefono: ''
  });

  // Estados para validación
  const [validSections, setValidSections] = useState({
    contactInfo: false,
    asignaciones: false
  });

  // Flag para evitar bucles infinitos
  const [isUpdating, setIsUpdating] = useState(false);

  // Función para validar datos de contacto
  const validateContactData = useCallback((data) => {
    if (!data) return false;
    const { nombres, apellidoPaterno, apellidoMaterno, email } = data;
    
    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = email && emailRegex.test(email);
    
    return !!(nombres && apellidoPaterno && apellidoMaterno && isEmailValid);
  }, []);

  // Validación especial para contactInfo (teléfono obligatorio)
  const validateContactInfo = useCallback((data) => {
    if (!data) return false;
    const { nombres, apellidoPaterno, apellidoMaterno, email, telefono } = data;
    
    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = email && emailRegex.test(email);
    
    // Validación de teléfono (WhatsApp) - OBLIGATORIO para contactInfo
    const phoneRegex = /^\+\d{1,4}\d{10}$/;
    const isPhoneValid = telefono && phoneRegex.test(telefono);
    
    return !!(nombres && apellidoPaterno && apellidoMaterno && isEmailValid && isPhoneValid);
  }, []);

  // Inicializar personas con la información de contacto
  useEffect(() => {
    if (formData.contactInfo && Object.keys(formData.contactInfo).length > 0) {
      const personaContacto = {
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

      setPersonas(prev => {
        const existing = prev.find(p => p.id === 'contacto');
        if (!existing) {
          return [personaContacto];
        } else {
          return prev.map(p => p.id === 'contacto' ? personaContacto : p);
        }
      });
    }
  }, [formData.contactInfo]);

  // Cargar asignaciones existentes desde formData
  useEffect(() => {
    if (formData.personsInvolved && !isUpdating) {
      const nuevaAsignacion = { ...asignacionRoles };
      
      // Mapear datos existentes a personas y asignaciones
      if (formData.personsInvolved.titularAsegurado && Object.keys(formData.personsInvolved.titularAsegurado).length > 0) {
        const data = formData.personsInvolved.titularAsegurado;
        const personId = findOrCreatePerson(data);
        nuevaAsignacion.asegurado_titular = personId;
      }
      
      if (formData.personsInvolved.aseguradoAfectado && Object.keys(formData.personsInvolved.aseguradoAfectado).length > 0) {
        const data = formData.personsInvolved.aseguradoAfectado;
        const personId = findOrCreatePerson(data);
        nuevaAsignacion.asegurado_afectado = personId;
      }
      
      if (formData.personsInvolved.titularCuenta && Object.keys(formData.personsInvolved.titularCuenta).length > 0) {
        const data = formData.personsInvolved.titularCuenta;
        const personId = findOrCreatePerson(data);
        nuevaAsignacion.titular_cuenta_bancaria = personId;
      }
      
      setAsignacionRoles(nuevaAsignacion);
    }
  }, [formData.personsInvolved]);

  // Función para encontrar o crear una persona
  const findOrCreatePerson = (data) => {
    // Buscar si ya existe una persona con el mismo email
    const existingPerson = personas.find(p => p.email === data.email);
    
    if (existingPerson) {
      return existingPerson.id;
    }
    
    // Crear nueva persona
    const newPersonId = `persona_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newPerson = {
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
    
    setPersonas(prev => [...prev, newPerson]);
    return newPersonId;
  };

  // Validar todas las secciones cuando cambien los datos
  useEffect(() => {
    if (isUpdating) return;

    const contactValid = validateContactInfo(formData.contactInfo);
    
    let asignacionesValid = true;
    if (showAdditionalForms) {
      // Verificar que todos los roles requeridos estén asignados
      const rolesRequeridos = ['asegurado_titular', 'asegurado_afectado'];
      if (showTitularCuenta) {
        rolesRequeridos.push('titular_cuenta_bancaria');
      }
      
      asignacionesValid = rolesRequeridos.every(rol => asignacionRoles[rol] !== null);
      
      // Verificar que no haya emails duplicados
      if (asignacionesValid) {
        const emailsUsados = new Set();
        const personasAsignadas = rolesRequeridos
          .map(rol => asignacionRoles[rol])
          .filter(Boolean)
          .map(personId => personas.find(p => p.id === personId))
          .filter(Boolean);
        
        for (const persona of personasAsignadas) {
          if (emailsUsados.has(persona.email)) {
            asignacionesValid = false;
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
  }, [
    formData.contactInfo,
    asignacionRoles,
    personas,
    showAdditionalForms,
    showTitularCuenta,
    validateContactInfo,
    isUpdating
  ]);

  // Actualizar formData cuando cambien las asignaciones
  useEffect(() => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    
    const updatedPersonsInvolved = {
      titularAsegurado: asignacionRoles.asegurado_titular ? 
        personas.find(p => p.id === asignacionRoles.asegurado_titular) || {} : {},
      aseguradoAfectado: asignacionRoles.asegurado_afectado ? 
        personas.find(p => p.id === asignacionRoles.asegurado_afectado) || {} : {},
      titularCuenta: asignacionRoles.titular_cuenta_bancaria ? 
        personas.find(p => p.id === asignacionRoles.titular_cuenta_bancaria) || {} : {}
    };
    
    updateFormData('personsInvolved', updatedPersonsInvolved);
    
    setTimeout(() => setIsUpdating(false), 100);
  }, [asignacionRoles, personas]);

  // Manejar cambios en el formulario de contacto
  const handleContactFormChange = useCallback((type, data, isValid) => {
    if (isUpdating) return;
    
    if (type === 'contactInfo') {
      updateFormData('contactInfo', data);
    }
    
    setValidSections(prev => ({
      ...prev,
      [type]: isValid
    }));
  }, [updateFormData, isUpdating]);

  // Función para copiar datos del contacto a una nueva persona
  const handleCopyContactData = () => {
    const contactInfo = formData.contactInfo;
    if (!contactInfo || !validateContactData(contactInfo)) {
      alert('Primero debes completar correctamente la información de contacto');
      return;
    }

    setPersonFormData({
      nombres: contactInfo.nombres || '',
      apellidoPaterno: contactInfo.apellidoPaterno || '',
      apellidoMaterno: contactInfo.apellidoMaterno || '',
      email: contactInfo.email || '',
      telefono: contactInfo.telefono || ''
    });
    setEditingPersonId(null);
    setShowPersonForm(true);
  };

  // Funciones para manejar personas
  const handleAddPerson = () => {
    setPersonFormData({
      nombres: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      email: '',
      telefono: ''
    });
    setEditingPersonId(null);
    setShowPersonForm(true);
  };

  const handleEditPerson = (personId) => {
    const person = personas.find(p => p.id === personId);
    if (person && !person.isContacto) {
      setPersonFormData({
        nombres: person.nombres,
        apellidoPaterno: person.apellidoPaterno,
        apellidoMaterno: person.apellidoMaterno,
        email: person.email,
        telefono: person.telefono
      });
      setEditingPersonId(personId);
      setShowPersonForm(true);
    }
  };

  const handleSavePerson = () => {
    if (!validateContactData(personFormData)) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    // Verificar email único
    const emailExists = personas.some(p => 
      p.email === personFormData.email && p.id !== editingPersonId
    );
    
    if (emailExists) {
      alert('Ya existe una persona con este correo electrónico');
      return;
    }

    if (editingPersonId) {
      // Editar persona existente
      setPersonas(prev => prev.map(p => 
        p.id === editingPersonId 
          ? {
              ...p,
              ...personFormData,
              fullName: `${personFormData.nombres} ${personFormData.apellidoPaterno} ${personFormData.apellidoMaterno}`.trim()
            }
          : p
      ));
    } else {
      // Agregar nueva persona
      const newPersonId = `persona_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newPerson = {
        id: newPersonId,
        ...personFormData,
        roles: [],
        isContacto: false,
        fullName: `${personFormData.nombres} ${personFormData.apellidoPaterno} ${personFormData.apellidoMaterno}`.trim()
      };
      
      setPersonas(prev => [...prev, newPerson]);
    }

    setShowPersonForm(false);
    setEditingPersonId(null);
  };

  const handleDeletePerson = (personId) => {
    const person = personas.find(p => p.id === personId);
    if (person && !person.isContacto) {
      if (confirm(`¿Estás seguro de que quieres eliminar a ${person.fullName}?`)) {
        // Remover asignaciones
        setAsignacionRoles(prev => {
          const newAsignacion = { ...prev };
          Object.keys(newAsignacion).forEach(rol => {
            if (newAsignacion[rol] === personId) {
              newAsignacion[rol] = null;
            }
          });
          return newAsignacion;
        });
        
        // Remover persona
        setPersonas(prev => prev.filter(p => p.id !== personId));
      }
    }
  };

  const handleAsignarRol = (rol, personId) => {
    setAsignacionRoles(prev => ({
      ...prev,
      [rol]: personId
    }));
  };

  const getRolLabel = (rol) => {
    const labels = {
      asegurado_titular: 'Asegurado Titular',
      asegurado_afectado: 'Asegurado Afectado',
      titular_cuenta_bancaria: 'Titular de Cuenta Bancaria'
    };
    return labels[rol] || rol;
  };

  const getRolDescription = (rol) => {
    const descriptions = {
      asegurado_titular: 'Titular de la póliza de seguro',
      asegurado_afectado: 'Persona que requiere la atención médica',
      titular_cuenta_bancaria: 'Persona titular de la cuenta donde se depositará el reembolso'
    };
    return descriptions[rol] || '';
  };

  const getRolesRequeridos = () => {
    const roles = ['asegurado_titular', 'asegurado_afectado'];
    if (showTitularCuenta) {
      roles.push('titular_cuenta_bancaria');
    }
    return roles;
  };

  // Calcular progreso
  const rolesRequeridos = getRolesRequeridos();
  const rolesAsignados = rolesRequeridos.filter(rol => asignacionRoles[rol] !== null).length;
  const progress = rolesRequeridos.length > 0 ? (rolesAsignados / rolesRequeridos.length) * 100 : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
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
              style={{ width: `${Math.min(progress, 100)}%` }}
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
            onDataChange={(data, isValid) => handleContactFormChange('contactInfo', data, isValid)}
          />
        </div>
      </div>

      {/* Formularios adicionales solo si se eligió firma por email */}
      {showAdditionalForms && (
        <>
          {/* Lista de personas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <SafeIcon icon={FiUsers} className="text-blue-600" />
                Personas Involucradas
              </h3>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCopyContactData}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium transition-colors hover:bg-green-700"
                >
                  <SafeIcon icon={FiCopy} className="text-sm" />
                  Copiar Contacto
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddPerson}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium transition-colors hover:bg-blue-700"
                >
                  <SafeIcon icon={FiPlus} className="text-sm" />
                  Agregar Persona
                </motion.button>
              </div>
            </div>

            {/* Lista de personas existentes */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-3">
                {personas.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <SafeIcon icon={FiUsers} className="text-4xl mx-auto mb-4 text-gray-300" />
                    <p className="font-medium mb-2">No hay personas agregadas</p>
                    <p className="text-sm">Agrega personas para poder asignar roles</p>
                  </div>
                ) : (
                  personas.map(persona => (
                    <div key={persona.id} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <SafeIcon icon={FiUser} className="text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{persona.fullName}</div>
                            <div className="text-sm text-gray-500">{persona.email}</div>
                            {persona.isContacto && (
                              <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                Persona de contacto
                              </span>
                            )}
                          </div>
                        </div>
                        {!persona.isContacto && (
                          <div className="flex items-center gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleEditPerson(persona.id)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <SafeIcon icon={FiEdit2} className="text-sm" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDeletePerson(persona.id)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <SafeIcon icon={FiTrash2} className="text-sm" />
                            </motion.button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Asignación de roles */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Asignación de Roles
            </h3>
            <p className="text-gray-600 text-sm">
              Selecciona qué persona corresponde a cada rol requerido para la firma de documentos.
            </p>

            <div className="grid gap-6">
              {getRolesRequeridos().map(rol => (
                <div key={rol} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{getRolLabel(rol)}</h3>
                      <p className="text-sm text-gray-600">{getRolDescription(rol)}</p>
                    </div>
                    {asignacionRoles[rol] && (
                      <SafeIcon icon={FiCheck} className="text-green-600 text-xl" />
                    )}
                  </div>

                  <div className="space-y-3">
                    {personas.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        <p className="text-sm">No hay personas disponibles para asignar</p>
                        <p className="text-xs mt-1">Agrega personas para poder asignar roles</p>
                      </div>
                    ) : (
                      personas.map(persona => (
                        <label key={persona.id} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                          <input
                            type="radio"
                            name={rol}
                            value={persona.id}
                            checked={asignacionRoles[rol] === persona.id}
                            onChange={() => handleAsignarRol(rol, persona.id)}
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
                {rolesRequeridos.map(rol => {
                  const persona = personas.find(p => p.id === asignacionRoles[rol]);
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
          {(() => {
            const emailsUsados = new Set();
            const emailsDuplicados = new Set();
            const personasAsignadas = rolesRequeridos
              .map(rol => asignacionRoles[rol])
              .filter(Boolean)
              .map(personId => personas.find(p => p.id === personId))
              .filter(Boolean);
            
            personasAsignadas.forEach(persona => {
              if (emailsUsados.has(persona.email)) {
                emailsDuplicados.add(persona.email);
              }
              emailsUsados.add(persona.email);
            });

            if (emailsDuplicados.size > 0) {
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingPersonId ? 'Editar Persona' : 'Agregar Nueva Persona'}
              </h3>
              <button
                onClick={() => setShowPersonForm(false)}
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
                  onChange={(e) => setPersonFormData(prev => ({ ...prev, nombres: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre(s)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido Paterno *
                </label>
                <input
                  type="text"
                  value={personFormData.apellidoPaterno}
                  onChange={(e) => setPersonFormData(prev => ({ ...prev, apellidoPaterno: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Apellido paterno"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido Materno *
                </label>
                <input
                  type="text"
                  value={personFormData.apellidoMaterno}
                  onChange={(e) => setPersonFormData(prev => ({ ...prev, apellidoMaterno: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Apellido materno"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  value={personFormData.email}
                  onChange={(e) => setPersonFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp (opcional)
                </label>
                <input
                  type="tel"
                  value={personFormData.telefono}
                  onChange={(e) => setPersonFormData(prev => ({ ...prev, telefono: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+528122334455"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowPersonForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
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