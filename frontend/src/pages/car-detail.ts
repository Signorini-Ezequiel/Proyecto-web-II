import { Button } from "../components/Button";
import { NavBar, NavBarListeners } from "../components/NavBar";
import { navigateTo, ROUTES } from "../utils/router";
import {
  deletePublishedCar,
  fetchPublishedCarById,
  type PublishedCar,
  publishedCarToCar,
} from "../services/published-cars";
import {
  getFavorites,
  isFavorite,
  toggleFavorite,
} from "../services/favorites";
import { getSessionUser } from "../services/auth";
import { Icons } from "../utils/icons";
import { showToast } from "../utils/toast";
import { bindThemeToggleButtons } from "../utils/theme";
import {
  getAIErrorMessage,
  getVehicleAIAnalysis,
  regenerateVehicleAIAnalysis,
} from "../services/ai";
import {
  createQuestionThread,
  getQuestionThreadsByCarId,
  sendQuestionMessage,
  setCachedQuestionThreads,
  type PublicQuestionMessage,
  type PublicQuestionThread,
} from "../services/car-questions";
import type { SessionUser } from "../types/auth";
import type { VehicleAIAnalysisResponse } from "../types/ai";
import type { Car } from "../types/car";

const RETURN_ROUTES: Record<string, string> = {
  home: ROUTES.home,
  favorites: ROUTES.favorites,
  comparator: ROUTES.comparator,
  profile: ROUTES.profile,
  seller: ROUTES.home,
};

export function setCurrentCarId(_id: string, _isPublished = false) {
  // Compatibilidad con llamadas viejas: el detalle usa siempre ?id= para evitar estado inconsistente.
}

export async function renderCarDetailPage(container: HTMLElement): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  const carId = params.get("id")?.trim();
  const from = params.get("from")?.trim() || "home";
  const returnRoute = RETURN_ROUTES[from] ?? ROUTES.home;

  if (!carId) {
    navigateTo(returnRoute);
    return;
  }

  renderLoading(container);
  NavBarListeners();
  bindThemeToggleButtons();

  const [publishedCar, questionThreads] = await Promise.all([
    fetchPublishedCarById(carId),
    getQuestionThreadsByCarId(carId),
  ]);

  if (!publishedCar) {
    renderNotFound(container, returnRoute);
    NavBarListeners();
    bindBackButton(returnRoute);
    return;
  }

  const user = getSessionUser();
  const isOwner = !!user && user.id === publishedCar.sellerId;
  const isSeller = user?.role === "seller";
  const canUseBuyerActions = user?.role === "buyer";

  if (canUseBuyerActions) {
    await getFavorites();
  }

  const car = publishedCarToCar(publishedCar);
  const safeImages = car.images.filter(Boolean);
  renderDetail(container, {
    car,
    publishedCar,
    questionThreads,
    returnRoute,
    isOwner,
    isSeller,
    canUseBuyerActions,
    currentUser: user,
    hasImages: safeImages.length > 0,
  });

  NavBarListeners();
  bindThemeToggleButtons();
  bindBackButton(returnRoute);
  bindGallery(car, safeImages);
  bindBuyerActions(car, canUseBuyerActions);
  bindOwnerActions(car.id, isOwner, returnRoute);
  bindQuestionActions(car, questionThreads, isOwner, canUseBuyerActions, user);
  bindAIAnalysis(car.id, !!user);

  window.scrollTo({ top: 0, behavior: "auto" });
}

