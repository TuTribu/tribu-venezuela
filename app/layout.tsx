import './globals.css';

export const metadata = {
  title: 'TribuArte - Mercado de Artesanías',
  description: 'Artesanía venezolana y latinoamericana, hecha con pasión y tradición',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
