const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function verifyUpdates() {
  const API_KEY = "teable_acccY85FhoJcGhif2Ie_Db86CELH6FVnpl32GMbq3w04lfC+ypY8HlncsH/ro1E=";
  const TABLE_ID = "tblDuv3Ddyl8DNHojBL";
  const MEMBERS_TABLE_ID = "tblDYLMQO3BfzVZftsz";

  async function testPatch(tId, recordId, fields, name) {
    console.log(`\nTesting ${name} PATCH on ${recordId}...`);
    const payload = {
      records: [{ id: recordId, fields }],
      fieldKeyType: 'name',
      typecast: true
    };
    const res = await fetch(`https://app.teable.ai/api/table/${tId}/record`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    if (!res.ok) console.log("Error details:", JSON.stringify(data, null, 2));
    else console.log("Success! Updated records count:", data.records?.length);
  }

  // 1. Get first member
  const mRes = await fetch(`https://app.teable.ai/api/table/${MEMBERS_TABLE_ID}/record`, { headers: { 'Authorization': `Bearer ${API_KEY}` } });
  const mData = await mRes.json();
  if (mData.records?.[0]) {
    // Testing saving profile (Pathway, Level)
    await testPatch(MEMBERS_TABLE_ID, mData.records[0].id, { Pathway: "Dynamic Leadership", Level: 2 }, "Profile Save");
  }

  // 2. Get first roster role
  const rRes = await fetch(`https://app.teable.ai/api/table/${TABLE_ID}/record`, { headers: { 'Authorization': `Bearer ${API_KEY}` } });
  const rData = await rRes.json();
  if (rData.records?.[0]) {
    // Testing claiming role (Name, Status, Pathway, Level, Project Number)
    await testPatch(TABLE_ID, rData.records[0].id, { Name: "Mike Berry", Status: "Confirmed", Pathway: "Dynamic Leadership", Level: 2, "Project Number": 3 }, "Claim Role");
  }
}

verifyUpdates();
