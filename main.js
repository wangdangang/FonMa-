
const radarIframe = document.getElementById("radar-iframe");
const radarZoom = document.getElementById("radar-zoom");
const toggleBtn = document.getElementById("toggle-btn");
const notifyBtn = document.getElementById("notify-btn");
const trackBtn = document.getElementById("track-btn");
const confirmBtn = document.getElementById("confirm-btn");
const forecastResult = document.getElementById("forecast-result");
const pin = document.getElementById("pin");
const touchOverlay = document.getElementById("touch-overlay");
const coordText = document.getElementById("coord-text");

let animationRunning = true;
let notifyInterval = null;
let selectedCoords = null;

// Zoom & Pan
let scale = 1;
let lastScale = 1;
let startDistance = 0;
let startX = 0;
let startY = 0;
let translateX = 0;
let translateY = 0;
let lastTranslateX = 0;
let lastTranslateY = 0;

// Pinch distance
function getDistance(touches) {
  const [touch1, touch2] = touches;
  const dx = touch2.clientX - touch1.clientX;
  const dy = touch2.clientY - touch1.clientY;
  return Math.hypot(dx, dy);
}

function showPin(x, y) {
  pin.style.display = "block";
  pin.style.left = `${x}px`;
  pin.style.top = `${y}px`;
  coordText.style.display = "block";
  coordText.textContent = `X: ${Math.round(x)}, Y: ${Math.round(y)}`;
}

function hidePin() {
  pin.style.display = "none";
  coordText.style.display = "none";
}

function resetSelection() {
  selectedCoords = null;
  hidePin();
  confirmBtn.style.display = "none";
}

function loadRadar() {
  radarIframe.src = "https://weather.bangkok.go.th/radar/RadarAnimationNk.aspx";
}

function toggleAnimation() {
  animationRunning = !animationRunning;
  if (animationRunning) {
    loadRadar();
    toggleBtn.textContent = "⏸️ หยุด";
  } else {
    radarIframe.src = "about:blank";
    toggleBtn.textContent = "▶️ เล่น";
  }
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
      }, 5 * 60 * 1000);
      alert("เปิดแจ้งเตือนฝนแล้ว");
    } else {
      alert("ไม่อนุญาตให้แจ้งเตือน");
    }
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

      const time = new Date(data.expected_arrival);
      forecastResult.textContent = 
        `จะมีฝน${data.rain_level} ภายใน ${data.minutes_until_arrival} นาที (เวลาประมาณ ${time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
    })
    .catch((err) => {
      console.error("โหลดพยากรณ์ล้มเหลว:", err);
      forecastResult.textContent = "โหลดข้อมูลล้มเหลว";
    });
}

function sendCoordinates(x, y) {
  fetch("https://forms-forecast-server.onrender.com/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ x, y })
  })
    .then(() => {
      getRainForecast();
      confirmBtn.style.display = "none";
    })
    .catch((err) => {
      console.error("ส่งพิกัดล้มเหลว:", err);
      alert("ส่งพิกัดล้มเหลว กรุณาลองใหม่");
    });
}

touchOverlay.addEventListener("touchstart", (e) => {
  e.preventDefault();
  if (e.touches.length === 1) {
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;

    const rect = radarZoom.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    selectedCoords = { x, y };
    showPin(x, y);
    confirmBtn.style.display = "inline-block";
  } else if (e.touches.length === 2) {
    startDistance = getDistance(e.touches);
    lastScale = scale;
  }
});

touchOverlay.addEventListener("touchmove", (e) => {
  e.preventDefault();
  if (e.touches.length === 1) {
    const touch = e.touches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    translateX = lastTranslateX + dx;
    translateY = lastTranslateY + dy;
    radarZoom.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  } else if (e.touches.length === 2) {
    const newDistance = getDistance(e.touches);
    scale = Math.min(3, Math.max(1, lastScale * newDistance / startDistance));
    radarZoom.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  }
});

touchOverlay.addEventListener("touchend", (e) => {
  e.preventDefault();
  if (e.touches.length === 0) {
    lastTranslateX = translateX;
    lastTranslateY = translateY;
  }
});

confirmBtn.addEventListener("click", () => {
  if (!selectedCoords) {
    alert("กรุณาแตะบนแผนที่เพื่อเลือกพิกัด");
    return;
  }

  sendCoordinates(selectedCoords.x, selectedCoords.y);
});

toggleBtn.addEventListener("click", toggleAnimation);
notifyBtn.addEventListener("click", startRainNotifications);
trackBtn.addEventListener("click", () => alert("แตะจุดที่ต้องการบนเรดาร์ด้วย 1 นิ้วเพื่อปักหมุดแล้วกดยืนยัน"));

document.addEventListener("DOMContentLoaded", () => {
  loadRadar();
  getRainForecast();
  setInterval(getRainForecast, 5 * 60 * 1000);
});
