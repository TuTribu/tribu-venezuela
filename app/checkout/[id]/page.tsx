'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, Producto } from '@/lib/supabase';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderNum, setOrderNum] = useState('');
  const [method, setMethod] = useState<'pago_movil' | 'zelle'>('pago_movil');
  const [form, setForm] = useState({ name: '', phone: '', address: '', ref: '' });

  useEffect(() => { loadProduct(); }, [params.id]);

  async function loadProduct() {
    const { data } = await supabase
      .from('productos')
      .select('*, artesanos(nombre, nombre_tienda, datos_pago_movil, datos_zelle, telefono)')
      .eq('id', params.id)
      .single();
    if (data) setProduct(data);
    setLoading(false);
  }

  async function handleSubmit() {
    if (!product || !form.name || !form.phone || !form.address) return;
    setSubmitting(true);

    const { data, error } = await supabase.from('pedidos').insert({
      producto_id: product.id,
      artesano_id: product.artesano_id,
      nombre_comprador: form.name,
      telefono_comprador: form.phone,
      direccion_comprador: form.address,
      monto: product.precio,
      metodo_pago: method,
      referencia_pago: form.ref || null,
    }).select().single();

    if (data) {
      setOrderNum(data.numero_pedido);
      setSuccess(true);
    }
    setSubmitting(false);
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Cargando...</div>;
  if (!product) return <div style={{ padding: 40, textAlign: 'center' }}>Producto no encontrado</div>;

  if (success) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--arena-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', backgroundColor: 'var(--selva-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', color: '#FFF', fontSize: 36,
          }}>✓</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: 'var(--text-primary)', marginBottom: 12 }}>
            ¡Pedido registrado!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 8 }}>
            Tu pedido <strong>{orderNum}</strong> ha sido registrado.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 400, margin: '0 auto 28px' }}>
            El artesano verificará tu pago y te contactará por WhatsApp para coordinar el envío.
          </p>
          <button onClick={() => router.push('/')} style={{
            padding: '14px 32px', borderRadius: 'var(--radius)', border: 'none',
            backgroundColor: 'var(--tierra)', color: '#FFF', fontSize: 15,
            fontWeight: 600, cursor: 'pointer',
          }}>Volver a la tienda</button>
        </div>
      </div>
    );
  }

  const pagoMovil = product.artesanos?.datos_pago_movil;
  const zelle = product.artesanos?.datos_zelle;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--arena-light)' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', padding: '16px 24px', backgroundColor: 'var(--tierra-dark)',
      }}>
        <button onClick={() => router.back()} style={{
          display: 'flex', alignItems: 'center', gap: 8, background: 'none',
          border: 'none', color: '#FFF8F0', cursor: 'pointer', fontSize: 15,
        }}>← Volver</button>
      </nav>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
        {/* Product summary */}
        <div style={{
          display: 'flex', gap: 16, padding: 16, backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius)', marginBottom: 24, boxShadow: 'var(--shadow-sm)',
        }}>
          <img src={product.imagenes?.[0] || ''} alt="" style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover' }} />
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>{product.nombre}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{product.artesanos?.nombre}</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--tierra)', marginTop: 4 }}>${product.precio.toFixed(2)} USD</p>
          </div>
        </div>

        {/* All in one form */}
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: 24, boxShadow: 'var(--shadow-sm)', marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 20 }}>Datos de envío</h2>

          {[
            { label: 'Nombre completo', key: 'name', placeholder: 'Tu nombre' },
            { label: 'Teléfono / WhatsApp', key: 'phone', placeholder: '+58 412-XXX-XXXX' },
            { label: 'Dirección de envío', key: 'address', placeholder: 'Ciudad, estado, dirección completa' },
          ].map(field => (
            <div key={field.key} style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>{field.label}</label>
              <input
                value={(form as any)[field.key]}
                onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 8,
                  border: '1.5px solid var(--border)', fontSize: 14,
                }}
              />
            </div>
          ))}
        </div>

        {/* Payment method */}
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: 24, boxShadow: 'var(--shadow-sm)', marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 20 }}>Método de pago</h2>

          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            {[
              { id: 'pago_movil' as const, label: '📱 Pago Móvil' },
              { id: 'zelle' as const, label: '💵 Zelle' },
            ].map(m => (
              <button key={m.id} onClick={() => setMethod(m.id)} style={{
                flex: 1, padding: 14, borderRadius: 'var(--radius)',
                border: method === m.id ? '2px solid var(--tierra)' : '2px solid var(--border)',
                backgroundColor: method === m.id ? 'var(--arena)' : 'var(--bg-card)',
                cursor: 'pointer', fontSize: 15, fontWeight: 600,
              }}>{m.label}</button>
            ))}
          </div>

          {/* Payment data */}
          <div style={{ padding: 20, backgroundColor: 'var(--arena)', borderRadius: 'var(--radius-sm)', marginBottom: 16 }}>
            {method === 'pago_movil' && pagoMovil ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  { label: 'Teléfono', value: pagoMovil.telefono },
                  { label: 'Cédula', value: pagoMovil.cedula },
                  { label: 'Banco', value: pagoMovil.banco },
                  { label: 'Monto', value: `$${product.precio.toFixed(2)}` },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{item.label}:</span>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            ) : zelle ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  { label: 'Email Zelle', value: zelle.email },
                  { label: 'Nombre', value: zelle.nombre },
                  { label: 'Monto', value: `$${product.precio.toFixed(2)}` },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{item.label}:</span>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Datos de pago no disponibles. Contacta al artesano por WhatsApp.</p>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Número de referencia / confirmación
            </label>
            <input
              value={form.ref} onChange={e => setForm({ ...form, ref: e.target.value })}
              placeholder="Ej: 84729301"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 14 }}
            />
          </div>

          <div style={{
            padding: 16, backgroundColor: '#FFF8E1', borderRadius: 'var(--radius-sm)',
            borderLeft: '4px solid var(--oro)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
          }}>
            <strong>Instrucciones:</strong> Realiza el pago con los datos de arriba. Luego ingresa el número de referencia y confirma. También puedes enviar el comprobante por WhatsApp.
          </div>
        </div>

        <button onClick={handleSubmit} disabled={submitting} style={{
          width: '100%', padding: 16, borderRadius: 'var(--radius)',
          border: 'none', backgroundColor: 'var(--selva-light)', color: '#FFF',
          fontSize: 16, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
          opacity: submitting ? 0.7 : 1,
        }}>
          {submitting ? 'Procesando...' : 'Confirmar pedido'}
        </button>

        {product.artesanos?.telefono && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <a href={`https://wa.me/${product.artesanos.telefono.replace(/[^0-9]/g, '')}`}
              target="_blank" rel="noopener noreferrer"
              style={{ color: '#25D366', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              💬 Enviar comprobante por WhatsApp
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
