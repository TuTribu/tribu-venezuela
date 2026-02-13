'use client';

import Link from 'next/link';
import { Producto } from '@/lib/supabase';

export default function ProductCard({ product }: { product: Producto }) {
  return (
    <Link href={`/producto/${product.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)',
        overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ position: 'relative', paddingTop: '75%', overflow: 'hidden' }}>
          <img
            src={product.imagenes?.[0] || 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80'}
            alt={product.nombre}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80';
            }}
          />
          <span style={{
            position: 'absolute', top: 12, left: 12, padding: '4px 10px',
            borderRadius: 6, fontSize: 11, fontWeight: 600,
            backgroundColor: 'rgba(44,24,16,0.75)', color: '#FFF',
          }}>{product.categoria}</span>
        </div>
        <div style={{ padding: 16 }}>
          <h3 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 600,
            color: 'var(--text-primary)', marginBottom: 6,
          }}>{product.nombre}</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
            Por: {product.artesanos?.nombre || 'Artesano'} · {product.artesanos?.ubicacion || ''}
          </p>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--tierra)' }}>
            ${product.precio.toFixed(2)}
          </span>
        </div>
      </div>
    </Link>
  );
}
