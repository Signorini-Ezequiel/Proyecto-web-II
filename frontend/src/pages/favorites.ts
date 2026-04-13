import { NavBar } from "../components/NavBar";
import { navigateTo, ROUTES } from "../utils/router";
import { CARS } from "../data/cars";
import { getFavorites, toggleFavorite, isFavorite } from "../services/favorites";
import { setCurrentCarId } from "./car-detail";
import { logout } from "../services/auth";
import { Icons } from "../utils/icons";

export function renderFavoritesPage(container: HTMLElement): void {
  const favoriteIds = getFavorites();
  const favoriteCars = CARS.filter(car => favoriteIds.includes(car.id));

  container.innerHTML = `
    <main class="min-h-screen app-bg text-slate-900">
      ${NavBar({ showAbout: false, isFavoritesPage: true })}

      <div class="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div class="mb-8 flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-slate-900">Autos guardados</h1>
            <p class="mt-2 text-slate-600">Tienes ${favoriteCars.length} auto${favoriteCars.length !== 1 ? 's' : ''} guardado${favoriteCars.length !== 1 ? 's' : ''}</p>
          </div>
          <button id="scroll-top" class="hidden rounded-full bg-[#e76e1d] p-3 text-white hover:bg-[#d45a0a] transition-colors fixed bottom-8 right-8 shadow-xl" title="Volver al inicio">
            ${Icons.arrowUp(6)}
          </button>
        </div>

        ${
          favoriteCars.length === 0
            ? `
              <div class="rounded-3xl border border-slate-200 bg-white/80 p-12 text-center">
                <svg class="h-16 w-16 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <h2 class="text-xl font-semibold text-slate-900 mb-2">Sin autos guardados</h2>
                <p class="text-slate-600 mb-6">Aún no has guardado ningún auto. Explora nuestro catálogo y guarda tus favoritos.</p>
                <button id="go-search" class="inline-block rounded-lg bg-[#e76e1d] px-6 py-3 text-sm font-medium text-white hover:bg-[#d45a0a] transition-colors">
                  Explorar autos
                </button>
              </div>
            `
            : `
              <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                ${favoriteCars.map(car => `
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
                      <button class="favorite-btn absolute top-3 right-3 rounded-full bg-white/80 p-2 hover:bg-white" data-car-id="${car.id}">
                        ${isFavorite(car.id) ? Icons.heart(5, true) : Icons.heart(5, false)}
                      </button>
                      <div class="absolute bottom-2 right-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                        <span class="car-image-counter">1</span>/${car.images.length}
                      </div>
                    </div>
                    <div class="p-6 cursor-pointer car-details">
                      <h3 class="font-semibold text-slate-900">${car.make} ${car.model} ${car.year}</h3>
                      <p class="mt-1 text-sm text-slate-600">${car.mileage.toLocaleString()} km · ${car.transmission} · ${car.location}</p>
                      <p class="mt-2 text-lg font-bold text-[#e76e1d]">US$ ${car.price.toLocaleString()}</p>
                    </div>
                  </div>
                `).join('')}
              </div>
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

  document.querySelector("#nav-home-link")?.addEventListener("click", (e) => {
    e.preventDefault();
    navigateTo(ROUTES.home);
  });

  document.querySelector("#nav-logout")?.addEventListener("click", () => {
    logout();
    navigateTo(ROUTES.landing);
  });

  document.querySelector("#nav-login")?.addEventListener("click", () => {
    window.open("/login", "_blank");
  });

  document.querySelector("#nav-register")?.addEventListener("click", () => {
    window.open("/register", "_blank");
  });

  document.querySelector("#go-search")?.addEventListener("click", () => {
    navigateTo(ROUTES.home);
  });

  const scrollTopBtn = document.querySelector('#scroll-top') as HTMLButtonElement;
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', () => {
      scrollTopBtn.classList.toggle('hidden', window.scrollY < 300);
    });
  }

  // Event listeners para tarjetas
  document.querySelectorAll('.car-card').forEach(card => {
    const carId = card.getAttribute('data-car-id');
    
    // Click en tarjeta para ver detalle
    card.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).closest('.favorite-btn, .car-prev-btn, .car-next-btn')) {
        sessionStorage.setItem("previousPage", ROUTES.favorites);
        setCurrentCarId(carId!);
        navigateTo(ROUTES.carDetail);
      }
    });

    // Botón favorito
    card.querySelector('.favorite-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(carId!);
      const btn = e.target as HTMLElement;
      btn.innerHTML = isFavorite(carId!) ? Icons.heart(5, true) : Icons.heart(5, false);
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
