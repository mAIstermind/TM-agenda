const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function probeFields() {
  const API_KEY = "teable_acccY85FhoJcGhif2Ie_Db86CELH6FVnpl32GMbq3w04lfC+ypY8HlncsH/ro1E=";
  const TABLE_ID = "tblDuv3Ddyl8DNHojBL";
  const MEMBERS_TABLE_ID = "tblDYLMQO3BfzVZftsz";

  async function getTableRecords(tId, name) {
    console.log(`\n--- Probing fields for ${name} (${tId}) ---`);
    const res = await fetch(`https://app.teable.ai/api/table/${tId}/record`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    const data = await res.json();
    const allFields = new Set();
    (data.records || []).forEach(r => {
      Object.keys(r.fields || {}).forEach(f => allFields.add(f));
    });
    console.log("Unique populated fields found:", Array.from(allFields));
    if (data.records && data.records.length > 0) {
      console.log("Sample record fields:", JSON.stringify(data.records[0].fields, null, 2));
    }
  }

  await getTableRecords(TABLE_ID, "Roster Table");
  await getTableRecords(MEMBERS_TABLE_ID, "Members Table");
}

probeFields();
