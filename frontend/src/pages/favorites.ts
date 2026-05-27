import { NavBar, NavBarListeners } from "../components/NavBar";
import { navigateTo, ROUTES } from "../utils/router";
import type { PublishedCar } from "../services/published-cars";
import { fetchPublishedCars } from "../services/published-cars";
import { getFavorites, toggleFavorite, isFavorite } from "../services/favorites";
import { setCurrentCarId } from "./car-detail";
import { Icons } from "../utils/icons";
import { getSessionUser } from "../services/auth";

export async function renderFavoritesPage(container: HTMLElement): Promise<void> {
  const user = getSessionUser();
  if (!user || user.role === "seller") {
    navigateTo(ROUTES.home);
    return;
  }

  const favoriteIds = await getFavorites();
  const publishedCars = await fetchPublishedCars();
  const carsById = new Map(publishedCars.map((car) => [car.id, car]));
  const favoriteCars: PublishedCar[] = favoriteIds
    .map((id) => carsById.get(id) ?? null)
    .filter((car): car is PublishedCar => car !== null);

  container.innerHTML = `
    <main class="min-h-screen app-bg text-slate-900 pt-20">
      ${NavBar({ showAbout: false })}

      <div class="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div class="mb-8 flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-slate-900">Autos guardados</h1>
            <p class="mt-2 text-slate-600">Tienes ${favoriteCars.length} auto${favoriteCars.length !== 1 ? 's' : ''} guardado${favoriteCars.length !== 1 ? 's' : ''}</p>
          </div>
          <button id="scroll-top" class="hidden rounded-full bg-[#e76e1d] p-3 text-white hover:bg-[#d45a0a] transition-colors fixed bottom-8 right-8 shadow-xl" title="Volver al inicio">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
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
              <div id="favorites-grid" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                ${favoriteCars.map(car => `
                  <div class="car-card rounded-3xl border border-slate-200 bg-white/80 overflow-hidden hover:shadow-lg transition-shadow" data-car-id="${car.id}">
                    <div class="relative aspect-video bg-slate-100 group cursor-pointer">
                      ${car.images[0] ? `<img src="${car.images[0]}" alt="${car.make} ${car.model}" class="w-full h-full object-cover car-main-image">` : `<div class="flex h-full w-full items-center justify-center text-sm text-slate-500">Sin imagen</div>`}
                      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button class="car-prev-btn rounded-full bg-white/80 p-2 hover:bg-white">
                          ${Icons.chevronLeft(4)}
                        </button>
                        <button class="car-next-btn rounded-full bg-white/80 p-2 hover:bg-white">
                          ${Icons.chevronRight(4)}
                        </button>
                      </div>
                      <button class="favorite-btn absolute top-3 right-3 rounded-full bg-white/80 p-2 hover:bg-white transition-transform" data-car-id="${car.id}">
                        ${isFavorite(car.id) ? Icons.heart(5, true) : Icons.heart(5, false)}
                      </button>
                      <div class="absolute bottom-2 right-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                        <span class="car-image-counter">1</span>/${Math.max(car.images.length, 1)}
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

  // Listeners de navegación SPA y logout del NavBar
  NavBarListeners();

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
  document.querySelectorAll<HTMLElement>('.car-card').forEach(card => {
    const carId = card.getAttribute('data-car-id');

    // Click en tarjeta para ver detalle
    card.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).closest('.favorite-btn, .car-prev-btn, .car-next-btn')) {
        setCurrentCarId(carId!, true);
        navigateTo(`${ROUTES.carDetail}?id=${encodeURIComponent(carId!)}&from=favorites`);
      }
    });

    // Botón favorito - optimistic update
    const favoriteBtn = card.querySelector('.favorite-btn') as HTMLButtonElement;
    if (favoriteBtn) {
      favoriteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();

        // Cambiar icono instantáneamente (optimistic)
        const currentlyFavorite = isFavorite(carId!);
        favoriteBtn.innerHTML = !currentlyFavorite
          ? Icons.heart(5, true)
          : Icons.heart(5, false);
        favoriteBtn.style.transform = 'scale(1.2)';
        setTimeout(() => {
          favoriteBtn.style.transform = '';
        }, 150);

        // Sincronizar con backend en background
        void toggleFavorite(carId!).then(() => {
          favoriteBtn.innerHTML = isFavorite(carId!)
            ? Icons.heart(5, true)
            : Icons.heart(5, false);
        });

        // Si se desfavoritó, remover la tarjeta con animación
        if (currentlyFavorite) {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          setTimeout(() => {
            card.remove();
            // Si no hay más tarjetas, recargar página
            const grid = document.querySelector('#favorites-grid');
            if (grid && grid.children.length === 0) {
              location.reload();
            }
          }, 300);
        }
      });
    }

    // Carrusel en tarjeta
    let imageIndex = 0;
    const car = favoriteCars.find(c => c.id === carId);
    if (!car) return;

    const mainImage = card.querySelector('.car-main-image') as HTMLImageElement;
    const counter = card.querySelector('.car-image-counter');

    const updateImage = () => {
      if (mainImage && car.images[imageIndex]) mainImage.src = car.images[imageIndex];
      if (counter) counter.textContent = (imageIndex + 1).toString();
    };

    card.querySelector('.car-prev-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (car.images.length === 0) return;
      imageIndex = imageIndex > 0 ? imageIndex - 1 : car.images.length - 1;
      updateImage();
    });

    card.querySelector('.car-next-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (car.images.length === 0) return;
      imageIndex = imageIndex < car.images.length - 1 ? imageIndex + 1 : 0;
      updateImage();
    });
  });
}
