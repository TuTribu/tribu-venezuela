'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase, Producto } from '@/lib/supabase';

const CATEGORIES = ['Cerámica', 'Textiles', 'Joyería', 'Arte Popular', 'Materiales Naturales', 'Decoración'];
const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface ImageItem {
  id: string;
  file?: File;
  preview: string;
  url?: string;
  status: 'existing' | 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  error?: string;
  isNew?: boolean;
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
          if (!blob) { reject(new Error('Error al comprimir imagen')); return; }
          const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
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
  const [form, setForm] = useState({ nombre: '', descripcion: '', precio: '', categoria: 'Cerámica', stock: '1', activo: true });
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar producto existente
  useEffect(() => {
    loadProduct();
  }, [productId]);

  async function loadProduct() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('id', productId)
      .eq('artesano_id', user.id)
      .single();

    if (error || !data) {
      setError('Producto no encontrado o no tienes permiso para editarlo');
      setLoading(false);
      return;
    }

    const product = data as Producto;
    setForm({
      nombre: product.nombre,
      descripcion: product.descripcion || '',
      precio: product.precio.toString(),
      categoria: product.categoria,
      stock: product.stock.toString(),
      activo: product.activo,
    });

    // Cargar imágenes existentes
    if (product.imagenes && product.imagenes.length > 0) {
      setImages(product.imagenes.map((url, index) => ({
        id: `existing-${index}`,
        preview: url,
        url: url,
        status: 'existing',
        progress: 100,
      })));
    }

    setLoading(false);
  }

  const addFiles = useCallback(async (files: File[]) => {
    setError('');
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) { setError(`Máximo ${MAX_IMAGES} fotos permitidas`); return; }

    const toAdd = files.slice(0, remaining);
    const validFiles: ImageItem[] = [];

    for (const file of toAdd) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(`"${file.name}" no es un formato válido. Usa JPG, PNG o WebP.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" es muy grande (máx 5MB). Se comprimirá automáticamente.`);
      }
      validFiles.push({
        id: generateId(),
        file,
        preview: URL.createObjectURL(file),
        status: 'pending',
        progress: 0,
        isNew: true,
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
      if (img?.isNew && img.preview) URL.revokeObjectURL(img.preview);
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

    if (!form.nombre.trim()) { setError('El nombre del producto es obligatorio'); return; }
    if (!form.precio || parseFloat(form.precio) <= 0) { setError('Ingresa un precio válido'); return; }
    if (images.length === 0) { setError('Agrega al menos una foto del producto'); return; }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const imageUrls: string[] = [];

      // Procesar todas las imágenes
      for (let i = 0; i < images.length; i++) {
        const img = images[i];

        // Si es imagen existente, mantener URL
        if (img.status === 'existing' && img.url) {
          imageUrls.push(img.url);
          continue;
        }

        // Si es nueva, subirla
        if (img.isNew && img.file) {
          setImages(prev => prev.map(item =>
            item.id === img.id ? { ...item, status: 'uploading', progress: 30 } : item
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
              imageUrls.push(urlData.publicUrl);

              setImages(prev => prev.map(item =>
                item.id === img.id ? { ...item, status: 'done', progress: 100, url: urlData.publicUrl } : item
              ));
            }
          } catch (uploadErr: any) {
            setImages(prev => prev.map(item =>
              item.id === img.id ? { ...item, status: 'error', error: uploadErr.message } : item
            ));
            console.error('Upload error:', uploadErr);
          }
        }
      }

      if (imageUrls.length === 0) {
        setError('No se pudo procesar ninguna imagen.');
        setSaving(false);
        return;
      }

      // Actualizar producto
      const { error: updateError } = await supabase
        .from('productos')
        .update({
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim(),
          precio: parseFloat(form.precio),
          categoria: form.categoria,
          stock: parseInt(form.stock) || 0,
          imagenes: imageUrls,
          activo: form.activo,
        })
        .eq('id', productId);

      if (updateError) {
        setError('Error al actualizar producto: ' + updateError.message);
        setSaving(false);
        return;
      }

      router.push('/dashboard?tab=productos');
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
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--arena-light)', padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Cargando producto...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--arena-light)', padding: 24 }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <button onClick={() => router.push('/dashboard?tab=productos')} style={{
          background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
          fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6,
        }}>← Volver a mis productos</button>

        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: 32, boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 8 }}>Editar producto</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            Actualiza la información de tu artesanía
          </p>

          {error && (
            <div style={{
              padding: 12, borderRadius: 8, backgroundColor: '#FFEBEE',
              color: '#C62828', fontSize: 13, marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>⚠️ {error}</div>
          )}

          <form onSubmit={handleSubmit}>

            {/* ===== IMAGE UPLOAD ===== */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Fotos del producto ({images.length}/{MAX_IMAGES})
              </label>

              {images.length < MAX_IMAGES && (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragOver ? 'var(--tierra)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius)',
                    padding: images.length > 0 ? '20px' : '40px 20px',
                    textAlign: 'center',
                    backgroundColor: dragOver ? 'rgba(232,93,4,0.05)' : 'var(--arena-light)',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                  }}
                >
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFileInput} style={{ display: 'none' }} />
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {dragOver ? 'Suelta las fotos aquí' : 'Agregar más fotos'}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    JPG, PNG o WebP · Máx 5MB · {MAX_IMAGES - images.length} restante{MAX_IMAGES - images.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {images.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12, marginTop: 16 }}>
                  {images.map((img, index) => (
                    <div key={img.id} style={{
                      position: 'relative', borderRadius: 10, overflow: 'hidden',
                      border: img.status === 'error' ? '2px solid var(--rojo)' : '2px solid var(--border)',
                      aspectRatio: '1', backgroundColor: '#f5f5f5',
                    }}>
                      <img src={img.preview} alt={`Foto ${index + 1}`} style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        opacity: img.status === 'uploading' ? 0.5 : 1, display: 'block',
                      }} />

                      {index === 0 && (
                        <span style={{
                          position: 'absolute', top: 4, left: 4,
                          backgroundColor: 'var(--tierra)', color: '#FFF',
                          fontSize: 9, fontWeight: 700, padding: '2px 6px',
                          borderRadius: 4, textTransform: 'uppercase',
                        }}>Principal</span>
                      )}

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

              {images.length > 0 && (
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                  La primera foto será la imagen principal. Usa las flechas para reordenar.
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Precio USD *</label>
                <input value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} placeholder="0.00" type="number" step="0.01" min="0.01" required style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Stock</label>
                <input value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="1" type="number" min="0" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Categoría</label>
                <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} style={inputStyle}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={e => setForm({ ...form, activo: e.target.checked })}
                  style={{ width: 18, height: 18 }}
                />
                <span style={{ fontSize: 14 }}>Producto activo (visible en la tienda)</span>
              </label>
            </div>

            <button type="submit" disabled={saving} style={{
              width: '100%', padding: 16, borderRadius: 'var(--radius)', border: 'none',
              backgroundColor: saving ? 'var(--text-muted)' : 'var(--terracota-light)',
              color: '#FFF', fontSize: 16, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s',
            }}>
              {saving ? '⏳ Guardando cambios...' : '💾 Guardar cambios'}
            </button>
          </form>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