function renderLoading(container: HTMLElement): void {
  container.innerHTML = `
    <main class="min-h-screen app-bg text-slate-900 pt-20">
      ${NavBar({ showAbout: false })}
      <div class="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div class="mb-6 h-6 w-40 animate-pulse rounded bg-slate-200"></div>
        <div class="grid gap-8 lg:grid-cols-2">
          <div class="space-y-4">
            <div class="aspect-video animate-pulse rounded-3xl bg-slate-200"></div>
            <div class="flex gap-2">
              ${Array.from({ length: 4 }, () => `<div class="h-20 w-20 animate-pulse rounded-lg bg-slate-200"></div>`).join("")}
            </div>
          </div>
          <div class="space-y-5">
            <div class="h-9 w-2/3 animate-pulse rounded bg-slate-200"></div>
            <div class="h-7 w-40 animate-pulse rounded bg-slate-200"></div>
            <div class="grid grid-cols-2 gap-4">
              ${Array.from({ length: 4 }, () => `<div class="h-20 animate-pulse rounded-2xl bg-slate-200"></div>`).join("")}
            </div>
            <div class="h-40 animate-pulse rounded-3xl bg-slate-200"></div>
          </div>
        </div>
      </div>
    </main>
  `;
}

function renderNotFound(container: HTMLElement, returnRoute: string): void {
  container.innerHTML = `
    <main class="min-h-screen app-bg text-slate-900 pt-20">
      ${NavBar({ showAbout: false })}
      <div class="mx-auto max-w-3xl px-5 py-16 sm:px-8">
        <div class="rounded-3xl border border-slate-200 bg-white/85 p-8 text-center">
          <h1 class="text-2xl font-bold text-slate-900">Auto no encontrado</h1>
          <p class="mt-3 text-slate-600">La publicacion no existe o ya fue eliminada.</p>
          <button id="back-home" class="mt-6 rounded-2xl bg-[#e76e1d] px-5 py-3 text-sm font-semibold text-white hover:bg-[#c05511]">
            Volver
          </button>
        </div>
      </div>
    </main>
  `;
  document.getElementById("back-home")?.addEventListener("click", () => navigateTo(returnRoute));
}

