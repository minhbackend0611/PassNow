const fetch = require('node-fetch');

async function testOSM() {
  const query = 'Đại học Bách Khoa TP.HCM';
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=vn&limit=5`;
  
  const res = await fetch(url);
  const data = await res.json();
  
  console.log('Results for:', query);
  data.forEach((d, i) => {
    console.log(`${i+1}. ${d.display_name} (Lat: ${d.lat}, Lng: ${d.lon})`);
  });
}

testOSM();
