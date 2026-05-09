import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers for stability
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { path, method, body } = req.body;
  
  // Use VITE_ prefix as it's already in the user's .env.local
  const API_KEY = process.env.VITE_TEABLE_API_KEY;

  if (!API_KEY) {
    console.error('Missing Teable API Key in Environment');
    return res.status(500).json({ error: 'Database configuration missing' });
  }

  try {
    // Teable API usually expects /api/v1 prefix if not provided
    const targetPath = path.startsWith('/v1') ? path : `/v1${path}`;
    const url = `https://api.teable.io${targetPath}`;
    
    console.log(`Proxying ${method} to ${url}`);

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: (method !== 'GET' && method !== 'DELETE' && body) ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Proxy Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
