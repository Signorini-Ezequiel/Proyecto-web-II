import type { Car } from "../data/cars";
import type { ComparisonMetrics } from "../utils/scoring";
import { isWinnerInCategory } from "../utils/scoring";

export interface ComparisonTableProps {
  cars: Car[];
  metrics: ComparisonMetrics;
}

export function ComparisonTable({ cars, metrics }: ComparisonTableProps): string {
  const rows = [
    {
      label: "Precio",
      key: "price",
      category: "price",
      getValue: (car: Car) => `$${car.price.toLocaleString()}`,
      isBetter: (a: Car, b: Car) => a.price < b.price,
    },
    {
      label: "Kilometraje",
      key: "mileage",
      category: "mileage",
      getValue: (car: Car) => `${car.mileage.toLocaleString()} km`,
      isBetter: (a: Car, b: Car) => a.mileage < b.mileage,
    },
    {
      label: "Año",
      key: "year",
      category: "year",
      getValue: (car: Car) => car.year.toString(),
      isBetter: (a: Car, b: Car) => a.year > b.year,
    },
    {
      label: "Potencia",
      key: "power",
      category: "power",
      getValue: (car: Car) => car.specs.power,
      isBetter: (a: Car, b: Car) => {
        const powerA = parseInt(a.specs.power);
        const powerB = parseInt(b.specs.power);
        return powerA > powerB;
      },
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
      isBetter: (a: Car, b: Car) => a.specs.features.length > b.specs.features.length,
    },
  ];

  const tableRows = rows
    .map(row => {
      const cells = cars
        .map(car => {
          const isWinner =
            row.category && isWinnerInCategory(car.id, row.category as any, metrics);
          const highlightClass = isWinner
            ? "bg-amber-100 font-bold text-amber-900 border-l-4 border-amber-400"
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
