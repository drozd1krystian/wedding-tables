import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Trash2, AlertTriangle, Circle, Square } from 'lucide-react';
import { Table, Guest, CATEGORY_DOT } from '../types';
import { useStore } from '../store/useStore';
import { computeLayout } from '../utils/seatingLayout';

interface Props {
  table: Table;
  assignedGuests: Guest[];
}

// Per-seat droppable circle rendered on canvas
interface CanvasSeatProps {
  tableId: string;
  seatNumber: number;
  guest?: Guest;
  x: number;
  y: number;
  r: number;
  onSeatClick: (n: number) => void;
}

function CanvasSeat({ tableId, seatNumber, guest, x, y, r, onSeatClick }: CanvasSeatProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `seat-${tableId}-${seatNumber}`,
    data: { type: 'seat', tableId, seatNumber },
  });

  const d = r * 2;
  const fontSize = Math.max(9, r - 4);
  const dotSize = Math.max(4, r - 9);
  const initials = guest
    ? `${guest.firstName[0] ?? ''}${guest.lastName?.[0] ?? ''}`.toUpperCase()
    : String(seatNumber);

  const cls =
    'absolute rounded-full border-2 flex flex-col items-center justify-center select-none transition-colors cursor-pointer ' +
    (isOver
      ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-300'
      : guest
      ? 'bg-white border-slate-400 hover:border-rose-400 shadow-sm'
      : 'bg-slate-100 border-slate-300 hover:border-rose-400 hover:bg-rose-50');

  return (
    <button
      ref={setNodeRef}
      className={cls}
      style={{ left: x - r, top: y - r, width: d, height: d }}
      onClick={(e) => { e.stopPropagation(); onSeatClick(seatNumber); }}
      title={guest ? `Miejsce ${seatNumber}: ${guest.firstName} ${guest.lastName}` : `Miejsce ${seatNumber} – puste`}
    >
      {guest ? (
        <>
          <span
            className={`rounded-full flex-shrink-0 ${CATEGORY_DOT[guest.category]}`}
            style={{ width: dotSize, height: dotSize, marginBottom: 1 }}
          />
          <span className="font-bold leading-none text-slate-700 pointer-events-none" style={{ fontSize }}>
            {initials}
          </span>
        </>
      ) : (
        <span className="font-medium leading-none text-slate-400 pointer-events-none" style={{ fontSize }}>
          {seatNumber}
        </span>
      )}
    </button>
  );
}

