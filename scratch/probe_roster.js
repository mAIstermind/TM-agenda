const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function probeRosterSchema() {
  const API_KEY = "teable_acccY85FhoJcGhif2Ie_Db86CELH6FVnpl32GMbq3w04lfC+ypY8HlncsH/ro1E=";
  const TABLE_ID = "tblDuv3Ddyl8DNHojBL";

  const res = await fetch(`https://app.teable.ai/api/table/${TABLE_ID}/record`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  const data = await res.json();
  if (!data.records || data.records.length === 0) return console.log("No roster records found");
  
  const recordId = data.records[0].id;
  console.log(`Testing PATCH on roster record ${recordId}`);

  const patchPayload = {
    records: [{
      id: recordId,
      fields: { "NonexistentColumnTest": "Should Fail" }
    }],
    fieldKeyType: 'name',
    typecast: true
  };

  const patchRes = await fetch(`https://app.teable.ai/api/table/${TABLE_ID}/record`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(patchPayload)
  });

  const patchData = await patchRes.json();
  console.log("Roster Table Schema info:", JSON.stringify(patchData.data?.details?.availableFieldKeys || patchData, null, 2));
}

probeRosterSchema();
