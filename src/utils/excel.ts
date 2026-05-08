import * as XLSX from 'xlsx';
import { Guest, GuestCategory } from '../types';

export interface ParsedRow {
  firstName: string;
  lastName: string;
  category: GuestCategory;
  dietaryRestrictions?: string;
  notes?: string;
}

export interface ParseResult {
  rows: ParsedRow[];
  errors: string[];
}

const CATEGORY_MAP: Record<string, GuestCategory> = {
  rodzina: 'family',
  family: 'family',
  przyjaciele: 'friends',
  friends: 'friends',
  znajomi: 'friends',
  praca: 'work',
  work: 'work',
  inne: 'other',
  other: 'other',
};

function normalizeCategory(raw: string): GuestCategory {
  const key = (raw ?? '').toLowerCase().trim();
  return CATEGORY_MAP[key] ?? 'other';
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

export function parseFile(file: File): Promise<{ headers: string[]; rawRows: string[][] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', codepage: 65001 });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' });

        if (rows.length === 0) {
          resolve({ headers: [], rawRows: [] });
          return;
        }

        const headers = (rows[0] as string[]).map(String);
        const rawRows = rows.slice(1).map((r) => (r as string[]).map(String));
        resolve({ headers, rawRows });
      } catch (err) {
        reject(new Error(`Nie można odczytać pliku: ${err}`));
      }
    };

    reader.onerror = () => reject(new Error('Błąd odczytu pliku'));
    reader.readAsArrayBuffer(file);
  });
}

export function buildGuests(
  rawRows: string[][],
  columnMapping: {
    fullName?: number;
    firstName?: number;
    lastName?: number;
    category?: number;
    dietary?: number;
    notes?: number;
  }
): ParseResult {
  const rows: ParsedRow[] = [];
  const errors: string[] = [];

  rawRows.forEach((row, idx) => {
    const lineNum = idx + 2; // 1-based + header row

    let firstName = '';
    let lastName = '';

    if (columnMapping.fullName !== undefined && columnMapping.fullName >= 0) {
      const full = (row[columnMapping.fullName] ?? '').trim();
      if (!full) {
        errors.push(`Wiersz ${lineNum}: brak imienia i nazwiska`);
        return;
      }
      const split = splitName(full);
      firstName = split.firstName;
      lastName = split.lastName;
    } else {
      firstName = (row[columnMapping.firstName ?? -1] ?? '').trim();
      lastName = (row[columnMapping.lastName ?? -1] ?? '').trim();
      if (!firstName && !lastName) {
        errors.push(`Wiersz ${lineNum}: brak imienia i nazwiska`);
        return;
      }
    }

    const categoryRaw = columnMapping.category !== undefined ? row[columnMapping.category] : '';
    const dietary = columnMapping.dietary !== undefined ? (row[columnMapping.dietary] ?? '').trim() : '';
    const notes = columnMapping.notes !== undefined ? (row[columnMapping.notes] ?? '').trim() : '';

    rows.push({
      firstName,
      lastName,
      category: normalizeCategory(categoryRaw ?? ''),
      dietaryRestrictions: dietary || undefined,
      notes: notes || undefined,
    });
  });

  return { rows, errors };
}

export function parsedRowToGuest(row: ParsedRow): Omit<Guest, 'id'> {
  return {
    firstName: row.firstName,
    lastName: row.lastName,
    category: row.category,
    dietaryRestrictions: row.dietaryRestrictions,
    notes: row.notes,
  };
}
