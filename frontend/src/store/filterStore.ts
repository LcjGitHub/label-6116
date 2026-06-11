import { create } from 'zustand';
import type { PlotStatus } from '../types';

interface FilterState {
  plotNumber: string;
  claimer: string;
  crop: string;
  status: PlotStatus | '';
  startDate: string;
  endDate: string;
  resetKey: number;
  setPlotNumber: (value: string) => void;
  setClaimer: (value: string) => void;
  setCrop: (value: string) => void;
  setStatus: (value: PlotStatus | '') => void;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  reset: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  plotNumber: '',
  claimer: '',
  crop: '',
  status: '',
  startDate: '',
  endDate: '',
  resetKey: 0,
  setPlotNumber: (value) => set({ plotNumber: value }),
  setClaimer: (value) => set({ claimer: value }),
  setCrop: (value) => set({ crop: value }),
  setStatus: (value) => set({ status: value }),
  setStartDate: (value) => set({ startDate: value }),
  setEndDate: (value) => set({ endDate: value }),
  reset: () => set((state) => ({ plotNumber: '', claimer: '', crop: '', status: '', startDate: '', endDate: '', resetKey: state.resetKey + 1 })),
}));
