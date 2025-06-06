const radar = document.getElementById('radar-iframe');
const markerArea = document.getElementById('radar-marker');
const pin = document.getElementById('pin');
const message = document.getElementById('message');
const confirmBtn = document.getElementById('confirm-btn');
const resetBtn = document.getElementById('reset-btn');
const controls = document.getElementById('controls');
const resultBox = document.getElementById('forecast-result');

let selected = null;
let notifyTimers = [];

markerArea.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  const rect = markerArea.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  selected = { x, y };
  pin.style.left = `${x}px`;
  pin.style.top = `${y}px`;
  pin.style.display = 'block';
  controls.style.display = 'block';
  message.textContent = `ย้ายหมุดหรือตกลงตำแหน่งนี้`;
});

confirmBtn.addEventListener('click', () => {
  controls.style.display = 'none';
  message.textContent = 'กำลังประมวลผลพยากรณ์...';
  sendTrack();
});

resetBtn.addEventListener('click', () => {
  pin.style.display = 'none';
  controls.style.display = 'none';
  message.textContent = 'แตะบนเรดาร์เพื่อปักหมุดใหม่';
  resultBox.innerHTML = '';
  clearNotifications();
});

function sendTrack() {
  const normX = selected.x / markerArea.clientWidth;
  const normY = selected.y / markerArea.clientHeight;

  fetch('https://forms-forecast-server.onrender.com/track', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ x: normX, y: normY })
  })
  .then(_ => fetch('https://forms-forecast-server.onrender.com/forecast'))
  .then(res => res.json())
  .then(showForecast)
  .catch(err => {
    console.error(err);
    message.textContent = 'เกิดข้อผิดพลาด โปรดลองใหม่';
  });
}

function showForecast(data) {
  if (data.error) {
    message.textContent = 'ยังไม่มีข้อมูลฝน';
    return;
  }
  const t = new Date(data.expected_arrival);
  resultBox.innerHTML = `
    จะมีฝน <b>${data.rain_level}</b> ภายใน ${data.minutes_until_arrival} นาที (ราว ${t.toLocaleTimeString()})<br>
    ตกนาน ${data.duration_minutes || '?'} นาที<br>
    ต้องการให้แจ้งเตือน ? <button id="yes">✅</button> <button id="no">❌</button>
  `;
  document.getElementById('yes').onclick = () => {
    scheduleNotifications(t);
    message.textContent = 'ระบบตั้งเตือนล่วงหน้าแล้ว';
  };
  document.getElementById('no').onclick = () => message.textContent = 'แสดงภาพเรดาร์ปกติ';
}

function scheduleNotifications(arrivalTime) {
  [30, 15, 5].forEach(m => {
    const d = new Date(arrivalTime - m * 60000);
    const diff = d - new Date();
    if (diff > 0) {
      notifyTimers.push(setTimeout(() => {
        new Notification('FonMa เตือนฝน', {
          body: `ฝนจะตกใน ${m} นาที!`,
          icon: '/logo.png'
        });
      }, diff));
    }
  });
}

function clearNotifications() {
  notifyTimers.forEach(t => clearTimeout(t));
  notifyTimers = [];
}

Notification.requestPermission();