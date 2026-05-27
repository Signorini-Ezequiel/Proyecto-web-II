import { NavBar, NavBarListeners } from "../components/NavBar";
import { getSessionUser, getUserById, logout } from "../services/auth";
import { navigateTo, ROUTES } from "../utils/router";
import type { PublishedCar } from "../services/published-cars";
import { deletePublishedCar, fetchPublishedCars } from "../services/published-cars";
import { setCurrentCarId } from "./car-detail";
import { getFavorites, isFavorite, toggleFavorite } from "../services/favorites";
import { Icons } from "../utils/icons";
import { showToast } from "../utils/toast";
import { bindThemeToggleButtons } from "../utils/theme";

const INITIAL_RENDER_LIMIT = 12;
const RENDER_INCREMENT = 12;
const FILTER_DEBOUNCE_MS = 220;

type HomeFilters = {
  make?: string;
  model?: string;
  minYear?: number;
  maxYear?: number;
  minPrice: number;
  maxPrice: number;
  maxMileage?: number;
  fuel?: string;
  transmission?: string;
  searchQuery?: string;
};

type SearchableCar = PublishedCar & {
  searchText: string;
};

export async function renderHomePage(container: HTMLElement): Promise<void> {
  const user = getSessionUser();

  if (!user) {
    navigateTo(ROUTES.landing);
    return;
  }

  const isSeller = user.role === "seller";
  renderHomeShell(container, isSeller, 0, 0, true);
  NavBarListeners();
  bindThemeToggleButtons();

  try {
    const [allCars] = await Promise.all([
      fetchPublishedCars(),
      isSeller ? Promise.resolve([]) : getFavorites(),
    ]);
    const carsToShow = isSeller ? allCars.filter((car) => car.sellerId === user.id) : allCars;
    const searchableCars: SearchableCar[] = carsToShow.map((car) => ({
      ...car,
      searchText: `${car.make} ${car.model} ${car.fuel} ${car.transmission}`.toLowerCase(),
    }));
    const carById = new Map(searchableCars.map((car) => [car.id, car]));
    const imageIndexByCarId = new Map<string, number>();
    const minCatalogPrice = !isSeller && searchableCars.length > 0 ? Math.min(...searchableCars.map((car) => car.price)) : 0;
    const maxCatalogPrice = !isSeller && searchableCars.length > 0 ? Math.max(...searchableCars.map((car) => car.price)) : 0;

    renderHomeShell(container, isSeller, minCatalogPrice, maxCatalogPrice, false);
    NavBarListeners();
    bindThemeToggleButtons();

    let activeCars = searchableCars;
    let visibleLimit = INITIAL_RENDER_LIMIT;
    let filterTimer: number | undefined;
    let filtersExpanded = true;
    let lastRenderKey = "";

    const carsContainer = document.getElementById("cars-container");
    if (!carsContainer) return;
    const listContainer = carsContainer;

    if (isSeller) {
      renderCars(searchableCars, true);
      document.getElementById("publish-btn")?.addEventListener("click", () => {
        navigateTo(ROUTES.publish);
      });
    } else {
      bindBuyerFilters();
      renderCars(activeCars, true);
    }

    listContainer.addEventListener("click", async (event) => {
      const target = event.target as HTMLElement;
      const card = target.closest<HTMLElement>(".car-card");
      if (!card) return;

      const carId = card.dataset.carId;
      if (!carId) return;

      const favoriteButton = target.closest<HTMLButtonElement>(".favorite-btn");
      if (favoriteButton) {
        if (isSeller) return;
        event.stopPropagation();
        handleFavoriteClick(carId, favoriteButton);
        return;
      }

      const editButton = target.closest<HTMLButtonElement>(".edit-car-btn");
      if (editButton) {
        event.stopPropagation();
        navigateTo(`${ROUTES.editCar}?id=${encodeURIComponent(carId)}`);
        return;
      }

      const deleteButton = target.closest<HTMLButtonElement>(".delete-car-btn");
      if (deleteButton) {
        event.stopPropagation();
        await handleDeleteCar(carId, card, deleteButton);
        return;
      }

      const prevButton = target.closest<HTMLButtonElement>(".car-prev-btn");
      const nextButton = target.closest<HTMLButtonElement>(".car-next-btn");
      if (prevButton || nextButton) {
        event.stopPropagation();
        updateCardImage(card, carId, Boolean(nextButton));
        return;
      }

      setCurrentCarId(carId, true);
      navigateTo(`${ROUTES.carDetail}?id=${encodeURIComponent(carId)}&from=home`);
    });

    document.querySelector("#logout-button")?.addEventListener("click", () => {
      logout();
      navigateTo(ROUTES.login);
    });

    document.getElementById("load-more-cars")?.addEventListener("click", () => {
      visibleLimit += RENDER_INCREMENT;
      renderCars(activeCars, false);
    });

    document.getElementById("toggle-filters")?.addEventListener("click", () => {
      const content = document.getElementById("filters-content");
      const priceFilters = document.getElementById("price-filters");
      const toggleBtn = document.getElementById("toggle-filters");
      filtersExpanded = !filtersExpanded;
      if (content) content.style.display = filtersExpanded ? "grid" : "none";
      if (priceFilters) priceFilters.style.display = filtersExpanded ? "grid" : "none";
      if (toggleBtn) {
        toggleBtn.innerHTML = filtersExpanded ? Icons.chevronUp(5) : Icons.chevronDown(5);
      }
    });

    const scrollBtn = document.getElementById("scroll-top");
    if (scrollBtn) {
      scrollBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      window.addEventListener("scroll", () => {
        scrollBtn.classList.toggle("hidden", window.scrollY < 300);
      });
    }

    function bindBuyerFilters(): void {
      document.getElementById("search-query")?.addEventListener("input", scheduleApplyFilters);
      [
        "filter-make",
        "filter-model",
        "filter-min-year",
        "filter-max-year",
        "filter-min-price",
        "filter-max-price",
        "filter-max-mileage",
        "filter-fuel",
        "filter-transmission",
      ].forEach((id) => document.getElementById(id)?.addEventListener("input", scheduleApplyFilters));

      document.getElementById("clear-filters")?.addEventListener("click", () => {
        (document.getElementById("search-query") as HTMLInputElement).value = "";
        (document.getElementById("filter-make") as HTMLInputElement).value = "";
        (document.getElementById("filter-model") as HTMLInputElement).value = "";
        (document.getElementById("filter-min-year") as HTMLInputElement).value = "";
        (document.getElementById("filter-max-year") as HTMLInputElement).value = "";
        (document.getElementById("filter-min-price") as HTMLInputElement).value = "";
        (document.getElementById("filter-max-price") as HTMLInputElement).value = "";
        (document.getElementById("filter-max-mileage") as HTMLInputElement).value = "";
        (document.getElementById("filter-fuel") as HTMLSelectElement).value = "";
        (document.getElementById("filter-transmission") as HTMLSelectElement).value = "";
        applyFilters();
      });
    }

    function scheduleApplyFilters(): void {
      window.clearTimeout(filterTimer);
      filterTimer = window.setTimeout(applyFilters, FILTER_DEBOUNCE_MS);
    }

    function applyFilters(): void {
      const filters = readFilters(minCatalogPrice, maxCatalogPrice);
      const hasFilters =
        Boolean(filters.searchQuery?.trim()) ||
        Boolean(filters.make?.trim()) ||
        Boolean(filters.model?.trim()) ||
        Boolean(filters.minYear) ||
        Boolean(filters.maxYear) ||
        Boolean(filters.maxMileage) ||
        Boolean(filters.fuel) ||
        Boolean(filters.transmission) ||
        filters.minPrice > minCatalogPrice ||
        filters.maxPrice < maxCatalogPrice;

      document.getElementById("clear-filters")?.classList.toggle("hidden", !hasFilters);

      const filtered = filterPublishedCars(searchableCars, filters);
      activeCars = filtered;
      visibleLimit = INITIAL_RENDER_LIMIT;
      lastRenderKey = "";
      renderCars(activeCars, true);
    }

    function renderCars(cars: SearchableCar[], force: boolean): void {
      const visibleCars = cars.slice(0, visibleLimit);
      const renderKey = `${visibleLimit}:${visibleCars.map((car) => car.id).join("|")}:${cars.length}`;
      if (!force && renderKey === lastRenderKey) return;
      lastRenderKey = renderKey;

      if (cars.length === 0) {
        listContainer.innerHTML = `
          <div class="col-span-full text-center py-12">
            <p class="text-slate-600">No se encontraron autos con los filtros seleccionados</p>
          </div>
        `;
        updateLoadMoreButton(0, 0);
        return;
      }

      listContainer.innerHTML = visibleCars.map(renderCarCard).join("");
      updateLoadMoreButton(visibleCars.length, cars.length);
    }

    function renderCarCard(car: SearchableCar): string {
      const sellerName = getUserById(car.sellerId)?.name || null;

      return `
        <div class="car-card rounded-3xl border border-slate-200 bg-white/80 overflow-hidden hover:shadow-lg transition-shadow" data-car-id="${car.id}">
          <div class="relative aspect-video bg-slate-100 group cursor-pointer">
            <img src="${car.images[0] || ""}" alt="${car.make} ${car.model}" loading="lazy" decoding="async" class="w-full h-full object-cover car-main-image">
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button class="car-prev-btn rounded-full bg-white/80 p-2 hover:bg-white">
                ${Icons.chevronLeft(4)}
              </button>
              <button class="car-next-btn rounded-full bg-white/80 p-2 hover:bg-white">
                ${Icons.chevronRight(4)}
              </button>
            </div>
            ${
              isSeller
                ? ""
                : `<button class="favorite-btn absolute top-3 right-3 rounded-full bg-white/80 p-2 hover:bg-white" data-car-id="${car.id}">
                    ${isFavorite(car.id) ? Icons.heart(5, true) : Icons.heart(5, false)}
                  </button>`
            }
            <div class="absolute bottom-2 right-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
              <span class="car-image-counter">1</span>/${Math.max(car.images.length, 1)}
            </div>
          </div>
          <div class="p-6 cursor-pointer car-details">
            <h3 class="font-semibold text-slate-900">${car.make} ${car.model} ${car.year}</h3>
            <p class="mt-1 text-sm text-slate-600">${car.mileage.toLocaleString()} km · ${car.transmission} · ${car.location}</p>
            <p class="mt-2 text-lg font-bold text-[#e76e1d]">US$ ${car.price.toLocaleString()}</p>
            <p class="mt-1 text-sm text-slate-500">Publicado por: ${sellerName || "N/A"}</p>
            ${
              isSeller
                ? `<div class="mt-4 flex gap-2">
                    <button type="button" class="edit-car-btn rounded-lg border border-[#e76e1d]/30 px-4 py-2 text-sm font-semibold text-[#c9540a] hover:bg-[#fff4eb] transition-colors">Editar</button>
                    <button type="button" class="delete-car-btn rounded-lg border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">Eliminar</button>
                  </div>`
                : ""
            }
          </div>
        </div>
      `;
    }

    function handleFavoriteClick(carId: string, btn: HTMLButtonElement): void {
      const wasSelected = isFavorite(carId);
      btn.innerHTML = !wasSelected ? Icons.heart(5, true) : Icons.heart(5, false);
      btn.style.transform = "scale(1.2)";
      setTimeout(() => {
        btn.style.transform = "";
      }, 150);

      void toggleFavorite(carId).then(() => {
        btn.innerHTML = isFavorite(carId) ? Icons.heart(5, true) : Icons.heart(5, false);
      });
    }

    function updateCardImage(card: HTMLElement, carId: string, next: boolean): void {
      const car = carById.get(carId);
      if (!car || car.images.length === 0) return;

      const currentIndex = imageIndexByCarId.get(carId) ?? 0;
      const nextIndex = next
        ? currentIndex < car.images.length - 1 ? currentIndex + 1 : 0
        : currentIndex > 0 ? currentIndex - 1 : car.images.length - 1;

      imageIndexByCarId.set(carId, nextIndex);
      const mainImage = card.querySelector(".car-main-image") as HTMLImageElement | null;
      const counter = card.querySelector(".car-image-counter");
      if (mainImage) mainImage.src = car.images[nextIndex];
      if (counter) counter.textContent = (nextIndex + 1).toString();
    }

    async function handleDeleteCar(carId: string, card: HTMLElement, button: HTMLButtonElement): Promise<void> {
      const confirmed = window.confirm("Esta accion eliminara el vehiculo y sus favoritos, comparaciones y preguntas. Deseas continuar?");
      if (!confirmed) return;

      button.disabled = true;
      button.textContent = "Eliminando...";

      const ok = await deletePublishedCar(carId);
      if (!ok) {
        showToast("No se pudo eliminar el vehiculo", "error");
        button.disabled = false;
        button.textContent = "Eliminar";
        return;
      }

      showToast("Vehiculo eliminado", "success");
      carById.delete(carId);
      activeCars = activeCars.filter((car) => car.id !== carId);
      card.remove();
      renderCars(activeCars, true);
    }
  } catch (error) {
    console.error("Error loading home cars:", error);
    const carsContainer = document.getElementById("cars-container");
    if (carsContainer) {
      carsContainer.innerHTML = `
        <div class="col-span-full text-center py-12">
          <p class="text-slate-600">No se pudieron cargar los autos.</p>
        </div>
      `;
    }
  }
}

