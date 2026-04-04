export const safeJson = async (response: Response) => {
  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    // If it's "Invalid credentials", it's a failed login attempt, not a session expiry
    if (data.error === 'Invalid credentials') {
      throw new Error(data.error);
    }

    // Otherwise, it's likely a session expiry or missing token
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    
    throw new Error(data.error || 'Session expired. Please login again.');
  }
  
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
};

export const api = {
  get: (url: string, token?: string) => 
    fetch(url, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    }).then(safeJson),
    
  post: (url: string, data: any, token?: string) =>
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data)
    }).then(safeJson),

  put: (url: string, data: any, token?: string) =>
    fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data)
    }).then(safeJson),

  delete: (url: string, token?: string) =>
    fetch(url, {
      method: 'DELETE',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    }).then(safeJson)
};
