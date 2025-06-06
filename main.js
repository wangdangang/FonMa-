// Get DOM elements
const radar = document.getElementById('radar-iframe');
const radarContainer = document.getElementById('radar-container'); // Renamed for consistency
const pin = document.getElementById('pin');
const message = document.getElementById('message');
const confirmBtn = document.getElementById('confirm-btn');
const resetBtn = document.getElementById('reset-btn');
const controls = document.getElementById('controls');
const resultBox = document.getElementById('forecast-result');

// State variables
let selected = null; // Stores the selected pin coordinates {x, y}
let notifyTimers = []; // Stores setTimeout IDs for notifications
let isDragging = false; // Flag to indicate if the pin is being dragged

// --- Event Listeners ---

// Disable pointer events on radarContainer initially until iframe loads
radarContainer.style.pointerEvents = 'none';

// Event listener for when the iframe content has loaded
radar.onload = () => {
    message.textContent = 'แตะค้างเพื่อย้ายหมุดเหนือเรดาร์ที่ต้องการ';
    radarContainer.style.pointerEvents = 'auto'; // Enable pointer events after iframe loads
};

// Event listener for when the iframe encounters an error loading
radar.onerror = () => {
    message.textContent = 'ไม่สามารถโหลดภาพเรดาร์ได้ โปรดลองใหม่ภายหลัง';
    // Optionally disable controls if radar cannot load
    controls.style.display = 'none';
};

// Pointer down (start of touch/click) on the radar container
radarContainer.addEventListener('pointerdown', (e) => {
    e.preventDefault(); // Prevent default browser actions (like scrolling)
    isDragging = true; // Set dragging flag to true

    // Calculate initial position relative to the radar container
    const rect = radarContainer.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    // Clamp coordinates to stay within bounds of radarContainer
    x = Math.max(0, Math.min(x, rect.width));
    y = Math.max(0, Math.min(y, rect.height));

    selected = { x, y };
    pin.style.left = `${x}px`;
    pin.style.top = `${y}px`;
    pin.style.display = 'block'; // Show the pin
    controls.style.display = 'block'; // Show control buttons
    message.textContent = `แตะค้างแล้วลากเพื่อย้ายหมุด หรือกด "ยืนยัน"`; // Update message
});

// Pointer move (dragging) on the radar container
radarContainer.addEventListener('pointermove', (e) => {
    if (!isDragging) return; // Only process if dragging is active
    e.preventDefault();

    const rect = radarContainer.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    // Clamp coordinates to stay within bounds of radarContainer
    x = Math.max(0, Math.min(x, rect.width));
    y = Math.max(0, Math.min(y, rect.height));
    
    selected = { x, y };
    pin.style.left = `${x}px`;
    pin.style.top = `${y}px`;
});

// Pointer up (release) anywhere on the document
document.addEventListener('pointerup', () => {
    isDragging = false; // Stop dragging
});

// Pointer leave (move pointer out of radar container) - also stop dragging
radarContainer.addEventListener('pointerleave', () => {
    isDragging = false; // Stop dragging if pointer leaves the area
});

// Confirm button click
confirmBtn.addEventListener('click', () => {
    if (!selected) {
        message.textContent = 'กรุณาแตะบนเรดาร์เพื่อปักหมุดก่อน';
        return;
    }
    // Disable buttons to prevent multiple clicks during processing
    confirmBtn.disabled = true;
    resetBtn.disabled = true;
    message.textContent = 'กำลังประมวลผลพยากรณ์...';
    sendTrack(); // *** นี่คือฟังก์ชันที่เรียกไปคำนวณฝน ***
});

// Reset button click
resetBtn.addEventListener('click', () => {
    pin.style.display = 'none'; // Hide the pin
    controls.style.display = 'none'; // Hide control buttons
    message.textContent = 'แตะค้างเพื่อย้ายหมุดเหนือเรดาร์ที่ต้องการ'; // Reset message
    resultBox.innerHTML = ''; // Clear forecast results
    clearNotifications(); // Clear any scheduled notifications
});

// --- Functions ---

/**
 * Sends the selected coordinates to the server and fetches the forecast.
 * This function interacts with the rain prediction server.
 */
