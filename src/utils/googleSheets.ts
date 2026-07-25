// Google Sheets API utilities for FlowVerge

export interface SpreadsheetInfo {
  id: string;
  name: string;
  webViewLink: string;
  createdTime?: string;
  modifiedTime?: string;
}

/**
 * Creates a new Google Spreadsheet in the user's Google Drive.
 */
export async function createGoogleSpreadsheet(
  accessToken: string,
  title: string,
  sheetTitle: string = 'Sheet1'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [{ properties: { title: sheetTitle } }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 403 && errorText.includes('SERVICE_DISABLED')) {
      throw new Error('Google Sheets API is disabled in your Google Cloud Project. Please enable it in the Google Cloud Console.');
    }
    throw new Error(`Failed to create Google Spreadsheet (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}`
  };
}

/**
 * Updates range of cell values in a Google Spreadsheet.
 */
export async function updateGoogleSpreadsheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: (string | number | boolean | null)[][]
): Promise<any> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 403 && errorText.includes('SERVICE_DISABLED')) {
      throw new Error('Google Sheets API is disabled in your Google Cloud Project. Please enable it in the Google Cloud Console.');
    }
    throw new Error(`Failed to update Google Spreadsheet values (${response.status}): ${errorText}`);
  }

  return await response.json();
}

/**
 * Reads values from a range in a Google Spreadsheet.
 */
export async function getGoogleSpreadsheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string = 'Sheet1!A1:Z500'
): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 403 && errorText.includes('SERVICE_DISABLED')) {
      throw new Error('Google Sheets API is disabled in your Google Cloud Project. Please enable it in the Google Cloud Console.');
    }
    throw new Error(`Failed to read Google Spreadsheet values (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.values || [];
}

/**
 * Lists user's Google Spreadsheets from Google Drive.
 */
export async function listUserSpreadsheets(accessToken: string): Promise<SpreadsheetInfo[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink,createdTime,modifiedTime)&pageSize=25&orderBy=modifiedTime%20desc`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 403 && errorText.includes('SERVICE_DISABLED')) {
      throw new Error('Google Drive API is disabled in your Google Cloud Project. Please enable it in the Google Cloud Console for project 392103184698.');
    }
    throw new Error(`Failed to list Google Spreadsheets from Drive (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Formats FlowVerge Sites data for Google Sheets export.
 */
export function formatSitesForSheets(sites: any[]): (string | number)[][] {
  const headers = [
    'Site ID',
    'Custom Site ID',
    'Project ID',
    'Site Name',
    'District',
    'Client',
    'Client Site ID',
    'Location',
    'Stage',
    'Supervisor',
    'Vendor',
    'Created Date'
  ];

  const rows = sites.map(site => [
    site.id || '',
    site.site_custom_id || '',
    site.project_id || '',
    site.name || '',
    site.district || '',
    site.client || '',
    site.client_site_id || '',
    site.location || '',
    site.stage_name || site.current_stage_id || '',
    site.supervisor_name || '',
    site.vendor_name || '',
    site.created_at ? new Date(site.created_at).toLocaleDateString() : ''
  ]);

  return [headers, ...rows];
}

/**
 * Formats FlowVerge Warehouse Inventory for Google Sheets export.
 */
export function formatWarehouseForSheets(items: any[]): (string | number)[][] {
  const headers = [
    'Item ID',
    'Material Name',
    'SKU / Code',
    'Category',
    'Current Stock',
    'Unit',
    'Min Threshold',
    'Warehouse Location',
    'Status'
  ];

  const rows = items.map(item => [
    item.id || '',
    item.name || '',
    item.code || '',
    item.category || '',
    item.current_stock ?? 0,
    item.unit || '',
    item.min_stock ?? 0,
    item.location || '',
    (item.current_stock ?? 0) <= (item.min_stock ?? 0) ? 'Low Stock Warning' : 'Healthy'
  ]);

  return [headers, ...rows];
}

/**
 * Extracts spreadsheet ID from a full Google Sheets URL or raw ID string.
 */
export function extractSpreadsheetId(urlOrId: string): string {
  const trimmed = urlOrId.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}
