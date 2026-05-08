import { create } from 'zustand';
import { Guest, Table, Assignment } from '../types';

interface AppStore {
  // Project
  projectName: string;
  projectDate: string;

  // Data
  tables: Table[];
  guests: Guest[];
  assignments: Assignment[];

  // UI state
  selectedTableId: string | null;
  selectedGuestId: string | null;
  selectedSeat: number | null;
  searchQuery: string;
  categoryFilter: string;
  showAllGuests: boolean;

  // Modals
  addGuestModalOpen: boolean;
  addTableModalOpen: boolean;
  importModalOpen: boolean;
  editingGuestId: string | null;
  editingTableId: string | null;

  // Project
  setProjectName: (name: string) => void;
  setProjectDate: (date: string) => void;

  // Tables
  addTable: (table: Omit<Table, 'id'>) => void;
  updateTable: (id: string, updates: Partial<Table>) => void;
  deleteTable: (id: string) => void;
  setSelectedTable: (id: string | null) => void;
  setSelectedTableAndSeat: (tableId: string, seat: number) => void;

  // Guests
  addGuest: (guest: Omit<Guest, 'id'>) => void;
  updateGuest: (id: string, updates: Partial<Guest>) => void;
  deleteGuest: (id: string) => void;
  addGuests: (guests: Omit<Guest, 'id'>[]) => void;
  setSelectedGuest: (id: string | null) => void;

  // Assignments
  assignGuest: (guestId: string, tableId: string) => void;
  assignGuestToSeat: (guestId: string, tableId: string, seatNumber: number) => void;
  unassignGuest: (guestId: string) => void;

  // UI
  setSearchQuery: (q: string) => void;
  setCategoryFilter: (c: string) => void;
  setShowAllGuests: (show: boolean) => void;

  // Modals
  openAddGuestModal: (guestId?: string) => void;
  closeAddGuestModal: () => void;
  openAddTableModal: (tableId?: string) => void;
  closeAddTableModal: () => void;
  openImportModal: () => void;
  closeImportModal: () => void;

  // Import/Export/Misc
  importProject: (data: ProjectImport) => void;
  loadProjectData: (data: ProjectImport) => void;
  autoAssign: () => void;
  clearAll: () => void;
}

interface ProjectImport {
  projectName: string;
  projectDate: string;
  tables: Table[];
  guests: Guest[];
  assignments: Assignment[];
}

