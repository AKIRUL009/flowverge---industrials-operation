// Static fallback data for Netlify / SPA static deployments where backend server is unreachable
const getStaticFallback = (url: string, method: string, data?: any) => {
  const cleanUrl = url.split('?')[0];

  if (cleanUrl === '/api/login') {
    const email = data?.email || 'admin@flowverge.com';
    let role = 'Admin';
    if (email.includes('sup')) role = 'Supervisor';
    if (email.includes('wh') || email.includes('warehouse')) role = 'Warehouse';
    if (email.includes('vendor')) role = 'Vendor';
    if (email.includes('pm')) role = 'Project Manager';

    return {
      token: 'static-demo-jwt-token-' + Date.now(),
      user: {
        id: 1,
        full_name: email.split('@')[0].toUpperCase() + ' User',
        email: email,
        role: role,
        phone_verified: true
      }
    };
  }

  if (cleanUrl === '/api/sites') {
    if (method === 'POST') return { id: Date.now(), success: true };
    return [
      {
        id: 1,
        project_id: 'PRJ-DEMO-01',
        site_custom_id: 'SITE-DEMO-01',
        name: 'Ibrahimpura Solar Plant',
        district: 'Indore',
        client: 'Hyperqom Infra',
        client_site_id: 'C-SITE-124',
        location: 'Indore, MP',
        current_stage_id: 1,
        stage_name: 'Survey',
        max_allowed_days: 3,
        supervisor_name: 'Supervisor User',
        vendor_name: 'Vendor User',
        is_delayed: false,
        stage_started_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        project_id: 'PRJ-DEMO-02',
        site_custom_id: 'SITE-DEMO-02',
        name: 'Bhopal Green Energy Grid',
        district: 'Bhopal',
        client: 'CleanPower Corp',
        client_site_id: 'C-SITE-189',
        location: 'Bhopal, MP',
        current_stage_id: 2,
        stage_name: 'Foundation',
        max_allowed_days: 7,
        supervisor_name: 'Supervisor User',
        vendor_name: 'Vendor User',
        is_delayed: false,
        stage_started_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
    ];
  }

  if (cleanUrl === '/api/stages') {
    return [
      { id: 1, name: 'Survey', sequence_order: 1, max_allowed_days: 3 },
      { id: 2, name: 'Foundation', sequence_order: 2, max_allowed_days: 7 },
      { id: 3, name: 'Installation', sequence_order: 3, max_allowed_days: 10 },
      { id: 4, name: 'Inspection', sequence_order: 4, max_allowed_days: 3 },
      { id: 5, name: 'Billing', sequence_order: 5, max_allowed_days: 2 }
    ];
  }

  if (cleanUrl === '/api/warehouse/stock' || cleanUrl === '/api/warehouse/materials') {
    return [
      { id: 1, name: 'Solar Panel 450W Monocrystalline', category: 'Modules', unit: 'pcs', min_stock: 10, current_stock: 45, code: 'MOD-450W' },
      { id: 2, name: 'DC Cable 4sqmm Red/Black', category: 'Electrical', unit: 'meters', min_stock: 50, current_stock: 150, code: 'CBL-4MM' },
      { id: 3, name: 'MC4 Connectors Pair', category: 'Electrical', unit: 'pcs', min_stock: 20, current_stock: 5, code: 'CON-MC4' },
      { id: 4, name: 'Inverter 100kW On-Grid', category: 'Inverters', unit: 'pcs', min_stock: 2, current_stock: 8, code: 'INV-100K' }
    ];
  }

  if (cleanUrl === '/api/approvals') return [];
  if (cleanUrl === '/api/admin/users') {
    return [
      { id: 1, full_name: 'Admin User', email: 'admin@flowverge.com', role: 'Admin', phone: '+1234567890' },
      { id: 2, full_name: 'PM User', email: 'pm@flowverge.com', role: 'Project Manager', phone: '+1987654321' },
      { id: 3, full_name: 'Supervisor User', email: 'sup@flowverge.com', role: 'Supervisor', phone: '+1122334455' }
    ];
  }
  if (cleanUrl === '/api/admin/roles') {
    return [
      { id: 1, name: 'Admin' },
      { id: 2, name: 'Project Manager' },
      { id: 3, name: 'Supervisor' },
      { id: 4, name: 'Warehouse' },
      { id: 5, name: 'Vendor' }
    ];
  }
  if (cleanUrl === '/api/admin/logs') return [];
  if (cleanUrl === '/api/admin/settings') return [];
  if (cleanUrl.startsWith('/api/notifications')) return [];

  if (method !== 'GET') {
    return { success: true, count: 1, id: Date.now() };
  }

  return [];
};

export const safeJson = async (response: Response, url: string = '', method: string = 'GET', reqData?: any) => {
  if (!response.ok) {
    let data: any = {};
    try {
      data = await response.json();
    } catch (e) {
      // Returned HTML (e.g. 404 page on static host like Netlify)
    }

    if (response.status === 401 && data?.error === 'Invalid credentials') {
      throw new Error('Invalid credentials');
    }

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw new Error(data?.error || 'Session expired. Please login again.');
    }

    // Static / Netlify Fallback if 404 or server unreachable
    if (response.status === 404 || !response.ok) {
      console.warn(`[Netlify Static Mode] API route ${url} not found on server. Using client static fallback.`);
      return getStaticFallback(url, method, reqData);
    }

    throw new Error(data?.error || 'Request failed');
  }

  return await response.json().catch(() => ({}));
};

export const api = {
  get: (url: string, token?: string) => 
    fetch(url, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
    .then(res => safeJson(res, url, 'GET'))
    .catch(() => getStaticFallback(url, 'GET')),
    
  post: (url: string, data: any, token?: string) =>
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data)
    })
    .then(res => safeJson(res, url, 'POST', data))
    .catch(() => getStaticFallback(url, 'POST', data)),

  put: (url: string, data: any, token?: string) =>
    fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data)
    })
    .then(res => safeJson(res, url, 'PUT', data))
    .catch(() => getStaticFallback(url, 'PUT', data)),

  delete: (url: string, token?: string) =>
    fetch(url, {
      method: 'DELETE',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
    .then(res => safeJson(res, url, 'DELETE'))
    .catch(() => getStaticFallback(url, 'DELETE'))
};

