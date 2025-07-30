import supabase from './supabase';

/**
 * Generates a magic link for form resumption
 * 
 * @param {Object} formData The current form data to save
 * @returns {Promise<string>} The unique ID for the magic link
 */
export const generateMagicLink = async (formData) => {
  try {
    // Generate a unique ID for the form session
    const { data, error } = await supabase
      .from('form_sessions_r2x4')
      .insert({
        form_data: formData,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days expiry
      })
      .select('id');

    if (error) {
      console.error('Error creating magic link:', error);
      throw error;
    }

    return data[0].id;
  } catch (error) {
    console.error('Failed to generate magic link:', error);
    throw new Error('No se pudo generar el enlace de acceso');
  }
};

/**
 * Retrieves form data from a magic link ID
 * 
 * @param {string} id The unique ID for the magic link
 * @returns {Promise<Object>} The saved form data
 */
export const getFormDataFromMagicLink = async (id) => {
  try {
    const { data, error } = await supabase
      .from('form_sessions_r2x4')
      .select('form_data, expires_at')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error retrieving magic link data:', error);
      throw error;
    }

    // Check if the link has expired
    if (new Date(data.expires_at) < new Date()) {
      throw new Error('El enlace ha expirado');
    }

    return data.form_data;
  } catch (error) {
    console.error('Failed to retrieve form data from magic link:', error);
    throw new Error('No se pudo recuperar la información del formulario');
  }
};

/**
 * Updates the form data for an existing magic link
 * 
 * @param {string} id The unique ID for the magic link
 * @param {Object} formData The updated form data
 * @returns {Promise<void>}
 */
export const updateMagicLinkFormData = async (id, formData) => {
  try {
    const { error } = await supabase
      .from('form_sessions_r2x4')
      .update({ 
        form_data: formData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating magic link data:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to update form data for magic link:', error);
    throw new Error('No se pudo actualizar la información del formulario');
  }
};