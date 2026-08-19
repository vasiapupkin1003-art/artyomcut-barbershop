// ========================================
// АДМИН-ПАНЕЛЬ С АВТОРИЗАЦИЕЙ
// ========================================
const API_BASE = 'https://artyomcut-api.vasia-pupkin1003.workers.dev';
let authToken = localStorage.getItem('authToken') || '';

// ================== АВТОРИЗАЦИЯ ==================
document.addEventListener('DOMContentLoaded', async () => {
    if (authToken) {
        const res = await fetch(`${API_BASE}/api/auth/check`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.ok) {
            showAdmin();
            return;
        } else {
            localStorage.removeItem('authToken');
            authToken = '';
        }
    }
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminContent').style.display = 'none';
});

document.getElementById('loginBtn').addEventListener('click', async () => {
    const password = document.getElementById('adminPassword').value;
    const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    });
    if (res.ok) {
        const data = await res.json();
        authToken = data.token;
        localStorage.setItem('authToken', authToken);
        showAdmin();
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
});

function showAdmin() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminContent').style.display = 'block';
    renderBlockCalendar();
    loadBookings();
    renderGalleryPhotosList();
}

function logout() {
    localStorage.removeItem('authToken');
    authToken = '';
    document.getElementById('adminContent').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
}

// ================== УПРАВЛЕНИЕ ДНЯМИ (локально) ==================
let blockMonth = new Date().getMonth();
let blockYear = new Date().getFullYear();
const todayStart = new Date();
todayStart.setHours(0, 0, 0, 0);
const currentMonth = todayStart.getMonth();
const currentYear = todayStart.getFullYear();
const monthNames = ['ЯНВАРЬ', 'ФЕВРАЛЬ', 'МАРТ', 'АПРЕЛЬ', 'МАЙ', 'ИЮНЬ', 'ИЮЛЬ', 'АВГУСТ', 'СЕНТЯБРЬ', 'ОКТЯБРЬ', 'НОЯБРЬ', 'ДЕКАБРЬ'];
const dayNamesRu = ['ВОСКРЕСЕНЬЕ', 'ПОНЕДЕЛЬНИК', 'ВТОРНИК', 'СРЕДА', 'ЧЕТВЕРГ', 'ПЯТНИЦА', 'СУББОТА'];

function getBlockedDays() { return JSON.parse(localStorage.getItem('blockedDays') || '[]'); }
function getTimeSettings() {
    const settings = JSON.parse(localStorage.getItem('timeSettings') || 'null');
    if (!settings) {
        return {
            monday: { start: '10:00', end: '20:00' },
            tuesday: { start: '10:00', end: '20:00' },
            wednesday: { start: '10:00', end: '20:00' },
            thursday: { start: '10:00', end: '20:00' },
            friday: { start: '10:00', end: '20:00' },
            saturday: { start: '10:00', end: '18:00' },
            sunday: { start: '10:00', end: '20:00' }
        };
    }
    return settings;
}
function getSpecialDates() { return JSON.parse(localStorage.getItem('specialDates') || '{}'); }

