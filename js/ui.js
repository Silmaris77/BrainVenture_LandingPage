
// --- Scroll to Top Logic ---
const scrollToTopBtn = document.getElementById('scroll-to-top');

// Funkcja sprawdzająca przewinięcie
function checkScroll() {
    let scrollPos = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;

    // Jesli struktura layoutu narzuca przewijanie na div, wyłap to
    if (scrollPos === 0) {
        const scrollers = document.querySelectorAll('*');
        for (let i = 0; i < scrollers.length; i++) {
            if (scrollers[i].scrollTop > 0) {
                scrollPos = scrollers[i].scrollTop;
                break;
            }
        }
    }

    if (scrollPos > 300) {
        scrollToTopBtn.classList.add('visible');
    } else {
        scrollToTopBtn.classList.remove('visible');
    }
}

window.addEventListener('scroll', checkScroll, true); // true łapie scroll event capturing phase

scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Wymuś przewinięcie wszystkich elementów zewnetrznych dla pewnosci
    document.querySelectorAll('*').forEach(el => {
        if (el.scrollTop > 0) el.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

// Pomiar wymiarów slotów obrazków
window.addEventListener('load', function () {
    function measure(placeholderId, sizeId) {
        var el = document.getElementById(placeholderId);
        if (!el) return;
        var r = el.getBoundingClientRect();
        document.getElementById(sizeId).textContent =
            Math.round(r.width) + 'px \u00d7 ' + Math.round(r.height) + 'px';
    }
    measure('img-placeholder-1', 'img1-size');
    measure('img-placeholder-2', 'img2-size');
    // Powtórz po chwili gdy layout się ustabilizuje
    setTimeout(function () {
        measure('img-placeholder-1', 'img1-size');
        measure('img-placeholder-2', 'img2-size');
    }, 500);
});


