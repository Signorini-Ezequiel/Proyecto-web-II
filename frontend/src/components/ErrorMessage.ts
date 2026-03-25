type ErrorMessageProps = {
  id?: string;
  message?: string;
  hidden?: boolean;
};

export function ErrorMessage({
  id = "",
  message = "",
  hidden = true,
}: ErrorMessageProps): string {
  return `
    <div
      ${id ? `id="${id}"` : ""}
      class="${
        hidden ? "hidden" : "flex"
      } items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
      role="alert"
      aria-live="polite"
    >
      <span class="mt-[2px] inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-xs font-bold text-red-200">
        !
      </span>
      <p class="leading-5">${message}</p>
    </div>
  `;
}