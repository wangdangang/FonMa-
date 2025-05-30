
const radarIframe = document.getElementById("radar-iframe");
const radarContainer = document.getElementById("radar-container");
const toggleBtn = document.getElementById("toggle-btn");
const notifyBtn = document.getElementById("notify-btn");
const trackBtn = document.getElementById("track-btn");
const confirmBtn = document.getElementById("confirm-btn");
const forecastResult = document.getElementById("forecast-result");

let animationRunning = true;
let notifyInterval = null;
let selectedCoords = null;
let pinElement = null;

function loadRadar() {
  radarIframe.src = "https://weather.bangkok.go.th/radar/RadarAnimationNk.aspx";
}

function toggleAnimation() {
  animationRunning = !animationRunning;
  radarIframe.style.opacity = animationRunning ? "1" : "0.4";
  toggleBtn.textContent = animationRunning ? "⏸️ หยุด" : "▶️ เล่น";
}

function showPin(x, y) {
  if (pinElement) pinElement.remove();

  pinElement = document.createElement("div");
  pinElement.style.position = "absolute";
  pinElement.style.width = "24px";
  pinElement.style.height = "24px";
  pinElement.style.background = "red";
  pinElement.style.borderRadius = "50%";
  pinElement.style.left = `${x - 12}px`;
  pinElement.style.top = `${y - 12}px`;
  pinElement.style.zIndex = "1000";
  pinElement.style.pointerEvents = "none";

  radarContainer.appendChild(pinElement);
}

radarContainer.addEventListener("click", (e) => {
  const rect = radarContainer.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  selectedCoords = { x, y };
  showPin(x, y);
  confirmBtn.style.display = "inline-block";
});

confirmBtn.addEventListener("click", () => {
  if (!selectedCoords) {
    alert("กรุณาแตะบนแผนที่เพื่อเลือกพิกัด");
    return;
  }

  fetch("https://forms-forecast-server.onrender.com/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ x: selectedCoords.x, y: selectedCoords.y })
  })
    .then(() => {
      getRainForecast();
      confirmBtn.style.display = "none";
    })
    .catch((err) => {
      console.error("ส่งพิกัดล้มเหลว:", err);
    });
});

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
        getRainForecast(); // Trigger fresh forecast
      }, 5 * 60 * 1000);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadRadar();
  toggleBtn.addEventListener("click", toggleAnimation);
  notifyBtn.addEventListener("click", startRainNotifications);
  trackBtn.addEventListener("click", () => alert("แตะจุดที่ต้องการบนเรดาร์เพื่อตั้งหมุดแล้วกดยืนยัน"));
});

setInterval(getRainForecast, 5 * 60 * 1000);
