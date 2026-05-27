export interface VehicleDataAnalysisResult {
  summary: string;
  positives: string[];
  negatives: string[];
  recommendation: string;
  score: number;
}

export interface VehicleImageAnalysisResult {
  visualCondition: string;
  detectedIssues: string[];
  positiveAspects: string[];
  confidence: number;
}

export interface VehicleDataAnalysisResponse {
  carId: string;
  cached: boolean;
  generatedAt: string;
  dataAnalysis: VehicleDataAnalysisResult;
  model: string;
}

export interface VehicleImageAnalysisResponse {
  carId: string;
  cached: boolean;
  generatedAt: string;
  imageAnalysis: VehicleImageAnalysisResult | null;
  model: string | null;
}

export interface VehicleAIAnalysisResponse {
  carId: string;
  cached: boolean;
  generatedAt: string;
  dataAnalysis: VehicleDataAnalysisResult;
  imageAnalysis: VehicleImageAnalysisResult | null;
  models: {
    data: string;
    vision: string | null;
  };
}

export interface VehicleComparisonAnalysisResult {
  winnerCarId: string;
  summary: string;
  positives: string[];
  tradeoffs: string[];
  recommendation: string;
  score: number;
}

export interface VehicleComparisonAnalysisResponse {
  carIds: string[];
  cached: boolean;
  generatedAt: string;
  comparisonAnalysis: VehicleComparisonAnalysisResult;
  model: string;
}
