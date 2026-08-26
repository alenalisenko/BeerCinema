// Конструктор расписания: подбирает реальные сеансы из REST API
// по желаемому интервалу времени и количеству фильмов
document.addEventListener('DOMContentLoaded', () => {
    const startTimeSaved = localStorage.getItem('start-time');
    const endTimeSaved = localStorage.getItem('end-time');
    const maxMoviesSaved = localStorage.getItem('max-movies');

    if (startTimeSaved) document.getElementById('start-time').value = startTimeSaved;
    if (endTimeSaved) document.getElementById('end-time').value = endTimeSaved;
    if (maxMoviesSaved) document.getElementById('max-movies').value = maxMoviesSaved;

    function timeOf(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }

    function dateOf(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    }

    document.getElementById('schedule-form').addEventListener('submit', async function (event) {
        event.preventDefault();

        const startTime = document.getElementById('start-time').value;
        const endTime = document.getElementById('end-time').value;
        const maxMovies = parseInt(document.getElementById('max-movies').value, 10);

        if (!startTime || !endTime || isNaN(maxMovies)) {
            alert('Пожалуйста, заполните все поля!');
            return;
        }

        localStorage.setItem('start-time', startTime);
        localStorage.setItem('end-time', endTime);
        localStorage.setItem('max-movies', maxMovies);

        const output = document.getElementById('schedule-output');
        output.className = 'table-card mt-6';
        while (output.firstChild) {
            output.removeChild(output.firstChild);
        }

        let sessions = [];
        try {
            const res = await fetch('/api/sessions?page=1&limit=100');
            const json = await res.json();
            sessions = json.data || [];
        } catch {
            const err = document.createElement('p');
            err.textContent = 'Не удалось загрузить сеансы, попробуйте позже.';
            err.style.padding = '16px 18px';
            output.appendChild(err);
            return;
        }

        // Фильтр по времени начала сеанса и лимиту фильмов (один сеанс на фильм)
        const seenFilms = new Set();
        const filtered = [];
        for (const s of sessions) {
            const t = timeOf(s.startTime);
            if (t < startTime || t > endTime) continue;
            if (seenFilms.has(s.filmId)) continue;
            seenFilms.add(s.filmId);
            filtered.push(s);
            if (filtered.length >= maxMovies) break;
        }

        if (filtered.length === 0) {
            const p = document.createElement('p');
            p.textContent = 'Нет сеансов, подходящих под заданные критерии.';
            p.style.padding = '16px 18px';
            output.appendChild(p);
            return;
        }

        const caption = document.createElement('p');
        caption.style.padding = '16px 18px 0';
        caption.textContent = `Расписание с ${startTime} до ${endTime} на ${filtered.length} фильмов:`;
        output.appendChild(caption);

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['Фильм', 'Дата и время', 'Зал', 'Цена', ''].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        filtered.forEach(s => {
            const row = document.createElement('tr');

            const cells = [
                s.film ? s.film.title : '—',
                `${dateOf(s.startTime)}, ${timeOf(s.startTime)}`,
                s.hall ? s.hall.name : '—',
                `${s.price} ₽`,
            ];
            cells.forEach(text => {
                const td = document.createElement('td');
                td.textContent = text;
                row.appendChild(td);
            });

            const tdBuy = document.createElement('td');
            const link = document.createElement('a');
            link.href = '/tickets/add?sessionId=' + s.id;
            link.className = 'btn btn-sm';
            link.textContent = 'Купить билет';
            tdBuy.appendChild(link);
            row.appendChild(tdBuy);

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        output.appendChild(table);
    });
});
