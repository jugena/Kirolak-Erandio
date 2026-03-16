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
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(isoString).toLocaleDateString('es-ES', options);
}

// Generate Latest News for Home Page
function loadLatestNews() {
    const container = document.getElementById('latest-news-container');
    if (!container) return;

    const news = getNews();
    if (news.length === 0) {
        container.innerHTML = '<p>No hay noticias recientes.</p>';
        return;
    }

    // Get the latest one
    const latest = news[0];
    container.innerHTML = `
        <div class="news-item">
            <span class="news-date">${formatDate(latest.date)}</span>
            <h3 class="news-title">${latest.title}</h3>
            <div class="news-content">
                ${latest.content.length > 200 ? latest.content.substring(0, 200) + '...' : latest.content}
            </div>
            <a href="noticias.html" class="btn" style="margin-top: 1rem;">Ver todas las noticias</a>
        </div>
    `;
}

// Generate All News for Noticias Page
function loadAllNews() {
    const container = document.getElementById('all-news-container');
    if (!container) return;

    const news = getNews();
    if (news.length === 0) {
        container.innerHTML = '<p>No hay noticias publicadas.</p>';
        return;
    }

    container.innerHTML = news.map(item => `
        <div class="news-item">
            <span class="news-date">${formatDate(item.date)}</span>
            <h2 class="news-title">${item.title}</h2>
            <div class="news-content">${item.content}</div>
        </div>
    `).join('');
}

// Backoffice Logic
function initBackoffice() {
    const tableBody = document.getElementById('news-table-body');
    const form = document.getElementById('news-form');
    
    if (!tableBody || !form) return;

    // Initialize Quill Rich Text Editor
    const quill = new Quill('#editor-container', {
        theme: 'snow',
        placeholder: 'Escribe el contenido de la noticia...',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'image', 'video'],
                ['clean']
            ]
        }
    });

    function renderTable() {
        const news = getNews();
        tableBody.innerHTML = news.map((item, index) => `
            <tr>
                <td>${item.title}</td>
                <td>${formatDate(item.date)}</td>
                <td>
                    <button class="btn btn-small btn-danger" onclick="deleteNews(${index})">Eliminar</button>
                </td>
            </tr>
        `).join('');
    }

    // Expose delete to global scope for inline onclick
    window.deleteNews = function(index) {
        if(confirm('¿Estás seguro de que deseas eliminar esta noticia?')) {
            const news = getNews();
            news.splice(index, 1);
            saveNews(news);
            renderTable();
        }
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('news-title').value;
        const content = quill.root.innerHTML;

        if(!title.trim() || quill.getText().trim() === '') {
            alert('Por favor, completa el título y el contenido.');
            return;
        }

        const news = getNews();
        news.unshift({
            id: Date.now().toString(),
            title,
            content,
            date: new Date().toISOString()
        });

        saveNews(news);
        
        // Reset form
        form.reset();
        quill.setContents([]);
        alert('Noticia publicada con éxito');
        renderTable();
    });

    renderTable();
}

// Populate sample news if empty and we are on index
function initSampleData() {
    if (!localStorage.getItem('kirolak_news_initialized')) {
        const sampleNews = [
            {
                id: '1',
                title: 'Nuevas Actividades Deportivas para este Verano',
                content: '<p>Este verano abrimos la inscripción para nuevas clases de natación, pádel y gimnasia de mantenimiento. ¡Aprovecha la oportunidad para ponerte en forma!</p><ul><li>Natación</li><li>Pádel</li><li>Tenis</li></ul>',
                date: new Date().toISOString()
            }
        ];
        saveNews(sampleNews);
        localStorage.setItem('kirolak_news_initialized', 'true');
    }
}

// Run functions based on current page
document.addEventListener('DOMContentLoaded', () => {
    initSampleData();
    loadLatestNews();
    loadAllNews();
    initBackoffice();
});
