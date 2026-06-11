import axios from 'axios';
import type { Crop, HarvestRecord, PlantingLog, Plot, PlotStatus, Statistics } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function fetchPlots(params?: { claimer?: string; crop?: string; status?: PlotStatus }): Promise<Plot[]> {
  const { data } = await api.get<Plot[]>('/plots', { params });
  return data;
}

export async function createPlot(payload: {
  plot_number: string;
  claimer: string;
  crop: string;
  claim_date: string;
  expected_harvest_date: string;
  status?: PlotStatus;
}): Promise<Plot> {
  const { data } = await api.post<Plot>('/plots', payload);
  return data;
}

export async function deletePlot(id: number): Promise<void> {
  await api.delete(`/plots/${id}`);
}

export async function fetchHarvestRecords(params?: { plot_id?: number }): Promise<HarvestRecord[]> {
  const { data } = await api.get<HarvestRecord[]>('/harvest-records', { params });
  return data;
}

export async function createHarvestRecord(payload: {
  plot_id: number;
  actual_harvest_date: string;
  harvest_weight: number;
  remark?: string;
}): Promise<HarvestRecord> {
  const { data } = await api.post<HarvestRecord>('/harvest-records', payload);
  return data;
}

export async function deleteHarvestRecord(id: number): Promise<void> {
  await api.delete(`/harvest-records/${id}`);
}

export async function fetchStatistics(): Promise<Statistics> {
  const { data } = await api.get<Statistics>('/statistics');
  return data;
}

export async function fetchCrops(params?: { category?: string }): Promise<Crop[]> {
  const { data } = await api.get<Crop[]>('/crops', { params });
  return data;
}

export async function createCrop(payload: {
  code: string;
  name: string;
  category: string;
  suitable_season: string;
}): Promise<Crop> {
  const { data } = await api.post<Crop>('/crops', payload);
  return data;
}

export async function fetchPlantingLogs(params?: { plot_id?: number }): Promise<PlantingLog[]> {
  const { data } = await api.get<PlantingLog[]>('/planting-logs', { params });
  return data;
}

export async function createPlantingLog(payload: {
  plot_id: number;
  log_date: string;
  content: string;
  recorder: string;
}): Promise<PlantingLog> {
  const { data } = await api.post<PlantingLog>('/planting-logs', payload);
  return data;
}
