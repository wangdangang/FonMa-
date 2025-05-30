const radarIframe = document.getElementById("radar-iframe");
const toggleBtn = document.getElementById("toggle-btn");
const notifyBtn = document.getElementById("notify-btn");
const trackBtn = document.getElementById("track-btn");
const confirmBtn = document.getElementById("confirm-btn");
const forecastResult = document.getElementById("forecast-result");
const mapContainer = document.getElementById("map");
const overlay = document.getElementById("radar-overlay");

let map, marker;
let selectedPosition = null;
let animationRunning = true;
let notifyInterval = null;

// --- โหลด iframe radar ---
function loadRadar() {
  radarIframe.src = "https://weather.bangkok.go.th/radar/RadarAnimationNk.aspx";
  radarIframe.style.width = "100%";
  radarIframe.style.height = "80vh";
  overlay.style.display = "none"; // เริ่มต้นไม่มี overlay
}

function toggleAnimation() {
  animationRunning = !animationRunning;
  overlay.style.display = animationRunning ? "none" : "block";
  toggleBtn.textContent = animationRunning ? "⏸️ หยุด" : "▶️ เล่น";
}

// --- โหลด Google Maps และปักหมุด ---
function loadMap(position) {
  const { lat, lon } = position;
  const mapOptions = {
    center: { lat, lng: lon },
    zoom: 11,
  };
  map = new google.maps.Map(mapContainer, mapOptions);
  marker = new google.maps.Marker({
    position: { lat, lng: lon },
    map,
    draggable: true,
    title: "พิกัดที่ต้องการติดตาม",
  });
  selectedPosition = { lat, lon };
  confirmBtn.style.display = "block";
}

// --- ใช้ตำแหน่งผู้ใช้ ---
function getUserLocation(callback) {
  if (!navigator.geolocation) {
    alert("เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const coords = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      };
      if (callback) callback(coords);
    },
    (error) => {
      console.warn("ไม่สามารถดึงตำแหน่ง:", error);
    }
  );
}

// --- เริ่มการปักหมุด ---
function startTracking() {
  getUserLocation(loadMap);
}

// --- ยืนยันพิกัดที่ลากแล้ว ---
function confirmTracking() {
  const pos = marker.getPosition();
  selectedPosition = { lat: pos.lat(), lon: pos.lng() };

  fetch("https://forms-forecast-server.onrender.com/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lat: selectedPosition.lat, lng: selectedPosition.lon }),
  })
    .then(() => {
      alert(`กำลังติดตามฝนที่พิกัด ${selectedPosition.lat.toFixed(4)}, ${selectedPosition.lon.toFixed(4)}`);
      getRainForecast();
    })
    .catch((err) => {
      console.error("การส่งพิกัดล้มเหลว:", err);
    });
}

// --- เรียกผลพยากรณ์ ---
function getRainForecast() {
  fetch("https://forms-forecast-server.onrender.com/forecast")
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        forecastResult.textContent = "ยังไม่มีข้อมูลพยากรณ์";
        return;
      }

      forecastResult.textContent = `จะมีฝน ${data.rain_level} ภายใน ${data.minutes_until_arrival} นาที (เวลาประมาณ ${new Date(data.expected_arrival).toLocaleTimeString()})`;
    })
    .catch((err) => {
      console.error("โหลดข้อมูลพยากรณ์ล้มเหลว:", err);
    });
}

// --- แจ้งเตือนฝนแบบสุ่มทุก 5 นาที (จำลอง) ---
function startRainNotifications() {
  if (!("Notification" in window)) {
    alert("เบราว์เซอร์ไม่รองรับการแจ้งเตือน");
    return;
  }

  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      if (notifyInterval) clearInterval(notifyInterval);
      notifyInterval = setInterval(() => {
        const rainLevels = ["เบา", "ปานกลาง", "หนัก"];
        const rainIntensity = rainLevels[Math.floor(Math.random() * rainLevels.length)];
        const minutesLater = Math.floor(Math.random() * 60) + 1;

        new Notification("FonMa แจ้งเตือนฝน", {
          body: `จะมีฝน ${rainIntensity} ภายใน ${minutesLater} นาที`,
          icon: "/assets/logo.png",
        });
      }, 5 * 60 * 1000);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadRadar();
  toggleBtn.addEventListener("click", toggleAnimation);
  notifyBtn.addEventListener("click", startRainNotifications);
  trackBtn.addEventListener("click", startTracking);
  confirmBtn.addEventListener("click", confirmTracking);
  getRainForecast();
  setInterval(getRainForecast, 5 * 60 * 1000);
});