function renderBlockCalendar() {
    const blockDays = document.getElementById('blockDays');
    const blockMonthEl = document.getElementById('blockMonth');
    if (!blockDays || !blockMonthEl) return;
    blockMonthEl.textContent = `${monthNames[blockMonth]} ${blockYear}`;

    const blockedDays = getBlockedDays();
    const specialDates = getSpecialDates();
    const firstDay = new Date(blockYear, blockMonth, 1);
    const lastDay = new Date(blockYear, blockMonth + 1, 0);
    const startDay = (firstDay.getDay() + 6) % 7;

    let html = '';
    for (let i = 0; i < startDay; i++) html += '<div class="block-day empty"></div>';
    for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(blockYear, blockMonth, day);
    const dateString = `${blockYear}-${String(blockMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isPast = date < todayStart;
    const isBlocked = blockedDays.includes(dateString);
    const hasSpecial = specialDates[dateString] !== undefined;
    
    let classes = 'block-day';
    if (isPast) {
        classes += ' past';                 // прошедшие дни неактивны
    } else {
        if (isBlocked) classes += ' blocked';
        if (hasSpecial && !isBlocked) classes += ' special';
    }
    
    // Для прошедших дней не добавляем onclick
    const onclickAttr = isPast ? '' : `onclick="openDaySettings('${dateString}')"`;
    html += `<div class="${classes}" data-date="${dateString}" ${onclickAttr}>${day}</div>`;
}
    blockDays.innerHTML = html;
    renderBlockedDaysList();
}

function openDaySettings(dateString) {
    const blockedDays = getBlockedDays();
    const specialDates = getSpecialDates();
    const isBlocked = blockedDays.includes(dateString);
    const date = new Date(dateString);
    const dayName = dayNamesRu[date.getDay()];
    const formattedDate = `${dayName}, ${date.getDate()} ${monthNames[date.getMonth()].toLowerCase()}`;
    const currentSetting = specialDates[dateString] || { start: '10:00', end: '20:00' };

    const modal = document.createElement('div');
    modal.style.cssText = `position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.9); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px;`;
    modal.innerHTML = `
        <div style="background: #0d1011; border: 1px solid #343839; border-radius: 10px; padding: 30px; max-width: 450px; width: 100%; position: relative;">
            <button id="closeDaySettingsBtn" style="position: absolute; top: 15px; right: 15px; background: none; border: none; color: #fff; font-size: 28px; cursor: pointer; z-index: 10001; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">×</button>
            <h3 style="color: #fff; font-size: 22px; margin-bottom: 25px; font-weight: 900;">${formattedDate}</h3>
            <div style="margin-bottom: 20px;">
                <button id="blockDayBtn" style="width: 100%; height: 55px; background: ${isBlocked ? '#27ae60' : '#c51f25'}; color: #fff; border: none; border-radius: 5px; font-size: 14px; font-weight: 700; cursor: pointer;">${isBlocked ? '✅ РАЗБЛОКИРОВАТЬ ДЕНЬ' : '🚫 ЗАБЛОКИРОВАТЬ ДЕНЬ'}</button>
            </div>
            ${!isBlocked ? `
            <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                <div style="flex: 1;">
                    <label style="display: block; color: #aaa6a0; font-size: 11px; margin-bottom: 8px;">С:</label>
                    <div style="position: relative;">
                        <input type="time" id="special-start" value="${currentSetting.start}" style="width: 100%; height: 55px; background: #0a0c0d; border: 1px solid #343839; color: #fff; padding: 0 45px 0 15px; border-radius: 5px; font-size: 18px; cursor: pointer;">
                        <button id="startArrowBtn" style="position: absolute; right: 5px; top: 50%; transform: translateY(-50%); width: 35px; height: 35px; background: #15191a; border: 1px solid #343839; border-radius: 5px; color: #aaa6a0; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px;">▼</button>
                    </div>
                </div>
                <div style="flex: 1;">
                    <label style="display: block; color: #aaa6a0; font-size: 11px; margin-bottom: 8px;">ДО:</label>
                    <div style="position: relative;">
                        <input type="time" id="special-end" value="${currentSetting.end}" style="width: 100%; height: 55px; background: #0a0c0d; border: 1px solid #343839; color: #fff; padding: 0 45px 0 15px; border-radius: 5px; font-size: 18px; cursor: pointer;">
                        <button id="endArrowBtn" style="position: absolute; right: 5px; top: 50%; transform: translateY(-50%); width: 35px; height: 35px; background: #15191a; border: 1px solid #343839; border-radius: 5px; color: #aaa6a0; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px;">▼</button>
                    </div>
                </div>
            </div>
            <button id="saveSpecialTimeBtn" style="width: 100%; height: 50px; background: #c51f25; color: #fff; border: none; border-radius: 5px; font-size: 14px; font-weight: 700; cursor: pointer;">💾 СОХРАНИТЬ ВРЕМЯ</button>
            ` : ''}
        </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('#closeDaySettingsBtn');
    if (closeBtn) closeBtn.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

    const blockBtn = modal.querySelector('#blockDayBtn');
    if (blockBtn) blockBtn.addEventListener('click', () => { toggleBlockDay(dateString); modal.remove(); });

    const startInput = modal.querySelector('#special-start');
    const endInput = modal.querySelector('#special-end');
    const startArrowBtn = modal.querySelector('#startArrowBtn');
    const endArrowBtn = modal.querySelector('#endArrowBtn');

    function openTimePicker(input) {
        if (input.showPicker) input.showPicker();
        else { input.focus(); input.click(); }
    }
    if (startArrowBtn && startInput) startArrowBtn.addEventListener('click', e => { e.stopPropagation(); openTimePicker(startInput); });
    if (endArrowBtn && endInput) endArrowBtn.addEventListener('click', e => { e.stopPropagation(); openTimePicker(endInput); });

    function closeTimePicker(input) {
        input.blur();
        const dummy = document.createElement('input');
        dummy.type = 'text';
        dummy.style.cssText = 'position: fixed; top: -100px; left: -100px; width: 1px; height: 1px; opacity: 0;';
        document.body.appendChild(dummy);
        dummy.focus();
        dummy.remove();
    }
    if (startInput) startInput.addEventListener('change', function() { if (this.value) closeTimePicker(this); });
    if (endInput) endInput.addEventListener('change', function() { if (this.value) closeTimePicker(this); });

    const saveTimeBtn = modal.querySelector('#saveSpecialTimeBtn');
    if (saveTimeBtn) saveTimeBtn.addEventListener('click', () => {
        const start = startInput ? startInput.value : '10:00';
        const end = endInput ? endInput.value : '20:00';
        const specialDates = getSpecialDates();
        specialDates[dateString] = { start, end };
        localStorage.setItem('specialDates', JSON.stringify(specialDates));
        modal.remove();
        renderBlockCalendar();
        alert('✅ Время сохранено!');
    });
}