function renderDetail(
  container: HTMLElement,
  state: {
    car: Car;
    publishedCar: PublishedCar;
    questionThreads: PublicQuestionThread[];
    returnRoute: string;
    isOwner: boolean;
    isSeller: boolean;
    canUseBuyerActions: boolean;
    currentUser: SessionUser | null;
    hasImages: boolean;
  },
): void {
  const { car, publishedCar, questionThreads, isOwner, canUseBuyerActions, currentUser, hasImages } = state;
  const images = car.images.filter(Boolean);
  const firstImage = hasImages ? images[0] : "";

  container.innerHTML = `
    <main class="min-h-screen app-bg text-slate-900 pt-20">
      ${NavBar({ showAbout: false })}
      <div class="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <button id="back-home" class="mb-6 flex items-center gap-2 text-[#e76e1d] transition-colors hover:text-[#d45a0a]">
          ${Icons.chevronLeft(5)}
          <span>Volver</span>
        </button>

        <div class="grid gap-8 lg:grid-cols-2">
          <div class="space-y-4">
            <div class="relative aspect-video overflow-hidden rounded-3xl border border-slate-200 bg-white/80">
              ${
                hasImages
                  ? `<img id="main-image" src="${escapeHtml(firstImage)}" alt="${escapeHtml(`${car.make} ${car.model}`)}" class="h-full w-full cursor-zoom-in object-cover" loading="eager" decoding="async">`
                  : `<div class="flex h-full w-full items-center justify-center bg-slate-100 text-sm font-medium text-slate-500">Sin imagen disponible</div>`
              }
              ${
                images.length > 1
                  ? `
                    <button id="prev-image" class="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 shadow-lg hover:bg-white" aria-label="Imagen anterior">
                      ${Icons.chevronLeft(5)}
                    </button>
                    <button id="next-image" class="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 shadow-lg hover:bg-white" aria-label="Imagen siguiente">
                      ${Icons.chevronRight(5)}
                    </button>
                  `
                  : ""
              }
            </div>

            <div class="flex min-h-20 gap-2 overflow-x-auto pb-1">
              ${images.map((img, index) => `
                <button class="thumbnail-btn h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 ${index === 0 ? "border-[#e76e1d]" : "border-transparent"} transition-colors hover:border-[#e76e1d]" data-index="${index}" aria-label="Ver imagen ${index + 1}">
                  <img src="${escapeHtml(img)}" alt="Vista ${index + 1}" class="h-full w-full object-cover" loading="lazy" decoding="async">
                </button>
              `).join("")}
            </div>
          </div>

          <div class="space-y-6">
            <div>
              <h1 class="text-3xl font-bold text-slate-900">${escapeHtml(car.make)} ${escapeHtml(car.model)} ${car.year}</h1>
              <p class="mt-2 text-2xl font-semibold text-[#e76e1d]">US$ ${car.price.toLocaleString()}</p>
              <p class="mt-1 text-sm text-slate-600">${escapeHtml(car.location)}</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              ${detailStat("Kilometraje", `${car.mileage.toLocaleString()} km`)}
              ${detailStat("Transmision", car.transmission)}
              ${detailStat("Combustible", car.fuel)}
              ${detailStat("Color", car.color)}
            </div>

            <section class="rounded-3xl border border-slate-200 bg-white/80 p-6">
              <h3 class="font-semibold text-slate-900">Descripcion</h3>
              <p class="mt-3 leading-7 text-slate-600">${escapeHtml(car.description)}</p>
            </section>

            ${renderAIAnalysisShell(!!currentUser)}

            ${renderSellerCard(publishedCar)}

            <div class="flex flex-wrap gap-4">
              ${isOwner ? Button({ id: "edit-car", text: "Editar vehiculo", variant: "secondary" }) : ""}
              ${isOwner ? Button({ id: "delete-car", text: "Eliminar", variant: "danger" }) : ""}
              ${canUseBuyerActions ? Button({
                id: "add-favorite",
                text: isFavorite(car.id) ? `${Icons.heart(4, true)} Guardado` : `${Icons.heart(4, false)} Guardar`,
                variant: "secondary",
              }) : ""}
            </div>
          </div>
        </div>

        ${renderQuestions(car, questionThreads, isOwner, canUseBuyerActions, currentUser)}
      </div>

      <div id="image-modal" class="fixed inset-0 z-[80] hidden items-center justify-center bg-black/80 p-4">
        <button id="close-modal" class="absolute right-5 top-5 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900">Cerrar</button>
        <img id="modal-image" src="" alt="Imagen ampliada" class="max-h-[85vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl">
      </div>
    </main>
  `;
}

function detailStat(label: string, value: string): string {
  return `
    <div class="rounded-2xl border border-slate-200 bg-white/80 p-4">
      <p class="text-sm text-slate-600">${escapeHtml(label)}</p>
      <p class="mt-1 font-semibold text-slate-900">${escapeHtml(value)}</p>
    </div>
  `;
}

function renderAIAnalysisShell(canAnalyze: boolean): string {
  if (!canAnalyze) {
    return `
      <section class="ai-opinion-card rounded-3xl border p-6">
        <p class="text-xs font-semibold uppercase tracking-[0.28em] text-[#c9540a]">Analisis IA</p>
        <p class="mt-3 text-sm leading-6 text-slate-600">Inicia sesion para generar analisis inteligente real del vehiculo.</p>
      </section>
    `;
  }

  return `
    <section class="ai-opinion-card rounded-3xl border p-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-[#c9540a]">Analisis IA real</p>
          <h3 class="mt-1 font-semibold text-slate-900">Evaluacion inteligente</h3>
        </div>
        <button id="ai-regenerate" type="button" class="rounded-xl border border-[#e76e1d]/50 px-3 py-2 text-xs font-semibold text-[#c9540a] hover:bg-[#fff4eb]">Regenerar</button>
      </div>
      <div id="ai-analysis-content" class="mt-4">
        ${renderAIAnalysisLoading()}
      </div>
    </section>
  `;
}

function renderAIAnalysisLoading(): string {
  return `
    <div class="space-y-3">
      <div class="h-4 w-3/4 animate-pulse rounded bg-slate-200"></div>
      <div class="h-4 w-full animate-pulse rounded bg-slate-200"></div>
      <div class="h-4 w-5/6 animate-pulse rounded bg-slate-200"></div>
      <div class="grid gap-2 sm:grid-cols-2">
        <div class="h-16 animate-pulse rounded-2xl bg-slate-200"></div>
        <div class="h-16 animate-pulse rounded-2xl bg-slate-200"></div>
      </div>
    </div>
  `;
}

function renderAIAnalysisResult(analysis: VehicleAIAnalysisResponse): string {
  const data = analysis.dataAnalysis;
  const image = analysis.imageAnalysis;

  return `
    <div class="space-y-5">
      <div class="flex flex-wrap items-center gap-3">
        ${renderScoreBadge("Datos", data.score)}
        ${image ? renderScoreBadge("Imagenes", image.confidence) : ""}
        <span class="ai-cache-badge rounded-full px-3 py-1 text-xs font-semibold">${analysis.cached ? "Cacheado" : "Nuevo analisis"}</span>
      </div>
      <p class="ai-analysis-text leading-7">${escapeHtml(data.summary)}</p>
      <div class="grid gap-3 sm:grid-cols-2">
        ${renderAIList("Puntos fuertes", data.positives)}
        ${renderAIList("Alertas", data.negatives)}
      </div>
      <div class="ai-mini-panel rounded-2xl border p-4">
        <h4 class="text-sm font-semibold">Recomendacion</h4>
        <p class="mt-2 text-sm leading-6">${escapeHtml(data.recommendation)}</p>
      </div>
      ${
        image
          ? `
            <div class="ai-mini-panel rounded-2xl border p-4">
              <h4 class="text-sm font-semibold">Revision visual</h4>
              <p class="mt-2 text-sm leading-6">${escapeHtml(image.visualCondition)}</p>
              ${renderAIList("Danos visibles o limites", image.detectedIssues)}
              ${renderAIList("Aspectos positivos", image.positiveAspects)}
            </div>
          `
          : `<p class="questions-meta text-sm">No hay imagenes remotas validas para analizar con vision.</p>`
      }
    </div>
  `;
}

function renderScoreBadge(label: string, score: number): string {
  return `
    <div class="ai-score-badge rounded-2xl border px-3 py-2">
      <span class="text-xs font-semibold uppercase tracking-[0.14em]">${escapeHtml(label)}</span>
      <span class="ml-2 text-lg font-bold">${score}/100</span>
    </div>
  `;
}

function renderAIList(title: string, items: string[]): string {
  const cleanItems = items.filter(Boolean).slice(0, 4);

  return `
    <div class="ai-mini-panel rounded-2xl border p-4">
      <h4 class="text-sm font-semibold">${escapeHtml(title)}</h4>
      <ul class="mt-2 space-y-2 text-sm leading-6">
        ${cleanItems.length > 0 ? cleanItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("") : "<li>Sin observaciones relevantes.</li>"}
      </ul>
    </div>
  `;
}

function renderSellerCard(publishedCar: PublishedCar): string {
  const seller = publishedCar.seller;
  const sellerName = seller?.name || "Vendedor";

  return `
    <section class="seller-profile-card rounded-3xl border p-5">
      <div class="flex items-center gap-4">
        ${renderAvatar(seller?.avatarUrl ?? null, sellerName, "h-14 w-14")}
        <div class="min-w-0 flex-1">
          <p class="seller-profile-label text-xs font-semibold uppercase tracking-[0.18em]">Publicado por</p>
          <p class="seller-profile-name mt-1 truncate text-base font-semibold">${escapeHtml(sellerName)}</p>
          <div class="seller-profile-meta mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm">
            <span>${roleLabel(seller?.role ?? "seller")}</span>
            <span>${formatDate(publishedCar.publishedAt)}</span>
            ${publishedCar.location ? `<span>${escapeHtml(publishedCar.location)}</span>` : ""}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderQuestions(
  car: Car,
  threads: PublicQuestionThread[],
  isOwner: boolean,
  canUseBuyerActions: boolean,
  currentUser: SessionUser | null,
): string {
  const messageCount = threads.reduce((total, thread) => total + thread.messages.length, 0);

  return `
    <section class="questions-panel mt-10 rounded-3xl border p-6">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="questions-title text-xl font-semibold">Conversacion publica</h2>
          <p class="questions-meta mt-1 text-sm">${threads.length} hilo${threads.length === 1 ? "" : "s"} · ${messageCount} mensaje${messageCount === 1 ? "" : "s"}</p>
        </div>
      </div>

      ${canUseBuyerActions ? `
        <form id="question-form" class="question-compose mt-5 flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row">
          <input id="question-input" type="text" maxlength="1000" placeholder="Escribe una pregunta para iniciar un hilo" class="question-input min-h-11 flex-1 rounded-2xl border px-4 text-sm outline-none focus:border-[#e76e1d]">
          <button id="question-submit" type="submit" class="rounded-2xl bg-[#e76e1d] px-5 py-3 text-sm font-semibold text-white hover:bg-[#c05511]">Enviar</button>
        </form>
      ` : ""}

      <div id="questions-list" class="mt-6 space-y-4">
        ${renderThreadList(car.id, threads, isOwner, canUseBuyerActions, currentUser)}
      </div>
    </section>
  `;
}

function renderThreadList(
  carId: string,
  threads: PublicQuestionThread[],
  isOwner: boolean,
  canUseBuyerActions: boolean,
  currentUser: SessionUser | null,
): string {
  if (threads.length === 0) {
    return `<p class="questions-empty rounded-2xl p-4 text-sm">Todavia no hay conversaciones para este auto.</p>`;
  }

  return threads.map((thread) => renderThreadItem(carId, thread, isOwner, canUseBuyerActions, currentUser)).join("");
}

function renderThreadItem(
  carId: string,
  thread: PublicQuestionThread,
  isOwner: boolean,
  canUseBuyerActions: boolean,
  currentUser: SessionUser | null,
): string {
  const canReply = isOwner || (canUseBuyerActions && thread.messages.some((message) => message.senderId === currentUser?.id));

  return `
    <article class="question-card rounded-2xl border p-4" data-thread-id="${thread.threadId}">
      <div class="space-y-3">
        ${thread.messages.map((message) => renderMessageItem(message)).join("")}
      </div>
      ${
        canReply
          ? `
            <form class="thread-reply-form mt-4 flex flex-col gap-2 sm:flex-row" data-thread-id="${thread.threadId}" data-car-id="${carId}">
              <input type="text" maxlength="1000" class="thread-reply-input question-input min-h-10 flex-1 rounded-xl border px-3 text-sm outline-none focus:border-[#e76e1d]" placeholder="Responder en este hilo">
              <button type="submit" class="rounded-xl border border-[#e76e1d] px-4 py-2 text-sm font-semibold text-[#c9540a] hover:bg-[#fff4eb]">Enviar</button>
            </form>
          `
          : ""
      }
    </article>
  `;
}

function renderMessageItem(message: PublicQuestionMessage): string {
  return `
    <div class="chat-message ${message.pending ? "is-pending" : ""} ${message.failed ? "is-failed" : ""}" data-message-id="${message.messageId}">
      ${renderAvatar(message.sender.avatarUrl, message.sender.name, "h-9 w-9")}
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span class="chat-author text-sm font-semibold">${escapeHtml(message.sender.name)}</span>
          <span class="chat-role rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em]">${roleLabel(message.senderRole)}</span>
          <span class="chat-date text-xs">${message.pending ? "Enviando..." : formatDate(message.createdAt)}</span>
        </div>
        <p class="chat-bubble mt-1 rounded-2xl px-3 py-2 text-sm leading-6">${escapeHtml(message.content)}</p>
      </div>
    </div>
  `;
}

function renderAvatar(avatarUrl: string | null, name: string, sizeClass: string): string {
  return avatarUrl
    ? `<img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(name)}" class="${sizeClass} avatar-image flex-shrink-0 rounded-full object-cover">`
    : `<div class="${sizeClass} avatar-fallback flex flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold">${escapeHtml(getInitials(name))}</div>`;
}

