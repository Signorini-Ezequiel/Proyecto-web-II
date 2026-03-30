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
      <label for="${id}" class="text-sm font-medium text-slate-700">
        ${label}
      </label>

      <input
        id="${id}"
        type="${type}"
        value="${value}"
        placeholder="${placeholder}"
        class="h-12 w-full rounded-2xl border border-[#e76e1d]/30 bg-white/90 px-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#e76e1d] focus:ring-4 focus:ring-[#e76e1d]/20"
      />

      ${
        hint
          ? `<p class="text-xs leading-5 text-slate-400">${hint}</p>`
          : ""
      }
    </div>
  `;
}