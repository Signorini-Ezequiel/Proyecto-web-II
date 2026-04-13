import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { navigateTo, ROUTES } from "../utils/router";
import { isAuthenticated, getSessionUser } from "../services/auth";

export function renderLandingPage(container: HTMLElement): void {
  const isLoggedIn = isAuthenticated();
  const user = isLoggedIn ? getSessionUser() : null;
  container.innerHTML = `
    <main class="min-h-screen app-bg text-slate-900 pt-20">
      <header class="sticky top-0 z-20 border-b border-slate-200 app-bg/90 backdrop-blur">
        <div class="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div>
            <p class="text-xs uppercase tracking-[0.35em] text-[#e76e1d]">AutoPoint</p>
            <h1 class="mt-1 text-lg font-semibold text-slate-900">Marketplace de autos usados</h1>
          </div>

          <nav class="flex items-center gap-3">
            <a href="#" id="nav-about" class="text-sm text-slate-600 hover:text-[#e76e1d] transition-colors">Sobre nosotros</a>
            ${
              isLoggedIn
                ? `
                  <div class="hidden rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-600 md:block">
                    ${user?.name} · ${user?.role === "seller" ? "Vendedor" : "Comprador"}
                  </div>
                  ${Button({ id: "go-home", text: "Ir al panel", variant: "primary" })}
                `
                : `
                  ${Button({ id: "go-login", text: "Iniciar sesión", variant: "ghost" })}
                  ${Button({ id: "go-register", text: "Crear cuenta", variant: "primary" })}
                `
            }
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
            ${
              isLoggedIn
                ? Button({ id: "hero-home", text: "Ir al panel", variant: "primary" })
                : `
                  ${Button({ id: "hero-register", text: "Publicar o explorar", variant: "primary" })}
                  ${Button({ id: "hero-login", text: "Ya tengo cuenta", variant: "secondary" })}
                `
            }
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

      <section class="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div class="text-center">
          <h2 class="text-3xl font-bold text-slate-900">Lo que dicen nuestros usuarios</h2>
          <p class="mt-4 text-lg text-slate-600">Experiencias reales de compradores y vendedores</p>
        </div>

        <div class="mt-12 grid gap-6 md:grid-cols-3">
          ${Card({
            children: `
              <div class="flex items-center gap-3">
                <div class="h-10 w-10 rounded-full bg-[#e76e1d]/10 flex items-center justify-center">
                  <span class="font-semibold text-[#e76e1d]">AG</span>
                </div>
                <div>
                  <p class="font-medium text-slate-900">Ana García</p>
                  <p class="text-sm text-slate-600">Compradora</p>
                </div>
              </div>
              <p class="mt-4 text-slate-600">
                "Gracias a AutoPoint encontré el auto perfecto. La IA me ayudó a comparar precios y el análisis de fotos me dio confianza en la compra."
              </p>
            `,
          })}
          ${Card({
            children: `
              <div class="flex items-center gap-3">
                <div class="h-10 w-10 rounded-full bg-[#e76e1d]/10 flex items-center justify-center">
                  <span class="font-semibold text-[#e76e1d]">MR</span>
                </div>
                <div>
                  <p class="font-medium text-slate-900">Miguel Rodríguez</p>
                  <p class="text-sm text-slate-600">Vendedor</p>
                </div>
              </div>
              <p class="mt-4 text-slate-600">
                "Publicar mi auto fue muy fácil. La plataforma me sugirió un precio competitivo basado en el análisis IA y vendí en una semana."
              </p>
            `,
          })}
          ${Card({
            children: `
              <div class="flex items-center gap-3">
                <div class="h-10 w-10 rounded-full bg-[#e76e1d]/10 flex items-center justify-center">
                  <span class="font-semibold text-[#e76e1d]">CL</span>
                </div>
                <div>
                  <p class="font-medium text-slate-900">Carla López</p>
                  <p class="text-sm text-slate-600">Compradora</p>
                </div>
              </div>
              <p class="mt-4 text-slate-600">
                "La comparación de autos es increíble. Pude ver todas las opciones en un solo lugar y la IA me ayudó a detectar posibles problemas."
              </p>
            `,
          })}
        </div>
      </section>

      <section class="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div class="text-center">
          <h2 class="text-3xl font-bold text-slate-900">Características avanzadas</h2>
          <p class="mt-4 text-lg text-slate-600">Herramientas que hacen la diferencia</p>
        </div>

        <div class="mt-12 grid gap-8 lg:grid-cols-2">
          <div class="rounded-3xl border border-slate-200 bg-white/80 p-8">
            <div class="flex items-center gap-4">
              <div class="rounded-2xl bg-[#e76e1d]/10 p-3">
                <svg class="h-6 w-6 text-[#e76e1d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-slate-900">Análisis IA instantáneo</h3>
            </div>
            <p class="mt-4 text-slate-600">
              Subí fotos de tu auto y obtené un análisis detallado del estado del vehículo, estimación de precio y recomendaciones para la publicación.
            </p>
          </div>

          <div class="rounded-3xl border border-slate-200 bg-white/80 p-8">
            <div class="flex items-center gap-4">
              <div class="rounded-2xl bg-[#e76e1d]/10 p-3">
                <svg class="h-6 w-6 text-[#e76e1d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-slate-900">Comparador inteligente</h3>
            </div>
            <p class="mt-4 text-slate-600">
              Compará múltiples vehículos simultáneamente con filtros avanzados y visualizaciones que te ayudan a tomar la mejor decisión.
            </p>
          </div>

          <div class="rounded-3xl border border-slate-200 bg-white/80 p-8">
            <div class="flex items-center gap-4">
              <div class="rounded-2xl bg-[#e76e1d]/10 p-3">
                <svg class="h-6 w-6 text-[#e76e1d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-slate-900">Plataforma segura</h3>
            </div>
            <p class="mt-4 text-slate-600">
              Transacciones protegidas con verificación de usuarios y soporte dedicado para resolver cualquier inconveniente.
            </p>
          </div>

          <div class="rounded-3xl border border-slate-200 bg-white/80 p-8">
            <div class="flex items-center gap-4">
              <div class="rounded-2xl bg-[#e76e1d]/10 p-3">
                <svg class="h-6 w-6 text-[#e76e1d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-slate-900">Notificaciones inteligentes</h3>
            </div>
            <p class="mt-4 text-slate-600">
              Recibí alertas personalizadas sobre nuevos autos que coincidan con tus criterios de búsqueda.
            </p>
          </div>
        </div>
      </section>

      <footer class="border-t border-slate-200 bg-slate-50">
        <div class="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          <div class="grid gap-8 lg:grid-cols-4">
            <div>
              <p class="text-xs uppercase tracking-[0.35em] text-[#e76e1d]">AutoPoint</p>
              <h3 class="mt-2 text-lg font-semibold text-slate-900">Marketplace de autos usados</h3>
              <p class="mt-4 text-sm text-slate-600">
                La plataforma que conecta compradores y vendedores con la ayuda de inteligencia artificial.
              </p>
            </div>

            <div>
              <h4 class="font-semibold text-slate-900">Enlaces</h4>
              <ul class="mt-4 space-y-2 text-sm text-slate-600">
                <li><a href="#" id="footer-about" class="hover:text-[#e76e1d] transition-colors">Sobre nosotros</a></li>
                <li><a href="#" class="hover:text-[#e76e1d] transition-colors">Cómo funciona</a></li>
                <li><a href="#" class="hover:text-[#e76e1d] transition-colors">Preguntas frecuentes</a></li>
                <li><a href="#" class="hover:text-[#e76e1d] transition-colors">Términos y condiciones</a></li>
              </ul>
            </div>

            <div>
              <h4 class="font-semibold text-slate-900">Contacto</h4>
              <ul class="mt-4 space-y-2 text-sm text-slate-600">
                <li>Email: <a href="mailto:info@autopoint.com" class="hover:text-[#e76e1d] transition-colors">info@autopoint.com</a></li>
                <li>Teléfono: +54 351 123-4567</li>
                <li>Dirección: Córdoba, Argentina</li>
              </ul>
            </div>

            <div>
              <h4 class="font-semibold text-slate-900">Síguenos</h4>
              <div class="mt-4 flex gap-4">
                <a href="#" class="text-slate-400 hover:text-[#e76e1d] transition-colors">
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" class="text-slate-400 hover:text-[#e76e1d] transition-colors">
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div class="mt-8 border-t border-slate-200 pt-8 text-center text-sm text-slate-600">
            <p>&copy; 2026 AutoPoint. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
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

    document.querySelector("#nav-about")?.addEventListener("click", (e) => {
        e.preventDefault();
        navigateTo(ROUTES.about);
    });

    document.querySelector("#nav-comparator")?.addEventListener("click", (e) => {
        e.preventDefault();
        navigateTo(ROUTES.comparator);
    });

    document.querySelector("#footer-about")?.addEventListener("click", (e) => {
        e.preventDefault();
        navigateTo(ROUTES.about);
    });

    if (isLoggedIn) {
        document.querySelector("#go-home")?.addEventListener("click", () => {
            navigateTo(ROUTES.home);
        });

        document.querySelector("#hero-home")?.addEventListener("click", () => {
            navigateTo(ROUTES.home);
        });
    } else {
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
}