'use client';

const config: Record<string, { bg: string; color: string; label: string }> = {
  pendiente: { bg: '#FFF3E0', color: '#E65100', label: 'Pendiente' },
  confirmado: { bg: '#E8F5E9', color: '#2E7D32', label: 'Confirmado' },
  enviado: { bg: '#E3F2FD', color: '#1565C0', label: 'Enviado' },
  entregado: { bg: '#F3E5F5', color: '#7B1FA2', label: 'Entregado' },
  active: { bg: '#E8F5E9', color: '#2E7D32', label: 'Activo' },
};

export default function StatusBadge({ status }: { status: string }) {
  const c = config[status] || config.pendiente;
  return (
    <span style={{
      display: 'inline-block', padding: '4px 12px', borderRadius: 20,
      fontSize: 12, fontWeight: 600, backgroundColor: c.bg, color: c.color,
    }}>
      {c.label}
    </span>
  );
}
