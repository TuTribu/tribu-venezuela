'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError('Email o contraseña incorrectos');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--tierra-dark) 0%, var(--selva) 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 420, backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)', padding: 40, boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ fontSize: 40 }}>🏺</span>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: 'var(--text-primary)', marginTop: 8 }}>
            Portal del Artesano
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>Ingresa para gestionar tu tienda</p>
        </div>

        <form onSubmit={handleLogin}>
          {error && (
            <div style={{
              padding: 12, borderRadius: 8, backgroundColor: '#FFEBEE',
              color: '#C62828', fontSize: 13, marginBottom: 16, textAlign: 'center',
            }}>{error}</div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Correo electrónico</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" type="email" required
              style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 14 }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Contraseña</label>
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" type="password" required
              style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 14 }}
            />
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: 14, borderRadius: 'var(--radius)',
            border: 'none', backgroundColor: 'var(--tierra)', color: '#FFF',
            fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 15px rgba(139,69,19,0.3)', marginBottom: 16,
            opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Entrando...' : 'Entrar a mi tienda'}
          </button>
        </form>

        <Link href="/" style={{
          display: 'block', width: '100%', padding: 12, borderRadius: 'var(--radius)',
          border: '1.5px solid var(--border)', backgroundColor: 'transparent',
          color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', textDecoration: 'none',
        }}>Volver a la tienda</Link>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
          ¿No tienes cuenta? <Link href="/registro" style={{ color: 'var(--tierra)', fontWeight: 600, textDecoration: 'none' }}>Regístrate como artesano</Link>
        </p>
      </div>
    </div>
  );
}
