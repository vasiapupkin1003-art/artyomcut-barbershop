// ========================================
// ВЫБОР УСЛУГИ
// ========================================

let selectedService = '';

function selectService(serviceName) {
    const searchName = serviceName.toUpperCase().trim();
    
    document.querySelectorAll('.service-option-item').forEach(item => {
        item.classList.remove('selected');
        const title = item.querySelector('h3');
        if (title) {
            const titleText = title.textContent.toUpperCase().trim();
            if (titleText === searchName) {
                item.classList.add('selected');
                selectedService = title.textContent;
            }
        }
    });
    
    const bookingSection = document.querySelector('#booking');
    if (bookingSection) {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const targetPosition = bookingSection.getBoundingClientRect().top + window.scrollY - headerHeight;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
    }
}

function selectServiceOption(serviceName, element) {
    selectedService = serviceName;
    document.querySelectorAll('.service-option-item').forEach(item => item.classList.remove('selected'));
    if (element) element.classList.add('selected');
}

// ========================================
// АНИМАЦИИ
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.service, .gallery-grid img, .about-text, .about-gallery img, .music-player, .booking-box').forEach(el => {
        observer.observe(el);
    });
});

// ========================================
// ШАПКА
// ========================================

let lastScrollTop = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', function() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > lastScrollTop && scrollTop > 200) {
        header.style.transform = 'translateY(-100%)';
    } else {
        header.style.transform = 'translateY(0)';
        if (scrollTop > 100) {
            header.style.background = 'rgba(5, 7, 8, 0.9)';
            header.style.backdropFilter = 'blur(25px)';
            header.style.boxShadow = '0 5px 30px rgba(0, 0, 0, 0.5)';
        } else {
            header.style.background = 'rgba(5, 7, 8, 0.85)';
            header.style.backdropFilter = 'blur(20px)';
            header.style.boxShadow = 'none';
        }
    }
    lastScrollTop = scrollTop;
});

document.querySelectorAll('.nav a, .logo a, .btn').forEach(link => {
    link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href && href.startsWith('#')) {
            e.preventDefault();
            const targetElement = document.querySelector(href);
            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight;
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            }
        }
    });
});

// ========================================
// КАЛЕНДАРЬ
// ========================================

let bookingData = { service: '', date: '', time: '' };
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = null;
let selectedTime = null;

function getSchedule() {
    const schedule = JSON.parse(localStorage.getItem('timeSettings') || 'null');
    if (!schedule) {
        return {
            monday: { working: true, start: '10:00', end: '20:00' },
            tuesday: { working: true, start: '10:00', end: '20:00' },
            wednesday: { working: true, start: '10:00', end: '20:00' },
            thursday: { working: true, start: '10:00', end: '20:00' },
            friday: { working: true, start: '10:00', end: '20:00' },
            saturday: { working: true, start: '10:00', end: '18:00' },
            sunday: { working: false, start: '10:00', end: '20:00' }
        };
    }
    return schedule;
}

function getDayKey(date) {
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return dayKeys[date.getDay()];
}

function renderCalendar() {
    const calendarDays = document.getElementById('calendarDays');
    const calendarMonth = document.getElementById('calendarMonth');
    if (!calendarDays || !calendarMonth) return;
    
    const blockedDays = JSON.parse(localStorage.getItem('blockedDays') || '[]');
    const monthNames = ['ЯНВАРЬ', 'ФЕВРАЛЬ', 'МАРТ', 'АПРЕЛЬ', 'МАЙ', 'ИЮНЬ', 'ИЮЛЬ', 'АВГУСТ', 'СЕНТЯБРЬ', 'ОКТЯБРЬ', 'НОЯБРЬ', 'ДЕКАБРЬ'];
    calendarMonth.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDay = (firstDay.getDay() + 6) % 7;
    const schedule = getSchedule();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let daysHTML = '';
    for (let i = 0; i < startDay; i++) daysHTML += '<div class="calendar-day empty"></div>';
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dayKey = getDayKey(date);
        const daySchedule = schedule[dayKey];
        const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isPast = date < today;
        const isBlocked = blockedDays.includes(dateString);
        const isWorking = daySchedule.working && !isBlocked;
        const isSelected = selectedDate === dateString;
        
        let classes = 'calendar-day';
        if (isPast || !isWorking) classes += ' disabled';
        if (isSelected) classes += ' selected';
        
        if (isPast || !isWorking) {
            daysHTML += `<div class="${classes}">${day}</div>`;
        } else {
            daysHTML += `<div class="${classes}" onclick="selectDate('${dateString}')">${day}</div>`;
        }
    }
    
    calendarDays.innerHTML = daysHTML;
}

function selectDate(dateString) {
    const blockedDays = JSON.parse(localStorage.getItem('blockedDays') || '[]');
    if (blockedDays.includes(dateString)) {
        alert('В этот день барбершоп не работает');
        return;
    }
    
    selectedDate = dateString;
    selectedTime = null;
    document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('selected'));
    const selectedElement = document.querySelector(`.calendar-day[data-date="${dateString}"]`);
    if (selectedElement) selectedElement.classList.add('selected');
    renderTimeSlots(dateString);
}

