// Análisis de IA generativa sobre las métricas de una sesión, vía NVIDIA
// NIM (API compatible con OpenAI chat/completions). No hay SDK de por
// medio: es un solo endpoint, fetch alcanza.

const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
// ponytail: modelo fijo con salida configurable si hace falta cambiarlo
// sin tocar código (catálogo de modelos de NVIDIA NIM puede variar).
const MODEL = process.env.NVIDIA_MODEL || 'z-ai/glm-5.3-flash';

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
  return edad;
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
    'Con los datos de abajo, escribí un análisis breve (3-4 oraciones, en',
    'español, tono profesional y cercano) sobre el desempeño del paciente en',
    'esta sesión puntual: qué dicen los números sobre su equilibrio y rango',
    'de movimiento, y una sugerencia concreta para la próxima sesión si',
    'corresponde. No inventes datos que no te di. No uses viñetas ni títulos,',
    'un solo párrafo.',
    '',
    'Datos de la sesión:',
    ...lineas.filter(Boolean),
  ].join('\n');
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
    return texto;
  } catch (err) {
    console.error('[nvidiaAI] fallo llamando al modelo:', err.message);
    return null;
  }
}

module.exports = { generarAnalisis };
