import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { Guest, CATEGORY_COLORS, CATEGORY_DOT, CATEGORY_LABELS } from '../types';
import { useStore } from '../store/useStore';

interface Props {
  guest: Guest;
  assignedTableName?: string;
  showTable?: boolean;
  compact?: boolean;
}

export default function GuestItem({ guest, assignedTableName, showTable = false, compact = false }: Props) {
  const { setSelectedGuest, selectedGuestId, unassignGuest, openAddGuestModal } = useStore();

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `guest-${guest.id}`,
    data: { type: 'guest', guestId: guest.id },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  const isSelected = selectedGuestId === guest.id;
  const fullName = `${guest.firstName} ${guest.lastName}`.trim();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border cursor-pointer select-none transition-colors group ${
        isSelected
          ? 'border-rose-400 bg-rose-50'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
      } ${compact ? 'text-xs' : 'text-sm'}`}
      onClick={() => setSelectedGuest(isSelected ? null : guest.id)}
      onDoubleClick={() => openAddGuestModal(guest.id)}
      role="button"
      aria-label={`Gość: ${fullName}`}
    >
      {/* Drag handle */}
      <span
        {...attributes}
        {...listeners}
        className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={14} />
      </span>

      {/* Category dot */}
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${CATEGORY_DOT[guest.category]}`} />

      {/* Name */}
      <span className="flex-1 font-medium text-slate-800 truncate">{fullName}</span>

      {/* Category badge (hidden in compact mode) */}
      {!compact && (
        <span className={`text-xs px-1.5 py-0.5 rounded border ${CATEGORY_COLORS[guest.category]} flex-shrink-0`}>
          {CATEGORY_LABELS[guest.category]}
        </span>
      )}

      {/* Table info */}
      {showTable && assignedTableName && (
        <span className="text-xs text-slate-400 flex-shrink-0">{assignedTableName}</span>
      )}

      {/* Unassign button (shown when assigned and hovering) */}
      {assignedTableName && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            unassignGuest(guest.id);
          }}
          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 flex-shrink-0 transition-opacity"
          title="Usuń z stołu"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
