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

    if (data) {
      console.log('Producto cargado:', data);
      console.log('Imágenes:', data.imagenes);
      console.log('Número de imágenes:', data.imagenes?.length || 0);
      setProduct(data);
    }
    setLoading(false);
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Cargando...</div>;
  if (!product) return <div style={{ padding: 40, textAlign: 'center' }}>Producto no encontrado</div>;

  const images = product.imagenes?.length > 0
    ? product.imagenes
    : ['https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80'];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--arena-light)' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', padding: '16px 24px',
        backgroundColor: 'var(--tierra-dark)', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <Link href="/" style={{ color: '#FFF8F0', textDecoration: 'none', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
          ← Volver
        </Link>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
        <div className="product-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>

          {/* Image gallery */}
          <div>
            {/* Main image */}
            <div style={{
              borderRadius: 'var(--radius-lg)', overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)', marginBottom: 12,
              backgroundColor: '#f5f5f5',
            }}>
              <img
                src={images[selectedImage]}
                alt={product.nombre}
                style={{ width: '100%', display: 'block', aspectRatio: '1', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80';
                }}
              />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    style={{
                      width: 64, height: 64, flexShrink: 0,
                      borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                      border: selectedImage === i ? '3px solid var(--tierra)' : '2px solid var(--border)',
                      padding: 0, background: '#f5f5f5',
                      opacity: selectedImage === i ? 1 : 0.7,
                      transition: 'all 0.2s',
                    }}
                  >
                    <img
                      src={img}
                      alt={`Foto ${i + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Image counter */}
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
              {images.length > 1 ? `${selectedImage + 1} de ${images.length} fotos` : `${images.length} foto${images.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Product details */}
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
              Por <strong style={{ color: 'var(--tierra)' }}>{product.artesanos?.nombre}</strong> · {product.artesanos?.nombre_tienda} · {product.artesanos?.ubicacion}
            </p>

            <div style={{
              padding: 20, backgroundColor: 'var(--arena)', borderRadius: 'var(--radius)', marginBottom: 20,
            }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--tierra)' }}>${product.precio.toFixed(2)} USD</div>
            </div>

            {product.descripcion && (
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24, whiteSpace: 'pre-line' }}>
                {product.descripcion}
              </p>
            )}

            <p style={{ fontSize: 13, color: product.stock > 0 ? 'var(--terracota-light)' : 'var(--rojo)', fontWeight: 600, marginBottom: 20 }}>
              {product.stock > 0 ? `✓ ${product.stock} unidades disponibles` : '✕ Agotado'}
            </p>

            {product.stock > 0 && (
              <Link href={`/checkout/${product.id}`} style={{
                display: 'block', width: '100%', padding: 16, borderRadius: 'var(--radius)',
                border: 'none', backgroundColor: 'var(--tierra)', color: '#FFF',
                fontSize: 16, fontWeight: 600, textAlign: 'center', textDecoration: 'none',
                boxShadow: '0 4px 15px rgba(139,69,19,0.3)',
              }}>
                Comprar ahora
              </Link>
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
