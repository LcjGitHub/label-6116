import { create } from 'zustand';
import type { PlotStatus } from '../types';

interface FilterState {
  claimer: string;
  crop: string;
  status: PlotStatus | '';
  setClaimer: (value: string) => void;
  setCrop: (value: string) => void;
  setStatus: (value: PlotStatus | '') => void;
  reset: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  claimer: '',
  crop: '',
  status: '',
  setClaimer: (value) => set({ claimer: value }),
  setCrop: (value) => set({ crop: value }),
  setStatus: (value) => set({ status: value }),
  reset: () => set({ claimer: '', crop: '', status: '' }),
}));
