// --- Radar chart auto-center plugin ---
const radarCenterPlugin = {
    id: 'radarCenter',
    afterLayout: function(chart) {
        const r = chart.scales.r;
        if (!r || chart._radarCenteredFlag) return;
        const diff = r.xCenter - chart.width / 2;
        if (Math.abs(diff) < 1) return;
        chart._radarCenteredFlag = true;
        const p = chart.options.layout.padding || {};
        if (diff > 0) {
            p.right = (p.right || 0) + Math.round(diff * 2);
        } else {
            p.left = (p.left || 0) + Math.round(-diff * 2);
        }
        chart.options.layout.padding = p;
        chart.update('none');
    }
};

// --- SCARF Simulator Logic ---
let scarfValues = { Status: 30, Certainty: 30, Autonomy: 30, Relatedness: 30, Fairness: 30 };
let boardConfidence = 50;
let impactMultiplier = 1;

const difficultySettings = {
    junior: { start: 60, multi: 0.8 },
    manager: { start: 40, multi: 1.0 },
    director: { start: 25, multi: 1.4 }
};

const scenariosDatabase = {
    junior: [
        {
            icon: "fa-user-plus",
            title: "Nowy w Zespole",
            desc: "Adam dołącza do zespołu. Jak go wprowadzisz do pracy pierwszego dnia?",
            choices: [
                { text: "„Oto Twoje biurko i dokumentacja. Czytaj, w razie pytań jestem obok.\"", impact: { Relatedness: -25, Status: -15, Board: +5 }, feedback: "Adam czuje się jak osamotniony. Brak relacji na starcie buduje izolację i lęk społeczny." },
                { text: "Przedstawiasz go krótko: „To Adam. Pokażcie mu co i jak, ja pędzę na spotkanie.\"", impact: { Relatedness: -10, Status: -10, Board: +10 }, feedback: "Mało angażujące. Oszczędzasz swój czas (Board+), ale Adam traci Status 'eksperta' na starcie." },
                { text: "Robisz wielkie powitanie: „Adam to najlepszy spec w branży!\". Zabierasz zespół na 3h integrację.", impact: { Relatedness: +30, Status: +25, Board: -30 }, feedback: "Świetne dla relacji, ale Zarząd widzi 3h bezczynności całego zespołu jako stratę kosztową." },
                { text: "Wprowadzasz go sam: „Witamy! Cenię Twoje doświadczenie. Oto plan wdrożenia na dziś.\"", impact: { Status: +25, Relatedness: +25, Certainty: +20, Board: -5 }, feedback: "Profesjonalny balans. Budujesz Pewność i Status, poświęcając chwilę swojego czasu." }
            ]
        },
        {
            icon: "fa-clock-o",
            title: "Spóźnienie na odprawę poranną",
            desc: "Anna spóźniła się na spotkanie trzeci raz w tym tygodniu. Wszyscy na nią czekali.",
            choices: [
                { text: "Upominasz ją ostro przy wszystkich: „Ania, nie będę tego tolerować. Albo punktualność, albo szukaj innej pracy.\"", impact: { Status: -30, Relatedness: -25, Board: +15 }, feedback: "Publiczny atak na Status paraliżuje mózg Ani. Zarząd widzi 'silną rękę', ale wydajność Ani spadnie." },
                { text: "Ignorujesz ten fakt, nie chcąc psuć atmosfery spotkania.", impact: { Fairness: -25, Certainty: -15, Board: -10 }, feedback: "Brak reakcji niszczy Sprawiedliwość. Board widzi brak kontroli nad procesem." },
                { text: "Przenosisz odprawę poranną na późniejszą godzinę, by wszyscy mogli zdążyć.", impact: { Relatedness: +15, Autonomy: +20, Board: -30 }, feedback: "Miły gest, ale rozbijasz rytm korporacyjny i ulegasz jednostce kosztem efektywności ogółu." },
                { text: "Rozmawiasz z Anną po spotkaniu: „Cenię Twój wkład, ale te spóźnienia uderzają w zespół. Jak to rozwiążemy?\"", impact: { Relatedness: +25, Status: +15, Board: 0 }, feedback: "Chronisz Status i szukasz rozwiązania (Autonomia). Modelowy coaching liderski." }
            ]
        },
        {
            icon: "fa-magic",
            title: "Pomysł na usprawnienie",
            desc: "Pracownik proponuje zmianę w procedurze, którą Ty wymyśliłeś.",
            choices: [
                { text: "„To działa od lat. Nie kombinuj, tylko rób swoje.\"", impact: { Autonomy: -30, Status: -25, Board: +5 }, feedback: "Zabijasz kreatywność. Status pracownika w dół. Zarząd widzi 'trzymanie się standardów'." },
                { text: "„Dzięki, wyślij mi to mailem, przejrzę w wolnej chwili (czyli nigdy).\"", impact: { Status: -10, Relatedness: -10, Board: 0 }, feedback: "Ignorancja ubrana w uprzejmość. Pracownik czuje brak sprawstwa (Autonomia)." },
                { text: "„Odrzućmy moje procedury! Od jutra wdrażamy Twój pomysł w całym pionie.\"", impact: { Autonomy: +30, Status: +25, Certainty: -25, Board: -30 }, feedback: "Genialne dla ego pracownika, ale ryzykujesz chaos i błędy operacyjne (Board reaguje paniką)." },
                { text: "„Ciekawy kierunek! Przetestuj to na małym wycinku i pokaż dane za tydzień.\"", impact: { Autonomy: +25, Status: +20, Certainty: +10, Board: +10 }, feedback: "Bezpieczne innowacje (Autonomia + Status). Dane uspokajają Zarząd." }
            ]
        },
        {
            icon: "fa-heart",
            title: "Dzień Gorszej Formy",
            desc: "Widzisz, że Twój najlepszy pracownik jest dziś kompletnie rozbity.",
            choices: [
                { text: "„Emocje zostaw w domu. Tu jest praca, dowoź albo wyjdź.\"", impact: { Relatedness: -30, Status: -30, Board: +10 }, feedback: "Brutalny brak empatii. Board widzi orientację na wynik, ale lojalność pracownika umiera." },
                { text: "Zalecasz mu kawę: „Wypij espresso, zaraz Ci przejdzie.\"", impact: { Relatedness: -15, Status: -10, Board: 0 }, feedback: "Trywializowanie problemu. Pracownik czuje się niezrozumiany (Relacje)." },
                { text: "„Idź do domu, odpocznij 2 dni. Ja w tym czasie dokończę Twój raport.\"", impact: { Relatedness: +30, Board: -30, Status: +15 }, feedback: "Heroiczna empatia, ale dyrektor widzi spadek Twojej produktywności przez robienie cudzej pracy." },
                { text: "„Widzę, że masz trudny dzień. Dokończ kluczowe X i weź wolne popołudnie.\"", impact: { Relatedness: +25, Autonomy: +15, Board: -5 }, feedback: "Wsparcie z zachowaniem granic biznesowych. Buduje głębokie Relacje." }
            ]
        },
        {
            icon: "fa-commenting",
            title: "Pochwała",
            desc: "Marek wykonał zadanie powyżej Twoich oczekiwań. Jak go doceniasz?",
            choices: [
                { text: "Nie chwalisz: „Od tego jest, za to mu płacimy.\"", impact: { Status: -25, Relatedness: -15, Board: +15 }, feedback: "Brak paliwa dopaminowego. Board widzi niskie koszty, ale zaangażowanie Marka spadnie." },
                { text: "Wysyłasz e-mail: „Dobra robota. W załączniku kolejny projekt.\"", impact: { Status: +10, Certainty: +10, Board: 0 }, feedback: "Machinalne klepnięcie po plecach. Mały zysk dla Statusu." },
                { text: "Obiecujesz mu na forum zespołu awans i 30% podwyżki.", impact: { Status: +30, Fairness: -25, Board: -30 }, feedback: "Ekstaza Marka, ale Zarząd jest wściekły (brak budżetu), a reszta zespołu czuje niesprawiedliwość." },
                { text: "Chwalisz na forum za konkretne cechy: „To świetny wzór rzetelności!\"", impact: { Status: +25, Relatedness: +20, Board: +5 }, feedback: "Potężny zastrzyk Statusu bez kosztów finansowych. Buduje kulturę doceniania." }
            ]
        },
        {
            icon: "fa-coffee",
            title: "Integracja przy kawie",
            desc: "W zespole panuje sztywna atmosfera. Chcesz ją rozluźnić.",
            choices: [
                { text: "„Od dziś kawa o 9:00 jest obowiązkowa. Będę sprawdzał listę obecności.\"", impact: { Autonomy: -30, Relatedness: -15, Board: +15 }, feedback: "Zarządzanie relacjami przez przymus to neuro-paradoks. Zabijasz Autonomię." },
                { text: "Kupujesz drogi ekspres do kawy z budżetu operacyjnego.", impact: { Relatedness: +10, Fairness: -15, Board: -25 }, feedback: "Przekupstwo technologiczne. Board widzi zbędny wydatek bez konsultacji." },
                { text: "„Robimy codziennie o 14:00'Happy Hour'. Praca stop, gramy w planszówki!\"", impact: { Relatedness: +30, Autonomy: +15, Board: -30 }, feedback: "Zespół Cię uwielbia, ale wydajność pionu spada. Zarząd traci cierpliwość." },
                { text: "Zaczynasz od siebie: „Idę na kawę, jeśli ktoś chce dołączyć i pogadać – zapraszam.\"", impact: { Relatedness: +25, Autonomy: +20, Board: 0 }, feedback: "Dobrowolność (Autonomia) to klucz do autentycznych relacji." }
            ]
        },
        {
            icon: "fa-search",
            title: "Drobna pomyłka",
            desc: "Zauważyłeś literówkę w raporcie, który pracownik wysłał do Zarządu (CC do Ciebie).",
            choices: [
                { text: "Robisz 'Reply All': „Marian, znowu błąd! Naucz się wreszcie pisać po polsku.\"", impact: { Status: -30, Relatedness: -25, Board: -15 }, feedback: "Publiczny lincz. Niszczysz Status Mariana i wizerunek profesjonalizmu zespołu przed Boardem." },
                { text: "Nic nie mówisz, niech Marian sam się tłumaczy przed Zarządem.", impact: { Relatedness: -20, Certainty: -15, Board: -25 }, feedback: "Brak wsparcia (Relacje). Zarząd widzi brak Twojej kontroli nad jakością dokumentów." },
                { text: "Blokujesz wysyłkę i przepisujesz sam cały raport.", impact: { Relatedness: +25, Status: +10, Board: -30 }, feedback: "Marian wdzięczny, ale Ty jesteś wypalony i nie pełnisz roli lidera, tylko korektora." },
                { text: "„Świetny raport! Popraw proszę literówkę na str. 3 i puść wersję v2. Cenię Twoją rzetelność.\"", impact: { Status: +20, Relatedness: +20, Certainty: +15, Board: +5 }, feedback: "Feedback chroni Status i zapewnia Pewność (v2). Zarząd widzi szybką korektę." }
            ]
        },
        {
            icon: "fa-graduation-cap",
            title: "Dzielenie się wiedzą",
            desc: "Marta wróciła ze szkolenia. Chcesz, by nauczyła czegoś resztę.",
            choices: [
                { text: "„Marta jutro o 8:00 robi 2-godzinny wykład. Obecność obowiązkowa, notatki sprawdzę.\"", impact: { Autonomy: -30, Relatedness: -15, Board: +10 }, feedback: "Dyktatura szkoleniowa. Marta czuje stres (Status zagrożony), zespół czuje przymus." },
                { text: "Wysyłasz slajdy Marty do wszystkich: „Kto chce, niech poczyta.\"", impact: { Relatedness: -10, Status: -10, Board: 0 }, feedback: "Zmarnowana szansa. Marta czuje, że jej wysiłek jest mało ważny." },
                { text: "Wynajmujesz dla Marty salę z cateringiem za 5000zł. Niech zrobi prezentację.", impact: { Status: +30, Relatedness: +25, Board: -30 }, feedback: "Kasia czuje się jak gwiazda, ale Board uważa to za skrajną niegospodarność." },
                { text: "„Marta, jesteś naszym ekspertem od X. Jak chciałabyś to przekazać innym, by było dla nich użyteczne?\"", impact: { Status: +25, Autonomy: +25, Board: +5 }, feedback: "Status eksperta + Autonomia. Najsilniejszy motywator wewnętrzny." }
            ]
        },
        {
            icon: "fa-stethoscope",
            title: "Trudności osobiste",
            desc: "Pracownik delikatnie wspomina o problemach w domu.",
            choices: [
                { text: "„To Twoja sprawa. Jak nie dowieziesz targetu, to będziemy oboje mieli problemy.\"", impact: { Relatedness: -30, Status: -20, Board: +10 }, feedback: "Neuro-zdrada. Odcięcie emocjonalne zabija zaufanie. Zarząd widzi 'skupienie na KPI'." },
                { text: "Odsyłasz go do HR: „Oni się tym zajmują, ja nie mam czasu.\"", impact: { Relatedness: -15, Status: -10, Board: 0 }, feedback: "Spychologia. Bezpieczne proceduralnie, ale chłodne ludzko." },
                { text: "„Przestań pracować! Idź do domu na tydzień płatnego urlopu, ja to załatwię z kadrą.\"", impact: { Relatedness: +30, Autonomy: +20, Board: -30 }, feedback: "Ogromna lojalność pracownika, ale skrajne naruszenie procedur korporacyjnych (koszty)." },
                { text: "„Dzięki, że ufasz mi na tyle, by to powiedzieć. Jeśli potrzebujesz elastyczności dziś, daj znać.\"", impact: { Relatedness: +25, Autonomy: +20, Board: -5 }, feedback: "Bezpieczna przystań (Relacje). Budujesz kapitał społeczny bez palenia mostów z HR." }
            ]
        },
        {
            icon: "fa-check-square-o",
            title: "Pierwsze Delegowanie",
            desc: "Powinieneś oddać odpowiedzialność za mały proces. Komu?",
            choices: [
                { text: "Decydujesz się na pracę po godzinach: „Zrobię to lepiej i nikt nie schrzani roboty.\"", impact: { Autonomy: -25, Status: -15, Board: +15 }, feedback: "Zespół czuje brak zaufania. Board widzi wynik, ale Ty jesteś wąskim gardłem." },
                { text: "Najlepszemu specjaliście, mimo jego przeładowania: „Wiem, że masz dużo pracy, ale tylko Ty dajesz 100% pewności.\"", impact: { Fairness: -20, Certainty: +25, Board: +5 }, feedback: "Bezpieczne, ale niszczy Sprawiedliwość i grozi wypaleniem 'gwiazdy'." },
                { text: "Robisz losowanie: „Niech los zdecyduje, kto się dziś wykaże.\"", impact: { Certainty: -30, Fairness: +10, Board: -25 }, feedback: "Chaos. Zarząd uważa to za skrajny nieprofesjonalizm lidera." },
                { text: "Wybiersz juniora: „To Twoja szansa. Wyznaczam ramy, ale Ty decydujesz o metodzie.\"", impact: { Status: +25, Autonomy: +30, Certainty: -15, Board: 0 }, feedback: "Inwestycja w rozwój (Status + Autonomia). Wymaga Twojego monitoringu (Pewność)." }
            ]
        }
    ],
    manager: [
        {
            icon: "fa-bolt",
            title: "Nagły zwrot akcji",
            desc: "Zarząd wymusza zmianę priorytetów w środku projektu. Jak to przekażesz zespołowi?",
            choices: [
                { text: "„Mamy rozkaz z góry, robimy Y zamiast X. Kto nie chce, drzwi są otwarte.\"", impact: { Autonomy: -30, Relatedness: -30, Board: +30 }, feedback: "Totalna utrata Autonomii. Board widzi dyscyplinę, zespół widzi tyranię (Amigdala on)." },
                { text: "„Słuchajcie, kolejna bzdura z góry, ale musimy to dowieźć. Olejmy jakość, byle było.\"", impact: { Status: -25, Relatedness: +15, Board: -30 }, feedback: "Solidarność w nieszczęściu. Tracisz autorytet i profesjonalizm w oczach firmy." },
                { text: "Przeciwstawiasz się Zarządowi: „Moi ludzie są zmęczeni, nie zrobimy tego.\"", impact: { Relatedness: +30, Autonomy: +25, Board: -30 }, feedback: "Bohater zespołu, ale w oczach firmy jesteś hamulcowym strategii (Ryzykujesz problemy)." },
                { text: "„Zarząd widzi w Y szansę na przetrwanie. Jak mądrze przesuniemy zasoby, by ocalić projekt X?\"", impact: { Status: +25, Certainty: +20, Autonomy: +20, Board: +25 }, feedback: "Nadanie sensu. Wyjaśniasz 'Dlaczego' i dajesz wpływ na 'Jak' (Autonomia)." }
            ]
        },
        {
            icon: "fa-handshake-o",
            title: "Konflikt o Zasoby",
            desc: "Dwa zespoły kłócą się o dostęp do kluczowego serwera.",
            choices: [
                { text: "„Zespół A ma priorytet. Zespół B – przestańcie marudzić i czekajcie na swoją kolej.\"", impact: { Fairness: -30, Relatedness: -20, Board: 0 }, feedback: "Faworyzowanie niszczy Sprawiedliwość. Zespół B czuje się gorszy (Status)." },
                { text: "Blokujesz serwer, dopóki sami nie przyniosą podpisanego porozumienia.", impact: { Autonomy: -25, Certainty: -30, Board: -30 }, feedback: "Abdykacja lidera. Paraliżujesz pracę (Board-) i budujesz atmosferę wrogości." },
                { text: "„Kupuję drugi serwer ekspresowo, by każdy był zadowolony!\"", impact: { Relatedness: +20, Fairness: +25, Board: -30 }, feedback: "Gaszenie pożaru pieniędzmi. Zespół się cieszy, ale Board nie toleruje takich wydatków." },
                { text: "„Usiądźmy razem. Stwórzcie grafik, który zminimalizuje bloker dla obu stron.\"", impact: { Fairness: +25, Autonomy: +25, Relatedness: +20, Board: +10 }, feedback: "Facylitacja. Budujesz Sprawiedliwość i Relacje przez współodpowiedzialność." }
            ]
        },
        {
            icon: "fa-line-chart",
            title: "Pracownik-Gwiazda",
            desc: "Twój najlepszy ekspert dowozi wyniki, ale jest arogancki wobec juniorów.",
            choices: [
                { text: "„Nic nie zrobimy, dowozi miliony. Marian, nie bądź taki wrażliwy.\"", impact: { Fairness: -30, Relatedness: -30, Board: +25 }, feedback: "Przyzwolenie na toksyczność. Board widzi cyfry, juniorzy szukają nowej pracy." },
                { text: "Wycinasz Gwieździe wszystkie benefity: „Może to Cię nauczy pokory.\"", impact: { Status: -30, Board: -20, Relatedness: +10 }, feedback: "Agresja lidera. Gwiazda czuje atak na Status i prawdopodobnie odejdzie do konkurencji." },
                { text: "Zwalniasz Gwiazdę: „Dla mnie liczy się tylko zespół, nie cyfry.\"", impact: { Relatedness: +30, Board: -30, Certainty: -25 }, feedback: "Zespół odetchnął, ale firma jest w kryzysie finansowym bez tych wyników." },
                { text: "„Cenię Twój geniusz (Status), ale styl pracy X blokuje zespół. Pomóż mi ich wyciągnąć, to Twój nowy KPI.\"", impact: { Status: +25, Relatedness: +25, Autonomy: +15, Board: +15 }, feedback: "Przekucie arogancji w mentorską misję. Budujesz Status Mariana w nowy sposób." }
            ]
        },
        {
            icon: "fa-money",
            title: "Podwyżki",
            desc: "Masz budżet na 10% podwyżki. Zespół oczekuje 20%.",
            choices: [
                { text: "„Zarząd to skąpcy, dali tylko 10%. Przykro mi.\"", impact: { Relatedness: +20, Status: -25, Board: -30 }, feedback: "Chowanie się za Zarząd. Solidarność z zespołem, ale totalna utrata autorytetu." },
                { text: "Dajesz 20% tylko głośnym, reszcie mówisz, że nie ma budżetu.", impact: { Fairness: -30, Relatedness: -30, Board: -25 }, feedback: "Kłamstwo i brak Sprawiedliwości. Gdy to wyjdzie, zespół pęknie." },
                { text: "„Damy każdemu 15%! Jakoś to potem wytłumaczę w księgowości (nadzieja).\"", impact: { Status: +20, Relatedness: +25, Board: -30 }, feedback: "Miły gest, ale deficyt budżetowy to dla Zarządu sygnał Twojej niekompetencji." },
                { text: "„Mamy 10%. Wywalczyłem za to budżet na certyfikaty i +2 dni wolne. Co o tym sądzicie?\"", impact: { Fairness: +25, Status: +20, Certainty: +20, Board: +15 }, feedback: "Transparentność i alternatywy. Budujesz Sprawiedliwość bez bankructwa pionu." }
            ]
        },
        {
            icon: "fa-cogs",
            title: "Wdrażanie Procedury",
            desc: "Musisz wprowadzić uciążliwy system raportowania czasu pracy.",
            choices: [
                { text: "„To wymóg audytu. Proszę o wypełnianie co piątek bez dyskusji.\"", impact: { Autonomy: -30, Certainty: +15, Board: +20 }, feedback: "Przymus zabija Autonomię. Board widzi kontrolę, zespół czuje się inwigilowany." },
                { text: "„Wypełniajcie byle co, byle się zgadzało w Excelu.\"", impact: { Certainty: -30, Status: -20, Board: -25 }, feedback: "Kultura pozorów. Niszczysz wartość danych (Board-) i autorytet procedur." },
                { text: "„Zatrudnię asystenta, który będzie to robił za Was wszystkich.\"", impact: { Autonomy: +15, Relatedness: +15, Board: -30 }, feedback: "Chronisz czas zespołu, ale Board widzi zbędny wzrost kosztów osobowych." },
                { text: "„System pomoże nam odsunąć od Was nadmiarowe projekty. Zróbmy test na miesiąc.\"", impact: { Certainty: +20, Autonomy: +15, Status: +10, Board: +10 }, feedback: "Nadanie sensu procedurze. Tłumaczysz korzyść dla pracownika (Fairness)." }
            ]
        },
        {
            icon: "fa-users",
            title: "Feedback 360",
            desc: "Zespół ocenił Twój styl zarządzania jako zbyt dominujący.",
            choices: [
                { text: "Ignorujesz to: „Szef musi być twardy. Jak komuś nie pasuje, HR zaprasza.\"", impact: { Status: -30, Relatedness: -30, Board: +10 }, feedback: "Brak adaptacji. Board widzi 'silnego lidera', ale atmosfera w zespole gnije." },
                { text: "„Kto to napisał?! Chcę widzieć tych odważnych w moim gabinecie jutro!\"", impact: { Certainty: -30, Relatedness: -30, Board: -20 }, feedback: "Polowanie na czarownice. Totalne zniszczenie bezpieczeństwa psychologicznego." },
                { text: "„Przepraszam. Od dziś każdą decyzję podejmujemy przez głosowanie większościowe.\"", impact: { Autonomy: +30, Status: -25, Board: -30 }, feedback: "Abdykacja lidera w stronę anarchii. Zespół ma władzę, ale firma traci decyzyjność." },
                { text: "„Słyszę Was. Od dziś każdą decyzję o pracy zdalnej zostawiam Waszym zespołom.\"", impact: { Autonomy: +30, Relatedness: +25, Status: +15, Board: -10 }, feedback: "Oddanie realnej władzy tam, gdzie to możliwe bez paraliżu firmy." }
            ]
        },
        {
            icon: "fa-battery-quarter",
            title: "Niskie Zaangażowanie",
            desc: "Widzisz 'quiet quitting' u kluczowych pracowników.",
            choices: [
                { text: "Dorzucasz im nowe, trudne zadania i krótkie terminy, by ich 'rozruszać'.", impact: { Autonomy: -30, Status: -20, Board: +15 }, feedback: "Dokładanie kamieni do tonącego statku. Przyspieszasz odejście ludzi." },
                { text: "Ignorusze, póki dowożą minimum. Trzymamy status quo.", impact: { Relatedness: -20, Fairness: -15, Board: 0 }, feedback: "Pozwalasz na powolny rozkład kultury pracy. Nierealizowanie potencjału." },
                { text: "Proponujesz im nielimitowane płatne urlopy, byle tylko zostali.", impact: { Relatedness: +30, Board: -30, Fairness: -25 }, feedback: "Desperacja. Niszczysz budżet i Sprawiedliwość wobec reszty zespołu." },
                { text: "„Czego potrzebujesz, by znów czuć flow? Pogadajmy o zmianie Twojej roli.\"", impact: { Autonomy: +25, Status: +25, Relatedness: +20, Board: -10 }, feedback: "Indywidualne podejście. Budujesz Status i Autonomię przez dopasowanie roli." }
            ]
        },
        {
            icon: "fa-rocket",
            title: "Delegowanie Strategiczne",
            desc: "Pojawił się projekt dający szansę na awans. Komu go dasz?",
            choices: [
                { text: "Bierzesz go na siebie: „Sam dopilnuję sukcesu, nikt inny nie podoła.\"", impact: { Autonomy: -30, Status: -20, Board: +20 }, feedback: "Chomikowanie sukcesu. Zarząd Ci ufa, ale blokujesz rozwój następców." },
                { text: "Dajesz go osobiście najwierniejszemu stronnikowi.", impact: { Fairness: -30, Relatedness: -25, Board: +10 }, feedback: "Nepotyzm. Niszczysz Sprawiedliwość i wizerunek profesjonalizmu." },
                { text: "Pozwalasz zespołowi zdecydować o liderze projektu w głosowaniu.", impact: { Autonomy: +30, Certainty: -25, Board: -30 }, feedback: "Demokracja, ale grozi popularnością zamiast kompetencji i kontroli." },
                { text: "Organizujesz konkurs ofert: „Kto przekona mnie najbardziej merytorycznie, bierze projekt.\"", impact: { Fairness: +30, Autonomy: +20, Status: +20, Board: +15 }, feedback: "Transparentność i Sprawiedliwość. Board widzi profesjonalny proces wyboru." }
            ]
        },
        {
            icon: "fa-ambulance",
            title: "Plan Naprawczy (PIP)",
            desc: "Musisz nałożyć plan naprawczy na pracownika, który kiedyś był Twoim kolegą.",
            choices: [
                { text: "„Marian, jesteś leniem. Albo wynik, albo do widzenia.\"", impact: { Relatedness: -30, Status: -30, Board: +15 }, feedback: "Agresja odpala Amigdalę Mariana. Board widzi 'skuteczne zarządzanie'." },
                { text: "Odwlekasz decyzję, licząc, że wyniki same się poprawią.", impact: { Fairness: -25, Certainty: -20, Board: -25 }, feedback: "Brak reakcji uderza w resztę. Board widzi brak Twojej decyzyjności." },
                { text: "Zaliczasz mu targety 'po koleżeńsku', mimo że ich nie dowiózł.", impact: { Fairness: -30, Status: +20, Board: -30 }, feedback: "Korupcja liderska. Board jest wściekły za manipulowanie danymi." },
                { text: "„Cenię naszą historię, ale dane X wymagają poprawy. Jak mogę Cię wesprzeć w PIP?\"", impact: { Relatedness: +20, Certainty: +25, Status: +15, Board: +10 }, feedback: "Humanitarny profesjonalizm. Oddzielasz osobę od wyników." }
            ]
        },
        {
            icon: "fa-glass",
            title: "Integracja po porażce",
            desc: "Właśnie przegraliście duży przetarg. Nastroje są pod psem.",
            choices: [
                { text: "„Nie ma co płakać. Jutro o 8:00 spotkanie sprzedażowe. Do roboty!\"", impact: { Relatedness: -25, Certainty: +10, Board: +15 }, feedback: "Emocjonalne odpięcie. Board widzi determinację, zespół czuje się jak roboty." },
                { text: "Szukasz winnego na forum: „Gdyby nie błąd Mariana, mielibyśmy to!\"", impact: { Status: -30, Relatedness: -30, Board: -15 }, feedback: "Publiczny lincz niszczy bezpieczeństwo psychologiczne na lata." },
                { text: "Zwiększasz budżet na integrację 3x: „Zapomnijmy o tym przy kolacji!\"", impact: { Relatedness: +30, Status: +15, Board: -30 }, feedback: "Ucieczka w hedonizm. Board uważa Cię za nieodpowiedzialnego finansowo." },
                { text: "„Wyjdźmy dziś wcześniej. Pogadajmy o tym, co czujemy, a jutro odrobimy lekcję.\"", impact: { Relatedness: +30, Status: +25, Autonomy: +15, Board: 0 }, feedback: "Akceptacja emocji przed analizą merytoryczną buduje kapitał społeczny." }
            ]
        }
    ],
    director: [
        {
            icon: "fa-gavel",
            title: "Nagła Restrukturyzacja",
            desc: "Zarząd łączy Twój pion z innym. Będą zwolnienia i duplikaty.",
            choices: [
                { text: "Zatajasz informację do końca, by nie przerywać pracy.", impact: { Certainty: -20, Relatedness: -15, Board: +15 }, feedback: "Kultura plotek wybuchnie. Zarząd ma spokój na chwilę, ale zaufanie ginie." },
                { text: "„Wszyscy zostają! Ja to gwarantuję (mimo braku budżetu).\"", impact: { Relatedness: +20, Certainty: -15, Board: -20 }, feedback: "Populizm. Gdy padną strzały, Twój Status legnie w gruzach. Board wściekły." },
                { text: "„Lider drugiego pionu to idiota, będziemy z nim walczyć o przetrwanie!\"", impact: { Relatedness: +15, Status: +15, Board: -20 }, feedback: "Wojna plemienna niszczy synergię firmy. Board usuwa takich liderów." },
                { text: "„Mamy zmiany. Nie znam wszystkich danych, ale co tydzień dam Wam update.\"", impact: { Certainty: +20, Relatedness: +15, Status: +15, Board: +10 }, feedback: "Transparentność w niepewności daje mózgowi kotwice Pewności." }
            ]
        },
        {
            icon: "fa-handshake-o",
            title: "Trudna Fuzja Kultur",
            desc: "Zespół z 'wolnościowej' firmy trafia pod Twoje rygorystyczne procedury.",
            choices: [
                { text: "„Tu mamy ISO. Albo się dostosujecie, albo szukajcie innej wolności.\"", impact: { Autonomy: -20, Status: -15, Board: +20 }, feedback: "Neuro-kolonializm. Board cieszy się z porządku, zespół planuje odejścia." },
                { text: "„Róbcie co chcecie, byle KPI się zgadzały (ukryte przed Boardem).\"", impact: { Fairness: -15, Certainty: -15, Board: -20 }, feedback: "Państwo w państwie niszczy Sprawiedliwość i spójność strategiczną." },
                { text: "Wynajmujesz zewnętrznego coacha za 100 tys. zł, by 'ich zrozumiał'.", impact: { Relatedness: +15, Board: -20, Status: +10 }, feedback: "Delegowanie empatii. Zespół czuje dystans, Board widzi przepalanie zysku." },
                { text: "„Wasza kultura jest ciekawa. Wybierzcie 3 procesy dla całości firmy.\"", impact: { Status: +20, Autonomy: +20, Relatedness: +20, Board: +5 }, feedback: "Asymilacja z szacunkiem. Nadajesz im Status 'ekspertów-innowatorów'." }
            ]
        },
        {
            icon: "fa-shield",
            title: "Atak Klienta",
            desc: "Kluczowy partner biznesowy publicznie obraża Twój zespół projektowy.",
            choices: [
                { text: "Przepraszasz klienta i zapowiadasz kary dla zespołu, by ratować kontrakt.", impact: { Relatedness: -20, Status: -20, Board: +20 }, feedback: "Zdrada liderska. Board kocha zysk, ale zespół nigdy Ci już nie zaufa." },
                { text: "Wstrzymujesz projekt: „Nie współpracujemy z ludźmi którzy nas nie szanują.\"", impact: { Status: +20, Relatedness: +20, Board: -20 }, feedback: "Radykalny honor. Status zespołu skacze, ale Board wyrzuci Cię za straty." },
                { text: "Uciekasz na urlop, niech Twój zastępca to załatwi.", impact: { Status: -15, Relatedness: -15, Board: -15 }, feedback: "Tchórzostwo liderskie. Nikt nie czuje się chroniony, Board widzi brak lidera." },
                { text: "„Wyjaśnimy merytorykę, ale w profesjonalnym tonie. Ja moderuję to spotkanie.\"", impact: { Status: +20, Certainty: +15, Relatedness: +15, Board: +15 }, feedback: "Tarcza dyrektorska. Chronisz ludzi (Status), nie paląc mostów (Board)." }
            ]
        },
        {
            icon: "fa-scissors",
            title: "Cięcia Budżetowe",
            desc: "Musisz uciąć 20% kosztów operacyjnych. Jak to zrobisz?",
            choices: [
                { text: "Zawieszasz premie wszystkim pracownikom, zachowując zysk firmy.", impact: { Fairness: -15, Status: -20, Board: +20 }, feedback: "Board zadowolony z oszczędności, ale zespół traci motywację i Status." },
                { text: "Zwalniasz najstarszych pracowników (najwyższe pensje).", impact: { Relatedness: -20, Certainty: -20, Board: +15 }, feedback: "Niszczysz Relacje i Pewność jutra u reszty. Ludzie zaczną masowo szukać pracy." },
                { text: "Przenosisz wszystkich do pracy zdalnej i zmniejszasz do minimum powierzchnię biura.", impact: { Autonomy: +10, Relatedness: -20, Board: +20 }, feedback: "Board oszczędza, ale Relacje w zespole legną w gruzach bez spotkań." },
                { text: "Zwołujesz liderów: „Mamy takie ograniczenia. Jakie optymalizacje proponujecie, by ocalić ludzi?\"", impact: { Autonomy: +20, Status: +15, Relatedness: +20, Board: +10 }, feedback: "Partycypacja. Oddanie Autonomii rodzi najbardziej kreatywne rozwiązania." }
            ]
        },
        {
            icon: "fa-university",
            title: "Presja na Wynik",
            desc: "Zarząd wyznacza nierealny termin, który wymaga nadludzkiego wysiłku zespołu.",
            choices: [
                { text: "„Pokażmy im, że dowieziemy! Robimy nadgodziny przez miesiąc.\"", impact: { Status: +15, Autonomy: -20, Board: +20 }, feedback: "Board widzi 'silnego lidera', zespół widzi tyrana. Ryzykujesz masowe wypalenie." },
                { text: "„Olejmy detale, dowieźmy byle co pod publikę Zarządu.\"", impact: { Certainty: -20, Status: -15, Board: -20 }, feedback: "Kultura pozorów. Board będzie wściekły przy pierwszym audycie." },
                { text: "„Zrobimy to, ale pod warunkiem potrójnych premii i tygodnia wolnego potem.\"", impact: { Fairness: +20, Status: +15, Board: -20 }, feedback: "Handel. Wysoka Sprawiedliwość, ale Board widzi brak kontroli nad kosztami." },
                { text: "Stawiasz veto: „Ten termin jest niemożliwy. Proponuję etapowanie i MVP.\"", impact: { Status: +20, Certainty: +15, Relatedness: +20, Board: +10 }, feedback: "Odwaga cywilna dyrektora buduje ogromny Status i Pewność u podwładnych." }
            ]
        },
        {
            icon: "fa-bullhorn",
            title: "Kryzys Wizerunkowy",
            desc: "Wykryto błąd w produkcie. Media o tym trąbią. Zespół jest przerażony.",
            choices: [
                { text: "Znajdujesz kozła ofiarnego i zwalniasz go.", impact: { Certainty: +15, Fairness: -20, Board: +20 }, feedback: "Kultura strachu. Uspokajasz media, ale paraliżujesz zespół lękiem (Amigdala)." },
                { text: "Blokujesz komunikację, póki nie znajdziesz rozwiązania (tryb strusia).", impact: { Certainty: -20, Relatedness: -15, Board: -20 }, feedback: "Brak informacji w kryzysie to neuro-horror. Board i zespół w panice." },
                { text: "„To moja wina! Przejmuję wszystkie błędy na siebie (heroizm).\"", impact: { Relatedness: +15, Status: -15, Board: -20 }, feedback: "Tracisz autorytet dyrektorski przed Boardem, mimo sympatii zespołu." },
                { text: "„Błąd to proces. Ja biorę odpowiedzialność na zewnątrz, Wy naprawcie core.\"", impact: { Relatedness: +20, Status: +20, Certainty: +20, Board: +10 }, feedback: "Osłona dyrektorska. Poczucie bezpieczeństwa pozwala na genialną naprawę." }
            ]
        },
        {
            icon: "fa-compass",
            title: "Opór przed Wizją",
            desc: "Ogłaszasz nową wizję na 5 lat, ale nikt w nią nie wierzy.",
            choices: [
                { text: "„Wierzę w tę wizję. Albo w to wchodzicie, albo jutro widzę Wasze wypowiedzenia.\"", impact: { Autonomy: -20, Status: -15, Board: +20 }, feedback: "Dyktatura wizjonerska. Board widzi determinację, zespół jest w trybie ucieczki." },
                { text: "Rezygnujsze z wizji: „Skoro Wam się nie podoba, to po prostu róbmy to co wczoraj.\"", impact: { Status: -20, Certainty: -15, Board: -20 }, feedback: "Kapitulacja lidera. Tracisz autorytet u wszystkich. Firma stoi w miejscu." },
                { text: "Obiecujesz premie za 'uwierzenie' w nową strategię.", impact: { Board: -20, Fairness: -15, Status: +10 }, feedback: "Przekupstwo motywacyjne buduje cynizm w zespole i niszczy budżet." },
                { text: "„Wizja to kierunek. Wypracujmy wspólnie mapę na 6 miesięcy. Co o tym sądzicie?\"", impact: { Autonomy: +20, Status: +20, Certainty: +20, Board: +15 }, feedback: "Partycypacja. Nadajesz ludziom Status współtwórców wizji." }
            ]
        },
        {
            icon: "fa-users",
            title: "Agresywny Headhunter",
            desc: "Konkurencja próbuje podkupić Twój cały kluczowy zespół projektowy.",
            choices: [
                { text: "Blokujesz ich odejście groźbami prawnymi i zakazami konkurencji.", impact: { Autonomy: -20, Relatedness: -15, Board: +10 }, feedback: "Atak na wolność (Autonomia) wyzwala ekstremalny opór i nienawiść do marki." },
                { text: "Ignorusze: „Nikt nie jest niezastąpiony. Jak pójdą, to przyjdą inni.\"", impact: { Relatedness: -15, Certainty: -15, Board: -15 }, feedback: "Poczucie bycia śmieciem (Status). Board przerażony brakiem zarządzania ryzykiem." },
                { text: "Dajesz każdemu 50% podwyżki na koszt innych działów.", impact: { Fairness: -20, Status: +15, Board: -20 }, feedback: "Niszczysz firmę od środka. Konflikt między działami i ruinę finansową." },
                { text: "„Wiem o ofertach. Porozmawiajmy o tym, co musi się zmienić tutaj, byście nie chcieli odchodzić.\"", impact: { Relatedness: +20, Autonomy: +20, Status: +20, Board: +5 }, feedback: "Relacje oparte na zaufaniu i wpływie. Szacunek dla ich wartości." }
            ]
        },
        {
            icon: "fa-sun-o",
            title: "Kultura Pieniądza",
            desc: "Firma świetnie zarabia, ale ludzie czują się tylko trybikami w maszynie.",
            choices: [
                { text: "Ignorujesz sytuację, póki wyniki rosną.", impact: { Relatedness: -15, Status: -15, Board: +20 }, feedback: "Krótkowzroczność. W kryzysie wszyscy Cię zostawią, bo nie czują więzi." },
                { text: "Inwestujesz luksusową integrację (pokazówka).", impact: { Status: +15, Relatedness: +10, Board: -20 }, feedback: "Pusty gest dyrektorski. Board widzi nieuzasadnione koszty, ludzie czują falsz." },
                { text: "Organizujesz obowiązkowe warsztaty 'Jak być wdzięcznym firmie'.", impact: { Autonomy: -15, Status: -15, Board: -10 }, feedback: "Desperacja. Przymusowa wdzięczność to neuro-koszmar i upokorzenie." },
                { text: "Przeznaczasz 5% zysku na cel społeczny wybrany przez pracowników.", impact: { Relatedness: +20, Status: +20, Autonomy: +15, Board: +5 }, feedback: "Purpose (Sens). Buduje dumę z marki i poczucie sprawstwa (Autonomia)." }
            ]
        },
        {
            icon: "fa-balance-scale",
            title: "Dylemat Etyczny",
            desc: "Wykryto, że nowa linia produktów ma wadę ujawniającą się po roku użytkowania. Board chce to ukryć.",
            choices: [
                { text: "„Milczymy. To świetny model biznesowy, Zarząd będzie zachwycony cashflow.\"", impact: { Fairness: -20, Board: +20, Status: -15 }, feedback: "Sprzedaż duszy. Board Cię nagrodzi, inżynierowie odejdą (brak Sprawiedliwości)." },
                { text: "Robisz przeciek do mediów, niszcząc firmę od środka.", impact: { Status: -20, Board: -20, Certainty: -20 }, feedback: "Zemsta. Niszczysz wszystko, co budowałeś. Totalny chaos i upadek firmy." },
                { text: "Mówisz zespołowi: „Musimy to robić, takie są rozkazy, zapomnijcie o moralności.\"", impact: { Relatedness: -15, Status: -15, Board: +15 }, feedback: "Przymykanie oczu. Budujesz kulturę 'najemników' bez kręgosłupa." },
                { text: "„Wspólnie zaproponujmy Zarządowi model subskrypcyjny, by trwałość była atutem.\"", impact: { Fairness: +20, Status: +20, Autonomy: +20, Board: +15 }, feedback: "Innowacja etyczna. Łączysz Etykę (Fairness) z Zyskiem (Board)." }
            ]
        }
    ]
};

