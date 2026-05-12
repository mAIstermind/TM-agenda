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
  const gram = data.records.find(r => r.fields.Role === 'Grammarian');
  const tmod = data.records.find(r => r.fields.Role === 'ToastMaster of the Day' || r.fields.Role === 'Toastmaster of the Day');

  if (gram && tmod) {
    console.log('Found roles:', gram.id, tmod.id);
    const patchRes = await fetch(`https://app.teable.ai/api/table/${TABLE_ID}/record`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fieldKeyType: 'name',
        typecast: true,
        records: [
          {
            id: gram.id,
            fields: {
              "Word of the Day": "Benevolence",
              "Word Meaning": "Disposition to do good",
              "Word Example": "He was known for it."
            }
          },
          {
            id: tmod.id,
            fields: {
              "Date": "2026-05-14",
              "Session": "133",
              "Theme": "Friendship, How to make them happen",
              "Announcements": "We meet every Thursday at 7pm prompt. Please aim to arrive for 6:45pm"
            }
          }
        ]
      })
    });
    
    console.log('PATCH Response:', patchRes.status);
  }
}

check();
