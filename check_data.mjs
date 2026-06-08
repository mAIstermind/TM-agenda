import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2].replace(/"/g, '').replace(/'/g, '');
});

const TABLE_ID = env['VITE_TEABLE_TABLE_ID'];
const API_KEY = env['VITE_TEABLE_API_KEY'];

async function check() {
  const res = await fetch(`https://app.teable.ai/api/table/${TABLE_ID}/record`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  const data = await res.json();
  const tmod = data.records.find(r => r.fields.Role.toLowerCase().replace(/\s+/g, '') === 'toastmasteroftheday');
  console.log('ToastMaster of the Day fields:');
  console.log(tmod?.fields);
}

check();
