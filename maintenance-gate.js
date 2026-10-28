/* ============================================================
   ArtyomCut Barbershop — режим «Идут технические работы»
   ------------------------------------------------------------
   Этот файл закрывает сайт заглушкой maintenance.html.
   Владелец попадает внутрь по ключу доступа (см. ниже),
   обычные посетители видят только страницу «Идут работы».

   КАК ВЫКЛЮЧИТЬ РЕЖИМ РАБОТ:
   поставьте enabled: false  →  задеплойте сайт заново.
   Ничего больше менять не нужно.

   Инструкция целиком: MAINTENANCE-README.md
   ============================================================ */
(function () {
    'use strict';

    var CONFIG = {
        // true  — сайт закрыт заглушкой
        // false — сайт работает как обычно
        enabled: true,

        // страница-заглушка (лежит в корне сайта)
        page: '/maintenance.html',

        // cookie, которая запоминает владельца на 30 дней
        cookie: 'ac_preview',
        days: 30,

        // отпечаток ключа доступа.
        // Сам ключ здесь НЕ хранится — только его хеш.
        hash: 'a2f739e9a5ab84bc',

        // эти адреса не закрываем:
        // заглушка, админка (у неё свой пароль) и политика конфиденциальности
        open: [
            '/maintenance.html',
            '/maintenance',
            '/admin.html',
            '/admin',
            '/privacy.html',
            '/privacy'
        ]
    };

    /* ---------- короткий детерминированный хеш (без зависимостей) ---------- */

    function fnv(str, seed) {
        var h = seed >>> 0;
        for (var i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
        }
        return ('0000000' + h.toString(16)).slice(-8);
    }

    function digest(value) {
        var normalized = String(value == null ? '' : value).trim().toUpperCase();
        return fnv('ac1:' + normalized, 0x811c9dc5) + fnv('ac2:' + normalized, 0x2f0d2b1d);
    }

    /* ---------- cookie ---------- */

    function readCookie(name) {
        var parts = document.cookie ? document.cookie.split(';') : [];
        for (var i = 0; i < parts.length; i++) {
            var part = parts[i].replace(/^\s+/, '');
            var eq = part.indexOf('=');
            if (eq > 0 && part.slice(0, eq) === name) {
                try {
                    return decodeURIComponent(part.slice(eq + 1));
                } catch (e) {
                    return part.slice(eq + 1);
                }
            }
        }
        return '';
    }

    function writeCookie(name, value, days) {
        var expires = new Date(Date.now() + days * 86400000).toUTCString();
        var secure = location.protocol === 'https:' ? '; Secure' : '';
        document.cookie = name + '=' + encodeURIComponent(value) +
            '; expires=' + expires + '; path=/; SameSite=Lax' + secure;
    }

    function isUnlocked() {
        var value = readCookie(CONFIG.cookie);
        return !!value && digest(value) === CONFIG.hash;
    }

    function unlock(key) {
        var value = String(key == null ? '' : key).trim().toUpperCase();
        if (!value || digest(value) !== CONFIG.hash) return false;
        writeCookie(CONFIG.cookie, value, CONFIG.days);
        return true;
    }

    function lock() {
        document.cookie = CONFIG.cookie + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    }

    /* ---------- служебное ---------- */

    // локальная разработка не блокируется: file://, localhost, 127.0.0.1
    var isLocal = location.protocol === 'file:' ||
        /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

    function isOpenPath(path) {
        var clean = path.replace(/\/+$/, '') || '/';
        return CONFIG.open.indexOf(clean) !== -1;
    }

    // разрешаем только локальные пути — защита от подмены ?next=
    function safeNext(raw) {
        var value = String(raw || '');
        if (value.charAt(0) !== '/' || value.charAt(1) === '/' || value.charAt(1) === '\\') return '/';
        return value;
    }

    // ?k=КЛЮЧ в адресе: сохраняем cookie и убираем ключ из строки браузера
    // ?lock=1 — снять доступ на этом устройстве
    var keyState = null;
    function captureKey() {
        if (!location.search) return;
        var params = new URLSearchParams(location.search);
        var changed = false;

        if (params.has('lock')) {
            lock();
            params.delete('lock');
            changed = true;
        }

        if (params.has('k')) {
            keyState = unlock(params.get('k')) ? 'ok' : 'bad';
            params.delete('k');
            changed = true;
        }

        if (changed) {
            var query = params.toString();
            try {
                history.replaceState(null, '', location.pathname + (query ? '?' + query : '') + location.hash);
            } catch (e) { /* ignore */ }
        }
    }

    function guard() {
        if (!CONFIG.enabled || isLocal || isOpenPath(location.pathname)) return;
        if (isUnlocked()) return;

        var next = location.pathname + location.search;
        var url = CONFIG.page + '?next=' + encodeURIComponent(next);
        if (keyState === 'bad') url += '&badkey=1';
        location.replace(url);
    }

    window.ACGate = {
        enabled: CONFIG.enabled,
        isUnlocked: isUnlocked,
        unlock: unlock,
        lock: lock,
        guard: guard,
        digest: digest,
        next: function () { return safeNext(new URLSearchParams(location.search).get('next')); }
    };

    captureKey();
    guard();
})();
