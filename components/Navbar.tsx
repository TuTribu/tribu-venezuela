'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 24px', backgroundColor: 'var(--tierra-dark)',
      position: 'sticky', top: 0, zIndex: 100,
      boxShadow: '0 2px 20px rgba(44,24,16,0.3)',
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <span style={{ fontSize: 28 }}>🏺</span>
        <span style={{
          fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700,
          color: '#FFF8F0', letterSpacing: '0.5px',
        }}>TribuArte</span>
      </Link>
      <Link href="/login" style={{
        padding: '8px 20px', borderRadius: 8, border: '1.5px solid rgba(255,255,255,0.3)',
        backgroundColor: 'transparent', color: '#FFF8F0', textDecoration: 'none',
        fontSize: 14, fontWeight: 500,
      }}>
        Soy Artesano
      </Link>
    </nav>
  );
}
