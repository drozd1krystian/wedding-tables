import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useState } from 'react';
import { useStore } from './store/useStore';
import TopBar from './components/TopBar';
import GuestPanel from './components/GuestPanel';
import TableCanvas from './components/TableCanvas';
import DetailsPanel from './components/DetailsPanel';
import StatsBar from './components/StatsBar';
import AddGuestModal from './components/AddGuestModal';
import AddTableModal from './components/AddTableModal';
import ImportModal from './components/ImportModal';
import { CATEGORY_DOT } from './types';

export default function App() {
  const { assignGuest, assignGuestToSeat, unassignGuest, updateTable, tables, guests, addGuestModalOpen, addTableModalOpen, importModalOpen } =
    useStore();

  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragStart({ active }: DragStartEvent) {
    setActiveDragId(active.id as string);
  }

  function handleDragEnd({ active, over, delta }: DragEndEvent) {
    setActiveDragId(null);
    const activeData = active.data.current;

    if (activeData?.type === 'table-move') {
      // Reposition table
      const table = tables.find((t) => t.id === activeData.tableId);
      if (table) {
        updateTable(table.id, {
          x: Math.max(0, table.x + delta.x),
          y: Math.max(0, table.y + delta.y),
        });
      }
      return;
    }

    if (activeData?.type === 'guest') {
      const guestId: string = activeData.guestId;
      const overData = over?.data.current;

      if (overData?.type === 'seat') {
        assignGuestToSeat(guestId, overData.tableId, overData.seatNumber);
      } else if (overData?.type === 'table') {
        assignGuest(guestId, overData.tableId);
      } else if (overData?.type === 'unassigned-zone') {
        unassignGuest(guestId);
      }
    }
  }

  // Overlay guest card during drag
  const draggingGuest = activeDragId?.startsWith('guest-')
    ? guests.find((g) => g.id === activeDragId.replace('guest-', ''))
    : null;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <TopBar />

        <div className="flex flex-1 overflow-hidden">
          <GuestPanel />
          <TableCanvas />
          <DetailsPanel />
        </div>

        <StatsBar />

        {/* Drag overlay — floating guest badge */}
        <DragOverlay dropAnimation={null}>
          {draggingGuest && (
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white shadow-xl text-sm font-medium text-slate-800 pointer-events-none`}
            >
              <span className={`w-2 h-2 rounded-full ${CATEGORY_DOT[draggingGuest.category]}`} />
              {draggingGuest.firstName} {draggingGuest.lastName}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Modals */}
      {addGuestModalOpen && <AddGuestModal />}
      {addTableModalOpen && <AddTableModal />}
      {importModalOpen && <ImportModal />}
    </div>
  );
}
