import { useDroppable } from '@dnd-kit/core';
import { Search, UserPlus, Users, UserX } from 'lucide-react';
import { useStore } from '../store/useStore';
import { CATEGORY_LABELS } from '../types';
import GuestItem from './GuestItem';

const CATEGORIES: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Wszystkie' },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
];

export default function GuestPanel() {
  const {
    guests,
    assignments,
    tables,
    searchQuery,
    categoryFilter,
    showAllGuests,
    setSearchQuery,
    setCategoryFilter,
    setShowAllGuests,
    openAddGuestModal,
  } = useStore();

  // Unassign drop zone
  const { setNodeRef: setUnassignedRef, isOver: isOverUnassigned } = useDroppable({
    id: 'unassigned-zone',
    data: { type: 'unassigned-zone' },
  });

  const assignedGuestIds = new Set(assignments.map((a) => a.guestId));
  const tableById = new Map(tables.map((t) => [t.id, t]));
  const tableByGuestId = new Map(assignments.map((a) => [a.guestId, a.tableId]));

  const unassignedCount = guests.filter((g) => !assignedGuestIds.has(g.id)).length;

  const filtered = guests.filter((g) => {
    if (!showAllGuests && assignedGuestIds.has(g.id)) return false;
    if (categoryFilter !== 'all' && g.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = `${g.firstName} ${g.lastName}`.toLowerCase();
      if (!name.includes(q)) return false;
    }
    return true;
  });

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-slate-700 text-sm flex items-center gap-1.5">
            <Users size={15} />
            Goście
            <span className="ml-1 text-xs font-normal text-slate-400">
              ({unassignedCount} wolnych / {guests.length})
            </span>
          </h2>
          <button
            onClick={() => openAddGuestModal()}
            className="flex items-center gap-1 px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded text-xs font-medium transition-colors"
            title="Dodaj gościa"
          >
            <UserPlus size={12} />
            Dodaj
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Szukaj gościa..."
            className="w-full pl-7 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-rose-400 bg-slate-50"
          />
        </div>

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-slate-50 focus:outline-none focus:border-rose-400 text-slate-600 mb-2"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        {/* Toggle all/unassigned */}
        <div className="flex rounded-md overflow-hidden border border-slate-200 text-xs">
          <button
            onClick={() => setShowAllGuests(false)}
            className={`flex-1 py-1 flex items-center justify-center gap-1 transition-colors ${
              !showAllGuests ? 'bg-rose-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            <UserX size={11} />
            Nieprzypisani ({unassignedCount})
          </button>
          <button
            onClick={() => setShowAllGuests(true)}
            className={`flex-1 py-1 flex items-center justify-center gap-1 transition-colors ${
              showAllGuests ? 'bg-rose-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Users size={11} />
            Wszyscy ({guests.length})
          </button>
        </div>
      </div>

      {/* Guest list — droppable unassign zone */}
      <div
        ref={setUnassignedRef}
        className={`flex-1 overflow-y-auto p-2 space-y-1 transition-colors ${
          isOverUnassigned ? 'bg-rose-50' : ''
        }`}
      >
        {isOverUnassigned && (
          <div className="text-center text-xs text-rose-500 py-1 font-medium">
            Upuść tutaj aby odpiąć od stołu
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center text-slate-400 text-xs py-8">
            {guests.length === 0 ? (
              <>
                <Users size={24} className="mx-auto mb-2 opacity-30" />
                Brak gości. Dodaj gości ręcznie lub zaimportuj z Excela.
              </>
            ) : (
              'Brak pasujących gości'
            )}
          </div>
        ) : (
          filtered.map((guest) => {
            const tableId = tableByGuestId.get(guest.id);
            const table = tableId ? tableById.get(tableId) : undefined;
            return (
              <GuestItem
                key={guest.id}
                guest={guest}
                assignedTableName={table?.name}
                showTable={showAllGuests}
              />
            );
          })
        )}
      </div>

      {/* Dietary alerts */}
      {guests.some((g) => g.dietaryRestrictions) && (
        <div className="px-3 py-2 border-t border-slate-100 bg-amber-50 text-xs text-amber-700">
          ⚠{' '}
          {guests.filter((g) => g.dietaryRestrictions).length} gości ma wymogi dietetyczne
        </div>
      )}
    </aside>
  );
}
