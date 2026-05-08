import { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import Modal from './Modal';
import { useStore } from '../store/useStore';
import { parseFile, buildGuests, parsedRowToGuest } from '../utils/excel';
import { CATEGORY_LABELS, GuestCategory } from '../types';

type Mode = 'upload' | 'mapping' | 'preview';

export default function ImportModal() {
  const { closeImportModal, addGuests } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>('upload');
  const [isDragOver, setIsDragOver] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Column mapping state
  const [mapping, setMapping] = useState<{
    fullName: number;
    firstName: number;
    lastName: number;
    useSplit: boolean;
    category: number;
    dietary: number;
    notes: number;
  }>({ fullName: 0, firstName: -1, lastName: -1, useSplit: true, category: -1, dietary: -1, notes: -1 });

  const [replaceExisting, setReplaceExisting] = useState(false);

  async function handleFile(file: File) {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('Obsługiwane formaty: .xlsx, .xls, .csv');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { headers: h, rawRows: r } = await parseFile(file);
      setHeaders(h);
      setRawRows(r);

      // Auto-detect common column names
      const lower = h.map((x) => x.toLowerCase());
      const guessIdx = (keywords: string[]) =>
        lower.findIndex((h) => keywords.some((k) => h.includes(k)));

      const fullIdx = guessIdx(['imię i nazwisko', 'imie i nazwisko', 'full name', 'name', 'imię', 'nazwisko pełne']);
      const firstIdx = guessIdx(['imię', 'imie', 'first name', 'firstname']);
      const lastIdx = guessIdx(['nazwisko', 'last name', 'lastname', 'surname']);
      const catIdx = guessIdx(['kategoria', 'category', 'typ', 'type', 'group']);
      const dietIdx = guessIdx(['dieta', 'dietary', 'wymogi', 'alergie', 'allergies']);
      const notesIdx = guessIdx(['uwagi', 'notatki', 'notes', 'comments']);

      if (fullIdx >= 0) {
        setMapping((m) => ({ ...m, fullName: fullIdx, useSplit: true }));
      } else if (firstIdx >= 0 || lastIdx >= 0) {
        setMapping((m) => ({
          ...m,
          firstName: firstIdx,
          lastName: lastIdx,
          useSplit: false,
        }));
      }
      if (catIdx >= 0) setMapping((m) => ({ ...m, category: catIdx }));
      if (dietIdx >= 0) setMapping((m) => ({ ...m, dietary: dietIdx }));
      if (notesIdx >= 0) setMapping((m) => ({ ...m, notes: notesIdx }));

      setMode('mapping');
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  function buildResult() {
    return buildGuests(rawRows, {
      fullName: mapping.useSplit ? mapping.fullName : undefined,
      firstName: !mapping.useSplit ? mapping.firstName : undefined,
      lastName: !mapping.useSplit ? mapping.lastName : undefined,
      category: mapping.category >= 0 ? mapping.category : undefined,
      dietary: mapping.dietary >= 0 ? mapping.dietary : undefined,
      notes: mapping.notes >= 0 ? mapping.notes : undefined,
    });
  }

  function handleImport() {
    const result = buildResult();
    if (result.rows.length === 0) {
      setError('Brak wierszy do importu. Sprawdź mapowanie kolumn.');
      return;
    }
    const { clearAll } = useStore.getState();
    if (replaceExisting) clearAll();
    addGuests(result.rows.map(parsedRowToGuest));
    closeImportModal();
  }

  const preview = buildResult();
  const colOptions = [{ value: -1, label: '— nie importuj —' }, ...headers.map((h, i) => ({ value: i, label: `[${i + 1}] ${h}` }))];

  return (
    <Modal title="Importuj gości z pliku Excel / CSV" onClose={closeImportModal} size="lg">
      <div className="p-4">
        {mode === 'upload' && (
          <div>
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragOver ? 'border-rose-400 bg-rose-50' : 'border-slate-200 hover:border-rose-300 hover:bg-rose-50/30'
              }`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
            >
              <Upload size={32} className="mx-auto mb-3 text-slate-300" />
              <p className="font-medium text-slate-600 mb-1">Przeciągnij plik lub kliknij aby wybrać</p>
              <p className="text-sm text-slate-400">Obsługiwane: .xlsx, .xls, .csv (UTF-8)</p>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>

            {loading && <p className="text-center text-sm text-slate-500 mt-3">Wczytywanie...</p>}
            {error && (
              <p className="flex items-center gap-2 text-sm text-red-500 mt-3">
                <AlertCircle size={14} /> {error}
              </p>
            )}

            <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-500">
              <strong className="text-slate-700">Sugerowany format kolumn:</strong>
              <div className="mt-1 font-mono bg-white border border-slate-200 rounded p-2 text-slate-600">
                Imię i Nazwisko | Kategoria | Uwagi
              </div>
              <p className="mt-1">Kategorie: <code>rodzina</code>, <code>przyjaciele</code>, <code>praca</code>, <code>inne</code></p>
              <p className="mt-1">Pobierz przykładowy plik CSV: <a href="sample-guests.csv" download className="text-rose-500 underline">sample-guests.csv</a></p>
            </div>
          </div>
        )}

        {mode === 'mapping' && (
          <div>
            <p className="text-sm text-slate-600 mb-4">
              Wczytano <strong>{rawRows.length}</strong> wierszy z {headers.length} kolumnami. Dopasuj kolumny do pól:
            </p>

            {/* Name mapping */}
            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-xs font-semibold text-slate-700 mb-2">Imię i nazwisko</p>
              <div className="flex gap-3 mb-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" checked={mapping.useSplit} onChange={() => setMapping((m) => ({ ...m, useSplit: true }))} className="accent-rose-500" />
                  Jedna kolumna (pełne nazwisko)
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" checked={!mapping.useSplit} onChange={() => setMapping((m) => ({ ...m, useSplit: false }))} className="accent-rose-500" />
                  Dwie oddzielne kolumny
                </label>
              </div>

              {mapping.useSplit ? (
                <Select label="Imię i nazwisko (razem)" value={mapping.fullName} options={[...colOptions.filter(o => o.value >= 0)]} onChange={(v) => setMapping((m) => ({ ...m, fullName: v }))} required />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Imię" value={mapping.firstName} options={colOptions} onChange={(v) => setMapping((m) => ({ ...m, firstName: v }))} required />
                  <Select label="Nazwisko" value={mapping.lastName} options={colOptions} onChange={(v) => setMapping((m) => ({ ...m, lastName: v }))} required />
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <Select label="Kategoria (opcjonalnie)" value={mapping.category} options={colOptions} onChange={(v) => setMapping((m) => ({ ...m, category: v }))} />
              <Select label="Wymogi dietetyczne" value={mapping.dietary} options={colOptions} onChange={(v) => setMapping((m) => ({ ...m, dietary: v }))} />
              <Select label="Notatki" value={mapping.notes} options={colOptions} onChange={(v) => setMapping((m) => ({ ...m, notes: v }))} />
            </div>

            {/* Preview */}
            <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
              <div className="bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 border-b border-slate-200">
                Podgląd (pierwsze 5 wierszy)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-1.5 text-left text-slate-500 font-medium">Imię</th>
                      <th className="px-3 py-1.5 text-left text-slate-500 font-medium">Nazwisko</th>
                      <th className="px-3 py-1.5 text-left text-slate-500 font-medium">Kategoria</th>
                      <th className="px-3 py-1.5 text-left text-slate-500 font-medium">Dieta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-3 py-1.5">{row.firstName}</td>
                        <td className="px-3 py-1.5">{row.lastName}</td>
                        <td className="px-3 py-1.5">{CATEGORY_LABELS[row.category as GuestCategory]}</td>
                        <td className="px-3 py-1.5 text-slate-400">{row.dietaryRestrictions ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {preview.errors.length > 0 && (
              <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                <strong>Ostrzeżenia ({preview.errors.length}):</strong>
                <ul className="mt-1 space-y-0.5 max-h-20 overflow-y-auto">
                  {preview.errors.map((e, i) => <li key={i}>• {e}</li>)}
                </ul>
              </div>
            )}

            {error && (
              <p className="flex items-center gap-2 text-sm text-red-500 mb-3">
                <AlertCircle size={14} /> {error}
              </p>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                  className="accent-rose-500"
                />
                Zastąp istniejących gości i stoły
              </label>

              <div className="flex gap-2">
                <button onClick={() => setMode('upload')} className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md">
                  ← Wróć
                </button>
                <button
                  onClick={handleImport}
                  disabled={preview.rows.length === 0}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white rounded-md font-medium transition-colors"
                >
                  <CheckCircle2 size={14} />
                  Importuj {preview.rows.length} gości
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
  required,
}: {
  label: string;
  value: number;
  options: { value: number; label: string }[];
  onChange: (v: number) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600 block mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-rose-400 bg-white"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
