import { NavBar, NavBarListeners } from "../components/NavBar";
import { getSessionUser, logout } from "../services/auth";
import { navigateTo, ROUTES } from "../utils/router";
import { Icons } from "../utils/icons";
import {
  getPublishedCarById,
  normalizeCarSpecs,
  savePublishedCar,
  updatePublishedCar,
} from "../services/published-cars";
import type { PublishedCar } from "../services/published-cars";
import {
  MAX_UPLOAD_IMAGES,
  uploadImages,
  validateImageFiles,
} from "../services/upload.service";
import { showToast } from "../utils/toast";

const CURRENT_YEAR = new Date().getFullYear();
const VALIDATION_LIMITS = {
  year: { min: 1995, max: CURRENT_YEAR + 1 },
  price: { min: 1000, max: 500000 },
  mileage: { min: 0, max: 500000 },
};

const FIELD_RULES = {
  model: /^[a-zA-Z0-9\s\-]+$/,
  color: /^[a-zA-Z\s]+$/,
  location: /^[a-zA-Z\s]+$/,
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

export async function renderPublishPage(container: HTMLElement, isEditMode = false): Promise<void> {
  const user = getSessionUser();

  if (!user) {
    navigateTo(ROUTES.landing);
    return;
  }

  if (user.role !== "seller") {
    navigateTo(ROUTES.home);
    return;
  }

  interface PhotoItem {
    preview: string;
    file?: File;
    url?: string;
    status: 'pending' | 'uploading' | 'uploaded' | 'error';
    progress: number;
    error?: string;
  }

  const photoItems: PhotoItem[] = [];
  const errors: Record<string, string> = {};
  let isSubmitting = false;

  const urlParams = new URLSearchParams(window.location.search);
  const carId = urlParams.get("id");
  let existingCar: PublishedCar | null = null;

  if (isEditMode && carId) {
    existingCar = await getPublishedCarById(carId);
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
                  <input type="text" id="make" required placeholder="Ej: Toyota" class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-[#e76e1d] focus:outline-none focus:ring-1 focus:ring-[#e76e1d]">
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
                  <label class="mb-2 block text-sm font-medium text-slate-700">Torque</label>
                  <input type="text" id="torque" placeholder="Ej: 173 Nm" class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-[#e76e1d] focus:outline-none focus:ring-1 focus:ring-[#e76e1d]">
                  <p id="torque-error" class="mt-1 hidden text-sm text-red-500"></p>
                </div>
                <div>
                  <label class="mb-2 block text-sm font-medium text-slate-700">Aceleración</label>
                  <input type="text" id="acceleration" placeholder="Ej: 0-100 km/h en 10.2s" class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-[#e76e1d] focus:outline-none focus:ring-1 focus:ring-[#e76e1d]">
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
                  <label class="mb-2 block text-sm font-medium text-slate-700">Dimensiones</label>
                  <input type="text" id="dimensions" placeholder="Ej: 4.46m x 1.83m x 1.62m" class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-[#e76e1d] focus:outline-none focus:ring-1 focus:ring-[#e76e1d]">
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
                <p class="mt-2 text-xs text-slate-500">Separa cada item con coma o salto de línea.</p>
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
                  <p class="text-sm text-white">Formatos: JPG, PNG, WebP. Máximo ${MAX_UPLOAD_IMAGES} fotos.</p>
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
              <button type="submit" id="publish-submit-btn" class="flex-1 rounded-lg bg-[#e76e1d] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#d45a0a] disabled:cursor-not-allowed disabled:opacity-70">
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

  const makeInput = document.getElementById("make") as HTMLInputElement;

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
    const optionalFields = new Set(["torque", "acceleration", "dimensions"]);
    if (optionalFields.has(fieldId) && !value.trim()) {
      return null;
    }

    if (!value.trim()) {
      return "Este campo es requerido";
    }

    const rule = FIELD_RULES[fieldId as keyof typeof FIELD_RULES];
    if (rule && !rule.test(value)) {
      return `Caracteres no permitidos en ${FIELD_LABELS[fieldId as keyof typeof FIELD_LABELS]}`;
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

  makeInput.addEventListener("blur", () => {
    if (!makeInput.value.trim()) {
      showError("make", "Selecciona una marca válida de la lista");
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
    const { validFiles: allowedFiles, errors: imageErrors } = validateImageFiles(files, photoItems.length);
    imageErrors.forEach((message) => showToast(message, 'error'));

    const startIndex = photoItems.length;
    allowedFiles.forEach((file) => {
      photoItems.push({
        preview: '',
        file,
        url: undefined,
        status: 'pending',
        progress: 0,
      });
    });

    photoItems.slice(startIndex).forEach((item) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        item.preview = e.target?.result as string;
        updatePhotoCount();
        updatePhotosPreview();
      };
      reader.readAsDataURL(item.file as File);
    });

    updatePhotoCount();
    updatePhotosPreview();

    if (allowedFiles.length > 0) {
      void uploadSelectedPhotos(photoItems.slice(startIndex));
    }
  }

  async function uploadSelectedPhotos(items: PhotoItem[]): Promise<void> {
    if (items.length === 0) return;

    const files = items.map((item) => item.file).filter((file): file is File => Boolean(file));
    if (files.length !== items.length) {
      items.forEach((item) => {
        if (!item.file) {
          item.status = 'error';
          item.error = 'Archivo invalido';
        }
      });
      updatePhotosPreview();
      return;
    }

    items.forEach((item) => {
      item.status = 'uploading';
      item.progress = 0;
    });
    updatePhotosPreview();

    try {
      const result = await uploadImages(files, (progress) => {
        items.forEach((item) => {
          item.progress = progress;
        });
        updatePhotosPreview();
      });

      if (!result.ok) {
        throw new Error(result.message);
      }

      items.forEach((item, index) => {
        const uploadedUrl = result.images[index];
        item.url = uploadedUrl || item.preview;
        item.preview = item.url;
        item.status = 'uploaded';
        item.error = undefined;
        item.progress = 100;
      });
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      items.forEach((item) => {
        item.status = 'error';
        item.error = (error as Error)?.message || 'Error en la carga';
      });
    }

    updatePhotosPreview();
  }

  function updatePhotoCount(): void {
    photoCount.textContent = photoItems.length.toString();
  }

  function getUploadedPhotoUrls(): string[] {
    return photoItems.filter((item) => item.url).map((item) => item.url!) ;
  }

  function updatePhotosPreview(): void {
    photosPreview.innerHTML = photoItems
      .map((item, index) => {
        const progressOverlay = item.status === 'uploading'
          ? `<div class="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white text-sm font-semibold">
              <span>Subiendo...</span>
              <div class="mt-2 h-2 w-3/4 overflow-hidden rounded-full bg-white/20">
                <div class="h-full bg-[#e76e1d] transition-all" style="width: ${item.progress}%"></div>
              </div>
              <span class="mt-2 text-xs">${item.progress}%</span>
            </div>`
          : item.status === 'error'
          ? `<div class="absolute inset-0 flex items-center justify-center bg-red-600/75 text-white text-sm font-semibold">Error</div>`
          : '';

        return `
          <div class="group relative aspect-square overflow-hidden rounded-lg bg-slate-100">
            <img src="${item.preview}" alt="Preview ${index + 1}" class="h-full w-full object-cover">
            ${progressOverlay}
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
        const target = event.currentTarget as HTMLElement;
        const index = parseInt(target.getAttribute("data-index") || "-1", 10);
        if (index < 0) return;
        photoItems.splice(index, 1);
        updatePhotoCount();
        updatePhotosPreview();
      });
    });
  }

  const form = document.getElementById("publish-form") as HTMLFormElement;
  const submitButton = document.getElementById("publish-submit-btn") as HTMLButtonElement;
  const submitButtonText = submitButton.textContent || (isEditMode ? "Actualizar vehículo" : "Guardar y volver al inicio");

  function resetSubmitState(): void {
    isSubmitting = false;
    submitButton.disabled = false;
    submitButton.textContent = submitButtonText;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    isSubmitting = true;
    submitButton.disabled = true;
    submitButton.textContent = isEditMode ? "Actualizando..." : "Publicando...";

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

    const imageUrls = getUploadedPhotoUrls();
    if (imageUrls.length === 0 && (!isEditMode || (existingCar?.images || []).length === 0)) {
      showToast("Debes cargar al menos una foto del vehículo", "error");
      resetSubmitState();
      return;
    }

    if (Object.keys(errors).length > 0) {
      showToast("Por favor, corrige los errores del formulario", "error");
      resetSubmitState();
      return;
    }

    const features = parseFeatures((document.getElementById("features") as HTMLTextAreaElement).value);

    if (photoItems.some((item) => item.status === 'uploading')) {
      showToast("Espera a que las imágenes terminen de subir antes de enviar.", "error");
      resetSubmitState();
      return;
    }

    if (photoItems.some((item) => item.status === 'error')) {
      showToast("Hay un error en una o más imágenes. Elimina la imagen afectada e intenta nuevamente.", "error");
      resetSubmitState();
      return;
    }

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
      images: imageUrls.length > 0 ? imageUrls : existingCar?.images || [],
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
        const success = await updatePublishedCar(existingCar.id, formData);
        if (!success) {
          showToast("Error al actualizar el vehículo", "error");
          resetSubmitState();
          return;
        }
        showToast("Vehículo actualizado exitosamente", "success");
      } else {
        await savePublishedCar(formData);
        showToast("Vehículo publicado exitosamente", "success");
      }

      navigateTo(ROUTES.home);
    } catch (error) {
      console.error("Error al guardar vehículo:", error);
      showToast("Error al guardar el vehículo. Inténtalo de nuevo.", "error");
      resetSubmitState();
    }
  });

  if (isEditMode && existingCar) {
    const specs = normalizeCarSpecs(existingCar.specs);

    window.setTimeout(() => {
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
        photoItems.push(
          ...existingCar!.images.map((image) => ({ preview: image, url: image, status: 'uploaded' as const, progress: 100 })),
        );
        photoCount.textContent = photoItems.length.toString();
        updatePhotosPreview();
      }
    }, 100);
  }
}
