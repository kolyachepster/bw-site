// ============================================================
//  js/reset-password.js — Восстановление пароля через Firebase
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
    getAuth, 
    sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// ?? Firebase конфигурация (ВАШИ РЕАЛЬНЫЕ КЛЮЧИ) ??
const firebaseConfig = {
    apiKey: "AIzaSyDRC7nVdYsnRQqKCkNd3TipjNsTLPmJkPQ",
    authDomain: "bw-site-6aeee.firebaseapp.com",
    databaseURL: "https://bw-site-6aeee-default-rtdb.firebaseio.com",
    projectId: "bw-site-6aeee",
    storageBucket: "bw-site-6aeee.firebasestorage.app",
    messagingSenderId: "335571945137",
    appId: "1:335571945137:web:e504f9c580f9bc9c120490",
    measurementId: "G-HSWDG87NHQ"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ?? Показ toast-уведомлений ??
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ef4444' : '#22c55e'};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease;
        max-width: 400px;
    `;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Добавляем CSS анимации
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// ?? Человекочитаемые ошибки Firebase Auth ??
function authErrorMsg(code) {
    const errorMap = {
        'auth/invalid-email': 'Неверный формат email!',
        'auth/user-not-found': 'Пользователь с таким email не найден!',
        'auth/too-many-requests': 'Слишком много попыток. Попробуйте позже.',
        'auth/network-request-failed': 'Ошибка сети. Проверьте подключение.',
        'auth/internal-error': 'Внутренняя ошибка сервера. Попробуйте позже.',
        'auth/invalid-action-code': 'Ссылка недействительна или уже использована.',
        'auth/expired-action-code': 'Срок действия ссылки истек.',
    };
    return errorMap[code] || 'Произошла ошибка. Попробуйте ещё раз.';
}

// ?? Обработка формы восстановления пароля ??
const resetForm = document.getElementById('reset-form');
const resetBtn = document.getElementById('reset-btn');
const resetEmailInput = document.getElementById('reset-email');
const successMsg = document.getElementById('success-msg');
const successText = document.getElementById('success-text');

if (resetForm) {
    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = resetEmailInput.value.trim();
        
        if (!email) {
            showToast('Пожалуйста, введите email!', 'error');
            return;
        }
        
        // Простая валидация email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast('Пожалуйста, введите корректный email!', 'error');
            return;
        }
        
        // Показываем индикатор загрузки
        resetBtn.classList.add('loading');
        resetBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
        resetBtn.disabled = true;
        
        try {
            // Настройки для письма восстановления пароля
            const actionCodeSettings = {
                url: window.location.origin + '/index.html',
                handleCodeInApp: false,
            };
            
            // Отправка письма с Firebase
            await sendPasswordResetEmail(auth, email, actionCodeSettings);
            
            // Успешная отправка
            if (successText) {
                successText.innerHTML = `
                    <strong>Письмо отправлено!</strong><br>
                    Проверьте вашу почту <strong>${email}</strong>.<br>
                    Ссылка действительна в течение 1 часа.
                `;
            }
            if (successMsg) successMsg.style.display = 'block';
            
            showToast('Письмо для восстановления отправлено!', 'success');
            
            // Перенаправление через 5 секунд
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 5000);
            
        } catch (error) {
            console.error('Ошибка восстановления пароля:', error);
            showToast(authErrorMsg(error.code), 'error');
            
            // Возвращаем кнопку в исходное состояние
            resetBtn.classList.remove('loading');
            resetBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Отправить письмо';
            resetBtn.disabled = false;
        }
    });
}

// ?? Автофокус на поле email ??
window.addEventListener('DOMContentLoaded', () => {
    if (resetEmailInput) resetEmailInput.focus();
    
    // Проверяем, есть ли параметр email в URL (для автозаполнения)
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam && resetEmailInput) {
        resetEmailInput.value = emailParam;
    }
});