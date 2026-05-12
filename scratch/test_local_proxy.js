const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testLocalProxy() {
  console.log("Testing local proxy at http://localhost:3000/api/teable-proxy");
  
  try {
    const payload = {
      path: "/table/tblDYLMQO3BfzVZftsz/record",
      method: "GET"
    };
    
    const response = await fetch("http://localhost:3000/api/teable-proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`Status: ${response.status}`);
    const data = await response.json();
    console.log(`Response length:`, data.records ? data.records.length : data);
  } catch (e) {
    console.error("Test error:", e.message);
  }
}

testLocalProxy();
