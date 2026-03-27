// --- Knowledge Pill Carousel ---
const knowledgePills = [
    { type: 'Neuro-Fakt', text: "Mózg dorosłego człowieka zawiera ok. 86 miliardów neuronów — każdy może tworzyć do 10 000 połączeń synaptycznych z innymi komórkami." },
    { type: 'Neuro-Fakt', text: "Mózg zużywa ok. 20% energii całego ciała, choć stanowi zaledwie 2% jego masy. Glukoza to jego jedyne paliwo — głodny mózg to gorszy mózg." },
    { type: 'Neuro-Fakt', text: "Nasz mózg jest nadal 'na sawannie'. Traktuje zagrożenia społeczne dokładnie tak samo jak zagrożenia fizyczne — uruchamia ten sam mechanizm reakcji stresowej." },
    { type: 'Neuro-Fakt', text: "Odrzucenie przez zespół, krytyka czy pominięcie w decyzjach aktywują ten sam obszar mózgu co ból fizyczny. Ból społeczny jest równie realny jak złamana kość." },
    { type: 'Neuro-Fakt', text: "Kortyzol (hormon stresu) wydzielany w sytuacjach zagrożenia społecznego hamuje kreatywność, obniża zdolność logicznego myślenia i utrudnia współpracę." },
    { type: 'Neuro-Fakt', text: "Nastrój lidera biologicznie 'zaraża' cały zespół. Układ limbiczny pracowników reaguje na emocje szefa automatycznie — nawet bez słów. To fizjologia, nie metafora." },
    { type: 'Neuro-Fakt', text: "Oksytocyna — hormon zaufania — wydziela się nie tylko przy dotyku, ale też przy autentycznym kontakcie wzrokowym i poczuciu bycia wysłuchanym. Zaufanie skraca czas i obniża koszty." },
    { type: 'Neuro-Fakt', text: "Serotonina reguluje aktywność całego mózgu, nastrój i sen. Jej poziom podnosi: światło słoneczne, aktywność fizyczna, 7–8h snu i... dobre relacje społeczne." },
    { type: 'Neuro-Fakt', text: "Dopamina nie nagradza za osiągnięcie celu — wydziela się na antycypację nagrody. Mózg kocha dążenie bardziej niż posiadanie. Stąd siła dobrze postawionych celów." },
    { type: 'Neuro-Fakt', text: "Daniel Kahneman udowodnił: porażkę odczuwamy dwukrotnie silniej niż radość z sukcesu. Mózg jest jak rzep na negatywne wydarzenia i jak teflon na pozytywne." },
    { type: 'Neuro-Fakt', text: "Nasze samopoczucie zaczyna być dobre, jeśli liczba pozytywnych zdarzeń co najmniej 3-krotnie przekracza liczbę negatywnych. Menedżer ma realny wpływ na ten bilans." },
    { type: 'Neuro-Fakt', text: "Model SCARF® Davida Rocka ma potwierdzenie w fMRI: zagrożenia Statusu, Pewności, Autonomii, Relacji i Sprawiedliwości aktywują ciało migdałowate tak samo jak zagrożenie fizyczne." },
    { type: 'Neuro-Fakt', text: "Status: poczucie posiadania wysokiego statusu może być dla mózgu większą nagrodą niż pieniądz. Jedno niepotrzebne pouczenie lub pominięcie uruchamia reakcję obronną." },
    { type: 'Neuro-Fakt', text: "Pewność: gdy nie wiemy, co nas czeka, kora przedczołowa pracuje w nadgodzinach — zamiast rozwiązywać problemy, skanuje otoczenie w poszukiwaniu zagrożeń." },
    { type: 'Neuro-Fakt', text: "Autonomia to aktywizator motywacji wewnętrznej. Im więcej kontroli nad własnym działaniem, tym mniejszy stres i silniejsze zaangażowanie — bez żadnej marchewki z zewnątrz." },
    { type: 'Neuro-Fakt', text: "Brak poczucia przynależności do zespołu wywołuje fizjologiczną odpowiedź na zagrożenie: spada motywacja, kreatywność i jakość współpracy. Integracja to nie 'miękki temat'." },
    { type: 'Neuro-Fakt', text: "Niesprawiedliwość aktywuje silne emocje negatywne, które utrzymują się bardzo długo. Ludzie nie nawiązują bliskich relacji z kimś, kogo uważają za nieuczciwego — nawet jeśli ta osoba cierpi." },
    { type: 'Neuro-Fakt', text: "Kora przedczołowa — centrum planowania, decyzji i regulacji emocji — jest niezwykle wrażliwa na stres. Zdenerwowany szef potrafi zablokować myślenie całego zespołu samą swoją obecnością." },
    { type: 'Neuro-Fakt', text: "Nie jesteśmy obiektywni. Mózg aktywnie filtruje rzeczywistość przez pryzmat przekonań i emocji. Jonathan Haidt: 'Rozum to mały jeździec na wielkim słoniu emocji.'" },
    { type: 'Neuro-Fakt', text: "Endorfiny wydzielają się nie tylko podczas wysiłku fizycznego, ale też przy śmiechu, pomaganiu innym i... gdy duży stres mija. Bezpieczeństwo psychologiczne sprzyja ich produkcji." },
    { type: 'Neuro-Fakt', text: "Neuroplastyczność — zdolność mózgu do tworzenia nowych połączeń — trwa przez całe życie. Każde nowe doświadczenie dosłownie przebudowuje jego strukturę. Zmiana jest biologicznie możliwa." },
    { type: 'Neuro-Fakt', text: "Sen to nie odpoczynek mózgu — to czas aktywnego usuwania toksyn (system glimfatyczny), konsolidacji pamięci i integracji emocji. Niedobór snu obniża jakość decyzji menedżerskich dramatycznie." }
];

