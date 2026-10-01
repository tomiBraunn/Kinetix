// Análisis de IA generativa sobre las métricas de una sesión, vía NVIDIA
// NIM (API compatible con OpenAI chat/completions). No hay SDK de por
// medio: es un solo endpoint, fetch alcanza.

const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
// ponytail: modelo fijo con salida configurable si hace falta cambiarlo
// sin tocar código (catálogo de modelos de NVIDIA NIM puede variar).
const MODEL = process.env.NVIDIA_MODEL || 'google/gemma-4-31b-it';

const JUEGO_LABEL = {
  surf: 'Surf',
  flamenco: 'Flamenco Challenge',
  estrellas: 'Alcanzá la estrella',
};

function resumenJuego(juego, datos) {
  if (!datos) return '';
  if (juego === 'surf') return `Atrapó ${datos.puntos ?? '?'} peces en ${datos.duracion_segundos ?? '?'}s.`;
  if (juego === 'flamenco') return `Mejor tiempo en equilibrio: ${datos.mejor_tiempo_segundos ?? '?'}s, en ${datos.intentos ?? '?'} intentos.`;
  if (juego === 'estrellas') return `Alcanzó ${datos.estrellas_alcanzadas ?? '?'} estrellas con ${datos.movimientos_pies ?? '?'} movimientos de pies (debía mantenerlos quietos).`;
  return '';
}

function edadDesde(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const nacimiento = new Date(fechaNacimiento);
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const cumplioEsteAño = hoy.getMonth() > nacimiento.getMonth()
    || (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() >= nacimiento.getDate());
  if (!cumplioEsteAño) edad -= 1;
  return edad > 0 ? edad : null;
}

function armarPrompt(sesion) {
  const m = sesion.metricas_sesion;
  const juego = JUEGO_LABEL[sesion.juego] ?? sesion.juego;
  const paciente = sesion.pacientes;
  const edad = edadDesde(paciente?.fecha_nacimiento);

  const lineas = [
    `Juego: ${juego}.`,
    resumenJuego(sesion.juego, m?.datos_ia_raw),
  ];
  if (m?.estabilidad_score != null) lineas.push(`Estabilidad (0-100, torso quieto): ${m.estabilidad_score}.`);
  if (m?.rango_movimiento_avg != null) lineas.push(`Rango de movimiento promedio: ${m.rango_movimiento_avg}°.`);
  if (m?.rango_movimiento_max != null) lineas.push(`Rango de movimiento máximo: ${m.rango_movimiento_max}°.`);
  if (edad != null) lineas.push(`Edad del paciente: ${edad} años.`);
  if (paciente?.tipo_lesion) lineas.push(`Lesión/motivo de rehabilitación: ${paciente.tipo_lesion}.`);

  return [
    'Sos un asistente que ayuda a un kinesiólogo a interpretar los resultados',
    'de una sesión de rehabilitación gamificada para adultos mayores.',
    'Con los datos de abajo, analizá el desempeño del paciente en esta sesión',
    'puntual (qué dicen los números sobre su equilibrio y rango de movimiento).',
    'Respondé SOLO con un objeto JSON válido, sin markdown ni bloques de código,',
    'en español, con estas claves (todas strings, salvo "areas"):',
    '- "fortaleza": una oración sobre lo que hizo bien.',
    '- "a_mejorar": una oración sobre qué debería mejorar.',
    '- "proxima_meta": una oración con una meta concreta para la próxima sesión.',
    '- "sugerencia": una o dos oraciones con qué trabajar en la próxima sesión.',
    '- "areas": array de 2 etiquetas cortas (máx. 3 palabras cada una) de las',
    '  zonas o habilidades a trabajar.',
    '- "mensaje": una o dos oraciones motivacionales dirigidas al paciente, en',
    '  segunda persona (voseo rioplatense), tono cálido.',
    'No inventes datos que no te di; si un dato no está, no lo menciones.',
    '',
    'Datos de la sesión:',
    ...lineas.filter(Boolean),
  ].join('\n');
}

const CLAVES_TEXTO = ['fortaleza', 'a_mejorar', 'proxima_meta', 'sugerencia', 'mensaje'];

// Si el modelo devolvió el JSON pedido (a veces lo envuelve en ```json), lo
// normaliza y lo re-serializa limpio; si no, deja el texto tal cual (se
// muestra como párrafo plano y el front cae a sus textos por defecto).
function normalizarRespuesta(texto) {
  const bloque = texto.match(/\{[\s\S]*\}/)?.[0];
  if (!bloque) return texto;
  try {
    const d = JSON.parse(bloque);
    if (!d || typeof d !== 'object' || Array.isArray(d)) return texto;
    const limpio = {};
    for (const clave of CLAVES_TEXTO) {
      if (typeof d[clave] === 'string' && d[clave].trim()) limpio[clave] = d[clave].trim();
    }
    if (Array.isArray(d.areas)) {
      limpio.areas = d.areas.filter((a) => typeof a === 'string' && a.trim()).map((a) => a.trim()).slice(0, 2);
    }
    return Object.keys(limpio).length ? JSON.stringify(limpio) : texto;
  } catch {
    return texto;
  }
}

// Lo que se guarda en metricas_sesion.analisis_ia puede ser el JSON de arriba
// o, en sesiones analizadas antes de este cambio, un párrafo plano. Devuelve
// siempre { analisis: <párrafo para mostrar>, detalle: <objeto | null> }.
function formatearAnalisis(texto) {
  if (!texto) return { analisis: null, detalle: null };
  try {
    const d = JSON.parse(texto);
    if (d && typeof d === 'object' && !Array.isArray(d)) {
      const analisis = [d.fortaleza, d.a_mejorar, d.sugerencia].filter(Boolean).join(' ');
      return { analisis: analisis || null, detalle: d };
    }
  } catch {
    // texto plano de cuando el prompt pedía un solo párrafo
  }
  return { analisis: texto, detalle: null };
}

// Devuelve el texto del análisis, o null si no hay API key / falla el modelo.
// Nunca tira: el resultado (null) hace que el caller caiga al comentario
// por reglas que ya existe como fallback.
async function generarAnalisis(sesion) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    console.warn('[nvidiaAI] NVIDIA_API_KEY no configurada, sin análisis de IA.');
    return null;
  }

  try {
    const res = await fetch(NVIDIA_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: armarPrompt(sesion) }],
        temperature: 0.5,
        max_tokens: 1500,
      }),
    });

    if (!res.ok) {
      console.error('[nvidiaAI] NVIDIA respondió', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const texto = data?.choices?.[0]?.message?.content?.trim();
    if (!texto) {
      console.error('[nvidiaAI] respuesta sin contenido:', JSON.stringify(data).slice(0, 500));
      return null;
    }
    return normalizarRespuesta(texto);
  } catch (err) {
    console.error('[nvidiaAI] fallo llamando al modelo:', err.message);
    return null;
  }
}

module.exports = { generarAnalisis, formatearAnalisis };
