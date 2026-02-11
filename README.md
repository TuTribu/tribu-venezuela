# TribuArte - Marketplace de Artesanías

## Setup rápido

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar Supabase
- Ir a [supabase.com](https://supabase.com) y abrir tu proyecto
- Ir a **SQL Editor** y pegar todo el contenido de `supabase-setup.sql` → ejecutar
- Ir a **Storage** → crear bucket llamado `productos` → marcarlo como **Public**
- Ir a **Settings > API** → copiar la URL y la anon key

### 3. Configurar variables de entorno
```bash
cp .env.local.example .env.local
```
Editar `.env.local` con tu URL y key de Supabase.

### 4. Correr en local
```bash
npm run dev
```
Abrir [http://localhost:3000](http://localhost:3000)

### 5. Deploy en Vercel
- Subir este repo a GitHub
- En [vercel.com](https://vercel.com) → "Add New Project" → seleccionar el repo
- Agregar las variables de entorno (NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY)
- Deploy
- Conectar dominio tribuarte.com en Settings > Domains

## Estructura
```
app/
  page.tsx                    → Tienda pública (homepage)
  producto/[id]/page.tsx      → Detalle de producto
  checkout/[id]/page.tsx      → Checkout (Pago Móvil / Zelle)
  login/page.tsx              → Login artesano
  registro/page.tsx           → Registro artesano
  dashboard/page.tsx          → Dashboard del artesano
  dashboard/productos/nuevo/  → Agregar producto
components/
  Navbar.tsx, ProductCard.tsx, StatusBadge.tsx
lib/
  supabase.ts                 → Cliente y tipos
```

## Métodos de pago
- 📱 Pago Móvil (Venezuela)
- 💵 Zelle (USD)
- Los datos de pago de cada artesano se guardan en su perfil
