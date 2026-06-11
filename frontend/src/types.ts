export type PlotStatus = '种植中' | '已收获' | '空闲';

export const PLOT_STATUSES: PlotStatus[] = ['种植中', '已收获', '空闲'];

export interface Plot {
  id: number;
  plot_number: string;
  claimer: string;
  crop: string;
  claim_date: string;
  expected_harvest_date: string;
  status: PlotStatus;
  harvest_record_count?: number;
  planting_log_count?: number;
  latest_harvest_date?: string | null;
  latest_log_summary?: string | null;
}

export interface PlotFormValues {
  plot_number: string;
  claimer: string;
  crop: string;
  claim_date: Date | null;
  expected_harvest_date: Date | null;
  status: PlotStatus;
}

export interface UpdatePlotPayload {
  plot_number: string;
  claimer: string;
  crop: string;
  claim_date: string;
  expected_harvest_date: string;
}

export interface HarvestRecord {
  id: number;
  plot_id: number;
  plot_number: string;
  actual_harvest_date: string;
  harvest_weight: number;
  remark: string | null;
}

export interface HarvestRecordFormValues {
  plot_id: number | null;
  actual_harvest_date: Date | null;
  harvest_weight: number | null;
  remark: string;
}

export interface CropDistribution {
  crop_name: string;
  count: number;
}

export interface Statistics {
  total_plots: number;
  crop_types: number;
  upcoming_harvests: number;
  crop_distribution: CropDistribution[];
}

export interface Crop {
  id: number;
  code: string;
  name: string;
  category: string;
  suitable_season: string;
}

export interface CropFormValues {
  code: string;
  name: string;
  category: string;
  suitable_season: string;
}

export interface PlantingLog {
  id: number;
  plot_id: number;
  plot_number: string;
  log_date: string;
  content: string;
  recorder: string;
}

export interface PlantingLogFormValues {
  log_date: Date | null;
  content: string;
  recorder: string;
}

export interface FertilizationRecord {
  id: number;
  plot_id: number;
  plot_number: string;
  fertilization_date: string;
  fertilizer_name: string;
  amount_kg: number;
  operator: string;
}

export interface FertilizationRecordFormValues {
  plot_id: number | null;
  fertilization_date: Date | null;
  fertilizer_name: string;
  amount_kg: number | null;
  operator: string;
}

export type PestType = '虫害' | '病害' | '杂草';
export type SeverityLevel = '轻微' | '中等' | '严重';
export type TreatmentStatus = '待处理' | '处理中' | '已处理';

export const PEST_TYPES: PestType[] = ['虫害', '病害', '杂草'];
export const SEVERITY_LEVELS: SeverityLevel[] = ['轻微', '中等', '严重'];
export const TREATMENT_STATUSES: TreatmentStatus[] = ['待处理', '处理中', '已处理'];

export interface PestReport {
  id: number;
  plot_id: number;
  plot_number: string;
  discovery_date: string;
  pest_type: PestType;
  severity: SeverityLevel;
  symptom_description: string;
  treatment_status: TreatmentStatus;
}

export interface PestReportFormValues {
  plot_id: number | null;
  discovery_date: Date | null;
  pest_type: PestType | null;
  severity: SeverityLevel | null;
  symptom_description: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  publish_date: string;
  is_pinned: boolean;
}

export interface AnnouncementFormValues {
  title: string;
  content: string;
  is_pinned: boolean;
}
