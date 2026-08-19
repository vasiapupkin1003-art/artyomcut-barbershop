// ========================================
// ОТЗЫВЫ — ЛОГИКА
// ========================================
const API_BASE = 'https://artyomcut-api.vasia-pupkin1003.workers.dev';
let selectedRating = 0;

// Получить отзывы из localStorage
async function getReviews() {
  const res = await fetch(`${API_BASE}/api/reviews`);
  return await res.json();
}

// Отобразить список отзывов
async function renderReviews() {
  const container = document.getElementById('reviewsList');
  if (!container) return;

  const reviews = await getReviews();
  if (reviews.length === 0) {
    container.innerHTML = '<div class="no-reviews">Пока нет отзывов. Будьте первым!</div>';
    return;
  }
  reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  container.innerHTML = reviews.map(review => `
    <div class="review-item">
      <div class="review-header">
        <span class="review-name">${review.name}</span>
        <span class="review-stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
      </div>
      <p class="review-message">${review.message}</p>
      <p class="review-date">${new Date(review.createdAt).toLocaleString('ru-RU')}</p>
    </div>
  `).join('');
}

    // Сортировка: новые сверху
    reviews.sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = reviews.map(review => `
        <div class="review-item">
            <div class="review-header">
                <span class="review-name">${review.name}</span>
                <span class="review-stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
            </div>
            <p class="review-message">${review.message}</p>
            <p class="review-date">${new Date(review.date).toLocaleString('ru-RU')}</p>
        </div>
    `).join('');
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

// Обновить отображение звёзд в соответствии с выбранным рейтингом
function updateStars() {
    const stars = document.querySelectorAll('#ratingStars .star');
    stars.forEach(star => {
        const value = parseInt(star.getAttribute('data-value'));
        star.classList.toggle('active', value <= selectedRating);
    });
}

// Отправить отзыв
async function submitReview() {
  const nameInput = document.getElementById('reviewName');
  const messageInput = document.getElementById('reviewMessage');
  const name = nameInput.value.trim();
  const message = messageInput.value.trim();

  if (!name) { alert('Пожалуйста, укажите ваше имя'); nameInput.focus(); return; }
  if (selectedRating === 0) { alert('Пожалуйста, выберите оценку'); return; }
  if (!message) { alert('Пожалуйста, напишите сообщение'); messageInput.focus(); return; }

  try {
    const res = await fetch(`${API_BASE}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, rating: selectedRating, message })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Ошибка отправки');
      return;
    }
    nameInput.value = '';
    messageInput.value = '';
    selectedRating = 0;
    updateStars();
    document.getElementById('ratingValue').textContent = '0/5';
    renderReviews();
    alert('✅ Спасибо за ваш отзыв!');
  } catch (err) {
    console.error(err);
    alert('Ошибка сети. Попробуйте позже.');
  }
}

    // Очистить форму
    nameInput.value = '';
    messageInput.value = '';
    selectedRating = 0;
    updateStars();
    const ratingValue = document.getElementById('ratingValue');
    if (ratingValue) ratingValue.textContent = '0/5';

    // Перерисовать список
    renderReviews();

    alert('✅ Спасибо за ваш отзыв!');
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initRating();
    renderReviews();
});
document.addEventListener('DOMContentLoaded', function() {
  initRating();
  renderReviews();
});
