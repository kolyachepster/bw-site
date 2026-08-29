// ============================================================
//  js/auth.js — Авторизация и профиль пользователя
// ============================================================

import {
    getAuth, onAuthStateChanged, signInWithEmailAndPassword,
    createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

import {
    doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import { esc, showToast, closeModals, getRoleBadgeHTML } from './core.js';
import { checkAndAwardAch } from './achievements.js';

export function initAuthListeners(auth, db) {
    const btnLogin = document.getElementById('btn-login');
    const btnReg = document.getElementById('btn-reg');
    const btnLogout = document.getElementById('btn-logout');

    if (btnLogin) {
        btnLogin.addEventListener('click', async () => {
            const email = document.getElementById('email').value.trim();
            const pass = document.getElementById('pass').value;
            
            if (!email || !pass) return showToast('Заполните все поля!', 'error');
            
            try {
                await signInWithEmailAndPassword(auth, email, pass);
                showToast('Вход выполнен!', 'success');
            } catch (error) {
                console.error('Ошибка входа:', error);
                showToast(getAuthErrorMsg(error.code), 'error');
            }
        });
    }

    if (btnReg) {
        btnReg.addEventListener('click', async () => {
            const email = document.getElementById('email').value.trim();
            const pass = document.getElementById('pass').value;
            
            if (!email || !pass) return showToast('Заполните все поля!', 'error');
            if (pass.length < 6) return showToast('Пароль минимум 6 символов!', 'error');
            
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
                const user = userCredential.user;
                
                await setDoc(doc(db, 'users', user.uid), {
                    email: email,
                    nickname: email.split('@')[0],
                    avatar: '',
                    role: 'user',
                    views: 0,
                    subs: 0,
                    achievements: [],
                    createdAt: Date.now()
                });
                
                showToast('Регистрация успешна!', 'success');
            } catch (error) {
                console.error('Ошибка регистрации:', error);
                showToast(getAuthErrorMsg(error.code), 'error');
            }
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            try {
                await auth.signOut();
                showToast('Вы вышли из аккаунта', 'info');
            } catch (error) {
                console.error('Ошибка выхода:', error);
            }
        });
    }
}

function getAuthErrorMsg(code) {
    const errorMap = {
        'auth/invalid-email': 'Неверный формат email!',
        'auth/user-not-found': 'Пользователь не найден!',
        'auth/wrong-password': 'Неверный пароль!',
        'auth/email-already-in-use': 'Email уже зарегистрирован!',
        'auth/weak-password': 'Пароль слишком слабый!',
        'auth/too-many-requests': 'Слишком много попыток. Подождите!',
        'auth/network-request-failed': 'Ошибка сети!'
    };
    return errorMap[code] || 'Произошла ошибка. Попробуйте еще раз!';
}

export function applyUserUI(userData, isAdmin, isDub) {
    document.getElementById('auth-ui').style.display = 'none';
    document.getElementById('user-ui').style.display = 'block';
    
    // Профиль
    document.getElementById('u-ava').src = userData.avatar || 'https://api.dicebear.com/7.x/identicon/svg';
    document.getElementById('u-nick').textContent = userData.nickname || 'Пользователь';
    document.getElementById('u-views').textContent = userData.views || 0;
    document.getElementById('u-subs').textContent = userData.subs || 0;
    
    // Бейдж роли
    document.getElementById('u-role-badge').innerHTML = getRoleBadgeHTML(userData.role);
    
    // Кнопки админа
    if (isAdmin) {
        document.getElementById('adm-btn-rel').style.display = 'inline-flex';
        document.getElementById('adm-btn-team').style.display = 'inline-flex';
        document.getElementById('adm-btn-role').style.display = 'inline-flex';
        document.getElementById('adm-ach-panel').style.display = 'block';
    }
    
    // DUB-in ссылка
    if (isDub) {
        document.getElementById('n-dubin').style.display = 'block';
    }
}

export function resetUserUI() {
    document.getElementById('auth-ui').style.display = 'block';
    document.getElementById('user-ui').style.display = 'none';
    
    // Скрыть админ-кнопки
    document.getElementById('adm-btn-rel').style.display = 'none';
    document.getElementById('adm-btn-team').style.display = 'none';
    document.getElementById('adm-btn-role').style.display = 'none';
    document.getElementById('adm-ach-panel').style.display = 'none';
    
    // Скрыть DUB-in
    document.getElementById('n-dubin').style.display = 'none';
}

export function bindAuthActions(auth, db, getState) {
    window.resetPassword = async () => {
        const email = document.getElementById('email').value.trim();
        if (!email) return showToast('Введите email!', 'error');
        
        try {
            await sendPasswordResetEmail(auth, email);
            showToast('Письмо для сброса пароля отправлено!', 'success');
        } catch (error) {
            showToast(getAuthErrorMsg(error.code), 'error');
        }
    };
    
    window.saveProfile = async () => {
        const { userData } = getState();
        if (!userData || !auth.currentUser) return;
        
        const nickname = document.getElementById('ed-nick').value.trim();
        const avatar = document.getElementById('ed-ava').value.trim();
        
        const updates = {};
        if (nickname) updates.nickname = nickname;
        if (avatar) updates.avatar = avatar;
        
        await updateDoc(doc(db, 'users', auth.currentUser.uid), updates);
        
        if (nickname) await updateProfile(auth.currentUser, { displayName: nickname });
        
        closeModals();
        showToast('Профиль обновлён!', 'success');
    };
    
    window.changeUserEmail = async () => {
        const email = document.getElementById('ed-new-email').value.trim();
        if (!email) return showToast('Введите новый email!', 'error');
        
        try {
            await auth.currentUser.updateEmail(email);
            await updateDoc(doc(db, 'users', auth.currentUser.uid), { email });
            showToast('Email обновлён!', 'success');
        } catch (error) {
            showToast(getAuthErrorMsg(error.code), 'error');
        }
    };
    
    window.changeUserPass = async () => {
        const pass = document.getElementById('ed-new-pass').value;
        if (!pass || pass.length < 6) return showToast('Пароль минимум 6 символов!', 'error');
        
        try {
            await auth.currentUser.updatePassword(pass);
            showToast('Пароль обновлён!', 'success');
        } catch (error) {
            showToast(getAuthErrorMsg(error.code), 'error');
        }
    };
    
    window.savePublicProfile = async () => {
        const { userData } = getState();
        if (!userData || !auth.currentUser) return;
        
        const bio = document.getElementById('pub-bio').value.trim();
        const link = document.getElementById('pub-link').value.trim();
        
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            bio, link,
            profileFilled: true
        });
        
        closeModals();
        showToast('Публичный профиль сохранён!', 'success');
        
        await checkAndAwardAch(db, auth, userData, 'profile_ok');
    };
}