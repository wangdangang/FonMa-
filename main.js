let map;
let marker;
let animationRunning = true;
let selectedCoords = null;

const radarIframe = document.getElementById("radar-iframe");
const toggleBtn = document.getElementById("toggle-btn");
const confirmBtn = document.getElementById("confirm-btn");
const forecastResult = document.getElementById("forecast-result");
const pin = document.getElementById("pin");
const touchOverlay = document.getElementById("touch-overlay");

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 13.7563, lng: 100.5018 }, // Bangkok
    zoom: 12,
  });
}

function showPin(x, y) {
  pin.style.display = "block";
  pin.style.left = `${x}px`;
  pin.style.top = `${y}px`;
}

function hidePin() {
  pin.style.display = "none";
}

function resetSelection() {
  selectedCoords = null;
  hidePin();
  confirmBtn.style.display = "none";
  if (marker) {
    marker.setMap(null);
    marker = null;
  }
}

function toggleAnimation() {
  animationRunning = !animationRunning;
  if (animationRunning) {
    // เล่น animation: โหลด src ใหม่
    radarIframe.src = "https://weather.bangkok.go.th/radar/RadarAnimationNk.aspx";
    toggleBtn.textContent = "⏸️ หยุด";
  } else {
    // หยุด animation: เปลี่ยน src เป็นภาพนิ่ง (หรือ reload src แล้วหยุด)
    // เนื่องจาก iframe cross-origin จึงใช้วิธี reload src แล้วหยุดไม่ได้จริงๆ เลยใช้วิธี clone iframe แทนค้างภาพสุดท้าย
    pauseRadarAnimation();
    toggleBtn.textContent = "▶️ เล่น";
  }
}

function pauseRadarAnimation() {
  // วิธีง่ายๆ แทนการ pause คือ clone iframe แล้วเอาตัวเดิมออก เพื่อค้างภาพสุดท้าย
  const clone = radarIframe.cloneNode(true);
  radarIframe.parentNode.replaceChild(clone, radarIframe);
  // อัปเดตตัวแปร radarIframe ใหม่
  window.radarIframe = clone;
}

function estimateLatLngFromRadar(x, y, rect) {
  const baseLat = 13.7563; // Bangkok
  const baseLng = 100.5018;
  const latPerPixel = 0.0001;
  const lngPerPixel = 0.0001;

  // ละติจูดจะลดเมื่อขึ้นบนจอ (y ต่ำ) ดังนั้น - (y - center)
  const lat = baseLat - (y - rect.height / 2) * latPerPixel;
  const lng = baseLng + (x - rect.width / 2) * lngPerPixel;
  return { lat, lng };
}

function sendCoordinatesAndForecast(x, y) {
  forecastResult.textContent = "กำลังโหลดข้อมูลพยากรณ์...";
  fetch("https://forms-forecast-server.onrender.com/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ x, y })
  })
    .then((res) => {
      if (!res.ok) throw new Error("การส่งพิกัดล้มเหลว");
      return fetch("https://forms-forecast-server.onrender.com/forecast");
    })
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
      console.error("เกิดข้อผิดพลาด:", err);
      forecastResult.textContent = "โหลดข้อมูลล้มเหลว";
    });
}

// แตะบน overlay เพื่อปักหมุด
touchOverlay.addEventListener("click", (e) => {
  const rect = radarIframe.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (x >= 0 && y >= 0 && x <= rect.width && y <= rect.height) {
    selectedCoords = { x, y };
    showPin(x, y);
    confirmBtn.style.display = "inline-block";

    const { lat, lng } = estimateLatLngFromRadar(x, y, rect);

    if (marker) marker.setMap(null);
    marker = new google.maps.Marker({
      position: { lat, lng },
      map: map,
    });
    map.setCenter({ lat, lng });
  }
});

// กดปุ่มยืนยันพิกัด
confirmBtn.addEventListener("click", () => {
  if (!selectedCoords) {
    alert("กรุณาแตะบนแผนที่เพื่อเลือกพิกัด");
    return;
  }
  confirmBtn.style.display = "none";
  sendCoordinatesAndForecast(selectedCoords.x, selectedCoords.y);
});

// กดปุ่มหยุด/เล่น
toggleBtn.addEventListener("click", toggleAnimation);