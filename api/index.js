// Vercel detecta cualquier archivo bajo api/ como función serverless.
// Esta queda mapeada a la ruta fija /api — el rewrite en vercel.json
// ("/api/:match* -> /api") manda ACÁ todo lo que empiece con /api/,
// sea cual sea la cantidad de segmentos, y Vercel preserva el path
// original en el request (req.url = /api/sesiones/123/eventos, etc.),
// así que el propio Express de back/server.js sigue ruteando igual
// que en local.
//
// (Antes esto era api/[...path].js, un catch-all dinámico de Vercel:
// solo matcheaba un segmento después de /api/ — /api/auth andaba,
// /api/auth/login y /api/sesiones/123 daban 404 de la plataforma sin
// llegar nunca a Express. El rewrite explícito no depende de esa
// semántica ambigua.)
module.exports = require('../back/server.js');