function bindBackButton(returnRoute: string): void {
  document.getElementById("back-home")?.addEventListener("click", () => navigateTo(returnRoute));
}

function bindGallery(car: Car, images: string[]): void {
  if (images.length === 0) return;

  let currentImageIndex = 0;
  const mainImage = document.getElementById("main-image") as HTMLImageElement | null;
  const modal = document.getElementById("image-modal");
  const modalImage = document.getElementById("modal-image") as HTMLImageElement | null;
  const thumbnails = document.querySelectorAll<HTMLElement>(".thumbnail-btn");

  const updateImage = (index: number) => {
    if (!mainImage) return;
    currentImageIndex = ((index % images.length) + images.length) % images.length;
    mainImage.src = images[currentImageIndex];
    thumbnails.forEach((thumb, i) => thumb.classList.toggle("border-[#e76e1d]", i === currentImageIndex));
  };

  document.getElementById("prev-image")?.addEventListener("click", () => updateImage(currentImageIndex - 1));
  document.getElementById("next-image")?.addEventListener("click", () => updateImage(currentImageIndex + 1));
  thumbnails.forEach((thumb, index) => thumb.addEventListener("click", () => updateImage(index)));

  mainImage?.addEventListener("click", () => {
    if (!modal || !modalImage) return;
    modalImage.src = images[currentImageIndex];
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  });

  document.getElementById("close-modal")?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  }, { once: true });

  function closeModal(): void {
    modal?.classList.add("hidden");
    modal?.classList.remove("flex");
  }
}

