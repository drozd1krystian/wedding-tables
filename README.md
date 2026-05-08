# Planer Weselny 💍

Aplikacja webowa do rozmieszczania gości weselnych na stoły. Działa w całości w przeglądarce – bez potrzeby serwera, dane zapisywane są lokalnie (localStorage).

## Uruchomienie

```bash
# 1. Zainstaluj zależności
npm install

# 2. Uruchom tryb deweloperski
npm run dev

# 3. Otwórz w przeglądarce: http://localhost:5173
```

### Budowanie produkcyjne

```bash
npm run build
npm run preview
```

## Funkcje

### Zarządzanie stołami
- **Dodawanie** — przycisk „Nowy stół" w górnym pasku lub dwuklik w dowolnym miejscu sali
- **Edycja** — klik na ikonę ołówka przy stole lub zaznacz stół i edytuj w prawym panelu
- **Usuwanie** — ikona kosza przy stole
- **Przesuwanie** — złap uchwyt ⠿ w lewym górnym rogu karty stołu i przeciągnij w nowe miejsce
- Każdy stół ma: nazwę, kształt (okrągły/prostokątny), liczbę miejsc, notatki
- Wskaźnik zapełnienia zmienia kolor: zielony → pomarańczowy (>80%) → czerwony (przekroczony)

### Zarządzanie gościami
- **Dodawanie** — przycisk „Dodaj" w lewym panelu lub edycja przez dwuklik na gościu
- **Kategorie** (z oznaczeniem kolorem):
  - 🔵 Rodzina
  - 🟢 Przyjaciele
  - 🟡 Znajomi z pracy
  - ⚫ Inne
- Możliwość dodania wymogów dietetycznych i notatek
- Wyszukiwarka i filtr kategorii w lewym panelu
- Przełącznik: tylko nieprzypisani / wszyscy goście

### Przypisywanie gości do stołów
- **Przeciągnij i upuść** — złap gościa z lewego panelu i upuść na stół na sali
- **Odpiąć gościa** — najedź na gościa przy stole i kliknij ×, lub użyj prawego panelu
- **Auto-rozmieszczenie** — przycisk „Auto-rozmieść" przypisze wszystkich nieprzypisanych gości do stołów z wolnymi miejscami

### Import gości z Excela / CSV
1. Kliknij **„Import Excel"** w górnym pasku
2. Przeciągnij plik `.xlsx`, `.xls` lub `.csv` do okna dialogowego
3. Dopasuj kolumny do pól (imię, kategoria itp.)
4. Podejrzyj dane i kliknij „Importuj X gości"

**Format pliku** (przykładowy plik: `sample-guests.csv` dostępny po uruchomieniu):
```
Imię i Nazwisko,Kategoria,Wymogi dietetyczne,Uwagi
Jan Kowalski,rodzina,,
Anna Nowak,przyjaciele,wegetarianka,uczulona na gluten
```

Kategorie w pliku: `rodzina`, `przyjaciele`, `praca`, `inne` (lub angielskie odpowiedniki).

### Export / Import projektu (JSON)
- **Export** — przycisk „Exportuj" zapisuje pełny stan projektu do pliku `.json`
- **Wczytaj** — przycisk „Wczytaj" odtwarza projekt z pliku `.json`

Format pliku projektu:
```json
{
  "projectName": "Wesele Jan i Anna",
  "projectDate": "2024-06-15",
  "tables": [...],
  "guests": [...],
  "assignments": [...],
  "version": "1.0",
  "exportedAt": "2024-01-01T12:00:00Z"
}
```

## Układ interfejsu

```
┌─────────────────────────────────────────────────────────────────┐
│  💍 Nazwa projektu   [data]   [Import Excel] [Auto] [Export]    │  TopBar
├────────────┬────────────────────────────────────┬───────────────┤
│            │                                    │               │
│  Lista     │          Sala weselna              │  Szczegóły    │
│  gości     │     (przeciągnij stoły i gości)    │  stołu/gościa │
│            │                                    │               │
├────────────┴────────────────────────────────────┴───────────────┤
│  Goście: 50 | Przypisani: 38 | Nieprzypisani: 12 | Stoły: 6     │  StatsBar
└─────────────────────────────────────────────────────────────────┘
```

## Stack technologiczny

| Technologia | Zastosowanie |
|-------------|--------------|
| React 18 + TypeScript | Interfejs użytkownika |
| Vite | Bundler / dev server |
| Tailwind CSS | Stylowanie |
| @dnd-kit/core | Drag & Drop |
| Zustand | Stan aplikacji |
| SheetJS (xlsx) | Parsowanie plików Excel/CSV |
| localStorage | Automatyczny zapis stanu |
| lucide-react | Ikony |

## Dane

Dane przechowywane są **wyłącznie lokalnie** w `localStorage` przeglądarki pod kluczem `wedding-planner-v1`. Nie są wysyłane na żaden serwer.

## Skróty klawiszowe

| Klawisz | Akcja |
|---------|-------|
| `Esc` | Zamknij okno dialogowe |
| Dwuklik na sali | Dodaj nowy stół w tym miejscu |
| Dwuklik na gościu | Otwórz edycję gościa |
