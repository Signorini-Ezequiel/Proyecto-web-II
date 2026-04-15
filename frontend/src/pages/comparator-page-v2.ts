import type { Car } from "../data/cars";
import { NavBar, NavBarListeners } from "../components/NavBar";
import { CarComparisonCard } from "../components/CarComparisonCard";
import { ComparisonTable } from "../components/ComparisonTable";
import { RecommendationSummary } from "../components/RecommendationSummary";
import { getSessionUser } from "../services/auth";
import { getComparisonIds, clearComparison, toggleComparison } from "../services/comparison";
import { getFavorites } from "../services/favorites";
import { getAllCarsForDisplay } from "../services/published-cars";
import { navigateTo, ROUTES } from "../utils/router";
import { getComparisonMetrics } from "../utils/scoring";
import { showToast } from "../utils/toast";

function isCar(car: Car | null): car is Car {
  return car !== null;
}

export function renderComparatorPage(app: HTMLDivElement): void {
  const user = getSessionUser();

  if (user?.role === "seller") {
    navigateTo(ROUTES.home);
    return;
  }

  const allCars = getAllCarsForDisplay();
  const favoriteIds = getFavorites();
  const favoriteCars = favoriteIds
    .map((id) => allCars.find((car) => car.id === id) || null)
    .filter(isCar);
  const selectedIds = getComparisonIds();
  const selectedCars = selectedIds
    .map((id) => favoriteCars.find((car) => car.id === id) || null)
    .filter(isCar);

  const metricsResult = selectedCars.length >= 2 ? getComparisonMetrics(selectedCars) : null;
  const metrics = metricsResult?.metrics || null;
  const scoresData = metricsResult?.scores || [];

  app.innerHTML = `
    ${NavBar()}
    <main class="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pt-20">
      <section class="border-b border-slate-200 bg-white py-8">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 class="mb-2 text-4xl font-bold text-slate-900">Comparador de Autos</h1>
          <p class="text-slate-600">Selecciona entre 2 y 4 vehiculos guardados para una comparativa detallada.</p>
        </div>
      </section>

      <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div class="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 class="text-xl font-bold text-slate-900">Selecciona autos de tus guardados</h2>
              <p class="mt-2 text-sm text-slate-600">Los autos publicados tambien se pueden comparar aunque tengan especificaciones faltantes.</p>
            </div>
            <button
              type="button"
              data-comparator-clear
              class="rounded-xl border border-[#e76e1d]/20 bg-[#fff4eb] px-4 py-2 text-sm font-semibold text-[#c9540a] transition hover:border-[#e76e1d]/40 hover:bg-[#ffe6d1]"
            >
              Limpiar seleccion
            </button>
          </div>

          ${
            favoriteCars.length === 0
              ? `
                <div class="mt-6 rounded-2xl border border-[#e76e1d]/15 bg-[#fff4eb] p-8 text-center">
                  <p class="text-base font-semibold text-slate-900">No tienes autos guardados aun.</p>
                  <p class="mt-2 text-sm text-slate-600">Agrega favoritos desde Buscar y luego podras compararlos aca.</p>
                </div>
              `
              : `
                <div class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  ${favoriteCars
                    .map((car) => {
                      const isSelected = selectedIds.includes(car.id);
                      const labelClass = isSelected
                        ? "border-[#e76e1d]/50 bg-[#fff4eb] text-[#9a3f05] shadow-[0_14px_28px_rgba(231,110,29,0.12)]"
                        : "border-slate-200 bg-white text-slate-900 hover:border-[#e76e1d]/30 hover:bg-[#fffaf5]";
                      const titleClass = isSelected ? "text-[#9a3f05]" : "text-slate-900";
                      const metaClass = isSelected ? "text-[#b45309]" : "text-slate-600";
                      const priceClass = isSelected ? "text-[#9a3412]" : "text-[#c9540a]";

                      return `
                        <label class="relative flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition ${labelClass}">
                          <input
                            type="checkbox"
                            value="${car.id}"
                            ${isSelected ? "checked" : ""}
                            class="comparator-checkbox mt-1 h-4 w-4 rounded accent-[#e76e1d]"
                          />
                          <span class="min-w-0 flex-1">
                            <span class="block text-sm font-semibold ${titleClass}">${car.make} ${car.model}</span>
                            <span class="mt-1 block text-sm ${metaClass}">${car.year} · ${car.transmission} · ${car.fuel}</span>
                            <span class="mt-2 block text-xs uppercase tracking-[0.22em] ${priceClass}">US$ ${car.price.toLocaleString()}</span>
                          </span>
                        </label>
                      `;
                    })
                    .join("")}
                </div>
              `
          }

          <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-sm text-slate-600">
              Seleccionados: <span class="font-bold text-slate-900" id="comparison-count">${selectedCars.length}</span>/4
            </p>
            <div class="h-2 w-full rounded-full bg-slate-200 sm:max-w-48">
              <div
                data-comparison-progress
                class="h-2 rounded-full bg-[linear-gradient(90deg,#e76e1d,#f59e0b)] transition-all"
                style="width: ${(selectedCars.length / 4) * 100}%"
              ></div>
            </div>
          </div>
        </div>
      </section>

      ${
        selectedCars.length < 2
          ? `
            <section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
              <div class="rounded-3xl border border-[#e76e1d]/15 bg-[#fff4eb] p-8 text-center">
                <p class="text-lg font-semibold text-slate-900">Selecciona al menos 2 vehiculos para ver la comparacion.</p>
                <p class="mt-2 text-sm text-slate-600">Puedes comparar hasta 4 autos al mismo tiempo.</p>
              </div>
            </section>
          `
          : `
            <section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
              <h2 class="mb-6 text-2xl font-bold text-slate-900">Vehiculos Seleccionados</h2>
              <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                ${selectedCars.map((car) => `<div>${CarComparisonCard({ car, metrics: metrics! })}</div>`).join("")}
              </div>
            </section>

            <section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
              <h2 class="mb-6 text-2xl font-bold text-slate-900">Analisis Inteligente</h2>
              ${RecommendationSummary({
                winnerCar: selectedCars.find((car) => car.id === metrics!.overallWinner.carId)!,
                metrics: metrics!,
              })}
            </section>

            <section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
              <h2 class="mb-6 text-2xl font-bold text-slate-900">Tabla Comparativa Detallada</h2>
              <div class="comparator-note mb-4 rounded-2xl border border-[#e76e1d]/15 bg-[#fff4eb] p-4">
                <p class="text-sm text-slate-700 comparator-note-text"><strong>Nota:</strong> Las celdas destacadas muestran la mejor opcion en cada categoria.</p>
              </div>
              ${ComparisonTable({ cars: selectedCars, metrics: metrics! })}
            </section>

            <section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
              <h2 class="mb-6 text-2xl font-bold text-slate-900">Desglose de Puntuacion</h2>
              <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
                ${selectedCars
                  .map((car) => {
                    const score = scoresData.find((item) => item.carId === car.id)!;
                    return `
                      <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 class="mb-4 text-lg font-bold text-slate-900">${car.make} ${car.model}</h3>
                        <div class="space-y-3">
                          <div class="flex items-center justify-between gap-3">
                            <span class="text-slate-600">Precio</span>
                            <span class="text-sm font-semibold text-slate-900">${score.scores.price.toFixed(1)}</span>
                          </div>
                          <div class="flex items-center justify-between gap-3">
                            <span class="text-slate-600">Kilometraje</span>
                            <span class="text-sm font-semibold text-slate-900">${score.scores.mileage.toFixed(1)}</span>
                          </div>
                          <div class="flex items-center justify-between gap-3">
                            <span class="text-slate-600">Año</span>
                            <span class="text-sm font-semibold text-slate-900">${score.scores.year.toFixed(1)}</span>
                          </div>
                          <div class="flex items-center justify-between gap-3">
                            <span class="text-slate-600">Potencia</span>
                            <span class="text-sm font-semibold text-slate-900">${score.scores.power.toFixed(1)}</span>
                          </div>
                          <div class="flex items-center justify-between gap-3">
                            <span class="text-slate-600">Equipamiento</span>
                            <span class="text-sm font-semibold text-slate-900">${score.scores.features.toFixed(1)}</span>
                          </div>
                          <div class="mt-4 border-t border-slate-200 pt-3">
                            <div class="flex items-center justify-between gap-3">
                              <span class="font-bold text-slate-900">Puntuacion total</span>
                              <span class="text-lg font-bold text-[#c9540a]">${score.totalScore.toFixed(1)}/100</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    `;
                  })
                  .join("")}
              </div>
            </section>
          `
      }
    </main>
  `;

  NavBarListeners();

  document.querySelectorAll<HTMLInputElement>(".comparator-checkbox").forEach((input) => {
    input.addEventListener("change", () => {
      const result = toggleComparison(input.value);

      if (result.reason === "limit") {
        input.checked = false;
        showToast("Puedes comparar hasta 4 vehiculos al mismo tiempo", "error");
        return;
      }

      renderComparatorPage(app);
    });
  });

  document.querySelector<HTMLElement>("[data-comparator-clear]")?.addEventListener("click", () => {
    clearComparison();
    renderComparatorPage(app);
  });
}
