import { NavBar, NavBarListeners } from "../components/NavBar";
import { getSessionUser, logout } from "../services/auth";
import { navigateTo, ROUTES } from "../utils/router";
import { Icons } from "../utils/icons";
import { MAKES } from "../data/makes";
import {
  getPublishedCarById,
  normalizeCarSpecs,
  savePublishedCar,
  updatePublishedCar,
} from "../services/published-cars";
import type { PublishedCar } from "../services/published-cars";
import { showToast } from "../utils/toast";

const CURRENT_YEAR = new Date().getFullYear();
const VALIDATION_LIMITS = {
  year: { min: 1995, max: CURRENT_YEAR + 1 },
  price: { min: 1000, max: 500000 },
  mileage: { min: 0, max: 500000 },
  featuresMin: 2,
};

const FIELD_RULES = {
  model: /^[a-zA-Z0-9\s\-]+$/,
  color: /^[a-zA-Z\s]+$/,
  location: /^[a-zA-Z\s]+$/,
  description: /^[a-zA-Z0-9\s\.\,\-\(\)\/]+$/,
  engine: /^[a-zA-Z0-9\s\.\,\-\/]+$/,
  power: /^[a-zA-Z0-9\s\.\,\-\/]+$/,
  torque: /^[a-zA-Z0-9\s\.\,\-\/]+$/,
  acceleration: /^[a-zA-Z0-9\s\.\,\-\/]+$/,
  topSpeed: /^[a-zA-Z0-9\s\.\,\-\/]+$/,
  consumption: /^[a-zA-Z0-9\s\.\,\-\/]+$/,
  dimensions: /^[a-zA-Z0-9\s\.\,\-xX\/]+$/,
  weight: /^[a-zA-Z0-9\s\.\,\-\/]+$/,
  features: /^[a-zA-Z0-9\s\.\,\-\/"\+]+$/,
};

const FIELD_LABELS = {
  make: "Marca",
  model: "Modelo",
  year: "Año",
  price: "Precio",
  mileage: "Kilómetros",
  transmission: "Transmisión",
  fuel: "Combustible",
  color: "Color",
  location: "Ubicación",
  description: "Descripción",
  engine: "Motor",
  power: "Potencia",
  torque: "Torque",
  acceleration: "Aceleración",
  topSpeed: "Velocidad máxima",
  consumption: "Consumo",
  dimensions: "Dimensiones",
  weight: "Peso",
  features: "Equipamiento",
};

function parseFeatures(rawValue: string): string[] {
  return rawValue
    .split(/,|\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function renderPublishPage(container: HTMLElement, isEditMode = false): void {
  const user = getSessionUser();

  if (!user) {
    navigateTo(ROUTES.landing);
    return;
  }

  if (user.role !== "seller") {
    navigateTo(ROUTES.home);
    return;
  }

  let uploadedPhotos: string[] = []; // Cambiar a string[] para base64
  const errors: Record<string, string> = {};

  const urlParams = new URLSearchParams(window.location.search);
  const carId = urlParams.get("id");
  let existingCar: PublishedCar | null = null;

  if (isEditMode && carId) {
    existingCar = getPublishedCarById(carId);
    if (!existingCar || existingCar.sellerId !== user.id) {
      navigateTo(ROUTES.home);
      return;
    }
  }

  container.innerHTML = `
    <main class="min-h-screen app-bg text-slate-900 pt-20">
      ${NavBar({ showAbout: false, isLandingPage: false })}

      <div class="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <div class="mb-8">
          <button id="back-btn" class="flex items-center gap-2 text-[#e76e1d] transition-colors font-medium hover:text-[#d45a0a]">
            ${Icons.chevronLeft(5)}
            Volver
          </button>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white/80 p-8">
          <h1 class="mb-2 text-4xl font-bold tracking-tight text-slate-900">${isEditMode ? "Editar vehículo" : "Publicar vehículo"}</h1>
          <p class="mb-8 text-slate-600">${isEditMode ? "Modifica los datos y especificaciones de tu vehículo." : "Completa la publicación con la misma información técnica que tienen los autos precargados."}</p>

          <form id="publish-form" class="space-y-8">
            <div class="space-y-4">
              <h2 class="text-xl font-semibold text-slate-900">Información básica</h2>

              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="mb-2 block text-sm font-medium text-slate-700">Marca *</label>
                  <div class="relative">
                    <input type="text" id="make-search" placeholder="Buscar marca..." class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-[#e76e1d] focus:outline-none focus:ring-1 focus:ring-[#e76e1d]">
                    <input type="hidden" id="make" required>
                    <div id="make-dropdown" class="absolute left-0 right-0 top-full z-10 mt-1 hidden max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg"></div>
                  </div>
                  <p id="make-error" class="mt-1 hidden text-sm text-red-500"></p>
                </div>
                <div>
                  <label class="mb-2 block text-sm font-medium text-slate-700">Modelo *</label>
                  <input type="text" id="model" required placeholder="Ej: Corolla Cross" class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-[#e76e1d] focus:outline-none focus:ring-1 focus:ring-[#e76e1d]">
                  <p id="model-error" class="mt-1 hidden text-sm text-red-500"></p>
                </div>
              </div>

              <div class="grid gap-4 md:grid-cols-3">
                <div>
                  <label class="mb-2 block text-sm font-medium text-slate-700">Año *</label>
                  <input type="number" id="year" required min="${VALIDATION_LIMITS.year.min}" max="${VALIDATION_LIMITS.year.max}" placeholder="${CURRENT_YEAR}" class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-[#e76e1d] focus:outline-none focus:ring-1 focus:ring-[#e76e1d]">
                  <p id="year-error" class="mt-1 hidden text-sm text-red-500"></p>
                </div>
                <div>
                  <label class="mb-2 block text-sm font-medium text-slate-700">Precio (USD) *</label>
                  <input type="number" id="price" required min="${VALIDATION_LIMITS.price.min}" max="${VALIDATION_LIMITS.price.max}" step="100" placeholder="25000" class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-[#e76e1d] focus:outline-none focus:ring-1 focus:ring-[#e76e1d]">
                  <p id="price-error" class="mt-1 hidden text-sm text-red-500"></p>
                </div>
                <div>
                  <label class="mb-2 block text-sm font-medium text-slate-700">Kilómetros *</label>
                  <input type="number" id="mileage" required min="${VALIDATION_LIMITS.mileage.min}" max="${VALIDATION_LIMITS.mileage.max}" step="1000" placeholder="42000" class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-[#e76e1d] focus:outline-none focus:ring-1 focus:ring-[#e76e1d]">
                  <p id="mileage-error" class="mt-1 hidden text-sm text-red-500"></p>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <h2 class="text-xl font-semibold text-slate-900">Características técnicas</h2>

              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="mb-2 block text-sm font-medium text-slate-700">Transmisión *</label>
                  <select id="transmission" required class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-[#e76e1d] focus:outline-none focus:ring-1 focus:ring-[#e76e1d]">
                    <option value="">Seleccionar</option>
                    <option value="Manual">Manual</option>
                    <option value="Automática">Automática</option>
                    <option value="CVT">CVT</option>
                  </select>
                  <p id="transmission-error" class="mt-1 hidden text-sm text-red-500"></p>
                </div>
                <div>
                  <label class="mb-2 block text-sm font-medium text-slate-700">Combustible *</label>
                  <select id="fuel" required class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-[#e76e1d] focus:outline-none focus:ring-1 focus:ring-[#e76e1d]">
                    <option value="">Seleccionar</option>
                    <option value="Nafta">Nafta</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Híbrido">Híbrido</option>
                    <option value="Eléctrico">Eléctrico</option>
                    <option value="GNC">GNC</option>
                  </select>
                  <p id="fuel-error" class="mt-1 hidden text-sm text-red-500"></p>
                </div>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="mb-2 block text-sm font-medium text-slate-700">Color *</label>
                  <input type="text" id="color" required placeholder="Ej: Blanco, Negro" class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-[#e76e1d] focus:outline-none focus:ring-1 focus:ring-[#e76e1d]">
                  <p id="color-error" class="mt-1 hidden text-sm text-red-500"></p>
                </div>
                <div>
                  <label class="mb-2 block text-sm font-medium text-slate-700">Ubicación *</label>
                  <input type="text" id="location" required placeholder="Ej: Córdoba" class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-[#e76e1d] focus:outline-none focus:ring-1 focus:ring-[#e76e1d]">
                  <p id="location-error" class="mt-1 hidden text-sm text-red-500"></p>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <h2 class="text-xl font-semibold text-slate-900">Especificaciones del vehículo</h2>

              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="mb-2 block text-sm font-medium text-slate-700">Motor *</label>
                  <input type="text" id="engine" required placeholder="Ej: 1.8L 4 cilindros" class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-[#e76e1d] focus:outline-none focus:ring-1 focus:ring-[#e76e1d]">
                  <p id="engine-error" class="mt-1 hidden text-sm text-red-500"></p>
                </div>
                <div>
                  <label class="mb-2 block text-sm font-medium text-slate-700">Potencia *</label>
                  <input type="text" id="power" required placeholder="Ej: 140 CV" class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-[#e76e1d] focus:outline-none focus:ring-1 focus:ring-[#e76e1d]">
                  <p id="power-error" class="mt-1 hidden text-sm text-red-500"></p>
                </div>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="mb-2 block text-sm font-medium text-slate-700">Torque *</label>
                  <input type="text" id="torque" required placeholder="Ej: 173 Nm" class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-[#e76e1d] focus:outline-none focus:ring-1 focus:ring-[#e76e1d]">
                  <p id="torque-error" class="mt-1 hidden text-sm text-red-500"></p>
                </div>
                <div>
                  <label class="mb-2 block text-sm font-medium text-slate-700">Aceleración *</label>
                  <input type="text" id="acceleration" required placeholder="Ej: 0-100 km/h en 10.2s" class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-[#e76e1d] focus:outline-none focus:ring-1 focus:ring-[#e76e1d]">
                  <p id="acceleration-error" class="mt-1 hidden text-sm text-red-500"></p>
                </div>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="mb-2 block text-sm font-medium text-slate-700">Velocidad máxima *</label>
                  <input type="text" id="topSpeed" required placeholder="Ej: 180 km/h" class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-[#e76e1d] focus:outline-none focus:ring-1 focus:ring-[#e76e1d]">
                  <p id="topSpeed-error" class="mt-1 hidden text-sm text-red-500"></p>
                </div>
                <div>
                  <label class="mb-2 block text-sm font-medium text-slate-700">Consumo *</label>
                  <input type="text" id="consumption" required placeholder="Ej: 6.5L/100km" class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-[#e76e1d] focus:outline-none focus:ring-1 focus:ring-[#e76e1d]">
                  <p id="consumption-error" class="mt-1 hidden text-sm text-red-500"></p>
                </div>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="mb-2 block text-sm font-medium text-slate-700">Dimensiones *</label>
                  <input type="text" id="dimensions" required placeholder="Ej: 4.46m x 1.83m x 1.62m" class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-[#e76e1d] focus:outline-none focus:ring-1 focus:ring-[#e76e1d]">
                  <p id="dimensions-error" class="mt-1 hidden text-sm text-red-500"></p>
                </div>
                <div>
                  <label class="mb-2 block text-sm font-medium text-slate-700">Peso *</label>
                  <input type="text" id="weight" required placeholder="Ej: 1.280 kg" class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-[#e76e1d] focus:outline-none focus:ring-1 focus:ring-[#e76e1d]">
                  <p id="weight-error" class="mt-1 hidden text-sm text-red-500"></p>
                </div>
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-slate-700">Equipamiento destacado *</label>
                <textarea id="features" rows="4" placeholder="Ej: Pantalla táctil 8, Cámara de retroceso, Bluetooth, Control de crucero" class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-[#e76e1d] focus:outline-none focus:ring-1 focus:ring-[#e76e1d] resize-none"></textarea>
                <p class="mt-2 text-xs text-slate-500">Separa cada item con coma o salto de línea. Mínimo ${VALIDATION_LIMITS.featuresMin} elementos.</p>
                <p id="features-error" class="mt-1 hidden text-sm text-red-500"></p>
              </div>
            </div>

            <div class="space-y-4">
              <h2 class="text-xl font-semibold text-slate-900">Descripción</h2>
              <div>
                <label class="mb-2 block text-sm font-medium text-slate-700">Descripción del vehículo *</label>
                <textarea id="description" required rows="5" placeholder="Describe el estado, historial de mantenimiento y detalles de valor." class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-[#e76e1d] focus:outline-none focus:ring-1 focus:ring-[#e76e1d] resize-none"></textarea>
                <p id="description-error" class="mt-1 hidden text-sm text-red-500"></p>
              </div>
            </div>

            <div class="space-y-4">
              <h2 class="text-xl font-semibold text-slate-900">Fotos del vehículo</h2>

              <div class="cursor-pointer rounded-lg border-2 border-dashed border-[#e76e1d]/30 bg-slate-900 p-8 text-center transition-all hover:border-[#e76e1d] hover:shadow-lg hover:scale-[1.02]" id="drop-zone">
                <input type="file" id="photo-input" multiple accept="image/*" class="hidden">
                <div>
                  <p class="mb-3 text-5xl">📸</p>
                  <p class="mb-1 text-lg font-semibold text-white">Arrastra fotos aquí o haz clic para seleccionar</p>
                  <p class="text-sm text-white">Formatos: JPG, PNG, WebP. Máximo 10 fotos.</p>
                  <p class="mt-2 text-xs text-[#e76e1d] font-medium">Haz clic para abrir el explorador de archivos</p>
                </div>
              </div>

              <div id="photos-preview" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3"></div>

              <p class="text-sm text-slate-600">
                <span id="photo-count">0</span> foto(s) seleccionada(s) - Mínimo 1 foto requerida
              </p>
            </div>

            <div class="flex gap-4 pt-4">
              <button type="button" id="cancel-btn" class="flex-1 rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-900 transition-colors hover:bg-slate-100">
                Cancelar
              </button>
              <button type="submit" class="flex-1 rounded-lg bg-[#e76e1d] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#d45a0a]">
                ${isEditMode ? "Actualizar vehículo" : "Guardar y volver al inicio"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  `;

  NavBarListeners();

  document.querySelector("#logout-button")?.addEventListener("click", () => {
    logout();
    navigateTo(ROUTES.login);
  });

  document.getElementById("back-btn")?.addEventListener("click", () => {
    navigateTo(ROUTES.home);
  });

  document.getElementById("cancel-btn")?.addEventListener("click", () => {
    navigateTo(ROUTES.home);
  });

  const makeSearch = document.getElementById("make-search") as HTMLInputElement;
  const makeDropdown = document.getElementById("make-dropdown") as HTMLElement;
  const makeInput = document.getElementById("make") as HTMLInputElement;

  function renderMakesDropdown(filter = ""): void {
    const filtered = MAKES.filter((make) => make.toLowerCase().includes(filter.toLowerCase()));

    makeDropdown.innerHTML = filtered
      .map(
        (make) => `
          <div class="make-option cursor-pointer px-4 py-2 text-sm hover:bg-slate-100" data-make="${make}">
            ${make}
          </div>
        `
      )
      .join("");

    if (filtered.length === 0) {
      makeDropdown.innerHTML = '<div class="px-4 py-2 text-sm text-slate-500">No se encontraron marcas</div>';
    }

    makeDropdown.querySelectorAll(".make-option").forEach((option) => {
      option.addEventListener("click", (event) => {
        const selectedMake = (event.target as HTMLElement).getAttribute("data-make");
        makeSearch.value = selectedMake || "";
        makeInput.value = selectedMake || "";
        makeDropdown.classList.add("hidden");
        clearError("make");
      });
    });
  }

  makeSearch.addEventListener("focus", () => {
    makeDropdown.classList.remove("hidden");
    renderMakesDropdown(makeSearch.value);
  });

  makeSearch.addEventListener("input", (event) => {
    renderMakesDropdown((event.target as HTMLInputElement).value);
  });

  document.addEventListener("click", (event) => {
    if (!makeSearch.contains(event.target as Node) && !makeDropdown.contains(event.target as Node)) {
      makeDropdown.classList.add("hidden");
      if (makeSearch.value && !MAKES.includes(makeSearch.value)) {
        makeSearch.value = "";
        makeInput.value = "";
      }
    }
  });

  function showError(fieldId: string, message: string): void {
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.remove("hidden");
    }
    errors[fieldId] = message;
  }

  function clearError(fieldId: string): void {
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (errorElement) {
      errorElement.classList.add("hidden");
      errorElement.textContent = "";
    }
    delete errors[fieldId];
  }

  function validateField(fieldId: string, value: string): string | null {
    if (!value.trim()) {
      return "Este campo es requerido";
    }

    const rule = FIELD_RULES[fieldId as keyof typeof FIELD_RULES];
    if (rule && !rule.test(value)) {
      return `Caracteres no permitidos en ${FIELD_LABELS[fieldId as keyof typeof FIELD_LABELS]}`;
    }

    if (fieldId === "description" && value.trim().length < 20) {
      return "La descripción debe tener al menos 20 caracteres";
    }

    if (fieldId === "features" && parseFeatures(value).length < VALIDATION_LIMITS.featuresMin) {
      return `Ingresa al menos ${VALIDATION_LIMITS.featuresMin} elementos de equipamiento`;
    }

    return null;
  }

  [
    "model",
    "color",
    "location",
    "description",
    "engine",
    "power",
    "torque",
    "acceleration",
    "topSpeed",
    "consumption",
    "dimensions",
    "weight",
    "features",
  ].forEach((fieldId) => {
    const input = document.getElementById(fieldId) as HTMLInputElement | HTMLTextAreaElement | null;
    if (!input) return;

    input.addEventListener("blur", () => {
      const error = validateField(fieldId, input.value);
      if (error) {
        showError(fieldId, error);
      } else {
        clearError(fieldId);
      }
    });

    input.addEventListener("input", () => {
      if (!errors[fieldId]) return;
      const error = validateField(fieldId, input.value);
      if (!error) {
        clearError(fieldId);
      }
    });
  });

  makeSearch.addEventListener("blur", () => {
    if (makeSearch.value && !MAKES.includes(makeSearch.value)) {
      showError("make", "Selecciona una marca válida de la lista");
      makeInput.value = "";
      makeSearch.value = "";
    } else if (!makeSearch.value) {
      showError("make", "La marca es requerida");
    } else {
      clearError("make");
    }
  });

  const dropZone = document.getElementById("drop-zone") as HTMLElement;
  const photoInput = document.getElementById("photo-input") as HTMLInputElement;
  const photosPreview = document.getElementById("photos-preview") as HTMLElement;
  const photoCount = document.getElementById("photo-count") as HTMLElement;

  dropZone.addEventListener("click", () => {
    photoInput.click();
  });

  dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.classList.add("bg-slate-100");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("bg-slate-100");
  });

  dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("bg-slate-100");
    const files = Array.from(event.dataTransfer?.files || []);
    handleFileSelection(files);
  });

  photoInput.addEventListener("change", (event) => {
    const files = Array.from((event.target as HTMLInputElement).files || []);
    handleFileSelection(files);
  });

  function handleFileSelection(files: File[]): void {
    const imageFiles = files.filter((file) => file.type.startsWith("image/")).slice(0, 10 - uploadedPhotos.length);
    
    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        uploadedPhotos.push(base64);
        photoCount.textContent = uploadedPhotos.length.toString();
        updatePhotosPreview();
      };
      reader.readAsDataURL(file);
    });
  }

  function updatePhotosPreview(): void {
    photosPreview.innerHTML = uploadedPhotos
      .map((base64, index) => {
        return `
          <div class="group relative aspect-square overflow-hidden rounded-lg bg-slate-100">
            <img src="${base64}" alt="Preview ${index + 1}" class="h-full w-full object-cover">
            <button type="button" class="remove-photo absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity transition-colors group-hover:bg-black/50 group-hover:opacity-100" data-index="${index}">
              <span class="text-2xl font-bold text-white">×</span>
            </button>
            <div class="absolute right-2 top-2 rounded bg-slate-900/75 px-2 py-1 text-xs text-white">
              ${index + 1}
            </div>
          </div>
        `;
      })
      .join("");

    photosPreview.querySelectorAll(".remove-photo").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        const index = parseInt(
          (event.target as HTMLElement).closest(".remove-photo")?.getAttribute("data-index") || "-1",
          10
        );
        if (index < 0) return;
        uploadedPhotos.splice(index, 1);
        photoCount.textContent = uploadedPhotos.length.toString();
        updatePhotosPreview();
      });
    });
  }

  const form = document.getElementById("publish-form") as HTMLFormElement;
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    Object.keys(errors).forEach((fieldId) => clearError(fieldId));

    if (!makeInput.value) {
      showError("make", "La marca es requerida");
    }

    [
      "model",
      "color",
      "location",
      "description",
      "engine",
      "power",
      "torque",
      "acceleration",
      "topSpeed",
      "consumption",
      "dimensions",
      "weight",
      "features",
    ].forEach((fieldId) => {
      const input = document.getElementById(fieldId) as HTMLInputElement | HTMLTextAreaElement;
      const error = validateField(fieldId, input.value);
      if (error) {
        showError(fieldId, error);
      }
    });

    const yearValue = parseInt((document.getElementById("year") as HTMLInputElement).value, 10);
    if (Number.isNaN(yearValue) || yearValue < VALIDATION_LIMITS.year.min || yearValue > VALIDATION_LIMITS.year.max) {
      showError("year", `Ingresa un año entre ${VALIDATION_LIMITS.year.min} y ${VALIDATION_LIMITS.year.max}`);
    }

    const priceValue = parseInt((document.getElementById("price") as HTMLInputElement).value, 10);
    if (Number.isNaN(priceValue) || priceValue < VALIDATION_LIMITS.price.min || priceValue > VALIDATION_LIMITS.price.max) {
      showError("price", `Ingresa un precio entre USD ${VALIDATION_LIMITS.price.min.toLocaleString()} y USD ${VALIDATION_LIMITS.price.max.toLocaleString()}`);
    }

    const mileageValue = parseInt((document.getElementById("mileage") as HTMLInputElement).value, 10);
    if (Number.isNaN(mileageValue) || mileageValue < VALIDATION_LIMITS.mileage.min || mileageValue > VALIDATION_LIMITS.mileage.max) {
      showError("mileage", `Ingresa un kilometraje entre ${VALIDATION_LIMITS.mileage.min.toLocaleString()} y ${VALIDATION_LIMITS.mileage.max.toLocaleString()} km`);
    }

    const transmissionValue = (document.getElementById("transmission") as HTMLSelectElement).value;
    if (!transmissionValue) {
      showError("transmission", "Selecciona una transmisión");
    }

    const fuelValue = (document.getElementById("fuel") as HTMLSelectElement).value;
    if (!fuelValue) {
      showError("fuel", "Selecciona un combustible");
    }

    if (!isEditMode && uploadedPhotos.length === 0) {
      showToast("Debes cargar al menos una foto del vehículo", "error");
      return;
    }

    if (Object.keys(errors).length > 0) {
      showToast("Por favor, corrige los errores del formulario", "error");
      return;
    }

    const features = parseFeatures((document.getElementById("features") as HTMLTextAreaElement).value);
    const formData = {
      make: makeInput.value,
      model: (document.getElementById("model") as HTMLInputElement).value.trim(),
      year: yearValue,
      price: priceValue,
      mileage: mileageValue,
      transmission: transmissionValue,
      fuel: fuelValue,
      color: (document.getElementById("color") as HTMLInputElement).value.trim(),
      location: (document.getElementById("location") as HTMLInputElement).value.trim(),
      description: (document.getElementById("description") as HTMLTextAreaElement).value.trim(),
      images: uploadedPhotos.length > 0 ? uploadedPhotos : existingCar?.images || [],
      sellerId: user.id,
      specs: {
        engine: (document.getElementById("engine") as HTMLInputElement).value.trim(),
        power: (document.getElementById("power") as HTMLInputElement).value.trim(),
        torque: (document.getElementById("torque") as HTMLInputElement).value.trim(),
        acceleration: (document.getElementById("acceleration") as HTMLInputElement).value.trim(),
        topSpeed: (document.getElementById("topSpeed") as HTMLInputElement).value.trim(),
        consumption: (document.getElementById("consumption") as HTMLInputElement).value.trim(),
        dimensions: (document.getElementById("dimensions") as HTMLInputElement).value.trim(),
        weight: (document.getElementById("weight") as HTMLInputElement).value.trim(),
        features,
      },
    };

    try {
      if (isEditMode && existingCar) {
        const success = updatePublishedCar(existingCar.id, formData);
        if (!success) {
          showToast("Error al actualizar el vehículo", "error");
          return;
        }
        showToast("Vehículo actualizado exitosamente", "success");
      } else {
        savePublishedCar(formData);
        showToast("Vehículo publicado exitosamente", "success");
      }

      navigateTo(ROUTES.home);
    } catch (error) {
      console.error("Error al guardar vehículo:", error);
      showToast("Error al guardar el vehículo. Inténtalo de nuevo.", "error");
    }
  });

  if (isEditMode && existingCar) {
    const specs = normalizeCarSpecs(existingCar.specs);

    window.setTimeout(() => {
      (document.getElementById("make-search") as HTMLInputElement).value = existingCar!.make;
      makeInput.value = existingCar!.make;
      (document.getElementById("model") as HTMLInputElement).value = existingCar!.model;
      (document.getElementById("year") as HTMLInputElement).value = existingCar!.year.toString();
      (document.getElementById("price") as HTMLInputElement).value = existingCar!.price.toString();
      (document.getElementById("mileage") as HTMLInputElement).value = existingCar!.mileage.toString();
      (document.getElementById("transmission") as HTMLSelectElement).value = existingCar!.transmission;
      (document.getElementById("fuel") as HTMLSelectElement).value = existingCar!.fuel;
      (document.getElementById("color") as HTMLInputElement).value = existingCar!.color;
      (document.getElementById("location") as HTMLInputElement).value = existingCar!.location;
      (document.getElementById("description") as HTMLTextAreaElement).value = existingCar!.description;
      (document.getElementById("engine") as HTMLInputElement).value = specs.engine;
      (document.getElementById("power") as HTMLInputElement).value = specs.power;
      (document.getElementById("torque") as HTMLInputElement).value = specs.torque;
      (document.getElementById("acceleration") as HTMLInputElement).value = specs.acceleration;
      (document.getElementById("topSpeed") as HTMLInputElement).value = specs.topSpeed;
      (document.getElementById("consumption") as HTMLInputElement).value = specs.consumption;
      (document.getElementById("dimensions") as HTMLInputElement).value = specs.dimensions;
      (document.getElementById("weight") as HTMLInputElement).value = specs.weight;
      (document.getElementById("features") as HTMLTextAreaElement).value = specs.features.join(", ");

      if (existingCar!.images.length > 0) {
        uploadedPhotos = [...existingCar!.images];
        photoCount.textContent = existingCar!.images.length.toString();
        updatePhotosPreview();
      }
    }, 100);
  }
}
