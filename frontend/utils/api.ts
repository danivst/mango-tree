const API_URL = 'http://localhost:3000/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

export async function apiGet<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { Authorization: `Bearer ${getToken()}` || '' },
  });

  if (!res.ok) throw new Error(`GET ${endpoint} failed: ${res.status}`);
  return res.json();
}

export async function apiPost<T>(endpoint: string, data: any): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}` || '',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error(`POST ${endpoint} failed: ${res.status}`);
  return res.json();
}

export async function apiPut<T>(endpoint: string, data: any): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}` || '',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error(`PUT ${endpoint} failed: ${res.status}`);
  return res.json();
}