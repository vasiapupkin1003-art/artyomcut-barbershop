// ========================================
// ЛОГИКА ПЕРЕКЛЮЧЕНИЯ ЯЗЫКА
// ========================================
let currentLanguage = localStorage.getItem('language') || 'ru';

function applyLanguage(lang) {
  if (!translations[lang]) lang = 'ru';
  currentLanguage = lang;
  localStorage.setItem('language', lang);

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang][key]) {
      el.innerHTML = translations[lang][key];
    }
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
}

document.addEventListener('DOMContentLoaded', () => {
  applyLanguage(currentLanguage);
});