export default function TableCard({ table, assignedGuests }: Props) {
  const {
    selectedTableId,
    setSelectedTable,
    setSelectedTableAndSeat,
    deleteTable,
    openAddTableModal,
    assignments,
  } = useStore();

  // Draggable for moving the table on canvas
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging: isMoving,
  } = useDraggable({
    id: `table-move-${table.id}`,
    data: { type: 'table-move', tableId: table.id },
  });

  // Droppable for receiving guests (without specific seat)
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `table-drop-${table.id}`,
    data: { type: 'table', tableId: table.id },
  });

  const setRef = (el: HTMLDivElement | null) => {
    setDragRef(el);
    setDropRef(el);
  };

  const isSelected = selectedTableId === table.id;
  const occupancy = assignedGuests.length;
  const isOverCapacity = occupancy > table.seats;
  const useDiagram = table.seats <= 50;

  // Build seat map from assignments
  const seatMap = new Map<number, Guest>();
  let unseatedCount = 0;
  for (const g of assignedGuests) {
    const a = assignments.find((a) => a.guestId === g.id && a.tableId === table.id);
    if (a?.seatNumber !== undefined) {
      seatMap.set(a.seatNumber, g);
    } else {
      unseatedCount++;
    }
  }

  const layout = computeLayout(table);
  const cardW = layout.containerW + 4;

  const borderColor = isSelected
    ? 'border-rose-400 ring-2 ring-rose-200'
    : isOver
    ? 'border-blue-400 ring-2 ring-blue-200'
    : isOverCapacity
    ? 'border-red-300'
    : 'border-slate-200 hover:border-slate-300';

  return (
    <div
      ref={setRef}
      style={{
        position: 'absolute',
        left: table.x,
        top: table.y,
        transform: CSS.Translate.toString(transform),
        zIndex: isMoving ? 50 : isSelected ? 10 : 1,
        width: cardW,
        opacity: isMoving ? 0.8 : 1,
      }}
      className={`bg-white rounded-xl border-2 shadow-md select-none table-card-shadow transition-shadow ${borderColor}`}
      onClick={(e) => { e.stopPropagation(); setSelectedTable(isSelected ? null : table.id); }}
    >
      {/* Header */}
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded-t-xl border-b border-slate-100 ${
          isSelected ? 'bg-rose-50' : isOver ? 'bg-blue-50' : 'bg-slate-50'
        }`}
      >
        <span
          {...attributes}
          {...listeners}
          className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
          title="Przesuń stół"
        >
          <GripVertical size={13} />
        </span>

        {table.shape === 'round' ? (
          <Circle size={11} className="text-slate-400 flex-shrink-0" />
        ) : (
          <Square size={11} className="text-slate-400 flex-shrink-0" />
        )}

        <span className="text-xs font-semibold text-slate-700 flex-1 truncate">{table.name}</span>

        <span
          className={`text-xs px-1.5 py-0.5 rounded border font-medium flex-shrink-0 ${
            isOverCapacity
              ? 'text-red-600 bg-red-50 border-red-300'
              : occupancy >= table.seats * 0.8
              ? 'text-amber-600 bg-amber-50 border-amber-200'
              : 'text-green-600 bg-green-50 border-green-200'
          }`}
        >
          {occupancy}/{table.seats}
        </span>

        <button
          onClick={(e) => { e.stopPropagation(); openAddTableModal(table.id); }}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          title="Edytuj"
        >
          <Edit2 size={11} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (assignedGuests.length > 0 && !confirm(`Usunąć stół "${table.name}"? Goście zostaną odpięci.`)) return;
            deleteTable(table.id);
          }}
          className="text-slate-400 hover:text-red-500 transition-colors"
          title="Usuń"
        >
          <Trash2 size={11} />
        </button>
      </div>

      {/* Warnings */}
      {isOverCapacity && (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-red-50 border-b border-red-100 text-xs text-red-500">
          <AlertTriangle size={10} /> Przeciążony o {occupancy - table.seats}
        </div>
      )}
      {unseatedCount > 0 && (
        <div className="px-2 py-0.5 bg-amber-50 border-b border-amber-100 text-xs text-amber-600">
          ⚠ {unseatedCount} bez miejsca – kliknij stół aby przypisać
        </div>
      )}
      {isOver && (
        <div className="px-2 py-0.5 bg-blue-50 border-b border-blue-100 text-xs text-blue-500 text-center">
          Upuść aby przypisać
        </div>
      )}
      {table.notes && (
        <div className="px-2 py-0.5 text-xs text-slate-400 italic border-b border-slate-100 bg-slate-50/50 truncate">
          {table.notes}
        </div>
      )}

      {/* Seating diagram */}
      <div className="p-1">
        {useDiagram ? (
          <div
            className="relative"
            style={{ width: layout.containerW, height: layout.containerH }}
          >
            {/* Table surface */}
            <div
              className="absolute bg-amber-50 border-2 border-amber-300 flex items-center justify-center"
              style={{
                left: layout.tableShape.x,
                top: layout.tableShape.y,
                width: layout.tableShape.w,
                height: layout.tableShape.h,
                borderRadius: layout.tableShape.round ? '50%' : 4,
              }}
            >
              <span
                className="text-amber-700 font-semibold text-center leading-tight px-1 pointer-events-none"
                style={{ fontSize: Math.max(10, Math.min(14, layout.tableShape.w / 5)) }}
              >
                {table.name}
              </span>
            </div>

            {/* Seat circles */}
            {layout.positions.map((pos, idx) => (
              <CanvasSeat
                key={idx + 1}
                tableId={table.id}
                seatNumber={idx + 1}
                guest={seatMap.get(idx + 1)}
                x={pos.x}
                y={pos.y}
                r={layout.seatR}
                onSeatClick={(n) => setSelectedTableAndSeat(table.id, n)}
              />
            ))}
          </div>
        ) : (
          /* Compact list for >24 seats */
          <div className="py-1 space-y-0.5 max-h-40 overflow-y-auto">
            {assignedGuests.length === 0 ? (
              <p className="text-center text-xs text-slate-300 py-2">Przeciągnij gości tutaj</p>
            ) : (
              assignedGuests.map((g) => {
                const a = assignments.find((x) => x.guestId === g.id && x.tableId === table.id);
                return (
                  <div key={g.id} className="flex items-center gap-1.5 px-1 text-xs">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${CATEGORY_DOT[g.category]}`} />
                    <span className="text-slate-400 w-4 text-right flex-shrink-0">{a?.seatNumber ?? '–'}</span>
                    <span className="text-slate-700 truncate">{g.firstName} {g.lastName}</span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

