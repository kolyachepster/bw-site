// ============================================================
//  js/comments.js — Комментарии
// ============================================================

import {
    collection, getDocs, addDoc, deleteDoc,
    doc, query, orderBy, where
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import { esc, showToast } from './core.js';
import { checkAndAwardAch } from './achievements.js';

// Загрузка и рендер комментариев
export async function loadComments(db, auth, curProj) {
    // ✅ Проверяем, что curProj существует
    if (!curProj) return;
    
    // ✅ Проверяем авторизацию через auth.currentUser
    const isLoggedIn = !!auth.currentUser;
    
    // ✅ Показываем/скрываем форму в зависимости от авторизации
    const authMsg = document.getElementById('comm-auth-msg');
    const form = document.getElementById('comm-form');
    
    if (authMsg && form) {
        if (isLoggedIn) {
            authMsg.style.display = 'none';
            form.style.display = 'block';
        } else {
            authMsg.style.display = 'block';
            form.style.display = 'none';
        }
    }
    
    // ✅ Загружаем комментарии
    try {
        const commentsRef = collection(db, `releases/${curProj.id}/comments`);
        const snap = await getDocs(query(commentsRef, orderBy('time', 'desc')));
        
        document.getElementById('comm-count').innerText = snap.size;
        document.getElementById('comm-list').innerHTML = snap.docs.map(d => {
            const c = d.data();
            const text = esc(c.text).replace(/@([\wа-яА-ЯёЁ_-]+)/g,
                `<a href="#" class="mention-link" onclick="openUserProfileByName('$1');return false;">@$1</a>`);
            const canDel = isLoggedIn && c.uid === auth.currentUser?.uid;
            return `<div class="comm-item">
                <img src="${esc(c.ava) || 'https://api.dicebear.com/7.x/identicon/svg'}"
                     class="comm-ava" style="cursor:pointer;" onclick="openUserProfile('${c.uid}')">
                <div style="flex:1;">
                    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:5px;">
                        <b style="font-size:14px;cursor:pointer;" onclick="openUserProfile('${c.uid}')">${esc(c.nick)}</b>
                        <span style="font-size:10px;color:var(--text-dim);">${new Date(c.time).toLocaleString()}</span>
                    </div>
                    <p style="font-size:13px;margin-top:5px;word-break:break-word;line-height:1.5;">${text}</p>
                    ${canDel ? `<button class="btn-sm" style="background:transparent;color:red;margin-top:5px;padding:0;"
                        onclick="delComm('${d.id}')">Удалить</button>` : ''}
                </div>
            </div>`;
        }).join('');
    } catch (e) {
        console.error('Ошибка загрузки комментариев:', e);
        document.getElementById('comm-list').innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:20px;">Ошибка загрузки комментариев</p>';
    }
}

// Разрешить @email → никнейм перед сохранением
async function resolveEmailMentions(db, text) {
    const emailPattern = /@([\w.+-]+@[\w.-]+\.\w+)/g;
    let resolved = text;
    const matches = [...text.matchAll(emailPattern)];
    for (const m of matches) {
        const email = m[1];
        try {
            const snap = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
            if (!snap.empty) {
                const nick = snap.docs[0].data().nickname;
                resolved = resolved.replace('@' + email, '@' + nick);
            }
        } catch (e) { /* оставляем как есть */ }
    }
    return resolved;
}

export function bindComments(db, auth, getState) {
    window.sendComment = async () => {
        // ✅ Получаем userData через window.__userData (глобальная переменная из app.js)
        const userData = window.__userData || null;
        const { curProj } = getState();
        
        if (!curProj) return showToast('Релиз не найден', 'error');
        if (!userData) return showToast('Войдите, чтобы оставить комментарий', 'error');
        if (!auth.currentUser) return showToast('Вы не авторизованы', 'error');
        
        const rawText = document.getElementById('comm-text').value.trim();
        if (!rawText) return;
        
        const text = await resolveEmailMentions(db, rawText);
        await addDoc(collection(db, `releases/${curProj.id}/comments`), {
            uid: auth.currentUser.uid, nick: userData.nickname,
            ava: userData.avatar || '', text, time: Date.now()
        });
        document.getElementById('comm-text').value = '';
        await loadComments(db, auth, curProj);
        showToast('Комментарий отправлен!');
        await checkAndAwardAch(db, auth, userData, 'comment_1');
    };

    window.delComm = async (id) => {
        if (!confirm('Удалить комментарий?')) return;
        const { curProj } = getState();
        await deleteDoc(doc(db, `releases/${curProj.id}/comments`, id));
        await loadComments(db, auth, curProj);
        showToast('Удалено');
    };
}