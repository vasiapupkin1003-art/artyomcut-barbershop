// ========================================
// ОТЗЫВЫ — ЛОГИКА С ПЕРЕВОДАМИ
// ========================================
const API_BASE = 'https://artyomcut-api.vasia-pupkin1003.workers.dev';
let selectedRating = 0;

// Получить отзывы с сервера
async function getReviews() {
  const res = await fetch(`${API_BASE}/api/reviews`);
  if (!res.ok) throw new Error('Ошибка загрузки отзывов');
  return await res.json();
}

// Отобразить список отзывов
async function renderReviews() {
  const container = document.getElementById('reviewsList');
  if (!container) return;

  const lang = currentLanguage || 'ru';
  const t = translations[lang] || translations['ru'];

  try {
    const reviews = await getReviews();
    if (!reviews.length) {
      const empty = document.createElement('div');
      empty.className = 'no-reviews';
      empty.textContent = t.no_reviews;
      container.replaceChildren(empty);
      return;
    }

    const locale = lang === 'uk' ? 'uk-UA' : lang === 'es' ? 'es-ES' : lang === 'en' ? 'en-GB' : 'ru-RU';
    const fragment = document.createDocumentFragment();
    reviews
      .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
      .forEach(review => {
        const item = document.createElement('article');
        item.className = 'review-item';
        const header = document.createElement('div');
        header.className = 'review-header';
        const name = document.createElement('span');
        name.className = 'review-name';
        name.textContent = String(review.name || '').slice(0, 80);
        const stars = document.createElement('span');
        stars.className = 'review-stars';
        const rating = Math.min(5, Math.max(1, Number.parseInt(review.rating, 10) || 1));
        stars.textContent = '★'.repeat(rating) + '☆'.repeat(5 - rating);
        const message = document.createElement('p');
        message.className = 'review-message';
        message.textContent = String(review.message || '').slice(0, 1200);
        const date = document.createElement('p');
        date.className = 'review-date';
        const createdAt = new Date(review.createdAt || review.date);
        date.textContent = Number.isNaN(createdAt.getTime()) ? '' : createdAt.toLocaleString(locale);
        header.append(name, stars);
        item.append(header, message, date);
        fragment.append(item);
      });
    container.replaceChildren(fragment);
  } catch (error) {
    console.error('Ошибка загрузки отзывов:', error);
    const empty = document.createElement('div');
    empty.className = 'no-reviews';
    empty.textContent = t.no_reviews;
    container.replaceChildren(empty);
  }
}

// Инициализация звёзд
function initRating() {
    const stars = document.querySelectorAll('#ratingStars .star');
    const ratingValue = document.getElementById('ratingValue');

    stars.forEach(star => {
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.getAttribute('data-value'));
            updateStars();
            if (ratingValue) ratingValue.textContent = selectedRating + '/5';
        });

        star.addEventListener('mouseenter', function() {
            const hoverValue = parseInt(this.getAttribute('data-value'));
            stars.forEach(s => {
                s.classList.toggle('active', parseInt(s.getAttribute('data-value')) <= hoverValue);
            });
        });

        star.addEventListener('mouseleave', function() {
            updateStars();
        });
    });
}

function updateStars() {
    const stars = document.querySelectorAll('#ratingStars .star');
    stars.forEach(star => {
        const value = parseInt(star.getAttribute('data-value'));
        star.classList.toggle('active', value <= selectedRating);
    });
}

// Показать переведённое сообщение
function showReviewAlert(key) {
    const lang = currentLanguage || 'ru';
    const t = translations[lang] || translations['ru'];
    alert(t[key] || translations['ru'][key] || key);
}

// Отправить отзыв
async function submitReview() {
  const nameInput = document.getElementById('reviewName');
  const messageInput = document.getElementById('reviewMessage');
  const name = nameInput.value.trim().slice(0, 80);
  const message = messageInput.value.trim().slice(0, 1200);

  if (!name) {
    showReviewAlert('review_alert_name');
    nameInput.focus();
    return;
  }
  if (selectedRating === 0) {
    showReviewAlert('review_alert_rating');
    return;
  }
  if (!message) {
    showReviewAlert('review_alert_message');
    messageInput.focus();
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, rating: selectedRating, message })
    });
    const data = await res.json();
    if (!res.ok) {
      // Если сервер вернул 429 (уже оставлял отзыв), показываем перевод
      if (res.status === 429) {
        showReviewAlert('review_alert_already');
      } else {
        alert(data.error || 'Ошибка отправки');
      }
      return;
    }

    nameInput.value = '';
    messageInput.value = '';
    selectedRating = 0;
    updateStars();
    const ratingValue = document.getElementById('ratingValue');
    if (ratingValue) ratingValue.textContent = '0/5';

    renderReviews();
    showReviewAlert('review_alert_success');
  } catch (err) {
    console.error(err);
    showReviewAlert('review_alert_network');
  }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initRating();
    renderReviews();
});
