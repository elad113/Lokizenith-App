type ApiResponse<T> = { data: T };
async function request<T>(method: string, url: string, body?: unknown): Promise<ApiResponse<T>> {
  const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const text = await response.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
  if (!response.ok) throw new Error(data?.message || data?.error || ('Request failed (' + response.status + ')'));
  return { data };
}
export const api = { get: <T = any>(url: string) => request<T>('GET', url), post: <T = any>(url: string, body?: unknown) => request<T>('POST', url, body) };
