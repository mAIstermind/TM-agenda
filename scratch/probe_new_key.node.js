const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function probe() {
  const API_KEY = "teable_acccY85FhoJcGhif2Ie_Db86CELH6FVnpl32GMbq3w04lfC+ypY8HlncsH/ro1E=";
  const TABLE_ID = "tblDuv3Ddyl8DNHojBL";
  
  console.log("Probing Teable with new key...");
  
  try {
    const response = await fetch(`https://app.teable.ai/api/table/${TABLE_ID}/record`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    console.log(`Status: ${response.status}`);
    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Probe Error:", err.message);
  }
}

probe();
