// ============================================================
//  js/player.js - Blood Wash Studio Player v3
// ============================================================

export function getYtVideoId(url) {
    if (!url) return '';
    try {
        if (url.includes('youtube.com/watch')) {
            return new URL(url).searchParams.get('v') || '';
        }
        if (url.includes('youtu.be/')) {
            return url.split('youtu.be/')[1]?.split('?')[0] || '';
        }
        if (url.includes('youtube.com/embed/')) {
            return url.split('youtube.com/embed/')[1]?.split('?')[0] || '';
        }
    } catch(e) {
        return '';
    }
    return '';
}

export function buildEmbedSrc(url, startSec = 0) {
    if (!url) return '';
    
    const ytId = getYtVideoId(url);
    if (ytId) {
        const start = startSec > 0 ? `&start=${Math.floor(startSec)}` : '';
        return `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1${start}`;
    }
    
    if (url.includes('drive.google.com')) {
        // Конвертируем ссылку на Google Drive в embed
        return url.replace(/\/view.*$/, '/preview').replace(/\/file\/d\/(.*?)\/edit/, '/file/d/$1/preview');
    }
    
    return url;
}

export function initPlayer(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const { url = '', title = '', isTrailer = false } = options;
    const src = buildEmbedSrc(url);
    const isDrive = !getYtVideoId(url) && url.includes('drive.google.com');
    
    let html = `
        <div class="swsp" style="position: relative; width: 100%; height: 100%;">
            <iframe class="swsp-iframe"
                src="${src}"
                allow="autoplay; fullscreen; picture-in-picture"
                allowfullscreen
                frameborder="0"
                title="${esc(title)}"
                style="position: absolute; inset: 0; width: 100%; height: 100%; border: none;">
            </iframe>
    `;
    
    if (!isTrailer && isDrive) {
        html += `
            <button class="swsp-drive-menu-btn" style="position: absolute; bottom: 14px; right: 14px; z-index: 20;
                    width: 38px; height: 38px; border-radius: 50%; background: rgba(0,0,0,0.65);
                    border: 1px solid rgba(255,255,255,0.25); color: white; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;"
                    onclick="alert('Используйте стандартные элементы управления Google Drive')">
                <i class="fas fa-info"></i>
            </button>
        `;
    }
    
    html += `</div>`;
    container.innerHTML = html;
}

export function playerLoad(containerId, url, title = '') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const iframe = container.querySelector('.swsp-iframe');
    if (iframe) {
        iframe.src = buildEmbedSrc(url);
        iframe.title = title;
    } else {
        initPlayer(containerId, { url, title });
    }
}

export function playerUpdateEpisodes(containerId, episodes, currentIdx) {
    // Для простоты пока пропустим, так как основная логика в releases.js
    console.log('Player episodes updated');
}