const radarIframe = document.getElementById("radar-iframe");
const radarContainer = document.getElementById("radar-container");
const toggleBtn = document.getElementById("toggle-btn");
const notifyBtn = document.getElementById("notify-btn");
const trackBtn = document.getElementById("track-btn");
const confirmBtn = document.getElementById("confirm-btn");
const forecastResult = document.getElementById("forecast-result");

let animationRunning = true;
let notifyInterval = null;
let selectedLatLng = null;

// โหลดเรดาร์
function loadRadar() {
  radarIframe.src = "https://weather.bangkok.go.th/radar/RadarAnimationNk.aspx";
  radarIframe.style.width = "100%";
  radarIframe.style.height = "80vh";
}

// หยุด/เล่นแอนิเมชัน
function toggleAnimation() {
  animationRunning = !animationRunning;
  radarIframe.style.opacity = animationRunning ? "1" : "0.3";
  toggleBtn.textContent = animationRunning ? "⏸️ หยุด" : "▶️ เล่น";
}

// แจ้งเตือนฝนทุก 5 นาที (จำลอง)
function startRainNotifications() {
  if (!("Notification" in window)) {
    alert("เบราว์เซอร์ไม่รองรับการแจ้งเตือน");
    return;
  }

  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      if (notifyInterval) clearInterval(notifyInterval);
      notifyInterval = setInterval(() => {
        new Notification("FonMa แจ้งเตือนฝน", {
          body: `อาจมีฝนในพื้นที่ของคุณเร็ว ๆ นี้`,
          icon: "/logo.png",
        });
      }, 5 * 60 * 1000);
    }
  });
}

// เมื่อผู้ใช้คลิกบน radar-container
radarContainer.addEventListener("click", (event) => {
  const bounds = radarContainer.getBoundingClientRect();
  const x = event.clientX - bounds.left;
  const y = event.clientY - bounds.top;

  const xRatio = x / bounds.width;
  const yRatio = y / bounds.height;

  // สมมุติพิกัด (พื้นที่กรุงเทพฯคร่าว ๆ)
  const lat = 14.0 + (1.5 * (1 - yRatio));
  const lng = 100.0 + (1.5 * xRatio);

  selectedLatLng = { lat, lng };

  forecastResult.textContent = `คุณปักหมุดที่ (${lat.toFixed(4)}, ${lng.toFixed(4)}), โปรดยืนยัน`;
  confirmBtn.style.display = "inline-block";
});

// เมื่อกดปุ่มยืนยัน
confirmBtn.addEventListener("click", () => {
  if (!selectedLatLng) {
    alert("ยังไม่ได้ปักหมุดตำแหน่ง");
    return;
  }

  fetch("https://forms-forecast-server.onrender.com/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lat: selectedLatLng.lat,
      lng: selectedLatLng.lng
    }),
  })
    .then(() => {
      forecastResult.textContent = "กำลังโหลดผลการพยากรณ์...";
      return fetch("https://forms-forecast-server.onrender.com/forecast");
    })
    .then((res) => res.json())
    .then((data) => {
      if (data.error) {
        forecastResult.textContent = "ยังไม่มีข้อมูลพยากรณ์";
        return;
      }

      forecastResult.textContent = `จะมีฝน ${data.rain_level} ภายใน ${data.minutes_until_arrival} นาที (เวลาประมาณ ${new Date(data.expected_arrival).toLocaleTimeString()})`;
    })
    .catch((err) => {
      console.error("ผิดพลาด:", err);
      forecastResult.textContent = "เกิดข้อผิดพลาดในการโหลดข้อมูลพยากรณ์";
    });

  confirmBtn.style.display = "none";
});

document.addEventListener("DOMContentLoaded", () => {
  loadRadar();
  toggleBtn.addEventListener("click", toggleAnimation);
  notifyBtn.addEventListener("click", startRainNotifications);
});