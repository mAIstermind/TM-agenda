const API_KEY = "teable_accmiNUYnV1I2ehS06k_x7WbxrMZs4NkXsQDm4LDr3oK8R8KggTM2SBl3QlZp6E=";
const BASE_ID = "bseWyzvKpnowhtg44Aj";
const ROSTER_TABLE_ID = "tblz1zqDdR3bI7D3dph";
const MEMBERS_TABLE_ID = "tbl1asPIen5amAQJaaq";

async function test(baseUrl, path) {
    const url = `${baseUrl}/api${path}`;
    console.log(`Testing: ${url}`);
    try {
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log(`Data:`, text.substring(0, 500));
        return res.status;
    } catch (e) {
        console.log(`Error: ${e.message}`);
        return 500;
    }
}

async function run() {
    console.log("--- PROBING TEABLE API ---");
    
    console.log("\n1. Testing Members Table (GET):");
    await test('https://app.teable.ai', `/table/${MEMBERS_TABLE_ID}/record?take=1`);
    
    console.log("\n2. Testing Roster Table (GET):");
    await test('https://app.teable.ai', `/table/${ROSTER_TABLE_ID}/record?take=1`);
    
    console.log("\n3. Testing Roster Table with Base ID (GET):");
    await test('https://app.teable.ai', `/base/${BASE_ID}/table/${ROSTER_TABLE_ID}/record?take=1`);

    console.log("\n4. Testing Fallback Endpoint (api.teable.io):");
    await test('https://api.teable.io/v1', `/table/${ROSTER_TABLE_ID}/record?take=1`);
}

run();
