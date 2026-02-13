# 🏺 TribuArte — Mercado de Artesanías

Marketplace para artesanos venezolanos y latinoamericanos. Construido con Next.js 14 + Supabase.

## Requisitos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com) (gratis)

## Instalación

```bash
npm install
```

## Configurar Supabase

### 1. Crear proyecto en Supabase

Ve a [supabase.com](https://supabase.com) y crea un proyecto nuevo.

### 2. Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aquí
```

Encontrarás estos valores en: **Settings → API** en tu dashboard de Supabase.

### 3. Base de datos

Ve a **SQL Editor** en Supabase y ejecuta el contenido completo de `supabase-setup.sql`.

### 4. Storage (IMPORTANTE — las fotos de productos dependen de esto)

El script SQL intenta crear el bucket automáticamente. Si falla:

1. Ve a **Storage** en el dashboard de Supabase
2. Click en **New Bucket**
3. Nombre: `productos`
4. **Marca la casilla "Public bucket"** ← muy importante
5. Click en **Create bucket**

Luego ve a **Storage → Policies** del bucket `productos` y verifica que existan las políticas creadas por el SQL. Si no, créalas manualmente:

- **SELECT**: Permitir a todos (`true`)
- **INSERT**: `bucket_id = 'productos' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text`
- **UPDATE**: Misma condición que INSERT
- **DELETE**: Misma condición que INSERT

### 5. Auth

Ve a **Authentication → Settings** y asegúrate de que:
- Email/password esté habilitado
- "Confirm email" esté deshabilitado (para desarrollo)

## Ejecutar

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Estructura

```
app/
  page.tsx              → Home / catálogo público
  login/                → Login de artesanos
  registro/             → Registro de artesanos
  producto/[id]/        → Detalle de producto (galería de imágenes)
  checkout/[id]/        → Proceso de compra
  dashboard/            → Panel del artesano
    productos/nuevo/    → Crear producto (upload de fotos)
components/
  Navbar.tsx
  ProductCard.tsx
  StatusBadge.tsx
lib/
  supabase.ts           → Cliente + tipos
```

## Funcionalidades

- **Compradores**: navegar catálogo, ver producto, comprar con Pago Móvil o Zelle
- **Artesanos**: registro, subir productos con hasta 5 fotos (compresión automática), gestionar pedidos, ver ventas
- **Imágenes**: upload con drag & drop, compresión client-side, preview, reordenamiento, límite de 5

## Solución de problemas

### "Las fotos no se suben"
1. Verifica que el bucket `productos` exista en Supabase Storage
2. Verifica que sea **público**
3. Verifica que las políticas de Storage estén configuradas
4. Revisa la consola del navegador para ver el error específico

### "Error al crear producto"
1. Verifica que ejecutaste el SQL completo
2. Verifica que las RLS policies estén activas
3. Asegúrate de estar logueado como artesano
