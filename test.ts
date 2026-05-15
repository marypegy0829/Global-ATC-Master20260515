import fs from 'fs';

async function test() {
  const formData = new FormData();
  formData.append('countryCode', 'US');
  formData.append('aircraftType', 'A320');
  formData.append('outputMode', 'bilingual');
  
  // create dummy file
  const blob = new Blob(["test audio"], { type: "audio/webm" });
  formData.append('audioFiles', blob, "test.webm");

  try {
    const res = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: formData
    });
    
    console.log(res.status);
    console.log(await res.text());
  } catch (e) {
    console.error(e);
  }
}

test();
