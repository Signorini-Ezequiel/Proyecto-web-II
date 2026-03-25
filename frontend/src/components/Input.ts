type InputProps = {
  id: string;
  label: string;
  type?: "text" | "email" | "password";
  placeholder?: string;
  value?: string;
  hint?: string;
};

export function Input({
  id,
  label,
  type = "text",
  placeholder = "",
  value = "",
  hint = "",
}: InputProps): string {
  return `
    <div class="flex flex-col gap-2">
      <label for="${id}" class="text-sm font-medium text-slate-200">
        ${label}
      </label>

      <input
        id="${id}"
        type="${type}"
        value="${value}"
        placeholder="${placeholder}"
        class="h-12 w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15"
      />

      ${
        hint
          ? `<p class="text-xs leading-5 text-slate-400">${hint}</p>`
          : ""
      }
    </div>
  `;
}