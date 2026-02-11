-- =============================================
-- TRIBUARTE - Script de base de datos
-- Ejecutar en Supabase > SQL Editor
-- =============================================

-- ARTESANOS
CREATE TABLE artesanos (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  nombre TEXT NOT NULL,
  nombre_tienda TEXT NOT NULL,
  ubicacion TEXT,
  telefono TEXT,
  email TEXT NOT NULL,
  foto_perfil TEXT,
  datos_pago_movil JSONB,
  datos_zelle JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCTOS
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artesano_id UUID NOT NULL REFERENCES artesanos(id),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL,
  categoria TEXT NOT NULL,
  stock INTEGER DEFAULT 0,
  imagenes TEXT[] DEFAULT '{}',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PEDIDOS
CREATE SEQUENCE pedido_seq START 1;

CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_pedido TEXT NOT NULL UNIQUE,
  producto_id UUID NOT NULL REFERENCES productos(id),
  artesano_id UUID NOT NULL REFERENCES artesanos(id),
  nombre_comprador TEXT NOT NULL,
  telefono_comprador TEXT NOT NULL,
  direccion_comprador TEXT NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  metodo_pago TEXT NOT NULL,
  referencia_pago TEXT,
  estado TEXT DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generar número de pedido TRB-001, TRB-002, etc.
CREATE OR REPLACE FUNCTION generar_numero_pedido()
RETURNS TRIGGER AS $$
BEGIN
  NEW.numero_pedido := 'TRB-' || LPAD(nextval('pedido_seq')::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_numero_pedido
  BEFORE INSERT ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION generar_numero_pedido();

-- =============================================
-- SEGURIDAD (Row Level Security)
-- =============================================

ALTER TABLE artesanos ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Artesanos: ver y editar su propio perfil
CREATE POLICY "Artesanos ven su perfil" ON artesanos FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Artesanos editan su perfil" ON artesanos FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Artesanos crean su perfil" ON artesanos FOR INSERT WITH CHECK (auth.uid() = id);

-- Productos: público ve activos, artesanos manejan los suyos
CREATE POLICY "Público ve productos activos" ON productos FOR SELECT USING (activo = true);
CREATE POLICY "Artesanos ven sus productos" ON productos FOR SELECT USING (auth.uid() = artesano_id);
CREATE POLICY "Artesanos crean productos" ON productos FOR INSERT WITH CHECK (auth.uid() = artesano_id);
CREATE POLICY "Artesanos editan sus productos" ON productos FOR UPDATE USING (auth.uid() = artesano_id);
CREATE POLICY "Artesanos borran sus productos" ON productos FOR DELETE USING (auth.uid() = artesano_id);

-- Pedidos: artesanos ven/editan los suyos, cualquiera puede crear
CREATE POLICY "Artesanos ven sus pedidos" ON pedidos FOR SELECT USING (auth.uid() = artesano_id);
CREATE POLICY "Artesanos actualizan sus pedidos" ON pedidos FOR UPDATE USING (auth.uid() = artesano_id);
CREATE POLICY "Cualquiera puede crear pedido" ON pedidos FOR INSERT WITH CHECK (true);

-- =============================================
-- STORAGE para imágenes
-- Crear bucket "productos" en Supabase Dashboard > Storage
-- Marcar como PUBLIC
-- =============================================
