document.addEventListener("DOMContentLoaded", () => {
    const preloaderSelector = ".preloader";
    const commentListSelector = ".comment-list";

    async function loadComments(filmId) {
        const preloader = document.querySelector(`${preloaderSelector}[data-film-id="${filmId}"]`);
        const commentList = document.querySelector(`${commentListSelector}[data-film-id="${filmId}"]`);
        
        preloader.style.display = "block";

        try {
            const response = await fetch(`https://jsonplaceholder.typicode.com/comments?postId=${filmId}`);
            if (!response.ok) throw new Error("Ошибка загрузки данных");
            const comments = await response.json();

            while (commentList.firstChild) {
                commentList.removeChild(commentList.firstChild);
            }

            comments.forEach(comment => {
                const li = document.createElement("li");
                li.className = "border-b p-2";

                const strong = document.createElement("strong");
                strong.textContent = comment.name;

                const emailText = document.createTextNode(` (${comment.email}): `);

                const bodyText = document.createTextNode(comment.body);

                li.appendChild(strong);
                li.appendChild(emailText);
                li.appendChild(bodyText);

                commentList.appendChild(li);
            });
        } catch (error) {
            while (commentList.firstChild) {
                commentList.removeChild(commentList.firstChild);
            }

            const errorParagraph = document.createElement("p");
            errorParagraph.className = "text-red-500";
            errorParagraph.textContent = `⚠ Что-то пошло не так: ${error.message}`;
            commentList.appendChild(errorParagraph);
        } finally {
            preloader.style.display = "none";
        }
    }

    document.querySelectorAll(preloaderSelector).forEach(preloader => {
        const filmId = preloader.dataset.filmId;
        loadComments(filmId);
    });
});
