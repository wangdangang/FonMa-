const radarIframe = document.getElementById("radar-iframe");
const radarContainer = document.getElementById("radar-container");
const toggleBtn = document.getElementById("toggle-btn");
const notifyBtn = document.getElementById("notify-btn");

let userPosition = null;
let animationRunning = true;
let notifyInterval = null;

// --- โหลด iframe radar ---
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

// --- ใช้ตำแหน่งผู้ใช้ ---
function getUserLocation() {
  if (!navigator.geolocation) {
    alert("เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      userPosition = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      };
      console.log("ตำแหน่งผู้ใช้:", userPosition);
    },
    (error) => {
      console.warn("ไม่สามารถดึงตำแหน่ง:", error);
    }
  );
}

// --- วิเคราะห์ฝน (จำลองแบบง่าย) ---
function analyzeRain() {
  // จำลองการวิเคราะห์ด้วยข้อมูล dummy
  const rainLevels = ["เบา", "ปานกลาง", "หนัก"];
  const rainIntensity = rainLevels[Math.floor(Math.random() * rainLevels.length)];
  const minutesLater = Math.floor(Math.random() * 60) + 1;

  return {
    intensity: rainIntensity,
    minutes: minutesLater,
  };
}

// --- แจ้งเตือนฝนทุก 5 นาที ---
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
          icon: "/assets/logo.png",
        });
      }, 5 * 60 * 1000); // ทุก 5 นาที
    }
  });
}

// --- เริ่มโหลดเมื่อ DOM พร้อม ---
document.addEventListener("DOMContentLoaded", () => {
  loadRadar();
  getUserLocation();

  toggleBtn.addEventListener("click", toggleAnimation);
  notifyBtn.addEventListener("click", startRainNotifications);
});