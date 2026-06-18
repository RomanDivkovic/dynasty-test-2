import type { CareerSave } from "../types/domain";

const SAVE_INDEX_KEY = "bdm.saveSlots";

export interface SaveSlot {
  id: string;
  name: string;
  savedAt: string;
  selectedTeamId: string;
  seasonYear: number;
}

function slotKey(id: string) {
  return `bdm.save.${id}`;
}

export function listSaveSlots(): SaveSlot[] {
  try {
    return JSON.parse(localStorage.getItem(SAVE_INDEX_KEY) ?? "[]") as SaveSlot[];
  } catch {
    return [];
  }
}

export function saveCareer(career: CareerSave) {
  const savedAt = new Date().toISOString();
  const payload = { ...career, savedAt };
  localStorage.setItem(slotKey(career.id), JSON.stringify(payload));

  const slots = listSaveSlots().filter((slot) => slot.id !== career.id);
  slots.unshift({
    id: career.id,
    name: career.name,
    savedAt,
    selectedTeamId: career.selectedTeamId,
    seasonYear: career.season.year,
  });
  localStorage.setItem(SAVE_INDEX_KEY, JSON.stringify(slots.slice(0, 8)));
  return payload;
}

export function loadCareer(id: string): CareerSave | undefined {
  const raw = localStorage.getItem(slotKey(id));
  if (!raw) return undefined;
  return JSON.parse(raw) as CareerSave;
}

export function deleteCareer(id: string) {
  localStorage.removeItem(slotKey(id));
  localStorage.setItem(SAVE_INDEX_KEY, JSON.stringify(listSaveSlots().filter((slot) => slot.id !== id)));
}
