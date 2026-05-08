import { useState } from 'react';
import {
  Edit2,
  Trash2,
  Circle,
  Square,
  Save,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { CATEGORY_COLORS, CATEGORY_DOT, CATEGORY_LABELS, GuestCategory, Table, TableShape } from '../types';
import SeatingDiagram from './SeatingDiagram';

export default function DetailsPanel() {
  const {
    selectedTableId,
    selectedGuestId,
    selectedSeat,
    tables,
    guests,
    assignments,
    updateTable,
    deleteTable,
    updateGuest,
    deleteGuest,
    unassignGuest,
    setSelectedTable,
    setSelectedGuest,
    openAddTableModal,
    openAddGuestModal,
  } = useStore();

  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const selectedGuest = guests.find((g) => g.id === selectedGuestId);

  if (selectedTable) {
    return <TableDetails
      key={`${selectedTable.id}-${selectedSeat ?? 'x'}`}
      table={selectedTable}
      initialActiveSeat={selectedSeat}
      onClose={() => setSelectedTable(null)}
      onDelete={() => { deleteTable(selectedTable.id); }}
      onEdit={() => openAddTableModal(selectedTable.id)}
      onUpdate={(updates) => updateTable(selectedTable.id, updates)}
    />;
  }

  if (selectedGuest) {
    const assignment = assignments.find((a) => a.guestId === selectedGuest.id);
    const assignedTable = assignment ? tables.find((t) => t.id === assignment.tableId) : undefined;
    return <GuestDetails
      key={selectedGuest.id}
      guest={selectedGuest}
      assignedTableName={assignedTable?.name}
      onClose={() => setSelectedGuest(null)}
      onDelete={() => { deleteGuest(selectedGuest.id); }}
      onEdit={() => openAddGuestModal(selectedGuest.id)}
      onUpdate={(updates) => updateGuest(selectedGuest.id, updates)}
      onUnassign={() => unassignGuest(selectedGuest.id)}
    />;
  }

  return <EmptyDetails />;
}

// --- Table details pane ---
interface TableDetailsProps {
  table: Table;
  initialActiveSeat?: number | null;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onUpdate: (updates: Partial<{ name: string; shape: TableShape; seats: number; notes: string }>) => void;
}

function TableDetails({ table, initialActiveSeat, onClose, onDelete, onEdit, onUpdate }: TableDetailsProps) {
  const { guests, assignments, assignGuestToSeat, unassignGuest } = useStore();
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesVal, setNotesVal] = useState(table.notes ?? '');

  // Build seating data
  const tableAssignments = assignments.filter((a) => a.tableId === table.id);
  const seatMap = new Map<number, (typeof guests)[0]>();
  const unseatedAtTable: typeof guests = [];
  for (const a of tableAssignments) {
    const g = guests.find((g) => g.id === a.guestId);
    if (!g) continue;
    if (a.seatNumber !== undefined) {
      seatMap.set(a.seatNumber, g);
    } else {
      unseatedAtTable.push(g);
    }
  }
  const assignedGuestIds = new Set(assignments.map((a) => a.guestId));
  const availableGuests = guests.filter((g) => !assignedGuestIds.has(g.id));
  const totalAtTable = tableAssignments.length;

  function handleClearSeat(seatNumber: number) {
    const g = seatMap.get(seatNumber);
    if (!g) return;
    // Keep at table but remove seatNumber (re-assign without seat)
    useStore.getState().assignGuest(g.id, table.id);
  }

  return (
    <aside className="w-72 bg-white border-l border-slate-200 flex flex-col overflow-hidden flex-shrink-0">
      <div className="px-3 py-2.5 border-b border-slate-100 flex items-center gap-2">
        {table.shape === 'round' ? <Circle size={14} className="text-rose-500" /> : <Square size={14} className="text-rose-500" />}
        <span className="font-semibold text-slate-800 flex-1 truncate text-sm">{table.name}</span>
        <button onClick={onEdit} className="text-slate-400 hover:text-slate-600" title="Edytuj"><Edit2 size={13} /></button>
        <button onClick={onDelete} className="text-slate-400 hover:text-red-500" title="Usuń"><Trash2 size={13} /></button>
        <button onClick={onClose} className="text-slate-300 hover:text-slate-500"><X size={14} /></button>
      </div>

      <div className="p-3 space-y-3 overflow-y-auto flex-1">
        {/* Capacity */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Miejsca:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdate({ seats: Math.max(1, table.seats - 1) })}
              className="w-6 h-6 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center text-base leading-none"
            >−</button>
            <span className="font-semibold text-slate-800 w-6 text-center">{table.seats}</span>
            <button
              onClick={() => onUpdate({ seats: table.seats + 1 })}
              className="w-6 h-6 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center text-base leading-none"
            >+</button>
          </div>
        </div>

        {/* Occupancy bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Zapełnienie</span>
            <span>{totalAtTable}/{table.seats}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                totalAtTable > table.seats
                  ? 'bg-red-500'
                  : totalAtTable >= table.seats * 0.8
                  ? 'bg-amber-400'
                  : 'bg-green-400'
              }`}
              style={{ width: `${Math.min(100, (totalAtTable / table.seats) * 100)}%` }}
            />
          </div>
          {totalAtTable > table.seats && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertTriangle size={11} /> Przekroczono o {totalAtTable - table.seats}
            </p>
          )}
        </div>

        {/* Shape */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Kształt:</span>
          <div className="flex rounded overflow-hidden border border-slate-200 text-xs">
            {(['rectangular', 'round'] as TableShape[]).map((s) => (
              <button
                key={s}
                onClick={() => onUpdate({ shape: s })}
                className={`px-2 py-1 transition-colors ${table.shape === s ? 'bg-rose-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                {s === 'round' ? 'Okrągły' : 'Prostokątny'}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-slate-500">Notatki:</span>
            {!editingNotes ? (
              <button onClick={() => setEditingNotes(true)} className="text-xs text-rose-500 hover:text-rose-700">Edytuj</button>
            ) : (
              <div className="flex gap-1">
                <button onClick={() => { onUpdate({ notes: notesVal }); setEditingNotes(false); }} className="text-xs text-green-600 hover:text-green-800 flex items-center gap-0.5"><Save size={10} />Zapisz</button>
                <button onClick={() => { setNotesVal(table.notes ?? ''); setEditingNotes(false); }} className="text-xs text-slate-400 hover:text-slate-600">Anuluj</button>
              </div>
            )}
          </div>
          {editingNotes ? (
            <textarea
              value={notesVal}
              onChange={(e) => setNotesVal(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-rose-400 resize-none"
              rows={3}
              placeholder="np. stół przy oknie, dostęp dla wózków..."
            />
          ) : (
            <p className="text-xs text-slate-500 italic min-h-[20px]">
              {table.notes || <span className="text-slate-300">Brak notatek</span>}
            </p>
          )}
        </div>

        {/* Seating diagram */}
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-2">
            Rozmieszczenie przy stole
          </h3>
          {totalAtTable === 0 ? (
            <p className="text-xs text-slate-400 text-center py-3 bg-slate-50 rounded-lg border border-slate-200">
              Przeciągnij gości na stół, a następnie
              przypisz ich do konkretnych miejsc
            </p>
          ) : (
            <SeatingDiagram
              table={table}
              seatMap={seatMap}
              unseatedAtTable={unseatedAtTable}
              availableGuests={availableGuests}
              onAssignToSeat={(guestId, seatNumber) => assignGuestToSeat(guestId, table.id, seatNumber)}
              onClearSeat={handleClearSeat}
              onUnassignFromTable={unassignGuest}
              initialActiveSeat={initialActiveSeat}
            />
          )}
        </div>
      </div>
    </aside>
  );
}

// --- Guest details pane ---
interface GuestDetailsProps {
  guest: { id: string; firstName: string; lastName: string; category: GuestCategory; dietaryRestrictions?: string; notes?: string };
  assignedTableName?: string;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onUpdate: (updates: Partial<{ category: GuestCategory; dietaryRestrictions: string; notes: string }>) => void;
  onUnassign: () => void;
}

function GuestDetails({ guest, assignedTableName, onClose, onDelete, onEdit, onUpdate, onUnassign }: GuestDetailsProps) {
  return (
    <aside className="w-72 bg-white border-l border-slate-200 flex flex-col overflow-hidden flex-shrink-0">
      <div className="px-3 py-2.5 border-b border-slate-100 flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${CATEGORY_DOT[guest.category]}`} />
        <span className="font-semibold text-slate-800 flex-1 truncate text-sm">
          {guest.firstName} {guest.lastName}
        </span>
        <button onClick={onEdit} className="text-slate-400 hover:text-slate-600" title="Edytuj"><Edit2 size={13} /></button>
        <button onClick={() => { if (confirm(`Usunąć gościa ${guest.firstName} ${guest.lastName}?`)) onDelete(); }} className="text-slate-400 hover:text-red-500" title="Usuń"><Trash2 size={13} /></button>
        <button onClick={onClose} className="text-slate-300 hover:text-slate-500"><X size={14} /></button>
      </div>

      <div className="p-3 space-y-3 overflow-y-auto flex-1">
        {/* Category */}
        <div>
          <label className="text-xs text-slate-500 block mb-1">Kategoria</label>
          <div className="grid grid-cols-2 gap-1">
            {(Object.keys(CATEGORY_LABELS) as GuestCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => onUpdate({ category: cat })}
                className={`text-xs py-1.5 px-2 rounded border transition-colors ${
                  guest.category === cat
                    ? CATEGORY_COLORS[cat] + ' font-medium'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${CATEGORY_DOT[cat]}`} />
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Assignment */}
        <div className="text-sm">
          <span className="text-slate-500">Stół: </span>
          {assignedTableName ? (
            <span className="font-medium text-slate-800">
              {assignedTableName}
              <button onClick={onUnassign} className="ml-2 text-xs text-red-400 hover:text-red-600">(odpnij)</button>
            </span>
          ) : (
            <span className="text-slate-400 italic">Nieprzypisany</span>
          )}
        </div>

        {/* Dietary restrictions */}
        <div>
          <label className="text-xs text-slate-500 block mb-1">Wymogi dietetyczne</label>
          <input
            type="text"
            defaultValue={guest.dietaryRestrictions ?? ''}
            onBlur={(e) => onUpdate({ dietaryRestrictions: e.target.value || undefined })}
            className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-rose-400"
            placeholder="np. wegetarianin, alergia na orzechy..."
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs text-slate-500 block mb-1">Notatki</label>
          <textarea
            defaultValue={guest.notes ?? ''}
            onBlur={(e) => onUpdate({ notes: e.target.value || undefined })}
            className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-rose-400 resize-none"
            rows={3}
            placeholder="Dodatkowe informacje..."
          />
        </div>
      </div>
    </aside>
  );
}

// --- Empty state pane ---
function EmptyDetails() {
  const { guests, tables, assignments } = useStore();
  const unassigned = guests.filter((g) => !assignments.some((a) => a.guestId === g.id)).length;
  const overcrowded = tables.filter((t) => {
    const count = assignments.filter((a) => a.tableId === t.id).length;
    return count > t.seats;
  });

  return (
    <aside className="w-72 bg-white border-l border-slate-200 flex flex-col items-center justify-center overflow-hidden flex-shrink-0 p-4">
      <div className="text-center text-slate-400">
        <div className="text-4xl mb-3">👆</div>
        <p className="text-sm font-medium text-slate-500 mb-1">Kliknij stół lub gościa</p>
        <p className="text-xs text-slate-400">aby zobaczyć szczegóły i edytować</p>
      </div>

      {overcrowded.length > 0 && (
        <div className="mt-4 w-full p-2.5 bg-red-50 rounded-lg border border-red-200">
          <p className="text-xs font-medium text-red-600 flex items-center gap-1 mb-1">
            <AlertTriangle size={12} />
            Przeciążone stoły:
          </p>
          {overcrowded.map((t) => (
            <p key={t.id} className="text-xs text-red-500">• {t.name}</p>
          ))}
        </div>
      )}

      {unassigned > 0 && (
        <div className="mt-2 w-full p-2.5 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-xs text-amber-600">
            ⚠ {unassigned} {unassigned === 1 ? 'gość nieprzypisany' : 'gości nieprzypisanych'}
          </p>
        </div>
      )}
    </aside>
  );
}
