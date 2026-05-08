import { ProjectData, Table, Guest, Assignment } from '../types';

export function exportProject(data: Omit<ProjectData, 'version' | 'exportedAt'>): void {
  const payload: ProjectData = {
    ...data,
    version: '1.0',
    exportedAt: new Date().toISOString(),
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const safeName = data.projectName.replace(/[^a-z0-9ąćęłńóśźż\s]/gi, '').trim().replace(/\s+/g, '_') || 'wesele';
  const dateStr = data.projectDate || new Date().toISOString().split('T')[0];

  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName}_${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export type ImportResult =
  | { ok: true; data: { projectName: string; projectDate: string; tables: Table[]; guests: Guest[]; assignments: Assignment[] } }
  | { ok: false; error: string };

export function importProject(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target!.result as string;
        const parsed = JSON.parse(text) as Partial<ProjectData>;

        if (!Array.isArray(parsed.tables) || !Array.isArray(parsed.guests) || !Array.isArray(parsed.assignments)) {
          resolve({ ok: false, error: 'Nieprawidłowy format pliku projektu.' });
          return;
        }

        resolve({
          ok: true,
          data: {
            projectName: parsed.projectName ?? 'Zaimportowany projekt',
            projectDate: parsed.projectDate ?? new Date().toISOString().split('T')[0],
            tables: parsed.tables,
            guests: parsed.guests,
            assignments: parsed.assignments,
          },
        });
      } catch {
        resolve({ ok: false, error: 'Nie można odczytać pliku JSON.' });
      }
    };

    reader.onerror = () => resolve({ ok: false, error: 'Błąd odczytu pliku.' });
    reader.readAsText(file, 'utf-8');
  });
}
