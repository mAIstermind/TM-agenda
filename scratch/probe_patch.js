const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function probePatchBehavior() {
  const API_KEY = "teable_acccY85FhoJcGhif2Ie_Db86CELH6FVnpl32GMbq3w04lfC+ypY8HlncsH/ro1E=";
  const MEMBERS_TABLE_ID = "tblDYLMQO3BfzVZftsz";

  // Let's get the first member ID
  const res = await fetch(`https://app.teable.ai/api/table/${MEMBERS_TABLE_ID}/record`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  const data = await res.json();
  if (!data.records || data.records.length === 0) return console.log("No members found");
  
  const memberId = data.records[0].id;
  console.log(`Testing PATCH on member ${data.records[0].fields.Name} (${memberId})`);

  // Test updating an existing field AND a likely nonexistent field
  const patchPayload = {
    records: [{
      id: memberId,
      fields: {
        "Committee Role": data.records[0].fields["Committee Role"] || "Member",
        "NonexistentColumnTest": "Should Fail or Ignore"
      }
    }],
    fieldKeyType: 'name',
    typecast: true
  };

  const patchRes = await fetch(`https://app.teable.ai/api/table/${MEMBERS_TABLE_ID}/record`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(patchPayload)
  });

  console.log(`PATCH Status: ${patchRes.status}`);
  const patchData = await patchRes.json();
  console.log("PATCH Response:", JSON.stringify(patchData, null, 2));
}

probePatchBehavior();
