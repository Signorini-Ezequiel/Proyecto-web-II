import { NavBar, NavBarListeners } from "../components/NavBar";
import { getSessionUser, logout } from "../services/auth";
import { navigateTo, ROUTES } from "../utils/router";
import { Icons } from "../utils/icons";
import { MAKES } from "../data/makes";
import { savePublishedCar, updatePublishedCar, getPublishedCarById } from "../services/published-cars";
import type { PublishedCar } from "../services/published-cars";
import { showToast } from "../utils/toast";

// Validaciones de caracteres permitidos por campo
const FIELD_RULES = {
  model: /^[a-zA-Z0-9\s\-]+$/,
  color: /^[a-zA-Z\s]+$/,
  location: /^[a-zA-Z\s]+$/,
  description: /^[a-zA-Z0-9\s\.\,\-]+$/,
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
};

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

  let uploadedPhotos: File[] = [];
  const errors: { [key: string]: string } = {};

  // Obtener datos del auto a editar si estamos en modo edición
  const urlParams = new URLSearchParams(window.location.search);
  const carId = urlParams.get('id');
  let existingCar: PublishedCar | null = null;

  if (isEditMode && carId) {
    existingCar = getPublishedCarById(carId);
    if (!existingCar || existingCar.sellerId !== user.id) {
      // No es el propietario o no existe
      navigateTo(ROUTES.home);
      return;
    }
  }

  container.innerHTML = `
    <main class="min-h-screen app-bg text-slate-900 pt-20">
      ${NavBar({ showAbout: false, isLandingPage: false })}

      <div class="mx-auto max-w-4xl px-5 py-8 sm:px-8">
        <div class="mb-8">
          <button id="back-btn" class="flex items-center gap-2 text-[#e76e1d] hover:text-[#d45a0a] transition-colors font-medium">
            ${Icons.chevronLeft(5)}
            Volver
          </button>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white/80 p-8">
          <h1 class="text-4xl font-bold tracking-tight text-slate-900 mb-2">${isEditMode ? 'Editar vehículo' : 'Publicar vehículo'}</h1>
          <p class="text-slate-600 mb-8">${isEditMode ? 'Modifica los datos de tu vehículo' : 'Completa los datos de tu vehículo para publicarlo'}</p>

          <form id="publish-form" class="space-y-8">
            <!-- Información básica -->
            <div class="space-y-4">
              <h2 class="text-xl font-semibold text-slate-900">Información básica</h2>
              
              <div class="grid gap-4 md:grid-cols-2">
                <!-- Selector de marca con búsqueda -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Marca *</label>
                  <div class="relative">
                    <input type="text" id="make-search" placeholder="Buscar marca..." class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:outline-none focus:border-[#e76e1d] focus:ring-1 focus:ring-[#e76e1d]">
                    <input type="hidden" id="make" required>
                    <div id="make-dropdown" class="hidden absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      <!-- Se rellena dinámicamente -->
                    </div>
                  </div>
                  <p id="make-error" class="text-red-500 text-sm mt-1 hidden"></p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Modelo *</label>
                  <input type="text" id="model" required placeholder="Ej: Corolla Cross" class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:outline-none focus:border-[#e76e1d] focus:ring-1 focus:ring-[#e76e1d]">
                  <p id="model-error" class="text-red-500 text-sm mt-1 hidden"></p>
                </div>
              </div>

              <div class="grid gap-4 md:grid-cols-3">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Año *</label>
                  <input type="number" id="year" required min="1990" max="2100" placeholder="2022" class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:outline-none focus:border-[#e76e1d] focus:ring-1 focus:ring-[#e76e1d]">
                  <p id="year-error" class="text-red-500 text-sm mt-1 hidden"></p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Precio (USD) *</label>
                  <input type="number" id="price" required min="0" step="100" placeholder="25000" class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:outline-none focus:border-[#e76e1d] focus:ring-1 focus:ring-[#e76e1d]">
                  <p id="price-error" class="text-red-500 text-sm mt-1 hidden"></p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Kilómetros *</label>
                  <input type="number" id="mileage" required min="0" step="1000" placeholder="42000" class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:outline-none focus:border-[#e76e1d] focus:ring-1 focus:ring-[#e76e1d]">
                  <p id="mileage-error" class="text-red-500 text-sm mt-1 hidden"></p>
                </div>
              </div>
            </div>

            <!-- Características técnicas -->
            <div class="space-y-4">
              <h2 class="text-xl font-semibold text-slate-900">Características técnicas</h2>
              
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Transmisión *</label>
                  <select id="transmission" required class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:outline-none focus:border-[#e76e1d] focus:ring-1 focus:ring-[#e76e1d]">
                    <option value="">Seleccionar</option>
                    <option value="Manual">Manual</option>
                    <option value="Automática">Automática</option>
                    <option value="CVT">CVT</option>
                  </select>
                  <p id="transmission-error" class="text-red-500 text-sm mt-1 hidden"></p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Combustible *</label>
                  <select id="fuel" required class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:outline-none focus:border-[#e76e1d] focus:ring-1 focus:ring-[#e76e1d]">
                    <option value="">Seleccionar</option>
                    <option value="Nafta">Nafta</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Híbrido">Híbrido</option>
                    <option value="Eléctrico">Eléctrico</option>
                    <option value="GNC">GNC</option>
                  </select>
                  <p id="fuel-error" class="text-red-500 text-sm mt-1 hidden"></p>
                </div>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Color *</label>
                  <input type="text" id="color" required placeholder="Ej: Blanco, Negro" class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:outline-none focus:border-[#e76e1d] focus:ring-1 focus:ring-[#e76e1d]">
                  <p id="color-error" class="text-red-500 text-sm mt-1 hidden"></p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Ubicación *</label>
                  <input type="text" id="location" required placeholder="Ej: Córdoba" class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:outline-none focus:border-[#e76e1d] focus:ring-1 focus:ring-[#e76e1d]">
                  <p id="location-error" class="text-red-500 text-sm mt-1 hidden"></p>
                </div>
              </div>
            </div>

            <!-- Descripción -->
            <div class="space-y-4">
              <h2 class="text-xl font-semibold text-slate-900">Descripción</h2>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Descripción del vehículo *</label>
                <textarea id="description" required rows="5" placeholder="Describe el estado, características especiales, historial de mantenimiento, etc..." class="w-full rounded-lg border border-slate-200 px-4 py-3 focus:outline-none focus:border-[#e76e1d] focus:ring-1 focus:ring-[#e76e1d] resize-none"></textarea>
                <p id="description-error" class="text-red-500 text-sm mt-1 hidden"></p>
              </div>
            </div>

            <!-- Fotos -->
            <div class="space-y-4">
              <h2 class="text-xl font-semibold text-slate-900">Fotos del vehículo</h2>
              
              <div class="rounded-lg border-2 border-dashed border-slate-300 p-8 text-center hover:border-[#e76e1d] transition-colors cursor-pointer" id="drop-zone">
                <input type="file" id="photo-input" multiple accept="image/*" class="hidden">
                <div>
                  <p class="text-4xl mb-3">🖼️</p>
                  <p class="text-sm font-medium text-slate-900 mb-1">Arrastra fotos aquí o haz clic para seleccionar</p>
                  <p class="text-xs text-slate-600">Formatos: JPG, PNG, WebP (máx 5MB cada una)</p>
                </div>
              </div>

              <!-- Preview de fotos -->
              <div id="photos-preview" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              </div>

              <p class="text-sm text-slate-600">
                <span id="photo-count">0</span> foto(s) seleccionada(s) - Mínimo 1 foto requerida
              </p>
            </div>

            <!-- Botones -->
            <div class="flex gap-4 pt-4">
              <button type="button" id="cancel-btn" class="flex-1 rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-900 hover:bg-slate-100 transition-colors">
                Cancelar
              </button>
              <button type="submit" class="flex-1 rounded-lg bg-[#e76e1d] px-6 py-3 font-semibold text-white hover:bg-[#d45a0a] transition-colors">
                ${isEditMode ? 'Actualizar vehículo' : 'Guardar y volver al inicio'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  `;

  // Listeners del NavBar
  NavBarListeners();

  // Logout button
  document.querySelector("#logout-button")?.addEventListener("click", () => {
    logout();
    navigateTo(ROUTES.login);
  });

  // Back button
  document.getElementById("back-btn")?.addEventListener("click", () => {
    navigateTo(ROUTES.home);
  });

  // Cancel button
  document.getElementById("cancel-btn")?.addEventListener("click", () => {
    navigateTo(ROUTES.home);
  });

  // ============ SELECTOR DE MARCAS CON BÚSQUEDA ============
  const makeSearch = document.getElementById("make-search") as HTMLInputElement;
  const makeDropdown = document.getElementById("make-dropdown") as HTMLElement;
  const makeInput = document.getElementById("make") as HTMLInputElement;

  function renderMakesDropdown(filter = "") {
    const filtered = MAKES.filter(make => 
      make.toLowerCase().includes(filter.toLowerCase())
    );

    makeDropdown.innerHTML = filtered
      .map(make => `
        <div class="make-option px-4 py-2 hover:bg-slate-100 cursor-pointer text-sm" data-make="${make}">
          ${make}
        </div>
      `)
      .join("");

    if (filtered.length === 0) {
      makeDropdown.innerHTML = '<div class="px-4 py-2 text-sm text-slate-500">No se encontraron marcas</div>';
    }

    // Event listeners para opciones
    makeDropdown.querySelectorAll(".make-option").forEach(option => {
      option.addEventListener("click", (e) => {
        const make = (e.target as HTMLElement).getAttribute("data-make");
        makeSearch.value = make || "";
        makeInput.value = make || "";
        makeDropdown.classList.add("hidden");
        clearError("make");
      });
    });
  }

  makeSearch.addEventListener("focus", () => {
    makeDropdown.classList.remove("hidden");
    renderMakesDropdown(makeSearch.value);
  });

  makeSearch.addEventListener("input", (e) => {
    renderMakesDropdown((e.target as HTMLInputElement).value);
  });

  document.addEventListener("click", (e) => {
    if (!makeSearch.contains(e.target as Node) && !makeDropdown.contains(e.target as Node)) {
      makeDropdown.classList.add("hidden");
      // Validar que la marca seleccionada sea válida
      if (makeSearch.value && !MAKES.includes(makeSearch.value)) {
        makeSearch.value = "";
        makeInput.value = "";
      }
    }
  });

  // ============ VALIDACIÓN DE CARACTERES ============
  function validateField(fieldId: string, value: string): string | null {
    if (!value.trim()) {
      return "Este campo es requerido";
    }

    const rules = FIELD_RULES[fieldId as keyof typeof FIELD_RULES];
    if (rules && !rules.test(value)) {
      return `Caracteres no permitidos en ${FIELD_LABELS[fieldId as keyof typeof FIELD_LABELS]}`;
    }

    return null;
  }

  // Função para mostrar error
  function showError(fieldId: string, message: string) {
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove("hidden");
    }
    errors[fieldId] = message;
  }

  // Función para limpiar error
  function clearError(fieldId: string) {
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (errorEl) {
      errorEl.classList.add("hidden");
      errorEl.textContent = "";
    }
    delete errors[fieldId];
  }

  // Validar campos en tiempo real (text inputs)
  ["model", "color", "location", "description"].forEach(fieldId => {
    const input = document.getElementById(fieldId) as HTMLInputElement | HTMLTextAreaElement;
    if (input) {
      input.addEventListener("blur", () => {
        const error = validateField(fieldId, input.value);
        if (error) {
          showError(fieldId, error);
        } else {
          clearError(fieldId);
        }
      });

      input.addEventListener("input", () => {
        if (errors[fieldId]) {
          const error = validateField(fieldId, input.value);
          if (!error) {
            clearError(fieldId);
          }
        }
      });
    }
  });

  // Validar make (marca)
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

  // Photo upload handling
  const dropZone = document.getElementById("drop-zone") as HTMLElement;
  const photoInput = document.getElementById("photo-input") as HTMLInputElement;
  const photosPreview = document.getElementById("photos-preview") as HTMLElement;
  const photoCount = document.getElementById("photo-count") as HTMLElement;

  // Drag and drop
  dropZone.addEventListener("click", () => {
    photoInput.click();
  });

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("bg-slate-100");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("bg-slate-100");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("bg-slate-100");
    const files = Array.from(e.dataTransfer?.files || []);
    handleFileSelection(files);
  });

  photoInput.addEventListener("change", (e) => {
    const files = Array.from((e.target as HTMLInputElement).files || []);
    handleFileSelection(files);
  });

  function handleFileSelection(files: any[]) {
    const imageFiles = files.filter(file => file.type.startsWith("image/"));
    uploadedPhotos = [...uploadedPhotos, ...imageFiles].slice(0, 10); // Máximo 10 fotos

    photoCount.textContent = uploadedPhotos.length.toString();
    updatePhotosPreview();
  }

  function updatePhotosPreview() {
    photosPreview.innerHTML = uploadedPhotos
      .map((file, index) => {
        const url = URL.createObjectURL(file);
        return `
          <div class="relative rounded-lg overflow-hidden bg-slate-100 aspect-square group">
            <img src="${url}" alt="Preview ${index + 1}" class="w-full h-full object-cover">
            <button type="button" class="remove-photo absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" data-index="${index}">
              <span class="text-white font-bold text-2xl">×</span>
            </button>
            <div class="absolute top-2 right-2 bg-slate-900/75 text-white text-xs px-2 py-1 rounded">
              ${index + 1}
            </div>
          </div>
        `;
      })
      .join("");

    // Remove photo listeners
    photosPreview.querySelectorAll(".remove-photo").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const index = parseInt((e.target as HTMLElement).closest(".remove-photo")?.getAttribute("data-index") || "-1");
        if (index >= 0) {
          uploadedPhotos.splice(index, 1);
          photoCount.textContent = uploadedPhotos.length.toString();
          updatePhotosPreview();
        }
      });
    });
  }

  // Form submission
  const form = document.getElementById("publish-form") as HTMLFormElement;
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Limpiar errores previos
    Object.keys(errors).forEach(fieldId => clearError(fieldId));

    // Validar marca
    if (!makeInput.value) {
      showError("make", "La marca es requerida");
    }

    // Validar modelo
    const modelError = validateField("model", (document.getElementById("model") as HTMLInputElement).value);
    if (modelError) showError("model", modelError);

    // Validar color
    const colorError = validateField("color", (document.getElementById("color") as HTMLInputElement).value);
    if (colorError) showError("color", colorError);

    // Validar ubicación
    const locationError = validateField("location", (document.getElementById("location") as HTMLInputElement).value);
    if (locationError) showError("location", locationError);

    // Validar descripción
    const descriptionError = validateField("description", (document.getElementById("description") as HTMLTextAreaElement).value);
    if (descriptionError) showError("description", descriptionError);

    // Validar año
    const yearValue = parseInt((document.getElementById("year") as HTMLInputElement).value);
    if (!yearValue || yearValue < 1990 || yearValue > 2100) {
      showError("year", "Año inválido (debe ser entre 1990 y 2100)");
    }

    // Validar precio
    const priceValue = parseInt((document.getElementById("price") as HTMLInputElement).value);
    if (!priceValue || priceValue <= 0) {
      showError("price", "Precio debe ser mayor a 0");
    }

    // Validar kilómetros
    const mileageValue = parseInt((document.getElementById("mileage") as HTMLInputElement).value);
    if (isNaN(mileageValue) || mileageValue < 0) {
      showError("mileage", "Kilómetros inválido");
    }

    // Validar que haya al menos una foto (solo en creación, en edición puede mantener las existentes)
    if (!isEditMode && uploadedPhotos.length === 0) {
      alert("Debes cargar al menos una foto del vehículo");
      return;
    }

    // Si hay errores, no enviar
    if (Object.keys(errors).length > 0) {
      alert("Por favor, corrige los errores en el formulario");
      return;
    }

    // Obtener datos del formulario
    const formData = {
      make: makeInput.value,
      model: (document.getElementById("model") as HTMLInputElement).value,
      year: yearValue,
      price: priceValue,
      mileage: mileageValue,
      transmission: (document.getElementById("transmission") as HTMLSelectElement).value,
      fuel: (document.getElementById("fuel") as HTMLSelectElement).value,
      color: (document.getElementById("color") as HTMLInputElement).value,
      location: (document.getElementById("location") as HTMLInputElement).value,
      description: (document.getElementById("description") as HTMLTextAreaElement).value,
      images: uploadedPhotos.length > 0 ? uploadedPhotos.map(() => "/images/auto1-1.jpg") : existingCar?.images || ["/images/auto1-1.jpg"], // Placeholder para imágenes
      sellerId: user.id,
    };

    try {
      if (isEditMode && existingCar) {
        // Actualizar auto existente
        const success = updatePublishedCar(existingCar.id, formData);
        if (success) {
          showToast("Vehículo actualizado exitosamente", "success");
        } else {
          showToast("Error al actualizar el vehículo", "error");
          return;
        }
      } else {
        // Crear nuevo auto
        const newCar = savePublishedCar(formData);
        console.log("Vehículo publicado:", newCar);
        showToast("Vehículo publicado exitosamente", "success");
      }

      // Redirigir al home
      navigateTo(ROUTES.home);
    } catch (error) {
      console.error("Error al guardar vehículo:", error);
      showToast("Error al guardar el vehículo. Inténtalo de nuevo.", "error");
    }
  });

  // Cargar datos existentes si estamos en modo edición
  if (isEditMode && existingCar) {
    // Esperar a que el DOM esté listo
    setTimeout(() => {
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

      // Mostrar fotos existentes (simulado)
      if (existingCar!.images && existingCar!.images.length > 0) {
        photoCount.textContent = existingCar!.images.length.toString();
        // Aquí podrías mostrar previews de las imágenes existentes
      }
    }, 100);
  }
}