function bindBuyerActions(car: Car, canUseBuyerActions: boolean): void {
  if (!canUseBuyerActions) return;

  document.querySelector("#add-favorite")?.addEventListener("click", async () => {
    const btn = document.querySelector("#add-favorite") as HTMLButtonElement | null;
    if (!btn) return;

    btn.disabled = true;
    const wasFavorite = isFavorite(car.id);
    btn.innerHTML = !wasFavorite ? `${Icons.heart(4, true)} Guardado` : `${Icons.heart(4, false)} Guardar`;
    await toggleFavorite(car.id);
    btn.innerHTML = isFavorite(car.id) ? `${Icons.heart(4, true)} Guardado` : `${Icons.heart(4, false)} Guardar`;
    btn.disabled = false;
  });

}

function bindOwnerActions(carId: string, isOwner: boolean, returnRoute: string): void {
  if (!isOwner) return;

  document.querySelector("#edit-car")?.addEventListener("click", () => {
    navigateTo(`${ROUTES.editCar}?id=${encodeURIComponent(carId)}`);
  });

  document.querySelector("#delete-car")?.addEventListener("click", async () => {
    const confirmed = window.confirm("Esta accion eliminara el vehiculo y sus favoritos, comparaciones y preguntas. Deseas continuar?");
    if (!confirmed) return;

    const btn = document.querySelector("#delete-car") as HTMLButtonElement | null;
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Eliminando...";
    }

    const ok = await deletePublishedCar(carId);

    if (!ok) {
      showToast("No se pudo eliminar el vehiculo", "error");
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Eliminar";
      }
      return;
    }

    showToast("Vehiculo eliminado", "success");
    navigateTo(returnRoute === ROUTES.carDetail ? ROUTES.home : returnRoute);
  });
}

