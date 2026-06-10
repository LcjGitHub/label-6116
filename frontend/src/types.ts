export interface Plot {
  id: number;
  plot_number: string;
  claimer: string;
  crop: string;
  claim_date: string;
  expected_harvest_date: string;
}

export interface PlotFormValues {
  plot_number: string;
  claimer: string;
  crop: string;
  claim_date: Date | null;
  expected_harvest_date: Date | null;
}
