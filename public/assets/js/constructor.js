document.addEventListener('DOMContentLoaded', () => {
    const movies = [
        { title: "100 лет тому вперед", time: "12:00", category: "ЗОЖ" },
        { title: "Брат", time: "12:15", category: "Балтика" },
        { title: "12 друзей Оушена", time: "12:45", category: "Разливное пиво" },
        { title: "Головоломка", time: "14:05", category: "ЗОЖ" },
        { title: "Каскадеры", time: "14:30", category: "Балтика" },
        { title: "Леон", time: "14:50", category: "Разливное пиво" },
        { title: "Серебряные коньки", time: "16:00", category: "ЗОЖ" },
        { title: "Трансформеры", time: "16:30", category: "Балтика" },
        { title: "Интерстеллар", time: "17:00", category: "Разливное пиво" },
        { title: "В поисках Дори", time: "18:00", category: "ЗОЖ" },
        { title: "Шерлок Холмс", time: "18:30", category: "Балтика" },
        { title: "Матрица", time: "19:00", category: "Разливное пиво" },
        { title: "Звездные войны", time: "19:30", category: "ЗОЖ" }
    ];

    const startTime = localStorage.getItem('start-time');
    const endTime = localStorage.getItem('end-time');
    const maxMovies = localStorage.getItem('max-movies');

    if (startTime) document.getElementById('start-time').value = startTime;
    if (endTime) document.getElementById('end-time').value = endTime;
    if (maxMovies) document.getElementById('max-movies').value = maxMovies;

    document.getElementById('schedule-form').addEventListener('submit', function (event) {
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

        const filteredMovies = movies
            .filter(movie => movie.time >= startTime && movie.time <= endTime)
            .slice(0, maxMovies);

        const output = document.getElementById('schedule-output');
        output.className = 'table-card mt-6';

        while (output.firstChild) {
            output.removeChild(output.firstChild);
        }

        if (filteredMovies.length > 0) {
            const paragraph = document.createElement('p');
            paragraph.style.padding = '16px 18px 0';
            paragraph.textContent = `Расписание с ${startTime} до ${endTime} на ${maxMovies} фильмов:`;
            output.appendChild(paragraph);

            const table = document.createElement('table');
            table.className = "";

            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');

            ["Фильм", "Время", "Зал"].forEach(text => {
                const th = document.createElement('th');
                th.className = "";
                th.textContent = text;
                headerRow.appendChild(th);
            });

            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody = document.createElement('tbody');

            filteredMovies.forEach((movie, index) => {
                const row = document.createElement('tr');
                row.className = '';

                [movie.title, movie.time, movie.category].forEach(text => {
                    const td = document.createElement('td');
                    td.className = "";
                    td.textContent = text;
                    row.appendChild(td);
                });

                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            output.appendChild(table);
        } else {
            const noMoviesParagraph = document.createElement('p');
            noMoviesParagraph.textContent = 'Нет фильмов, подходящих под заданные критерии.';
            noMoviesParagraph.style.padding = '16px 18px';
            output.appendChild(noMoviesParagraph);
        }
    });
});
