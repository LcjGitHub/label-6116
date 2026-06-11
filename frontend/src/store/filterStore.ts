import { create } from 'zustand';
import type { PlotStatus } from '../types';

interface FilterState {
  plotNumber: string;
  claimer: string;
  crop: string;
  status: PlotStatus | '';
  setPlotNumber: (value: string) => void;
  setClaimer: (value: string) => void;
  setCrop: (value: string) => void;
  setStatus: (value: PlotStatus | '') => void;
  reset: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  plotNumber: '',
  claimer: '',
  crop: '',
  status: '',
  setPlotNumber: (value) => set({ plotNumber: value }),
  setClaimer: (value) => set({ claimer: value }),
  setCrop: (value) => set({ crop: value }),
  setStatus: (value) => set({ status: value }),
  reset: () => set({ plotNumber: '', claimer: '', crop: '', status: '' }),
}));