function bindAIAnalysis(carId: string, canAnalyze: boolean): void {
  if (!canAnalyze) return;

  const content = document.getElementById("ai-analysis-content");
  const regenerateButton = document.getElementById("ai-regenerate") as HTMLButtonElement | null;
  if (!content) return;

  const load = async (force = false) => {
    content.innerHTML = renderAIAnalysisLoading();
    if (regenerateButton) regenerateButton.disabled = true;

    try {
      const analysis = force
        ? await regenerateVehicleAIAnalysis(carId)
        : await getVehicleAIAnalysis(carId);
      content.innerHTML = renderAIAnalysisResult(analysis);
    } catch (error) {
      content.innerHTML = `
        <div class="ai-error rounded-2xl border p-4 text-sm leading-6">
          ${escapeHtml(getAIErrorMessage(error))}
        </div>
      `;
    } finally {
      if (regenerateButton) regenerateButton.disabled = false;
    }
  };

  regenerateButton?.addEventListener("click", () => {
    void load(true);
  });

  window.setTimeout(() => {
    void load(false);
  }, 50);
}

function bindQuestionActions(
  car: Car,
  threads: PublicQuestionThread[],
  isOwner: boolean,
  canUseBuyerActions: boolean,
  currentUser: SessionUser | null,
): void {
  if (canUseBuyerActions) {
    document.getElementById("question-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = document.getElementById("question-input") as HTMLInputElement | null;
      const button = document.getElementById("question-submit") as HTMLButtonElement | null;
      const text = input?.value.trim() ?? "";
      if (!text) return;

      if (button) {
        button.disabled = true;
        button.textContent = "Enviando...";
      }

      const optimisticThread = buildOptimisticThread(car.id, text, currentUser);
      threads.push(optimisticThread);
      refreshThreadsList(car.id, threads, isOwner, canUseBuyerActions, currentUser);
      if (input) input.value = "";

      const thread = await createQuestionThread({ carId: car.id, content: text });
      if (!thread) {
        const failed = markOptimisticThreadFailed(threads, optimisticThread.threadId);
        setCachedQuestionThreads(car.id, failed);
        refreshThreadsList(car.id, failed, isOwner, canUseBuyerActions, currentUser);
        showToast("No se pudo publicar la pregunta", "error");
      } else {
        replaceOptimisticThread(threads, optimisticThread.threadId, thread);
        setCachedQuestionThreads(car.id, threads);
        refreshThreadsList(car.id, threads, isOwner, canUseBuyerActions, currentUser);
        showToast("Pregunta publicada", "success");
      }

      if (button) {
        button.disabled = false;
        button.textContent = "Preguntar";
      }
    });
  }

  bindThreadReplyForms(car.id, threads, isOwner, canUseBuyerActions, currentUser);
}

