'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, Artesano, Producto, Pedido } from '@/lib/supabase';
import StatusBadge from '@/components/StatusBadge';

export default function DashboardPage() {
  const router = useRouter();
  const [artesano, setArtesano] = useState<Artesano | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [activeTab, setActiveTab] = useState('inicio');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkAuth(); }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: profile } = await supabase.from('artesanos').select('*').eq('id', user.id).single();
    if (profile) setArtesano(profile);

    const { data: prods } = await supabase.from('productos').select('*').eq('artesano_id', user.id).order('created_at', { ascending: false });
    if (prods) setProductos(prods);

    const { data: ords } = await supabase.from('pedidos').select('*, productos(nombre, imagenes)').eq('artesano_id', user.id).order('created_at', { ascending: false });
    if (ords) setPedidos(ords);

    setLoading(false);
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    await supabase.from('pedidos').update({ estado: newStatus }).eq('id', orderId);
    setPedidos(pedidos.map(p => p.id === orderId ? { ...p, estado: newStatus as any } : p));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  async function deleteProducto(productId: string) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    const { error } = await supabase.from('productos').delete().eq('id', productId);
    if (!error) {
      setProductos(productos.filter(p => p.id !== productId));
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Cargando dashboard...</div>;

  const totalVentas = pedidos.filter(o => ['confirmado', 'enviado', 'entregado'].includes(o.estado)).reduce((s, o) => s + o.monto, 0);
  const pendientes = pedidos.filter(o => o.estado === 'pendiente').length;

  const sideItems = [
    { id: 'inicio', label: 'Inicio', icon: '🏠' },
    { id: 'productos', label: 'Mis Productos', icon: '📦' },
    { id: 'pedidos', label: 'Pedidos', icon: '📋' },
    { id: 'ventas', label: 'Ventas', icon: '📊' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--arena-light)', position: 'relative', overflow: 'hidden' }}>

      {/* MOBILE TOP BAR */}
      <div className="mobile-topbar" style={{
        display: 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        backgroundColor: 'var(--tierra-dark)', padding: '12px 16px',
        alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', color: '#FFF8F0', cursor: 'pointer', fontSize: 24 }}>
          {sidebarOpen ? '✕' : '☰'}
        </button>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#FFF8F0' }}>🏺 TribuArte</span>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--coral), var(--oro))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 700, fontSize: 12 }}>
          {artesano?.nombre?.charAt(0) || 'A'}
        </div>
      </div>

      {/* OVERLAY */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} style={{ display: 'none', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 249 }} />}

      {/* SIDEBAR */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={{
        width: 240, backgroundColor: 'var(--tierra-dark)', padding: '24px 0',
        display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, bottom: 0,
        zIndex: 250, transition: 'transform 0.3s ease', left: 0,
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 24 }}>🏺</span>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#FFF8F0' }}>TribuArte</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--coral), var(--oro))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 700, fontSize: 14 }}>
              {artesano?.nombre?.charAt(0) || 'A'}
            </div>
            <div>
              <p style={{ color: '#FFF8F0', fontSize: 13, fontWeight: 600 }}>{artesano?.nombre}</p>
              <p style={{ color: 'rgba(255,248,240,0.5)', fontSize: 11 }}>{artesano?.nombre_tienda}</p>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '16px 0' }}>
          {sideItems.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }} style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%',
              padding: '12px 20px', border: 'none', cursor: 'pointer',
              backgroundColor: activeTab === item.id ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: activeTab === item.id ? '#FFF8F0' : 'rgba(255,248,240,0.6)',
              fontSize: 14, fontWeight: activeTab === item.id ? 600 : 400,
              textAlign: 'left', borderLeft: activeTab === item.id ? '3px solid var(--oro)' : '3px solid transparent',
            }}>
              <span>{item.icon}</span> {item.label}
              {item.id === 'pedidos' && pendientes > 0 && (
                <span style={{ marginLeft: 'auto', backgroundColor: 'var(--rojo)', color: '#FFF', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>{pendientes}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', color: 'rgba(255,248,240,0.5)', cursor: 'pointer', fontSize: 13, width: '100%' }}>
            🚪 Cerrar sesión
          </button>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,248,240,0.5)', fontSize: 13, marginTop: 10, textDecoration: 'none' }}>
            🏠 Ver tienda
          </Link>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="dashboard-main" style={{ flex: 1, marginLeft: 240, padding: '32px 32px' }}>

        {/* INICIO */}
        {activeTab === 'inicio' && (
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, marginBottom: 4 }}>
              ¡Hola, {artesano?.nombre?.split(' ')[0]}! 👋
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 28 }}>Resumen de tu tienda</p>

            <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
              {[
                { label: 'Ventas totales', value: `$${totalVentas.toFixed(2)}`, sub: 'este mes', color: 'var(--selva-light)', icon: '💰' },
                { label: 'Pedidos pendientes', value: pendientes, sub: 'requieren acción', color: 'var(--rojo)', icon: '📦' },
                { label: 'Productos activos', value: productos.filter(p => p.activo).length, sub: 'en tu tienda', color: 'var(--tierra)', icon: '🏺' },
                { label: 'Total pedidos', value: pedidos.length, sub: 'histórico', color: 'var(--oro)', icon: '📋' },
              ].map((stat, i) => (
                <div key={i} style={{
                  backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: 20,
                  boxShadow: 'var(--shadow-sm)', borderTop: `3px solid ${stat.color}`,
                }}>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>{stat.label}</p>
                  <p style={{ fontSize: 28, fontWeight: 700 }}>{stat.value}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* Recent orders */}
            <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 16 }}>Pedidos recientes</h2>
              {pedidos.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', padding: 20, textAlign: 'center' }}>Aún no tienes pedidos</p>
              ) : (
                pedidos.slice(0, 5).map(order => (
                  <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600 }}>{order.numero_pedido} · {order.productos?.nombre}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{order.nombre_comprador} · {order.metodo_pago === 'pago_movil' ? '📱 Pago Móvil' : '💵 Zelle'}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontWeight: 700 }}>${order.monto.toFixed(2)}</span>
                      <StatusBadge status={order.estado} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* PRODUCTOS */}
        {activeTab === 'productos' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28 }}>Mis Productos</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{productos.length} productos</p>
              </div>
              <Link href="/dashboard/productos/nuevo" style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 20px', borderRadius: 'var(--radius)',
                backgroundColor: 'var(--tierra)', color: '#FFF',
                fontSize: 14, fontWeight: 600, textDecoration: 'none',
              }}>
                + Nuevo producto
              </Link>
            </div>

            {productos.length === 0 ? (
              <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: 40, textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>🏺</p>
                <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Aún no tienes productos</p>
                <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Agrega tu primer producto para empezar a vender</p>
                <Link href="/dashboard/productos/nuevo" style={{
                  padding: '12px 24px', borderRadius: 'var(--radius)',
                  backgroundColor: 'var(--tierra)', color: '#FFF',
                  fontSize: 14, fontWeight: 600, textDecoration: 'none',
                }}>Agregar producto</Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {productos.map(product => (
                  <div key={product.id} className="product-row" style={{
                    display: 'flex', gap: 16, backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius)', padding: 16, boxShadow: 'var(--shadow-sm)', alignItems: 'center',
                  }}>
                    <img src={product.imagenes?.[0] || 'https://via.placeholder.com/80'} alt="" style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{product.nombre}</h3>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{product.categoria} · {product.stock} en stock</p>
                    </div>
                    <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--tierra)' }}>${product.precio.toFixed(2)}</p>
                    <StatusBadge status={product.activo ? 'active' : 'pendiente'} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => deleteProducto(product.id)} style={{
                        padding: '8px 12px', borderRadius: 6, border: '1px solid var(--rojo)',
                        backgroundColor: 'transparent', color: 'var(--rojo)',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}>🗑️ Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PEDIDOS */}
        {activeTab === 'pedidos' && (
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, marginBottom: 24 }}>Gestión de Pedidos</h1>

            {pedidos.length === 0 ? (
              <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: 40, textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>No tienes pedidos todavía</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {pedidos.map(order => (
                  <div key={order.id} style={{
                    backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)',
                    padding: 20, boxShadow: 'var(--shadow-sm)',
                    borderLeft: order.estado === 'pendiente' ? '4px solid var(--rojo)' : '4px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--tierra)' }}>{order.numero_pedido}</span>
                          <StatusBadge status={order.estado} />
                          <span style={{
                            padding: '3px 10px', borderRadius: 6, fontSize: 12,
                            backgroundColor: order.metodo_pago === 'zelle' ? '#E3F2FD' : '#FFF3E0',
                            color: order.metodo_pago === 'zelle' ? '#1565C0' : '#E65100',
                          }}>{order.metodo_pago === 'pago_movil' ? '📱 Pago Móvil' : '💵 Zelle'}</span>
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 600 }}>{order.productos?.nombre}</p>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          {order.nombre_comprador} · {order.telefono_comprador}
                        </p>
                        {order.referencia_pago && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ref: {order.referencia_pago}</p>}
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(order.created_at).toLocaleDateString('es')}</p>
                      </div>
                      <p style={{ fontSize: 22, fontWeight: 700 }}>${order.monto.toFixed(2)}</p>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {order.estado === 'pendiente' && (
                        <>
                          <button onClick={() => updateOrderStatus(order.id, 'confirmado')} style={{
                            padding: '8px 16px', borderRadius: 6, border: 'none',
                            backgroundColor: 'var(--selva-light)', color: '#FFF',
                            fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          }}>✓ Confirmar pago</button>
                          <a href={`https://wa.me/${order.telefono_comprador.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{
                            padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)',
                            backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)',
                            fontSize: 13, textDecoration: 'none',
                          }}>💬 Contactar</a>
                        </>
                      )}
                      {order.estado === 'confirmado' && (
                        <button onClick={() => updateOrderStatus(order.id, 'enviado')} style={{
                          padding: '8px 16px', borderRadius: 6, border: 'none',
                          backgroundColor: '#1565C0', color: '#FFF',
                          fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        }}>🚚 Marcar como enviado</button>
                      )}
                      {order.estado === 'enviado' && (
                        <button onClick={() => updateOrderStatus(order.id, 'entregado')} style={{
                          padding: '8px 16px', borderRadius: 6, border: 'none',
                          backgroundColor: '#7B1FA2', color: '#FFF',
                          fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        }}>✓ Marcar como entregado</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VENTAS */}
        {activeTab === 'ventas' && (
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, marginBottom: 24 }}>Resumen de Ventas</h1>

            <div className="sales-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Ingresos totales</p>
                <p style={{ fontSize: 36, fontWeight: 700, color: 'var(--selva-light)' }}>${totalVentas.toFixed(2)}</p>
              </div>
              <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Total de pedidos</p>
                <p style={{ fontSize: 36, fontWeight: 700, color: 'var(--tierra)' }}>{pedidos.length}</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{pedidos.filter(o => o.estado === 'entregado').length} entregados</p>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, marginBottom: 16 }}>Historial</h3>
              {pedidos.map(order => (
                <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600 }}>{order.productos?.nombre}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(order.created_at).toLocaleDateString('es')} · {order.nombre_comprador}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>${order.monto.toFixed(2)}</span>
                    <StatusBadge status={order.estado} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
