// Initialize news storage
function getNews() {
    const news = localStorage.getItem('kirolak_news');
    return news ? JSON.parse(news) : [];
}

function saveNews(newsArray) {
    localStorage.setItem('kirolak_news', JSON.stringify(newsArray));
}

// Format date nicely
function formatDate(isoString) {
    const lang = document.documentElement.lang || 'es';
    const locale = lang === 'eu' ? 'eu-ES' : 'es-ES';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(isoString).toLocaleDateString(locale, options);
}

// Generate Latest News for Home Page
function loadLatestNews() {
    const container = document.getElementById('latest-news-container') || document.getElementById('latest-news-container-eu');
    if (!container) return;

    const lang = document.documentElement.lang || 'es';
    let news = getNews();

    // Filter out disabled news and only keep those for home
    const homeNews = news.filter(item => !item.disabled && item.on_home);

    if (homeNews.length === 0) {
        // If no home-specific news, show the most recent non-disabled one
        const activeNews = news.filter(item => !item.disabled);
        if (activeNews.length === 0) {
            container.innerHTML = lang === 'eu' ? '<p>Ez dago azken berririk.</p>' : '<p>No hay noticias recientes.</p>';
            return;
        }
        renderSingleNews(container, activeNews[0], lang);
        return;
    }

    if (homeNews.length === 1) {
        renderSingleNews(container, homeNews[0], lang);
        return;
    }

    // Carousel logic for 2 or more news
    renderCarouselNews(container, homeNews, lang);
}

function renderSingleNews(container, item, lang) {
    const title = lang === 'eu' ? (item.title_eu || item.title_es) : (item.title_es || item.title_eu);
    const content = lang === 'eu' ? (item.content_eu || item.content_es) : (item.content_es || item.content_eu);

    container.innerHTML = `
        <div class="news-item">
            <span class="news-date">${formatDate(item.date)}</span>
            <h3 class="news-title">${title}</h3>
            <div class="news-content">
                ${content.replace(/<[^>]*>?/gm, '').length > 200 ? content.replace(/<[^>]*>?/gm, '').substring(0, 200) + '...' : content}
            </div>
            <a href="${lang === 'eu' ? 'berriak.html' : 'noticias.html'}" class="btn" style="margin-top: 1rem;">${lang === 'eu' ? 'Ikusi berri guztiak' : 'Ver todas las noticias'}</a>
        </div>
    `;
}

function renderCarouselNews(container, newsItems, lang) {
    let currentIndex = 0;

    function getNewsHTML(item) {
        const title = lang === 'eu' ? (item.title_eu || item.title_es) : (item.title_es || item.title_eu);
        const content = lang === 'eu' ? (item.content_eu || item.content_es) : (item.content_es || item.content_eu);
        const summary = content.replace(/<[^>]*>?/gm, '').length > 150 ? content.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...' : content;

        return `
            <div class="news-item carousel-active">
                <span class="news-date">${formatDate(item.date)}</span>
                <h3 class="news-title">${title}</h3>
                <div class="news-content">${summary}</div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1.5rem;">
                    <a href="${lang === 'eu' ? 'berriak.html' : 'noticias.html'}" class="btn btn-small">${lang === 'eu' ? 'Gehiago irakurri' : 'Leer más'}</a>
                    <div class="carousel-controls">
                        <button onclick="changeCarousel(-1)" class="carousel-btn"><i class="fas fa-chevron-left"></i></button>
                        <span style="font-size: 0.9rem; font-weight: bold; color: var(--primary-color);">${currentIndex + 1} / ${newsItems.length}</span>
                        <button onclick="changeCarousel(1)" class="carousel-btn"><i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>
            </div>
        `;
    }

    container.innerHTML = getNewsHTML(newsItems[currentIndex]);

    window.changeCarousel = (direction) => {
        currentIndex = (currentIndex + direction + newsItems.length) % newsItems.length;
        container.innerHTML = getNewsHTML(newsItems[currentIndex]);
    };

    // Auto-rotate every 5 seconds
    const interval = setInterval(() => {
        if (!document.getElementById('latest-news-container') && !document.getElementById('latest-news-container-eu')) {
            clearInterval(interval);
            return;
        }
        changeCarousel(1);
    }, 5000);
}