function bindThreadReplyForms(
  carId: string,
  threads: PublicQuestionThread[],
  isOwner: boolean,
  canUseBuyerActions: boolean,
  currentUser: SessionUser | null,
): void {
  document.querySelectorAll<HTMLFormElement>(".thread-reply-form").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const threadId = form.dataset.threadId;
      const input = form.querySelector<HTMLInputElement>(".thread-reply-input");
      const button = form.querySelector<HTMLButtonElement>("button");
      const content = input?.value.trim() ?? "";
      if (!threadId || !content) return;

      if (button) {
        button.disabled = true;
        button.textContent = "Enviando...";
      }

      const optimisticMessage = buildOptimisticMessage(carId, threadId, content, currentUser);
      addMessageToThread(threads, threadId, optimisticMessage);
      refreshThreadsList(carId, threads, isOwner, canUseBuyerActions, currentUser);
      if (input) input.value = "";

      const message = await sendQuestionMessage({ threadId, carId, content });
      if (!message) {
        markOptimisticMessageFailed(threads, threadId, optimisticMessage.messageId);
        setCachedQuestionThreads(carId, threads);
        refreshThreadsList(carId, threads, isOwner, canUseBuyerActions, currentUser);
        showToast("No se pudo enviar el mensaje", "error");
      } else {
        replaceOptimisticMessage(threads, threadId, optimisticMessage.messageId, message);
        setCachedQuestionThreads(carId, threads);
        refreshThreadsList(carId, threads, isOwner, canUseBuyerActions, currentUser);
        showToast("Mensaje enviado", "success");
      }

      if (button) {
        button.disabled = false;
        button.textContent = "Enviar";
      }
    });
  });
}

