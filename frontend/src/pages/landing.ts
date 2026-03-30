import { Button } from "../components/Button";
import { Card } from "../components/Card";

export function renderLandingPage(container: HTMLElement): void {
  container.innerHTML = `
    <main class="min-h-screen app-bg text-slate-900">
      <header class="sticky top-0 z-20 border-b border-slate-200 app-bg/90 backdrop-blur">
        <div class="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div>
            <p class="text-xs uppercase tracking-[0.35em] text-[#e76e1d]">AutoPoint</p>
            <h1 class="mt-1 text-lg font-semibold text-slate-900">Marketplace de autos usados</h1>
          </div>

          <nav class="flex items-center gap-3">
            ${Button({ id: "go-login", text: "Iniciar sesión", variant: "ghost" })}
            ${Button({ id: "go-register", text: "Crear cuenta", variant: "primary" })}
          </nav>
        </div>
      </header>

      <section class="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <div class="flex flex-col justify-center">
          <p class="text-sm uppercase tracking-[0.35em] text-[#e76e1d]">
            Comprá, compará y publicá con más confianza
          </p>

          <h2 class="mt-5 max-w-3xl text-5xl font-bold leading-tight text-slate-900">
            La plataforma para encontrar o vender autos usados de forma más simple.
          </h2>

          <p class="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Los sellers publican vehículos, los buyers los buscan y comparan, y la
            plataforma incorpora inteligencia artificial para analizar imágenes,
            estimar el estado del vehículo y sugerir un rango de precio aproximado.
          </p>

          <div class="mt-8 flex flex-wrap gap-4">
            ${Button({ id: "hero-register", text: "Publicar o explorar", variant: "primary" })}
            ${Button({ id: "hero-login", text: "Ya tengo cuenta", variant: "secondary" })}
          </div>

          <div class="mt-10 grid gap-4 sm:grid-cols-3">
            <div class="rounded-3xl border border-slate-200 bg-white/80 p-5">
              <p class="text-sm text-slate-600">Autos publicados</p>
              <p class="mt-3 text-3xl font-bold text-slate-900">1.240+</p>
            </div>
            <div class="rounded-3xl border border-slate-200 bg-white/80 p-5">
              <p class="text-sm text-slate-600">Comparaciones activas</p>
              <p class="mt-3 text-3xl font-bold text-slate-900">380</p>
            </div>
            <div class="rounded-3xl border border-slate-200 bg-white/80 p-5">
              <p class="text-sm text-slate-600">Análisis IA generados</p>
              <p class="mt-3 text-3xl font-bold text-slate-900">920</p>
            </div>
          </div>
        </div>

        ${Card({
          className: "h-fit",
          children: `
            <p class="text-sm uppercase tracking-[0.25em] text-[#e76e1d]">Búsqueda rápida</p>
            <h3 class="mt-3 text-2xl font-bold text-slate-900">Encontrá tu próximo auto</h3>

            <div class="mt-6 grid gap-4">
              <div class="rounded-2xl border border-slate-200 bg-white/80 p-4">
                <p class="text-sm text-slate-600">Marca o modelo</p>
                <p class="mt-2 font-medium text-slate-900">Toyota Corolla, Amarok, 208...</p>
              </div>
              <div class="rounded-2xl border border-slate-200 bg-white/80 p-4">
                <p class="text-sm text-slate-600">Rango de precio</p>
                <p class="mt-2 font-medium text-slate-900">US$ 10.000 - US$ 35.000</p>
              </div>
              <div class="rounded-2xl border border-slate-200 bg-white/80 p-4">
                <p class="text-sm text-slate-600">Ubicación</p>
                <p class="mt-2 font-medium text-slate-900">Córdoba, Rosario, Buenos Aires</p>
              </div>
            </div>

            <div class="mt-6 rounded-3xl border border-[#e76e1d]/20 bg-[#e76e1d]/10 p-5">
              <p class="font-semibold text-slate-900">Asistente IA</p>
              <p class="mt-2 text-sm leading-6 text-slate-600">
                Analiza fotos del vehículo, detecta señales visibles de desgaste y sugiere
                un rango de precio estimado para orientar la publicación o evaluación.
              </p>
            </div>
          `,
        })}
      </section>

      <section class="mx-auto max-w-7xl px-5 pb-6 sm:px-8">
        <div class="grid gap-6 lg:grid-cols-3">
          ${Card({
            children: `
              <p class="text-lg font-semibold text-slate-900">Publicaciones de sellers</p>
              <p class="mt-3 text-sm leading-6 text-slate-600">
                Cada seller puede publicar vehículos con datos, fotos y precio para llegar
                a buyers interesados.
              </p>
            `,
          })}
          ${Card({
            children: `
              <p class="text-lg font-semibold text-slate-900">Comparación para buyers</p>
              <p class="mt-3 text-sm leading-6 text-slate-600">
                Los buyers pueden explorar opciones y comparar vehículos antes de decidir.
              </p>
            `,
          })}
          ${Card({
            children: `
              <p class="text-lg font-semibold text-slate-900">Soporte con inteligencia artificial</p>
              <p class="mt-3 text-sm leading-6 text-slate-600">
                La IA ayuda a estimar estado y precio a partir de imágenes del auto.
              </p>
            `,
          })}
        </div>
      </section>

      <section class="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div class="grid gap-6 lg:grid-cols-2">
          ${Card({
            children: `
              <p class="text-sm uppercase tracking-[0.25em] text-[#e76e1d]">Autos destacados</p>
              <div class="mt-5 space-y-3">
                <div class="rounded-2xl border border-slate-200 bg-white/80 p-4">
                  <div class="flex items-center justify-between gap-3">
                    <p class="font-medium text-slate-900">Toyota Corolla Cross 2022</p>
                    <span class="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-400">Muy buscado</span>
                  </div>
                  <p class="mt-2 text-sm text-slate-600">42.000 km · Automática · US$ 27.800</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-white/80 p-4">
                  <div class="flex items-center justify-between gap-3">
                    <p class="font-medium text-slate-900">Volkswagen Amarok 2021</p>
                    <span class="rounded-full bg-[#e76e1d]/15 px-3 py-1 text-xs text-[#e76e1d]">Comparado 18 veces</span>
                  </div>
                  <p class="mt-2 text-sm text-slate-600">68.000 km · V6 · US$ 33.500</p>
                </div>
              </div>
            `,
          })}

          ${Card({
            children: `
              <p class="text-sm uppercase tracking-[0.25em] text-[#e76e1d]">Cómo funciona</p>
              <div class="mt-5 space-y-4">
                <div class="border-l-2 border-[#e76e1d] pl-4">
                  <p class="font-medium text-slate-900">1. Registrate</p>
                  <p class="mt-1 text-sm text-slate-600">Elegí si querés entrar como buyer o seller.</p>
                </div>
                <div class="border-l-2 border-[#e76e1d] pl-4">
                  <p class="font-medium text-slate-900">2. Explorá o publicá</p>
                  <p class="mt-1 text-sm text-slate-600">Los buyers buscan y comparan; los sellers publican vehículos.</p>
                </div>
                <div class="border-l-2 border-amber-500 pl-4">
                  <p class="font-medium text-slate-900">3. Apoyate en la IA</p>
                  <p class="mt-1 text-sm text-slate-600">Usá el análisis visual como referencia para estado y precio.</p>
                </div>
              </div>
            `,
          })}
        </div>
      </section>
    </main>
  `;

    document.querySelector("#go-login")?.addEventListener("click", () => {
        window.open("/login", "_blank");
    });

    document.querySelector("#go-register")?.addEventListener("click", () => {
        window.open("/register", "_blank");
    });

    document.querySelector("#hero-login")?.addEventListener("click", () => {
        window.open("/login", "_blank");
    });

    document.querySelector("#hero-register")?.addEventListener("click", () => {
        window.open("/register", "_blank");
    });
}