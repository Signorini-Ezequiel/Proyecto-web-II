import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { NavBar, NavBarListeners } from "../components/NavBar";
import { navigateTo, ROUTES } from "../utils/router";
import { getCarById } from "../data/cars";
import { getPublishedCarById } from "../services/published-cars";
import { addFavorite, isFavorite, toggleFavorite } from "../services/favorites";
import { addToComparison, isInComparison } from "../services/comparison";
import { getSessionUser, getUserById } from "../services/auth";
import { Icons } from "../utils/icons";
import { showToast } from "../utils/toast";
import { generateDetailOpinion, generateImageAnalysisOpinion } from "../utils/summary-generator";
import { addPublicQuestion, answerPublicQuestion, getQuestionsByCarId } from "../services/car-questions";

// Almacenamos el ID del auto en sessionStorage
export function setCurrentCarId(id: string, isPublished: boolean = false) {
  sessionStorage.setItem("currentCarId", id);
  sessionStorage.setItem("isPublished", isPublished.toString());
}

export function renderCarDetailPage(container: HTMLElement): void {
  const carId = sessionStorage.getItem("currentCarId");
  const isPublishedStr = sessionStorage.getItem("isPublished");
  const isPublished = isPublishedStr === "true";

  if (!carId) {
    navigateTo(ROUTES.home);
    return;
  }

  let car: any;
  let publishedCar: any = null;
  let isOwner = false;

  if (isPublished) {
    publishedCar = getPublishedCarById(carId);
    if (!publishedCar) {
      container.innerHTML = `
        <main class="min-h-screen app-bg text-slate-900">
          <p>Auto no encontrado</p>
        </main>
      `;
      return;
    }
    const user = getSessionUser();
    isOwner = !!user && user.id === publishedCar.sellerId;

    car = {
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
      specs: {
        engine: publishedCar.specs?.engine || "",
        power: publishedCar.specs?.power || "",
        torque: publishedCar.specs?.torque || "",
        acceleration: publishedCar.specs?.acceleration || "",
        topSpeed: publishedCar.specs?.topSpeed || "",
        consumption: publishedCar.specs?.consumption || "",
        dimensions: publishedCar.specs?.dimensions || "",
        weight: publishedCar.specs?.weight || "",
        features: publishedCar.specs?.features || [],
      },
    };
  } else {
    car = getCarById(carId);
    if (!car) {
      container.innerHTML = `
        <main class="min-h-screen app-bg text-slate-900">
          <p>Auto no encontrado</p>
        </main>
      `;
      return;
    }
  }

  const user = getSessionUser();
  const isSeller = user?.role === "seller";
  const aiCharacteristicsOpinion = generateDetailOpinion(car);
  const aiImageOpinion = generateImageAnalysisOpinion(car);
  const publicQuestions = isPublished ? getQuestionsByCarId(car.id) : [];

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
              ${car.images.map((img: string, index: number) => `
                <button class="thumbnail-btn flex-shrink-0 w-20 h-20 rounded-lg border-2 border-transparent overflow-hidden hover:border-[#e76e1d] transition-colors" data-index="${index}">
                  <img src="${img}" alt="Vista ${index + 1}" class="w-full h-full object-cover">
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Información del auto -->
          <div class="space-y-6">
            <div>
              <h1 class="text-3xl font-bold text-slate-900">${car.make} ${car.model} ${car.year}</h1>
              <p class="mt-2 text-2xl font-semibold text-[#e76e1d]">US$ ${car.price.toLocaleString()}</p>
              <p class="mt-1 text-sm text-slate-600">${car.location}</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="rounded-2xl border border-slate-200 bg-white/80 p-4">
                <p class="text-sm text-slate-600">Kilometraje</p>
                <p class="mt-1 font-semibold text-slate-900">${car.mileage.toLocaleString()} km</p>
              </div>
              <div class="rounded-2xl border border-slate-200 bg-white/80 p-4">
                <p class="text-sm text-slate-600">Transmisión</p>
                <p class="mt-1 font-semibold text-slate-900">${car.transmission}</p>
              </div>
              <div class="rounded-2xl border border-slate-200 bg-white/80 p-4">
                <p class="text-sm text-slate-600">Combustible</p>
                <p class="mt-1 font-semibold text-slate-900">${car.fuel}</p>
              </div>
              <div class="rounded-2xl border border-slate-200 bg-white/80 p-4">
                <p class="text-sm text-slate-600">Color</p>
                <p class="mt-1 font-semibold text-slate-900">${car.color}</p>
              </div>
            </div>

            <div class="rounded-3xl border border-slate-200 bg-white/80 p-6">
              <h3 class="font-semibold text-slate-900">Descripción</h3>
              <p class="mt-3 text-slate-600 leading-7">${car.description}</p>
            </div>

            <div class="ai-opinion-card rounded-3xl border border-[#e76e1d]/20 bg-[linear-gradient(135deg,rgba(255,244,235,0.96),rgba(255,250,245,0.96))] p-6">
              <p class="text-xs font-semibold uppercase tracking-[0.28em] text-[#c9540a]">Opinion de la IA</p>
              
              <div class="mt-4 space-y-4">
                <div>
                  <h4 class="font-semibold text-slate-900 text-sm mb-2">Análisis de características</h4>
                  <p class="leading-7 text-slate-700">${aiCharacteristicsOpinion}</p>
                </div>
                
                <div class="border-t border-[#e76e1d]/15 pt-4">
                  <h4 class="font-semibold text-slate-900 text-sm mb-2">Análisis visual de imágenes</h4>
                  <p class="leading-7 text-slate-700">${aiImageOpinion}</p>
                </div>
              </div>
            </div>

            <div class="flex gap-4 flex-wrap">
              ${!isSeller ? Button({ id: "buy-now", text: "Comprar ahora", variant: "primary" }) : ''}
              ${isPublished && isOwner ? Button({ id: "edit-car", text: "Editar vehículo", variant: "secondary" }) : ""}
              ${Button({ 
                id: "add-favorite", 
                text: isFavorite(car.id) ? `${Icons.heart(4, true)} Guardado` : `${Icons.heart(4, false)} Guardar`, 
                variant: "secondary" 
              })}
              ${!isSeller ? Button({ id: "add-to-comparator", text: isInComparison(car.id) ? "En comparador" : "Comparar", variant: "ghost" }) : ''}
            </div>
          </div>
        </div>

        <!-- Especificaciones técnicas -->
        <div class="mt-12">
          <h2 class="text-2xl font-bold text-slate-900 mb-6">Especificaciones técnicas</h2>

          <div class="grid gap-6 md:grid-cols-2">
            ${Card({
              children: `
                <h3 class="font-semibold text-slate-900 mb-4">Motor y rendimiento</h3>
                <div class="space-y-3">
                  <div class="flex justify-between">
                    <span class="text-slate-600">Motor</span>
                    <span class="font-medium text-slate-900">${car.specs.engine}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-600">Potencia</span>
                    <span class="font-medium text-slate-900">${car.specs.power}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-600">Torque</span>
                    <span class="font-medium text-slate-900">${car.specs.torque}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-600">Aceleración 0-100km/h</span>
                    <span class="font-medium text-slate-900">${car.specs.acceleration}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-600">Velocidad máxima</span>
                    <span class="font-medium text-slate-900">${car.specs.topSpeed}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-600">Consumo</span>
                    <span class="font-medium text-slate-900">${car.specs.consumption}</span>
                  </div>
                </div>
              `,
            })}

            ${Card({
              children: `
                <h3 class="font-semibold text-slate-900 mb-4">Dimensiones y equipamiento</h3>
                <div class="space-y-3">
                  <div class="flex justify-between">
                    <span class="text-slate-600">Dimensiones</span>
                    <span class="font-medium text-slate-900">${car.specs.dimensions}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-600">Peso</span>
                    <span class="font-medium text-slate-900">${car.specs.weight}</span>
                  </div>
                  <div class="mt-4">
                    <h4 class="font-medium text-slate-900 mb-2">Equipamiento destacado</h4>
                    <ul class="space-y-1 text-sm text-slate-600">
                      ${car.specs.features.map((feature: string) => `<li>• ${feature}</li>`).join('')}
                    </ul>
                  </div>
                </div>
              `,
            })}
          </div>
        </div>

        <div class="mt-12">
          <div class="mb-6">
            <h2 class="text-2xl font-bold text-slate-900">Preguntas públicas</h2>
            <p class="mt-2 text-sm text-slate-600">
              ${isPublished ? "Los compradores pueden dejar preguntas públicas y solo el vendedor de esta publicación puede responderlas." : "Las preguntas públicas están disponibles solo para autos publicados por vendedores."}
            </p>
          </div>

          ${
            isPublished
              ? `
                ${
                  user && user.role === "buyer"
                    ? `
                      <div class="rounded-3xl border border-slate-200 bg-white/80 p-6">
                        <label for="public-question-input" class="block text-sm font-semibold text-slate-900">Haz una pregunta pública</label>
                        <textarea id="public-question-input" rows="3" placeholder="Ej: ¿Tiene service oficial al día?" class="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-[#e76e1d] focus:outline-none focus:ring-1 focus:ring-[#e76e1d]"></textarea>
                        <div class="mt-4 flex justify-end">
                          ${Button({ id: "submit-public-question", text: "Publicar pregunta", variant: "primary" })}
                        </div>
                      </div>
                    `
                    : ""
                }

                <div class="mt-6 space-y-4">
                  ${
                    publicQuestions.length > 0
                      ? publicQuestions
                          .map((item) => {
                            const buyerName = getUserById(item.buyerId)?.name || "Comprador";
                            const canAnswer = !!user && user.role === "seller" && isOwner && !item.answer;

                            return `
                              <article class="rounded-3xl border border-slate-200 bg-white/80 p-6">
                                <div class="flex items-center justify-between gap-4">
                                  <div>
                                    <p class="text-sm font-semibold text-slate-900">${buyerName}</p>
                                    <p class="text-xs uppercase tracking-[0.22em] text-slate-500">${new Date(item.createdAt).toLocaleDateString("es-AR")}</p>
                                  </div>
                                  <span class="rounded-full bg-[#fff4eb] px-3 py-1 text-xs font-semibold text-[#c9540a]">
                                    ${item.answer ? "Respondida" : "Pendiente"}
                                  </span>
                                </div>
                                <p class="mt-4 leading-7 text-slate-700">${item.question}</p>

                                ${
                                  item.answer
                                    ? `
                                      <div class="seller-answer-card mt-5 rounded-2xl border border-[#e76e1d]/20 bg-[#fff8f2] p-4">
                                        <p class="text-xs font-semibold uppercase tracking-[0.22em] text-[#c9540a]">Respuesta del vendedor</p>
                                        <p class="seller-answer-text mt-2 leading-7 text-slate-700">${item.answer}</p>
                                      </div>
                                    `
                                    : canAnswer
                                      ? `
                                        <div class="mt-5">
                                          <label for="answer-${item.id}" class="block text-sm font-semibold text-slate-900">Responder públicamente</label>
                                          <textarea id="answer-${item.id}" data-answer-input="${item.id}" rows="3" placeholder="Escribe una respuesta útil para todos los compradores." class="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-[#e76e1d] focus:outline-none focus:ring-1 focus:ring-[#e76e1d]"></textarea>
                                          <div class="mt-4 flex justify-end">
                                            ${Button({ id: `reply-${item.id}`, text: "Responder", variant: "secondary" })}
                                          </div>
                                        </div>
                                      `
                                      : `
                                        <p class="mt-5 text-sm text-slate-500">El vendedor aún no respondió esta pregunta.</p>
                                      `
                                }
                              </article>
                            `;
                          })
                          .join("")
                      : `
                        <div class="rounded-3xl border border-slate-200 bg-white/80 p-8 text-center">
                          <p class="text-base font-semibold text-slate-900">Todavía no hay preguntas.</p>
                          <p class="mt-2 text-sm text-slate-600">Sé el primero en consultar algo sobre esta publicación.</p>
                        </div>
                      `
                  }
                </div>
              `
              : `
                <div class="rounded-3xl border border-slate-200 bg-white/80 p-8">
                  <p class="text-sm text-slate-600">Este vehículo pertenece al catálogo base y no tiene un vendedor asociado para preguntas públicas.</p>
                </div>
              `
          }
        </div>
      </div>
    </main>

    <!-- Modal para agrandar foto -->
    <div id="photo-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div class="relative max-w-4xl max-h-[90vh] w-full">
        <img id="modal-image" src="" alt="Foto ampliada" class="max-w-full max-h-[85vh] object-contain mx-auto">
        
        <button id="modal-prev" class="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 hover:bg-white">
          ${Icons.chevronLeft(6)}
        </button>
        <button id="modal-next" class="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 hover:bg-white">
          ${Icons.chevronRight(6)}
        </button>

        <button id="modal-close" class="absolute top-4 right-4 rounded-full bg-white/80 p-2 hover:bg-white">
          ${Icons.x(6)}
        </button>
      </div>
    </div>
  `;

  NavBarListeners();

  // Carrusel functionality
  let currentImageIndex = 0;
  const mainImage = document.getElementById('main-image') as HTMLImageElement;
  const thumbnails = document.querySelectorAll('.thumbnail-btn');
  const modal = document.getElementById('photo-modal');
  const modalImage = document.getElementById('modal-image') as HTMLImageElement;

  function updateImage(index: number) {
    currentImageIndex = index;
    if (car) mainImage.src = car.images[index];
    if (car) modalImage.src = car.images[index];
    thumbnails.forEach((thumb, i) => {
      thumb.classList.toggle('border-[#e76e1d]', i === index);
    });
  }

  document.getElementById('prev-image')?.addEventListener('click', () => {
    const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : car!.images.length - 1;
    updateImage(newIndex);
  });

  document.getElementById('next-image')?.addEventListener('click', () => {
    const newIndex = currentImageIndex < car!.images.length - 1 ? currentImageIndex + 1 : 0;
    updateImage(newIndex);
  });

  document.getElementById('modal-prev')?.addEventListener('click', () => {
    const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : car!.images.length - 1;
    updateImage(newIndex);
  });

  document.getElementById('modal-next')?.addEventListener('click', () => {
    const newIndex = currentImageIndex < car!.images.length - 1 ? currentImageIndex + 1 : 0;
    updateImage(newIndex);
  });

  thumbnails.forEach((thumb, index) => {
    thumb.addEventListener('click', () => updateImage(index));
  });

  // Modal functionality
  mainImage.addEventListener('click', () => {
    modalImage.src = car!.images[currentImageIndex];
    modal?.classList.remove('hidden');
  });

  document.getElementById('modal-close')?.addEventListener('click', () => {
    modal?.classList.add('hidden');
  });

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });

  window.scrollTo({ top: 0, behavior: 'auto' });

  // Event listeners
  document.getElementById("back-home")?.addEventListener("click", () => {
    const previousPage = sessionStorage.getItem("previousPage");
    if (previousPage === ROUTES.favorites) {
      navigateTo(ROUTES.favorites);
    } else if (previousPage === ROUTES.home) {
      navigateTo(ROUTES.home);
    } else {
      const userRole = sessionStorage.getItem("userRole");
      if (userRole) {
        navigateTo(ROUTES.home);
      } else {
        navigateTo(ROUTES.landing);
      }
    }
  });









  document.querySelector("#buy-now")?.addEventListener("click", () => {
    // Implementar compra
    alert("Funcionalidad de compra próximamente");
  });

  document.querySelector("#edit-car")?.addEventListener("click", () => {
    // Implementar edición
    alert("Funcionalidad de edición próximamente");
  });

  document.querySelector("#add-to-comparator")?.addEventListener("click", () => {
    if (!isFavorite(car.id)) {
      addFavorite(car.id);
    }

    const result = addToComparison(car.id);

    if (!result.ok && result.reason === "duplicate") {
      showToast("Ese vehículo ya está en el comparador", "error");
      navigateTo(ROUTES.comparator);
      return;
    }

    if (!result.ok && result.reason === "limit") {
      showToast("Puedes comparar hasta 4 vehículos al mismo tiempo", "error");
      return;
    }

    showToast("Vehículo agregado al comparador", "success");
    navigateTo(ROUTES.comparator);
  });

  document.querySelector("#add-favorite")?.addEventListener("click", () => {
    toggleFavorite(car.id);
    const btn = document.querySelector("#add-favorite");
    if (btn) {
      if (isFavorite(car.id)) {
        btn.innerHTML = `${Icons.heart(4, true)} Guardado`;
      } else {
        btn.innerHTML = `${Icons.heart(4, false)} Guardar`;
      }
    }
  });

  document.getElementById("submit-public-question")?.addEventListener("click", () => {
    if (!publishedCar || !user || user.role !== "buyer") return;

    const input = document.getElementById("public-question-input") as HTMLTextAreaElement | null;
    const question = input?.value.trim() || "";

    if (question.length < 8) {
      showToast("Escribe una pregunta un poco más específica", "error");
      return;
    }

    addPublicQuestion({
      carId: publishedCar.id,
      buyerId: user.id,
      sellerId: publishedCar.sellerId,
      question,
    });

    showToast("Tu pregunta se publicó correctamente", "success");
    renderCarDetailPage(container);
  });

  document.querySelectorAll<HTMLElement>("[id^='reply-question_']").forEach((button) => {
    button.addEventListener("click", () => {
      if (!publishedCar || !user || user.role !== "seller" || !isOwner) return;

      const questionId = button.id.replace("reply-", "");
      const input = document.querySelector<HTMLTextAreaElement>(`[data-answer-input="${questionId}"]`);
      const answer = input?.value.trim() || "";

      if (answer.length < 8) {
        showToast("La respuesta debe tener al menos 8 caracteres", "error");
        return;
      }

      const saved = answerPublicQuestion({
        questionId,
        sellerId: user.id,
        answer,
      });

      if (!saved) {
        showToast("No se pudo guardar la respuesta", "error");
        return;
      }

      showToast("Respuesta publicada correctamente", "success");
      renderCarDetailPage(container);
    });
  });
}
