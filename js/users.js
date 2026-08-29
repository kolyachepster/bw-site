// ============================================================
//  js/users.js — Профили, подписки, управление пользователями
// ============================================================

import {
    collection, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, query, where
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import { esc, showToast, closeModals, getRoleBadgeHTML } from './core.js';
import { checkAndAwardAch } from './achievements.js';

export function bindUsers(db, auth, getState) {
    
    // Показать подписчиков
    window.showMySubscribers = async () => {
        const { userData } = getState();
        if (!userData || !auth.currentUser) return;
        
        const uid = auth.currentUser.uid;
        const subsSnap = await getDocs(collection(db, `users/${uid}/subscribers`));
        
        document.getElementById('subs-list').innerHTML = subsSnap.docs.map(d => {
            const sub = d.data();
            return `
                <div style="display:flex;align-items:center;gap:10px;padding:10px;border-bottom:1px solid var(--border);">
                    <img src="${esc(sub.avatar) || 'https://api.dicebear.com/7.x/identicon/svg'}" 
                         style="width:40px;height:40px;border-radius:50%;object-fit:cover;">
                    <div style="flex:1;">
                        <b>${esc(sub.nickname)}</b>
                        <div style="font-size:11px;color:var(--text-dim);">Подписался: ${new Date(sub.date).toLocaleDateString()}</div>
                    </div>
                </div>`;
        }).join('') || '<p style="text-align:center;color:var(--text-dim);padding:20px;">Пока нет подписчиков</p>';
        
        document.getElementById('m-subs').style.display = 'flex';
    };

    // Открыть профиль пользователя
    window.openUserProfile = async (uid) => {
        const snap = await getDoc(doc(db, 'users', uid));
        if (!snap.exists()) return showToast('Пользователь не найден', 'error');
        
        const user = snap.data();
        const { userData } = getState();
        
        document.getElementById('mu-ava').src = user.avatar || 'https://api.dicebear.com/7.x/identicon/svg';
        document.getElementById('mu-nick').textContent = user.nickname || 'Пользователь';
        document.getElementById('mu-role-badge').innerHTML = getRoleBadgeHTML(user.role);
        document.getElementById('mu-bio').textContent = user.bio || 'Информация не заполнена';
        document.getElementById('mu-views-count').textContent = user.views || 0;
        document.getElementById('mu-subs-count').textContent = user.subs || 0;
        
        if (user.link) {
            const link = document.getElementById('mu-link');
            link.href = user.link;
            link.style.display = 'inline-flex';
        } else {
            document.getElementById('mu-link').style.display = 'none';
        }
        
        // Достижения
        const achList = document.getElementById('mu-ach-list');
        achList.innerHTML = (user.achievements || []).slice(0, 10).map(a => 
            `<span title="${esc(a.name)}" style="font-size:18px;">${a.img}</span>`
        ).join('');
        
        // Кнопка подписки
        const subBtn = document.getElementById('btn-mu-sub');
        if (userData && uid !== auth.currentUser.uid) {
            const subSnap = await getDoc(doc(db, `users/${auth.currentUser.uid}/subs`, uid));
            if (subSnap.exists()) {
                subBtn.textContent = 'Вы подписаны ✓';
                subBtn.classList.add('btn-success');
            } else {
                subBtn.textContent = 'Подписаться';
                subBtn.classList.remove('btn-success');
            }
            subBtn.onclick = () => toggleSubscribe(uid, user);
            subBtn.style.display = 'block';
        } else {
            subBtn.style.display = 'none';
        }
        
        // Кнопка жалобы (для модераторов)
        const reportBtn = document.getElementById('btn-report-user');
        reportBtn.style.display = userData?.role === 'moderator' || userData?.role === 'admin' ? 'block' : 'none';
        
        document.getElementById('m-user-profile').style.display = 'flex';
    };

    window.toggleSubscribe = async (targetUid, targetUser) => {
        const { userData } = getState();
        if (!userData || !auth.currentUser) return showToast('Авторизуйтесь', 'error');
        
        const myUid = auth.currentUser.uid;
        const mySubRef = doc(db, `users/${myUid}/subs`, targetUid);
        const targetSubRef = doc(db, `users/${targetUid}/subscribers`, myUid);
        
        const subSnap = await getDoc(mySubRef);
        
        if (subSnap.exists()) {
            // Отписаться
            await deleteDoc(mySubRef);
            await deleteDoc(targetSubRef);
            await updateDoc(doc(db, 'users', targetUid), { subs: Math.max(0, (targetUser.subs || 1) - 1) });
            showToast('Вы отписались');
        } else {
            // Подписаться
            await setDoc(mySubRef, { date: Date.now() });
            await setDoc(targetSubRef, { uid: myUid, nickname: userData.nickname, avatar: userData.avatar, date: Date.now() });
            await updateDoc(doc(db, 'users', targetUid), { subs: (targetUser.subs || 0) + 1 });
            showToast('Вы подписались!', 'success');
            
            // Проверка ачивки
            await checkAndAwardAch(db, auth, targetUser, 'subs_1');
        }
        
        document.getElementById('m-user-profile').style.display = 'none';
    };

    // Открыть профиль по имени
    window.openUserProfileByName = async (nickname) => {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('nickname', '==', nickname));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
            await window.openUserProfile(snap.docs[0].id);
        } else {
            showToast('Пользователь не найден', 'error');
        }
    };

    // Жалоба на пользователя
    window.reportUser = async () => {
        const { userData } = getState();
        if (!userData) return;
        
        const uid = document.getElementById('mu-nick').dataset.uid;
        if (!uid) return;
        
        await addDoc(collection(db, 'reports'), {
            targetUid: uid,
            reporterUid: auth.currentUser.uid,
            date: Date.now(),
            status: 'new'
        });
        
        showToast('Жалоба отправлена!', 'success');
        closeModals();
    };
}