import axios from 'axios';
import type { Plot } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function fetchPlots(params?: { claimer?: string; crop?: string }): Promise<Plot[]> {
  const { data } = await api.get<Plot[]>('/plots', { params });
  return data;
}

export async function createPlot(payload: {
  plot_number: string;
  claimer: string;
  crop: string;
  claim_date: string;
  expected_harvest_date: string;
}): Promise<Plot> {
  const { data } = await api.post<Plot>('/plots', payload);
  return data;
}

export async function deletePlot(id: number): Promise<void> {
  await api.delete(`/plots/${id}`);
}
