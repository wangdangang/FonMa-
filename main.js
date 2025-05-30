let map;
let marker;
let userPosition = null;
let notifyInterval = null;
let animationRunning = true;

const radarIframe = document.getElementById("radar-iframe");
const toggleBtn = document.getElementById("toggle-btn");
const notifyBtn = document.getElementById("notify-btn");
const trackBtn = document.getElementById("track-btn");
const forecastResult = document.getElementById("forecast-result");

function loadRadar() {
  radarIframe.src = "https://weather.bangkok.go.th/radar/RadarAnimationNk.aspx";
  radarIframe.style.width = "100%";
  radarIframe.style.height = "80vh";
}

function toggleAnimation() {
  animationRunning = !animationRunning;
  radarIframe.style.opacity = animationRunning ? "1" : "0.3";
  toggleBtn.textContent = animationRunning ? "⏸️ หยุด" : "▶️ เล่น";
}

function initMap(lat, lng) {
  const position = { lat, lng };

  map = new google.maps.Map(document.getElementById("map"), {
    center: position,
    zoom: 12,
  });

  marker = new google.maps.Marker({
    position,
    map,
    draggable: true,
  });

  const confirmBtn = document.createElement("button");
  confirmBtn.textContent = "✅ ยืนยันตำแหน่งนี้";
  confirmBtn.className = "confirm-btn";
  document.body.appendChild(confirmBtn);

  confirmBtn.addEventListener("click", () => {
    const newPos = marker.getPosition();
    userPosition = { lat: newPos.lat(), lon: newPos.lng() };
    alert("ใช้ตำแหน่งใหม่นี้ในการพยากรณ์ฝนแล้ว");
    setTracking();
    confirmBtn.remove();
  });
}

function getUserLocationAndInitMap() {
  if (!navigator.geolocation) {
    alert("เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      userPosition = { lat, lon: lng };
      initMap(lat, lng);
    },
    (error) => {
      console.error("ไม่สามารถระบุตำแหน่งได้", error);
    }
  );
}

function setTracking() {
  if (!userPosition) {
    alert("ยังไม่สามารถระบุตำแหน่ง");
    return;
  }

  fetch("https://forms-forecast-server.onrender.com/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lat: userPosition.lat, lng: userPosition.lon }),
  })
    .then(() => {
      getRainForecast();
    })
    .catch((err) => {
      console.error("การส่งพิกัดล้มเหลว:", err);
    });
}

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
      console.error("โหลดพยากรณ์ล้มเหลว:", err);
    });
}

function startRainNotifications() {
  if (!("Notification" in window)) {
    alert("เบราว์เซอร์ไม่รองรับการแจ้งเตือน");
    return;
  }

  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      if (notifyInterval) clearInterval(notifyInterval);
      notifyInterval = setInterval(() => {
        getRainForecast();
        new Notification("FonMa แจ้งเตือนฝน", {
          body: forecastResult.textContent || "ยังไม่มีข้อมูลพยากรณ์",
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
  trackBtn.addEventListener("click", getUserLocationAndInitMap);
  setInterval(getRainForecast, 5 * 60 * 1000);
});