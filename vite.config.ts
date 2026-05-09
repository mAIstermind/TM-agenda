import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/',
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        // This is a dummy proxy config to allow us to use the 'configure' hook
        // to implement the actual Silent Tunnel logic locally.
        '/api/teable-proxy': {
          target: 'https://api.teable.io',
          changeOrigin: true,
          bypass: async (req, res) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const { path: teablePath, method, body: teableBody } = JSON.parse(body || '{}');
                  
                  const tryRequest = async (baseUrl: string) => {
                    const targetUrl = `${baseUrl}/v1${teablePath.startsWith('/v1') ? teablePath.substring(3) : teablePath}`;
                    return fetch(targetUrl, {
                      method,
                      headers: {
                        'Authorization': `Bearer ${env.VITE_TEABLE_API_KEY}`,
                        'Content-Type': 'application/json',
                      },
                      body: (method !== 'GET' && method !== 'DELETE') ? JSON.stringify(teableBody) : undefined,
                    });
                  };

                  let response = await tryRequest('https://api.teable.io');
                  if (!response.ok && (response.status === 404 || response.status >= 500)) {
                    response = await tryRequest('https://app.teable.ai/api');
                  }
                  
                  const data = await response.json();
                  res.writeHead(response.status, { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                  });
                  res.end(JSON.stringify(data));
                } catch (err) {
                  console.error('Local Proxy Error:', err);
                  res.writeHead(500);
                  res.end(JSON.stringify({ error: 'Local Proxy Error' }));
                }
              });
              return true; // bypass standard proxy
            }
          }
        }
      }
    },
  };
});
