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
}

export interface PlotFormValues {
  plot_number: string;
  claimer: string;
  crop: string;
  claim_date: Date | null;
  expected_harvest_date: Date | null;
  status: PlotStatus;
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
