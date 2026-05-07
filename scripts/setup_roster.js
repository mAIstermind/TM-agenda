import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const API_KEY = process.env.VITE_TEABLE_API_KEY;
const TABLE_ID = process.env.VITE_TEABLE_TABLE_ID;

const DEFAULT_ROLES = [
  'Toastmaster of the Day',
  'Sergeant at Arms',
  'General Evaluator',
  'Grammarian',
  'Timer',
  'Ah Counter',
  'Table Topics Master',
  'Speaker #1',
  'Speech Evaluator #1',
  'Speaker #2',
  'Speech Evaluator #2',
  'Speaker #3',
  'Speech Evaluator #3',
  'VP Education'
];

async function setup() {
  if (!API_KEY || !TABLE_ID) {
    console.error("Missing API_KEY or TABLE_ID in .env.local");
    process.exit(1);
  }

  const baseUrl = 'https://app.teable.io/api';
  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  };

  try {
    console.log("1. Fetching current roster...");
    const fetchRes = await fetch(`${baseUrl}/table/${TABLE_ID}/record`, { headers });
    const data = await fetchRes.json();
    if (!data.records) throw new Error(`Fetch failed: ${JSON.stringify(data)}`);
    const currentIds = data.records.map(r => r.id);

    if (currentIds.length > 0) {
      console.log(`2. Deleting ${currentIds.length} current records...`);
      const params = currentIds.map(id => `recordIds=${id}`).join('&');
      const deleteRes = await fetch(`${baseUrl}/table/${TABLE_ID}/record?${params}`, {
        method: 'DELETE',
        headers
      });
      if (!deleteRes.ok) throw new Error(`Delete failed: ${await deleteRes.text()}`);
    }

    console.log("3. Adding default 14 roles (without Order field)...");
    const records = DEFAULT_ROLES.map((role) => ({
      fields: {
        Role: role,
        Status: 'Vacant'
      }
    }));

    const createRes = await fetch(`${baseUrl}/table/${TABLE_ID}/record`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ records })
    });

    if (!createRes.ok) throw new Error(`Create failed: ${await createRes.text()}`);
    
    console.log("SUCCESS: Roster initialized with standard defaults.");
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}

setup();
