import type { Car } from "../types/car";
import type { ComparisonCategory, ComparisonMetrics } from "../utils/scoring";
import { isWinnerInCategory } from "../utils/scoring";

export interface ComparisonTableProps {
  cars: Car[];
  metrics: ComparisonMetrics;
}

type ComparisonRow = {
  label: string;
  key: string;
  category?: ComparisonCategory;
  getValue: (car: Car) => string;
};

export function ComparisonTable({ cars, metrics }: ComparisonTableProps): string {
  const rows: ComparisonRow[] = [
    {
      label: "Precio",
      key: "price",
      category: "price",
      getValue: (car: Car) => `$${car.price.toLocaleString()}`,
    },
    {
      label: "Kilometraje",
      key: "mileage",
      category: "mileage",
      getValue: (car: Car) => `${car.mileage.toLocaleString()} km`,
    },
    {
      label: "Año",
      key: "year",
      category: "year",
      getValue: (car: Car) => car.year.toString(),
    },
    {
      label: "Potencia",
      key: "power",
      category: "power",
      getValue: (car: Car) => car.specs.power,
    },
    {
      label: "Combustible",
      key: "fuel",
      getValue: (car: Car) => car.fuel,
    },
    {
      label: "Transmisión",
      key: "transmission",
      getValue: (car: Car) => car.transmission,
    },
    {
      label: "Equipamiento",
      key: "features",
      category: "features",
      getValue: (car: Car) => `${car.specs.features.length} items`,
    },
  ];

  const tableRows = rows
    .map(row => {
      const cells = cars
        .map(car => {
          const isWinner =
            row.category && isWinnerInCategory(car.id, row.category, metrics);
          const highlightClass = isWinner
            ? "comparator-table-winner bg-amber-100 font-bold text-[#9a3b06] border-l-4 border-amber-400"
            : "bg-white text-slate-700";
          return `<td class="px-4 py-3 ${highlightClass}">${row.getValue(car)}</td>`;
        })
        .join("");

      return `
        <tr class="border-b border-slate-200 hover:bg-slate-50">
          <th class="text-left px-4 py-3 font-semibold text-slate-900 bg-slate-50 sticky left-0 z-10">${row.label}</th>
          ${cells}
        </tr>
      `;
    })
    .join("");

  const headerCells = cars
    .map(car => `<th class="px-4 py-3 text-center font-semibold text-slate-900">${car.make}<br/><span class="text-sm font-normal">${car.model}</span></th>`)
    .join("");

  return `
    <div class="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
      <table class="w-full border-collapse bg-white">
        <thead>
          <tr class="bg-slate-100 border-b-2 border-slate-300">
            <th class="px-4 py-3 text-left font-bold text-slate-900 sticky left-0 z-20 bg-slate-100">Especificación</th>
            ${headerCells}
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
  `;
}
