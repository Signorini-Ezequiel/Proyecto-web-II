export function renderCarCard(title: string, price: string): string {
  return `
    <article class="rounded-2xl bg-white p-4 shadow">
      <div class="mb-3 h-40 rounded-xl bg-slate-200"></div>
      <h3 class="text-lg font-semibold text-slate-800">${title}</h3>
      <p class="mt-2 text-sm text-slate-600">${price}</p>
      <button class="mt-4 rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white">
        Ver detalle
      </button>
    </article>
  `
}
