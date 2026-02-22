export interface AuditResult {
  experiment: {
    type: string;
    epochs: number;
    timestamp: string;
  };
  metrics: {
    total_energy_kwh: number;
    total_carbon_kg: number;
    energy_per_epoch: number[];
  };
  dataset?: {
    samples: number;
    features: number;
  };
  model: {
    name: string;
  };
  system: {
    platform: string;
    python_version: string;
    cpu_count: number;
  };
  recommendations: string[];
  raw_emissions_preview?: RawEmission[];
}

export interface RawEmission {
  timestamp: string;
  duration: number;
  emissions: number;
  emissions_rate: number;
  cpu_power: number;
  gpu_power: number;
  ram_power: number;
  cpu_energy: number;
  gpu_energy: number;
  ram_energy: number;
  energy_consumed: number;
  country_name: string;
  cpu_model: string;
  ram_total_size: number;
  cpu_count: number;
  ram_utilization_percent: number;
}
