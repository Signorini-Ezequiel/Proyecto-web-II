import type { Car } from "../types/car";
import type { ComparisonMetrics } from "../utils/scoring";

export interface RecommendationSummaryProps {
  winnerCar: Car;
  metrics: ComparisonMetrics;
  selectedCarIds: string[];
}

export function RecommendationSummary({
  winnerCar,
  metrics,
  selectedCarIds,
}: RecommendationSummaryProps): string {
  const score = Math.round(metrics.overallWinner.totalScore);

  return `
    <div class="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 via-white to-yellow-50 p-6 shadow-lg" data-ai-comparison-card data-car-ids="${selectedCarIds.join(",")}">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0">
          <svg class="w-12 h-12 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/>
          </svg>
        </div>
        
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <h3 class="text-xl font-bold text-slate-900">Nuestro Recomendado</h3>
            <span class="inline-flex items-center justify-center bg-amber-400 text-slate-900 font-bold rounded-full w-10 h-10 text-sm">
              ${score}%
            </span>
          </div>
          
          <h4 class="text-lg font-semibold text-amber-900 mb-3">
            ${winnerCar.make} ${winnerCar.model} (${winnerCar.year})
          </h4>
          
          <div data-ai-comparison-content class="mb-4 text-slate-700">
            <div class="comparison-ai-fallback rounded-2xl border border-amber-200 bg-white/70 p-4 text-sm leading-6">
              Presiona analizar para generar o recuperar la comparacion IA cacheada.
            </div>
            <button type="button" data-ai-comparison-run class="mt-3 rounded-xl border border-[#e76e1d]/50 px-4 py-2 text-xs font-semibold text-[#c9540a] hover:bg-[#fff4eb]">
              Analizar con IA
            </button>
          </div>
          
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div class="bg-white rounded-lg p-2">
              <p class="text-xs text-slate-600 font-medium">Scoring</p>
              <p class="text-sm font-bold text-amber-600">${score}/100</p>
            </div>
            <div class="bg-white rounded-lg p-2">
              <p class="text-xs text-slate-600 font-medium">Precio</p>
              <p class="text-sm font-bold text-slate-900">$${winnerCar.price.toLocaleString()}</p>
            </div>
            <div class="bg-white rounded-lg p-2">
              <p class="text-xs text-slate-600 font-medium">Km</p>
              <p class="text-sm font-bold text-slate-900">${(winnerCar.mileage / 1000).toFixed(0)}k</p>
            </div>
            <div class="bg-white rounded-lg p-2">
              <p class="text-xs text-slate-600 font-medium">Potencia</p>
              <p class="text-sm font-bold text-slate-900">${winnerCar.specs.power}</p>
            </div>
            <div class="bg-white rounded-lg p-2">
              <p class="text-xs text-slate-600 font-medium">Items</p>
              <p class="text-sm font-bold text-slate-900">${winnerCar.specs.features.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
