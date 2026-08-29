// ============================================================
//  js/player.js - NekoSound Player v1
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
    } catch (e) {
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
        return url.replace(/\/view.*$/, '/preview').replace(/\/file\/d\/(.*?)\/edit/, '/file/d/$1/preview');
    }
    
    return url;
}

export function initPlayer(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const { url = '', title = '', isTrailer = false } = options;
    const src = buildEmbedSrc(url);
    
    container.innerHTML = `
        <div class="swsp" style="position: relative; width: 100%; height: 100%;">
            <iframe class="swsp-iframe"
                src="${src}"
                allow="autoplay; fullscreen; picture-in-picture"
                allowfullscreen
                frameborder="0"
                title="${esc(title)}"
                style="position: absolute; inset: 0; width: 100%; height: 100%; border: none;">
            </iframe>
        </div>`;
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
    console.log('Player episodes updated');
}