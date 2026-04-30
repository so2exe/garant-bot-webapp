/**
 * Garant Bot - Mini App
 * Lava-дизайн, Telegram WebApp API
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ИНИЦИАЛИЗАЦИЯ (работает и в браузере, и в Telegram)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let tg;

try {
    tg = window.Telegram?.WebApp;
} catch(e) {
    tg = null;
}

// Заглушка для браузера (чтобы сайт открывался на компе)
if (!tg) {
    tg = {
        expand: () => {},
        enableClosingConfirmation: () => {},
        initDataUnsafe: {
            user: {
                id: 12345,
                first_name: "Тест",
                username: "test_user",
                last_name: "",
                photo_url: ""
            }
        },
        themeParams: {},
        setHeaderColor: () => {},
        showPopup: (options, callback) => {
            alert(options.message);
            if (callback) callback('ok');
        },
        showAlert: (message) => alert(message),
        sendData: (data) => console.log('Данные для бота:', data),
        HapticFeedback: {
            impactOccurred: () => {},
            notificationOccurred: () => {}
        },
        onEvent: () => {}
    };
    console.log('⚠️ Режим браузера (функции Telegram неактивны)');
}

// Разворачиваем приложение
tg.expand();
tg.enableClosingConfirmation();

// Получаем тему Telegram
const theme = tg.themeParams || {};

// Данные пользователя
const initData = tg.initDataUnsafe || {};
const user = initData.user || {};
const userId = user.id || 0;
const userName = user.first_name || 'Пользователь';
const userUsername = user.username || 'user';
const userLastName = user.last_name || '';

// Устанавливаем цвет верхней панели
try { tg.setHeaderColor('#0A0A0F'); } catch(e) {}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let currentScreen = 'createDealScreen';
let uploadedPhoto = null;
let onlineCount = 47;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ЗАПУСК ПРИЛОЖЕНИЯ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    loadProfile();
    loadRating();
    setupPhotoUpload();
    updateOnline();
    
    // Регулярное обновление онлайна
    setInterval(updateOnline, 15000);
    
    console.log('🌋 Garant Bot Mini App загружен');
    console.log('👤 Пользователь:', userName, '@' + userUsername);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// НАВИГАЦИЯ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const screenId = btn.dataset.screen;
            navigateTo(screenId);
        });
    });
}

function navigateTo(screenId) {
    // Обновляем активную кнопку
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.screen === screenId);
    });
    
    // Обновляем активный экран
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.toggle('active', screen.id === screenId);
    });
    
    currentScreen = screenId;
    
    // Haptic feedback (только в Telegram)
    try {
        if (tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('light');
        }
    } catch(e) {}
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ЗАГРУЗКА ФОТО
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function setupPhotoUpload() {
    const uploadArea = document.getElementById('photoUpload');
    const photoInput = document.getElementById('photoInput');
    const placeholder = uploadArea?.querySelector('.photo-placeholder');
    
    if (!uploadArea || !photoInput) return;
    
    uploadArea.addEventListener('click', () => {
        try {
            tg.showPopup({
                title: '📸 Загрузить фото',
                message: 'Выберите источник',
                buttons: [
                    { type: 'default', text: '📷 Камера', id: 'camera' },
                    { type: 'default', text: '🖼 Галерея', id: 'gallery' },
                    { type: 'cancel', text: '❌ Отмена' }
                ]
            }, (btnId) => {
                if (btnId === 'gallery') {
                    photoInput.click();
                } else if (btnId === 'camera') {
                    photoInput.setAttribute('capture', 'environment');
                    photoInput.click();
                    photoInput.removeAttribute('capture');
                }
            });
        } catch(e) {
            // В браузере просто открываем выбор файла
            photoInput.click();
        }
    });
    
    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                uploadedPhoto = event.target.result;
                if (placeholder) {
                    placeholder.innerHTML = `
                        <img src="${uploadedPhoto}" alt="Фото" style="max-width: 100%; max-height: 200px; border-radius: 12px;">
                        <p style="color: #34C759;">✅ Фото загружено!</p>
                    `;
                }
            };
            reader.readAsDataURL(file);
        }
    });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ПРОФИЛЬ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function loadProfile() {
    const nameEl = document.getElementById('userName');
    const tagEl = document.getElementById('userTag');
    const avatarEl = document.getElementById('userAvatar');
    
    if (nameEl) nameEl.textContent = userName + ' ' + userLastName;
    if (tagEl) tagEl.textContent = '@' + userUsername;
    
    if (avatarEl) {
        if (user.photo_url) {
            avatarEl.innerHTML = `<img src="${user.photo_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        } else {
            avatarEl.textContent = (userName || 'U').charAt(0).toUpperCase();
        }
    }
    
    // Заглушка данных профиля
    updateProfileDisplay({
        rating: 4.2,
        successful_deals: 127,
        failed_deals: 3,
        total_deals: 130,
        balance_stars: 12450,
        balance_rub: 0
    });
    
    loadUserDeals();
}

function updateProfileDisplay(data) {
    updateRatingDisplay(data.rating);
    
    const successEl = document.getElementById('successDeals');
    const failedEl = document.getElementById('failedDeals');
    const totalEl = document.getElementById('totalDeals');
    const balanceEl = document.getElementById('balance');
    
    if (successEl) successEl.textContent = data.successful_deals;
    if (failedEl) failedEl.textContent = data.failed_deals;
    if (totalEl) totalEl.textContent = data.total_deals;
    if (balanceEl) balanceEl.textContent = `${data.balance_stars.toLocaleString()} ⭐ | ${data.balance_rub.toLocaleString()} ₽`;
}

function updateRatingDisplay(rating) {
    const starsEl = document.getElementById('ratingStars');
    const valueEl = document.getElementById('ratingValue');
    
    if (!starsEl || !valueEl) return;
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = (rating - fullStars) >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHTML = '⭐'.repeat(fullStars);
    if (hasHalfStar) starsHTML += '✨';
    starsHTML += '☆'.repeat(emptyStars);
    
    starsEl.textContent = starsHTML;
    valueEl.textContent = rating.toFixed(1) + ' / 5.0';
}

function loadUserDeals() {
    const dealsList = document.getElementById('dealsList');
    const allMyDeals = document.getElementById('allMyDeals');
    
    const deals = [
        { title: 'iPhone 15 Pro Max', status: 'completed', price: '45 000 ₽', emoji: '✅', date: '15.02.2024' },
        { title: 'Telegram Premium 1 год', status: 'processing', price: '500 ⭐', emoji: '⏳', date: '20.02.2024' },
        { title: 'Дизайн Telegram канала', status: 'cancelled', price: '2 000 ₽', emoji: '❌', date: '10.02.2024' },
    ];
    
    let html = '';
    
    if (deals.length === 0) {
        html = '<div class="deal-item-empty">У вас пока нет сделок</div>';
    } else {
        deals.forEach(deal => {
            html += `
                <div class="deal-item">
                    <span class="deal-emoji">${deal.emoji}</span>
                    <div class="deal-info">
                        <span class="deal-title">${deal.title}</span>
                        <span class="deal-price">${deal.price}</span>
                    </div>
                    <span class="deal-date">${deal.date}</span>
                </div>
            `;
        });
    }
    
    if (dealsList) dealsList.innerHTML = html;
    if (allMyDeals) allMyDeals.innerHTML = html;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// РЕЙТИНГ ПРОДАВЦОВ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function loadRating() {
    const container = document.getElementById('topSellers');
    if (!container) return;
    
    const sellers = [
        { name: 'Alex', username: 'seller1', rating: 4.9, deals: 534, medal: '🥇' },
        { name: 'Maria', username: 'seller2', rating: 4.7, deals: 412, medal: '🥈' },
        { name: 'Dmitry', username: 'seller3', rating: 4.5, deals: 298, medal: '🥉' },
        { name: 'Elena', username: 'seller4', rating: 4.3, deals: 189, medal: '4️⃣' },
        { name: 'Sergey', username: 'seller5', rating: 4.1, deals: 156, medal: '5️⃣' },
        { name: 'Anna', username: 'seller6', rating: 3.9, deals: 134, medal: '6️⃣' },
        { name: 'Pavel', username: 'seller7', rating: 3.7, deals: 98, medal: '7️⃣' },
    ];
    
    let html = '';
    sellers.forEach(seller => {
        html += `
            <div class="glass-card seller-card">
                <div class="seller-medal">${seller.medal}</div>
                <div class="seller-avatar">${seller.name.charAt(0)}</div>
                <div class="seller-info">
                    <div class="seller-name-row">
                        <span class="seller-name">${seller.name}</span>
                        <span class="seller-username">@${seller.username}</span>
                    </div>
                    <div class="seller-stats">
                        <span class="seller-rating">⭐ ${seller.rating}</span>
                        <span class="seller-deals">✅ ${seller.deals} сделок</span>
                    </div>
                </div>
                <div class="seller-trust">
                    ${seller.rating >= 4.5 ? '🛡️ Проверен' : seller.rating >= 3.5 ? '👍 Надёжный' : '👤 Новичок'}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// СОЗДАНИЕ СДЕЛКИ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function createDeal() {
    const titleEl = document.getElementById('dealTitle');
    const descEl = document.getElementById('dealDescription');
    const starsEl = document.getElementById('priceStars');
    const rubEl = document.getElementById('priceRub');
    
    const title = titleEl?.value?.trim() || '';
    const description = descEl?.value?.trim() || '';
    const priceStars = parseInt(starsEl?.value) || 0;
    const priceRub = parseFloat(rubEl?.value) || 0;
    
    if (!title) {
        try { tg.showAlert('❌ Введите название сделки'); } catch(e) { alert('❌ Введите название сделки'); }
        return;
    }
    
    if (priceStars === 0 && priceRub === 0) {
        try { tg.showAlert('❌ Укажите цену'); } catch(e) { alert('❌ Укажите цену'); }
        return;
    }
    
    const dealData = {
        action: 'create_deal',
        title: title,
        description: description,
        priceStars: priceStars,
        priceRub: priceRub,
        photo: uploadedPhoto || ''
    };
    
    // Отправляем данные боту
    tg.sendData(JSON.stringify(dealData));
    
    try {
        tg.showPopup({
            title: '✅ Сделка создана!',
            message: `"${title}" отправлена!\nЦена: ${priceStars} ⭐ | ${priceRub} ₽`,
            buttons: [{ type: 'ok' }]
        });
    } catch(e) {
        alert(`✅ Сделка "${title}" создана!\nЦена: ${priceStars} ⭐ | ${priceRub} ₽`);
    }
    
    // Очищаем форму
    if (titleEl) titleEl.value = '';
    if (descEl) descEl.value = '';
    if (starsEl) starsEl.value = '';
    if (rubEl) rubEl.value = '';
    uploadedPhoto = null;
    
    const placeholder = document.querySelector('.photo-placeholder');
    if (placeholder) {
        placeholder.innerHTML = `<span class="photo-icon">📸</span><p>Нажмите, чтобы загрузить фото</p>`;
    }
    
    setTimeout(() => navigateTo('dealsScreen'), 500);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ОНЛАЙН
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function updateOnline() {
    onlineCount = 40 + Math.floor(Math.random() * 20);
    
    const onlineEl = document.getElementById('onlineCount');
    const aboutEl = document.getElementById('aboutOnline');
    
    if (onlineEl) onlineEl.textContent = onlineCount;
    if (aboutEl) aboutEl.textContent = onlineCount;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ПОИСК ПРОДАВЦА
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const searchInput = document.getElementById('searchSeller');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('.seller-card').forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(query) ? '' : 'none';
        });
    });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ГЛОБАЛЬНЫЕ ФУНКЦИИ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

window.createDeal = createDeal;
window.loadProfile = loadProfile;
window.loadRating = loadRating;
window.navigateTo = navigateTo;

console.log('🌋 Garant Bot готов к работе');
