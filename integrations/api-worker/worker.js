const DEFAULT_ORIGINS = ['https://artyomcut-barbershopgijon.es'];
const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MAX_JSON_BYTES = 16 * 1024;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const BOOKING_PREFIX = 'booking:';
const SLOT_PREFIX = 'slot:';
const LEGACY_BOOKINGS_KEY = 'bookings';
const SLOT_CONFIRM_DELAY_MS = 150;

const DEFAULT_SCHEDULE = {
  timeSettings: {
    monday: { start: '10:00', end: '20:00' },
    tuesday: { start: '10:00', end: '20:00' },
    wednesday: { start: '10:00', end: '20:00' },
    thursday: { start: '10:00', end: '20:00' },
    friday: { start: '10:00', end: '20:00' },
    saturday: { start: '10:00', end: '18:00' },
    sunday: { start: null, end: null },
  },
  specialDates: {},
  blockedDays: [],
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function fail(status, message) {
  throw new HttpError(status, message);
}

function configuredOrigins(env) {
  return new Set((env.ALLOWED_ORIGINS || DEFAULT_ORIGINS.join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean));
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const isAllowed = origin && configuredOrigins(env).has(origin);
  return {
    ...(isAllowed ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function response(request, env, data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(request, env),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
  });
}

function isDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00Z`).getTime());
}

function isTime(value) {
  if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) return false;
  const [hour, minute] = value.split(':').map(Number);
  return hour >= 0 && hour < 24 && minute >= 0 && minute < 60;
}

function minutes(value) {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

function madridNow() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date()).reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

function safeText(value, maxLength) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength) : '';
}

function getClientIp(request) {
  return request.headers.get('CF-Connecting-IP') || 'unknown';
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    fail(400, 'Invalid JSON body');
  }
}

function cleanSchedule(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail(400, 'Invalid schedule');
  const timeSettings = {};

  for (const day of DAY_KEYS) {
    const item = data.timeSettings?.[day];
    if (item?.start === null && item?.end === null) {
      timeSettings[day] = { start: null, end: null };
      continue;
    }
    if (!isTime(item?.start) || !isTime(item?.end) || minutes(item.start) >= minutes(item.end)) {
      fail(400, `Invalid working hours for ${day}`);
    }
    timeSettings[day] = { start: item.start, end: item.end };
  }

  const specialDates = {};
  const rawSpecialDates = data.specialDates || {};
  if (typeof rawSpecialDates !== 'object' || Array.isArray(rawSpecialDates) || Object.keys(rawSpecialDates).length > 366) {
    fail(400, 'Invalid special dates');
  }
  for (const [date, item] of Object.entries(rawSpecialDates)) {
    if (!isDate(date)) fail(400, 'Invalid special date');
    if (item?.start === null && item?.end === null) {
      specialDates[date] = { start: null, end: null };
      continue;
    }
    if (!isTime(item?.start) || !isTime(item?.end) || minutes(item.start) >= minutes(item.end)) {
      fail(400, 'Invalid special working hours');
    }
    specialDates[date] = { start: item.start, end: item.end };
  }

  const rawBlockedDays = data.blockedDays || [];
  if (!Array.isArray(rawBlockedDays)) fail(400, 'Invalid blocked days');
  const blockedDays = [...new Set(rawBlockedDays)];
  if (blockedDays.length > 366 || blockedDays.some((date) => !isDate(date))) {
    fail(400, 'Invalid blocked days');
  }
  return { timeSettings, specialDates, blockedDays };
}

function scheduleForDate(schedule, date) {
  if (schedule.blockedDays.includes(date)) return null;
  if (schedule.specialDates[date]) return schedule.specialDates[date].start ? schedule.specialDates[date] : null;
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  const normal = schedule.timeSettings[DAY_KEYS[weekday]];
  return normal?.start ? normal : null;
}

function validateBooking(data, schedule) {
  const name = safeText(data?.name, 80);
  const contact = safeText(data?.contact, 40);
  const date = data?.date;
  const time = data?.time;
  const serviceKey = data?.serviceKey;
  const services = new Set(['haircut', 'combo', 'beard', 'kids']);
  const now = madridNow();

  if (name.length < 2) fail(400, 'Please enter your name');
  if (contact.length < 3) fail(400, 'Please enter a phone number or WhatsApp');
  if (!isDate(date)) fail(400, 'Invalid date');
  if (!isTime(time)) fail(400, 'Invalid time');
  if (!services.has(serviceKey)) fail(400, 'Invalid service');

  if (date < now.date || (date === now.date && minutes(time) <= minutes(now.time))) {
    fail(400, 'This time has already passed');
  }
  const workingHours = scheduleForDate(schedule, date);
  if (!workingHours) fail(400, 'The barbershop is closed on this day');
  if (minutes(time) < minutes(workingHours.start) || minutes(time) >= minutes(workingHours.end)) {
    fail(400, 'This time is outside working hours');
  }
  return {
    name,
    contact,
    date,
    time,
    serviceKey,
    service: safeText(data.service, 80) || serviceKey,
  };
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const cors = corsHeaders(request, env);
    const origin = request.headers.get('Origin');

    if (method === 'OPTIONS') {
      if (origin && !configuredOrigins(env).has(origin)) return response(request, env, { error: 'Origin not allowed' }, 403);
      return new Response(null, { status: 204, headers: cors });
    }

    const dataStore = env.ARTYOMCUT_DATA;
    const bucket = env.ARTYOMCUT_BUCKET;
    if (!dataStore) return response(request, env, { error: 'Server configuration error' }, 503);

    const getKV = (key) => dataStore.get(key);
    const putKV = (key, value, expirationTtl) => dataStore.put(key, value, expirationTtl ? { expirationTtl } : undefined);

    const getSchedule = async () => {
      const raw = await getKV('schedule');
      if (!raw) return structuredClone(DEFAULT_SCHEDULE);
      try {
        return cleanSchedule(JSON.parse(raw));
      } catch {
        return structuredClone(DEFAULT_SCHEDULE);
      }
    };

    const isAuthorized = async () => {
      const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
      return Boolean(token && await getKV(`session_${token}`));
    };

    // Все записи хранятся отдельными ключами booking:<id> — параллельные записи
    // больше не перезаписывают общий список и не теряются.
    const listBookings = async () => {
      const legacy = await getKV(LEGACY_BOOKINGS_KEY);
      if (legacy) {
        try {
          const old = JSON.parse(legacy);
          if (Array.isArray(old)) {
            for (const booking of old) {
              if (!booking?.id) continue;
              await putKV(BOOKING_PREFIX + booking.id, JSON.stringify(booking));
              if (isDate(booking.date) && isTime(booking.time)) {
                await putKV(SLOT_PREFIX + booking.date + ':' + booking.time, String(booking.id));
              }
            }
          }
        } catch {
          // повреждённый старый список просто игнорируем
        }
        await dataStore.delete(LEGACY_BOOKINGS_KEY);
      }

      const keys = [];
      let cursor;
      do {
        const page = await dataStore.list({ prefix: BOOKING_PREFIX, cursor });
        keys.push(...page.keys.map((key) => key.name));
        cursor = page.list_complete ? undefined : page.cursor;
      } while (cursor);

      const values = await Promise.all(keys.map((key) => getKV(key)));
      return values
        .filter(Boolean)
        .map((raw) => {
          try { return JSON.parse(raw); } catch { return null; }
        })
        .filter(Boolean);
    };

    const removeBooking = async (booking) => {
      if (!booking) return;
      const slotKey = SLOT_PREFIX + booking.date + ':' + booking.time;
      const owner = await getKV(slotKey);
      if (owner === booking.id) await dataStore.delete(slotKey);
      await dataStore.delete(BOOKING_PREFIX + booking.id);
    };

    const cleanupBookings = async () => {
      const bookings = await listBookings();
      const now = madridNow();
      const active = [];
      const expired = [];
      for (const booking of bookings) {
        const isActive = booking.date > now.date
          || (booking.date === now.date && isTime(booking.time) && minutes(booking.time) + 120 > minutes(now.time));
        (isActive ? active : expired).push(booking);
      }
      if (expired.length) await Promise.all(expired.map(removeBooking));
      return active;
    };

    try {
      if (path === '/api/auth/login' && method === 'POST') {
        if (!env.ADMIN_PASSWORD) fail(503, 'Admin password is not configured');
        const ip = getClientIp(request);
        const rateKey = `login_attempts_${ip}`;
        const attempts = Number(await getKV(rateKey) || '0');
        if (attempts >= 5) fail(429, 'Too many attempts. Try again later.');
        const body = await readJson(request);
        const password = body?.password;
        if (typeof password !== 'string' || password !== env.ADMIN_PASSWORD) {
          await putKV(rateKey, String(attempts + 1), 15 * 60);
          fail(401, 'Invalid credentials');
        }
        await dataStore.delete(rateKey);
        const token = crypto.randomUUID();
        await putKV(`session_${token}`, JSON.stringify({ createdAt: new Date().toISOString() }), 24 * 60 * 60);
        return response(request, env, { token });
      }

      if (path === '/api/auth/check' && method === 'GET') {
        return (await isAuthorized()) ? response(request, env, { valid: true }) : response(request, env, { error: 'Unauthorized' }, 401);
      }

      if (path === '/api/schedule') {
        if (method === 'GET') return response(request, env, await getSchedule());
        if (method === 'POST') {
          if (!(await isAuthorized())) fail(401, 'Unauthorized');
          const schedule = cleanSchedule(await readJson(request));
          await putKV('schedule', JSON.stringify(schedule));
          return response(request, env, { success: true, schedule });
        }
        fail(405, 'Method not allowed');
      }

      if (path === '/api/booked' && method === 'GET') {
        const date = url.searchParams.get('date');
        if (!isDate(date)) fail(400, 'Invalid date');
        const bookings = await cleanupBookings();
        return response(request, env, bookings.filter((booking) => booking.date === date).map((booking) => booking.time).sort());
      }

      if (path === '/api/bookings') {
        if (method === 'GET') {
          if (!(await isAuthorized())) fail(401, 'Unauthorized');
          return response(request, env, await cleanupBookings());
        }
        if (method === 'POST') {
          const contentLength = Number(request.headers.get('Content-Length') || '0');
          if (contentLength > MAX_JSON_BYTES) fail(413, 'Request too large');
          const booking = validateBooking(await readJson(request), await getSchedule());

          const slotKey = SLOT_PREFIX + booking.date + ':' + booking.time;
          if (await getKV(slotKey)) fail(409, 'Selected time is already booked');

          // Занимаем слот отдельным ключом и подтверждаем, что он наш:
          // при одновременной записи на один слот останется ровно один победитель.
          const id = crypto.randomUUID();
          await putKV(slotKey, id);
          await delay(SLOT_CONFIRM_DELAY_MS);
          if (await getKV(slotKey) !== id) fail(409, 'Selected time is already booked');

          const stored = { ...booking, id, createdAt: new Date().toISOString() };
          await putKV(BOOKING_PREFIX + id, JSON.stringify(stored));
          return response(request, env, { success: true, id });
        }
        if (method === 'DELETE') {
          if (!(await isAuthorized())) fail(401, 'Unauthorized');
          const id = url.searchParams.get('id');
          if (!id || id.length > 80) fail(400, 'Invalid id');
          const raw = await getKV(BOOKING_PREFIX + id);
          if (raw) {
            let booking = null;
            try { booking = JSON.parse(raw); } catch { booking = null; }
            await removeBooking(booking || { id, date: '', time: '' });
          }
          return response(request, env, { success: true });
        }
        fail(405, 'Method not allowed');
      }

      if (path === '/api/reviews') {
        if (method === 'GET') return response(request, env, await getKV('reviews').then((raw) => (raw ? JSON.parse(raw) : [])));
        if (method === 'POST') {
          const contentLength = Number(request.headers.get('Content-Length') || '0');
          if (contentLength > MAX_JSON_BYTES) fail(413, 'Request too large');
          const body = await readJson(request);
          const name = safeText(body?.name, 80);
          const message = safeText(body?.message, 1200);
          const rating = Number.parseInt(body?.rating, 10);
          if (name.length < 2 || message.length < 5 || !(rating >= 1 && rating <= 5)) fail(400, 'Invalid review data');
          const ip = getClientIp(request);
          const rateKey = `last_review_${ip}`;
          if (await getKV(rateKey)) fail(429, 'You can submit one review per week');
          const raw = await getKV('reviews');
          const reviews = raw ? JSON.parse(raw) : [];
          const review = { id: crypto.randomUUID(), name, message, rating, createdAt: new Date().toISOString() };
          await putKV('reviews', JSON.stringify([...reviews, review]));
          await putKV(rateKey, '1', 7 * 24 * 60 * 60);
          return response(request, env, { success: true });
        }
        fail(405, 'Method not allowed');
      }

      if (path.startsWith('/api/file/')) {
        if (method !== 'GET') fail(405, 'Method not allowed');
        if (!bucket) fail(503, 'Storage is not configured');
        const key = decodeURIComponent(path.slice('/api/file/'.length));
        if (!key.startsWith('gallery/')) fail(404, 'File not found');
        const object = await bucket.get(key);
        if (!object) fail(404, 'File not found');
        return new Response(object.body, {
          headers: {
            ...corsHeaders(request, env),
            'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-Content-Type-Options': 'nosniff',
          },
        });
      }

      if (path === '/api/gallery') {
        if (method === 'GET') return response(request, env, await getKV('gallery').then((raw) => (raw ? JSON.parse(raw) : [])));
        if (!(await isAuthorized())) fail(401, 'Unauthorized');
        if (!bucket) fail(503, 'Storage is not configured');
        if (method === 'POST') {
          const formData = await request.formData();
          const file = formData.get('file');
          const category = safeText(formData.get('category'), 20);
          const alt = safeText(formData.get('alt'), 120) || 'ArtyomCut work';
          const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
          if (!file || typeof file !== 'object' || !file.name || !allowedTypes.has(file.type) || file.size > MAX_IMAGE_BYTES) {
            fail(400, 'Use a JPEG, PNG or WebP image up to 8 MB');
          }
          if (!new Set(['fade', 'classic', 'beard']).has(category)) fail(400, 'Invalid gallery category');
          const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
          const key = `gallery/${crypto.randomUUID()}.${extension}`;
          await bucket.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
          const raw = await getKV('gallery');
          const photos = raw ? JSON.parse(raw) : [];
          const photo = { id: crypto.randomUUID(), src: `${url.origin}/api/file/${key}`, key, alt, category };
          await putKV('gallery', JSON.stringify([...photos, photo]));
          return response(request, env, { success: true, photo: { id: photo.id, src: photo.src } });
        }
        if (method === 'DELETE') {
          const id = url.searchParams.get('id');
          if (!id || id.length > 80) fail(400, 'Invalid id');
          const raw = await getKV('gallery');
          const photos = raw ? JSON.parse(raw) : [];
          const photo = photos.find((item) => item.id === id);
          if (photo?.key?.startsWith('gallery/')) await bucket.delete(photo.key);
          await putKV('gallery', JSON.stringify(photos.filter((item) => item.id !== id)));
          return response(request, env, { success: true });
        }
        fail(405, 'Method not allowed');
      }

      fail(404, 'Not found');
    } catch (error) {
      if (error instanceof HttpError) {
        return response(request, env, { error: error.message }, error.status);
      }
      console.error('Worker error:', error instanceof Error ? error.message : 'Unknown error');
      return response(request, env, { error: 'Internal server error' }, 500);
    }
  },
};
