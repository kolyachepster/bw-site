// ============================================================
//  js/releases.js — Релизы, плеер, избранное
// ============================================================

import {
    collection, getDocs, getDoc, doc, addDoc, setDoc,
    updateDoc, deleteDoc, query, orderBy, increment
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import { esc, showToast, closeModals, navigate } from './core.js';
import { PLACEHOLDER_IMG, VIEW_COUNT_AFTER_MS } from '../config/config.js';
import { loadComments } from './comments.js';
import { checkAndAwardAch } from './achievements.js';

export let allRel = [];
export let curProj = null;

let viewTimer = null;
let searchEnabled = false;

// ============================================
//  Загрузка релизов
// ============================================
export async function loadReleases(db, isAdmin) {
    const snap = await getDocs(query(collection(db, 'releases'), orderBy('timestamp', 'desc')));
    allRel = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderGrid(isAdmin);
}

export function renderGrid(isAdmin) {
    let res = [...allRel];
    
    if (searchEnabled) {
        const q = (document.getElementById('main-search')?.value || '').toLowerCase();
        if (q) res = res.filter(r => r.title?.toLowerCase().includes(q));
    }
    
    const g = document.getElementById('filter-genre')?.value || 'all';
    const s = document.getElementById('filter-sort')?.value || 'new';
    
    if (g !== 'all') res = res.filter(r => r.genre === g);
    if (s === 'pop') res.sort((a, b) => (b.views || 0) - (a.views || 0));
    else if (s === 'random') res.sort(() => 0.5 - Math.random());
    else res.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    document.getElementById('main-grid').innerHTML = res.map(r => `
        <div class="card" onclick="openView('${r.id}')">
            ${isAdmin ? `<div class="adm-tools">
                <button class="btn-sm" style="background:#3897f0;" onclick="event.stopPropagation();openRelModal('${r.id}')">Ред</button>
                <button class="btn-sm" style="background:#ef4444;" onclick="event.stopPropagation();deleteRel('${r.id}')">Удал</button>
            </div>` : ''}
            <img src="${esc(r.img)}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMG}'">
            <div class="card-info">
                <div><span class="tag">${esc(r.genre)}</span><span class="year-tag">${esc(r.year)}</span></div>
                <div class="card-title">${esc(r.title)}</div>
                <div style="font-size:10px;color:var(--text-dim);margin-top:5px;"><i class="fas fa-eye"></i> ${r.views || 0}</div>
            </div>
        </div>`).join('');
}

export function enableSearch() { searchEnabled = true; }
export function disableSearch() {
    searchEnabled = false;
    const inp = document.getElementById('main-search');
    if (inp) inp.value = '';
}

// ============================================
//  Открытие страницы релиза
// ============================================
export async function openViewRelease(db, auth, id, userData, isAdmin) {
    clearTimeout(viewTimer);
    
    const snap = await getDoc(doc(db, 'releases', id));
    if (!snap.exists()) return showToast('Релиз не найден', 'error');
    
    curProj = { id, ...snap.data() };
    const idx = allRel.findIndex(x => x.id === id);
    if (idx >= 0) allRel[idx] = curProj;
    
    navigate('view');

    // ✅ ВАЖНО: Передаём userData для отображения комментариев
    if (userData) {
        try {
            const viewedSnap = await getDoc(doc(db, `users/${auth.currentUser.uid}/viewed`, id));
            if (!viewedSnap.exists()) {
                viewTimer = setTimeout(async () => {
                    await updateDoc(doc(db, 'releases', id), { views: increment(1) });
                    await setDoc(doc(db, `users/${auth.currentUser.uid}/viewed`, id),
                        { at: Date.now(), title: curProj.title, img: curProj.img });
                    await updateDoc(doc(db, 'users', auth.currentUser.uid), { views: increment(1) });
                    curProj.views = (curProj.views || 0) + 1;
                    userData.views = (userData.views || 0) + 1;
                    await checkAndAwardAch(db, auth, userData, 'views_1');
                    if (userData.views >= 10) await checkAndAwardAch(db, auth, userData, 'views_10');
                    if (userData.views >= 50) await checkAndAwardAch(db, auth, userData, 'views_50');
                }, VIEW_COUNT_AFTER_MS);
            }
        } catch (e) {}
    }

    // ✅ Передаём userData в renderViewPage
    renderViewPage(db, auth, userData, isAdmin);
}

// ============================================
//  Рендер страницы релиза
// ============================================
function renderViewPage(db, auth, userData, isAdmin) {
    const eps = curProj.episodes || [];
    const trailer = eps.find(e => e.type === 'trailer');
    const series = eps.filter(e => e.type !== 'trailer');

    // Кнопки списков
    const userListBtns = userData ? `
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;">
            <button class="btn btn-outline btn-sm" id="btn-watch-later" onclick="toggleWatchList('later')">
                <i class="fas fa-clock"></i> Буду смотреть
            </button>
            <button class="btn btn-outline btn-sm" id="btn-favorite" onclick="toggleWatchList('favorite')">
                <i class="fas fa-star"></i> Избранное
            </button>
        </div>` : '';

    // Кнопки админа
    const adminBtn = isAdmin
        ? `<button class="btn btn-blue btn-sm" onclick="openEpManager()"><i class="fas fa-film"></i> Серии</button>`
        : '';

    document.getElementById('v-info').innerHTML = `
        <div class="view-ivi-wrap">
            ${trailer ? `
            <div class="trailer-section" style="margin-bottom:24px;">
                <div class="trailer-label" style="font-size:14px;font-weight:800;color:var(--accent);margin-bottom:10px;">
                    <i class="fas fa-play-circle"></i> Трейлер
                </div>
                <div class="sws-player-container" id="sws-trailer-player"></div>
            </div>` : ''}

            <div class="view-meta-row">
                <img src="${esc(curProj.img)}" class="v-poster" onerror="this.src='${PLACEHOLDER_IMG}'">
                <div class="view-meta-info">
                    <h1 class="view-title">${esc(curProj.title)}</h1>
                    <p style="color:var(--text-dim);margin-bottom:10px;font-size:14px;">${esc(curProj.year)} · ${esc(curProj.genre)}</p>
                    <p style="font-size:13px;line-height:1.7;color:var(--text);margin-bottom:14px;">${esc(curProj.desc)}</p>
                    <div style="font-size:12px;color:var(--text-dim);margin-bottom:6px;"><b>Авторы:</b> ${esc(curProj.authors)}</div>
                    <div style="font-size:12px;color:var(--text-dim);"><b style="color:var(--accent);">Озвучка:</b> ${esc(curProj.voiceover)}</div>
                    <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;align-items:center;">
                        <button id="btn-like" class="react-btn" onclick="rateProj('like')">
                            <i class="fas fa-thumbs-up"></i> <span id="v-like-cnt">0</span>
                        </button>
                        <button id="btn-dislike" class="react-btn" onclick="rateProj('dislike')">
                            <i class="fas fa-thumbs-down"></i> <span id="v-dislike-cnt">0</span>
                        </button>
                        ${adminBtn}
                    </div>
                    ${userListBtns}
                </div>
            </div>

            <div class="main-player-section">
                <div class="sws-player-container" id="sws-main-player">
                    <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-dim);">
                        <div style="text-align:center;">
                            <i class="fas fa-play-circle" style="font-size:3rem;margin-bottom:10px;color:var(--accent);"></i>
                            <p>Выберите серию для просмотра</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

    updateLikesUI(auth, userData);

    // Инициализация трейлера
    if (trailer?.url) {
        initPlayer('sws-trailer-player', {
            url: trailer.url,
            title: 'Трейлер — ' + curProj.title,
            isTrailer: true,
        });
    }

    // Сетка эпизодов
    renderEpGrid(series, isAdmin);

    // ✅ ВАЖНО: Передаём userData в loadComments
    loadComments(db, auth, curProj, userData, isAdmin);
}

// ============================================
//  Сетка эпизодов
// ============================================
function renderEpGrid(series, isAdmin) {
    const epList = document.getElementById('v-ep-list');
    if (!epList) {
        const mainSection = document.querySelector('.main-player-section');
        if (mainSection && series.length > 0) {
            const epGrid = document.createElement('div');
            epGrid.id = 'v-ep-list';
            epGrid.className = 'ep-grid';
            mainSection.appendChild(epGrid);
        }
    }
    
    const list = document.getElementById('v-ep-list');
    if (list) {
        list.innerHTML = series.map((ep, i) => `
            <div class="ep-card" onclick="playEpByIdx(${i})">
                <div class="ep-card-thumb">
                    ${ep.thumb ? `<img src="${esc(ep.thumb)}" alt="" onerror="this.style.display='none'">` : ''}
                    <span style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.6rem;color:var(--text-dim);">
                        <i class="fas fa-film"></i>
                    </span>
                    ${isAdmin ? `
                    <div class="ep-card-adm">
                        <button class="ep-adm-btn ep-adm-btn--edit" title="Редактировать" onclick="event.stopPropagation();editEp(${i})">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="ep-adm-btn ep-adm-btn--del" title="Удалить" onclick="event.stopPropagation();delEp(${i})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>` : ''}
                </div>
                <div class="ep-card-name">${esc(ep.name)}</div>
                ${ep.title ? `<div class="ep-card-title">${esc(ep.title)}</div>` : ''}
            </div>`).join('');
    }
}

// ============================================
//  Лайки
// ============================================
function updateLikesUI(auth, userData) {
    const uid = userData ? auth.currentUser?.uid : null;
    const lc = document.getElementById('v-like-cnt');
    const dc = document.getElementById('v-dislike-cnt');
    if (lc) lc.innerText = (curProj?.likes || []).length;
    if (dc) dc.innerText = (curProj?.dislikes || []).length;
    document.getElementById('btn-like')?.classList.toggle('active', !!(uid && (curProj?.likes || []).includes(uid)));
    document.getElementById('btn-dislike')?.classList.toggle('active', !!(uid && (curProj?.dislikes || []).includes(uid)));
}

// ============================================
//  Bind
// ============================================
export function bindReleases(db, auth, getState) {
    window.filterData = () => {
        const { isAdmin } = getState();
        renderGrid(isAdmin);
    };

    window.openView = async (id) => {
        const { userData, isAdmin } = getState();
        await openViewRelease(db, auth, id, userData, isAdmin);
        getState().curProj = curProj;
    };

    window.rateProj = async (type) => {
        const { userData } = getState();
        if (!userData) return showToast('Авторизуйтесь для оценки', 'error');
        const uid = auth.currentUser.uid;
        let likes = [...(curProj.likes || [])];
        let dislikes = [...(curProj.dislikes || [])];
        
        if (type === 'like') {
            if (likes.includes(uid)) likes = likes.filter(x => x !== uid);
            else {
                likes.push(uid);
                dislikes = dislikes.filter(x => x !== uid);
            }
        } else {
            if (dislikes.includes(uid)) dislikes = dislikes.filter(x => x !== uid);
            else {
                dislikes.push(uid);
                likes = likes.filter(x => x !== uid);
            }
        }
        
        curProj.likes = likes;
        curProj.dislikes = dislikes;
        await updateDoc(doc(db, 'releases', curProj.id), { likes, dislikes });
        updateLikesUI(auth, userData);
        await checkAndAwardAch(db, auth, userData, 'like_1');
    };

    window.toggleWatchList = async (type) => {
        const { userData } = getState();
        if (!userData) return showToast('Войдите для добавления в список', 'error');
        const uid = auth.currentUser.uid;
        const ref = doc(db, `users/${uid}/watchlist`, curProj.id);
        const snap = await getDoc(ref);
        
        if (snap.exists() && snap.data().type === type) {
            await deleteDoc(ref);
            showToast('Удалено из списка');
        } else {
            await setDoc(ref, { type, relId: curProj.id, title: curProj.title, img: curProj.img, addedAt: Date.now() });
            showToast('Добавлено в список');
            if (type === 'favorite') await checkAndAwardAch(db, auth, userData, 'favorite_1');
        }
    };

    window.openEpManager = () => {
        document.getElementById('ed-ep-idx').value = '';
        ['ad-ep-name', 'ad-ep-title', 'ad-ep-url', 'ad-ep-thumb'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        document.getElementById('m-ep-heading').textContent = 'Добавить медиа';
        document.getElementById('m-ep').style.display = 'flex';
    };

    window.editEp = (idx) => {
        const series = (curProj.episodes || []).filter(e => e.type !== 'trailer');
        const ep = series[idx];
        if (!ep) return;
        
        document.getElementById('ed-ep-idx').value = idx;
        document.getElementById('ad-ep-type').value = ep.type || 'series';
        document.getElementById('ad-ep-name').value = ep.name || '';
        document.getElementById('ad-ep-title').value = ep.title || '';
        document.getElementById('ad-ep-url').value = ep.url || '';
        document.getElementById('ad-ep-thumb').value = ep.thumb || '';
        document.getElementById('m-ep-heading').textContent = 'Редактировать медиа';
        document.getElementById('m-ep').style.display = 'flex';
    };

    window.saveEp = async () => {
        if (!curProj) return;
        const { isAdmin } = getState();
        const editIdxEl = document.getElementById('ed-ep-idx');
        const editIdx = editIdxEl?.value !== '' && editIdxEl?.value !== undefined
            ? parseInt(editIdxEl.value) : -1;

        const ep = {
            type: document.getElementById('ad-ep-type').value,
            name: document.getElementById('ad-ep-name').value.trim(),
            title: document.getElementById('ad-ep-title')?.value.trim() || '',
            url: document.getElementById('ad-ep-url').value.trim(),
            thumb: document.getElementById('ad-ep-thumb')?.value.trim() || '',
        };
        
        if (!ep.name || !ep.url) return showToast('Заполните название и URL!', 'error');

        const eps = [...(curProj.episodes || [])];
        if (editIdx >= 0 && editIdx < eps.length) {
            eps[editIdx] = ep;
        } else {
            eps.push(ep);
        }
        
        await updateDoc(doc(db, 'releases', curProj.id), { episodes: eps });
        curProj.episodes = eps;
        closeModals();
        
        renderEpGrid(eps.filter(e => e.type !== 'trailer'), isAdmin);
        showToast('Медиа сохранено!');
    };

    window.delEp = async (idx) => {
        if (!confirm('Удалить медиа?')) return;
        const { isAdmin } = getState();
        const eps = [...(curProj.episodes || [])];
        eps.splice(idx, 1);
        await updateDoc(doc(db, 'releases', curProj.id), { episodes: eps });
        curProj.episodes = eps;
        renderEpGrid(eps.filter(e => e.type !== 'trailer'), isAdmin);
        showToast('Удалено');
    };

    window.openRelModal = async (id = '') => {
        document.getElementById('ed-rel-id').value = id;
        if (id) {
            const r = allRel.find(x => x.id === id);
            if (r) {
                ['title', 'year', 'voiceover', 'authors', 'img', 'desc'].forEach(f => {
                    const el = document.getElementById('ad-' + f);
                    if (el) el.value = r[f] || '';
                });
                const g = document.getElementById('ad-genre');
                if (g) g.value = r.genre || '';
            }
        } else {
            ['title', 'year', 'voiceover', 'authors', 'img', 'desc'].forEach(f => {
                const el = document.getElementById('ad-' + f);
                if (el) el.value = '';
            });
        }
        document.getElementById('m-rel').style.display = 'flex';
    };

    window.saveRel = async () => {
        const { isAdmin } = getState();
        const id = document.getElementById('ed-rel-id').value;
        const data = {
            title: document.getElementById('ad-title').value,
            genre: document.getElementById('ad-genre').value,
            year: document.getElementById('ad-year').value,
            voiceover: document.getElementById('ad-voiceover').value,
            authors: document.getElementById('ad-authors').value,
            img: document.getElementById('ad-img').value,
            desc: document.getElementById('ad-desc').value,
            timestamp: id ? (allRel.find(x => x.id === id)?.timestamp || Date.now()) : Date.now()
        };
        
        if (!data.title) return showToast('Введите название!', 'error');
        
        if (!id) await addDoc(collection(db, 'releases'), data);
        else await updateDoc(doc(db, 'releases', id), data);
        
        closeModals();
        await loadReleases(db, isAdmin);
        showToast('Релиз сохранён!');
    };

    window.deleteRel = async (id) => {
        if (!confirm('Удалить релиз?')) return;
        const { isAdmin } = getState();
        await deleteDoc(doc(db, 'releases', id));
        await loadReleases(db, isAdmin);
        showToast('Удалено');
    };

    window.loadMyLists = async () => {
        const { userData } = getState();
        if (!userData || !auth.currentUser) return;
        
        const uid = auth.currentUser.uid;
        const container = document.getElementById('my-lists-wrap');
        if (!container) return;
        
        container.innerHTML = `<p style="font-size:12px;color:var(--text-dim);">Загрузка...</p>`;
        
        try {
            const wSnap = await getDocs(collection(db, `users/${uid}/watchlist`));
            const all = wSnap.docs.map(d => d.data());
            const later = all.filter(x => x.type === 'later');
            const favorite = all.filter(x => x.type === 'favorite');
            
            const favHtml = favorite.length
                ? `<div class="lists-grid">${favorite.map(r => `<div class="list-card" onclick="openView('${r.relId}')"><img src="${esc(r.img)}" onerror="this.src='${PLACEHOLDER_IMG}'"><div class="list-card-title">${esc(r.title)}</div></div>`).join('')}</div>`
                : `<p class="list-empty">Пусто</p>`;
            
            const laterHtml = later.length
                ? `<div class="lists-grid">${later.map(r => `<div class="list-card" onclick="openView('${r.relId}')"><img src="${esc(r.img)}" onerror="this.src='${PLACEHOLDER_IMG}'"><div class="list-card-title">${esc(r.title)}</div></div>`).join('')}</div>`
                : `<p class="list-empty">Пусто</p>`;
            
            container.innerHTML = `
                <div style="margin-bottom:20px;">
                    <h5 style="margin-bottom:10px;">⭐ Избранное (${favorite.length})</h5>
                    ${favHtml}
                </div>
                <div>
                    <h5 style="margin-bottom:10px;">🕐 Буду смотреть (${later.length})</h5>
                    ${laterHtml}
                </div>`;
        } catch (e) {
            container.innerHTML = `<p style="color:#ef4444;font-size:13px;">Ошибка загрузки.</p>`;
            console.error(e);
        }
    };

    window.playEpByIdx = (idx) => {
        const series = (curProj?.episodes || []).filter(e => e.type !== 'trailer');
        const ep = series[idx];
        if (!ep) return;
        
        const player = document.getElementById('sws-main-player');
        if (player) {
            player.innerHTML = `
                <iframe class="swsp-iframe"
                    src="${getEmbedUrl(ep.url)}"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowfullscreen
                    frameborder="0"
                    style="position:absolute;inset:0;width:100%;height:100%;border:none;">
                </iframe>`;
        }
    };

    window.openPrivacy = async () => {
        const { isAdmin } = getState();
        try {
            const snap = await getDoc(doc(db, 'settings', 'privacy'));
            document.getElementById('priv-text').innerText = snap.exists() ? snap.data().text : 'Текст не добавлен.';
        } catch {
            document.getElementById('priv-text').innerText = 'Текст не добавлен.';
        }
        document.getElementById('priv-adm-btns').style.display = isAdmin ? 'block' : 'none';
        document.getElementById('m-privacy').style.display = 'flex';
    };
}

function getEmbedUrl(url) {
    if (!url) return '';
    
    if (url.includes('youtube.com/watch')) {
        const v = new URL(url).searchParams.get('v');
        return `https://www.youtube.com/embed/${v}?autoplay=1&rel=0`;
    }
    if (url.includes('youtu.be/')) {
        const v = url.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube.com/embed/${v}?autoplay=1&rel=0`;
    }
    if (url.includes('drive.google.com')) {
        return url.replace('/view', '/preview').replace('/edit', '/preview');
    }
    return url;
}