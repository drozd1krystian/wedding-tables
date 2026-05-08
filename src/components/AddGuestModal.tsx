import { useState } from 'react';
import Modal from './Modal';
import { useStore } from '../store/useStore';
import { GuestCategory, CATEGORY_LABELS } from '../types';

export default function AddGuestModal() {
  const { closeAddGuestModal, editingGuestId, guests, addGuest, updateGuest } = useStore();

  const editing = editingGuestId ? guests.find((g) => g.id === editingGuestId) : undefined;

  const [form, setForm] = useState({
    firstName: editing?.firstName ?? '',
    lastName: editing?.lastName ?? '',
    category: (editing?.category ?? 'other') as GuestCategory,
    dietaryRestrictions: editing?.dietaryRestrictions ?? '',
    notes: editing?.notes ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'Imię jest wymagane';
    return e;
  }

  function handleSave() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    const data = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      category: form.category,
      dietaryRestrictions: form.dietaryRestrictions.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };

    if (editing) {
      updateGuest(editing.id, data);
    } else {
      addGuest(data);
    }
    closeAddGuestModal();
  }

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  }

  return (
    <Modal title={editing ? 'Edytuj gościa' : 'Dodaj gościa'} onClose={closeAddGuestModal} size="sm">
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Imię *</label>
            <input
              autoFocus
              type="text"
              value={form.firstName}
              onChange={(e) => set('firstName', e.target.value)}
              className={`w-full text-sm border rounded-md px-3 py-2 focus:outline-none focus:border-rose-400 ${errors.firstName ? 'border-red-400' : 'border-slate-200'}`}
              placeholder="Jan"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            />
            {errors.firstName && <p className="text-xs text-red-500 mt-0.5">{errors.firstName}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Nazwisko</label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => set('lastName', e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 focus:outline-none focus:border-rose-400"
              placeholder="Kowalski"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Kategoria</label>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(CATEGORY_LABELS) as GuestCategory[]).map((cat) => (
              <label key={cat} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value={cat}
                  checked={form.category === cat}
                  onChange={() => set('category', cat)}
                  className="accent-rose-500"
                />
                <span className="text-sm text-slate-700">{CATEGORY_LABELS[cat]}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Wymogi dietetyczne</label>
          <input
            type="text"
            value={form.dietaryRestrictions}
            onChange={(e) => set('dietaryRestrictions', e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 focus:outline-none focus:border-rose-400"
            placeholder="np. wegetarianin, brak glutenu..."
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Notatki</label>
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 focus:outline-none focus:border-rose-400 resize-none"
            rows={2}
            placeholder="Dodatkowe informacje..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={closeAddGuestModal}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          >
            Anuluj
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-rose-500 hover:bg-rose-600 text-white rounded-md font-medium transition-colors"
          >
            {editing ? 'Zapisz zmiany' : 'Dodaj gościa'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
