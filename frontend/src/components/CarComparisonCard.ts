import type { Car } from "../types/car";
import type { ComparisonMetrics } from "../utils/scoring";
import { isOverallWinner } from "../utils/scoring";

export interface CarComparisonCardProps {
  car: Car;
  metrics: ComparisonMetrics;
}

export function CarComparisonCard({ car, metrics }: CarComparisonCardProps): string {
  const isWinner = isOverallWinner(car.id, metrics);
  const image = car.images.find(Boolean);
  const winnerBorder = isWinner
    ? "border-2 border-amber-400 shadow-lg shadow-amber-200"
    : "border border-slate-200";
  const winnerBadge = isWinner
    ? `
      <div class="absolute -top-3 -right-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 px-4 py-1 rounded-full text-xs font-bold shadow-lg">
        RECOMENDADO
      </div>
    `
    : "";

  return `
    <div class="relative ${winnerBorder} rounded-xl overflow-hidden bg-white transition-all duration-300 hover:shadow-lg">
      ${winnerBadge}

      <div class="bg-slate-100 h-48 overflow-hidden relative">
        ${
          image
            ? `<img src="${image}" alt="${car.make} ${car.model}" class="w-full h-full object-cover" loading="lazy" decoding="async" />`
            : `<div class="flex h-full w-full items-center justify-center text-sm font-medium text-slate-500">Sin imagen</div>`
        }
      </div>

      <div class="p-5 space-y-3">
        <div>
          <h3 class="text-lg font-bold text-slate-900">${car.make}</h3>
          <p class="text-sm text-slate-600">${car.model} ${car.year}</p>
        </div>

        <div class="space-y-2 text-sm">
          ${comparisonLine("Precio", `$${car.price.toLocaleString()}`)}
          ${comparisonLine("Kilometros", car.mileage.toLocaleString())}
          ${comparisonLine("Potencia", car.specs.power)}
          ${comparisonLine("Combustible", car.fuel)}
          ${comparisonLine("Transmision", car.transmission, false)}
        </div>

        <div class="bg-slate-50 rounded-lg p-3 mt-3">
          <p class="text-xs font-semibold text-slate-700 mb-2">EQUIPAMIENTO</p>
          <div class="flex flex-wrap gap-2">
            ${
              car.specs.features.length === 0
                ? `<span class="text-xs text-slate-600">Sin items cargados</span>`
                : car.specs.features
                    .slice(0, 4)
                    .map((feature) => `<span class="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">${feature}</span>`)
                    .join("")
            }
            ${car.specs.features.length > 4 ? `<span class="text-xs text-slate-600 italic">+${car.specs.features.length - 4} mas</span>` : ""}
          </div>
        </div>

        <div class="bg-blue-50 rounded-lg p-3 mt-2">
          <p class="text-xs font-semibold text-blue-900">UBICACION</p>
          <p class="text-sm text-blue-800">${car.location}</p>
        </div>
      </div>
    </div>
  `;
}

function comparisonLine(label: string, value: string, withBorder = true): string {
  return `
    <div class="flex justify-between items-center py-2 ${withBorder ? "border-b border-slate-100" : ""}">
      <span class="text-slate-600">${label}</span>
      <span class="font-semibold text-slate-900">${value}</span>
    </div>
  `;
}
