import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { NavBar } from "../components/NavBar";
import { navigateTo, ROUTES } from "../utils/router";
import { getPublishedCarById } from "../services/published-cars";
import { getSessionUser, getUserById, logout } from "../services/auth";
import type { CarSpecs } from "../data/cars";
import { Icons } from "../utils/icons";

// Almacenamos el ID del auto publicado en sessionStorage
export function setCurrentPublishedCarId(id: string) {
  sessionStorage.setItem("currentPublishedCarId", id);
}

export function renderPublishedCarDetailPage(container: HTMLElement): void {
  const carId = sessionStorage.getItem("currentPublishedCarId");
  if (!carId) {
    navigateTo(ROUTES.home);
    return;
  }

  const publishedCar = getPublishedCarById(carId);
  if (!publishedCar) {
    container.innerHTML = `
      <main class="min-h-screen app-bg text-slate-900">
        <p>Auto no encontrado</p>
      </main>
    `;
    return;
  }

  const user = getSessionUser();
  const seller = getUserById(publishedCar.sellerId);
  const isOwner = user && user.id === publishedCar.sellerId;

  const car = {
    id: publishedCar.id,
    make: publishedCar.make,
    model: publishedCar.model,
    year: publishedCar.year,
    price: publishedCar.price,
    mileage: publishedCar.mileage,
    transmission: publishedCar.transmission,
    fuel: publishedCar.fuel,
    color: publishedCar.color,
    location: publishedCar.location,
    description: publishedCar.description,
    images: publishedCar.images,
    specs: (publishedCar.specs || {
      engine: "",
      power: "",
      torque: "",
      acceleration: "",
      topSpeed: "",
      consumption: "",
      dimensions: "",
      weight: "",
      features: []
    }) as CarSpecs
  };

  container.innerHTML = `
    <main class="min-h-screen app-bg text-slate-900 pt-20">
      ${NavBar({ showAbout: false })}

      <div class="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <button id="back-home" class="mb-6 flex items-center gap-2 text-[#e76e1d] hover:text-[#d45a0a] transition-colors">
          ${Icons.chevronLeft(5)}
          <span>Volver al inicio</span>
        </button>
        <div class="grid gap-8 lg:grid-cols-2">
          <!-- Carrusel de fotos -->
          <div class="space-y-4">
            <div class="relative aspect-video overflow-hidden rounded-3xl border border-slate-200 bg-white/80">
              <img id="main-image" src="${car.images[0]}" alt="${car.make} ${car.model}" class="h-full w-full object-cover">
              <button id="prev-image" class="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-lg hover:bg-white">
                ${Icons.chevronLeft(5)}
              </button>
              <button id="next-image" class="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-lg hover:bg-white">
                ${Icons.chevronRight(5)}
              </button>
            </div>

            <div class="flex gap-2 overflow-x-auto">
              ${car.images.map((image, index) => `
                <button class="thumbnail-btn flex-shrink-0 w-16 h-16 rounded-lg border-2 border-transparent overflow-hidden hover:border-[#e76e1d] transition-colors" data-index="${index}">
                  <img src="${image}" alt="Thumbnail ${index + 1}" class="w-full h-full object-cover">
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Información del auto -->
          <div class="space-y-6">
            ${Card({
              children: `
                <div class="flex items-start justify-between">
                  <div>
                    <h1 class="text-3xl font-bold text-slate-900">${car.make} ${car.model} ${car.year}</h1>
                    <p class="mt-2 text-lg text-slate-600">${car.mileage.toLocaleString()} km · ${car.transmission} · ${car.fuel} · ${car.location}</p>
                    <p class="mt-2 text-sm text-slate-500">Publicado por: ${seller?.name || 'N/A'}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-3xl font-bold text-[#e76e1d]">US$ ${car.price.toLocaleString()}</p>
                  </div>
                </div>

                <div class="mt-6 grid gap-4 md:grid-cols-2">
                  <div>
                    <p class="text-sm uppercase tracking-widest text-slate-600">Color</p>
                    <p class="font-semibold">${car.color}</p>
                  </div>
                  <div>
                    <p class="text-sm uppercase tracking-widest text-slate-600">Ubicación</p>
                    <p class="font-semibold">${car.location}</p>
                  </div>
                  <div>
                    <p class="text-sm uppercase tracking-widest text-slate-600">Transmisión</p>
                    <p class="font-semibold">${car.transmission}</p>
                  </div>
                  <div>
                    <p class="text-sm uppercase tracking-widest text-slate-600">Combustible</p>
                    <p class="font-semibold">${car.fuel}</p>
                  </div>
                </div>

                <div class="mt-6">
                  <p class="text-sm uppercase tracking-widest text-slate-600 mb-2">Descripción</p>
                  <p class="text-slate-700 leading-relaxed">${car.description}</p>
                </div>

                <div class="mt-6 flex gap-3">
                  ${isOwner ? `
                    ${Button({ id: "edit-car", text: "Editar vehículo", variant: "primary" })}
                  ` : `
                    ${Button({ id: "contact-seller", text: "Contactar vendedor", variant: "primary" })}
                    ${Button({ id: "buy-car", text: "Comprar", variant: "secondary" })}
                  `}
                </div>
              `,
            })}

            <!-- Especificaciones técnicas -->
            ${car.specs ? Card({
              children: `
                <h3 class="text-lg font-semibold text-slate-900 mb-4">Especificaciones técnicas</h3>
                <div class="grid gap-4 md:grid-cols-2">
                  <div>
                    <p class="text-sm uppercase tracking-widest text-slate-600">Motor</p>
                    <p class="font-semibold">${car.specs.engine}</p>
                  </div>
                  <div>
                    <p class="text-sm uppercase tracking-widest text-slate-600">Potencia</p>
                    <p class="font-semibold">${car.specs.power}</p>
                  </div>
                  <div>
                    <p class="text-sm uppercase tracking-widest text-slate-600">Torque</p>
                    <p class="font-semibold">${car.specs.torque}</p>
                  </div>
                  <div>
                    <p class="text-sm uppercase tracking-widest text-slate-600">Aceleración 0-100 km/h</p>
                    <p class="font-semibold">${car.specs.acceleration}</p>
                  </div>
                  <div>
                    <p class="text-sm uppercase tracking-widest text-slate-600">Velocidad máxima</p>
                    <p class="font-semibold">${car.specs.topSpeed}</p>
                  </div>
                  <div>
                    <p class="text-sm uppercase tracking-widest text-slate-600">Consumo</p>
                    <p class="font-semibold">${car.specs.consumption}</p>
                  </div>
                  <div class="md:col-span-2">
                    <p class="text-sm uppercase tracking-widest text-slate-600">Dimensiones</p>
                    <p class="font-semibold">${car.specs.dimensions}</p>
                  </div>
                  <div class="md:col-span-2">
                    <p class="text-sm uppercase tracking-widest text-slate-600">Peso</p>
                    <p class="font-semibold">${car.specs.weight}</p>
                  </div>
                </div>

                ${car.specs.features && car.specs.features.length > 0 ? `
                  <div class="mt-6">
                    <p class="text-sm uppercase tracking-widest text-slate-600 mb-2">Características</p>
                    <div class="flex flex-wrap gap-2">
                      ${car.specs.features.map((feature: string) => `<span class="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">${feature}</span>`).join('')}
                    </div>
                  </div>
                ` : ''}
              `,
            }) : ''}
          </div>
        </div>
      </div>
    </main>
  `;

  // Event listeners
  const backHomeBtn = document.getElementById("back-home");
  if (backHomeBtn) {
    backHomeBtn.addEventListener("click", () => navigateTo(ROUTES.home));
  }

  const editCarBtn = document.getElementById("edit-car");
  if (editCarBtn) {
    editCarBtn.addEventListener("click", () => {
      // Set edit mode and navigate to publish
      sessionStorage.setItem("editCarId", carId);
      navigateTo(ROUTES.publish);
    });
  }

  const contactSellerBtn = document.getElementById("contact-seller");
  if (contactSellerBtn) {
    contactSellerBtn.addEventListener("click", () => {
      alert(`Contactar a ${seller?.name} al email: ${seller?.email}`);
    });
  }

  const buyCarBtn = document.getElementById("buy-car");
  if (buyCarBtn) {
    buyCarBtn.addEventListener("click", () => {
      alert("Función de compra próximamente disponible");
    });
  }

  // Carrusel de imágenes
  let currentImageIndex = 0;
  const mainImage = document.getElementById("main-image") as HTMLImageElement;
  const prevBtn = document.getElementById("prev-image");
  const nextBtn = document.getElementById("next-image");
  const thumbnails = document.querySelectorAll(".thumbnail-btn");

  function updateImage(index: number) {
    currentImageIndex = index;
    if (mainImage) mainImage.src = car.images[currentImageIndex];
    thumbnails.forEach((thumb, i) => {
      thumb.classList.toggle("border-[#e76e1d]", i === currentImageIndex);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : car.images.length - 1;
      updateImage(newIndex);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const newIndex = currentImageIndex < car.images.length - 1 ? currentImageIndex + 1 : 0;
      updateImage(newIndex);
    });
  }

  thumbnails.forEach((thumb, index) => {
    thumb.addEventListener("click", () => updateImage(index));
  });

  // Logout
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      logout();
      navigateTo(ROUTES.login);
    });
  }
}