function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    else if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar();
}

function renderTimeSlots(dateString) {
    const timeGroups = document.getElementById('timeGroups');
    if (!timeGroups) return;
    
    const blockedDays = JSON.parse(localStorage.getItem('blockedDays') || '[]');
    if (blockedDays.includes(dateString)) {
        timeGroups.innerHTML = '<p class="time-placeholder">🔴 В этот день барбершоп не работает</p>';
        return;
    }
    
    const schedule = getSchedule();
    const specialDates = JSON.parse(localStorage.getItem('specialDates') || '{}');
    const date = new Date(dateString);
    const dayKey = getDayKey(date);
    
    let daySchedule;
    if (specialDates[dateString]) {
        daySchedule = { working: true, start: specialDates[dateString].start, end: specialDates[dateString].end };
    } else {
        daySchedule = schedule[dayKey];
    }
    
    if (!daySchedule.working) {
        timeGroups.innerHTML = '<p class="time-placeholder">В этот день выходной</p>';
        return;
    }
    
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const startTime = daySchedule.start.split(':');
    const endTime = daySchedule.end.split(':');
    let currentHour = parseInt(startTime[0]);
    let currentMinute = parseInt(startTime[1]);
    const endHour = parseInt(endTime[0]);
    const endMinute = parseInt(endTime[1]);
    const slots = [];
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
        const isBooked = bookings.some(b => b.date === dateString && b.time === timeString);
        slots.push({ time: timeString, booked: isBooked });
        currentHour += 1;
    }
    
    let html = '';
    slots.forEach(s => {
        html += `<button class="time-btn ${s.booked ? 'booked' : ''} ${selectedTime === s.time ? 'selected' : ''}" 
            ${s.booked ? 'disabled' : ''} onclick="selectTime('${s.time}')">${s.time}</button>`;
    });
    
    timeGroups.innerHTML = html || '<p class="time-placeholder">Нет доступного времени</p>';
}

function selectTime(time) {
    selectedTime = time;
    document.querySelectorAll('.time-btn').forEach(el => {
        el.classList.remove('selected');
        if (el.textContent === time) el.classList.add('selected');
    });
}

function proceedToBooking() {
    if (!selectedService) { alert('Выберите услугу'); return; }
    if (!selectedDate) { alert('Выберите дату'); return; }
    if (!selectedTime) { alert('Выберите время'); return; }
    bookingData = { service: selectedService, date: selectedDate, time: selectedTime };
    showContactForm();
}

function refreshCalendar() {
    renderCalendar();
    selectedDate = null;
    selectedTime = null;
    const timeGroups = document.getElementById('timeGroups');
    if (timeGroups) timeGroups.innerHTML = '<p class="time-placeholder">Сначала выберите дату</p>';
}

// ========================================
// ФОРМА
// ========================================

function showContactForm() {
    const modal = document.createElement('div');
    modal.style.cssText = `position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px;`;
    modal.innerHTML = `
        <div style="background: #0d1011; border: 1px solid #343839; border-radius: 10px; padding: 30px; max-width: 500px; width: 100%; position: relative;">
            <button id="closeContactBtn" style="position: absolute; top: 15px; right: 15px; background: none; border: none; color: #fff; font-size: 28px; cursor: pointer;">×</button>
            <h3 style="color: #fff; font-size: 24px; margin-bottom: 20px; font-weight: 900;">ПОДТВЕРДИТЕ ЗАПИСЬ</h3>
            <div style="background: #15191a; padding: 15px; border-radius: 5px; margin-bottom: 20px; color: #aaa6a0;">
                <strong style="color: #fff;">Услуга:</strong> ${bookingData.service}<br>
                <strong style="color: #fff;">Дата:</strong> ${bookingData.date}<br>
                <strong style="color: #fff;">Время:</strong> ${bookingData.time}
            </div>
            <input id="client-name" type="text" placeholder="Ваше имя" style="width: 100%; height: 48px; margin-bottom: 15px; background: #15191a; border: 1px solid #343839; color: #fff; padding: 0 12px; border-radius: 3px;">
            <input id="client-contact" type="text" placeholder="@username или +34 XXX XXX XXX" style="width: 100%; height: 48px; margin-bottom: 20px; background: #15191a; border: 1px solid #343839; color: #fff; padding: 0 12px; border-radius: 3px;">
            <button onclick="confirmBooking()" style="width: 100%; height: 50px; background: #c51f25; color: #fff; border: none; border-radius: 3px; font-size: 14px; font-weight: 800; cursor: pointer;">ПОДТВЕРДИТЬ ЗАПИСЬ</button>
        </div>
    `;
    document.body.appendChild(modal);
    const closeBtn = modal.querySelector('#closeContactBtn');
    if (closeBtn) closeBtn.addEventListener('click', function() { modal.remove(); });
    modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
}

