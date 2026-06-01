const supabase = require('./supabase');

const BUCKET = 'avatars';

function hashColors(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palettes = [
    ['#6366f1','#4338ca'], ['#8b5cf6','#6d28d9'], ['#a855f7','#7c3aed'],
    ['#3b82f6','#1d4ed8'], ['#06b6d4','#0891b2'], ['#14b8a6','#0d9488'],
    ['#22c55e','#16a34a'], ['#84cc16','#65a30d'], ['#eab308','#ca8a04'],
    ['#f97316','#ea580c'], ['#78716c','#57534e'], ['#64748b','#475569']
  ];
  return palettes[Math.abs(hash) % palettes.length];
}

function generateSvg(nombre, apellido) {
  const seed = (nombre || '') + (apellido || '');
  const [c1, c2] = hashColors(seed || 'default');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" gradientTransform="rotate(45)"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g)"/></svg>`;
}

async function uploadAvatar(nombre, apellido, userId) {
  const svg = generateSvg(nombre, apellido);
  const fileName = `${userId}/avatar.svg`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, Buffer.from(svg), {
      contentType: 'image/svg+xml',
      upsert: true
    });

  if (error) throw error;

  const { data, error: signedError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(fileName, 315360000);

  if (signedError) throw signedError;
  return data.signedUrl;
}

module.exports = { uploadAvatar };
