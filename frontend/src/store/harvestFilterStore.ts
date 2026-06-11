import { create } from 'zustand';

interface HarvestFilterState {
  plotId: number | null;
  startDate: string;
  endDate: string;
  resetKey: number;
  setPlotId: (value: number | null) => void;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  reset: () => void;
}

export const useHarvestFilterStore = create<HarvestFilterState>((set) => ({
  plotId: null,
  startDate: '',
  endDate: '',
  resetKey: 0,
  setPlotId: (value) => set({ plotId: value }),
  setStartDate: (value) => set({ startDate: value }),
  setEndDate: (value) => set({ endDate: value }),
  reset: () =>
    set((state) => ({
      plotId: null,
      startDate: '',
      endDate: '',
      resetKey: state.resetKey + 1,
    })),
}));
