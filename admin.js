// ========================================
// АДМИН-ПАНЕЛЬ С АВТОРИЗАЦИЕЙ
// ========================================
const API_BASE = 'https://artyomcut-api.vasia-pupkin1003.workers.dev';
let authToken = localStorage.getItem('authToken') || '';
let adminSchedule = {
    timeSettings: {
        monday: { start: '10:00', end: '20:00' }, tuesday: { start: '10:00', end: '20:00' },
        wednesday: { start: '10:00', end: '20:00' }, thursday: { start: '10:00', end: '20:00' },
        friday: { start: '10:00', end: '20:00' }, saturday: { start: '10:00', end: '18:00' },
        sunday: { start: '10:00', end: '20:00' }
    },
    specialDates: {},
    blockedDays: []
};

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
    try {
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
    } catch (err) {
        console.error('Ошибка входа:', err);
        alert('Ошибка сети');
    }
});

async function showAdmin() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminContent').style.display = 'block';
    await loadScheduleSettings();
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

// ================== УПРАВЛЕНИЕ ДНЯМИ ==================
let blockMonth = new Date().getMonth();
let blockYear = new Date().getFullYear();

const monthNames = ['ЯНВАРЬ', 'ФЕВРАЛЬ', 'МАРТ', 'АПРЕЛЬ', 'МАЙ', 'ИЮНЬ', 'ИЮЛЬ', 'АВГУСТ', 'СЕНТЯБРЬ', 'ОКТЯБРЬ', 'НОЯБРЬ', 'ДЕКАБРЬ'];
const dayNamesRu = ['ВОСКРЕСЕНЬЕ', 'ПОНЕДЕЛЬНИК', 'ВТОРНИК', 'СРЕДА', 'ЧЕТВЕРГ', 'ПЯТНИЦА', 'СУББОТА'];

function getBlockedDays() {
    return adminSchedule.blockedDays || [];
}
function getTimeSettings() {
    return adminSchedule.timeSettings;
}
function getSpecialDates() {
    return adminSchedule.specialDates || {};
}

async function loadScheduleSettings() {
    try {
        const res = await fetch(`${API_BASE}/api/schedule`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!res.ok) throw new Error('Не удалось загрузить расписание');
        adminSchedule = await res.json();
    } catch (error) {
        console.error(error);
        alert('Не удалось загрузить расписание. Проверьте подключение.');
    }
}

