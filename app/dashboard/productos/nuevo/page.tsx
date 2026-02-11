'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const CATEGORIES = ['Cerámica', 'Textiles', 'Joyería', 'Arte Popular', 'Materiales Naturales', 'Decoración'];

export default function NuevoProductoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [form, setForm] = useState({ nombre: '', descripcion: '', precio: '', categoria: 'Cerámica', stock: '' });

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setImagePreviews([...imagePreviews, ...files.map(f => URL.createObjectURL(f))]);
    setImageFiles([...imageFiles, ...files]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre || !form.precio) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const imageUrls: string[] = [];
    for (const file of imageFiles) {
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { data } = await supabase.storage.from('productos').upload(fileName, file);
      if (data) {
        const { data: urlData } = supabase.storage.from('productos').getPublicUrl(fileName);
        imageUrls.push(urlData.publicUrl);
      }
    }

    const { error } = await supabase.from('productos').insert({
      artesano_id: user.id, nombre: form.nombre, descripcion: form.descripcion,
      precio: parseFloat(form.precio), categoria: form.categoria,
      stock: parseInt(form.stock) || 0, imagenes: imageUrls,
    });

    if (!error) router.push('/dashboard');
    setLoading(false);
  }

  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 14 };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--arena-light)', padding: 24 }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <button onClick={() => router.push('/dashboard')} style={{
          background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, marginBottom: 16,
        }}>← Volver al dashboard</button>

        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: 32, boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 24 }}>Agregar nuevo producto</h2>

          <form onSubmit={handleSubmit}>
            <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius)', padding: 40, textAlign: 'center', marginBottom: 24, backgroundColor: 'var(--arena-light)', position: 'relative' }}>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>📷 Toca para subir fotos</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Hasta 5 fotos. JPG o PNG</p>
            </div>

            {imagePreviews.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                {imagePreviews.map((src, i) => <img key={i} src={src} alt="" style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover' }} />)}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Nombre del producto</label>
              <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Ej: Vasija de cerámica pintada a mano" required style={inputStyle} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Descripción</label>
              <textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} placeholder="Describe tu producto, materiales, dimensiones..." rows={4} style={{...inputStyle, resize: 'vertical' as any}} />
            </div>

            <div className="new-product-prices" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Precio USD</label>
                <input value={form.precio} onChange={e => setForm({...form, precio: e.target.value})} placeholder="0.00" type="number" step="0.01" required style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Stock</label>
                <input value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} placeholder="0" type="number" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Categoría</label>
                <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} style={{...inputStyle, backgroundColor: '#FFF'}}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: 14, borderRadius: 'var(--radius)', border: 'none',
              backgroundColor: 'var(--selva-light)', color: '#FFF', fontSize: 15, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            }}>{loading ? 'Publicando...' : 'Publicar producto'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