function renderHomeShell(
  container: HTMLElement,
  isSeller: boolean,
  minCatalogPrice: number,
  maxCatalogPrice: number,
  loading: boolean,
): void {
  container.innerHTML = `
    <main class="min-h-screen app-bg text-slate-900 pt-20">
      ${NavBar({ showAbout: false, isLandingPage: false })}

      <div class="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        ${
          isSeller
            ? `
              <div class="flex items-center justify-between mb-8">
                <h1 class="text-3xl font-bold text-slate-900">Mis publicaciones</h1>
                <button id="publish-btn" class="rounded-lg bg-[#e76e1d] px-6 py-3 font-semibold text-white hover:bg-[#d45a0a] transition-colors">
                  Publicar nuevo vehiculo
                </button>
              </div>
              <div id="cars-container" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                ${loading ? renderSkeletonCards() : ""}
              </div>
            `
            : `
              <section class="mb-8">
                <div class="rounded-3xl border border-slate-200 bg-white/80 p-6">
                  <h2 class="text-xl font-semibold text-slate-900 mb-4">Buscar por nombre o modelo</h2>
                  <input type="text" id="search-query" placeholder="Ej: Toyota Corolla, Volkswagen Amarok..." class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:outline-none focus:border-[#e76e1d]">
                </div>
              </section>

              <section class="mb-8">
                <div class="rounded-3xl border border-slate-200 bg-white/80 p-6">
                  <div class="flex items-center justify-between mb-6">
                    <h2 class="text-xl font-semibold text-slate-900">Filtros</h2>
                    <div class="flex gap-3">
                      <button id="clear-filters" class="hidden text-sm text-[#e76e1d] hover:text-[#d45a0a] transition-colors font-medium">
                        Limpiar filtros
                      </button>
                      <button id="toggle-filters" class="text-sm text-slate-600 hover:text-slate-900 font-medium">
                        ${Icons.chevronUp(5)}
                      </button>
                    </div>
                  </div>

                  <div id="filters-content" class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label class="block text-xs uppercase tracking-widest text-slate-600 mb-2">Marca</label>
                      <input type="text" id="filter-make" placeholder="Ej: Toyota" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#e76e1d]">
                    </div>
                    <div>
                      <label class="block text-xs uppercase tracking-widest text-slate-600 mb-2">Modelo</label>
                      <input type="text" id="filter-model" placeholder="Ej: Corolla" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#e76e1d]">
                    </div>
                    <div>
                      <label class="block text-xs uppercase tracking-widest text-slate-600 mb-2">Ano minimo</label>
                      <input type="number" id="filter-min-year" min="1900" max="${new Date().getFullYear() + 1}" placeholder="Ej: 2018" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#e76e1d]">
                    </div>
                    <div>
                      <label class="block text-xs uppercase tracking-widest text-slate-600 mb-2">Ano maximo</label>
                      <input type="number" id="filter-max-year" min="1900" max="${new Date().getFullYear() + 1}" placeholder="Ej: ${new Date().getFullYear()}" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#e76e1d]">
                    </div>
                    <div>
                      <label class="block text-xs uppercase tracking-widest text-slate-600 mb-2">Precio minimo</label>
                      <input type="number" id="filter-min-price" min="0" placeholder="USD ${minCatalogPrice.toLocaleString()}" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#e76e1d]">
                    </div>
                    <div>
                      <label class="block text-xs uppercase tracking-widest text-slate-600 mb-2">Precio maximo</label>
                      <input type="number" id="filter-max-price" min="0" placeholder="USD ${maxCatalogPrice.toLocaleString()}" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#e76e1d]">
                    </div>
                    <div>
                      <label class="block text-xs uppercase tracking-widest text-slate-600 mb-2">Combustible</label>
                      <select id="filter-fuel" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#e76e1d]">
                        <option value="">Todos</option>
                        <option value="Nafta">Nafta</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Hibrido">Hibrido</option>
                        <option value="HÃ­brido">Hibrido</option>
                        <option value="Electrico">Electrico</option>
                        <option value="ElÃ©ctrico">Electrico</option>
                        <option value="GNC">GNC</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs uppercase tracking-widest text-slate-600 mb-2">Transmision</label>
                      <select id="filter-transmission" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#e76e1d]">
                        <option value="">Todas</option>
                        <option value="Manual">Manual</option>
                        <option value="Automatica">Automatica</option>
                        <option value="AutomÃ¡tica">Automatica</option>
                        <option value="CVT">CVT</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs uppercase tracking-widest text-slate-600 mb-2">Kilometraje maximo</label>
                      <input type="number" id="filter-max-mileage" min="0" step="1000" placeholder="Ej: 80000" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#e76e1d]">
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <div class="flex items-center justify-between mb-6">
                  <h2 class="text-xl font-semibold text-slate-900">Autos disponibles</h2>
                  <button id="scroll-top" class="hidden fixed bottom-8 right-8 z-50 rounded-full bg-[#e76e1d] text-white p-3 hover:bg-[#d45a0a] transition-colors shadow-xl" title="Volver al inicio">
                    ${Icons.chevronUp(5)}
                  </button>
                </div>
                <div id="cars-container" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  ${loading ? renderSkeletonCards() : ""}
                </div>
                <div class="mt-8 flex justify-center">
                  <button id="load-more-cars" class="hidden rounded-lg border border-slate-200 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-white transition-colors">
                    Cargar mas
                  </button>
                </div>
              </section>
            `
        }
      </div>
    </main>
  `;
}

function renderSkeletonCards(): string {
  return Array.from({ length: 6 }, () => `
    <div class="rounded-3xl border border-slate-200 bg-white/80 overflow-hidden">
      <div class="aspect-video animate-pulse bg-slate-200"></div>
      <div class="p-6 space-y-3">
        <div class="h-5 w-2/3 animate-pulse rounded bg-slate-200"></div>
        <div class="h-4 w-full animate-pulse rounded bg-slate-200"></div>
        <div class="h-6 w-1/3 animate-pulse rounded bg-slate-200"></div>
      </div>
    </div>
  `).join("");
}

function readFilters(minCatalogPrice: number, maxCatalogPrice: number): HomeFilters {
  const topSearchQuery = (document.getElementById("search-query") as HTMLInputElement)?.value || "";
  const make = (document.getElementById("filter-make") as HTMLInputElement)?.value || "";
  const model = (document.getElementById("filter-model") as HTMLInputElement)?.value || "";
  const minYearValue = (document.getElementById("filter-min-year") as HTMLInputElement)?.value;
  const maxYearValue = (document.getElementById("filter-max-year") as HTMLInputElement)?.value;
  const minPriceValue = (document.getElementById("filter-min-price") as HTMLInputElement)?.value;
  const maxPriceValue = (document.getElementById("filter-max-price") as HTMLInputElement)?.value;
  const maxMileageValue = (document.getElementById("filter-max-mileage") as HTMLInputElement)?.value;
  const fuel = (document.getElementById("filter-fuel") as HTMLSelectElement)?.value || "";
  const transmission = (document.getElementById("filter-transmission") as HTMLSelectElement)?.value || "";
  const minYear = minYearValue ? parseInt(minYearValue, 10) : 0;
  const maxYear = maxYearValue ? parseInt(maxYearValue, 10) : 0;
  const maxMileage = maxMileageValue ? parseInt(maxMileageValue, 10) : 0;

  return {
    searchQuery: topSearchQuery,
    make,
    model,
    minYear: minYear > 0 ? minYear : undefined,
    maxYear: maxYear > 0 ? maxYear : undefined,
    minPrice: parseInt(minPriceValue || String(minCatalogPrice), 10),
    maxPrice: parseInt(maxPriceValue || String(maxCatalogPrice), 10),
    maxMileage: maxMileage > 0 ? maxMileage : undefined,
    fuel,
    transmission,
  };
}

function filterPublishedCars(cars: SearchableCar[], filters: HomeFilters): SearchableCar[] {
  const query = filters.searchQuery?.trim().toLowerCase() ?? "";
  const hasQuery = query.length > 0;

  return cars.filter((car) => {
    if (filters.make && !car.make.toLowerCase().includes(filters.make.toLowerCase())) return false;
    if (filters.model && !car.model.toLowerCase().includes(filters.model.toLowerCase())) return false;
    if (filters.minPrice && car.price < filters.minPrice) return false;
    if (filters.maxPrice && car.price > filters.maxPrice) return false;
    if (filters.minYear && car.year < filters.minYear) return false;
    if (filters.maxYear && car.year > filters.maxYear) return false;
    if (filters.maxMileage && car.mileage > filters.maxMileage) return false;
    if (filters.fuel && car.fuel !== filters.fuel) return false;
    if (filters.transmission && car.transmission !== filters.transmission) return false;
    if (hasQuery && !car.searchText.includes(query)) return false;
    return true;
  });
}

function updateLoadMoreButton(visibleCount: number, totalCount: number): void {
  const button = document.getElementById("load-more-cars");
  if (!button) return;
  button.classList.toggle("hidden", visibleCount >= totalCount);
}
