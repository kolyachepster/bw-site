// ============================================================
//  js/team.js — Команда студии NekoSound
// ============================================================

import {
    collection, getDocs, getDoc, doc, addDoc,
    updateDoc, deleteDoc, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import { esc, showToast, closeModals } from './core.js';
import { PLACEHOLDER_TEAM_IMG } from '../config/config.js';

export let teamMembers = [];

export async function loadTeam(db) {
    const snap = await getDocs(query(collection(db, 'team'), orderBy('order', 'asc')));
    teamMembers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderTeam();
}

function renderTeam() {
    const wrapper = document.getElementById('team-wrapper');
    if (!wrapper) return;
    
    if (teamMembers.length === 0) {
        wrapper.innerHTML = '<p style="text-align:center;padding:40px;color:var(--text-dim);">Команда пока пуста</p>';
        return;
    }

    wrapper.innerHTML = teamMembers.map(member => `
        <div class="team-card" onclick="openTeamPage('${member.id}')">
            <img src="${esc(member.img) || PLACEHOLDER_TEAM_IMG}" alt="${esc(member.name)}" onerror="this.src='${PLACEHOLDER_TEAM_IMG}'">
            <div class="team-card-info">
                <h3>${esc(member.name)}</h3>
                <p>${esc(member.role)}</p>
            </div>
        </div>`).join('');
}

export function bindTeam(db, getState) {
    window.loadTeam = async () => {
        await loadTeam(db);
    };

    window.openTeamPage = async (id) => {
        const snap = await getDoc(doc(db, 'team', id));
        if (!snap.exists()) return showToast('Участник не найден', 'error');
        
        const member = snap.data();
        const { isAdmin } = getState();
        
        document.getElementById('team-page-view').innerHTML = `
            <div style="text-align:center;margin-bottom:20px;">
                <img src="${esc(member.img) || PLACEHOLDER_TEAM_IMG}" 
                     style="width:150px;height:150px;border-radius:50%;object-fit:cover;border:3px solid var(--accent);"
                     onerror="this.src='${PLACEHOLDER_TEAM_IMG}'">
                <h2 style="margin-top:15px;">${esc(member.name)}</h2>
                <p style="color:var(--accent);font-weight:700;">${esc(member.role)}</p>
            </div>
            <div style="background:var(--input-bg);border-radius:12px;padding:20px;margin-bottom:20px;">
                <h4 style="margin-bottom:10px;">О себе:</h4>
                <p style="font-size:14px;line-height:1.6;color:var(--text-dim);">${esc(member.bio || 'Информация пока не заполнена.')}</p>
            </div>
            ${member.social ? `<a href="${esc(member.social)}" target="_blank" class="btn btn-outline" style="display:inline-flex;margin-bottom:10px;"><i class="fas fa-link"></i> Соцсети</a>` : ''}
        `;
        
        document.getElementById('adm-tp-controls').style.display = isAdmin ? 'flex' : 'none';
        
        navigate('team-page');
    };

    window.openTeamModal = async (id = '') => {
        document.getElementById('ed-team-id').value = id;
        if (id) {
            const member = teamMembers.find(m => m.id === id);
            if (member) {
                document.getElementById('ad-m-name').value = member.name || '';
                document.getElementById('ad-m-role').value = member.role || '';
                document.getElementById('ad-m-img').value = member.img || '';
                document.getElementById('ad-m-cat').value = member.category || '';
            }
        } else {
            ['ad-m-name', 'ad-m-role', 'ad-m-img', 'ad-m-cat'].forEach(id => {
                document.getElementById(id).value = '';
            });
        }
        document.getElementById('m-team').style.display = 'flex';
    };

    window.saveTeam = async () => {
        const { isAdmin } = getState();
        const id = document.getElementById('ed-team-id').value;
        const data = {
            name: document.getElementById('ad-m-name').value.trim(),
            role: document.getElementById('ad-m-role').value.trim(),
            img: document.getElementById('ad-m-img').value.trim(),
            category: document.getElementById('ad-m-cat').value.trim(),
        };
        
        if (!data.name) return showToast('Введите имя!', 'error');
        
        if (!id) {
            data.order = teamMembers.length;
            await addDoc(collection(db, 'team'), data);
        } else {
            await updateDoc(doc(db, 'team', id), data);
        }
        
        closeModals();
        await loadTeam(db);
        showToast('Участник сохранён!');
    };

    window.deleteTeamMember = async (id) => {
        if (!confirm('Удалить участника?')) return;
        const { isAdmin } = getState();
        await deleteDoc(doc(db, 'team', id));
        await loadTeam(db);
        showToast('Удалено');
    };

    window.openRoleModal = () => {
        document.getElementById('m-role').style.display = 'flex';
    };

    window.assignRole = async () => {
        const email = document.getElementById('role-email').value.trim();
        const role = document.getElementById('role-select').value;
        if (!email) return showToast('Введите email!', 'error');
        
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', email));
            const snap = await getDocs(q);
            
            if (snap.empty) return showToast('Пользователь не найден!', 'error');
            
            await updateDoc(doc(db, 'users', snap.docs[0].id), { role });
            showToast('Роль назначена!', 'success');
            closeModals();
        } catch (e) {
            console.error(e);
            showToast('Ошибка назначения роли', 'error');
        }
    };

    window.removeRole = async () => {
        const email = document.getElementById('role-email').value.trim();
        if (!email) return showToast('Введите email!', 'error');
        
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', email));
            const snap = await getDocs(q);
            
            if (snap.empty) return showToast('Пользователь не найден!', 'error');
            
            await updateDoc(doc(db, 'users', snap.docs[0].id), { role: 'user' });
            showToast('Роль снята!', 'success');
            closeModals();
        } catch (e) {
            console.error(e);
            showToast('Ошибка снятия роли', 'error');
        }
    };
}