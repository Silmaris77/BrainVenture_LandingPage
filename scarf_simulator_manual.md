# Instrukcja Symulatora SCARF: Rebalans Punktacji

Niniejszy dokument opisuje mechanikę punktacji oraz pełną bazę scenariuszy symulatora lidera opartego na modelu SCARF.

## 1. Mechanika Punktacji

### Przedziały Punktowe
Zgodnie z najnowszymi wytycznymi, punktacja została zbalansowana, aby uniknąć gwałtownych skoków:
- **Typowa zmiana**: 15–25 pkt.
- **Maksymalna zmiana**: 30 pkt.
- **Drobna zmiana**: 5–10 pkt.

### Mnożniki Poziomów
Wartości bazowe z bazy danych są mnożone przez współczynnik trudności zależny od wybranego poziomu:
- **Junior Leader**: x 1.0
- **Manager**: x 1.2
- **Director**: x 1.4

### Tłumienie Board Confidence
Zaufanie Zarządu (Board Confidence) posiada asymetryczną logikę wpływu, aby modelować trudność odbudowania zaufania:
- **Wzmocnienie pozytywne**: x 0.5 (Zaufanie rośnie wolno).
- **Wzmocnienie negatywne**: x 0.7 (Zaufanie spada szybciej niż rośnie).

---

## 2. Baza Scenariuszy (Po Rebalansie)

### Poziom: Junior Leader

| Scenariusz | Wybór | Wpływ SCARF | Zaufanie Zarządu |
| :--- | :--- | :--- | :--- |
| **Nowy w Zespole** | A (Biurko i dok) | Rel:-25, Sta:-15 | +5 |
| | B (Szybkie przedstawienie) | Rel:-10, Sta:-10 | +10 |
| | C (3h integracja) | Rel:+30, Sta:+25 | -30 |
| | **D (Plan wdrożenia)** | Sta:+25, Rel:+25, Cer:+20 | -5 |
| **Spóźnienie na Daily** | A (Upomnienie publiczne) | Sta:-30, Rel:-25 | +15 |
| | B (Ignorowanie) | Fai:-25, Cer:-15 | -10 |
| | C (Przesunięcie Daily) | Rel:+15, Aut:+20 | -30 |
| | **D (Rozmowa 1:1)** | Rel:+25, Sta:+15 | 0 |
| **Pomysł na usprawnienie** | A (Rób swoje) | Aut:-30, Sta:-25 | +5 |
| | B (Wyślij maila) | Sta:-10, Rel:-10 | 0 |
| | C (Wdrożenie od razu) | Aut:+30, Sta:+25, Cer:-25 | -30 |
| | **D (Test na małą skalę)** | Aut:+25, Sta:+20, Cer:+10 | +10 |

*(Pełna lista 30 scenariuszy znajduje się w kodzie aplikacji; powyższe to przykłady obrazujące nową skalę).*

### Poziom: Manager

| Scenariusz | Wybór | Wpływ SCARF | Zaufanie Zarządu |
| :--- | :--- | :--- | :--- |
| **Nagły zwrot akcji** | A (Rozkaz z góry) | Aut:-30, Rel:-30 | +30 |
| | B (Solidarność w porażce) | Sta:-25, Rel:+15 | -30 |
| | C (Veto do Zarządu) | Rel:+30, Aut:+25 | -30 |
| | **D (Nadanie sensu Y)** | Sta:+25, Cer:+20, Aut:+20 | +25 |
| **Konflikt o Zasoby** | A (Priorytet dla A) | Fai:-30, Rel:-20 | 0 |
| | B (Blokada serwera) | Aut:-25, Cer:-30 | -30 |
| | C (Zakup nowego) | Rel:+20, Fai:+25 | -30 |
| | **D (Facylitacja grafiku)** | Fai:+25, Aut:+25, Rel:+20 | +10 |

### Poziom: Director

| Scenariusz | Wybór | Wpływ SCARF | Zaufanie Zarządu |
| :--- | :--- | :--- | :--- |
| **Restrukturyzacja** | A (Zatajenie) | Cer:-20, Rel:-15 | +15 |
| | B (Populizm) | Rel:+20, Cer:-15 | -20 |
| | C (Wojna plemienna) | Rel:+15, Sta:+15 | -20 |
| | **D (Transparentność)** | Cer:+20, Rel:+15, Sta:+15 | +10 |
| **Atak Klienta** | A (Przeprosiny + kara) | Rel:-20, Sta:-20 | +20 |
| | B (Wstrzymanie projektu) | Sta:+20, Rel:+20 | -20 |
| | C (Ucieczka na urlop) | Sta:-15, Rel:-15 | -15 |
| | **D (Tarcza dyrektorska)** | Sta:+20, Cer:+15, Rel:+15 | +15 |

---

## 3. Zasady Projektowania Scenariuszy
Przy dodawaniu nowych treści należy pamiętać o "Zatrutym Kielichu" – wyborach, które dają duży zysk w jednym wymiarze (np. Relacje), ale niszczą inny krytyczny zasób (np. Board Confidence lub Fairness).

> [!IMPORTANT]
> Najlepszy lider to taki, który potrafi znaleźć wybór D – dający umiarkowane zyski w wielu wymiarach SCARF przy jednoczesnym utrzymaniu spokoju operacyjnego (Board).