const PILL_DURATION = 15000;
let pillActiveIdx = 1;
let pillDirection = 1;
let pillPaused = false;
let pillPausedAt = 0;       // ms elapsed when paused
let pillStartedAt = 0;      // timestamp when fill started
let pillTimer = null;
const pillTrack = document.getElementById('pill-track');
let pillFill = null;

function buildPillCards() {
    if (!pillTrack) return;
    knowledgePills.forEach((p, i) => {
        const div = document.createElement('div');
        div.className = 'pill-card-item' + (i === pillActiveIdx ? ' pill-active' : '');
        div.innerHTML = `<span class="pill-card-type">${p.type}</span><p class="pill-card-text">${p.text}</p><div class="pill-progress-strip"><div class="pill-progress-fill"></div></div>`;
        // Click on non-active card → navigate to it
        div.addEventListener('click', () => {
            const idx = Array.from(pillTrack.children).indexOf(div);
            if (idx !== pillActiveIdx) {
                pillActiveIdx = idx;
                const min = 1, max = knowledgePills.length - 2;
                if (pillActiveIdx < min) pillActiveIdx = min;
                if (pillActiveIdx > max) pillActiveIdx = max;
                positionTrack(true);
                updatePillClasses();
                resetPillTimer();
                attachHoverToActive();
            }
        });
        pillTrack.appendChild(div);
    });
}

function calcAndSetCardWidth() {
    const wrapper = pillTrack.parentElement;
    const gap = 20;
    const cardW = Math.floor((wrapper.offsetWidth - 2 * gap) / 3);
    pillTrack.querySelectorAll('.pill-card-item').forEach(el => { el.style.flexBasis = cardW + 'px'; });
    return cardW;
}

function positionTrack(animated) {
    const gap = 20;
    const cardW = calcAndSetCardWidth();
    const offset = pillActiveIdx * (cardW + gap) - (cardW + gap);
    pillTrack.style.transition = animated ? 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)' : 'none';
    pillTrack.style.transform = `translateX(-${Math.max(0, offset)}px)`;
}

function updatePillClasses() {
    pillTrack.querySelectorAll('.pill-card-item').forEach((el, i) => {
        el.classList.toggle('pill-active', i === pillActiveIdx);
    });
}

function startPillFill(remaining) {
    pillFill = pillTrack.querySelector('.pill-card-item.pill-active .pill-progress-fill');
    if (!pillFill) return;
    const startWidth = ((PILL_DURATION - remaining) / PILL_DURATION) * 100;
    pillFill.style.transition = 'none';
    pillFill.style.width = startWidth + '%';
    pillStartedAt = performance.now() - (PILL_DURATION - remaining);
    requestAnimationFrame(() => requestAnimationFrame(() => {
        pillFill.style.transition = `width ${remaining}ms linear`;
        pillFill.style.width = '100%';
    }));
}

