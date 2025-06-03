const radarIframe = document.getElementById(“radar-iframe”);
const radarContainer = document.getElementById(“radar-container”);
const toggleBtn = document.getElementById(“toggle-btn”);
const notifyBtn = document.getElementById(“notify-btn”);
const confirmBtn = document.getElementById(“confirm-btn”);
const forecastResult = document.getElementById(“forecast-result”);

let animationRunning = true;
let notifyInterval = null;
let selectedCoord = null;
let pin = null;
let isRadarLoaded = false;

// โหลดเรดาร์ - ปรับปรุงการจัดการ error
function loadRadar() {
// ใช้ Windy.com แทน เพราะรองรับ iframe embedding
const windyUrl = “https://embed.windy.com/embed2.html?lat=13.736&lon=100.523&detailLat=13.736&detailLon=100.523&width=650&height=450&zoom=8&level=surface&overlay=rain&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1”;

radarIframe.src = windyUrl;

// จัดการ error เมื่อโหลด iframe
radarIframe.onload = () => {
isRadarLoaded = true;
forecastResult.textContent = “แตะบนแผนที่เพื่อเลือกพิกัด”;
};

radarIframe.onerror = () => {
forecastResult.textContent = “ไม่สามารถโหลดแผนที่ได้ กรุณาตรวจสอบการเชื่อมต่อ”;
};

// Timeout สำหรับการโหลด
setTimeout(() => {
if (!isRadarLoaded) {
forecastResult.textContent = “การโหลดแผนที่ใช้เวลานาน กรุณารอสักครู่…”;
}
}, 10000);
}

// หยุด/เล่น animation
function toggleAnimation() {
animationRunning = !animationRunning;
radarIframe.style.opacity = animationRunning ? “1” : “0.3”;
radarIframe.style.filter = animationRunning ? “none” : “grayscale(50%)”;
toggleBtn.textContent = animationRunning ? “⏸️ หยุด” : “▶️ เล่น”;
}

// วิเคราะห์ฝนแบบสุ่ม (ปรับปรุงให้สมจริงขึ้น)
function analyzeRain() {
const scenarios = [
{ intensity: “เบา”, minutes: Math.floor(Math.random() * 30) + 10 },
{ intensity: “ปานกลาง”, minutes: Math.floor(Math.random() * 45) + 15 },
{ intensity: “หนัก”, minutes: Math.floor(Math.random() * 60) + 30 },
{ intensity: “ฟ้าร้อง”, minutes: Math.floor(Math.random() * 90) + 45 }
];

return scenarios[Math.floor(Math.random() * scenarios.length)];
}

// แจ้งเตือนฝน - ปรับปรุงการจัดการ permission
async function startRainNotifications() {
if (!(“Notification” in window)) {
alert(“เบราว์เซอร์ไม่รองรับการแจ้งเตือน”);
return;
}

try {
const permission = await Notification.requestPermission();

```
if (permission === "granted") {
  notifyBtn.textContent = "🔔 แจ้งเตือนเปิดอยู่";
  notifyBtn.style.backgroundColor = "#4CAF50";
  
  // ล้าง interval เก่า
  if (notifyInterval) {
    clearInterval(notifyInterval);
  }
  
  // ตั้งแจ้งเตือนทุก 5 นาที
  notifyInterval = setInterval(() => {
    const rain = analyzeRain();
    new Notification("🌧️ FonMa แจ้งเตือนฝน", {
      body: `พยากรณ์: ฝน${rain.intensity} ภายใน ${rain.minutes} นาที`,
      icon: "/logo.png",
      tag: "rain-forecast", // ป้องกันการแจ้งเตือนซ้ำ
    });
  }, 5 * 60 * 1000);
  
  // แจ้งเตือนครั้งแรกทันที
  const firstRain = analyzeRain();
  new Notification("🌧️ FonMa เริ่มการแจ้งเตือน", {
    body: `พยากรณ์ปัจจุบัน: ฝน${firstRain.intensity} ภายใน ${firstRain.minutes} นาที`,
    icon: "/logo.png",
  });
  
} else if (permission === "denied") {
  alert("กรุณาอนุญาตการแจ้งเตือนในการตั้งค่าเบราว์เซอร์");
}
```

} catch (error) {
console.error(“เกิดข้อผิดพลาดในการขอสิทธิ์แจ้งเตือน:”, error);
alert(“ไม่สามารถขอสิทธิ์แจ้งเตือนได้”);
}
}

