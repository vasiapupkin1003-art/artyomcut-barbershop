// ========================================
// ЛОГИКА ПЕРЕКЛЮЧЕНИЯ ЯЗЫКА
// ========================================
function getBrowserLanguage() {
    const lang = (navigator.language || navigator.languages?.[0] || 'ru').toLowerCase();
    if (lang.startsWith('uk')) return 'uk';
    if (lang.startsWith('es')) return 'es';
    if (lang.startsWith('en')) return 'en';
    return 'ru';
}

let currentLanguage = localStorage.getItem('language') || getBrowserLanguage();

function applyLanguage(lang) {
  if (!translations[lang]) lang = 'ru';
  currentLanguage = lang;
  localStorage.setItem('language', lang);

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  // Only controlled, bundled translations may contain markup.
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (translations[lang][key]) el.innerHTML = translations[lang][key];
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[lang][key]) {
      el.setAttribute('placeholder', translations[lang][key]);
    }
  });

  document.querySelectorAll('.lang-select').forEach(select => {
    select.value = lang;
  });

  applyDocumentMetadata(lang);
}

function applyDocumentMetadata(lang) {
  const path = location.pathname.replace(/\/$/, '') || '/';
  const page = path.includes('gallery') ? 'gallery'
    : path.includes('reviews') ? 'reviews'
    : path.includes('location') ? 'location'
    : 'home';
  const metadata = {
    home: {
      ru: ['ArtyomCut — Барбершоп | Хихон', 'ArtyomCut Barbershop в Хихоне — мужские стрижки, борода, онлайн-запись.'],
      uk: ['ArtyomCut — Барбершоп | Хіхон', 'ArtyomCut Barbershop у Хіхоні — чоловічі стрижки, борода та онлайн-запис.'],
      es: ['ArtyomCut — Barbería en Gijón', 'Barbería ArtyomCut en Gijón: cortes de pelo, barba y reserva online.'],
      en: ['ArtyomCut — Barbershop | Gijón', 'ArtyomCut Barbershop in Gijón — haircuts, beard care and online booking.']
    },
    gallery: {
      ru: ['Галерея работ — ArtyomCut | Барбершоп', 'Галерея работ ArtyomCut Barbershop в Хихоне.'],
      uk: ['Галерея робіт — ArtyomCut | Барбершоп', 'Галерея робіт ArtyomCut Barbershop у Хіхоні.'],
      es: ['Galería de trabajos — ArtyomCut | Barbería', 'Galería de cortes y barbas de ArtyomCut Barbershop en Gijón.'],
      en: ['Work gallery — ArtyomCut | Barbershop', 'Haircuts and beard work by ArtyomCut Barbershop in Gijón.']
    },
    reviews: {
      ru: ['Отзывы — ArtyomCut | Барбершоп', 'Отзывы клиентов ArtyomCut Barbershop в Хихоне.'],
      uk: ['Відгуки — ArtyomCut | Барбершоп', 'Відгуки клієнтів ArtyomCut Barbershop у Хіхоні.'],
      es: ['Reseñas — ArtyomCut | Barbería', 'Reseñas de clientes de ArtyomCut Barbershop en Gijón.'],
      en: ['Reviews — ArtyomCut | Barbershop', 'Customer reviews for ArtyomCut Barbershop in Gijón.']
    },
    location: {
      ru: ['Как нас найти — ArtyomCut | Хихон', 'Адрес, часы работы и контакты ArtyomCut Barbershop в Хихоне.'],
      uk: ['Як нас знайти — ArtyomCut | Хіхон', 'Адреса, графік та контакти ArtyomCut Barbershop у Хіхоні.'],
      es: ['Cómo encontrarnos — ArtyomCut | Gijón', 'Dirección, horarios y contactos de ArtyomCut Barbershop en Gijón.'],
      en: ['Find us — ArtyomCut | Gijón', 'Address, opening hours and contacts for ArtyomCut Barbershop in Gijón.']
    }
  };
  const [title, description] = metadata[page][lang] || metadata[page].ru;
  document.documentElement.lang = lang;
  document.title = title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
}

document.addEventListener('DOMContentLoaded', () => {
  applyLanguage(currentLanguage);
});
