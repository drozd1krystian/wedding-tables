export type GuestCategory = 'family' | 'friends' | 'work' | 'other';

export const CATEGORY_LABELS: Record<GuestCategory, string> = {
  family: 'Rodzina',
  friends: 'Przyjaciele',
  work: 'Znajomi z pracy',
  other: 'Inne',
};

export const CATEGORY_COLORS: Record<GuestCategory, string> = {
  family: 'bg-blue-100 text-blue-700 border-blue-200',
  friends: 'bg-green-100 text-green-700 border-green-200',
  work: 'bg-amber-100 text-amber-700 border-amber-200',
  other: 'bg-gray-100 text-gray-600 border-gray-200',
};

export const CATEGORY_DOT: Record<GuestCategory, string> = {
  family: 'bg-blue-500',
  friends: 'bg-green-500',
  work: 'bg-amber-500',
  other: 'bg-gray-400',
};

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  category: GuestCategory;
  dietaryRestrictions?: string;
  notes?: string;
}

export type TableShape = 'round' | 'rectangular';

export interface Table {
  id: string;
  name: string;
  shape: TableShape;
  seats: number;
  x: number;
  y: number;
  notes?: string;
}

export interface Assignment {
  guestId: string;
  tableId: string;
  seatNumber?: number; // 1-based seat position
}

export interface ProjectData {
  projectName: string;
  projectDate: string;
  tables: Table[];
  guests: Guest[];
  assignments: Assignment[];
  version: string;
  exportedAt: string;
}
