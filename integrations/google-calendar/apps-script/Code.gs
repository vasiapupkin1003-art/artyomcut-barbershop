/**
 * ============================================================
 *  ArtyomCut → ваш Google Календарь
 * ------------------------------------------------------------
 *  Скрипт для Google Apps Script: каждые 5 минут забирает записи
 *  с сайта и создаёт/обновляет/удаляет события в ВАШЕМ календаре.
 *
 *  Установка (5 минут, один раз):
 *  1. Откройте https://script.google.com → «Новый проект».
 *  2. Удалите код-заглушку и вставьте этот файл целиком.
 *  3. В CONFIG ниже впишите пароль админки в ADMIN_PASSWORD.
 *  4. Сохраните (Ctrl+S) и выберите функцию install → «Выполнить».
 *  5. Разрешите доступ к календарю (Google спросит один раз).
 *
 *  Всё. Дальше события появляются сами.
 *  Проверить вручную: функция syncBookings → «Выполнить».
 * ============================================================
 */

var CONFIG = {
  API_BASE: 'https://artyomcut-api.vasia-pupkin1003.workers.dev',

  // Пароль от админки сайта (/admin)
  ADMIN_PASSWORD: 'PASTE_PASSWORD_HERE',

  // Пусто = основной календарь аккаунта.
  // Можно указать ID другого календаря, например:
  // 'abc123@group.calendar.google.com'
  CALENDAR_ID: '',

  DURATION_MIN: 60,
  LOCATION: 'Calle de San Manuel, 13, 33210 Gijón',
  SITE: 'https://artyomcut-barbershopgijon.es'
};

/**
 * Запускается один раз: ставит расписание «каждые 5 минут»
 * и сразу делает первую синхронизацию.
 */
function install() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'syncBookings') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('syncBookings').timeBased().everyMinutes(5).create();

  var result = syncBookings();
  Logger.log('Синхронизация включена (каждые 5 минут). ' + JSON.stringify(result));
  return result;
}

/**
 * Основная функция: переносит записи с сайта в календарь.
 */
function syncBookings() {
  var token = adminLogin_();
  var bookings = fetchBookings_(token);

  var props = PropertiesService.getScriptProperties();
  var map = {};
  try {
    map = JSON.parse(props.getProperty('map') || '{}');
  } catch (e) {
    map = {};
  }

  var active = {};
  var created = 0;
  var updated = 0;
  var removed = 0;

  bookings.forEach(function (booking) {
    var id = bookingId_(booking);
    active[id] = true;
    var signature = bookingSignature_(booking);
    var entry = map[id];

    if (!entry) {
      var event = createEvent_(booking);
      map[id] = { eventId: event.getId(), sig: signature };
      created++;
      return;
    }

    if (entry.sig !== signature) {
      var existing = CalendarApp.getEventById(entry.eventId);
      if (existing) {
        applyEvent_(existing, booking);
        map[id].sig = signature;
        updated++;
      } else {
        map[id] = { eventId: createEvent_(booking).getId(), sig: signature };
        created++;
      }
    }
  });

  Object.keys(map).forEach(function (id) {
    if (active[id]) return;
    var event = CalendarApp.getEventById(map[id].eventId);
    if (event) event.deleteEvent();
    delete map[id];
    removed++;
  });

  props.setProperty('map', JSON.stringify(map));

  var result = {
    total: bookings.length,
    created: created,
    updated: updated,
    removed: removed
  };
  Logger.log(JSON.stringify(result));
  return result;
}

/* ---------- API сайта ---------- */

function adminLogin_() {
  var response = UrlFetchApp.fetch(CONFIG.API_BASE + '/api/auth/login', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ password: CONFIG.ADMIN_PASSWORD }),
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    throw new Error('Не удалось войти в админку API (код ' + response.getResponseCode() + '). Проверьте ADMIN_PASSWORD.');
  }

  return JSON.parse(response.getContentText()).token;
}

function fetchBookings_(token) {
  var response = UrlFetchApp.fetch(CONFIG.API_BASE + '/api/bookings', {
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    throw new Error('Не удалось получить записи (код ' + response.getResponseCode() + ').');
  }

  var data = JSON.parse(response.getContentText());
  return Array.isArray(data) ? data : [];
}

/* ---------- события календаря ---------- */

function calendar_() {
  return CONFIG.CALENDAR_ID
    ? CalendarApp.getCalendarById(CONFIG.CALENDAR_ID)
    : CalendarApp.getDefaultCalendar();
}

function bookingId_(booking) {
  return String(booking.id || (booking.date + '-' + booking.time + '-' + booking.name));
}

function bookingSignature_(booking) {
  return [booking.date, booking.time, booking.service, booking.name, booking.contact].join('|');
}

function eventTitle_(booking) {
  return 'ArtyomCut — ' + (booking.service || 'Запись');
}

function eventDescription_(booking) {
  return [booking.name, booking.contact, CONFIG.SITE].filter(Boolean).join('\n');
}

function eventStart_(booking) {
  return madridDate_(booking.date, String(booking.time).slice(0, 5));
}

/**
 * Момент времени по часам Мадрида, независимо от часового пояса скрипта.
 */
function madridDate_(dateString, timeString) {
  var naiveUtc = new Date(dateString + 'T' + timeString + ':00Z');
  var offset = Utilities.formatDate(naiveUtc, 'Europe/Madrid', 'Z');
  var sign = offset.charAt(0) === '-' ? -1 : 1;
  var hours = parseInt(offset.slice(1, 3), 10) || 0;
  var minutes = parseInt(offset.slice(3, 5), 10) || 0;
  return new Date(naiveUtc.getTime() - sign * (hours * 60 + minutes) * 60000);
}

function eventEnd_(booking) {
  return new Date(eventStart_(booking).getTime() + CONFIG.DURATION_MIN * 60000);
}

function createEvent_(booking) {
  return calendar_().createEvent(eventTitle_(booking), eventStart_(booking), eventEnd_(booking), {
    description: eventDescription_(booking),
    location: CONFIG.LOCATION
  });
}

function applyEvent_(event, booking) {
  event.setTitle(eventTitle_(booking));
  event.setTime(eventStart_(booking), eventEnd_(booking));
  event.setDescription(eventDescription_(booking));
  event.setLocation(CONFIG.LOCATION);
}
