let map, userMarker, pinMarker;
let watchId, forecastTimer, notifyTimers = [];
const confirmBtn = document.getElementById("confirm-btn");
const resetBtn = document.getElementById("reset-btn");
const message = document.getElementById("message");
const forecastResult = document.getElementById("forecast-result");

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 13.7563, lng: 100.5018 },
    zoom: 11,
  });
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(message);

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      map.setCenter({ lat: coords.latitude, lng: coords.longitude });
      userMarker = new google.maps.Marker({ position: { lat: coords.latitude, lng: coords.longitude }, map, title: "ตำแหน่งคุณ" });
      promptPin();
    });
  } else {
    promptPin();
  }

  map.addListener("click", (e) => selectPin(e.latLng));
}

function promptPin() {
  message.textContent = "แตะที่แผนที่เพื่อปักหมุดตำแหน่งที่ต้องการพยากรณ์";
}

function selectPin(latLng) {
  if (pinMarker) pinMarker.setMap(null);
  pinMarker = new google.maps.Marker({ position: latLng, map });
  message.textContent = `คุณเลือก: ${latLng.lat().toFixed(5)}, ${latLng.lng().toFixed(5)}`;
  confirmBtn.style.display = "inline-block";
  resetBtn.style.display = "inline-block";
}

confirmBtn.addEventListener("click", () => {
  const pos = pinMarker.getPosition();
  confirmBtn.style.display = resetBtn.style.display = "none";
  analyzeForecast(pos.lat(), pos.lng());
});

resetBtn.addEventListener("click", () => {
  pinMarker?.setMap(null);
  pinMarker = null;
  forecastResult.textContent = "";
  promptPin();
});

function analyzeForecast(lat, lng) {
  message.textContent = "กำลังคำนวณพยากรณ์จากเรดาร์...";
  fetch("https://forms-forecast-server.onrender.com/track", { method: "POST", headers: {'Content-Type':'application/json'}, body: JSON.stringify({ lat, lon: lng }) })
    .then(() => fetch("https://forms-forecast-server.onrender.com/forecast"))
    .then(res => res.json())
    .then(data => {
      const t = new Date(data.expected_arrival);
      forecastResult.innerHTML = `
        จะมีฝนระดับ <b>${data.rain_level}</b><br>
        ถึงภายใน <b>${data.minutes_until_arrival}</b> นาที (ราว <b>${t.toLocaleTimeString()}</b>)<br>
        คาดว่าจะตกนาน <b>${data.duration_minutes || 'ไม่ระบุ'} นาที</b><br>
        แจ้งเตือนล่วงหน้าหรือไม่?
        <button id="notify-yes">✅ ใช่</button>
        <button id="notify-no">❌ ไม่</button>
      `;
      document.getElementById("notify-yes").onclick = () => setupNotifications(data.expected_arrival);
      document.getElementById("notify-no").onclick = () => message.textContent = "แสดงแผนภาพเรดาร์";
    });
}

function setupNotifications(arrivalISO) {
  const arrival = new Date(arrivalISO);
  [30, 15, 5].forEach(minBefore => {
    const notifyTime = new Date(arrival.getTime() - minBefore*60000);
    const delta = notifyTime - Date.now();
    if (delta > 0) {
      const timer = setTimeout(() => {
        new Notification("FonMa เตือนฝน", { body: `ฝนจะตกใน ${minBefore} นาที`, icon: "/logo.png" });
      }, delta);
      notifyTimers.push(timer);
    }
  });
  forecastResult.textContent += `<br>ระบบแจ้งเตือนตั้งแล้วทาง Notifications`;
}

if ("Notification" in window) Notification.requestPermission();
window.initMap = initMap;