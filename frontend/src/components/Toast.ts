export type ToastVariant = "success" | "error";

const TOAST_STYLES: Record<ToastVariant, string> = {
  success:
    "border-[var(--brand)]/30 bg-[linear-gradient(135deg,rgba(231,110,29,0.96),rgba(212,90,10,0.96))] text-white shadow-[0_18px_36px_rgba(231,110,29,0.28)]",
  error:
    "border-red-300/70 bg-[linear-gradient(135deg,rgba(185,28,28,0.96),rgba(127,29,29,0.96))] text-white shadow-[0_18px_36px_rgba(127,29,29,0.24)]",
};

export function Toast(message: string, variant: ToastVariant = "success"): string {
  return `
    <div class="pointer-events-auto min-w-[280px] max-w-sm overflow-hidden rounded-2xl border px-4 py-3 backdrop-blur-sm transition duration-300 ${TOAST_STYLES[variant]}">
      <div class="flex items-start gap-3">
        <div class="mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-white/85"></div>
        <div class="flex-1">
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-white/75">
            ${variant === "success" ? "Listo" : "Atención"}
          </p>
          <p class="mt-1 text-sm font-medium leading-6 text-white">
            ${message}
          </p>
        </div>
      </div>
    </div>
  `;
}
