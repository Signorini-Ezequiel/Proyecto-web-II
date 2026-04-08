import { Card } from "../components/Card";
import { StatCard } from "../components/StatCard";
import { NavBar } from "../components/NavBar";
import { getSessionUser, logout } from "../services/auth";
import { navigateTo, ROUTES } from "../utils/router";
import { CARS, filterCars } from "../data/cars";
import { setCurrentCarId } from "./car-detail";

export function renderHomePage(container: HTMLElement): void {
  const user = getSessionUser();

  if (!user) {
    navigateTo(ROUTES.landing);
    return;
  }

  const isSeller = user.role === "seller";

  // Obtener valores únicos para los filtros
  const makes = [...new Set(CARS.map(c => c.make))].sort();
  const locations = [...new Set(CARS.map(c => c.location))].sort();
  const fuels = [...new Set(CARS.map(c => c.fuel))].sort();
  const transmissions = [...new Set(CARS.map(c => c.transmission))].sort();
  const years = [...new Set(CARS.map(c => c.year))].sort((a, b) => b - a);
  const minPrice = Math.min(...CARS.map(c => c.price));
  const maxPrice = Math.max(...CARS.map(c => c.price));

  container.innerHTML = `
    <main class="min-h-screen app-bg text-slate-900">
      ${NavBar({ showAbout: false })}

      <div class="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        ${
          isSeller
            ? `
              <section class="grid gap-6">
                ${Card({
                  children: `
                    <p class="text-sm uppercase tracking-[0.25em] text-[#e76e1d]">
                      Gestión comercial
                    </p>
                    <h2 class="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                      Bienvenido, ${user.name}
                    </h2>
                    <p class="mt-4 text-sm leading-7 text-slate-600">
                      Desde acá vas a poder administrar publicaciones, consultas recibidas, métricas y estado de tus vehículos.
                    </p>

                    <div class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      ${StatCard({ title: "Publicaciones activas", value: "12", subtitle: "3 destacadas" })}
                      ${StatCard({ title: "Consultas recibidas", value: "34", subtitle: "7 sin responder" })}
                      ${StatCard({ title: "Vehículos reservados", value: "4", subtitle: "1 con entrega próxima" })}
                      ${StatCard({ title: "Precio estimado IA", value: "18 análisis", subtitle: "últimos 30 días" })}
                    </div>
                  `,
                })}
              </section>
            `
            : `
              <!-- Buscador y filtros -->
              <section class="mb-8">
                <div class="rounded-3xl border border-slate-200 bg-white/80 p-6">
                  <h2 class="text-xl font-semibold text-slate-900 mb-6">Buscar autos</h2>
                  
                  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label class="block text-sm text-slate-600 mb-2">Nombre o modelo</label>
                      <input type="text" id="search-query" placeholder="Toyota Corolla..." class="w-full rounded-lg border border-slate-200 px-4 py-2 focus:outline-none focus:border-[#e76e1d]">
                    </div>
                    <div>
                      <label class="block text-sm text-slate-600 mb-2">Marca</label>
                      <select id="filter-make" class="w-full rounded-lg border border-slate-200 px-4 py-2 focus:outline-none focus:border-[#e76e1d]">
                        <option value="">Todas las marcas</option>
                        ${makes.map(make => `<option value="${make}">${make}</option>`).join('')}
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm text-slate-600 mb-2">Ubicación</label>
                      <select id="filter-location" class="w-full rounded-lg border border-slate-200 px-4 py-2 focus:outline-none focus:border-[#e76e1d]">
                        <option value="">Todas las ubicaciones</option>
                        ${locations.map(loc => `<option value="${loc}">${loc}</option>`).join('')}
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm text-slate-600 mb-2">Combustible</label>
                      <select id="filter-fuel" class="w-full rounded-lg border border-slate-200 px-4 py-2 focus:outline-none focus:border-[#e76e1d]">
                        <option value="">Todos los combustibles</option>
                        ${fuels.map(fuel => `<option value="${fuel}">${fuel}</option>`).join('')}
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm text-slate-600 mb-2">Transmisión</label>
                      <select id="filter-transmission" class="w-full rounded-lg border border-slate-200 px-4 py-2 focus:outline-none focus:border-[#e76e1d]">
                        <option value="">Todas las transmisiones</option>
                        ${transmissions.map(trans => `<option value="${trans}">${trans}</option>`).join('')}
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm text-slate-600 mb-2">Año mínimo</label>
                      <select id="filter-year" class="w-full rounded-lg border border-slate-200 px-4 py-2 focus:outline-none focus:border-[#e76e1d]">
                        <option value="">Cualquier año</option>
                        ${years.map(year => `<option value="${year}">${year}</option>`).join('')}
                      </select>
                    </div>
                  </div>

                  <div class="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label class="block text-sm text-slate-600 mb-2">Precio mínimo: <span id="min-price-display">$${minPrice.toLocaleString()}</span></label>
                      <input type="range" id="filter-min-price" min="${minPrice}" max="${maxPrice}" value="${minPrice}" class="w-full">
                    </div>
                    <div>
                      <label class="block text-sm text-slate-600 mb-2">Precio máximo: <span id="max-price-display">$${maxPrice.toLocaleString()}</span></label>
                      <input type="range" id="filter-max-price" min="${minPrice}" max="${maxPrice}" value="${maxPrice}" class="w-full">
                    </div>
                  </div>
                </div>
              </section>

              <!-- Listado de autos -->
              <section>
                <h2 class="text-xl font-semibold text-slate-900 mb-6">Autos disponibles</h2>
                <div id="cars-container" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <!-- Se rellena dinámicamente -->
                </div>
              </section>
            `
        }
      </div>
    </main>
  `;

  // Event listeners
  document.querySelector("#navbar-brand")?.addEventListener("click", (e) => {
    e.preventDefault();
    navigateTo(ROUTES.landing);
  });

  document.querySelector("#nav-about")?.addEventListener("click", (e) => {
    e.preventDefault();
    navigateTo(ROUTES.about);
  });

  document.querySelector("#nav-home")?.addEventListener("click", () => {
    navigateTo(ROUTES.home);
  });

  document.querySelector("#nav-login")?.addEventListener("click", () => {
    window.open("/login", "_blank");
  });

  document.querySelector("#nav-register")?.addEventListener("click", () => {
    window.open("/register", "_blank");
  });

  if (isSeller) return; // Si es seller, no mostrar más

  // Logout button
  document.querySelector("#logout-button")?.addEventListener("click", () => {
    logout();
    navigateTo(ROUTES.login);
  });

  // Función para renderizar autos
  function renderCars(cars = CARS) {
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

    container.innerHTML = cars.map(car => `
      <div class="car-card rounded-3xl border border-slate-200 bg-white/80 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" data-car-id="${car.id}">
        <div class="relative aspect-video bg-slate-100 group">
          <img src="${car.images[0]}" alt="${car.make} ${car.model}" class="w-full h-full object-cover car-main-image">
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button class="car-prev-btn rounded-full bg-white/80 p-2 hover:bg-white">
              <svg class="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button class="car-next-btn rounded-full bg-white/80 p-2 hover:bg-white">
              <svg class="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div class="absolute bottom-2 right-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
            <span class="car-image-counter">1</span>/${car.images.length}
          </div>
        </div>
        <div class="p-6">
          <h3 class="font-semibold text-slate-900">${car.make} ${car.model} ${car.year}</h3>
          <p class="mt-1 text-sm text-slate-600">${car.mileage.toLocaleString()} km · ${car.transmission} · ${car.location}</p>
          <p class="mt-2 text-lg font-bold text-[#e76e1d]">US$ ${car.price.toLocaleString()}</p>
        </div>
      </div>
    `).join('');

    // Event listeners para tarjetas
    document.querySelectorAll('.car-card').forEach(card => {
      const carId = card.getAttribute('data-car-id');
      
      // Click en tarjeta para ver detalle
      card.addEventListener('click', (e) => {
        if (!(e.target as HTMLElement).closest('button')) {
          setCurrentCarId(carId!);
          navigateTo(ROUTES.carDetail);
        }
      });

      // Carrusel en tarjeta
      let imageIndex = 0;
      const car = CARS.find(c => c.id === carId);
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
    const make = (document.getElementById('filter-make') as HTMLSelectElement)?.value || '';
    const location = (document.getElementById('filter-location') as HTMLSelectElement)?.value || '';
    const fuel = (document.getElementById('filter-fuel') as HTMLSelectElement)?.value || '';
    const transmission = (document.getElementById('filter-transmission') as HTMLSelectElement)?.value || '';
    const minYear = (document.getElementById('filter-year') as HTMLSelectElement)?.value ? parseInt((document.getElementById('filter-year') as HTMLSelectElement).value) : 0;
    const minPrice = parseInt((document.getElementById('filter-min-price') as HTMLInputElement)?.value || '0');
    const maxPrice = parseInt((document.getElementById('filter-max-price') as HTMLInputElement)?.value || '999999');

    const filtered = filterCars({
      searchQuery,
      make: make || undefined,
      location: location || undefined,
      fuel: fuel || undefined,
      transmission: transmission || undefined,
      minYear: minYear > 0 ? minYear : undefined,
      minPrice,
      maxPrice
    });

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

  // Renderizar autos inicialmente
  renderCars();
}