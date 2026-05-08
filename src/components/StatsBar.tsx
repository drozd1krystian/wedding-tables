import { useStore } from '../store/useStore';
import { AlertTriangle } from 'lucide-react';

export default function StatsBar() {
  const { guests, tables, assignments } = useStore();

  const totalGuests = guests.length;
  const assigned = assignments.length;
  const unassigned = totalGuests - assigned;
  const totalCapacity = tables.reduce((s, t) => s + t.seats, 0);
  const overcrowdedCount = tables.filter((t) => {
    return assignments.filter((a) => a.tableId === t.id).length > t.seats;
  }).length;
  const occupancyPct = totalCapacity > 0 ? Math.round((assigned / totalCapacity) * 100) : 0;

  return (
    <footer className="bg-white border-t border-slate-200 px-4 py-1.5 flex items-center gap-5 text-xs text-slate-500 flex-shrink-0">
      <Stat label="Goście" value={`${totalGuests}`} />
      <Stat label="Przypisani" value={`${assigned}`} color="text-green-600" />
      <Stat
        label="Nieprzypisani"
        value={`${unassigned}`}
        color={unassigned > 0 ? 'text-amber-600' : 'text-slate-400'}
      />
      <Stat label="Stoły" value={`${tables.length}`} />
      <Stat label="Pojemność sali" value={`${totalCapacity} miejsc`} />
      <Stat label="Zapełnienie" value={`${occupancyPct}%`} />

      {overcrowdedCount > 0 && (
        <span className="flex items-center gap-1 text-red-500 font-medium">
          <AlertTriangle size={11} />
          {overcrowdedCount} {overcrowdedCount === 1 ? 'stół przekroczony' : 'stoły przekroczone'}
        </span>
      )}

      <div className="flex-1" />
      <span className="text-slate-300">Planer Weselny v1.0</span>
    </footer>
  );
}

function Stat({ label, value, color = 'text-slate-700' }: { label: string; value: string; color?: string }) {
  return (
    <span>
      {label}: <span className={`font-semibold ${color}`}>{value}</span>
    </span>
  );
}