function sendTrack() {
    // Normalize coordinates (0 to 1) relative to radar container dimensions
    const normX = selected.x / radarContainer.clientWidth;
    const normY = selected.y / radarContainer.clientHeight;

    // Step 1: Send selected coordinates to the /track endpoint
    fetch('https://forms-forecast-server.onrender.com/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x: normX, y: normY })
    })
    .then(trackRes => {
        if (!trackRes.ok) {
            // If the track request fails, throw an error
            return trackRes.text().then(text => { throw new Error(`Track request failed: ${trackRes.status} - ${text}`); });
        }
        // Step 2: If track is successful, fetch the forecast from the /forecast endpoint
        return fetch('https://forms-forecast-server.onrender.com/forecast');
    })
    .then(forecastRes => {
        if (!forecastRes.ok) { // Check if the forecast response was successful (e.g., 200 OK)
            return forecastRes.text().then(text => { throw new Error(`Forecast request failed: ${forecastRes.status} - ${text}`); });
        }
        return forecastRes.json();
    })
    .then(showForecast)
    .catch(err => {
        console.error('Error in rain prediction process:', err);
        message.textContent = `เกิดข้อผิดพลาดในการดึงข้อมูลฝน: ${err.message || 'โปรดลองใหม่'}`;
        resultBox.innerHTML = ''; // Clear previous results on error
    })
    .finally(() => {
        // Re-enable buttons regardless of success or failure
        confirmBtn.disabled = false;
        resetBtn.disabled = false;
    });
}

/**
 * Displays the forecast data received from the server.
 * @param {Object} data - The forecast data.
 */
function showForecast(data) {
    if (data.error) {
        message.textContent = 'ยังไม่มีข้อมูลฝนในตำแหน่งที่เลือก';
        resultBox.innerHTML = ''; // Clear previous results if no data
        return;
    }

    const t = new Date(data.expected_arrival);
    resultBox.innerHTML = `
        จะมีฝน <b>${data.rain_level || 'ไม่ทราบระดับ'}</b> ภายใน ${data.minutes_until_arrival || '?'} นาที (ราว ${t.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })})<br>
        ตกนาน ${data.duration_minutes || '?'} นาที<br>
        ต้องการให้แจ้งเตือนล่วงหน้า ? <button id="yes">✅</button> <button id="no">❌</button>
    `;
    message.textContent = 'พยากรณ์พร้อมใช้งาน'; // Update message

    // Event listeners for Yes/No buttons on forecast result
    document.getElementById('yes').onclick = () => {
        scheduleNotifications(t);
        message.textContent = 'ระบบตั้งเตือนล่วงหน้าแล้ว';
    };
    document.getElementById('no').onclick = () => {
        message.textContent = 'แสดงภาพเรดาร์ปกติ';
        resultBox.innerHTML = ''; // Clear forecast result if user declines notifications
    };
}

/**
 * Schedules notifications for rain arrival.
 * @param {Date} arrivalTime - The expected rain arrival time.
 */
function scheduleNotifications(arrivalTime) {
    // Request notification permission if not granted yet
    if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                _scheduleNotificationsInternal(arrivalTime);
            } else {
                message.textContent = 'ไม่สามารถตั้งเตือนได้ เนื่องจากไม่ได้รับอนุญาตแจ้งเตือน';
            }
        }).catch(err => {
            console.error('Error requesting notification permission:', err);
            message.textContent = 'เกิดข้อผิดพลาดในการขออนุญาตแจ้งเตือน';
        });
    } else if (Notification.permission === 'granted') {
        _scheduleNotificationsInternal(arrivalTime);
    } else { // permission === 'denied'
        message.textContent = 'ไม่สามารถตั้งเตือนได้ โปรดอนุญาตการแจ้งเตือนในการตั้งค่าเบราว์เซอร์ของคุณ';
    }
}

/**
 * Internal function to schedule notifications after permission is granted.
 * @param {Date} arrivalTime - The expected rain arrival time.
 */
function _scheduleNotificationsInternal(arrivalTime) {
    clearNotifications(); // Clear any previous notifications before scheduling new ones
    // Schedule notifications for 30, 15, and 5 minutes before arrival
    [30, 15, 5].forEach(m => {
        const d = new Date(arrivalTime.getTime() - m * 60000); // Calculate notification time
        const diff = d.getTime() - new Date().getTime(); // Time difference in milliseconds
        
        if (diff > 0) { // Only schedule if the time is in the future
            notifyTimers.push(setTimeout(() => {
                new Notification('FonMa เตือนฝน', {
                    body: `ฝนจะตกใน ${m} นาที!`,
                    icon: '/logo.png' // Ensure logo.png is accessible at the root
                });
            }, diff));
        }
    });
}

/**
 * Clears all scheduled notifications.
 */
function clearNotifications() {
    notifyTimers.forEach(t => clearTimeout(t)); // Cancel all pending timeouts
    notifyTimers = []; // Reset the array
}
