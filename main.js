const radarIframe = document.getElementById("radar-iframe");
const radarContainer = document.getElementById("radar-container");
const toggleBtn = document.getElementById("toggle-btn");
const notifyBtn = document.getElementById("notify-btn");
const confirmBtn = document.getElementById("confirm-btn");
const forecastResult = document.getElementById("forecast-result");

let animationRunning = true;
let notifyInterval = null;
let selectedCoord = null;
let pin = null;

// โหลดเรดาร์
function loadRadar() {
  radarIframe.src = "https://weather.bangkok.go.th/radar/RadarAnimationNk.aspx";
}

// หยุด/เล่น animation (แสดง opacity)
function toggleAnimation() {
  animationRunning = !animationRunning;
  radarIframe.style.opacity = animationRunning ? "1" : "0.3";
  toggleBtn.textContent = animationRunning ? "⏸️ หยุด" : "▶️ เล่น";
}

// วิเคราะห์ฝนแบบสุ่ม (หรือดึงจาก server)
function analyzeRain() {
  const rainLevels = ["เบา", "ปานกลาง", "หนัก"];
  return {
    intensity: rainLevels[Math.floor(Math.random() * 3)],
    minutes: Math.floor(Math.random() * 60) + 1,
  };
}

// แจ้งเตือนฝนทุก 5 นาที
function startRainNotifications() {
  if (!("Notification" in window)) {
    alert("เบราว์เซอร์ไม่รองรับการแจ้งเตือน");
    return;
  }

  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      if (notifyInterval) clearInterval(notifyInterval);
      notifyInterval = setInterval(() => {
        const rain = analyzeRain();
        new Notification("FonMa แจ้งเตือนฝน", {
          body: `จะมีฝน ${rain.intensity} ภายใน ${rain.minutes} นาที`,
          icon: "/logo.png",
        });
      }, 5 * 60 * 1000);
    }
  });
}

// แตะเพื่อเลือกพิกัด
radarContainer.addEventListener("click", (event) => {
  const rect = radarContainer.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  selectedCoord = { x, y };

  if (pin) pin.remove();
  pin = document.createElement("div");
  pin.style.position = "absolute";
  pin.style.left = `${x - 12}px`;
  pin.style.top = `${y - 40}px`;
  pin.style.width = "24px";
  pin.style.height = "40px";
  pin.style.backgroundImage = "url('/pin.png')";
  pin.style.backgroundSize = "contain";
  pin.style.backgroundRepeat = "no-repeat";
  radarContainer.appendChild(pin);

  confirmBtn.style.display = "inline-block";
  forecastResult.textContent = "แตะยืนยันเพื่อใช้พิกัดที่เลือก";
});

// ยืนยันและส่งไปยัง server
confirmBtn.addEventListener("click", () => {
  if (!selectedCoord) {
    alert("กรุณาเลือกพิกัดบนแผนที่ก่อน");
    return;
  }

  const radarWidth = radarIframe.offsetWidth;
  const radarHeight = radarIframe.offsetHeight;
  const body = {
    x: selectedCoord.x / radarWidth,
    y: selectedCoord.y / radarHeight,
  };

  fetch("https://forms-forecast-server.onrender.com/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
    .then(() => {
      forecastResult.textContent = "กำลังวิเคราะห์ฝน...";
      return fetch("https://forms-forecast-server.onrender.com/forecast");
    })
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        forecastResult.textContent = "ยังไม่มีข้อมูลพยากรณ์";
      } else {
        forecastResult.textContent = `จะมีฝน ${data.rain_level} ภายใน ${data.minutes_until_arrival} นาที (เวลาประมาณ ${new Date(data.expected_arrival).toLocaleTimeString()})`;
      }
    })
    .catch((err) => {
      console.error("เกิดข้อผิดพลาด:", err);
      forecastResult.textContent = "ไม่สามารถโหลดข้อมูลพยากรณ์ได้";
    });
});

document.addEventListener("DOMContentLoaded", () => {
  loadRadar();
  toggleBtn.addEventListener("click", toggleAnimation);
  notifyBtn.addEventListener("click", startRainNotifications);
});