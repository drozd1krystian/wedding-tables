import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Search, X } from 'lucide-react';
import { Table, Guest, CATEGORY_DOT } from '../types';
import { computeLayout, SeatPos } from '../utils/seatingLayout';

// ---- Seat circle ----

interface SeatCircleProps {
  tableId: string;
  seatNumber: number;
  guest?: Guest;
  seatR: number;
  pos: SeatPos;
  isActive: boolean;
  onClick: () => void;
}

function SeatCircle({ tableId, seatNumber, guest, seatR, pos, isActive, onClick }: SeatCircleProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `seat-${tableId}-${seatNumber}`,
    data: { type: 'seat', tableId, seatNumber },
  });

  const d = seatR * 2;
  const fontSize = Math.max(8, seatR - 6);
  const initials = guest
    ? `${guest.firstName[0] ?? ''}${guest.lastName?.[0] ?? ''}`.toUpperCase()
    : String(seatNumber);

  const bg = isOver
    ? 'bg-blue-100 border-blue-500'
    : isActive
    ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-200'
    : guest
    ? 'bg-white border-slate-500 hover:border-slate-700 shadow-sm'
    : 'bg-slate-50 border-slate-300 hover:border-rose-400 hover:bg-rose-50';

  return (
    <button
      ref={setNodeRef}
      className={`absolute rounded-full flex flex-col items-center justify-center border-2 cursor-pointer select-none transition-all ${bg}`}
      style={{ left: pos.x - seatR, top: pos.y - seatR, width: d, height: d, zIndex: isActive ? 10 : 1 }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={guest ? `Miejsce ${seatNumber}: ${guest.firstName} ${guest.lastName}` : `Miejsce ${seatNumber} (puste)`}
    >
      {guest ? (
        <>
          <span
            className={`rounded-full flex-shrink-0 ${CATEGORY_DOT[guest.category]}`}
            style={{ width: Math.max(4, seatR - 12), height: Math.max(4, seatR - 12), marginBottom: 1 }}
          />
          <span className="font-bold leading-none text-slate-700" style={{ fontSize }}>
            {initials}
          </span>
        </>
      ) : (
        <span className="font-medium leading-none text-slate-400" style={{ fontSize }}>
          {seatNumber}
        </span>
      )}
    </button>
  );
}

// ---- Main component ----

export interface SeatingDiagramProps {
  table: Table;
  /** seatNumber → Guest */
  seatMap: Map<number, Guest>;
  /** Assigned to table but no seatNumber yet */
  unseatedAtTable: Guest[];
  /** Not assigned to any table */
  availableGuests: Guest[];
  onAssignToSeat: (guestId: string, seatNumber: number) => void;
  onClearSeat: (seatNumber: number) => void;
  onUnassignFromTable: (guestId: string) => void;
  /** Pre-select a seat when the diagram mounts */
  initialActiveSeat?: number | null;
}

