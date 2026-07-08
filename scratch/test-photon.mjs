async function testPhoton() {
  const query = 'Đại học Tôn Đức Thắng';
  // Use bbox for Vietnam
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&bbox=102.14,8.56,109.47,23.39&limit=5`;
  
  const res = await fetch(url);
  const data = await res.json();
  
  console.log('Results for:', query);
  data.features.forEach((f, i) => {
    const props = f.properties;
    const name = props.name || props.street || 'Unknown';
    const address = [props.city, props.state, props.country].filter(Boolean).join(', ');
    console.log(`${i+1}. ${name} - ${address} (Lat: ${f.geometry.coordinates[1]}, Lng: ${f.geometry.coordinates[0]})`);
  });
}

testPhoton();
