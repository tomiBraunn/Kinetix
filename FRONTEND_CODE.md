Guía rápida para desarrollador frontend

Variables de entorno necesarias (cliente):
- NEXT_PUBLIC_SUPABASE_URL: URL de Supabase
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: clave pública (anon)

Endpoints de interés:
- Autenticación: POST /api/auth/login, /api/auth/register (revisar rutas en backend)
- Health: GET /health

Recomendaciones:
- No exponer `SERVICE_KEY` en frontend.
- Usar la `anon`/publishable key con el SDK de Supabase en el cliente.
