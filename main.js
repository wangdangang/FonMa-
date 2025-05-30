const radarIframe = document.getElementById("radar-iframe");
const radarContainer = document.getElementById("radar-container");
const toggleBtn = document.getElementById("toggle-btn");
const notifyBtn = document.getElementById("notify-btn");
const trackBtn = document.getElementById("track-btn");
const forecastResult = document.getElementById("forecast-result");

let userPosition = null;
let animationRunning = true;
let notifyInterval = null;

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

function analyzeRain() {
  const rainLevels = ["เบา", "ปานกลาง", "หนัก"];
  const rainIntensity = rainLevels[Math.floor(Math.random() * rainLevels.length)];
  const minutesLater = Math.floor(Math.random() * 60) + 1;

  return {
    intensity: rainIntensity,
    minutes: minutesLater,
  };
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
        const rain = analyzeRain();
        new Notification("FonMa แจ้งเตือนฝน", {
          body: `จะมีฝน ${rain.intensity} ภายใน ${rain.minutes} นาที`,
          icon: "/assets/logo.png",
        });
      }, 5 * 60 * 1000);
    }
  });
}

function setTracking() {
  if (!userPosition) {
    alert("ยังไม่สามารถระบุตำแหน่งผู้ใช้");
    return;
  }

  fetch("https://forms-forecast-server.onrender.com/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lat: userPosition.lat, lng: userPosition.lon }),
  })
    .then(() => {
      alert("เริ่มติดตามฝน ณ พิกัดของคุณแล้ว");
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
      console.error("โหลดข้อมูลพยากรณ์ล้มเหลว:", err);
    });
}

setInterval(getRainForecast, 5 * 60 * 1000);

document.addEventListener("DOMContentLoaded", () => {
  loadRadar();
  getUserLocation();

  toggleBtn.addEventListener("click", toggleAnimation);
  notifyBtn.addEventListener("click", startRainNotifications);
  trackBtn.addEventListener("click", setTracking);
});
