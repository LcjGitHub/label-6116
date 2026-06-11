import axios from 'axios';
import type { Crop, FertilizationRecord, HarvestRecord, PestReport, PlantingLog, Plot, PlotStatus, SeverityLevel, Statistics, TreatmentStatus, UpdatePlotPayload } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function fetchPlots(params?: { plot_number?: string; claimer?: string; crop?: string; status?: PlotStatus; start_date?: string; end_date?: string }): Promise<Plot[]> {
  const { data } = await api.get<Plot[]>('/plots', { params });
  return data;
}

export async function fetchPlot(id: number): Promise<Plot> {
  const { data } = await api.get<Plot>(`/plots/${id}`);
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

export async function batchDeletePlots(ids: number[]): Promise<{ message: string; deleted_count: number }> {
  const { data } = await api.post<{ message: string; deleted_count: number }>('/plots/batch-delete', { ids });
  return data;
}

export async function updatePlot(id: number, payload: UpdatePlotPayload): Promise<Plot> {
  const { data } = await api.put<Plot>(`/plots/${id}`, payload);
  return data;
}

export async function fetchHarvestRecords(params?: { plot_id?: number; plot_number?: string; start_date?: string; end_date?: string }): Promise<HarvestRecord[]> {
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

export async function fetchFertilizationRecords(params?: { plot_id?: number; plot_number?: string }): Promise<FertilizationRecord[]> {
  const { data } = await api.get<FertilizationRecord[]>('/fertilization-records', { params });
  return data;
}

export async function createFertilizationRecord(payload: {
  plot_id: number;
  fertilization_date: string;
  fertilizer_name: string;
  amount_kg: number;
  operator: string;
}): Promise<FertilizationRecord> {
  const { data } = await api.post<FertilizationRecord>('/fertilization-records', payload);
  return data;
}

export async function fetchPestReports(params?: { plot_id?: number; severity?: SeverityLevel }): Promise<PestReport[]> {
  const { data } = await api.get<PestReport[]>('/pest-reports', { params });
  return data;
}

export async function createPestReport(payload: {
  plot_id: number;
  discovery_date: string;
  pest_type: string;
  severity: string;
  symptom_description: string;
}): Promise<PestReport> {
  const { data } = await api.post<PestReport>('/pest-reports', payload);
  return data;
}

export async function updatePestReportStatus(id: number, treatment_status: TreatmentStatus): Promise<PestReport> {
  const { data } = await api.patch<PestReport>(`/pest-reports/${id}/status`, { treatment_status });
  return data;
}
