const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'
export const imageUrl = (path) => {
  if (!path) return "";

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const base = BASE.replace(/\/+$/, "");
  const imagePath = path.startsWith("/") ? path : `/${path}`;

  return `${base}${imagePath}`;
};
export async function api(path, options = {}) {
  const r = await fetch(BASE + path, options)
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data.error || 'Request failed')
  return data
}
export const authHeaders = () => {
  const token = localStorage.getItem('ekantika_token')
  return token ? {Authorization: `Bearer ${token}`} : {}
}
