(function () {
    const btn = document.getElementById('music-toggle');
    const audio = document.getElementById('bg-music');
    const slider = document.getElementById('volume-slider');
    audio.volume = 0.35;

    slider.addEventListener('input', () => {
        audio.volume = slider.value / 100;
    });

    function setPlaying() {
        btn.classList.add('playing');
        btn.querySelector('i').className = 'fa fa-volume-up';
        btn.title = 'Wyłącz muzykę';
    }
    function setStopped() {
        btn.classList.remove('playing');
        btn.querySelector('i').className = 'fa fa-volume-off';
        btn.title = 'Włącz muzykę';
    }

    btn.addEventListener('click', () => {
        if (audio.paused) {
            audio.play().then(setPlaying);
        } else {
            audio.pause();
            setStopped();
        }
    });

    // Try autoplay immediately
    audio.play().then(setPlaying).catch(() => {
        const startOnInteraction = () => {
            audio.play().then(() => {
                setPlaying();
                document.removeEventListener('click', startOnInteraction);
                document.removeEventListener('touchstart', startOnInteraction);
                document.removeEventListener('keydown', startOnInteraction);
            }).catch(() => {});
        };
        document.addEventListener('click', startOnInteraction);
        document.addEventListener('touchstart', startOnInteraction);
        document.addEventListener('keydown', startOnInteraction);
    });
})();
