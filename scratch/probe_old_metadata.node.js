const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function probeMetadata() {
  const API_KEY = "teable_accmiNUYnV1I2ehS06k_x7WbxrMZs4NkXsQDm4LDr3oK8R8KggTM2SBl3QlZp6E="; // Old key
  const BASE_ID = "bseWyzvKpnowhtg44Aj";
  
  console.log("Probing OLD Base Metadata...");
  
  try {
    const response = await fetch(`https://app.teable.ai/api/base/${BASE_ID}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    const data = await response.json();
    console.log("Base Info:", JSON.stringify(data, null, 2));
    
    const tablesResponse = await fetch(`https://app.teable.ai/api/base/${BASE_ID}/table`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    const tablesData = await tablesResponse.json();
    console.log("Tables in this base:", JSON.stringify(tablesData, null, 2));
    
  } catch (err) {
    console.error("Probe Error:", err.message);
  }
}

probeMetadata();
