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

// Función para crear el bucket si no existe
export const ensureBucketExists = async () => {
  try {
    console.log('🔍 Checking if bucket exists...');
    
    // Verificar si el bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      throw listError;
    }

    const bucketExists = buckets.some(bucket => bucket.name === 'claims');
    
    if (bucketExists) {
      console.log('✅ Bucket "claims" already exists');
      return true;
    }

    console.log('📦 Creating claims bucket...');
    
    // Crear el bucket si no existe
    const { error: createError } = await supabase.storage.createBucket('claims', {
      public: true, // Hacer el bucket público para poder acceder a los archivos
      allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
      fileSizeLimit: 10485760 // 10MB
    });

    if (createError) {
      console.error('❌ Error creating bucket:', createError);
      throw createError;
    }

    console.log('✅ Claims bucket created successfully');
    return true;
  } catch (error) {
    console.error('💥 Error ensuring bucket exists:', error);
    throw error;
  }
};

export default supabase;