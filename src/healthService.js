import apiFetch from './apiFetch';

export async function getHealth() {
  const resp = await apiFetch('/health', { method: 'GET' });
  return resp.data;
}

export default { getHealth };