function refreshThreadsList(
  carId: string,
  threads: PublicQuestionThread[],
  isOwner: boolean,
  canUseBuyerActions: boolean,
  currentUser: SessionUser | null,
): void {
  const list = document.getElementById("questions-list");
  if (!list) return;
  list.innerHTML = renderThreadList(carId, threads, isOwner, canUseBuyerActions, currentUser);
  bindThreadReplyForms(carId, threads, isOwner, canUseBuyerActions, currentUser);
}

function buildOptimisticThread(
  carId: string,
  content: string,
  currentUser: SessionUser | null,
): PublicQuestionThread {
  const now = new Date().toISOString();
  const threadId = `pending-thread-${Date.now()}`;

  return {
    threadId,
    carId,
    createdAt: now,
    updatedAt: now,
    messages: [buildOptimisticMessage(carId, threadId, content, currentUser)],
  };
}

function buildOptimisticMessage(
  carId: string,
  threadId: string,
  content: string,
  currentUser: SessionUser | null,
): PublicQuestionMessage {
  const role = currentUser?.role === "seller" ? "seller" : "buyer";

  return {
    messageId: `pending-message-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    threadId,
    senderId: currentUser?.id ?? "pending-user",
    senderRole: role,
    carId,
    content,
    createdAt: new Date().toISOString(),
    pending: true,
    sender: {
      id: currentUser?.id ?? "pending-user",
      name: currentUser?.name ?? "Usuario",
      role,
      avatarUrl: currentUser?.avatarUrl ?? null,
    },
  };
}

function replaceOptimisticThread(
  threads: PublicQuestionThread[],
  optimisticThreadId: string,
  thread: PublicQuestionThread,
): void {
  const index = threads.findIndex((item) => item.threadId === optimisticThreadId);
  if (index >= 0) threads[index] = thread;
}

function markOptimisticThreadFailed(
  threads: PublicQuestionThread[],
  optimisticThreadId: string,
): PublicQuestionThread[] {
  return threads.map((thread) =>
    thread.threadId === optimisticThreadId
      ? {
          ...thread,
          messages: thread.messages.map((message) => ({
            ...message,
            pending: false,
            failed: true,
          })),
        }
      : thread,
  );
}

function addMessageToThread(
  threads: PublicQuestionThread[],
  threadId: string,
  message: PublicQuestionMessage,
): void {
  const thread = threads.find((item) => item.threadId === threadId);
  if (!thread) return;
  thread.messages = [...thread.messages, message];
  thread.updatedAt = message.createdAt;
}

function replaceOptimisticMessage(
  threads: PublicQuestionThread[],
  threadId: string,
  optimisticMessageId: string,
  message: PublicQuestionMessage,
): void {
  const thread = threads.find((item) => item.threadId === threadId);
  if (!thread) return;
  thread.messages = thread.messages.map((item) => (item.messageId === optimisticMessageId ? message : item));
  thread.updatedAt = message.createdAt;
}

function markOptimisticMessageFailed(
  threads: PublicQuestionThread[],
  threadId: string,
  optimisticMessageId: string,
): void {
  const thread = threads.find((item) => item.threadId === threadId);
  if (!thread) return;
  thread.messages = thread.messages.map((message) =>
    message.messageId === optimisticMessageId
      ? { ...message, pending: false, failed: true }
      : message,
  );
}

function roleLabel(role: "buyer" | "seller"): string {
  return role === "seller" ? "Vendedor" : "Comprador";
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
  return initials || "U";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
