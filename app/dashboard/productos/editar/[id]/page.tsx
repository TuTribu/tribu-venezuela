'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const CATEGORIES = ['Cerámica', 'Textiles', 'Joyería', 'Arte Popular', 'Materiales Naturales', 'Decoración'];
const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface ImageItem {
  id: string;
  file?: File;          // undefined for existing images
  preview: string;
  status: 'existing' | 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  url?: string;         // the supabase public URL (for existing images)
  error?: string;
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

async function compressImage(file: File, maxWidth = 1200, quality = 0.82): Promise<File> {
  return new Promise((resolve, reject) => {
    if (file.size < 500 * 1024 && file.type === 'image/jpeg') {
      resolve(file);
      return;
    }
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Error al comprimir')); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg', lastModified: Date.now() }));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => reject(new Error('Error al leer imagen'));
    img.src = URL.createObjectURL(file);
  });
}

export default function EditarProductoPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [form, setForm] = useState({ nombre: '', descripcion: '', precio: '', categoria: 'Cerámica', stock: '', activo: true });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  async function loadProduct() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data, error: fetchError } = await supabase
      .from('productos')
      .select('*')
      .eq('id', productId)
      .eq('artesano_id', user.id)
      .single();

    if (fetchError || !data) {
      setError('Producto no encontrado o no tienes permiso para editarlo');
      setLoading(false);
      return;
    }

    setForm({
      nombre: data.nombre || '',
      descripcion: data.descripcion || '',
      precio: data.precio?.toString() || '',
      categoria: data.categoria || 'Cerámica',
      stock: data.stock?.toString() || '0',
      activo: data.activo !== false,
    });

    // Load existing images
    const existingImages: ImageItem[] = (data.imagenes || []).map((url: string, i: number) => ({
      id: `existing-${i}-${generateId()}`,
      preview: url,
      url: url,
      status: 'existing' as const,
      progress: 100,
    }));
    setImages(existingImages);
    setLoading(false);
  }

  const addFiles = useCallback(async (files: File[]) => {
    setError('');
    setSuccess('');
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) { setError(`Máximo ${MAX_IMAGES} fotos permitidas`); return; }

    const toAdd = files.slice(0, remaining);
    const validFiles: ImageItem[] = [];

    for (const file of toAdd) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(`"${file.name}" no es un formato válido. Usa JPG, PNG o WebP.`);
        continue;
      }
      validFiles.push({
        id: generateId(), file, preview: URL.createObjectURL(file),
        status: 'pending', progress: 0,
      });
    }

    if (toAdd.length < files.length) {
      setError(`Solo se agregaron ${toAdd.length} de ${files.length} fotos (máximo ${MAX_IMAGES})`);
    }
    setImages(prev => [...prev, ...validFiles]);
  }, [images.length]);

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) addFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) addFiles(files);
  }

  function removeImage(id: string) {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img && img.file) URL.revokeObjectURL(img.preview);
      return prev.filter(i => i.id !== id);
    });
    setError('');
  }

  function moveImage(index: number, direction: -1 | 1) {
    setImages(prev => {
      const arr = [...prev];
      const ni = index + direction;
      if (ni < 0 || ni >= arr.length) return prev;
      [arr[index], arr[ni]] = [arr[ni], arr[index]];
      return arr;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.nombre.trim()) { setError('El nombre del producto es obligatorio'); return; }
    if (!form.precio || parseFloat(form.precio) <= 0) { setError('Ingresa un precio válido'); return; }
    if (images.length === 0) { setError('Agrega al menos una foto del producto'); return; }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const finalUrls: string[] = [];

      for (let i = 0; i < images.length; i++) {
        const img = images[i];

        // Existing images already have a URL
        if (img.status === 'existing' && img.url) {
          finalUrls.push(img.url);
          continue;
        }

        // New images need to be uploaded
        if (!img.file) continue;

        setImages(prev => prev.map(item =>
          item.id === img.id ? { ...item, status: 'uploading' as const, progress: 30 } : item
        ));

        try {
          const compressed = await compressImage(img.file);

          setImages(prev => prev.map(item =>
            item.id === img.id ? { ...item, progress: 60 } : item
          ));

          const ext = compressed.name.split('.').pop() || 'jpg';
          const fileName = `${user.id}/${Date.now()}-${generateId()}.${ext}`;

          const { data, error: uploadError } = await supabase.storage
            .from('productos')
            .upload(fileName, compressed, { cacheControl: '3600', upsert: false });

          if (uploadError) throw new Error(uploadError.message);

          if (data) {
            const { data: urlData } = supabase.storage.from('productos').getPublicUrl(data.path);
            finalUrls.push(urlData.publicUrl);

            setImages(prev => prev.map(item =>
              item.id === img.id ? { ...item, status: 'done' as const, progress: 100, url: urlData.publicUrl } : item
            ));
          }
        } catch (uploadErr: any) {
          setImages(prev => prev.map(item =>
            item.id === img.id ? { ...item, status: 'error' as const, error: uploadErr.message } : item
          ));
          console.error('Upload error:', uploadErr);
        }
      }

      if (finalUrls.length === 0) {
        setError('No se pudo guardar ninguna imagen.');
        setSaving(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('productos')
        .update({
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim(),
          precio: parseFloat(form.precio),
          categoria: form.categoria,
          stock: parseInt(form.stock) || 0,
          activo: form.activo,
          imagenes: finalUrls,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId)
        .eq('artesano_id', user.id);

      if (updateError) {
        setError('Error al actualizar: ' + updateError.message);
        setSaving(false);
        return;
      }

      setSuccess('Producto actualizado correctamente');
      // Reload to refresh existing images status
      setTimeout(() => {
        router.push('/dashboard');
      }, 1200);
    } catch (err: any) {
      setError('Error inesperado: ' + (err.message || 'Inténtalo de nuevo'));
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 8,
    border: '1.5px solid var(--border)', fontSize: 14, backgroundColor: '#FFF',
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--arena-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>Cargando producto...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--arena-light)', padding: 24 }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <button onClick={() => router.push('/dashboard')} style={{
          background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
          fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6,
        }}>← Volver al dashboard</button>

        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: 32, boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 8 }}>Editar producto</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            Modifica los datos, fotos, precio o stock de tu producto
          </p>

          {error && (
            <div style={{
              padding: 12, borderRadius: 8, backgroundColor: '#FFEBEE',
              color: '#C62828', fontSize: 13, marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>⚠️ {error}</div>
          )}

          {success && (
            <div style={{
              padding: 12, borderRadius: 8, backgroundColor: '#E8F5E9',
              color: '#2E7D32', fontSize: 13, marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>✅ {success}</div>
          )}

          <form onSubmit={handleSubmit}>

            {/* ===== IMAGE MANAGEMENT ===== */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Fotos del producto ({images.length}/{MAX_IMAGES})
              </label>

              {/* Image grid */}
              {images.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12, marginBottom: 12 }}>
                  {images.map((img, index) => (
                    <div key={img.id} style={{
                      position: 'relative', borderRadius: 10, overflow: 'hidden',
                      border: img.status === 'error' ? '2px solid var(--rojo)' : '2px solid var(--border)',
                      aspectRatio: '1', backgroundColor: '#f5f5f5',
                    }}>
                      <img src={img.preview} alt={`Foto ${index + 1}`} style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        opacity: img.status === 'uploading' ? 0.5 : 1, display: 'block',
                      }}
                        onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                      />

                      {/* Principal badge */}
                      {index === 0 && (
                        <span style={{
                          position: 'absolute', top: 4, left: 4,
                          backgroundColor: 'var(--tierra)', color: '#FFF',
                          fontSize: 9, fontWeight: 700, padding: '2px 6px',
                          borderRadius: 4, textTransform: 'uppercase',
                        }}>Principal</span>
                      )}

                      {/* Existing badge */}
                      {img.status === 'existing' && index !== 0 && (
                        <span style={{
                          position: 'absolute', bottom: 4, left: 4,
                          backgroundColor: 'rgba(0,0,0,0.5)', color: '#FFF',
                          fontSize: 8, fontWeight: 600, padding: '2px 5px',
                          borderRadius: 3,
                        }}>guardada</span>
                      )}

                      {/* Upload spinner */}
                      {img.status === 'uploading' && (
                        <div style={{
                          position: 'absolute', inset: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          backgroundColor: 'rgba(255,255,255,0.7)',
                        }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            border: '3px solid var(--border)', borderTopColor: 'var(--tierra)',
                            animation: 'spin 0.8s linear infinite',
                          }} />
                        </div>
                      )}

                      {img.status === 'done' && (
                        <div style={{
                          position: 'absolute', bottom: 4, right: 4,
                          width: 20, height: 20, borderRadius: '50%',
                          backgroundColor: '#4CAF50', color: '#FFF',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700,
                        }}>✓</div>
                      )}

                      {img.status === 'error' && (
                        <div style={{
                          position: 'absolute', bottom: 4, right: 4,
                          width: 20, height: 20, borderRadius: '50%',
                          backgroundColor: 'var(--rojo)', color: '#FFF',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700,
                        }}>!</div>
                      )}

                      {/* Controls */}
                      {!saving && (
                        <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 3 }}>
                          {index > 0 && (
                            <button type="button" onClick={(e) => { e.stopPropagation(); moveImage(index, -1); }}
                              style={{ width: 22, height: 22, borderRadius: 4, border: 'none', backgroundColor: 'rgba(0,0,0,0.6)', color: '#FFF', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >◀</button>
                          )}
                          {index < images.length - 1 && (
                            <button type="button" onClick={(e) => { e.stopPropagation(); moveImage(index, 1); }}
                              style={{ width: 22, height: 22, borderRadius: 4, border: 'none', backgroundColor: 'rgba(0,0,0,0.6)', color: '#FFF', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >▶</button>
                          )}
                          <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                            style={{ width: 22, height: 22, borderRadius: 4, border: 'none', backgroundColor: 'rgba(200,30,30,0.85)', color: '#FFF', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >✕</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add more images */}
              {images.length < MAX_IMAGES && (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragOver ? 'var(--tierra)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius)',
                    padding: '20px',
                    textAlign: 'center',
                    backgroundColor: dragOver ? 'rgba(232,93,4,0.05)' : 'var(--arena-light)',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                  }}
                >
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFileInput} style={{ display: 'none' }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    📷 {images.length === 0 ? 'Toca o arrastra fotos aquí' : `Agregar más fotos (${MAX_IMAGES - images.length} restante${MAX_IMAGES - images.length !== 1 ? 's' : ''})`}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>JPG, PNG o WebP · Máx 5MB</p>
                </div>
              )}

              {images.length > 0 && (
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                  La primera foto será la imagen principal. Usa las flechas para reordenar. La ✕ elimina la foto.
                </p>
              )}
            </div>

            {/* ===== PRODUCT FIELDS ===== */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Nombre del producto *</label>
              <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Vasija de cerámica pintada a mano" required maxLength={120} style={inputStyle} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Descripción</label>
              <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Describe tu producto: materiales, dimensiones, técnica, historia..." rows={4} maxLength={2000} style={{ ...inputStyle, resize: 'vertical' as any }} />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>{form.descripcion.length}/2000</p>
            </div>

            <div className="new-product-prices" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Precio USD *</label>
                <input value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} placeholder="0.00" type="number" step="0.01" min="0.01" required style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Stock</label>
                <input value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="0" type="number" min="0" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Categoría</label>
                <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} style={inputStyle}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Active toggle */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: 16, backgroundColor: 'var(--arena-light)', borderRadius: 'var(--radius)',
              marginBottom: 24, cursor: 'pointer',
            }} onClick={() => setForm({ ...form, activo: !form.activo })}>
              <div style={{
                width: 44, height: 24, borderRadius: 12, padding: 2,
                backgroundColor: form.activo ? '#4CAF50' : 'var(--border)',
                transition: 'background-color 0.2s', display: 'flex',
                justifyContent: form.activo ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', backgroundColor: '#FFF',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'all 0.2s',
                }} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: form.activo ? '#2E7D32' : 'var(--text-muted)' }}>
                  {form.activo ? 'Producto visible en la tienda' : 'Producto oculto (no se muestra a compradores)'}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {form.activo ? 'Los compradores pueden ver y comprar este producto' : 'Desactívalo temporalmente sin borrarlo'}
                </p>
              </div>
            </div>

            {/* Submit buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" disabled={saving} style={{
                flex: 1, padding: 16, borderRadius: 'var(--radius)', border: 'none',
                backgroundColor: saving ? 'var(--text-muted)' : 'var(--terracota-light)',
                color: '#FFF', fontSize: 16, fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s',
              }}>
                {saving ? '⏳ Guardando cambios...' : '💾 Guardar cambios'}
              </button>

              <button type="button" onClick={() => router.push('/dashboard')} disabled={saving} style={{
                padding: '16px 24px', borderRadius: 'var(--radius)',
                border: '1.5px solid var(--border)', backgroundColor: 'transparent',
                color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}>
                Cancelar
              </button>
            </div>

            {saving && (
              <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>
                No cierres esta página mientras se guardan los cambios...
              </p>
            )}
          </form>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
