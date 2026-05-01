// config/config.js

// ===== FIREBASE КОНФИГУРАЦИЯ =====
export const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDRC7nVdYsnRQqKCkNd3TipjNsTLPmJkPQ",
    authDomain: "bw-site-6aeee.firebaseapp.com",
    databaseURL: "https://bw-site-6aeee-default-rtdb.firebaseio.com",
    projectId: "bw-site-6aeee",
    storageBucket: "bw-site-6aeee.firebasestorage.app",
    messagingSenderId: "335571945137",
    appId: "1:335571945137:web:e504f9c580f9bc9c120490",
    measurementId: "G-HSWDG87NHQ"
};

// ===== EMAILJS КОНФИГУРАЦИЯ =====
export const EMAILJS_CONFIG = {
    serviceId: 'service_8497uil',
    templateSuggest: 'template_suggest',
    publicKey: 'Xkprm41y-mI62g1_B'
};

// ===== СОЦИАЛЬНЫЕ ССЫЛКИ =====
export const SOCIAL_LINKS = {
    vk: 'https://vk.com/bloodwashstudio',
    telegram: 'https://t.me/bloodwashstudio',
    youtube: 'https://www.youtube.com/@BloodWashStudio'
};

// ===== ССЫЛКА НА ФОРМУ =====
export const JOIN_FORM_URL = 'https://forms.gle/YOUR_GOOGLE_FORM_ID';

// ===== ПЛЕЙСХОЛДЕРЫ =====
export const PLACEHOLDER_IMG = 'https://via.placeholder.com/300x400/141417/8b0000?text=BWS';
export const PLACEHOLDER_TEAM_IMG = 'https://api.dicebear.com/7.x/identicon/svg';

// ===== НАСТРОЙКИ =====
export const VIEW_COUNT_AFTER_MS = 600000; // 10 минут

// ===== АВТОМАТИЧЕСКИЕ ДОСТИЖЕНИЯ =====
export const AUTO_ACHIEVEMENTS = [
    { id: 'first_view', name: 'Первый просмотр', desc: 'Посмотрел первый релиз', img: '???', trigger: 'views_1' },
    { id: 'views_10', name: 'Киноман', desc: '10 просмотренных релизов', img: '??', trigger: 'views_10' },
    { id: 'views_50', name: 'Синефил', desc: '50 просмотренных релизов', img: '??', trigger: 'views_50' },
    { id: 'first_comment', name: 'Голос', desc: 'Оставил первый комментарий', img: '??', trigger: 'comment_1' },
    { id: 'first_like', name: 'Меценат', desc: 'Поставил первый лайк', img: '??', trigger: 'like_1' },
    { id: 'first_favorite', name: 'Коллекционер', desc: 'Добавил релиз в избранное', img: '?', trigger: 'favorite_1' },
    { id: 'subs_1', name: 'Популярный', desc: 'Получил первого подписчика', img: '??', trigger: 'subs_1' },
    { id: 'suggest_1', name: 'Инициатор', desc: 'Предложил проект для озвучки', img: '??', trigger: 'suggest_1' },
    { id: 'profile_filled', name: 'Личность', desc: 'Заполнил профиль полностью', img: '??', trigger: 'profile_ok' },
    { id: 'newcomer', name: 'Новичок', desc: 'Зарегистрировался на сайте', img: '??', trigger: null }
];