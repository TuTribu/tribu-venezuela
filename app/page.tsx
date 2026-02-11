'use client';

import { useState, useEffect } from 'react';
import { supabase, Producto } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';

const CATEGORIES = ['Todas', 'Cerámica', 'Textiles', 'Joyería', 'Arte Popular', 'Decoración'];

export default function HomePage() {
  const [products, setProducts] = useState<Producto[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const { data, error } = await supabase
      .from('productos')
      .select('*, artesanos(nombre, nombre_tienda, ubicacion)')
      .eq('activo', true)
      .order('created_at', { ascending: false });

    if (data) setProducts(data);
    setLoading(false);
  }

  const filtered = products.filter(p => {
    const matchCat = category === 'Todas' || p.categoria === category;
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--arena-light)' }}>
      <Navbar />

      {/* HERO */}
      <div style={{
        background: 'linear-gradient(135deg, var(--terracota) 0%, var(--terracota-dark) 50%, var(--terracota-light) 100%)',
        padding: '60px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 42, fontWeight: 700,
          color: '#FFF8F0', marginBottom: 12,
        }}>Artesanía con alma</h1>
        <p style={{
          color: 'rgba(255,248,240,0.8)', fontSize: 17, maxWidth: 500, margin: '0 auto 28px',
          lineHeight: 1.6,
        }}>Cada pieza cuenta la historia de manos venezolanas y latinoamericanas</p>

        <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative' }}>
          <input
            type="text" placeholder="Buscar artesanías..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '14px 16px 14px 44px', borderRadius: 12,
              border: 'none', fontSize: 15, backgroundColor: '#FFF',
              boxShadow: 'var(--shadow-lg)', color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>

      {/* CATEGORIES */}
      <div style={{ padding: '20px 24px 0', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              padding: '8px 20px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 500,
              backgroundColor: category === cat ? 'var(--tierra)' : 'var(--bg-card)',
              color: category === cat ? '#FFF' : 'var(--text-secondary)',
              boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s',
            }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* PRODUCTS */}
      <div style={{
        padding: 24, maxWidth: 1100, margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 20,
      }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1', padding: 40 }}>
            Cargando productos...
          </p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1', padding: 40 }}>
            No se encontraron productos
          </p>
        ) : (
          filtered.map(product => <ProductCard key={product.id} product={product} />)
        )}
      </div>

      {/* FOOTER */}
      <footer style={{
        backgroundColor: 'var(--tierra-dark)', padding: '40px 24px',
        textAlign: 'center', color: 'rgba(255,248,240,0.6)', fontSize: 14, marginTop: 40,
      }}>
        <span style={{ fontSize: 24 }}>🏺</span>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#FFF8F0', margin: '8px 0 16px' }}>TribuArte</p>
        <p>Comunidad de artesanos venezolanos y latinoamericanos</p>
        <p style={{ marginTop: 12, fontSize: 12 }}>© 2026 TribuArte. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
