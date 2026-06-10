import { create } from 'zustand';

interface FilterState {
  claimer: string;
  crop: string;
  setClaimer: (value: string) => void;
  setCrop: (value: string) => void;
  reset: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  claimer: '',
  crop: '',
  setClaimer: (value) => set({ claimer: value }),
  setCrop: (value) => set({ crop: value }),
  reset: () => set({ claimer: '', crop: '' }),
}));
