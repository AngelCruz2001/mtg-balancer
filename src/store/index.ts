import { create } from 'zustand'

export interface AppState {
  // populated by data-001
  [key: string]: any;
}

export const useAppStore = create<AppState>()(() => ({
  players: [], // Minimal placeholder to satisfy some common usages if needed
}))
