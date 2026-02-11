import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Artesano {
  id: string;
  nombre: string;
  nombre_tienda: string;
  ubicacion: string;
  telefono: string;
  email: string;
  foto_perfil: string | null;
  datos_pago_movil: {
    telefono: string;
    cedula: string;
    banco: string;
  } | null;
  datos_zelle: {
    email: string;
    nombre: string;
  } | null;
}

export interface Producto {
  id: string;
  artesano_id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  stock: number;
  imagenes: string[];
  activo: boolean;
  created_at: string;
  artesanos?: Artesano;
}

export interface Pedido {
  id: string;
  numero_pedido: string;
  producto_id: string;
  artesano_id: string;
  nombre_comprador: string;
  telefono_comprador: string;
  direccion_comprador: string;
  monto: number;
  metodo_pago: 'pago_movil' | 'zelle';
  referencia_pago: string | null;
  estado: 'pendiente' | 'confirmado' | 'enviado' | 'entregado';
  created_at: string;
  productos?: Producto;
}
