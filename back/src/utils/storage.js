const supabase = require('./supabase');

const TEN_YEARS = 315360000;

async function uploadTo(bucket, file, folder) {
  const ext = file.originalname.split('.').pop() || 'bin';
  const fileName = `${folder}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });

  if (error) throw error;

  const { data, error: signedError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(fileName, TEN_YEARS);

  if (signedError) throw signedError;
  return data.signedUrl;
}

module.exports = { uploadTo };
