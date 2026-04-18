import type { Car } from "../data/cars";
import type { ComparisonMetrics } from "../utils/scoring";
import { generateCarSummary } from "../utils/summary-generator";

export interface RecommendationSummaryProps {
  winnerCar: Car;
  metrics: ComparisonMetrics;
}

export function RecommendationSummary({
  winnerCar,
  metrics,
}: RecommendationSummaryProps): string {
  const summary = generateCarSummary(winnerCar, metrics);
  const score = Math.round(metrics.overallWinner.totalScore);

  return `
    <div class="bg-gradient-to-br from-amber-50 via-white to-yellow-50 rounded-xl border-2 border-amber-200 p-6 shadow-lg">
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
          
          <p class="text-slate-700 leading-relaxed text-justify mb-4">
            ${summary}
          </p>
          
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
