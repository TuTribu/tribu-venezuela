'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase, Producto } from '@/lib/supabase';

export default function ProductoPage() {
  const params = useParams();
  const [product, setProduct] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => { loadProduct(); }, [params.id]);

  async function loadProduct() {
    const { data } = await supabase
      .from('productos')
      .select('*, artesanos(nombre, nombre_tienda, ubicacion, datos_pago_movil, datos_zelle)')
      .eq('id', params.id)
      .single();

    if (data) setProduct(data);
    setLoading(false);
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Cargando...</div>;
  if (!product) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Producto no encontrado</div>;

  // Ensure images is always a proper array
  let images: string[] = [];
  if (Array.isArray(product.imagenes)) {
    images = product.imagenes.filter((url: any) => typeof url === 'string' && url.length > 0);
  }
  if (images.length === 0) {
    images = ['https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80'];
  }

  const hasMultiple = images.length > 1;
  const safeSelected = Math.min(selectedImage, images.length - 1);

  function prevImage() {
    setSelectedImage(i => i > 0 ? i - 1 : images.length - 1);
  }
  function nextImage() {
    setSelectedImage(i => i < images.length - 1 ? i + 1 : 0);
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--arena-light)' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', padding: '16px 24px',
        backgroundColor: 'var(--tierra-dark)', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <Link href="/" style={{ color: '#FFF8F0', textDecoration: 'none', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
          ← Volver a la tienda
        </Link>
      </nav>

      <div style={{ maxWidth: 950, margin: '0 auto', padding: 24 }}>
        <div className="product-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>

          {/* ===== IMAGE GALLERY ===== */}
          <div>
            {/* Main image with navigation arrows */}
            <div style={{
              borderRadius: 'var(--radius-lg)', overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)', marginBottom: 12,
              backgroundColor: '#f0ebe5', position: 'relative',
            }}>
              <img
                src={images[safeSelected]}
                alt={product.nombre}
                style={{ width: '100%', display: 'block', aspectRatio: '1', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80';
                }}
              />

              {/* Prev / Next arrows */}
              {hasMultiple && (
                <>
                  <button onClick={prevImage} style={{
                    position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                    width: 40, height: 40, borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.5)', color: '#FFF',
                    border: 'none', cursor: 'pointer', fontSize: 18,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)',
                    transition: 'background-color 0.2s',
                  }}
                    onMouseOver={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.7)')}
                    onMouseOut={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.5)')}
                  >‹</button>
                  <button onClick={nextImage} style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    width: 40, height: 40, borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.5)', color: '#FFF',
                    border: 'none', cursor: 'pointer', fontSize: 18,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)',
                    transition: 'background-color 0.2s',
                  }}
                    onMouseOver={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.7)')}
                    onMouseOut={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.5)')}
                  >›</button>
                </>
              )}

              {/* Image counter pill */}
              {hasMultiple && (
                <div style={{
                  position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(0,0,0,0.6)', color: '#FFF',
                  padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                  backdropFilter: 'blur(4px)',
                }}>
                  {safeSelected + 1} / {images.length}
                </div>
              )}
            </div>

            {/* Thumbnails strip */}
            {hasMultiple && (
              <div style={{
                display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
                scrollbarWidth: 'thin',
              }}>
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    style={{
                      width: 72, height: 72, flexShrink: 0,
                      borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                      border: safeSelected === i ? '3px solid var(--tierra)' : '2px solid var(--border)',
                      padding: 0, background: '#f0ebe5',
                      opacity: safeSelected === i ? 1 : 0.6,
                      transition: 'all 0.2s',
                      transform: safeSelected === i ? 'scale(1.05)' : 'scale(1)',
                    }}
                  >
                    <img
                      src={img}
                      alt={`Foto ${i + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ===== PRODUCT INFO ===== */}
          <div>
            <span style={{
              display: 'inline-block', padding: '4px 12px', borderRadius: 6,
              fontSize: 12, fontWeight: 600, backgroundColor: 'var(--arena)',
              color: 'var(--tierra)', marginBottom: 12,
            }}>{product.categoria}</span>

            <h1 style={{
              fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700,
              color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.2,
            }}>{product.nombre}</h1>

            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
              Por <strong style={{ color: 'var(--tierra)' }}>{product.artesanos?.nombre}</strong>
              {product.artesanos?.nombre_tienda ? ` · ${product.artesanos.nombre_tienda}` : ''}
              {product.artesanos?.ubicacion ? ` · ${product.artesanos.ubicacion}` : ''}
            </p>

            <div style={{
              padding: 20, backgroundColor: 'var(--arena)', borderRadius: 'var(--radius)', marginBottom: 20,
            }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--tierra)' }}>
                ${product.precio.toFixed(2)} USD
              </div>
            </div>

            {product.descripcion && (
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24, whiteSpace: 'pre-line' }}>
                {product.descripcion}
              </p>
            )}

            <p style={{
              fontSize: 13,
              color: product.stock > 0 ? '#2E7D32' : 'var(--rojo)',
              fontWeight: 600, marginBottom: 20,
            }}>
              {product.stock > 0 ? `✓ ${product.stock} unidad${product.stock !== 1 ? 'es' : ''} disponible${product.stock !== 1 ? 's' : ''}` : '✕ Agotado'}
            </p>

            {product.stock > 0 ? (
              <Link href={`/checkout/${product.id}`} style={{
                display: 'block', width: '100%', padding: 16, borderRadius: 'var(--radius)',
                border: 'none', backgroundColor: 'var(--tierra)', color: '#FFF',
                fontSize: 16, fontWeight: 600, textAlign: 'center', textDecoration: 'none',
                boxShadow: '0 4px 15px rgba(139,69,19,0.3)',
              }}>
                Comprar ahora
              </Link>
            ) : (
              <div style={{
                width: '100%', padding: 16, borderRadius: 'var(--radius)',
                border: '2px solid var(--border)', backgroundColor: 'var(--arena-light)',
                fontSize: 16, fontWeight: 600, textAlign: 'center', color: 'var(--text-muted)',
              }}>
                Producto agotado
              </div>
            )}

            <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>
              📱 Pago Móvil · 💵 Zelle
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