// Generate All News for Noticias Page
function loadAllNews() {
    const container = document.getElementById('all-news-container') || document.getElementById('all-news-container-eu');
    if (!container) return;

    const lang = document.documentElement.lang || 'es';
    const news = getNews().filter(item => !item.disabled);

    if (news.length === 0) {
        container.innerHTML = lang === 'eu' ? '<p>Ez dago berririk argitaratuta.</p>' : '<p>No hay noticias publicadas.</p>';
        return;
    }

    container.innerHTML = news.map(item => {
        const title = lang === 'eu' ? (item.title_eu || item.title_es) : (item.title_es || item.title_eu);
        const content = lang === 'eu' ? (item.content_eu || item.content_es) : (item.content_es || item.content_eu);
        return `
            <div class="news-item">
                <span class="news-date">${formatDate(item.date)}</span>
                <h2 class="news-title">${title}</h2>
                <div class="news-content">${content}</div>
            </div>
        `;
    }).join('');
}

// Translation Helper (using a free API proxy or simple fetch)
async function translateContent(from, to) {
    const title = document.getElementById(`news-title-${from}`).value;
    const editor = from === 'es' ? quillEs : quillEu;
    const targetEditor = to === 'es' ? quillEs : quillEu;
    const content = editor.root.innerHTML;

    if (!title.trim()) {
        alert('Por favor, escribe un título primero.');
        return;
    }

    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traduciendo...';
    btn.disabled = true;

    try {
        // We call MyMemory API for translation
        const translate = async (text) => {
            const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`);
            const data = await res.json();
            return data.responseData.translatedText;
        };

        const translatedTitle = await translate(title);
        document.getElementById(`news-title-${to}`).value = translatedTitle;

        // Note: For HTML content, MyMemory might struggle with tags if not handled properly.
        // We'll translate the text parts roughly for this demo.
        const translatedContent = await translate(editor.getText());
        targetEditor.setText(translatedContent);

        alert('Traducción completada. Por favor, revisa el resultado.');
    } catch (error) {
        console.error(error);
        alert('Error en la traducción. Por favor, inténtalo de nuevo.');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Backoffice Logic
let quillEs, quillEu;
function initBackoffice() {
    const tableBody = document.getElementById('news-table-body');
    const form = document.getElementById('news-form');
    if (!tableBody || !form) return;

    const toolbarOptions = [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
    ];

    quillEs = new Quill('#editor-es', { theme: 'snow', modules: { toolbar: toolbarOptions } });
    quillEu = new Quill('#editor-eu', { theme: 'snow', modules: { toolbar: toolbarOptions } });

    function renderTable() {
        const news = getNews();
        tableBody.innerHTML = news.map((item, index) => `
            <tr style="${item.disabled ? 'opacity: 0.5; background: #f9f9f9;' : ''}">
                <td>
                    ${item.title_es || item.title}
                    ${item.on_home ? '<br><small style="color:var(--secondary-color); font-weight:bold;"><i class="fas fa-home"></i> En Carrusel Home</small>' : ''}
                    ${item.disabled ? '<br><small style="color:#d63031; font-weight:bold;"><i class="fas fa-eye-slash"></i> Deshabilitada</small>' : ''}
                </td>
                <td>${formatDate(item.date)}</td>
                <td>
                    <button class="btn btn-small" style="background:#3498db;" onclick="duplicateNews('${item.id}')" title="Duplicar"><i class="fas fa-copy"></i></button>
                    <button class="btn btn-small" style="background:#2ecc71;" onclick="editNews('${item.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-small btn-danger" onclick="deleteNews('${item.id}')" title="Eliminar"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    window.deleteNews = function (id) {
        if (confirm('¿Estás seguro?')) {
            let news = getNews();
            news = news.filter(item => item.id !== id);
            saveNews(news);
            renderTable();
        }
    };

    window.duplicateNews = function (id) {
        const news = getNews();
        const item = news.find(n => n.id === id);
        if (!item) return;

        const newItem = {
            ...item,
            id: Date.now().toString(),
            title_es: (item.title_es || item.title) + " (Copia)",
            title_eu: (item.title_eu ? item.title_eu + " (Kopia)" : ""),
            date: new Date().toISOString()
        };

        news.unshift(newItem);
        saveNews(news);
        renderTable();
        alert('Noticia duplicada con éxito. Puedes encontrarla al principio de la lista.');
    };

    window.editNews = function (id) {
        const news = getNews();
        const item = news.find(n => n.id === id);
        if (!item) return;

        document.getElementById('news-id').value = item.id;
        document.getElementById('news-title-es').value = item.title_es || item.title || '';
        document.getElementById('news-title-eu').value = item.title_eu || '';
        document.getElementById('news-on-home').checked = !!item.on_home;
        document.getElementById('news-disabled').checked = !!item.disabled;
        quillEs.root.innerHTML = item.content_es || item.content || '';
        quillEu.root.innerHTML = item.content_eu || '';

        document.getElementById('submit-btn').innerHTML = '<i class="fas fa-save"></i> Actualizar Noticia';
        document.getElementById('cancel-edit').style.display = 'inline-block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    document.getElementById('cancel-edit').onclick = () => {
        form.reset();
        document.getElementById('news-id').value = '';
        document.getElementById('news-on-home').checked = false;
        document.getElementById('news-disabled').checked = false;
        quillEs.setContents([]);
        quillEu.setContents([]);
        document.getElementById('submit-btn').innerHTML = '<i class="fas fa-save"></i> Publicar Noticia';
        document.getElementById('cancel-edit').style.display = 'none';
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('news-id').value;
        const title_es = document.getElementById('news-title-es').value;
        const title_eu = document.getElementById('news-title-eu').value;
        const on_home = document.getElementById('news-on-home').checked;
        const disabled = document.getElementById('news-disabled').checked;
        const content_es = quillEs.root.innerHTML;
        const content_eu = quillEu.root.innerHTML;

        let news = getNews();
        if (id) {
            // Update
            const index = news.findIndex(n => n.id === id);
            news[index] = { ...news[index], title_es, title_eu, content_es, content_eu, on_home, disabled };
        } else {
            // New
            news.unshift({
                id: Date.now().toString(),
                title_es, title_eu, content_es, content_eu,
                on_home, disabled,
                date: new Date().toISOString()
            });
        }

        saveNews(news);
        document.getElementById('cancel-edit').click();
        alert('Noticia guardada con éxito');
        renderTable();
    });

    renderTable();
    window.translateContent = translateContent;
}

// Populate sample news if empty
function initSampleData() {
    if (!localStorage.getItem('kirolak_news_initialized_v3')) {
        const sampleNews = [
            {
                id: '1',
                title_es: 'Nuevas Actividades Deportivas para este Verano',
                title_eu: 'Udarako Kirol Jarduera Berriak',
                content_es: '<p>Este verano abrimos la inscripción para nuevas clases de natación, pádel y gimnasia de mantenimiento.</p>',
                content_eu: '<p>Uda honetan igeriketa, pala eta mantentze-gimnasia eskolatarako izen-ematea ireki dugu.</p>',
                date: new Date().toISOString(),
                on_home: true,
                disabled: false
            }
        ];
        saveNews(sampleNews);
        localStorage.setItem('kirolak_news_initialized_v3', 'true');
    }
}

// Map Initialization
function initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    const lang = document.documentElement.lang || 'es';

    // Center map in Erandio
    const map = L.map('map').setView([43.308, -2.978], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const locations = [
        {
            name: lang === 'eu' ? 'Altzaga Kiroldegia' : 'Polideportivo Altzaga',
            coords: [43.30626, -2.97295],
            url: lang === 'eu' ? 'altzaga-eu.html' : 'altzaga.html'
        },
        {
            name: lang === 'eu' ? 'Astrabudua Kiroldegia' : 'Polideportivo Astrabudua',
            coords: [43.31533, -2.98033],
            url: lang === 'eu' ? 'astrabudua-eu.html' : 'astrabudua.html'
        },
        {
            name: lang === 'eu' ? 'Arteagako Futbol Zelaia' : 'Campo de fútbol Arteaga',
            coords: [43.31041, -2.95745],
            url: lang === 'eu' ? 'arteaga-eu.html' : 'arteaga.html'
        },
        {
            name: lang === 'eu' ? 'Astrabuduako Futbol Zelaia' : 'Campo de fútbol Astrabudua',
            coords: [43.31481, -2.98004],
            url: lang === 'eu' ? 'astrabudua-zelaia.html' : 'campo-astrabudua.html'
        },
        {
            name: lang === 'eu' ? 'Lutxanako Arraun Pabilioia' : 'Pabellón Remo Lutxana',
            coords: [43.29353, -2.97115],
            url: lang === 'eu' ? 'lutxana-eu.html' : 'lutxana.html'
        }
    ];

    locations.forEach(loc => {
        L.marker(loc.coords).addTo(map)
            .bindPopup(`<b>${loc.name}</b><br><a href="${loc.url}">${lang === 'eu' ? 'Ikusi xehetasunak' : 'Ver detalles'}</a>`);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initSampleData();
    loadLatestNews();
    loadAllNews();
    initBackoffice();
});
