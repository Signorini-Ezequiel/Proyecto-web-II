import { Toast, type ToastVariant } from "../components/Toast";

const TOAST_CONTAINER_ID = "app-toast-container";

function getToastContainer(): HTMLElement {
  let container = document.getElementById(TOAST_CONTAINER_ID);

  if (!container) {
    container = document.createElement("div");
    container.id = TOAST_CONTAINER_ID;
    container.className =
      "pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:bottom-6 sm:right-6";
    document.body.appendChild(container);
  }

  return container;
}

export function showToast(message: string, type: ToastVariant = "success"): void {
  const container = getToastContainer();
  const wrapper = document.createElement("div");

  wrapper.innerHTML = Toast(message, type).trim();

  const toast = wrapper.firstElementChild as HTMLDivElement | null;
  if (!toast) return;

  toast.classList.add("translate-y-3", "opacity-0");
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove("translate-y-3", "opacity-0");
  });

  window.setTimeout(() => {
    toast.classList.add("translate-y-3", "opacity-0");
    window.setTimeout(() => {
      toast.remove();
      if (!container.childElementCount) {
        container.remove();
      }
    }, 300);
  }, 3200);
}
