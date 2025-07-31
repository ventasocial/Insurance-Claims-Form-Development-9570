-- Crear tabla de reclamaciones
CREATE TABLE IF NOT EXISTS reclamaciones_r2x4 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contacto_nombres TEXT NOT NULL,
  contacto_apellido_paterno TEXT NOT NULL,
  contacto_apellido_materno TEXT NOT NULL,
  contacto_email TEXT NOT NULL,
  contacto_telefono TEXT NOT NULL,
  aseguradora TEXT NOT NULL,
  tipo_reclamo TEXT NOT NULL,
  tipo_reembolso TEXT,
  numero_reclamo TEXT,
  tipos_servicio TEXT[],
  descripcion_siniestro TEXT,
  servicio_programacion TEXT,
  tipo_cirugia TEXT,
  titular_asegurado JSONB,
  asegurado_afectado JSONB,
  titular_cuenta JSONB,
  opcion_documentos_firma TEXT,
  documentos JSONB,
  documentos_por_email JSONB,
  estado TEXT DEFAULT 'Enviado',
  aceptacion_terminos BOOLEAN DEFAULT false,
  aceptacion_privacidad BOOLEAN DEFAULT false,
  session_id TEXT,
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de sesiones de formularios
CREATE TABLE IF NOT EXISTS form_sessions_r2x4 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Crear tabla de webhooks
CREATE TABLE IF NOT EXISTS webhooks_r2x4 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  trigger_events TEXT[] DEFAULT ARRAY['form_submitted'],
  headers JSONB DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de logs de webhooks
CREATE TABLE IF NOT EXISTS webhook_logs_r2x4 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES webhooks_r2x4(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  status_code INTEGER,
  success BOOLEAN DEFAULT false,
  response_body TEXT,
  payload JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  retry_count INTEGER DEFAULT 0
);

-- Crear tabla de usuarios admin
CREATE TABLE IF NOT EXISTS usuarios_admin_r2x4 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  rol TEXT DEFAULT 'Admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE reclamaciones_r2x4 ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_sessions_r2x4 ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks_r2x4 ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs_r2x4 ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_admin_r2x4 ENABLE ROW LEVEL SECURITY;

-- Políticas para reclamaciones (permitir inserción pública)
DROP POLICY IF EXISTS "Allow public insert" ON reclamaciones_r2x4;
CREATE POLICY "Allow public insert" ON reclamaciones_r2x4
  FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin read" ON reclamaciones_r2x4;
CREATE POLICY "Allow admin read" ON reclamaciones_r2x4
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow admin update" ON reclamaciones_r2x4;
CREATE POLICY "Allow admin update" ON reclamaciones_r2x4
  FOR UPDATE TO authenticated USING (true);

-- Políticas para sesiones de formularios (permitir operaciones públicas)
DROP POLICY IF EXISTS "Allow public session operations" ON form_sessions_r2x4;
CREATE POLICY "Allow public session operations" ON form_sessions_r2x4
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Políticas para webhooks (solo administradores autenticados)
DROP POLICY IF EXISTS "Allow admin webhook operations" ON webhooks_r2x4;
CREATE POLICY "Allow admin webhook operations" ON webhooks_r2x4
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Políticas para logs de webhooks (solo administradores autenticados)
DROP POLICY IF EXISTS "Allow admin webhook log operations" ON webhook_logs_r2x4;
CREATE POLICY "Allow admin webhook log operations" ON webhook_logs_r2x4
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Políticas para usuarios admin (solo administradores autenticados)
DROP POLICY IF EXISTS "Allow admin user operations" ON usuarios_admin_r2x4;
CREATE POLICY "Allow admin user operations" ON usuarios_admin_r2x4
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_reclamaciones_created_at ON reclamaciones_r2x4(created_at);
CREATE INDEX IF NOT EXISTS idx_reclamaciones_estado ON reclamaciones_r2x4(estado);
CREATE INDEX IF NOT EXISTS idx_reclamaciones_aseguradora ON reclamaciones_r2x4(aseguradora);
CREATE INDEX IF NOT EXISTS idx_reclamaciones_archived ON reclamaciones_r2x4(archived);

CREATE INDEX IF NOT EXISTS idx_form_sessions_expires_at ON form_sessions_r2x4(expires_at);

CREATE INDEX IF NOT EXISTS idx_webhooks_enabled ON webhooks_r2x4(enabled);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON webhook_logs_r2x4(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_sent_at ON webhook_logs_r2x4(sent_at);

-- Insertar usuario admin por defecto (opcional)
INSERT INTO usuarios_admin_r2x4 (email, rol) 
VALUES ('admin@fortex.mx', 'Admin')
ON CONFLICT (email) DO NOTHING;

-- Crear bucket de storage para documentos (se ejecutará desde la aplicación)
-- El bucket se creará automáticamente desde la aplicación con las políticas correctas