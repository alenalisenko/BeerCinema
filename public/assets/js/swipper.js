document.addEventListener('DOMContentLoaded', () => {
    new Swiper('.swiper-container', {
        slidesPerView: 1,
        spaceBetween: 20,
        slidesOffsetBefore: 40,
        slidesOffsetAfter: 40,
        breakpoints: {
            640: {
                slidesPerView: 2,
            },
            768: {
                slidesPerView: 3,
            },
            1024: {
                slidesPerView: 4,
            },
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
    });
});
