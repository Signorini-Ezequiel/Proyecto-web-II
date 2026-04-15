import { CARS } from "../data/cars";
import { getComparisonMetrics } from "../utils/scoring";
import { getFavorites } from "../services/favorites";
import { getSessionUser } from "../services/auth";
import { NavBar, NavBarListeners } from "../components/NavBar";
import { CarComparisonCard } from "../components/CarComparisonCard";
import { ComparisonTable } from "../components/ComparisonTable";
import { RecommendationSummary } from "../components/RecommendationSummary";
import { navigateTo, ROUTES } from "../utils/router";

export function renderComparatorPage(app: HTMLDivElement): void {
  const user = getSessionUser();

  if (user?.role === "seller") {
    navigateTo(ROUTES.home);
    return;
  }

  // Get favorite cars
  const favoriteIds = getFavorites();
  const favoriteCars = CARS.filter(car => favoriteIds.includes(car.id));
  
  // Get selected cars from URL
  const urlParams = new URLSearchParams(window.location.search);
  const selectedIds = urlParams.get("cars")?.split(",") || [];

  let selectedCars = favoriteCars.filter(car =>
    selectedIds.includes(car.id)
  );

  // Store selected cars in sessionStorage for persistence
  if (selectedCars.length === 0) {
    sessionStorage.setItem("comparatorCars", JSON.stringify([]));
  } else {
    sessionStorage.setItem("comparatorCars", JSON.stringify(selectedCars));
  }

  const metricsResult = selectedCars.length >= 2 ? getComparisonMetrics(selectedCars) : null;
  const metrics = metricsResult?.metrics || null;
  const scoresData = metricsResult?.scores || [];

  app.innerHTML = `
    ${NavBar()}
    <main class="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pt-20">
      <!-- Header -->
      <section class="bg-white border-b border-slate-200 py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 class="text-4xl font-bold text-slate-900 mb-2">Comparador de Autos</h1>
          <p class="text-slate-600">Selecciona 2 a 4 vehículos para una comparativa detallada</p>
        </div>
      </section>

      <!-- Selector Section -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h2 class="text-xl font-bold text-slate-900 mb-4">Selecciona autos de tus guardados para comparar</h2>
          
          ${
            favoriteCars.length === 0
              ? `
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                  <svg class="w-12 h-12 text-blue-500 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 9v6m3-3H9m-9 0a9 9 0 1118 0 9 9 0 01-18 0z"/>
                  </svg>
                  <p class="text-slate-700">No tienes autos guardados aún. Agrega algunos desde Buscar.</p>
                </div>
              `
              : `
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  ${favoriteCars.map((car, idx) => {
                    const isSelected = selectedCars.some(c => c.id === car.id);
                    const checkboxClass = isSelected
                      ? "bg-blue-100 border-blue-500 ring-2 ring-blue-300"
                      : "bg-white border-slate-300 hover:border-slate-400";

                    return `
                      <label class="relative flex items-center p-3 rounded-lg border cursor-pointer transition ${checkboxClass}">
                        <input 
                          type="checkbox" 
                          value="${car.id}"
                          data-car-index="${idx}"
                          ${isSelected ? "checked" : ""}
                          class="comparator-checkbox w-4 h-4 rounded accent-blue-500"
                        />
                        <span class="ml-3 text-sm">
                          <span class="font-semibold text-slate-900">${car.make}</span>
                          <span class="text-slate-600"> ${car.model} (${car.year})</span>
                        </span>
                      </label>
                    `;
                  }).join("")}
                </div>
              `
          }

          <div class="mt-6 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-sm text-slate-600">Seleccionados: <span class="font-bold text-slate-900" id="comparison-count">${selectedCars.length}</span>/4</span>
              <div class="w-24 bg-slate-200 rounded-full h-2">
                <div data-comparison-progress class="bg-blue-500 h-2 rounded-full transition-all" style="width: ${(selectedCars.length / 4) * 100}%"></div>
              </div>
            </div>
            <button 
              data-comparator-clear
              class="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Limpiar
            </button>
          </div>
        </div>
      </section>

      ${
        selectedCars.length < 2
          ? `
            <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                <svg class="w-12 h-12 text-blue-500 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 9v6m3-3H9m-9 0a9 9 0 1118 0 9 9 0 01-18 0z"/>
                </svg>
                <p class="text-slate-700">Selecciona al menos 2 vehículos para ver la comparación</p>
              </div>
            </section>
          `
          : `
            <!-- Comparison Cards -->
            <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <h2 class="text-2xl font-bold text-slate-900 mb-6">Vehículos Seleccionados</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                ${selectedCars
                  .map(car => `<div>${CarComparisonCard({ car, metrics: metrics! })}</div>`)
                  .join("")}
              </div>
            </section>

            <!-- Recommendation Summary -->
            <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <h2 class="text-2xl font-bold text-slate-900 mb-6">Análisis Inteligente</h2>
              ${RecommendationSummary({ winnerCar: CARS.find(c => c.id === metrics!.overallWinner.carId)!, metrics: metrics! })}
            </section>

            <!-- Comparison Table -->
            <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <h2 class="text-2xl font-bold text-slate-900 mb-6">Tabla Comparativa Detallada</h2>
              <div class="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p class="text-sm text-amber-900"><strong>Nota:</strong> Los valores destacados en amarillo indican la mejor opción en cada categoría.</p>
              </div>
              ${ComparisonTable({ cars: selectedCars, metrics: metrics! })}
            </section>

            <!-- Scoring Details -->
            <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <h2 class="text-2xl font-bold text-slate-900 mb-6">Desglose de Puntuación</h2>
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                ${selectedCars
                  .map(car => {
                    const score = scoresData.find(s => s.carId === car.id)!;
                    return `
                      <div class="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                        <h3 class="text-lg font-bold text-slate-900 mb-4">${car.make} ${car.model}</h3>
                        <div class="space-y-3">
                          <div class="flex items-center justify-between">
                            <span class="text-slate-600">Precio</span>
                            <div class="flex items-center gap-2">
                              <div class="w-32 bg-slate-200 rounded-full h-2">
                                <div class="bg-green-500 h-2 rounded-full" style="width: ${(score.scores.price / 20) * 100}%"></div>
                              </div>
                              <span class="text-sm font-semibold text-slate-900">${score.scores.price.toFixed(1)}</span>
                            </div>
                          </div>
                          <div class="flex items-center justify-between">
                            <span class="text-slate-600">Kilometraje</span>
                            <div class="flex items-center gap-2">
                              <div class="w-32 bg-slate-200 rounded-full h-2">
                                <div class="bg-blue-500 h-2 rounded-full" style="width: ${(score.scores.mileage / 20) * 100}%"></div>
                              </div>
                              <span class="text-sm font-semibold text-slate-900">${score.scores.mileage.toFixed(1)}</span>
                            </div>
                          </div>
                          <div class="flex items-center justify-between">
                            <span class="text-slate-600">Año</span>
                            <div class="flex items-center gap-2">
                              <div class="w-32 bg-slate-200 rounded-full h-2">
                                <div class="bg-purple-500 h-2 rounded-full" style="width: ${(score.scores.year / 20) * 100}%"></div>
                              </div>
                              <span class="text-sm font-semibold text-slate-900">${score.scores.year.toFixed(1)}</span>
                            </div>
                          </div>
                          <div class="flex items-center justify-between">
                            <span class="text-slate-600">Potencia</span>
                            <div class="flex items-center gap-2">
                              <div class="w-32 bg-slate-200 rounded-full h-2">
                                <div class="bg-red-500 h-2 rounded-full" style="width: ${(score.scores.power / 20) * 100}%"></div>
                              </div>
                              <span class="text-sm font-semibold text-slate-900">${score.scores.power.toFixed(1)}</span>
                            </div>
                          </div>
                          <div class="flex items-center justify-between">
                            <span class="text-slate-600">Equipamiento</span>
                            <div class="flex items-center gap-2">
                              <div class="w-32 bg-slate-200 rounded-full h-2">
                                <div class="bg-orange-500 h-2 rounded-full" style="width: ${(score.scores.features / 20) * 100}%"></div>
                              </div>
                              <span class="text-sm font-semibold text-slate-900">${score.scores.features.toFixed(1)}</span>
                            </div>
                          </div>
                          <div class="pt-3 mt-4 border-t border-slate-200">
                            <div class="flex items-center justify-between">
                              <span class="font-bold text-slate-900">Puntuación Total</span>
                              <span class="text-lg font-bold text-blue-600">${score.totalScore.toFixed(1)}/100</span>
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

  // Listeners de navegación SPA y logout del NavBar
  NavBarListeners();
}
