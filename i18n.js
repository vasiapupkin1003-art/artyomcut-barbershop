// ========================================
// ЛОГИКА ПЕРЕКЛЮЧЕНИЯ ЯЗЫКА
// ========================================
let currentLanguage = localStorage.getItem('language') || 'ru';

function applyLanguage(lang) {
  if (!translations[lang]) lang = 'ru';
  currentLanguage = lang;
  localStorage.setItem('language', lang);

  // Заменяем все текстовые узлы
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang][key]) {
      el.innerHTML = translations[lang][key];
    }
  });

  // Плейсхолдеры
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[lang][key]) {
      el.setAttribute('placeholder', translations[lang][key]);
    }
  });

  // Обновляем выбранный язык в выпадающем списке
  document.querySelectorAll('.lang-select').forEach(select => {
    select.value = lang;
  });
}

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  applyLanguage(currentLanguage);
});
