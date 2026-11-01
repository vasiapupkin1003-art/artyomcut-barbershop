# Записи → Google Календарь

## Что уже работает (без настройки)

- **Клиенту:** после успешной записи в окне появляются кнопки «Добавить в Google Календарь» и «Скачать .ics» — клиент сам добавляет визит в свой календарь.
- **Вам:** в админке у каждой записи есть ссылка «В КАЛЕНДАРЬ» — один клик, и запись в вашем Google Календаре.

Это ничего не требует: всё работает на стороне браузера (файл `calendar.js`).

## Что делает этот модуль (автоматизация)

Отдельный Cloudflare Worker раз в 5 минут:

1. заходит в API сайта под паролем админки;
2. забирает все записи;
3. создаёт события в вашем Google Календаре, новые — добавляет, изменённые — обновляет, удалённые — удаляет;
4. ничего не дублирует: связка «запись → событие» хранится в KV.

---

## Настройка (≈15 минут, один раз)

### 1. Google Cloud: сервисный аккаунт

1. Откройте https://console.cloud.google.com → создайте проект (или выберите существующий).
2. **APIs & Services → Library** → найдите **Google Calendar API** → **Enable**.
3. **IAM & Admin → Service Accounts → Create service account** — имя любое (например, `artyomcut-calendar`), роли не нужны.
4. У созданного аккаунта: **Keys → Add key → Create new key → JSON** → скачайте файл.
   В нём понадобятся `client_email` (вида `artyomcut-calendar@...iam.gserviceaccount.com`) и `private_key`.

### 2. Google Календарь: доступ

1. Откройте https://calendar.google.com → у нужного календаря **⋮ → Settings and sharing**.
2. **Share with specific people** → **Add people** → вставьте `client_email` из JSON → права **Make changes to events**.
3. На той же странице найдите **Calendar ID** (вида `xxxx@group.calendar.google.com`) — он понадобится ниже.

### 3. Worker на Cloudflare

```bash
npm install -g wrangler
wrangler login

# в папке integrations/google-calendar
wrangler kv namespace create SYNC_STATE
```

Команда выведет `id = "..."` — вставьте его в `wrangler.toml` (пример уже лежит рядом: `wrangler.toml.example`).

Секреты (каждый — отдельная команда, значения вставляются в диалоге):

```bash
wrangler secret put AC_ADMIN_PASSWORD    # пароль от админки сайта
wrangler secret put GOOGLE_CLIENT_EMAIL  # client_email из JSON
wrangler secret put GOOGLE_PRIVATE_KEY   # private_key из JSON (вместе с BEGIN/END)
wrangler secret put GOOGLE_CALENDAR_ID   # Calendar ID из шага 2
wrangler secret put TRIGGER_SECRET       # придумайте свой пароль для ручного запуска
```

Деплой:

```bash
wrangler deploy
```

### 4. Проверка

```bash
curl "https://artyomcut-calendar-sync.<ваш-поддомен>.workers.dev/sync?secret=<TRIGGER_SECRET>"
```

Ответ вида `{"ok":true,"total":3,"created":3,"updated":0,"removed":0}` — значит, события созданы.
Дальше Worker запускается сам по расписанию (cron `*/5 * * * *`).

---

## Как проверить, что всё работает

1. Создайте тестовую запись на сайте (можно с телефона).
2. Подождите 5–10 минут (или дёрните `/sync?secret=...` вручную).
3. В Google Календаре появится событие «ArtyomCut — Стрижка» с именем, телефоном и адресом.
4. Удалите запись в админке — событие исчезнет из календаря при следующей синхронизации.

## Нюансы

- Часовой пояс событий — `Europe/Madrid` (в коде `TIMEZONE`).
- Приватный ключ Google хранится только в секретах Cloudflare, в репозитории его нет.
- Если поменяете пароль админки — обновите секрет `AC_ADMIN_PASSWORD`.
- Если в календаре несколько календарей — используйте ID именно того, куда должны падать записи.
- При повторном деплое Worker не создаёт дубли: уже отправленные записи пропускаются по ID.
