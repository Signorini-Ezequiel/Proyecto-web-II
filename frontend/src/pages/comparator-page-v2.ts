import type { Car } from "../types/car";
import { NavBar, NavBarListeners } from "../components/NavBar";
import { CarComparisonCard } from "../components/CarComparisonCard";
import { ComparisonTable } from "../components/ComparisonTable";
import { RecommendationSummary } from "../components/RecommendationSummary";
import { getSessionUser } from "../services/auth";
import { clearComparison, getComparisonIds, toggleComparison } from "../services/comparison";
import { getFavorites } from "../services/favorites";
import { getAIErrorMessage, getComparisonAIAnalysis } from "../services/ai";
import { fetchPublishedCars, publishedCarToCar } from "../services/published-cars";
import { navigateTo, ROUTES } from "../utils/router";
import { getComparisonMetrics } from "../utils/scoring";
import { showToast } from "../utils/toast";
import { bindThemeToggleButtons } from "../utils/theme";

function isCar(car: Car | null): car is Car {
  return car !== null;
}

export async function renderComparatorPage(app: HTMLDivElement): Promise<void> {
  const user = getSessionUser();

  if (!user) {
    navigateTo(ROUTES.landing);
    return;
  }

  if (user.role === "seller") {
    navigateTo(ROUTES.home);
    return;
  }

  renderComparatorLoading(app);
  NavBarListeners();
  bindThemeToggleButtons();

  const [publishedCars, favoriteIdsRaw, selectedIdsRaw] = await Promise.all([
    fetchPublishedCars(),
    getFavorites(),
    getComparisonIds(),
  ]);

  const allCars = publishedCars.map(publishedCarToCar);
  const carsById = new Map(allCars.map((car) => [car.id, car]));
  const favoriteIds = Array.isArray(favoriteIdsRaw) ? favoriteIdsRaw : [];
  const selectedIds = Array.isArray(selectedIdsRaw) ? selectedIdsRaw : [];
  const favoriteCars = favoriteIds.map((id) => carsById.get(id) || null).filter(isCar);
  const favoriteCarsById = new Map(favoriteCars.map((car) => [car.id, car]));
  const selectedIdsSet = new Set(selectedIds.filter((id) => favoriteCarsById.has(id)));

  app.innerHTML = `
    ${NavBar()}
    <main class="min-h-screen app-bg pt-20">
      <section class="border-b border-slate-200 bg-white/80 py-8 backdrop-blur">
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
              <p class="mt-2 text-sm text-slate-600">Los autos publicados se cargan desde el backend y se comparan con tus favoritos reales.</p>
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
                <div id="favorite-cars-grid" class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  ${favoriteCars.map((car) => renderFavoriteOption(car, selectedIdsSet.has(car.id))).join("")}
                </div>
              `
          }

          <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-sm text-slate-600">
              Seleccionados: <span class="font-bold text-slate-900" id="comparison-count">${selectedIdsSet.size}</span>/4
            </p>
            <div class="h-2 w-full rounded-full bg-slate-200 sm:max-w-48">
              <div
                data-comparison-progress
                class="h-2 rounded-full bg-[linear-gradient(90deg,#e76e1d,#f59e0b)] transition-all"
                style="width: ${(selectedIdsSet.size / 4) * 100}%"
              ></div>
            </div>
          </div>
        </div>
      </section>

      <div id="comparison-results">
        ${renderComparisonResults(getSelectedCars())}
      </div>
    </main>
  `;

  NavBarListeners();
  bindThemeToggleButtons();
  bindSelectionControls();
  bindResultActions();
  bindComparisonAIAnalysis();
  bindClearAction();

  function getSelectedCars(): Car[] {
    return Array.from(selectedIdsSet)
      .map((id) => favoriteCarsById.get(id) || null)
      .filter(isCar);
  }

  function updateComparisonUi(): void {
    const count = selectedIdsSet.size;
    const countElement = document.querySelector<HTMLElement>("#comparison-count");
    const progress = document.querySelector<HTMLElement>("[data-comparison-progress]");
    if (countElement) countElement.textContent = String(count);
    if (progress) progress.style.width = `${(count / 4) * 100}%`;
  }

  function renderResultsFromState(): void {
    const results = document.getElementById("comparison-results");
    if (!results) return;
    results.innerHTML = renderComparisonResults(getSelectedCars());
    bindResultActions();
    bindComparisonAIAnalysis();
  }

  function syncOptionState(carId: string): void {
    const selected = selectedIdsSet.has(carId);
    const option = document.querySelector<HTMLElement>(`[data-comparator-option="${carId}"]`);
    if (!option) return;
    option.className = getFavoriteLabelClass(selected);
  }

  function bindSelectionControls(): void {
    document.querySelectorAll<HTMLInputElement>(".comparator-checkbox").forEach((input) => {
      input.addEventListener("change", async () => {
        const carId = input.value;
        const wasSelected = selectedIdsSet.has(carId);

        if (!wasSelected && selectedIdsSet.size >= 4) {
          input.checked = false;
          showToast("Puedes comparar hasta 4 vehiculos al mismo tiempo", "error");
          return;
        }

        if (wasSelected) {
          selectedIdsSet.delete(carId);
        } else {
          selectedIdsSet.add(carId);
        }

        updateComparisonUi();
        syncOptionState(carId);
        renderResultsFromState();
        input.disabled = true;

        try {
          const result = await toggleComparison(carId);

          if (result.reason === "limit" || result.reason === "duplicate") {
            restoreSelection(carId, wasSelected);
            showToast(
              result.reason === "limit"
                ? "Puedes comparar hasta 4 vehiculos al mismo tiempo"
                : "Ese vehiculo ya esta en el comparador",
              "error",
            );
          }
        } catch {
          restoreSelection(carId, wasSelected);
          showToast("No se pudo actualizar el comparador", "error");
        } finally {
          input.disabled = false;
        }
      });
    });
  }

  function restoreSelection(carId: string, selected: boolean): void {
    if (selected) {
      selectedIdsSet.add(carId);
    } else {
      selectedIdsSet.delete(carId);
    }

    const input = document.querySelector<HTMLInputElement>(`.comparator-checkbox[value="${carId}"]`);
    if (input) input.checked = selected;
    updateComparisonUi();
    syncOptionState(carId);
    renderResultsFromState();
  }

  function bindResultActions(): void {
    document.querySelectorAll<HTMLButtonElement>("[data-comparator-remove]").forEach((button) => {
      button.addEventListener("click", async () => {
        const carId = button.dataset.comparatorRemove;
        if (!carId) return;

        selectedIdsSet.delete(carId);
        const input = document.querySelector<HTMLInputElement>(`.comparator-checkbox[value="${carId}"]`);
        if (input) input.checked = false;
        updateComparisonUi();
        syncOptionState(carId);
        renderResultsFromState();

        try {
          await toggleComparison(carId);
        } catch {
          selectedIdsSet.add(carId);
          if (input) input.checked = true;
          updateComparisonUi();
          syncOptionState(carId);
          renderResultsFromState();
          showToast("No se pudo quitar el vehiculo del comparador", "error");
        }
      });
    });

    document.querySelectorAll<HTMLButtonElement>("[data-view-detail]").forEach((button) => {
      button.addEventListener("click", () => {
        const carId = button.dataset.viewDetail;
        if (!carId) return;
        navigateTo(`${ROUTES.carDetail}?id=${encodeURIComponent(carId)}&from=comparator`);
      });
    });
  }

  function bindClearAction(): void {
    document.querySelector<HTMLElement>("[data-comparator-clear]")?.addEventListener("click", async () => {
      const previousIds = Array.from(selectedIdsSet);
      selectedIdsSet.clear();
      document.querySelectorAll<HTMLInputElement>(".comparator-checkbox").forEach((input) => {
        input.checked = false;
        syncOptionState(input.value);
      });
      updateComparisonUi();
      renderResultsFromState();

      try {
        await clearComparison();
      } catch {
        previousIds.forEach((id) => selectedIdsSet.add(id));
        document.querySelectorAll<HTMLInputElement>(".comparator-checkbox").forEach((input) => {
          input.checked = selectedIdsSet.has(input.value);
          syncOptionState(input.value);
        });
        updateComparisonUi();
        renderResultsFromState();
        showToast("No se pudo limpiar el comparador", "error");
      }
    });
  }
}

function renderComparatorLoading(app: HTMLDivElement): void {
  app.innerHTML = `
    ${NavBar()}
    <main class="min-h-screen app-bg pt-20">
      <section class="border-b border-slate-200 bg-white/80 py-8 backdrop-blur">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="h-10 w-80 max-w-full animate-pulse rounded bg-slate-200"></div>
          <div class="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-slate-200"></div>
        </div>
      </section>
      <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div class="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            ${Array.from({ length: 4 }, () => `<div class="h-24 animate-pulse rounded-2xl bg-slate-200"></div>`).join("")}
          </div>
        </div>
      </section>
    </main>
  `;
}

function renderFavoriteOption(car: Car, isSelected: boolean): string {
  return `
    <label class="${getFavoriteLabelClass(isSelected)}" data-comparator-option="${car.id}">
      <input
        type="checkbox"
        value="${car.id}"
        ${isSelected ? "checked" : ""}
        class="comparator-checkbox mt-1 h-4 w-4 rounded accent-[#e76e1d]"
      />
      <span class="min-w-0 flex-1">
        <span class="comparator-option-title block text-sm font-semibold">${car.make} ${car.model}</span>
        <span class="comparator-option-meta mt-1 block text-sm">${car.year} · ${car.transmission} · ${car.fuel}</span>
        <span class="comparator-option-price mt-2 block text-xs uppercase tracking-[0.22em]">US$ ${car.price.toLocaleString()}</span>
      </span>
    </label>
  `;
}

function getFavoriteLabelClass(isSelected: boolean): string {
  const base = "comparator-option relative flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition";
  return isSelected ? `${base} is-selected` : base;
}

function renderComparisonResults(selectedCars: Car[]): string {
  if (selectedCars.length < 2) {
    return `
      <section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div class="comparator-note rounded-3xl border border-[#e76e1d]/15 bg-[#fff4eb] p-8 text-center">
          <p class="comparator-note-text text-lg font-semibold text-slate-900">Selecciona al menos 2 vehiculos para ver la comparacion.</p>
          <p class="comparator-note-text mt-2 text-sm text-slate-600">Puedes comparar hasta 4 autos al mismo tiempo.</p>
        </div>
      </section>
    `;
  }

  const metricsResult = getComparisonMetrics(selectedCars);
  const metrics = metricsResult.metrics;
  const scoresData = metricsResult.scores;

  return `
    <section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 class="mb-6 text-2xl font-bold text-slate-900">Vehiculos Seleccionados</h2>
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        ${selectedCars.map((car) => `
          <div class="relative" data-selected-car="${car.id}">
            <button type="button" data-comparator-remove="${car.id}" class="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#c9540a] shadow-sm hover:bg-[#fff4eb]">
              Remover
            </button>
            <button type="button" data-view-detail="${car.id}" class="absolute left-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
              Ver detalle
            </button>
            ${CarComparisonCard({ car, metrics })}
          </div>
        `).join("")}
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 class="mb-6 text-2xl font-bold text-slate-900">Analisis automatico</h2>
      ${RecommendationSummary({
        winnerCar: selectedCars.find((car) => car.id === metrics.overallWinner.carId)!,
        metrics,
        selectedCarIds: selectedCars.map((car) => car.id),
      })}
    </section>

    <section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 class="mb-6 text-2xl font-bold text-slate-900">Tabla Comparativa Detallada</h2>
      <div class="comparator-note mb-4 rounded-2xl border border-[#e76e1d]/15 bg-[#fff4eb] p-4">
        <p class="text-sm text-slate-700 comparator-note-text"><strong>Nota:</strong> Las celdas destacadas muestran la mejor opcion en cada categoria.</p>
      </div>
      ${ComparisonTable({ cars: selectedCars, metrics })}
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
                  ${scoreRow("Precio", score.scores.price)}
                  ${scoreRow("Kilometraje", score.scores.mileage)}
                  ${scoreRow("Ano", score.scores.year)}
                  ${scoreRow("Potencia", score.scores.power)}
                  ${scoreRow("Equipamiento", score.scores.features)}
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
  `;
}

function scoreRow(label: string, value: number): string {
  return `
    <div class="flex items-center justify-between gap-3">
      <span class="text-slate-600">${label}</span>
      <span class="text-sm font-semibold text-slate-900">${value.toFixed(1)}</span>
    </div>
  `;
}

function bindComparisonAIAnalysis(): void {
  const card = document.querySelector<HTMLElement>("[data-ai-comparison-card]");
  const content = card?.querySelector<HTMLElement>("[data-ai-comparison-content]");
  const runButton = card?.querySelector<HTMLButtonElement>("[data-ai-comparison-run]");
  const carIds = card?.dataset.carIds?.split(",").filter(Boolean) ?? [];

  if (!card || !content || !runButton || carIds.length < 2) return;

  runButton.addEventListener("click", () => {
    runButton.disabled = true;
    content.innerHTML = `
      <div class="space-y-2">
        <div class="h-4 w-full animate-pulse rounded bg-amber-100"></div>
        <div class="h-4 w-11/12 animate-pulse rounded bg-amber-100"></div>
        <div class="h-4 w-3/4 animate-pulse rounded bg-amber-100"></div>
      </div>
    `;
    void loadComparisonAI(content, carIds);
  });
}

async function loadComparisonAI(content: HTMLElement, carIds: string[]): Promise<void> {
  try {
    const response = await getComparisonAIAnalysis(carIds);
    const analysis = response.comparisonAnalysis;
    content.innerHTML = `
      <p class="mb-3 text-justify leading-relaxed">${escapeHtml(analysis.summary)}</p>
      <p class="text-sm leading-6">${escapeHtml(analysis.recommendation)}</p>
      <div class="mt-3 grid gap-3 sm:grid-cols-2">
        ${renderAIList("Motivos", analysis.positives)}
        ${renderAIList("Contrapuntos", analysis.tradeoffs)}
      </div>
    `;
  } catch (error) {
    content.innerHTML = `
      <div class="comparison-ai-fallback rounded-2xl border border-amber-200 bg-white/70 p-4 text-sm leading-6">
        ${escapeHtml(getAIErrorMessage(error))}
      </div>
    `;
  }
}

function renderAIList(title: string, items: string[]): string {
  const cleanItems = items.filter(Boolean).slice(0, 4);

  return `
    <div class="rounded-2xl border border-amber-100 bg-white/70 p-3">
      <h4 class="text-sm font-semibold text-slate-900">${escapeHtml(title)}</h4>
      <ul class="mt-2 space-y-1 text-sm leading-6 text-slate-700">
        ${cleanItems.length > 0 ? cleanItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("") : "<li>Sin observaciones relevantes.</li>"}
      </ul>
    </div>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
