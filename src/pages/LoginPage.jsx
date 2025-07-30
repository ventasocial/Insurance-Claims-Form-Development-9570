import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import supabase from '../lib/supabase';

const { FiUser, FiLock, FiAlertCircle, FiArrowRight, FiUserPlus, FiCheckCircle } = FiIcons;

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isAdminCreating, setIsAdminCreating] = useState(false);

  // Comprobar si hay un mensaje en la URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const message = params.get('message');
    if (message === 'admin_created') {
      setSuccess('Usuario administrador creado correctamente. Ahora puedes iniciar sesión.');
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;
      
      // Verificar si el usuario es administrador
      const { data: userData, error: userError } = await supabase
        .from('usuarios_admin_r2x4')
        .select('*')
        .eq('email', formData.email)
        .single();
      
      if (userError) throw userError;
      
      if (userData && userData.rol === 'Admin') {
        // Usuario es administrador, redirigir al dashboard
        navigate('/admin');
      } else {
        // No es administrador
        throw new Error('No tienes permisos para acceder a esta área');
      }
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const createAdminUser = async () => {
    setIsAdminCreating(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Crear el usuario en la autenticación de Supabase
      const { data, error } = await supabase.auth.signUp({
        email: 'jorge@venta.social',
        password: '20Febrero',
        options: {
          data: {
            full_name: 'Jorge Alberto García Martínez',
            role: 'Admin'
          }
        }
      });

      if (error) throw error;

      // 2. Verificar si el usuario ya existe en la tabla de administradores
      const { data: existingUser } = await supabase
        .from('usuarios_admin_r2x4')
        .select('*')
        .eq('email', 'jorge@venta.social')
        .single();

      // 3. Si no existe, insertar en la tabla de administradores
      if (!existingUser) {
        const { error: insertError } = await supabase
          .from('usuarios_admin_r2x4')
          .insert([
            {
              nombres: 'Jorge Alberto',
              apellido_paterno: 'García',
              apellido_materno: 'Martínez',
              email: 'jorge@venta.social',
              telefono: '+528122095020',
              rol: 'Admin'
            }
          ]);

        if (insertError) throw insertError;
      }

      // 4. Cerrar la sesión que se creó automáticamente
      await supabase.auth.signOut();

      setSuccess('Usuario administrador creado correctamente. Ahora puedes iniciar sesión.');
      
      // Recargar la página con un mensaje
      setTimeout(() => {
        window.location.href = window.location.pathname + '?message=admin_created';
      }, 2000);
    } catch (err) {
      console.error('Error al crear usuario administrador:', err);
      setError(err.message || 'Error al crear el usuario administrador');
    } finally {
      setIsAdminCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <img 
            src="https://storage.googleapis.com/msgsndr/HWRXLf7lstECUAG07eRw/media/685d77c05c72d29e532e823f.png"
            alt="Fortex"
            className="h-12 mx-auto mb-6"
          />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Iniciar Sesión
          </h2>
          <p className="text-gray-600">
            Accede al panel de administración
          </p>
        </div>

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

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 text-green-800 p-4 rounded-lg mb-6 flex items-center gap-3"
          >
            <SafeIcon icon={FiCheckCircle} className="text-xl flex-shrink-0" />
            <p>{success}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SafeIcon icon={FiUser} className="text-gray-400" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent transition-all duration-300"
                placeholder="tu@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SafeIcon icon={FiLock} className="text-gray-400" />
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#204499] focus:border-transparent transition-all duration-300"
                placeholder="••••••••"
              />
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.05 }}
            whileTap={{ scale: loading ? 1 : 0.95 }}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
              loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#204499] hover:bg-blue-700 text-white shadow-lg'
            }`}
          >
            {loading ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                Iniciar Sesión
                <SafeIcon icon={FiArrowRight} className="text-lg" />
              </>
            )}
          </motion.button>

          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-sm text-gray-600 hover:text-[#204499] transition-colors"
            >
              Volver a la página principal
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">¿No tienes un usuario administrador?</p>
          </div>
          
          <motion.button
            onClick={createAdminUser}
            disabled={isAdminCreating}
            whileHover={{ scale: isAdminCreating ? 1 : 1.05 }}
            whileTap={{ scale: isAdminCreating ? 1 : 0.95 }}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 border ${
              isAdminCreating
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-300'
                : 'bg-white hover:bg-gray-50 text-[#204499] border-[#204499]'
            }`}
          >
            {isAdminCreating ? (
              <div className="animate-spin w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full" />
            ) : (
              <>
                <SafeIcon icon={FiUserPlus} className="text-lg" />
                Crear Usuario Administrador
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;