// ========================================
// ГАЛЕРЕЯ — ЗАГРУЗКА ФОТО С СЕРВЕРА
// ========================================
const API_BASE = 'https://artyomcut-api.vasia-pupkin1003.workers.dev';

let galleryPhotos = [];
let currentFilter = 'all';
let currentPhotoIndex = 0;
let filteredPhotos = [];

// Функция получения фотографий с сервера
async function fetchGalleryPhotos() {
  try {
    const res = await fetch(`${API_BASE}/api/gallery`);
    if (!res.ok) throw new Error('Ошибка загрузки галереи');
    const photos = await res.json();
    if (photos.length > 0) {
      galleryPhotos = photos;
    } else {
      // Если сервер вернул пустой массив, используем стандартные фото
      galleryPhotos = getDefaultPhotos();
    }
  } catch (err) {
    console.error(err);
    // При ошибке используем стандартные фото
    galleryPhotos = getDefaultPhotos();
  }
}

// Стандартные фото (заглушки, если сервер пуст)
function getDefaultPhotos() {
  return [
    { src: 'images/works/work-1.jpeg', alt: 'Работа 1', category: 'fade' },
    { src: 'images/works/work-2.jpeg', alt: 'Работа 2', category: 'classic' },
    { src: 'images/works/work-3.jpeg', alt: 'Работа 3', category: 'beard' },
    { src: 'images/works/work-4.jpeg', alt: 'Работа 4', category: 'fade' }
  ];
}

// Отображение фотографий с учётом фильтра
function displayPhotos(filter = 'all') {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  currentFilter = filter;

  filteredPhotos = filter === 'all'
    ? [...galleryPhotos]
    : galleryPhotos.filter(photo => photo.category === filter);

  grid.innerHTML = filteredPhotos.map((photo, index) => `
    <div class="gallery-item" data-index="${index}">
      <img src="${photo.src}" alt="${photo.alt}">
    </div>
  `).join('');

  // Добавляем обработчики кликов для лайтбокса
  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', function() {
      const index = parseInt(this.dataset.index);
      openLightbox(index);
    });
  });
}

// Лайтбокс
function openLightbox(index) {
  currentPhotoIndex = index;

  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    cursor: pointer;
    padding: 20px;
    user-select: none;
  `;

  lightbox.innerHTML = `
    <img src="${filteredPhotos[currentPhotoIndex].src}" alt="${filteredPhotos[currentPhotoIndex].alt}" style="
      max-width: 80%;
      max-height: 80%;
      object-fit: contain;
      border: 1px solid #343839;
      border-radius: 4px;
      transition: opacity 0.3s;
    ">
    <button class="lightbox-close" style="
      position: absolute;
      top: 20px;
      right: 20px;
      background: #c51f25;
      color: #fff;
      border: none;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      font-size: 30px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      transition: all 0.3s;
    ">×</button>
    <button class="lightbox-prev" style="
      position: absolute;
      left: 20px;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(197, 31, 37, 0.8);
      color: #fff;
      border: none;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      font-size: 30px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      transition: all 0.3s;
    ">❮</button>
    <button class="lightbox-next" style="
      position: absolute;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(197, 31, 37, 0.8);
      color: #fff;
      border: none;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      font-size: 30px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      transition: all 0.3s;
    ">❯</button>
    <div class="lightbox-counter" style="
      position: absolute;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      color: #aaa6a0;
      font-size: 16px;
      letter-spacing: 2px;
      z-index: 10000;
    ">${currentPhotoIndex + 1} / ${filteredPhotos.length}</div>
  `;

  document.body.appendChild(lightbox);

  const lightboxImg = lightbox.querySelector('img');
  const closeBtn = lightbox.querySelector('.lightbox-close');
  const prevBtn = lightbox.querySelector('.lightbox-prev');
  const nextBtn = lightbox.querySelector('.lightbox-next');
  const counter = lightbox.querySelector('.lightbox-counter');

  function updatePhoto() {
    lightboxImg.style.opacity = '0';
    setTimeout(() => {
      lightboxImg.src = filteredPhotos[currentPhotoIndex].src;
      lightboxImg.alt = filteredPhotos[currentPhotoIndex].alt;
      counter.textContent = `${currentPhotoIndex + 1} / ${filteredPhotos.length}`;
      lightboxImg.style.opacity = '1';
    }, 150);
  }

  prevBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    currentPhotoIndex--;
    if (currentPhotoIndex < 0) currentPhotoIndex = filteredPhotos.length - 1;
    updatePhoto();
  });

  nextBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    currentPhotoIndex++;
    if (currentPhotoIndex >= filteredPhotos.length) currentPhotoIndex = 0;
    updatePhoto();
  });

  closeBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    lightbox.remove();
    document.removeEventListener('keydown', handleKeyPress);
  });

  lightbox.addEventListener('click', function(e) {
    if (e.target === lightbox) {
      lightbox.remove();
      document.removeEventListener('keydown', handleKeyPress);
    }
  });

  function handleKeyPress(e) {
    if (e.key === 'Escape') {
      lightbox.remove();
      document.removeEventListener('keydown', handleKeyPress);
    } else if (e.key === 'ArrowLeft') {
      currentPhotoIndex--;
      if (currentPhotoIndex < 0) currentPhotoIndex = filteredPhotos.length - 1;
      updatePhoto();
    } else if (e.key === 'ArrowRight') {
      currentPhotoIndex++;
      if (currentPhotoIndex >= filteredPhotos.length) currentPhotoIndex = 0;
      updatePhoto();
    }
  }

  document.addEventListener('keydown', handleKeyPress);
}

// Обработчики фильтров
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    displayPhotos(this.dataset.filter);
  });
});

// Инициализация галереи после загрузки DOM
document.addEventListener('DOMContentLoaded', async function() {
  await fetchGalleryPhotos();
  displayPhotos('all');
});
function toggleMobileMenu() {
    const nav = document.getElementById('mobileNav');
    if (nav) {
        nav.classList.toggle('open');
        document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
    }
}
document.addEventListener('click', function(e) {
    const nav = document.getElementById('mobileNav');
    const burger = document.getElementById('burgerBtn');
    if (nav && nav.classList.contains('open') && !nav.contains(e.target) && !burger.contains(e.target)) {
        nav.classList.remove('open');
        document.body.style.overflow = '';
    }
});