// แก้ไขปัญหาการคลิกบน iframe
function createOverlay() {
const overlay = document.createElement(“div”);
overlay.style.position = “absolute”;
overlay.style.top = “0”;
overlay.style.left = “0”;
overlay.style.width = “100%”;
overlay.style.height = “100%”;
overlay.style.backgroundColor = “transparent”;
overlay.style.cursor = “crosshair”;
overlay.style.zIndex = “10”;

radarContainer.appendChild(overlay);
return overlay;
}

// ปรับปรุงการเลือกพิกัด
function setupCoordinateSelection() {
const overlay = createOverlay();

overlay.addEventListener(“click”, (event) => {
const rect = radarContainer.getBoundingClientRect();
const x = event.clientX - rect.left;
const y = event.clientY - rect.top;

```
selectedCoord = { x, y };

// ลบ pin เก่า
if (pin) {
  pin.remove();
}

// สร้าง pin ใหม่
pin = document.createElement("div");
pin.style.position = "absolute";
pin.style.left = `${x - 12}px`;
pin.style.top = `${y - 40}px`;
pin.style.width = "24px";
pin.style.height = "40px";
pin.style.backgroundColor = "#FF4444";
pin.style.borderRadius = "50% 50% 50% 0";
pin.style.transform = "rotate(-45deg)";
pin.style.border = "2px solid white";
pin.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
pin.style.zIndex = "20";
pin.style.cursor = "pointer";

// เพิ่ม animation
pin.style.animation = "bounce 0.5s ease-in-out";

radarContainer.appendChild(pin);

confirmBtn.style.display = "inline-block";
forecastResult.textContent = "📍 เลือกพิกัดแล้ว - กดยืนยันเพื่อพยากรณ์";
```

});
}