export const useStore = create<AppStore>()((set, get) => ({
      // Initial state
      projectName: 'Wesele 2024',
      projectDate: new Date().toISOString().split('T')[0],
      tables: [],
      guests: [],
      assignments: [],
      selectedTableId: null,
      selectedGuestId: null,
      selectedSeat: null,
      searchQuery: '',
      categoryFilter: 'all',
      showAllGuests: false,
      addGuestModalOpen: false,
      addTableModalOpen: false,
      importModalOpen: false,
      editingGuestId: null,
      editingTableId: null,

      // Project
      setProjectName: (name) => set({ projectName: name }),
      setProjectDate: (date) => set({ projectDate: date }),

      // Tables
      addTable: (tableData) => {
        const table: Table = { ...tableData, id: crypto.randomUUID() };
        set((s) => ({ tables: [...s.tables, table] }));
      },
      updateTable: (id, updates) =>
        set((s) => ({ tables: s.tables.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),
      deleteTable: (id) =>
        set((s) => ({
          tables: s.tables.filter((t) => t.id !== id),
          assignments: s.assignments.filter((a) => a.tableId !== id),
          selectedTableId: s.selectedTableId === id ? null : s.selectedTableId,
        })),
      setSelectedTable: (id) => set({ selectedTableId: id, selectedGuestId: null, selectedSeat: null }),
      setSelectedTableAndSeat: (tableId, seat) => set({ selectedTableId: tableId, selectedGuestId: null, selectedSeat: seat }),

      // Guests
      addGuest: (guestData) => {
        const guest: Guest = { ...guestData, id: crypto.randomUUID() };
        set((s) => ({ guests: [...s.guests, guest] }));
      },
      updateGuest: (id, updates) =>
        set((s) => ({ guests: s.guests.map((g) => (g.id === id ? { ...g, ...updates } : g)) })),
      deleteGuest: (id) =>
        set((s) => ({
          guests: s.guests.filter((g) => g.id !== id),
          assignments: s.assignments.filter((a) => a.guestId !== id),
          selectedGuestId: s.selectedGuestId === id ? null : s.selectedGuestId,
        })),
      addGuests: (guestsData) => {
        const newGuests = guestsData.map((g) => ({ ...g, id: crypto.randomUUID() }));
        set((s) => ({ guests: [...s.guests, ...newGuests] }));
      },
      setSelectedGuest: (id) => set({ selectedGuestId: id, selectedTableId: null }),

      // Assignments
      assignGuest: (guestId, tableId) =>
        set((s) => ({
          assignments: [...s.assignments.filter((a) => a.guestId !== guestId), { guestId, tableId }],
        })),
      assignGuestToSeat: (guestId, tableId, seatNumber) =>
        set((s) => {
          // Remove existing assignment for this guest
          const without = s.assignments.filter((a) => a.guestId !== guestId);
          // Bump any guest already in that seat (keep them at table, no seat)
          const bumped = without.map((a) =>
            a.tableId === tableId && a.seatNumber === seatNumber
              ? { ...a, seatNumber: undefined }
              : a
          );
          return { assignments: [...bumped, { guestId, tableId, seatNumber }] };
        }),
      unassignGuest: (guestId) =>
        set((s) => ({ assignments: s.assignments.filter((a) => a.guestId !== guestId) })),

      // UI
      setSearchQuery: (q) => set({ searchQuery: q }),
      setCategoryFilter: (c) => set({ categoryFilter: c }),
      setShowAllGuests: (show) => set({ showAllGuests: show }),

      // Modals
      openAddGuestModal: (guestId) => set({ addGuestModalOpen: true, editingGuestId: guestId ?? null }),
      closeAddGuestModal: () => set({ addGuestModalOpen: false, editingGuestId: null }),
      openAddTableModal: (tableId) => set({ addTableModalOpen: true, editingTableId: tableId ?? null }),
      closeAddTableModal: () => set({ addTableModalOpen: false, editingTableId: null }),
      openImportModal: () => set({ importModalOpen: true }),
      closeImportModal: () => set({ importModalOpen: false }),

      // Auto-assign: distribute unassigned guests to tables with available seats
      autoAssign: () => {
        const { guests, tables, assignments } = get();
        const assignedGuestIds = new Set(assignments.map((a) => a.guestId));
        const unassigned = guests.filter((g) => !assignedGuestIds.has(g.id));

        if (unassigned.length === 0 || tables.length === 0) return;

        const newAssignments = [...assignments];

        // Calculate current occupancy per table
        const occupancy = new Map<string, number>();
        for (const t of tables) occupancy.set(t.id, 0);
        for (const a of newAssignments) {
          occupancy.set(a.tableId, (occupancy.get(a.tableId) ?? 0) + 1);
        }

        // Group unassigned by category, assign category-matching tables first
        const categories = ['family', 'friends', 'work', 'other'] as const;
        const byCategory = new Map<string, typeof unassigned>();
        for (const cat of categories) byCategory.set(cat, []);
        for (const g of unassigned) byCategory.get(g.category)!.push(g);

        const remaining: typeof unassigned = [];
        for (const cat of categories) {
          for (const guest of byCategory.get(cat)!) {
            // Find table with most available seats (greedy)
            const available = tables
              .filter((t) => (occupancy.get(t.id) ?? 0) < t.seats)
              .sort((a, b) => (occupancy.get(b.id) ?? 0) - (occupancy.get(a.id) ?? 0));
            if (available.length > 0) {
              const table = available[available.length - 1]; // table with fewest occupants relative to seats
              newAssignments.push({ guestId: guest.id, tableId: table.id });
              occupancy.set(table.id, (occupancy.get(table.id) ?? 0) + 1);
            } else {
              remaining.push(guest);
            }
          }
        }

        set({ assignments: newAssignments });
        if (remaining.length > 0) {
          alert(`Nie udało się przypisać ${remaining.length} gości – brak wolnych miejsc przy stołach.`);
        }
      },

      // Import project
      importProject: (data) =>
        set({
          projectName: data.projectName,
          projectDate: data.projectDate,
          tables: data.tables,
          guests: data.guests,
          assignments: data.assignments,
          selectedTableId: null,
          selectedGuestId: null,
          selectedSeat: null,
        }),

      loadProjectData: (data) =>
        set({
          projectName: data.projectName,
          projectDate: data.projectDate,
          tables: data.tables,
          guests: data.guests,
          assignments: data.assignments,
        }),

      clearAll: () =>
        set({ tables: [], guests: [], assignments: [], selectedTableId: null, selectedGuestId: null, selectedSeat: null }),
    }));
