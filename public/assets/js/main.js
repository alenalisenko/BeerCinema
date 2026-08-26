// main.js

(function() {
    window.addEventListener('load', function() {
        let loadTime = 0;

        if (performance.getEntriesByType) {
            const [entry] = performance.getEntriesByType('navigation');

            if (entry && entry.loadEventEnd && entry.navigationStart) {
                loadTime = entry.loadEventEnd - entry.navigationStart;
            }
        }

        if (loadTime === 0) {
            loadTime = performance.now();
        }

        const footer = document.querySelector('footer');
        if (footer) {
            const loadTimeElement = document.createElement('p');
            loadTimeElement.textContent = `Страница загрузилась за ${(loadTime / 1000).toFixed(2)} секунд`;
            footer.appendChild(loadTimeElement);
        }
    });
})();

document.addEventListener("DOMContentLoaded", () => {
    const menuLinks = document.querySelectorAll(".menu-link");
    const currentPath = window.location.pathname;

    menuLinks.forEach((link) => {
        const href = link.getAttribute("href");
        const isActive = href === "/"
            ? currentPath === "/"
            : currentPath === href || currentPath.startsWith(href + "/");
        if (isActive) {
            link.classList.add("active");
        }
    });
});
