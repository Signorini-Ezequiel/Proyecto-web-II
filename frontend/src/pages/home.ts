import { NavBar, NavBarListeners } from "../components/NavBar";
import { getSessionUser, logout, getUserById } from "../services/auth";
import { navigateTo, ROUTES } from "../utils/router";
import { filterCars } from "../data/cars";
import { getAllCarsForDisplay, getPublishedCarById, getPublishedCarsBySeller } from "../services/published-cars";
import { setCurrentCarId } from "./car-detail";
import { isFavorite, toggleFavorite } from "../services/favorites";
import { Icons } from "../utils/icons";

export function renderHomePage(container: HTMLElement): void {
  const user = getSessionUser();

  if (!user) {
    navigateTo(ROUTES.landing);
    return;
  }

  const isSeller = user.role === "seller";

  // Obtener autos a mostrar
  const allCars: any[] = getAllCarsForDisplay();
  const carsToShow = isSeller ? getPublishedCarsBySeller(user.id).map(published => ({
    id: published.id,
    make: published.make,
    model: published.model,
    year: published.year,
    price: published.price,
    mileage: published.mileage,
    transmission: published.transmission,
    fuel: published.fuel,
    color: published.color,
    location: published.location,
    description: published.description,
    images: published.images,
    specs: published.specs || {}
  })) : allCars;

  // Variables para filtros (solo para compradores)
  let makes: string[] = [];
  let locations: string[] = [];
  let fuels: string[] = [];
  let transmissions: string[] = [];
  let years: number[] = [];
  let minPrice = 0;
  let maxPrice = 0;

  if (!isSeller) {
    makes = [...new Set(allCars.map((c: any) => c.make))].sort() as string[];
    locations = [...new Set(allCars.map((c: any) => c.location))].sort() as string[];
    fuels = [...new Set(allCars.map((c: any) => c.fuel))].sort() as string[];
    transmissions = [...new Set(allCars.map((c: any) => c.transmission))].sort() as string[];
    years = [...new Set(allCars.map((c: any) => c.year))].sort((a: number, b: number) => b - a) as number[];
    minPrice = Math.min(...allCars.map((c: any) => c.price));
    maxPrice = Math.max(...allCars.map((c: any) => c.price));
  }

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
                  Publicar nuevo vehículo
                </button>
              </div>
              <div id="cars-container" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3"></div>
            `
            : `
              <!-- Buscador -->
              <section class="mb-8">
                <div class="rounded-3xl border border-slate-200 bg-white/80 p-6">
                  <h2 class="text-xl font-semibold text-slate-900 mb-4">Buscar por nombre o modelo</h2>
                  <input type="text" id="search-query" placeholder="Ej: Toyota Corolla, Volkswagen Amarok..." class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:outline-none focus:border-[#e76e1d]">
                </div>
              </section>

              <!-- Filtros (Collapsible) -->
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
                      <div class="relative">
                        <input type="text" id="filter-make-search" placeholder="Buscar marca..." class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#e76e1d]">
                        <input type="hidden" id="filter-make">
                        <div id="filter-make-dropdown" class="hidden absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          <!-- Se rellena dinámicamente -->
                        </div>
                      </div>
                    </div>
                    <div>
                      <label class="block text-xs uppercase tracking-widest text-slate-600 mb-2">Ubicación</label>
                      <div class="relative">
                        <input type="text" id="filter-location-search" placeholder="Buscar ubicación..." class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#e76e1d]">
                        <input type="hidden" id="filter-location">
                        <div id="filter-location-dropdown" class="hidden absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          <!-- Se rellena dinámicamente -->
                        </div>
                      </div>
                    </div>
                    <div>
                      <label class="block text-xs uppercase tracking-widest text-slate-600 mb-2">Combustible</label>
                      <select id="filter-fuel" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#e76e1d]">
                        <option value="">Todos los combustibles</option>
                        ${fuels.map(fuel => `<option value="${fuel}">${fuel}</option>`).join('')}
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs uppercase tracking-widest text-slate-600 mb-2">Transmisión</label>
                      <select id="filter-transmission" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#e76e1d]">
                        <option value="">Todas las transmisiones</option>
                        ${transmissions.map(trans => `<option value="${trans}">${trans}</option>`).join('')}
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs uppercase tracking-widest text-slate-600 mb-2">Año mínimo</label>
                      <div class="relative">
                        <input type="text" id="filter-year-search" placeholder="Buscar año..." class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#e76e1d]">
                        <input type="hidden" id="filter-year">
                        <div id="filter-year-dropdown" class="hidden absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          <!-- Se rellena dinámicamente -->
                        </div>
                      </div>
                    </div>
                  </div>

                  <div id="price-filters" class="mt-4 grid gap-3 md:grid-cols-2">
                    <div>
                      <label class="block text-xs uppercase tracking-widest text-slate-600 mb-2">Precio mín: <span id="min-price-display">$${minPrice.toLocaleString()}</span></label>
                      <input type="range" id="filter-min-price" min="${minPrice}" max="${maxPrice}" value="${minPrice}" class="w-full">
                    </div>
                    <div>
                      <label class="block text-xs uppercase tracking-widest text-slate-600 mb-2">Precio máx: <span id="max-price-display">$${maxPrice.toLocaleString()}</span></label>
                      <input type="range" id="filter-max-price" min="${minPrice}" max="${maxPrice}" value="${maxPrice}" class="w-full">
                    </div>
                  </div>
                </div>
              </section>

              <!-- Listado de autos -->
              <section>
                <div class="flex items-center justify-between mb-6">
                  <h2 class="text-xl font-semibold text-slate-900">Autos disponibles</h2>
                  <button id="scroll-top" class="hidden fixed bottom-8 right-8 z-50 rounded-full bg-[#e76e1d] text-white p-3 hover:bg-[#d45a0a] transition-colors shadow-xl" title="Volver al inicio">
                    ${Icons.chevronUp(5)}
                  </button>
                </div>
                <div id="cars-container" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <!-- Se rellena dinámicamente -->
                </div>
              </section>
            `
        }
      </div>
    </main>
  `;

  // Listeners de navegación SPA y logout del NavBar
  NavBarListeners();

  if (isSeller) {
    renderCars(carsToShow);
    // Botón publicar vehículo
    document.getElementById("publish-btn")?.addEventListener("click", () => {
      navigateTo(ROUTES.publish);
    });

    return;
  } // Si es seller, no mostrar más

  // Logout button
  document.querySelector("#logout-button")?.addEventListener("click", () => {
    logout();
    navigateTo(ROUTES.login);
  });

  // Función para renderizar autos
  function renderCars(cars: any[]) {
    const container = document.getElementById("cars-container");
    if (!container) return;

    if (cars.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <p class="text-slate-600">No se encontraron autos con los filtros seleccionados</p>
        </div>
      `;
      return;
    }

    container.innerHTML = cars.map((car: any) => {
      const publishedCar = getPublishedCarById(car.id);
      const isOwner = publishedCar && publishedCar.sellerId === user!.id;
      const sellerName = publishedCar ? getUserById(publishedCar.sellerId)?.name : null;
      
      return `
        <div class="car-card rounded-3xl border border-slate-200 bg-white/80 overflow-hidden hover:shadow-lg transition-shadow" data-car-id="${car.id}">
          <div class="relative aspect-video bg-slate-100 group cursor-pointer">
            <img src="${car.images[0]}" alt="${car.make} ${car.model}" class="w-full h-full object-cover car-main-image">
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button class="car-prev-btn rounded-full bg-white/80 p-2 hover:bg-white">
                ${Icons.chevronLeft(4)}
              </button>
              <button class="car-next-btn rounded-full bg-white/80 p-2 hover:bg-white">
                ${Icons.chevronRight(4)}
              </button>
            </div>
            ${!isOwner ? `<button class="favorite-btn absolute top-3 right-3 rounded-full bg-white/80 p-2 hover:bg-white" data-car-id="${car.id}">
              ${isFavorite(car.id) ? Icons.heart(5, true) : Icons.heart(5, false)}
            </button>` : ''}
            ${isOwner ? `
              <button class="edit-btn absolute top-3 left-3 rounded-full bg-[#e76e1d] text-white p-2 hover:bg-[#d45a0a] transition-colors" data-car-id="${car.id}" title="Editar vehículo">
                ${Icons.edit(4)}
              </button>
            ` : ''}
            <div class="absolute bottom-2 right-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
              <span class="car-image-counter">1</span>/${car.images.length}
            </div>
          </div>
          <div class="p-6 cursor-pointer car-details">
            <h3 class="font-semibold text-slate-900">${car.make} ${car.model} ${car.year}</h3>
            <p class="mt-1 text-sm text-slate-600">${car.mileage.toLocaleString()} km · ${car.transmission} · ${car.location}</p>
            <p class="mt-2 text-lg font-bold text-[#e76e1d]">US$ ${car.price.toLocaleString()}</p>
            <p class="mt-1 text-sm text-slate-500">Publicado por: ${sellerName || 'N/A'}</p>
          </div>
        </div>
      `;
    }).join('');

    // Event listeners para tarjetas
    document.querySelectorAll('.car-card').forEach(card => {
      const carId = card.getAttribute('data-car-id');
      
      // Click en tarjeta para ver detalle
      card.addEventListener('click', (e) => {
        if (!(e.target as HTMLElement).closest('.favorite-btn, .car-prev-btn, .car-next-btn')) {
          sessionStorage.setItem("previousPage", ROUTES.home);
          const publishedCar = getPublishedCarById(carId!);
          if (publishedCar) {
            setCurrentCarId(carId!, true);
            navigateTo(ROUTES.carDetail);
          } else {
            setCurrentCarId(carId!, false);
            navigateTo(ROUTES.carDetail);
          }
        }
      });

      // Botón favorito
      card.querySelector('.favorite-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const btn = (e.target as HTMLElement).closest('.favorite-btn') as HTMLElement | null;
        if (!btn) return;
        toggleFavorite(carId!);
        btn.innerHTML = isFavorite(carId!) ? Icons.heart(5, true) : Icons.heart(5, false);
      });

      // Botón editar (solo para propietarios)
      card.querySelector('.edit-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateTo(`${ROUTES.editCar}?id=${carId}`);
      });

      // Carrusel en tarjeta
      let imageIndex = 0;
      const car = cars.find(c => c.id === carId);
      if (!car) return;

      const mainImage = card.querySelector('.car-main-image') as HTMLImageElement;
      const counter = card.querySelector('.car-image-counter');
      
      const updateImage = () => {
        mainImage.src = car.images[imageIndex];
        if (counter) counter.textContent = (imageIndex + 1).toString();
      };

      card.querySelector('.car-prev-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        imageIndex = imageIndex > 0 ? imageIndex - 1 : car.images.length - 1;
        updateImage();
      });

      card.querySelector('.car-next-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        imageIndex = imageIndex < car.images.length - 1 ? imageIndex + 1 : 0;
        updateImage();
      });
    });
  }

  // Función para aplicar filtros
  function applyFilters() {
    const searchQuery = (document.getElementById('search-query') as HTMLInputElement)?.value || '';
    const make = (document.getElementById('filter-make') as HTMLInputElement)?.value || '';
    const location = (document.getElementById('filter-location') as HTMLInputElement)?.value || '';
    const fuel = (document.getElementById('filter-fuel') as HTMLSelectElement)?.value || '';
    const transmission = (document.getElementById('filter-transmission') as HTMLSelectElement)?.value || '';
    const minYear = (document.getElementById('filter-year') as HTMLInputElement)?.value ? parseInt((document.getElementById('filter-year') as HTMLInputElement).value) : 0;
    const minPrice = parseInt((document.getElementById('filter-min-price') as HTMLInputElement)?.value || '0');
    const maxPrice = parseInt((document.getElementById('filter-max-price') as HTMLInputElement)?.value || '999999');

    // Verificar si hay filtros aplicados
    const hasFilters = searchQuery || make || location || fuel || transmission || minYear > 0 || minPrice > parseInt((document.getElementById('filter-min-price') as HTMLInputElement)?.min || '0') || maxPrice < parseInt((document.getElementById('filter-max-price') as HTMLInputElement)?.max || '999999');
    
    const clearBtn = document.getElementById('clear-filters');
    if (clearBtn) {
      clearBtn.classList.toggle('hidden', !hasFilters);
    }

    const filtered = filterCars({
      searchQuery,
      make: make || undefined,
      location: location || undefined,
      fuel: fuel || undefined,
      transmission: transmission || undefined,
      minYear: minYear > 0 ? minYear : undefined,
      minPrice,
      maxPrice
    }, allCars);

    renderCars(filtered);
  }

  // Event listeners para filtros
  document.getElementById('search-query')?.addEventListener('input', applyFilters);
  document.getElementById('filter-make')?.addEventListener('change', applyFilters);
  document.getElementById('filter-location')?.addEventListener('change', applyFilters);
  document.getElementById('filter-fuel')?.addEventListener('change', applyFilters);
  document.getElementById('filter-transmission')?.addEventListener('change', applyFilters);
  document.getElementById('filter-year')?.addEventListener('change', applyFilters);
  
  document.getElementById('filter-min-price')?.addEventListener('input', (e) => {
    const display = document.getElementById('min-price-display');
    if (display) display.textContent = `$${(e.target as HTMLInputElement).value}`;
    applyFilters();
  });

  document.getElementById('filter-max-price')?.addEventListener('input', (e) => {
    const display = document.getElementById('max-price-display');
    if (display) display.textContent = `$${(e.target as HTMLInputElement).value}`;
    applyFilters();
  });

  // Limpiar filtros
  document.getElementById('clear-filters')?.addEventListener('click', () => {
    (document.getElementById('search-query') as HTMLInputElement).value = '';
    (document.getElementById('filter-make-search') as HTMLInputElement).value = '';
    (document.getElementById('filter-make') as HTMLInputElement).value = '';
    (document.getElementById('filter-location-search') as HTMLInputElement).value = '';
    (document.getElementById('filter-location') as HTMLInputElement).value = '';
    (document.getElementById('filter-fuel') as HTMLSelectElement).value = '';
    (document.getElementById('filter-transmission') as HTMLSelectElement).value = '';
    (document.getElementById('filter-year-search') as HTMLInputElement).value = '';
    (document.getElementById('filter-year') as HTMLInputElement).value = '';
    (document.getElementById('filter-min-price') as HTMLInputElement).value = minPrice.toString();
    (document.getElementById('filter-max-price') as HTMLInputElement).value = maxPrice.toString();
    (document.getElementById('min-price-display') as HTMLElement).textContent = `$${minPrice.toLocaleString()}`;
    (document.getElementById('max-price-display') as HTMLElement).textContent = `$${maxPrice.toLocaleString()}`;
    applyFilters();
  });

  // Funciones para dropdowns con búsqueda
  function renderDropdown(searchId: string, dropdownId: string, hiddenId: string, options: string[]) {
    const searchInput = document.getElementById(searchId) as HTMLInputElement;
    const dropdown = document.getElementById(dropdownId) as HTMLElement;
    const hiddenInput = document.getElementById(hiddenId) as HTMLInputElement;

    function updateDropdown(filter = "") {
      const filtered = options.filter(option => option.toLowerCase().includes(filter.toLowerCase()));
      dropdown.innerHTML = filtered.length > 0 
        ? filtered.map(option => `<div class="dropdown-option cursor-pointer px-4 py-2 text-sm hover:bg-slate-100" data-value="${option}">${option}</div>`).join('')
        : '<div class="px-4 py-2 text-sm text-slate-500">No se encontraron resultados</div>';
    }

    searchInput.addEventListener('focus', () => {
      dropdown.classList.remove('hidden');
      updateDropdown(searchInput.value);
    });

    searchInput.addEventListener('input', () => {
      updateDropdown(searchInput.value);
    });

    dropdown.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('dropdown-option')) {
        const value = target.getAttribute('data-value');
        searchInput.value = value || '';
        hiddenInput.value = value || '';
        dropdown.classList.add('hidden');
        applyFilters();
      }
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target as Node) && !dropdown.contains(e.target as Node)) {
        dropdown.classList.add('hidden');
        if (searchInput.value && !options.includes(searchInput.value)) {
          searchInput.value = '';
          hiddenInput.value = '';
        }
      }
    });
  }

  // Inicializar dropdowns
  renderDropdown('filter-make-search', 'filter-make-dropdown', 'filter-make', makes);
  renderDropdown('filter-location-search', 'filter-location-dropdown', 'filter-location', locations);
  renderDropdown('filter-year-search', 'filter-year-dropdown', 'filter-year', years.map(y => y.toString()));

  // Toggle de filtros
  let filtersExpanded = true;
  document.getElementById('toggle-filters')?.addEventListener('click', () => {
    const content = document.getElementById('filters-content');
    const priceFilters = document.getElementById('price-filters');
    const toggleBtn = document.getElementById('toggle-filters');
    filtersExpanded = !filtersExpanded;
    if (content) content.style.display = filtersExpanded ? 'grid' : 'none';
    if (priceFilters) priceFilters.style.display = filtersExpanded ? 'grid' : 'none';
    if (toggleBtn) {
      toggleBtn.innerHTML = filtersExpanded ? Icons.chevronUp(5) : Icons.chevronDown(5);
    }
  });

  const scrollBtn = document.getElementById('scroll-top');
  if (scrollBtn) {
    scrollBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', () => {
      scrollBtn.classList.toggle('hidden', window.scrollY < 300);
    });
  }

  // Renderizar autos inicialmente
  renderCars(carsToShow);
}
