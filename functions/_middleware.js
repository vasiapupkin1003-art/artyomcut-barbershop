/* ============================================================
   ArtyomCut Barbershop — необязательный серверный слой режима
   «Идут технические работы» для Cloudflare Pages.

   Как включить:
   1) Cloudflare Pages → проект → Settings → Variables and Secrets
      → добавить переменную окружения  MAINTENANCE_KEY = ac-QKBV-RCBW-ZGZM
      (тот же ключ, что в maintenance-gate.js).
   2) Передеплоить сайт.

   Если переменная не задана — файл ничего не блокирует (сайт работает
   как обычно, защиту делает только maintenance-gate.js).

   Что даёт этот файл:
   - посетитель получает страницу «Идут работы» со статусом 503,
     а поисковики понимают, что сайт временно недоступен, и не выбрасывают
     страницы из индекса (в отличие от клиентского редиректа);
   - HTML настоящих страниц вообще не отдаётся без ключа.

   Сайт на другом хостинге (Netlify, GitHub Pages и т.п.) — файл просто
   игнорируется, всё работает через maintenance-gate.js.
   ============================================================ */

const COOKIE = 'ac_preview';

function readCookie(header, name) {
  const parts = String(header || '').split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf('=');
    if (eq > 0 && trimmed.slice(0, eq) === name) {
      try {
        return decodeURIComponent(trimmed.slice(eq + 1));
      } catch (e) {
        return trimmed.slice(eq + 1);
      }
    }
  }
  return '';
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  const key = env && env.MAINTENANCE_KEY;
  // Ключ не настроен — ничего не блокируем.
  if (!key) return next();

  const path = url.pathname;

  // Эти адреса открыты всегда: заглушка, админка (у неё свой пароль),
  // политика конфиденциальности.
  const isOpen = path === '/maintenance.html' ||
    path === '/maintenance' ||
    path === '/admin.html' ||
    path === '/admin' ||
    path === '/privacy.html' ||
    path === '/privacy';

  // Быстрый вход по ссылке: /?k=КЛЮЧ → cookie и чистый адрес
  if (url.searchParams.has('k')) {
    if (url.searchParams.get('k').trim().toUpperCase() !== key.trim().toUpperCase()) {
      return new Response('Неверный ключ доступа', {
        status: 403,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
      });
    }
    const clean = new URL(url);
    clean.searchParams.delete('k');
    return new Response(null, {
      status: 302,
      headers: {
        Location: clean.pathname + clean.search + clean.hash,
        'Set-Cookie': COOKIE + '=' + encodeURIComponent(key) +
          '; Path=/; Max-Age=2592000; Secure; SameSite=Lax',
        'Cache-Control': 'no-store'
      }
    });
  }

  const unlocked = readCookie(request.headers.get('Cookie'), COOKIE).toUpperCase() === key.toUpperCase();
  if (unlocked || isOpen) return next();

  // Отдаём заглушку со статусом 503 (временно недоступно)
  const assetUrl = new URL('/maintenance.html', url);
  const asset = await env.ASSETS.fetch(new Request(assetUrl.toString(), {
    method: 'GET',
    headers: request.headers
  }));
  const headers = new Headers(asset.headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  headers.set('Retry-After', '86400');
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Robots-Tag', 'noindex, nofollow');

  return new Response(asset.body, { status: 503, headers });
}