function pausePillFill() {
    if (!pillFill) return;
    const elapsed = performance.now() - pillStartedAt;
    pillPausedAt = Math.min(elapsed, PILL_DURATION);
    const pct = (pillPausedAt / PILL_DURATION) * 100;
    pillFill.style.transition = 'none';
    pillFill.style.width = pct + '%';
}

function resumePillFill() {
    const remaining = PILL_DURATION - pillPausedAt;
    startPillFill(remaining);
    // Reset timer to fire after remaining time
    clearTimeout(pillTimer);
    pillTimer = setTimeout(advancePill, remaining);
}

function resetPillTimer() {
    clearTimeout(pillTimer);
    pillPaused = false;
    pillPausedAt = 0;
    startPillFill(PILL_DURATION);
    pillTimer = setTimeout(advancePill, PILL_DURATION);
}

function advancePill() {
    const min = 1, max = knowledgePills.length - 2;
    pillActiveIdx += pillDirection;
    if (pillActiveIdx >= max) { pillActiveIdx = max; pillDirection = -1; }
    else if (pillActiveIdx <= min) { pillActiveIdx = min; pillDirection = 1; }
    positionTrack(true);
    updatePillClasses();
    resetPillTimer();
    attachHoverToActive();
}

function onPillEnter() {
    if (!pillPaused) {
        pillPaused = true;
        clearTimeout(pillTimer);
        pausePillFill();
    }
}
function onPillLeave() {
    if (pillPaused) {
        pillPaused = false;
        resumePillFill();
    }
}

function attachHoverToActive() {
    pillTrack.querySelectorAll('.pill-card-item').forEach(el => {
        el.removeEventListener('mouseenter', onPillEnter);
        el.removeEventListener('mouseleave', onPillLeave);
    });
    const active = pillTrack.querySelector('.pill-card-item.pill-active');
    if (active) {
        active.addEventListener('mouseenter', onPillEnter);
        active.addEventListener('mouseleave', onPillLeave);
    }
}

buildPillCards();
if (pillTrack) {
positionTrack(false);
resetPillTimer();
attachHoverToActive();
window.addEventListener('resize', () => positionTrack(false));
}

function openModuleModal(card) {
    const iconEl = card.querySelector('.card-icon');
    const title = card.querySelector('.card-title').textContent.trim();
    const desc = card.querySelector('.card-text').textContent.trim();
    const detailsHTML = card.querySelector('.card-details').innerHTML;

    document.getElementById('modal-icon').innerHTML = iconEl.innerHTML;
    // copy icon color if set
    const iconStyle = iconEl.getAttribute('style') || '';
    document.getElementById('modal-icon').setAttribute('style', 'margin-bottom:0; font-size:2.4rem; ' + iconStyle);
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-desc').textContent = desc;
    document.getElementById('modal-details').innerHTML = detailsHTML;

    // Module-specific background
    const panel = document.querySelector('.module-modal-panel');
    const bgMap = {
        'Poznanie':           'Images/eye_cognition.png',
        'Emocje':             'Images/Emocje.png',
        'Decyzje':            'Images/Decyzje.png',
        'Komunikacja':        'Images/Komunikacja.png',
        'Wellbeing':          'Images/Wellbeing.png',
        'Przywództwo XXI w.': 'Images/Przyw%C3%B3dztwoXXw.png'
    };
    const bgImg = bgMap[title];
    if (bgImg) {
        const posMap = { 'Decyzje': 'center 75%', 'Komunikacja': 'center 75%' };
        const bgPos = posMap[title] || 'center';
        panel.style.background = 'linear-gradient(135deg, rgba(14,42,71,0.85), rgba(14,42,71,0.9)), url("' + bgImg + '") ' + bgPos + '/cover no-repeat';
    } else {
        panel.style.background = 'rgba(14, 42, 71, 0.97)';
    }

    const modal = document.getElementById('module-modal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => modal.classList.add('active'));
}

function closeModuleModal() {
    const modal = document.getElementById('module-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => { modal.style.display = 'none'; }, 310);
}

function toggleCard(card) {
    openModuleModal(card);
}