let currentScenariosPool = [];
let scarfCurrent = 0;
let scarfChart;

function isMobileScarfFlow() {
    return window.matchMedia('(max-width: 600px)').matches;
}

function setMobileScarfState(isSimulatorVisible) {
    const simulator = document.getElementById('scarf-simulator');
    if (!simulator) return;

    if (isMobileScarfFlow() && isSimulatorVisible) {
        simulator.classList.add('mobile-simulator-active');
    } else {
        simulator.classList.remove('mobile-simulator-active');
    }
}

function returnToDifficultySelection() {
    if (!isMobileScarfFlow()) return;

    document.getElementById('results-overlay').style.display = 'none';
    document.getElementById('simulator-main').style.display = 'none';
    document.getElementById('difficulty-overlay').style.display = 'flex';
    const sim = document.getElementById('scarf-simulator');
    if (sim) sim.classList.remove('mobile-results-active');
    setMobileScarfState(false);
}

function selectDifficulty(level) {
    const settings = difficultySettings[level];
    Object.keys(scarfValues).forEach(k => scarfValues[k] = settings.start);
    boardConfidence = settings.start;
    impactMultiplier = settings.multi;

    // Shuffle scenarios and pick 10
    currentScenariosPool = [...scenariosDatabase[level]]
        .sort(() => Math.random() - 0.5)
        .slice(0, 10);

    scarfCurrent = 0;
    document.getElementById('difficulty-overlay').style.display = 'none';
    document.getElementById('results-overlay').style.display = 'none';
    document.getElementById('simulator-main').style.display = 'block';
    setMobileScarfState(true);
    initScarfChart();
    updateScarfUI();
}


