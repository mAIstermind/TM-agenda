const API_KEY = "teable_accmiNUYnV1I2ehS06k_x7WbxrMZs4NkXsQDm4LDr3oK8R8KggTM2SBl3QlZp6E=";
const BASE_ID = "bseWyzvKpnowhtg44Aj";
const ROSTER_TABLE_ID = "tblz1zqDdR3bI7D3dph";
const MEMBERS_TABLE_ID = "tbl1asPIen5amAQJaaq";

async function getTableFields(tableId) {
  const url = `https://api.teable.io/v1/base/${BASE_ID}/table/${tableId}`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  const data = await response.json();
  console.log(`\n--- FIELDS FOR ${tableId} ---`);
  if (data.fields) {
    data.fields.forEach(f => {
      console.log(`Name: "${f.name}" | ID: "${f.id}" | DB Name: "${f.dbFieldName}"`);
    });
  } else {
    console.log("Error or No Fields:", JSON.stringify(data));
  }
}

async function run() {
  await getTableFields(ROSTER_TABLE_ID);
  await getTableFields(MEMBERS_TABLE_ID);
}

run();
