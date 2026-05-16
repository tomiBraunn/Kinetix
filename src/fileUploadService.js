// fileUploadService.js
// Helpers para subir archivos con FormData. Usa apiFetch que maneja FormData correctamente.
import apiFetch from './apiFetch';

export async function uploadTo(path, file, fieldName = 'file', extra = {}) {
  const fd = new FormData();
  fd.append(fieldName, file);
  Object.entries(extra).forEach(([k, v]) => fd.append(k, v));
  const resp = await apiFetch(path, { method: 'POST', body: fd });
  return resp.data;
}

export default { uploadTo };
