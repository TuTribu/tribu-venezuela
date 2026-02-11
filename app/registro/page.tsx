'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function RegistroPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    nombre: '', nombre_tienda: '', email: '', password: '',
    ubicacion: '', telefono: '',
    pm_telefono: '', pm_cedula: '', pm_banco: '',
    zelle_email: '', zelle_nombre: '',
  });

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (authError || !authData.user) {
      setError(authError?.message || 'Error al crear cuenta');
      setLoading(false);
      return;
    }

    // 2. Create artisan profile
    const { error: profileError } = await supabase.from('artesanos').insert({
      id: authData.user.id,
      nombre: form.nombre,
      nombre_tienda: form.nombre_tienda,
      email: form.email,
      ubicacion: form.ubicacion,
      telefono: form.telefono,
      datos_pago_movil: form.pm_telefono ? {
        telefono: form.pm_telefono,
        cedula: form.pm_cedula,
        banco: form.pm_banco,
      } : null,
      datos_zelle: form.zelle_email ? {
        email: form.zelle_email,
        nombre: form.zelle_nombre,
      } : null,
    });

    if (profileError) {
      setError('Error al crear perfil: ' + profileError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 8,
    border: '1.5px solid var(--border)', fontSize: 14,
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--tierra-dark) 0%, var(--terracota) 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 520, backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)', padding: 40, boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span style={{ fontSize: 40 }}>🏺</span>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: 'var(--text-primary)', marginTop: 8 }}>
            Únete a TribuArte
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>Crea tu tienda y empieza a vender</p>
        </div>

        <form onSubmit={handleRegister}>
          {error && (
            <div style={{ padding: 12, borderRadius: 8, backgroundColor: '#FFEBEE', color: '#C62828', fontSize: 13, marginBottom: 16 }}>{error}</div>
          )}

          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--tierra)', marginBottom: 12, marginTop: 8 }}>Tu información</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Tu nombre</label>
              <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="María Elena" required style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Nombre de tu tienda</label>
              <input value={form.nombre_tienda} onChange={e => setForm({...form, nombre_tienda: e.target.value})} placeholder="Manos de Barro" required style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Ubicación</label>
              <input value={form.ubicacion} onChange={e => setForm({...form, ubicacion: e.target.value})} placeholder="Valencia, Carabobo" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>WhatsApp</label>
              <input value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} placeholder="+58 412-XXX-XXXX" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Email</label>
              <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} type="email" placeholder="tu@email.com" required style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Contraseña</label>
              <input value={form.password} onChange={e => setForm({...form, password: e.target.value})} type="password" placeholder="Mínimo 6 caracteres" required style={inputStyle} />
            </div>
          </div>

          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--tierra)', marginBottom: 12, marginTop: 20 }}>📱 Datos de Pago Móvil (opcional)</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Teléfono</label>
              <input value={form.pm_telefono} onChange={e => setForm({...form, pm_telefono: e.target.value})} placeholder="0412-XXX-XXXX" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Cédula</label>
              <input value={form.pm_cedula} onChange={e => setForm({...form, pm_cedula: e.target.value})} placeholder="V-12.345.678" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Banco</label>
              <input value={form.pm_banco} onChange={e => setForm({...form, pm_banco: e.target.value})} placeholder="Banesco" style={inputStyle} />
            </div>
          </div>

          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--tierra)', marginBottom: 12, marginTop: 20 }}>💵 Datos de Zelle (opcional)</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Email Zelle</label>
              <input value={form.zelle_email} onChange={e => setForm({...form, zelle_email: e.target.value})} placeholder="tu@email.com" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Nombre en Zelle</label>
              <input value={form.zelle_nombre} onChange={e => setForm({...form, zelle_nombre: e.target.value})} placeholder="Tu Nombre LLC" style={inputStyle} />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: 14, borderRadius: 'var(--radius)',
            border: 'none', backgroundColor: 'var(--tierra)', color: '#FFF',
            fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, marginBottom: 12,
          }}>
            {loading ? 'Creando tu tienda...' : 'Crear mi tienda'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          ¿Ya tienes cuenta? <Link href="/login" style={{ color: 'var(--tierra)', fontWeight: 600, textDecoration: 'none' }}>Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
