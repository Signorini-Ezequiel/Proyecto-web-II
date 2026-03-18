export function renderNavbar(): string {
  return `
    <nav class="rounded-2xl bg-white p-4 shadow">
      <div class="flex items-center justify-between">
        <span class="text-lg font-bold text-slate-800">Proyecto</span>
        <div class="flex gap-4 text-sm text-slate-600">
          <a href="#">Inicio</a>
          <a href="#">Publicar</a>
          <a href="#">Login</a>
        </div>
      </div>
    </nav>
  `
}
