import { useRef } from 'react';
import {
  Upload,
  Download,
  FolderOpen,
  Trash2,
  Wand2,
  Plus,
  Calendar,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { exportProject, importProject } from '../utils/export';

export default function TopBar() {
  const {
    projectName,
    projectDate,
    tables,
    guests,
    assignments,
    setProjectName,
    setProjectDate,
    openImportModal,
    openAddTableModal,
    autoAssign,
    clearAll,
    importProject: loadProject,
  } = useStore();

  const importRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    exportProject({ projectName, projectDate, tables, guests, assignments });
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await importProject(file);
    if (result.ok) {
      if (
        guests.length === 0 ||
        confirm('Zaimportowanie projektu zastąpi obecne dane. Kontynuować?')
      ) {
        loadProject(result.data);
      }
    } else {
      alert(`Błąd importu: ${result.error}`);
    }
    e.target.value = '';
  }

  function handleClearAll() {
    if (confirm('Usunąć wszystkich gości i stoły? Tej operacji nie można cofnąć.')) {
      clearAll();
    }
  }

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-3 shadow-sm flex-shrink-0">
      {/* Logo + project name */}
      <span className="text-xl select-none">💍</span>
      <input
        type="text"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        className="font-semibold text-slate-800 bg-transparent border-b-2 border-transparent hover:border-rose-300 focus:border-rose-500 focus:outline-none text-base w-52 transition-colors"
        placeholder="Nazwa projektu"
        aria-label="Nazwa projektu"
      />

      <div className="flex items-center gap-1 text-slate-500">
        <Calendar size={14} />
        <input
          type="date"
          value={projectDate}
          onChange={(e) => setProjectDate(e.target.value)}
          className="text-sm bg-transparent border-none focus:outline-none text-slate-600 cursor-pointer"
          aria-label="Data wesela"
        />
      </div>

      <div className="h-5 w-px bg-slate-200 mx-1" />

      {/* Actions */}
      <button
        onClick={() => openAddTableModal()}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-md text-sm font-medium transition-colors"
        title="Dodaj stół"
      >
        <Plus size={14} />
        Nowy stół
      </button>

      <button
        onClick={openImportModal}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-sm font-medium transition-colors"
        title="Importuj gości z Excela"
      >
        <Upload size={14} />
        Import Excel
      </button>

      <button
        onClick={autoAssign}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-sm font-medium transition-colors"
        title="Auto-rozmieść nieprzpisanych gości"
      >
        <Wand2 size={14} />
        Auto-rozmieść
      </button>

      <div className="h-5 w-px bg-slate-200 mx-1" />

      <button
        onClick={handleExport}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-sm font-medium transition-colors"
        title="Exportuj projekt do JSON"
      >
        <Download size={14} />
        Exportuj
      </button>

      <label
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-sm font-medium transition-colors cursor-pointer"
        title="Importuj projekt z JSON"
      >
        <FolderOpen size={14} />
        Wczytaj
        <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      </label>

      <div className="flex-1" />

      <button
        onClick={handleClearAll}
        className="flex items-center gap-1.5 px-2 py-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md text-sm transition-colors"
        title="Wyczyść wszystkie dane"
      >
        <Trash2 size={14} />
      </button>
    </header>
  );
}
