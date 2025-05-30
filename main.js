const radarIframe = document.getElementById("radar-iframe");
const radarZoom = document.getElementById("radar-zoom");
const toggleBtn = document.getElementById("toggle-btn");
const notifyBtn = document.getElementById("notify-btn");
const trackBtn = document.getElementById("track-btn");
const confirmBtn = document.getElementById("confirm-btn");
const forecastResult = document.getElementById("forecast-result");
const pin = document.getElementById("pin");
const touchOverlay = document.getElementById("touch-overlay");

let animationRunning = true;
let notifyInterval = null;
let selectedCoords = null;

// ซูม scale เริ่มต้น
let scale = 1;
let lastScale = 1;
let startDistance = 0;

// ฟังก์ชันคำนวณระยะห่างระหว่างสองจุด touch
function getDistance(touches) {
  const [touch1, touch2] = touches;
  const dx = touch2.clientX - touch1.clientX;
  const dy = touch2.clientY - touch1.clientY;
  return Math.hypot(dx, dy);
}

// แสดงหมุดในตำแหน่ง x, y (relative ใน container radarZoom)
function showPin(x, y) {
  pin.style.display = "block";
  pin.style.left = `${x}px`;
  pin.style.top = `${y}px`;
}

// ซ่อนหมุด
function hidePin() {
  pin.style.display = "none";
}

// รีเซ็ตพิกัดและซ่อนปุ่มยืนยัน
function resetSelection() {
  selectedCoords = null;
  hidePin();
  confirmBtn.style.display = "none";
}

// โหลด iframe radar
function loadRadar() {
  radarIframe.src = "https://weather.bangkok.go.th/radar/RadarAnimationNk.aspx";
}

// หยุดหรือเล่น animation เรดาร์ (reload iframe เพื่อหยุด)
function toggleAnimation() {
  animationRunning = !animationRunning;
  if (animationRunning) {
    loadRadar();
    toggleBtn.textContent = "⏸️ หยุด";
  } else {
    // หยุด animation ด้วยการล้าง src iframe
    radarIframe.src = "about:blank";
    toggleBtn.textContent = "▶️ เล่น";
    resetSelection();
  }
}

// เริ่มแจ้งเตือนฝน (ขอสิทธิ์ notification)
function startRainNotifications() {
  if (!("Notification" in window)) {
    alert("เบราว์เซอร์ไม่รองรับการแจ้งเตือน");
    return;
  }

  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      if (notifyInterval) clearInterval(notifyInterval);
      notifyInterval = setInterval(() => {
        getRainForecast(); // โหลดข้อมูลพยากรณ์ใหม่ทุก 5 นาที
      }, 5 * 60 * 1000);
      alert("เปิดแจ้งเตือนฝนแล้ว");
    } else {
      alert("ไม่อนุญาตให้แจ้งเตือน");
    }
  });
}

// ดึงข้อมูลพยากรณ์ฝนจากเซิร์ฟเวอร์และแสดงผล
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

// ส่งพิกัดไปให้เซิร์ฟเวอร์วิเคราะห์ฝน
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

// จัดการ touch event บน overlay
touchOverlay.addEventListener("touchstart", (e) => {
  e.preventDefault();

  if (e.touches.length === 1) {
    // แตะ 1 นิ้ว = ปักหมุด
    const rect = radarZoom.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    selectedCoords = { x, y };
    showPin(x, y);
    confirmBtn.style.display = "inline-block";
  } else if (e.touches.length === 2) {
    // แตะ 2 นิ้ว = เริ่ม pinch zoom
    startDistance = getDistance(e.touches);
    lastScale = scale;
  }
});

touchOverlay.addEventListener("touchmove", (e) => {
  e.preventDefault();

  if (e.touches.length === 2) {
    const newDistance = getDistance(e.touches);
    const diff = newDistance - startDistance;

    // เปลี่ยน scale ตาม pinch ระยะห่าง (จำกัด scale ระหว่าง 1 ถึง 3)
    const newScale = Math.min(3, Math.max(1, lastScale * newDistance / startDistance));
    scale = newScale;
    radarZoom.style.transform = `scale(${scale})`;
  }
});

touchOverlay.addEventListener("touchend", (e) => {
  e.preventDefault();

  if (e.touches.length < 2) {
    // เมื่อยกนิ้วครบ (touchend) แต่ยังมีหมุด แสดงปุ่มยืนยันให้กด
    if (selectedCoords) {
      confirmBtn.style.display = "inline-block";
    }
  }

  // ถ้ายกนิ้วหมดและไม่มีการปักหมุด รีเซ็ต
  if (e.touches.length === 0 && !selectedCoords) {
    resetSelection();
  }
});

// กดปุ่มยืนยัน
confirmBtn.addEventListener("click", () => {
  if (!selectedCoords) {
    alert("กรุณาแตะบนแผนที่เพื่อเลือกพิกัด");
    return;
  }

  sendCoordinates(selectedCoords.x, selectedCoords.y);
});

// ปุ่มควบคุม
toggleBtn.addEventListener("click", toggleAnimation);
notifyBtn.addEventListener("click", startRainNotifications);
trackBtn.addEventListener("click", () => alert("แตะจุดที่ต้องการบนเรดาร์ด้วย 1 นิ้วเพื่อปักหมุดแล้วกดยืนยัน"));

// โหลดเรดาร์ตอนเริ่ม และรีเฟรชพยากรณ์ทุก 5 นาที
document.addEventListener("DOMContentLoaded", () => {
  loadRadar();
  getRainForecast();
  setInterval(getRainForecast, 5 * 60 * 1000);
});