type ApiResponse<T> = { data: T };

function configuredApiBaseUrl() {
  let saved = '';
  try { saved = JSON.parse(localStorage.getItem('lokizenith.server') || '""') as string; } catch { /* Ignore invalid local settings. */ }
  return (saved || import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
}

function apiUrl(url: string) {
  const API_BASE_URL = configuredApiBaseUrl();
  if (/^https?:\/\//i.test(url)) return url;
  const path = url.startsWith('/') ? url : '/' + url;
  return API_BASE_URL ? API_BASE_URL + path : path;
}

async function request<T>(method: string, url: string, body?: unknown): Promise<ApiResponse<T>> {
  let response: Response;
  try {
    response = await fetch(apiUrl(url), {
      method,
      headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new Error(configuredApiBaseUrl()
      ? 'Cannot reach the Lokizenith API server. Check the backend URL and that the server is running.'
      : 'The Lokizenith API server is not configured. Enter the deployed backend URL in Settings → API & connection.');
  }

  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  if (contentType.includes('text/html') || /^\s*(<!doctype html|<html[\s>])/i.test(text)) {
    throw new Error('The API returned an HTML page instead of JSON. This usually means the backend URL is missing or points to the frontend. Configure VITE_API_BASE_URL to the deployed Lokizenith backend URL.');
  }

  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch {
    throw new Error('The API returned an invalid response instead of JSON (HTTP ' + response.status + ').');
  }
  if (!response.ok) throw new Error(data?.message || data?.error || ('Request failed (' + response.status + ')'));
  return { data };
}

export const api = {
  get: <T = any>(url: string) => request<T>('GET', url),
  post: <T = any>(url: string, body?: unknown) => request<T>('POST', url, body),
};
