import { supabase } from './supabase';
import { Table, Guest, Assignment } from '../types';

export interface ProjectData {
  projectName: string;
  projectDate: string;
  tables: Table[];
  guests: Guest[];
  assignments: Assignment[];
}

export async function loadProject(userId: string): Promise<ProjectData | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('data')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data.data as ProjectData;
}

export async function saveProject(userId: string, projectData: ProjectData): Promise<void> {
  await supabase
    .from('projects')
    .upsert({ user_id: userId, data: projectData, updated_at: new Date().toISOString() });
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function debouncedSave(userId: string, projectData: ProjectData, delayMs = 1500) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveProject(userId, projectData);
  }, delayMs);
}
