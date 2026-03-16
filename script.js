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
    const news = getNews();
    if (news.length === 0) {
        container.innerHTML = lang === 'eu' ? '<p>Ez dago azken berririk.</p>' : '<p>No hay noticias recientes.</p>';
        return;
    }

    const latest = news[0];
    const title = lang === 'eu' ? (latest.title_eu || latest.title) : (latest.title_es || latest.title);
    const content = lang === 'eu' ? (latest.content_eu || latest.content) : (latest.content_es || latest.content);

    container.innerHTML = `
        <div class="news-item">
            <span class="news-date">${formatDate(latest.date)}</span>
            <h3 class="news-title">${title}</h3>
            <div class="news-content">
                ${content.replace(/<[^>]*>?/gm, '').length > 200 ? content.replace(/<[^>]*>?/gm, '').substring(0, 200) + '...' : content}
            </div>
            <a href="${lang === 'eu' ? 'berriak.html' : 'noticias.html'}" class="btn" style="margin-top: 1rem;">${lang === 'eu' ? 'Ikusi berri guztiak' : 'Ver todas las noticias'}</a>
        </div>
    `;
}

// Generate All News for Noticias Page
function loadAllNews() {
    const container = document.getElementById('all-news-container') || document.getElementById('all-news-container-eu');
    if (!container) return;

    const lang = document.documentElement.lang || 'es';
    const news = getNews();
    if (news.length === 0) {
        container.innerHTML = lang === 'eu' ? '<p>Ez dago berririk argitaratuta.</p>' : '<p>No hay noticias publicadas.</p>';
        return;
    }

    container.innerHTML = news.map(item => {
        const title = lang === 'eu' ? (item.title_eu || item.title) : (item.title_es || item.title);
        const content = lang === 'eu' ? (item.content_eu || item.content) : (item.content_es || item.content);
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
            <tr>
                <td>${item.title_es || item.title}</td>
                <td>${formatDate(item.date)}</td>
                <td>
                    <button class="btn btn-small" style="background:#2ecc71;" onclick="editNews('${item.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-small btn-danger" onclick="deleteNews('${item.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    window.deleteNews = function(id) {
        if (confirm('¿Estás seguro?')) {
            let news = getNews();
            news = news.filter(item => item.id !== id);
            saveNews(news);
            renderTable();
        }
    };

    window.editNews = function(id) {
        const news = getNews();
        const item = news.find(n => n.id === id);
        if (!item) return;

        document.getElementById('news-id').value = item.id;
        document.getElementById('news-title-es').value = item.title_es || item.title || '';
        document.getElementById('news-title-eu').value = item.title_eu || '';
        quillEs.root.innerHTML = item.content_es || item.content || '';
        quillEu.root.innerHTML = item.content_eu || '';

        document.getElementById('submit-btn').innerHTML = '<i class="fas fa-save"></i> Actualizar Noticia';
        document.getElementById('cancel-edit').style.display = 'inline-block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    document.getElementById('cancel-edit').onclick = () => {
        form.reset();
        document.getElementById('news-id').value = '';
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
        const content_es = quillEs.root.innerHTML;
        const content_eu = quillEu.root.innerHTML;

        let news = getNews();
        if (id) {
            // Update
            const index = news.findIndex(n => n.id === id);
            news[index] = { ...news[index], title_es, title_eu, content_es, content_eu };
        } else {
            // New
            news.unshift({
                id: Date.now().toString(),
                title_es, title_eu, content_es, content_eu,
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
    if (!localStorage.getItem('kirolak_news_initialized_v2')) {
        const sampleNews = [
            {
                id: '1',
                title_es: 'Nuevas Actividades Deportivas para este Verano',
                title_eu: 'Udarako Kirol Jarduera Berriak',
                content_es: '<p>Este verano abrimos la inscripción para nuevas clases de natación, pádel y gimnasia de mantenimiento.</p>',
                content_eu: '<p>Uda honetan igeriketa, pala eta mantentze-gimnasia eskolatarako izen-ematea ireki dugu.</p>',
                date: new Date().toISOString()
            }
        ];
        saveNews(sampleNews);
        localStorage.setItem('kirolak_news_initialized_v2', 'true');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initSampleData();
    loadLatestNews();
    loadAllNews();
    initBackoffice();
});
