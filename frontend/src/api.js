const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

async function request(path, options = {}) {
  const url = `${API_BASE.replace(/\/$/, '')}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || res.statusText || 'Request failed');
  return data;
}

export async function checkDeps() {
  return request('/api/check-deps');
}

export async function ingestText(text) {
  return request('/api/ingest', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function ingestFile(path) {
  return request('/api/ingest', {
    method: 'POST',
    body: JSON.stringify({ path }),
  });
}

export async function clearIndex() {
  return request('/api/clear-index', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function ingestUrl(url) {
  return request('/api/ingest-url', {
    method: 'POST',
    body: JSON.stringify({ url: url.trim() }),
  });
}

export async function ingestUpload(file) {
  const url = `${API_BASE.replace(/\/$/, '')}/api/ingest-upload`;
  const formData = new FormData();
  formData.append('file', file);

  // First upload can take 1–2 min while the embedding model loads; use a long timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') throw new Error('Upload is taking too long. First upload can take 1–2 minutes—try again and wait.');
    throw e;
  }
  clearTimeout(timeoutId);

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || res.statusText || 'Request failed');
  return data;
}

export async function chat(message) {
  return request('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}
