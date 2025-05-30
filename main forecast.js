
let map = L.map('map').setView([13.75, 100.5], 9);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let marker;

function setTracking() {
  map.once('click', async function(e) {
    if (marker) map.removeLayer(marker);
    marker = L.marker(e.latlng).addTo(map);
    await fetch("https://forms-forecast-server.onrender.com/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: e.latlng.lat, lng: e.latlng.lng }),
    });
    alert("เริ่มติดตามฝน ณ พิกัดที่เลือกแล้ว");
  });
}

async function getRainForecast() {
  const res = await fetch("https://forms-forecast-server.onrender.com/forecast");
  const data = await res.json();

  if (data.error) {
    document.getElementById("forecastInfo").innerText = "ยังไม่มีข้อมูลพยากรณ์";
    return;
  }

  const msg = `ฝนความแรง: ${data.rain_level}\nเวลาฝนจะถึง: ${new Date(data.expected_arrival).toLocaleTimeString()}\nอีก ${data.minutes_until_arrival} นาที`;
  document.getElementById("forecastInfo").innerText = msg;
}

setInterval(getRainForecast, 5 * 60 * 1000); // เช็กทุก 5 นาที
