const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function probeDelete() {
  const API_KEY = "teable_acccY85FhoJcGhif2Ie_Db86CELH6FVnpl32GMbq3w04lfC+ypY8HlncsH/ro1E=";
  const TABLE_ID = "tblDuv3Ddyl8DNHojBL";
  const RECORD_ID = "rec5yh5tlgMtOnxlZv1"; // One of the IDs from the probe
  
  console.log(`Probing DELETE for record ${RECORD_ID}...`);
  
  try {
    const url = `https://app.teable.ai/api/table/${TABLE_ID}/record?recordIds=${RECORD_ID}`;
    const response = await fetch(url, {
      method: 'DELETE',
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

probeDelete();