export default function SeatingDiagram({
  table,
  seatMap,
  unseatedAtTable,
  availableGuests,
  onAssignToSeat,
  onClearSeat,
  onUnassignFromTable,
  initialActiveSeat,
}: SeatingDiagramProps) {
  const [activeSeat, setActiveSeat] = useState<number | null>(initialActiveSeat ?? null);
  const [search, setSearch] = useState('');

  const layout = computeLayout(table, 260);
  const activeGuest = activeSeat !== null ? seatMap.get(activeSeat) : undefined;

  // Guests available for picking: unseated at this table + fully unassigned
  const pickable = [...unseatedAtTable, ...availableGuests].filter((g) => {
    if (!search) return true;
    return `${g.firstName} ${g.lastName}`.toLowerCase().includes(search.toLowerCase());
  });

  function handleSeatClick(n: number) {
    setActiveSeat(activeSeat === n ? null : n);
    setSearch('');
  }

  // For large seat counts: show a text list instead of diagram
  if (table.seats > 50) {
    return (
      <div className="text-xs text-slate-500 p-2 bg-slate-50 rounded-lg border border-slate-200">
        Diagram dostępny dla stołów do 50 miejsc.
        <div className="mt-2 space-y-1">
          {Array.from({ length: table.seats }, (_, i) => {
            const g = seatMap.get(i + 1);
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 text-right text-slate-400">{i + 1}.</span>
                {g ? (
                  <>
                    <span className={`w-1.5 h-1.5 rounded-full ${CATEGORY_DOT[g.category]}`} />
                    <span className="text-slate-700">{g.firstName} {g.lastName}</span>
                  </>
                ) : (
                  <span className="text-slate-300 italic">puste</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Diagram */}
      <div
        className="relative mx-auto rounded-xl border border-slate-200 bg-slate-50"
        style={{ width: layout.containerW, height: layout.containerH }}
        onClick={() => setActiveSeat(null)}
      >
        {/* Table shape */}
        <div
          className="absolute bg-amber-50 border-2 border-amber-300 flex items-center justify-center"
          style={{
            left: layout.tableShape.x,
            top: layout.tableShape.y,
            width: layout.tableShape.w,
            height: layout.tableShape.h,
            borderRadius: layout.tableShape.round ? '50%' : 6,
          }}
        >
          <span
            className="text-amber-600 font-semibold pointer-events-none text-center leading-tight px-1"
            style={{ fontSize: Math.max(9, Math.min(13, layout.tableShape.w / 7)) }}
          >
            {table.name}
          </span>
        </div>

        {/* Seat circles */}
        {layout.positions.map((pos, idx) => {
          const seatNumber = idx + 1;
          return (
            <SeatCircle
              key={seatNumber}
              tableId={table.id}
              seatNumber={seatNumber}
              guest={seatMap.get(seatNumber)}
              seatR={layout.seatR}
              pos={pos}
              isActive={activeSeat === seatNumber}
              onClick={() => handleSeatClick(seatNumber)}
            />
          );
        })}
      </div>

      {/* Legend */}
      <p className="text-center text-xs text-slate-400 mt-1 mb-2">
        Kliknij miejsce lub przeciągnij gościa z listy
      </p>

      {/* Active seat panel */}
      {activeSeat !== null && (
        <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 mb-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-700">
              Miejsce nr {activeSeat}
            </span>
            <button
              onClick={() => setActiveSeat(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={12} />
            </button>
          </div>

          {activeGuest ? (
            <div>
              <div className="flex items-center gap-2 p-1.5 bg-white rounded border border-slate-200 mb-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${CATEGORY_DOT[activeGuest.category]}`} />
                <span className="text-sm font-medium text-slate-800 flex-1">
                  {activeGuest.firstName} {activeGuest.lastName}
                </span>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => { onClearSeat(activeSeat); setActiveSeat(null); }}
                  className="flex-1 text-xs py-1 px-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded border border-amber-200 transition-colors"
                >
                  Usuń z miejsca
                </button>
                <button
                  onClick={() => { onUnassignFromTable(activeGuest.id); setActiveSeat(null); }}
                  className="flex-1 text-xs py-1 px-2 bg-red-50 hover:bg-red-100 text-red-600 rounded border border-red-200 transition-colors"
                >
                  Usuń ze stołu
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs text-slate-500 mb-1.5">Wybierz gościa dla tego miejsca:</p>
              <div className="relative mb-1.5">
                <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-6 pr-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:border-rose-400 bg-white"
                  placeholder="Szukaj..."
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="max-h-36 overflow-y-auto space-y-0.5">
                {pickable.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">Brak dostępnych gości</p>
                ) : (
                  pickable.map((g) => (
                    <button
                      key={g.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAssignToSeat(g.id, activeSeat);
                        setActiveSeat(null);
                        setSearch('');
                      }}
                      className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-xs hover:bg-white hover:border hover:border-slate-200 text-left transition-colors"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${CATEGORY_DOT[g.category]}`} />
                      <span className="font-medium text-slate-700">
                        {g.firstName} {g.lastName}
                      </span>
                      {unseatedAtTable.some((u) => u.id === g.id) && (
                        <span className="ml-auto text-slate-400">przy stole</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Unseated at table — need manual placement */}
      {unseatedAtTable.length > 0 && (
        <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-xs font-medium text-amber-700 mb-1">
            ⚠ {unseatedAtTable.length}{' '}
            {unseatedAtTable.length === 1 ? 'gość bez miejsca' : 'gości bez miejsca'}
          </p>
          <div className="space-y-0.5">
            {unseatedAtTable.map((g) => (
              <div
                key={g.id}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-white border border-amber-100 text-xs"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${CATEGORY_DOT[g.category]}`} />
                <span className="text-slate-700 flex-1">
                  {g.firstName} {g.lastName}
                </span>
                <button
                  onClick={() => onUnassignFromTable(g.id)}
                  className="text-slate-400 hover:text-red-500"
                  title="Usuń ze stołu"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
