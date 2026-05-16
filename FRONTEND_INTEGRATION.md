Integración frontend — notas rápidas

1) Variables de entorno (ejemplos):
   NEXT_PUBLIC_SUPABASE_URL=https://<your>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

2) Conexión a Supabase (ejemplo JS):
   import { createClient } from '@supabase/supabase-js'
   const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)

3) Llamadas al backend:
   - Rutas de auth en backend: `/api/auth/*` — usa `fetch` o `axios` apuntando al `FRONTEND_URL`/origin apropiado.

4) Desarrollo local:
   - Añadir las `NEXT_PUBLIC_*` en el `.env` del proyecto frontend.