function initScarfChart() {
    if (scarfChart) scarfChart.destroy();

    const vals = ['Status', 'Certainty', 'Autonomy', 'Relatedness', 'Fairness'].map(k => scarfValues[k]);
    const avg = vals.reduce((a, b) => a + b) / 5;

    // Indigo/Cyan for positive, Magenta/Red for negative
    const dynamicColor = avg > 50 ? '#1E73B9' : '#B10A4A';
    const dynamicBg = avg > 50 ? 'rgba(30, 115, 185, 0.35)' : 'rgba(177, 10, 74, 0.35)';

    const ctx = document.getElementById('radarChart').getContext('2d');
    scarfChart = new Chart(ctx, {
        type: 'radar',
        plugins: [radarCenterPlugin],
        data: {
            labels: ['Status', 'Pewność', 'Autonomia', 'Relacyjność', 'Sprawiedliwość'],
            datasets: [{
                data: ['Status', 'Certainty', 'Autonomy', 'Relatedness', 'Fairness'].map(k => scarfValues[k]),
                backgroundColor: dynamicBg,
                borderColor: dynamicColor,
                borderWidth: 3,
                pointBackgroundColor: dynamicColor,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            animation: { duration: 1000, easing: 'easeOutElastic' },
            scales: {
                r: {
                    angleLines: { color: 'rgba(255,255,255,0.1)' },
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    pointLabels: { color: '#94a3b8', font: { size: 11, weight: '700' } },
                    ticks: { display: false },
                    min: 0,
                    max: 100
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// Index in radar labels array: Status=0, Certainty=1, Autonomy=2, Relatedness=3, Fairness=4
const scarfRadarIndex = { Status: 0, Certainty: 1, Autonomy: 2, Relatedness: 3, Fairness: 4 };
const scarfLabels = { Status: 'Status', Certainty: 'Pewność', Autonomy: 'Autonomia', Relatedness: 'Relacyjność', Fairness: 'Sprawiedl.', Board: 'Zarząd' };

function showImpactNearLabels(impacts) {
    document.querySelectorAll('.impact-label-tag').forEach(el => el.remove());
    const boardArea = document.getElementById('board-impact-area');
    if (boardArea) boardArea.innerHTML = '';

    const wrapper = document.getElementById('radar-chart-wrapper');
    const scale = scarfChart && scarfChart.scales && scarfChart.scales.r;

    const count = 5;
    Object.entries(impacts).forEach(([key, rawVal]) => {
        let val = key === 'Board'
            ? (rawVal > 0 ? Math.round(rawVal * 0.5) : Math.round(rawVal * 0.7))
            : Math.round(rawVal);
        const positive = val > 0;
        const color = positive ? '#60a5fa' : '#f87171';
        const bg = positive ? 'rgba(30,115,185,0.2)' : 'rgba(177,10,74,0.2)';
        const border = positive ? 'rgba(30,115,185,0.5)' : 'rgba(177,10,74,0.5)';
        const numText = `${positive ? '+' : ''}${val}`;

        if (key === 'Board') {
            if (!boardArea || !scale) return;
            // Position just below the lowest radar label (Relacyjność/Autonomia at ~216°/144°)
            // The lowest point is at yCenter + drawingArea (bottom of the chart)
            const bottomLabelY = scale.yCenter + scale.drawingArea + 18;
            boardArea.style.top = `${bottomLabelY}px`;
            const tag = document.createElement('span');
            tag.className = 'impact-label-tag';
            tag.style.cssText = `display:inline-flex;align-items:center;gap:5px;padding:4px 14px;border-radius:20px;font-size:0.8rem;font-weight:700;background:${bg};border:1px solid ${border};color:${color};`;
            tag.innerHTML = `<span style="opacity:0.65;font-weight:500">Zarząd</span> ${numText}`;
            boardArea.appendChild(tag);
            return;
        }

        if (!wrapper || !scale) return;
        const idx = scarfRadarIndex[key];
        if (idx === undefined) return;

        // Position number just outside the label, at the label's angle
        const angle = (idx / count) * 2 * Math.PI - Math.PI / 2;
        const r = scale.drawingArea + 14;
        const x = scale.xCenter + Math.cos(angle) * r;
        const y = scale.yCenter + Math.sin(angle) * r;

        const tag = document.createElement('div');
        tag.className = 'impact-label-tag';
        tag.style.cssText = `
            position:absolute; left:${x}px; top:${y}px;
            transform:translate(-50%,-50%);
            padding:2px 7px; border-radius:12px;
            font-size:0.75rem; font-weight:900;
            background:${bg}; border:1px solid ${border}; color:${color};
            white-space:nowrap; pointer-events:none; z-index:10;
            animation:floatUp 1.2s ease-out forwards;
        `;
        tag.textContent = numText;
        wrapper.appendChild(tag);
    });
}

function updateScarfUI() {
    const progress = (scarfCurrent / currentScenariosPool.length) * 100;
    document.getElementById('scarf-progress').style.width = `${progress}%`;
    document.getElementById('board-progress').style.width = `${boardConfidence}%`;

    if (scarfCurrent >= currentScenariosPool.length) {
        const avgScarf = Object.values(scarfValues).reduce((a, b) => a + b) / 5;
        const finalBoard = boardConfidence;
        document.getElementById('results-overlay').style.display = 'flex';
        setMobileScarfState(true);

        // Mark results active — hides simulator-main on mobile
        const sim = document.getElementById('scarf-simulator');
        if (sim) sim.classList.add('mobile-results-active');

        // Hide simulator content on results
        document.getElementById('simulator-main').style.display = 'none';

        // Draw a fresh results chart on the dedicated canvas
        const dynamicColor = avgScarf > 50 ? '#1E73B9' : '#B10A4A';
        const dynamicBg = avgScarf > 50 ? 'rgba(30, 115, 185, 0.35)' : 'rgba(177, 10, 74, 0.35)';
        const resultsCtx = document.getElementById('resultsRadarChart').getContext('2d');
        new Chart(resultsCtx, {
            type: 'radar',
            plugins: [radarCenterPlugin],
            data: {
                labels: ['Status', 'Pewność', 'Autonomia', 'Relacyjność', 'Sprawiedliwość'],
                datasets: [{
                    data: ['Status', 'Certainty', 'Autonomy', 'Relatedness', 'Fairness'].map(k => scarfValues[k]),
                    backgroundColor: dynamicBg,
                    borderColor: dynamicColor,
                    borderWidth: 3,
                    pointBackgroundColor: dynamicColor,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                animation: { duration: 1000, easing: 'easeOutElastic' },
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255,255,255,0.1)' },
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        pointLabels: { color: '#94a3b8', font: { size: 10, weight: '700' } },
                        ticks: { display: false },
                        min: 0,
                        max: 100
                    }
                },
                plugins: { legend: { display: false } }
            }
        });

        let archetype = "Lider Adaptacyjny";
        let description = "";

        if (avgScarf >= 70 && finalBoard >= 70) {
            archetype = "Mistrz Zarządzania (Master Architect)";
            description = "Wybitny balans! Budujesz potężny kapitał społeczny, jednocześnie realizując wyniki biznesowe.";
        } else if (avgScarf >= 70 && finalBoard < 50) {
            archetype = "Bohater Zespołu (People's Hero)";
            description = "Zespół Cię kocha i ma do Ciebie zaufanie, ale Zarząd obawia się o koszty i terminy Twoich decyzji.";
        } else if (avgScarf < 50 && finalBoard >= 70) {
            archetype = "Rekin Korporacyjny (Corporate Shark)";
            description = "Wyniki są świetne, ale zespół jest w trybie przetrwania (ciągły stres). Ryzykujesz masowe wypalenie.";
        } else if (avgScarf < 40 && finalBoard < 40) {
            archetype = "Strefa Zagrożenia (Danger Zone)";
            description = "Tracisz zaufanie na obu polach. Potrzebujesz głębokiej refleksji nad modelem SCARF i celami firmy.";
        } else {
            description = "Solidny fundament. Twoim kolejnym krokiem jest nauka godzenia skrajnych interesów ludzi i biznesu.";
        }

        document.getElementById('results-final-desc').innerHTML = `
            <span class="archetype-label">Twój profil przywództwa:</span>
            <strong style="font-size: 1.5rem; color: #fff; display: block; margin: 10px 0;">${archetype}</strong>
            <div style="display: flex; gap: 20px; justify-content: center; margin: 20px 0;">
                <div style="background: rgba(30, 115, 185, 0.1); padding: 10px 20px; border-radius: 15px; border: 1px solid var(--accent-cyan);">
                    <small style="color: var(--text-dim); display: block;">SCARF (Zespół)</small>
                    <span style="font-size: 1.2rem; font-weight: 800; color: var(--accent-cyan); font-family: var(--font-heading);">${Math.round(avgScarf)}%</span>
                </div>
                <div style="background: rgba(177, 10, 74, 0.1); padding: 10px 20px; border-radius: 15px; border: 1px solid var(--accent-magenta);">
                    <small style="color: var(--text-dim); display: block;">BOARD (Zarząd)</small>
                    <span style="font-size: 1.2rem; font-weight: 800; color: var(--accent-magenta); font-family: var(--font-heading);">${Math.round(finalBoard)}%</span>
                </div>
            </div>
            <p style="margin-top:15px; font-size: 1rem; color: var(--text-dim);">${description}</p>
        `;
        return;
    }

    const s = currentScenariosPool[scarfCurrent];
    document.getElementById('phase-label').innerText = `SYTUACJA ${scarfCurrent + 1} / ${currentScenariosPool.length}`;
    document.getElementById('scenario-title').innerHTML = `<i class="fa ${s.icon}" style="margin-right: 12px; color: var(--accent-cyan);"></i>${s.title}`;
    document.getElementById('scenario-desc').innerText = s.desc;

    document.getElementById('feedback-text').innerText = '';
    document.querySelectorAll('.impact-label-tag').forEach(el => el.remove());
    const boardArea = document.getElementById('board-impact-area');
    if (boardArea) boardArea.innerHTML = '';

    const container = document.getElementById('choices-container');
    container.innerHTML = '';

    s.choices.forEach((c, i) => {
        const b = document.createElement('button');
        b.className = 'choice-btn';
        b.innerHTML = `<span class="letter">${String.fromCharCode(65 + i)}</span> ${c.text}`;
        b.onclick = () => {
            // Disable all choice buttons, highlight selected
            container.querySelectorAll('.choice-btn').forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = '0.4';
                btn.style.cursor = 'default';
                btn.style.transform = 'none';
            });
            b.style.opacity = '1';
            b.style.borderColor = 'var(--accent-cyan)';
            b.style.background = 'rgba(30, 115, 185, 0.12)';

            Object.keys(c.impact).forEach(k => {
                if (k === 'Board') {
                    let boardVal = c.impact[k] * impactMultiplier;
                    boardVal = boardVal > 0 ? boardVal * 0.5 : boardVal * 0.7;
                    boardConfidence = Math.max(0, Math.min(100, boardConfidence + Math.round(boardVal)));
                } else {
                    const val = Math.round(c.impact[k] * impactMultiplier);
                    scarfValues[k] = Math.max(0, Math.min(100, scarfValues[k] + val));
                }
            });
            showImpactNearLabels(c.impact);

            document.getElementById('board-progress').style.width = `${boardConfidence}%`;
            const gameProgress = ((scarfCurrent + 1) / currentScenariosPool.length) * 100;
            document.getElementById('scarf-progress').style.width = `${gameProgress}%`;

            document.getElementById('feedback-text').innerText = c.feedback;

            const chartVals = ['Status', 'Certainty', 'Autonomy', 'Relatedness', 'Fairness'].map(k => scarfValues[k]);
            const avg = chartVals.reduce((a, b) => a + b) / 5;
            const dynamicColor = avg > 50 ? '#1E73B9' : '#B10A4A';
            const dynamicBg = avg > 50 ? 'rgba(30, 115, 185, 0.35)' : 'rgba(177, 10, 74, 0.35)';

            scarfChart.data.datasets[0].borderColor = dynamicColor;
            scarfChart.data.datasets[0].backgroundColor = dynamicBg;
            scarfChart.data.datasets[0].pointBackgroundColor = dynamicColor;
            scarfChart.data.datasets[0].data = chartVals;
            scarfChart.update();

            scarfCurrent++;

            // Show "Next" button instead of auto-advancing
            const isLast = scarfCurrent >= currentScenariosPool.length;
            const nextBtn = document.createElement('button');
            nextBtn.className = 'choice-btn';
            nextBtn.style.cssText = 'background: linear-gradient(135deg, var(--accent-blue), var(--accent-cyan)); border-color: var(--accent-cyan); color: #fff; font-weight: 700; justify-content: center; margin-top: 8px;';
            nextBtn.innerHTML = isLast
                ? '<i class="fa fa-flag-checkered" style="margin-right:8px;"></i> Zobacz wyniki'
                : '<i class="fa fa-arrow-right" style="margin-right:8px;"></i> Następna sytuacja';
            nextBtn.onclick = updateScarfUI;
            container.appendChild(nextBtn);
        };
        container.appendChild(b);
    });
}

window.addEventListener('resize', () => {
    const simulatorMain = document.getElementById('simulator-main');
    if (!simulatorMain || simulatorMain.style.display !== 'block') {
        setMobileScarfState(false);
        return;
    }

    setMobileScarfState(true);
});


document.addEventListener('mousemove', (e) => {
    document.querySelectorAll('.card').forEach(card => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    });
});

// "Synapse Burst" - Spawn new connected neurons on click with performance cap
window.addEventListener('click', (e) => {
    const MAX_PARTICLES = 400; // Safe limit for canvas performance
    if (particles.length >= MAX_PARTICLES) return;

    const newNodes = [];
    for (let i = 0; i < 2; i++) {
        const p = new Particle(true);
        p.x = e.clientX + (Math.random() - 0.5) * 100;
        p.y = e.clientY + (Math.random() - 0.5) * 100;
        newNodes.push(p);
    }

    newNodes.forEach(newNode => {
        // Connect to existing particles
        particles.forEach(p => {
            const d = Math.sqrt((newNode.x - p.x) ** 2 + (newNode.y - p.y) ** 2);
            if (d < 150) {
                newNode.neighbors.push(p);
                p.neighbors.push(newNode);
            }
        });
        // Connect to other new nodes
        newNodes.forEach(other => {
            if (newNode === other) return;
            const d = Math.sqrt((newNode.x - other.x) ** 2 + (newNode.y - other.y) ** 2);
            if (d < 150 && !newNode.neighbors.includes(other)) {
                newNode.neighbors.push(other);
            }
        });

        particles.push(newNode);

        // Immediate pulses from new neurons
        if (newNode.neighbors.length > 0) {
            for (let k = 0; k < 2; k++) {
                const target = newNode.neighbors[Math.floor(Math.random() * newNode.neighbors.length)];
                pulses.push(new Pulse(newNode, target));
            }
        }
    });
});
