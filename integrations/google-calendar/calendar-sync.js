/* ============================================================
   ArtyomCut → Google Calendar
   ------------------------------------------------------------
   Заготовка автоматической синхронизации записей с Google Календарём.
   Отдельный Cloudflare Worker: раз в 5 минут забирает записи из API
   сайта и создаёт/обновляет/удаляет события в календаре владельца.

   Как включить — см. README.md в этой же папке.
   ============================================================ */

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/calendar';
const SITE = 'https://artyomcut-barbershopgijon.es';
const ADDRESS = 'Calle de San Manuel, 13, 33210 Gijón';
const TIMEZONE = 'Europe/Madrid';

export default {
    async scheduled(_event, env, ctx) {
        ctx.waitUntil(runSync(env));
    },

    async fetch(request, env) {
        const url = new URL(request.url);
        if (url.pathname === '/sync') {
            const secret = url.searchParams.get('secret') || '';
            if (!env.TRIGGER_SECRET || secret !== env.TRIGGER_SECRET) {
                return new Response('forbidden', { status: 403 });
            }
            try {
                const result = await runSync(env);
                return Response.json(result);
            } catch (error) {
                return Response.json({ ok: false, error: String(error && error.message || error) }, { status: 500 });
            }
        }
        return new Response('ArtyomCut calendar sync. GET /sync?secret=... для ручного запуска.', {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }
};

/* ---------- основная синхронизация ---------- */

export async function runSync(env) {
    const token = await getAccessToken(env);
    const state = (await env.SYNC_STATE.get('map', 'json')) || {};
    const bookings = await fetchBookings(env);
    const active = new Set();
    let created = 0;
    let updated = 0;
    let removed = 0;

    for (const booking of bookings) {
        const id = String(booking.id || `${booking.date}-${booking.time}-${booking.name}`);
        active.add(id);
        const sig = `${booking.date} ${booking.time} ${booking.service} ${booking.name} ${booking.contact}`;
        const known = state[id];

        if (!known) {
            const eventId = await createEvent(token, env.GOOGLE_CALENDAR_ID, toGoogleEvent(booking, id));
            state[id] = { eventId, sig };
            created++;
        } else if (known.sig !== sig) {
            await updateEvent(token, env.GOOGLE_CALENDAR_ID, known.eventId, toGoogleEvent(booking, id));
            state[id].sig = sig;
            updated++;
        }
    }

    for (const [id, known] of Object.entries(state)) {
        if (active.has(id)) continue;
        await deleteEvent(token, env.GOOGLE_CALENDAR_ID, known.eventId);
        delete state[id];
        removed++;
    }

    await env.SYNC_STATE.put('map', JSON.stringify(state));
    return { ok: true, total: bookings.length, created, updated, removed };
}

/* ---------- API сайта ---------- */

async function fetchBookings(env) {
    const loginRes = await fetch(`${env.AC_API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'ArtyomCutCalendarSync/1.0' },
        body: JSON.stringify({ password: env.AC_ADMIN_PASSWORD })
    });
    if (!loginRes.ok) throw new Error('Не удалось войти в админку API: ' + loginRes.status);
    const { token } = await loginRes.json();

    const res = await fetch(`${env.AC_API_BASE}/api/bookings`, {
        headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'ArtyomCutCalendarSync/1.0' }
    });
    if (!res.ok) throw new Error('Не удалось получить записи: ' + res.status);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
}

/* ---------- события ---------- */

function pad(value) { return String(value).padStart(2, '0'); }

function addMinutes(date, time, minutes) {
    const [y, m, d] = String(date).split('-').map(Number);
    const [hh, mm] = String(time).split(':').map(Number);
    const stamp = new Date(Date.UTC(y, m - 1, d, hh, mm) + minutes * 60000);
    return `${stamp.getUTCFullYear()}-${pad(stamp.getUTCMonth() + 1)}-${pad(stamp.getUTCDate())}T${pad(stamp.getUTCHours())}:${pad(stamp.getUTCMinutes())}:00`;
}

export function toGoogleEvent(booking, id) {
    return {
        summary: `ArtyomCut — ${booking.service || 'Запись'}`,
        location: ADDRESS,
        description: [
            booking.name || '',
            booking.contact || '',
            SITE
        ].filter(Boolean).join('\n'),
        start: { dateTime: `${booking.date}T${String(booking.time).slice(0, 5)}:00`, timeZone: TIMEZONE },
        end: { dateTime: addMinutes(booking.date, booking.time, 60), timeZone: TIMEZONE },
        iCalUID: `${id}@artyomcut-barbershopgijon.es`,
        reminders: { useDefault: true }
    };
}

async function createEvent(token, calendarId, event) {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
    });
    if (!res.ok) throw new Error('Google create: ' + res.status + ' ' + (await res.text()).slice(0, 300));
    const data = await res.json();
    return data.id;
}

async function updateEvent(token, calendarId, eventId, event) {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
    });
    if (!res.ok && res.status !== 404) {
        throw new Error('Google update: ' + res.status + ' ' + (await res.text()).slice(0, 300));
    }
}

async function deleteEvent(token, calendarId, eventId) {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok && res.status !== 404 && res.status !== 410) {
        throw new Error('Google delete: ' + res.status + ' ' + (await res.text()).slice(0, 300));
    }
}

/* ---------- авторизация сервисного аккаунта (JWT RS256) ---------- */

function base64url(input) {
    const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToArrayBuffer(pem) {
    const body = String(pem)
        .replace(/\\n/g, '\n')
        .replace(/-----BEGIN PRIVATE KEY-----/, '')
        .replace(/-----END PRIVATE KEY-----/, '')
        .replace(/\s+/g, '');
    const binary = atob(body);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
}

export async function getAccessToken(env) {
    const now = Math.floor(Date.now() / 1000);
    const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const claim = base64url(JSON.stringify({
        iss: env.GOOGLE_CLIENT_EMAIL,
        scope: SCOPE,
        aud: TOKEN_URL,
        iat: now,
        exp: now + 3600
    }));
    const unsigned = `${header}.${claim}`;

    const key = await crypto.subtle.importKey(
        'pkcs8',
        pemToArrayBuffer(env.GOOGLE_PRIVATE_KEY),
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
    const assertion = `${unsigned}.${base64url(new Uint8Array(signature))}`;

    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion
        })
    });
    const data = await res.json();
    if (!res.ok) throw new Error('Google token: ' + JSON.stringify(data).slice(0, 300));
    return data.access_token;
}