// ปรับปรุงการยืนยันพิกัด
confirmBtn.addEventListener(“click”, async () => {
if (!selectedCoord) {
alert(“กรุณาเลือกพิกัดบนแผนที่ก่อน”);
return;
}

confirmBtn.disabled = true;
confirmBtn.textContent = “กำลังวิเคราะห์…”;
forecastResult.textContent = “🔍 กำลังวิเคราะห์ข้อมูลฝน…”;

try {
const radarWidth = radarIframe.offsetWidth;
const radarHeight = radarIframe.offsetHeight;

```
// คำนวณพิกัดจริง (ประมาณ)
const lat = 13.736 + (selectedCoord.y / radarHeight - 0.5) * 2;
const lon = 100.523 + (selectedCoord.x / radarWidth - 0.5) * 2;

const body = {
  x: selectedCoord.x / radarWidth,
  y: selectedCoord.y / radarHeight,
  lat: lat,
  lon: lon,
  timestamp: new Date().toISOString()
};

// ลองเรียก API หลายครั้ง
let response;
let attempts = 0;
const maxAttempts = 3;

while (attempts < maxAttempts) {
  try {
    response = await fetch("https://forms-forecast-server.onrender.com/track", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(body),
      timeout: 10000
    });
    
    if (response.ok) break;
    
  } catch (error) {
    attempts++;
    if (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// ดึงข้อมูลพยากรณ์
const forecastResponse = await fetch("https://forms-forecast-server.onrender.com/forecast");
const data = await forecastResponse.json();

if (data.error) {
  // ใช้ข้อมูลจำลองแทน
  const mockForecast = analyzeRain();
  const arrivalTime = new Date(Date.now() + mockForecast.minutes * 60000);
  
  forecastResult.innerHTML = `
    <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 10px 0;">
      <h3 style="margin: 0 0 10px 0; color: #1976d2;">🌧️ พยากรณ์อากาศ</h3>
      <p style="margin: 5px 0;"><strong>ความหนาแน่น:</strong> ฝน${mockForecast.intensity}</p>
      <p style="margin: 5px 0;"><strong>เวลาที่คาดว่าจะมาถึง:</strong> ${mockForecast.minutes} นาที</p>
      <p style="margin: 5px 0;"><strong>เวลาประมาณ:</strong> ${arrivalTime.toLocaleTimeString('th-TH')}</p>
      <small style="color: #666;">*ข้อมูลจำลอง - สำหรับการทดสอบ</small>
    </div>
  `;
} else {
  const arrivalTime = new Date(data.expected_arrival);
  forecastResult.innerHTML = `
    <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 10px 0;">
      <h3 style="margin: 0 0 10px 0; color: #2e7d32;">🌧️ พยากรณ์อากาศ</h3>
      <p style="margin: 5px 0;"><strong>ความหนาแน่น:</strong> ฝน${data.rain_level}</p>
      <p style="margin: 5px 0;"><strong>เวลาที่คาดว่าจะมาถึง:</strong> ${data.minutes_until_arrival} นาที</p>
      <p style="margin: 5px 0;"><strong>เวลาประมาณ:</strong> ${arrivalTime.toLocaleTimeString('th-TH')}</p>
    </div>
  `;
}
```

} catch (error) {
console.error(“เกิดข้อผิดพลาด:”, error);

```
// ใช้ข้อมูลจำลองเมื่อ API ล่ม
const mockForecast = analyzeRain();
const arrivalTime = new Date(Date.now() + mockForecast.minutes * 60000);

forecastResult.innerHTML = `
  <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 10px 0;">
    <h3 style="margin: 0 0 10px 0; color: #ef6c00;">⚠️ โหมดออฟไลน์</h3>
    <p style="margin: 5px 0;"><strong>ความหนาแน่น:</strong> ฝน${mockForecast.intensity}</p>
    <p style="margin: 5px 0;"><strong>เวลาที่คาดว่าจะมาถึง:</strong> ${mockForecast.minutes} นาที</p>
    <p style="margin: 5px 0;"><strong>เวลาประมาณ:</strong> ${arrivalTime.toLocaleTimeString('th-TH')}</p>
    <small style="color: #666;">*ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ - ใช้ข้อมูลจำลอง</small>
  </div>
`;
```

} finally {
confirmBtn.disabled = false;
confirmBtn.textContent = “✅ ยืนยันพิกัด”;
}
});

// เพิ่ม CSS animation
const style = document.createElement(‘style’);
style.textContent = `@keyframes bounce { 0%, 20%, 53%, 80%, 100% { transform: rotate(-45deg) translateY(0); } 40%, 43% { transform: rotate(-45deg) translateY(-10px); } 70% { transform: rotate(-45deg) translateY(-5px); } }`;
document.head.appendChild(style);

// เริ่มต้นระบบ
document.addEventListener(“DOMContentLoaded”, () => {
console.log(“🌧️ FonMa กำลังเริ่มต้น…”);

loadRadar();
setupCoordinateSelection();

toggleBtn.addEventListener(“click”, toggleAnimation);
notifyBtn.addEventListener(“click”, startRainNotifications);

// ทดสอบการเชื่อมต่อ
setTimeout(() => {
if (navigator.onLine) {
console.log(“✅ เชื่อมต่ออินเทอร์เน็ตแล้ว”);
} else {
forecastResult.textContent = “❌ ไม่มีการเชื่อมต่ออินเทอร์เน็ต”;
}
}, 2000);
});