function toggleBlockDay(dateString) {
    let blockedDays = getBlockedDays();
    const index = blockedDays.indexOf(dateString);
    if (index > -1) blockedDays.splice(index, 1);
    else {
        blockedDays.push(dateString);
        const specialDates = getSpecialDates();
        delete specialDates[dateString];
        localStorage.setItem('specialDates', JSON.stringify(specialDates));
    }
    localStorage.setItem('blockedDays', JSON.stringify(blockedDays));
    renderBlockCalendar();
}

function renderBlockedDaysList() {
    const list = document.getElementById('blockedDaysList');
    if (!list) return;
    const blockedDays = getBlockedDays();
    if (blockedDays.length === 0) {
        list.innerHTML = '<p style="color: #aaa6a0;">Нет заблокированных дней</p>';
        return;
    }
    list.innerHTML = blockedDays.map(date => `
        <div class="blocked-day-tag">${date}<span class="remove" onclick="event.stopPropagation(); toggleBlockDay('${date}')">×</span></div>
    `).join('');
}

function changeBlockMonth(delta) {
    const targetDate = new Date(blockYear, blockMonth + delta, 1);
    const currentDate = new Date(currentYear, currentMonth, 1);
    
    // Не пускаем в прошлые месяцы
    if (targetDate < currentDate) return;
    
    blockMonth += delta;
    if (blockMonth < 0) {
        blockMonth = 11;
        blockYear--;
    } else if (blockMonth > 11) {
        blockMonth = 0;
        blockYear++;
    }
    renderBlockCalendar();
}

// ================== ЗАПИСИ (API) ==================
async function loadBookings() {
    const container = document.getElementById('bookingsList');
    if (!container) return;
    try {
        const res = await fetch(`${API_BASE}/api/bookings`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!res.ok) {
            container.innerHTML = '<p style="color: #aaa6a0;">Ошибка загрузки. Проверьте вход.</p>';
            return;
        }
        const bookings = await res.json();
        if (bookings.length === 0) {
            container.innerHTML = '<p style="color: #aaa6a0;">Нет записей</p>';
            return;
        }
        bookings.sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`));
        container.innerHTML = bookings.map(booking => `
            <div class="booking-item">
                <div>
                    <p><strong>${booking.name}</strong> — ${booking.service}</p>
                    <p style="color: #aaa6a0;">📅 ${booking.date} | 🕐 ${booking.time}</p>
                    <p style="color: #aaa6a0;">✈️ ${booking.telegram || 'Не указан'}</p>
                </div>
                <button class="btn-delete" onclick="deleteBooking('${booking.id}')">❌ УДАЛИТЬ</button>
            </div>
        `).join('');
    } catch (err) {
        console.error(err);
    }
}

async function deleteBooking(id) {
    if (!confirm('Удалить запись?')) return;
    try {
        const res = await fetch(`${API_BASE}/api/bookings?id=${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.ok) loadBookings();
    } catch (err) { console.error(err); }
}

// ================== ГАЛЕРЕЯ (API) ==================
async function getGalleryPhotos() {
    const res = await fetch(`${API_BASE}/api/gallery`);
    if (!res.ok) throw new Error('Ошибка загрузки галереи');
    return await res.json();
}

async function renderGalleryPhotosList() {
    const container = document.getElementById('galleryPhotosList');
    if (!container) return;
    try {
        const photos = await getGalleryPhotos();
        if (photos.length === 0) {
            container.innerHTML = '<p style="color: #aaa6a0;">Нет фотографий</p>';
            return;
        }
        container.innerHTML = photos.map(photo => `
            <div class="gallery-photo-item">
                <img src="${photo.src}" alt="${photo.alt}">
                <button class="remove-photo" onclick="removeGalleryPhoto('${photo.id}')">×</button>
            </div>
        `).join('');
    } catch (err) { console.error(err); }
}

async function addPhotoToGallery() {
    const fileInput = document.getElementById('galleryPhotoInput');
    const categorySelect = document.getElementById('galleryCategory');
    if (!fileInput.files || fileInput.files.length === 0) { alert('Выберите фотографию'); return; }

    const file = fileInput.files[0];
    if (file.size > 20 * 1024 * 1024) { alert('Файл слишком большой. Максимум 20 МБ.'); return; }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', categorySelect.value);
    formData.append('alt', 'Работа');

    try {
        const res = await fetch(`${API_BASE}/api/gallery`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` },
            body: formData
        });
        if (res.ok) {
            fileInput.value = '';
            renderGalleryPhotosList();
            alert('✅ Фото добавлено!');
        } else {
            const error = await res.json();
            alert(error.error || 'Ошибка при добавлении фото');
        }
    } catch (err) {
        console.error(err);
        alert('Ошибка сети');
    }
}

async function removeGalleryPhoto(id) {
    if (!confirm('Удалить фото?')) return;
    try {
        const res = await fetch(`${API_BASE}/api/gallery?id=${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.ok) {
            renderGalleryPhotosList();
            alert('✅ Фото удалено');
        }
    } catch (err) { console.error(err); }
}