function confirmBooking() {
    const name = document.querySelector('#client-name').value;
    const contact = document.querySelector('#client-contact').value;
    if (!name || !contact) { alert('Заполните все поля'); return; }
    bookingData.name = name;
    bookingData.contact = contact;
    bookingData.status = 'pending';
    saveToLocalStorage(bookingData);
    showSuccessMessage(bookingData);
    document.querySelector('div[style*="position: fixed"]').remove();
    refreshCalendar();
}

function saveToLocalStorage(bookingData) {
    let bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    bookings.push(bookingData);
    localStorage.setItem('bookings', JSON.stringify(bookings));
}

function showSuccessMessage(bookingData) {
    const modal = document.createElement('div');
    modal.style.cssText = `position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 9999;`;
    modal.innerHTML = `
        <div style="background: #0d1011; padding: 40px; border-radius: 8px; text-align: center; max-width: 400px;">
            <div style="font-size: 60px;">✅</div>
            <h3 style="color: #fff; margin: 20px 0;">ЗАПИСЬ ПОДТВЕРЖДЕНА!</h3>
            <p style="color: #aaa6a0;">${bookingData.name}, ждем вас!</p>
            <p style="color: #fff; font-weight: 700;">${bookingData.service}</p>
            <p style="color: #aaa6a0;">${bookingData.date} в ${bookingData.time}</p>
            <button onclick="this.closest('div[style*="position: fixed"]').remove()" style="margin-top: 20px; padding: 15px 40px; background: #c51f25; color: #fff; border: none; border-radius: 3px; cursor: pointer;">ОТЛИЧНО!</button>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.remove(), 5000);
}

// ========================================
// РАДИО ПЛЕЕР
// ========================================

window.AudioContext = window.AudioContext || window.webkitAudioContext;

const radioAudioElement = new Audio();
radioAudioElement.crossOrigin = 'anonymous';
radioAudioElement.src = 'https://stream.radioparadise.com/rock-128';

let isMusicPlaying = false;
let audioContext = null;
let analyser = null;
let dataArray = null;
let source = null;

const ICON_PLAY = '<path d="M8 5v14l11-7z"/>';
const ICON_PAUSE = '<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>';

function initRadioAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        source = audioContext.createMediaElementSource(radioAudioElement);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
    }
}

function toggleMusic() {
    const miniPlayIcon = document.getElementById('miniPlayIcon');
    const fullPlayIcon = document.getElementById('fullPlayIcon');
    const drummerVideo = document.getElementById('drummerVideo');
    
    if (!isMusicPlaying) {
        initRadioAudioContext();
        radioAudioElement.play().then(() => {
            isMusicPlaying = true;
            if (miniPlayIcon) miniPlayIcon.innerHTML = ICON_PAUSE;
            if (fullPlayIcon) fullPlayIcon.innerHTML = ICON_PAUSE;
            if (drummerVideo) drummerVideo.play();
        }).catch(() => alert('Не удалось загрузить радио'));
    } else {
        radioAudioElement.pause();
        isMusicPlaying = false;
        if (miniPlayIcon) miniPlayIcon.innerHTML = ICON_PLAY;
        if (fullPlayIcon) fullPlayIcon.innerHTML = ICON_PLAY;
        if (drummerVideo) drummerVideo.pause();
    }
}

// ========================================
// МОБИЛЬНОЕ МЕНЮ
// ========================================

function toggleMobileMenu() {
    const nav = document.getElementById('mobileNav');
    if (nav) {
        nav.classList.toggle('open');
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                nav.classList.remove('open');
            });
        });
    }
}

// ========================================
// ДОСТУП К АДМИНКЕ
// ========================================

function adminAccess() {
    window.open('admin.html', '_self');
}

// ========================================
// ИНИЦИАЛИЗАЦИЯ
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    renderCalendar();
});

console.log('🚀 Сайт загружен');
// ========================================
// РАДИО ПЛЕЕР - КНОПКИ
// ========================================

const playBtn = document.getElementById("playBtn");
const playIcon = document.getElementById("playIcon");
const volumeSlider = document.getElementById("volumeSlider");
const radioStatus = document.getElementById("radioStatus");
const radioPlayerDiv = document.getElementById("radioPlayer");

if (playBtn && playIcon) {
    playBtn.addEventListener("click", async () => {
        if (radioAudioElement.paused) {
            try {
                await radioAudioElement.play();
                playIcon.textContent = "❚❚";
                radioPlayerDiv.classList.add("playing");
                if (radioStatus) radioStatus.textContent = "ARTYOMCUT RADIO • LIVE";
                const drummerVideo = document.getElementById("drummerVideo");
                if (drummerVideo) drummerVideo.play();
            } catch (error) {
                if (radioStatus) radioStatus.textContent = "Не удалось подключиться к радио";
            }
        } else {
            radioAudioElement.pause();
            playIcon.textContent = "▶";
            radioPlayerDiv.classList.remove("playing");
            if (radioStatus) radioStatus.textContent = "Радио остановлено";
            const drummerVideo = document.getElementById("drummerVideo");
            if (drummerVideo) drummerVideo.pause();
        }
    });
}

if (volumeSlider) {
    volumeSlider.addEventListener("input", () => {
        radioAudioElement.volume = volumeSlider.value;
    });
}
