import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/',
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'teable-proxy-plugin',
        configureServer(server) {
          server.middlewares.use('/api/teable-proxy', (req, res, next) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const { path: teablePath, method, body: teableBody } = JSON.parse(body || '{}');
                  
                  const targetUrl = `https://app.teable.ai/api${teablePath}`;
                  const hasBody = method !== 'GET' && method !== 'DELETE' && teableBody;
                  
                  const response = await fetch(targetUrl, {
                    method,
                    headers: {
                      'Authorization': `Bearer ${env.VITE_TEABLE_API_KEY}`,
                      'Content-Type': hasBody ? 'application/json' : undefined,
                      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                      'Accept': 'application/json'
                    },
                    body: hasBody ? JSON.stringify(teableBody) : undefined,
                  });
                  
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
            } else if (req.method === 'OPTIONS') {
               res.writeHead(200, {
                 'Access-Control-Allow-Origin': '*',
                 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                 'Access-Control-Allow-Headers': 'Content-Type, Authorization'
               });
               res.end();
            } else {
              next();
            }
          });

          server.middlewares.use('/api/ai-proxy', (req, res, next) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const response = await fetch('https://agenda.inspiringspeakerspdc.com/api/ai-proxy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body
                  });
                  const data = await response.text();
                  res.writeHead(response.status, { 'Content-Type': 'application/json' });
                  res.end(data);
                } catch (err: any) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
            } else {
              next();
            }
          });
        }
      }
    ],
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
    },
  };
});
