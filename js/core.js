// ============================================================
//  js/core.js - Основные утилиты Blood Wash Studio
// ============================================================

let toastTimeout = null;

// ── Экранирование HTML ──
export function esc(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ── Toast уведомления ──
export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) {
        console.warn('Toast container not found');
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';
    
    toast.innerHTML = `${icon} ${esc(message)}`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ── Закрыть все модалки ──
export function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// ── Навигация ──
export function navigate(page, pushState = true) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(s => s.classList.remove('active'));
    
    const target = document.getElementById(page);
    if (target) {
        target.classList.add('active');
    } else {
        console.warn(`Page "${page}" not found`);
        const home = document.getElementById('home');
        if (home) home.classList.add('active');
    }
    
    const navMap = {
        'home': 'n-home',
        'team': 'n-team',
        'profile': 'n-profile',
        'dubin': 'n-dubin',
        'order': 'n-order'
    };
    
    const activeId = navMap[page];
    if (activeId) {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        const activeLink = document.getElementById(activeId);
        if (activeLink) activeLink.classList.add('active');
    }
    
    if (pushState && page !== 'view') {
        window.history.pushState(null, '', '#' + page);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Получить HTML бейджа роли ──
export function getRoleBadgeHTML(role) {
    const roles = {
        'admin': ['role-admin', '👑', 'Администратор'],
        'dub': ['role-dub', '🎙️', 'Актёр дубляжа'],
        'moderator': ['role-mod', '🛡️', 'Модератор'],
        'user': ['role-user', '👤', 'Пользователь']
    };
    
    const [className, icon, label] = roles[role] || roles['user'];
    return `<span class="role-badge ${className}"><i class="fas ${getIconClass(icon)}"></i> ${label}</span>`;
}

function getIconClass(emoji) {
    const map = {
        '👑': 'fa-crown',
        '🎙️': 'fa-microphone-alt',
        '🛡️': 'fa-shield-alt',
        '👤': 'fa-user'
    };
    return map[emoji] || 'fa-user';
}

// ── Показать попап достижения ──
export function showAchievementPopup(ach, isFullscreen = false) {
    const existing = document.querySelector('.ach-popup');
    if (existing) existing.remove();
    
    const popup = document.createElement('div');
    popup.className = `ach-popup ${isFullscreen ? 'ach-popup--fs' : ''}`;
    popup.innerHTML = `
        <div class="ach-popup-img">${ach.img}</div>
        <div>
            <div class="ach-popup-label">ДОСТИЖЕНИЕ ПОЛУЧЕНО!</div>
            <div class="ach-popup-name">${esc(ach.name)}</div>
            <div class="ach-popup-desc">${esc(ach.desc)}</div>
        </div>
    `;
    
    document.body.appendChild(popup);
    setTimeout(() => popup.classList.add('ach-popup--visible'), 10);
    
    setTimeout(() => {
        popup.classList.remove('ach-popup--visible');
        setTimeout(() => popup.remove(), 400);
    }, 4000);
}