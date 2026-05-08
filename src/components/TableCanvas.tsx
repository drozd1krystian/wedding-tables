import { useRef } from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '../store/useStore';
import TableCard from './TableCard';

const CANVAS_WIDTH = 3000;
const CANVAS_HEIGHT = 2000;

export default function TableCanvas() {
  const { tables, guests, assignments, setSelectedTable, addTable, openAddTableModal } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const guestById = new Map(guests.map((g) => [g.id, g]));

  const guestsByTable = new Map<string, typeof guests>();
  for (const table of tables) guestsByTable.set(table.id, []);
  for (const a of assignments) {
    const g = guestById.get(a.guestId);
    if (g) guestsByTable.get(a.tableId)?.push(g);
  }

  function handleCanvasDoubleClick(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('.table-card, button, input')) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left - 90, CANVAS_WIDTH - 600));
    const y = Math.max(0, Math.min(e.clientY - rect.top - 60, CANVAS_HEIGHT - 300));

    const tableNum = tables.length + 1;
    addTable({
      name: `Stół ${tableNum}`,
      shape: 'rectangular',
      seats: 8,
      x,
      y,
    });
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement) === e.currentTarget) {
      setSelectedTable(null);
    }
  }

  return (
    <main className="flex-1 overflow-auto bg-slate-100 relative">
      {/* Canvas */}
      <div
        ref={containerRef}
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        className="relative canvas-grid cursor-default"
        onClick={handleCanvasClick}
        onDoubleClick={handleCanvasDoubleClick}
        aria-label="Sala weselna — dwuklik aby dodać stół"
      >
        {tables.map((table) => (
          <TableCard key={table.id} table={table} assignedGuests={guestsByTable.get(table.id) ?? []} />
        ))}

        {tables.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-center text-slate-400 select-none">
              <div className="text-5xl mb-3 opacity-30">🪑</div>
              <p className="text-base font-medium opacity-60 mb-1">Sala jest pusta</p>
              <p className="text-sm opacity-40">Dwuklik aby dodać stół lub użyj przycisku „Nowy stół"</p>
            </div>
          </div>
        )}
      </div>

      {/* Add table FAB */}
      <button
        onClick={() => openAddTableModal()}
        className="fixed bottom-12 right-4 w-10 h-10 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-20"
        title="Dodaj stół (lub dwuklik na sali)"
      >
        <Plus size={20} />
      </button>
    </main>
  );
}
