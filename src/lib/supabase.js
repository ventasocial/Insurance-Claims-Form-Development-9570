import { createClient } from '@supabase/supabase-js';

// Credenciales de Supabase 
const SUPABASE_URL = 'https://zshawnoiwrqznqocxqrr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzaGF3bm9pd3Jxem5xb2N4cXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTAxMDEsImV4cCI6MjA2OTQyNjEwMX0.0xNQW8K5nx09BdGxuFJyitl8bgmb3bb3fkwMifCobXA';

if (SUPABASE_URL === 'https://<PROJECT-ID>.supabase.co' || SUPABASE_ANON_KEY === '<ANON_KEY>') {
  throw new Error('Missing Supabase variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

// Inicializar el bucket para documentos si es necesario
const initializeStorage = async () => {
  try {
    // Verificar si el bucket ya existe
    const { data: buckets, error } = await supabase
      .storage
      .listBuckets();
    
    if (error) {
      console.error('Error al verificar buckets:', error);
      return;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === 'claim_documents');
    
    if (!bucketExists) {
      // Intentar crear el bucket - esto requiere permisos de admin
      console.log('El bucket claim_documents no existe. Se intentará crear desde el backend.');
    }
  } catch (error) {
    console.error('Error al inicializar almacenamiento:', error);
  }
};

// Inicializar almacenamiento
initializeStorage();

export default supabase;