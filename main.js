if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}

let radarFrame = document.getElementById('radar-frame');
let isPaused = false;

function toggleRadar() {
  if (isPaused) {
    radarFrame.src += '';
  } else {
    radarFrame.src = radarFrame.src;
  }
  isPaused = !isPaused;
}

function checkRain() {
  navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    // ตัวอย่างสมมุติ - ให้แสดงข้อความแจ้งเตือน
    const timeNow = new Date();
    const minutes = timeNow.getMinutes();
    let intensity = 'ปานกลาง';
    let predictionTime = minutes + 10;

    document.getElementById('rain-alert').innerText =
      `☔ คาดว่าจะมีฝน${intensity} ในเวลาประมาณ ${predictionTime} นาทีข้างหน้า`;

  }, () => {
    document.getElementById('rain-alert').innerText =
      '⚠️ ไม่สามารถเข้าถึงตำแหน่งของคุณได้';
  });
}

setInterval(checkRain, 5 * 60 * 1000); // ตรวจทุก 5 นาที