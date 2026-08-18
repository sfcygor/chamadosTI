const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  let res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && path !== '/auth/login' && path !== '/auth/refresh') {
    const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (refreshRes.ok) {
      res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    } else {
      localStorage.removeItem('atendeti_user');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw new Error('Não autorizado');
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(error.message || `Erro ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, senha: string) =>
    request<{ user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    }),

  logout: () => request<any>('/auth/logout', { method: 'POST' }),

  getMe: () => request<any>('/auth/me'),
};

// ─── Tickets ──────────────────────────────────────────────────────────────────
export const ticketsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/tickets${qs}`);
  },

  stats: () => request<any>('/tickets/stats'),

  history: (params?: Record<string, string>) => {
    // filter out undefined or empty values
    const cleanParams = Object.entries(params || {}).reduce((acc, [k, v]) => {
      if (v) acc[k] = v;
      return acc;
    }, {} as Record<string, string>);
    const qs = new URLSearchParams(cleanParams).toString();
    return request<any>(`/tickets/history${qs ? '?' + qs : ''}`);
  },

  get: (id: string) => request<any>(`/tickets/${id}`),

  create: (data: any) =>
    request<any>('/tickets', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    request<any>(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  assume: (id: string) =>
    request<any>(`/tickets/${id}/assume`, { method: 'POST' }),

  delete: (id: string) =>
    request<any>(`/tickets/${id}`, { method: 'DELETE' }),
};

// ─── Comments ─────────────────────────────────────────────────────────────────
export const commentsApi = {
  list: (ticketId: string) => request<any[]>(`/tickets/${ticketId}/comments`),

  create: (ticketId: string, data: { texto: string; isNotaInterna?: boolean }) =>
    request<any>(`/tickets/${ticketId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ─── Categories ───────────────────────────────────────────────────────────────
export const categoriesApi = {
  list: () => request<any[]>('/categories'),
  listAdmin: () => request<any[]>('/categories/admin'),

  create: (data: any) =>
    request<any>('/categories', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    request<any>(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<any>(`/categories/${id}`, { method: 'DELETE' }),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: () => request<any[]>('/users'),
  listAgents: () => request<any[]>('/users/agents'),

  get: (id: string) => request<any>(`/users/${id}`),

  create: (data: any) =>
    request<any>('/users', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    request<any>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reportsApi = {
  summary: (periodo: string = '30') =>
    request(`/reports/summary?periodo=${periodo}`),
  exportCsv: (periodo: string = '30') => {
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - parseInt(periodo));
    
    // Create query params manually since request() parses JSON
    return fetch(`${BASE_URL}/reports/export?dataInicio=${dataInicio.toISOString()}`, {
      method: 'GET',
      credentials: 'include',
    }).then(res => res.blob());
  },
  exportJson: (periodo: string = '30') => {
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - parseInt(periodo));
    return request<any[]>(`/reports/export-json?dataInicio=${dataInicio.toISOString()}`);
  }
};

// ─── Uploads ──────────────────────────────────────────────────────────────────
export const uploadsApi = {
  upload: async (ticketId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    let res = await fetch(`${BASE_URL}/tickets/${ticketId}/attachments`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (res.status === 401) {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
      if (refreshRes.ok) {
        res = await fetch(`${BASE_URL}/tickets/${ticketId}/attachments`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
      } else {
        localStorage.removeItem('atendeti_user');
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        throw new Error('Não autorizado');
      }
    }

    if (!res.ok) throw new Error('Falha ao enviar arquivo');
    return res.json();
  },
};

// ─── Audit ────────────────────────────────────────────────────────────────────
export const auditApi = {
  list: (params?: Record<string, string>) => {
    // filter out undefined or empty values
    const cleanParams = Object.entries(params || {}).reduce((acc, [k, v]) => {
      if (v) acc[k] = v;
      return acc;
    }, {} as Record<string, string>);
    const qs = new URLSearchParams(cleanParams).toString();
    return request<any>(`/audit${qs ? '?' + qs : ''}`);
  }
};

