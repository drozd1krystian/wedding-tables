import { useState } from 'react';
import Modal from './Modal';
import { useStore } from '../store/useStore';
import { TableShape } from '../types';

export default function AddTableModal() {
  const { closeAddTableModal, editingTableId, tables, addTable, updateTable } = useStore();

  const editing = editingTableId ? tables.find((t) => t.id === editingTableId) : undefined;

  // Default name: next table number
  const defaultName = editing?.name ?? `Stół ${tables.length + 1}`;

  const [form, setForm] = useState({
    name: defaultName,
    shape: (editing?.shape ?? 'rectangular') as TableShape,
    seats: editing?.seats ?? 8,
    notes: editing?.notes ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Nazwa jest wymagana';
    if (form.seats < 1 || form.seats > 50) e.seats = 'Liczba miejsc: 1–50';
    return e;
  }

  function handleSave() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    const data = {
      name: form.name.trim(),
      shape: form.shape,
      seats: form.seats,
      notes: form.notes.trim() || undefined,
    };

    if (editing) {
      updateTable(editing.id, data);
    } else {
      // Place new table in a grid-ish pattern
      const idx = tables.length;
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      addTable({ ...data, x: 40 + col * 240, y: 40 + row * 220 });
    }
    closeAddTableModal();
  }

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  }

  return (
    <Modal title={editing ? 'Edytuj stół' : 'Dodaj stół'} onClose={closeAddTableModal} size="sm">
      <div className="p-4 space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Nazwa stołu *</label>
          <input
            autoFocus
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            className={`w-full text-sm border rounded-md px-3 py-2 focus:outline-none focus:border-rose-400 ${errors.name ? 'border-red-400' : 'border-slate-200'}`}
            placeholder="np. Stół 1, Stół Pary Młodej..."
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
          />
          {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Kształt</label>
          <div className="flex gap-3">
            {(['rectangular', 'round'] as TableShape[]).map((s) => (
              <label key={s} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="shape"
                  value={s}
                  checked={form.shape === s}
                  onChange={() => set('shape', s)}
                  className="accent-rose-500"
                />
                <span className="text-sm text-slate-700">
                  {s === 'rectangular' ? '▭ Prostokątny' : '○ Okrągły'}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">
            Liczba miejsc *
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => set('seats', Math.max(1, form.seats - 1))}
              className="w-8 h-8 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center text-lg leading-none"
            >−</button>
            <input
              type="number"
              min={1}
              max={50}
              value={form.seats}
              onChange={(e) => set('seats', Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
              className={`w-16 text-center text-sm border rounded-md px-2 py-2 focus:outline-none focus:border-rose-400 ${errors.seats ? 'border-red-400' : 'border-slate-200'}`}
            />
            <button
              type="button"
              onClick={() => set('seats', Math.min(50, form.seats + 1))}
              className="w-8 h-8 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center text-lg leading-none"
            >+</button>
          </div>
          {errors.seats && <p className="text-xs text-red-500 mt-0.5">{errors.seats}</p>}
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Notatki</label>
          <input
            type="text"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 focus:outline-none focus:border-rose-400"
            placeholder="np. stół przy oknie, dostęp dla wózków..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={closeAddTableModal}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          >
            Anuluj
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-rose-500 hover:bg-rose-600 text-white rounded-md font-medium transition-colors"
          >
            {editing ? 'Zapisz zmiany' : 'Dodaj stół'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
