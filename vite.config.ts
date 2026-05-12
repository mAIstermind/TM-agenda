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
          target: 'https://app.teable.ai',
          changeOrigin: true,
          bypass: async (req, res) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const { path: teablePath, method, body: teableBody } = JSON.parse(body || '{}');
                  
                  const tryRequest = async () => {
                    const targetUrl = `https://app.teable.ai/api${teablePath}`;
                    const hasBody = method !== 'GET' && method !== 'DELETE' && teableBody;
                    
                    return fetch(targetUrl, {
                      method,
                      headers: {
                        'Authorization': `Bearer ${env.VITE_TEABLE_API_KEY}`,
                        'Content-Type': hasBody ? 'application/json' : undefined,
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'application/json'
                      },
                      body: hasBody ? JSON.stringify(teableBody) : undefined,
                    });
                  };

                  let response = await tryRequest();
                  
                  const responseText = await response.text();
                  let data;
                  try {
                    data = JSON.parse(responseText);
                  } catch (e) {
                    data = { raw: responseText };
                  }

                  if (!res.headersSent) {
                    res.writeHead(response.status, { 
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*',
                      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                    });
                    res.end(JSON.stringify(data));
                  }
                } catch (err: any) {
                  console.error('Local Proxy Error:', err);
                  if (!res.headersSent) {
                    res.writeHead(500);
                    res.end(JSON.stringify({ error: 'Local Proxy Error', details: err.message }));
                  }
                }
              });
              return false; // bypass standard proxy
            }
          }
        }
      }
    },
  };
});