async function saveScheduleSettings() {
    const res = await fetch(`${API_BASE}/api/schedule`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(adminSchedule)
    });
    if (!res.ok) throw new Error('Не удалось сохранить расписание');
}

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let html = '';
    for (let i = 0; i < startDay; i++) html += '<div class="block-day empty"></div>';

    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(blockYear, blockMonth, day);
        const dateString = `${blockYear}-${String(blockMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isPast = date < today;
        const isBlocked = blockedDays.includes(dateString);
        const hasSpecial = specialDates[dateString] !== undefined;

        let classes = 'block-day';
        if (isPast) classes += ' past';
        if (isBlocked) classes += ' blocked';
        if (hasSpecial && !isBlocked) classes += ' special';

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
            <button id="closeDaySettingsBtn" style="position: absolute; top: 15px; right: 15px; background: none; border: none; color: #fff; font-size: 28px; cursor: pointer;">×</button>
            <h3 style="color: #fff; font-size: 22px; margin-bottom: 25px; font-weight: 900;">${formattedDate}</h3>
            <div style="margin-bottom: 20px;">
                <button id="blockDayBtn" type="button" style="width: 100%; height: 55px; background: ${isBlocked ? '#27ae60' : '#c51f25'}; color: #fff; border: none; border-radius: 5px; font-size: 14px; font-weight: 700; cursor: pointer;">${isBlocked ? 'РАЗБЛОКИРОВАТЬ ДЕНЬ' : 'ЗАБЛОКИРОВАТЬ ДЕНЬ'}</button>
            </div>
            ${!isBlocked ? `
            <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                <div style="flex: 1;">
                    <label style="display: block; color: #aaa6a0; font-size: 11px; margin-bottom: 8px;">С:</label>
                    <input type="time" id="special-start" value="${currentSetting.start}" style="width: 100%; height: 55px; background: #0a0c0d; border: 1px solid #343839; color: #fff; padding: 0 15px; border-radius: 5px; font-size: 18px;">
                </div>
                <div style="flex: 1;">
                    <label style="display: block; color: #aaa6a0; font-size: 11px; margin-bottom: 8px;">ДО:</label>
                    <input type="time" id="special-end" value="${currentSetting.end}" style="width: 100%; height: 55px; background: #0a0c0d; border: 1px solid #343839; color: #fff; padding: 0 15px; border-radius: 5px; font-size: 18px;">
                </div>
            </div>
            <button id="saveSpecialTimeBtn" type="button" style="width: 100%; height: 50px; background: #c51f25; color: #fff; border: none; border-radius: 5px; font-size: 14px; font-weight: 700; cursor: pointer;">СОХРАНИТЬ ВРЕМЯ</button>
            ` : ''}
        </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('#closeDaySettingsBtn');
    if (closeBtn) closeBtn.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    const blockBtn = modal.querySelector('#blockDayBtn');
    if (blockBtn) blockBtn.addEventListener('click', async () => {
        if (await toggleBlockDay(dateString)) modal.remove();
    });

    const saveTimeBtn = modal.querySelector('#saveSpecialTimeBtn');
    if (saveTimeBtn) saveTimeBtn.addEventListener('click', async () => {
        const start = modal.querySelector('#special-start').value;
        const end = modal.querySelector('#special-end').value;
        if (!start || !end || start >= end) {
            alert('Проверьте время работы');
            return;
        }
        const previous = structuredClone(adminSchedule);
        adminSchedule.specialDates[dateString] = { start, end };
        try {
            await saveScheduleSettings();
            modal.remove();
            renderBlockCalendar();
            alert('Время сохранено!');
        } catch (error) {
            adminSchedule = previous;
            console.error(error);
            alert('Не удалось сохранить расписание');
        }
    });
}

async function toggleBlockDay(dateString) {
    const previous = structuredClone(adminSchedule);
    const blockedDays = adminSchedule.blockedDays;
    const index = blockedDays.indexOf(dateString);
    if (index > -1) blockedDays.splice(index, 1);
    else {
        blockedDays.push(dateString);
        delete adminSchedule.specialDates[dateString];
    }
    try {
        await saveScheduleSettings();
        renderBlockCalendar();
        return true;
    } catch (error) {
        adminSchedule = previous;
        console.error(error);
        alert('Не удалось сохранить расписание');
        renderBlockCalendar();
        return false;
    }
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
    blockMonth += delta;
    if (blockMonth < 0) { blockMonth = 11; blockYear--; }
    else if (blockMonth > 11) { blockMonth = 0; blockYear++; }
    renderBlockCalendar();
}

// ================== ЗАПИСИ ==================
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
        const fragment = document.createDocumentFragment();
        bookings.forEach(booking => {
            const item = document.createElement('div');
            item.className = 'booking-item';
            const details = document.createElement('div');
            const main = document.createElement('p');
            const name = document.createElement('strong');
            name.textContent = String(booking.name || '').slice(0, 80);
            main.append(name, document.createTextNode(` — ${String(booking.service || '').slice(0, 80)}`));
            const time = document.createElement('p');
            time.style.color = '#aaa6a0';
            time.textContent = `${String(booking.date || '')} | ${String(booking.time || '')}`;
            const contact = document.createElement('p');
            contact.style.color = '#aaa6a0';
            contact.textContent = String(booking.contact || 'Не указан').slice(0, 120);
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'btn-delete';
            remove.textContent = 'УДАЛИТЬ';
            remove.addEventListener('click', () => deleteBooking(String(booking.id || '')));
            details.append(main, time, contact);
            item.append(details, remove);
            fragment.append(item);
        });
        container.replaceChildren(fragment);
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

// ================== ГАЛЕРЕЯ ==================
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
        const fragment = document.createDocumentFragment();
        photos.forEach(photo => {
            const item = document.createElement('div');
            item.className = 'gallery-photo-item';
            const image = document.createElement('img');
            image.src = String(photo.src || '');
            image.alt = String(photo.alt || 'Работа');
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'remove-photo';
            remove.setAttribute('aria-label', 'Удалить фото');
            remove.textContent = '×';
            remove.addEventListener('click', () => removeGalleryPhoto(String(photo.id || '')));
            item.append(image, remove);
            fragment.append(item);
        });
        container.replaceChildren(fragment);
    } catch (err) { console.error(err); }
}

async function addPhotoToGallery() {
    const fileInput = document.getElementById('galleryPhotoInput');
    const categorySelect = document.getElementById('galleryCategory');
    if (!fileInput.files || fileInput.files.length === 0) {
        alert('Выберите фотографию');
        return;
    }
    const file = fileInput.files[0];
    if (file.size > 8 * 1024 * 1024) {
        alert('Файл слишком большой. Максимум 8 МБ.');
        return;
    }
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
            alert('Фото добавлено!');
        } else {
            alert('Ошибка при добавлении фото');
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
            alert('Фото удалено');
        }
    } catch (err) { console.error(err); }
}
