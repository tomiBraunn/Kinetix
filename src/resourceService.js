// resourceService.js
// Factory para crear servicios REST genéricos (list/get/create/update/patch/delete/upload)
import apiFetch from './apiFetch';

const buildQuery = (params) => {
  if (!params) return '';
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) v.forEach(val => qp.append(k, val));
    else qp.append(k, v);
  });
  const s = qp.toString();
  return s ? `?${s}` : '';
};

export function createResourceService(basePath) {
  const list = async (params) => {
    const resp = await apiFetch(`${basePath}${buildQuery(params)}`, { method: 'GET' });
    return resp.data;
  };

  const get = async (id) => {
    const resp = await apiFetch(`${basePath}/${id}`, { method: 'GET' });
    return resp.data;
  };

  const create = async (payload) => {
    const resp = await apiFetch(`${basePath}`, { method: 'POST', body: payload });
    return resp.data;
  };

  const update = async (id, payload) => {
    const resp = await apiFetch(`${basePath}/${id}`, { method: 'PUT', body: payload });
    return resp.data;
  };

  const patch = async (id, payload) => {
    const resp = await apiFetch(`${basePath}/${id}`, { method: 'PATCH', body: payload });
    return resp.data;
  };

  const remove = async (id) => {
    const resp = await apiFetch(`${basePath}/${id}`, { method: 'DELETE' });
    return resp.data;
  };

  // upload acepta id relativo (ej: '123/upload') o ruta absoluta empezando con '/'
  const upload = async (idOrPath, formData) => {
    const path = String(idOrPath).startsWith('/') ? `${basePath}${idOrPath}` : `${basePath}/${idOrPath}`;
    const resp = await apiFetch(path, { method: 'POST', body: formData });
    return resp.data;
  };

  return { list, get, create, update, patch, remove, upload };
}

export default createResourceService;
