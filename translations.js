// ========================================
// ПЕРЕВОДЫ ДЛЯ САЙТА
// ========================================
const translations = {
  ru: {
    // Шапка
    "nav_home": "ГЛАВНАЯ",
    "nav_services": "УСЛУГИ",
    "nav_master": "МАСТЕР",
    "nav_gallery": "ГАЛЕРЕЯ",
    "nav_reviews": "ОТЗЫВЫ",
    "nav_music": "МУЗЫКА",
    "nav_booking": "ЗАПИСЬ",
    "nav_contacts": "КАК НАС НАЙТИ",
    "back_to_site": "← НА САЙТ",

    // Главный экран
    "hero_small_title": "ARTYOMCUT BARBERSHOP",
    "hero_title_1": "СТИЛЬ",
    "hero_title_2": "РЕШАЕТ",
    "hero_title_3": "ВСЁ.",
    "hero_subtitle": "ТВОЙ СТИЛЬ. ТВОИ ПРАВИЛА.",
    "hero_btn_booking": "ЗАПИСАТЬСЯ",
    "hero_btn_gallery": "КАК НАС НАЙТИ",

    // Услуги
    "services_heading": "НАШИ УСЛУГИ",
    "service_haircut": "СТРИЖКА",
    "service_haircut_type": "ФЕЙД / КЛАССИКА / АНДЕРКАРТ",
    "service_beard": "БОРОДА",
    "service_beard_type": "БРИТЬЕ / УХОД",
    "service_combo": "СТРИЖКА + БОРОДА",
    "service_combo_type": "КОМПЛЕКС",
    "service_kids": "ДЕТСКАЯ",
    "service_kids_type": "ДО 12 ЛЕТ",

    // О мастере
    "master_heading": "О МАСТЕРЕ",
    "master_text_1": "Привет, я АРТЁМ — твой барбер в Хихоне.",
    "master_text_2": "Более 10 лет я создаю стиль для мужчин, которые знают, чего хотят. Для меня барберинг — это не просто стрижка, это искусство подчеркнуть твой характер.",
    "master_text_3": "Рок, барабаны, кофе и идеальный фейд — вот моя формула. Приходи, и ты поймёшь, почему мои клиенты возвращаются.",
    "master_text_4": "Твой стиль. Твои правила.",

    // Галерея
    "gallery_heading": "ГАЛЕРЕЯ РАБОТ",
    "gallery_view_all": "СМОТРЕТЬ ВСЕ →",
    "gallery_filters_all": "ВСЕ",
    "gallery_filters_fade": "FADE",
    "gallery_filters_classic": "CLASSIC",
    "gallery_filters_beard": "BEARD",

    // Музыка
    "music_heading": "МУЗЫКА RADIO",
    "music_player_title": "МУЗЫКА ⚡",
    "music_station": "ARTYOMCUT",
    "music_station_accent": "RADIO",
    "music_status_stopped": "Радио остановлено",

    // Запись
    "booking_heading": "ОНЛАЙН-ЗАПИСЬ",
    "booking_step_date": "1. ВЫБЕРИТЕ ДАТУ",
    "booking_step_service": "2. ВЫБЕРИТЕ УСЛУГУ",
    "booking_step_time": "3. ВЫБЕРИТЕ ВРЕМЯ",
    "booking_service_haircut": "СТРИЖКА",
    "booking_service_haircut_desc": "Фейд / Классика / Андеркарт",
    "booking_service_combo": "СТРИЖКА + БОРОДА",
    "booking_service_combo_desc": "Комплекс",
    "booking_service_beard": "БОРОДА",
    "booking_service_beard_desc": "Бритье / Уход",
    "booking_service_kids": "ДЕТСКАЯ",
    "booking_service_kids_desc": "До 12 лет",
    "booking_btn": "ЗАПИСАТЬСЯ →",
    "time_placeholder": "Сначала выберите дату",
    "contact_form_heading": "ПОДТВЕРДИТЕ ЗАПИСЬ",
    "contact_service_label": "Услуга:",
    "contact_date_label": "Дата:",
    "contact_time_label": "Время:",
    "contact_name_placeholder": "Ваше имя",
    "contact_contact_placeholder": "@username или +34 XXX XXX XXX",
    "contact_submit": "ПОДТВЕРДИТЬ ЗАПИСЬ",
    "success_message": "ЗАПИСЬ ПОДТВЕРЖДЕНА!",
    "success_text": ", ждем вас!",
    "success_ok": "ОТЛИЧНО!",

    // Контакты
    "contacts_heading": "КАК НАС НАЙТИ",
    "contacts_address_label": "АДРЕС",
    "contacts_address_value": "Calle de San Manuel, 13",
    "contacts_address_small": "Centro, 33210 Gijón",
    "contacts_phone_label": "ТЕЛЕФОН",
    "contacts_phone_value": "+34 602 692 534",
    "contacts_telegram_label": "TELEGRAM",
    "contacts_telegram_value": "@artyomcut",
    "contacts_instagram_label": "INSTAGRAM",
    "contacts_instagram_value": "@artembarbercat",
    "route_btn": "🧭 ПОСТРОИТЬ МАРШРУТ",

    // Отзывы
    "reviews_heading": "ОТЗЫВЫ КЛИЕНТОВ",
    "reviews_form_heading": "ОСТАВИТЬ ОТЗЫВ",
    "review_name_label": "ВАШЕ ИМЯ",
    "review_name_placeholder": "Как вас зовут?",
    "review_rating_label": "ВАША ОЦЕНКА",
    "review_message_label": "ВАШЕ СООБЩЕНИЕ",
    "review_message_placeholder": "Напишите пару слов о визите...",
    "review_submit": "ОТПРАВИТЬ ОТЗЫВ",
    "no_reviews": "Пока нет отзывов. Будьте первым!",
    "reviews_preview_heading": "ПОСЛЕДНИЕ ОТЗЫВЫ",
    "reviews_preview_all": "ВСЕ ОТЗЫВЫ →",

    // Футер
    "footer_copyright": "© 2026 ArtyomCut Barbershop — Gijón",
    "footer_slogan": "ROCK & CUTS ⚡ SINCE 2021",

    // Страница "Как нас найти"
    "location_eyebrow": "Локация",
    "location_heading": "Как нас найти",
    "location_sub": "Barbershop в самом центре Хихона — рядом с Calle de San Manuel. Пять минут пешком от площади, сложно промахнуться.",
    "location_open_in_maps": "Открыть в картах",
    "location_route": "Построить маршрут",
    "location_address_label": "Адрес",
    "location_address_value": "Calle de San Manuel, 13",
    "location_address_small": "Centro, 33210 Gijón",
    "location_phone_label": "Телефон",
    "location_phone_value": "+34 602 692 534",
    "location_telegram_label": "Telegram",
    "location_telegram_value": "@artyomcut",
    "location_instagram_label": "Instagram",
    "location_instagram_value": "@artembarbercat",
    "hours_title": "Часы работы (ближайшие 7 дней)",
    "hours_day_sunday": "Воскресенье",
    "hours_day_monday": "Понедельник",
    "hours_day_tuesday": "Вторник",
    "hours_day_wednesday": "Среда",
    "hours_day_thursday": "Четверг",
    "hours_day_friday": "Пятница",
    "hours_day_saturday": "Суббота",
    "hours_today_suffix": " • Сегодня",
    "hours_off": "Выходной",

    // Общие
    "language_button": "ЯЗЫК"
  },
  uk: { /* переводы на украинский */ },
  es: { /* испанский */ },
  en: { /* английский */ }
};
