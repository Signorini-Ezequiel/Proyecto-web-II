import { Button } from "../components/Button";
import { isAuthenticated, getSessionUser } from "../services/auth";
import { navigateTo, ROUTES } from "../utils/router";

export function renderAboutPage(container: HTMLElement): void {
  const isLoggedIn = isAuthenticated();
  const user = isLoggedIn ? getSessionUser() : null;
  container.innerHTML = `
    <main class="min-h-screen app-bg text-slate-900">
      <header class="sticky top-0 z-20 border-b border-slate-200 app-bg/90 backdrop-blur">
        <div class="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div>
            <p class="text-xs uppercase tracking-[0.35em] text-[#e76e1d]">AutoPoint</p>
            <h1 class="mt-1 text-lg font-semibold text-slate-900">Marketplace de autos usados</h1>
          </div>

          <nav class="flex items-center gap-3">
            ${
              isLoggedIn
                ? `
                  <div class="hidden rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-600 md:block">
                    ${user?.name} · ${user?.role === "seller" ? "Vendedor" : "Comprador"}
                  </div>
                  ${Button({ id: "go-home", text: "Ir al panel", variant: "primary" })}
                `
                : `
                  ${Button({ id: "go-home", text: "Inicio", variant: "ghost" })}
                  ${Button({ id: "go-login", text: "Iniciar sesión", variant: "ghost" })}
                  ${Button({ id: "go-register", text: "Crear cuenta", variant: "primary" })}
                `
            }
          </nav>
        </div>
      </header>

      <section class="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div class="text-center">
          <h1 class="text-4xl font-bold text-slate-900">Sobre nosotros</h1>
          <p class="mt-4 text-lg text-slate-600">Conoce más sobre AutoPoint y nuestra misión</p>
        </div>

        <div class="mt-12 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 class="text-2xl font-semibold text-slate-900">Nuestra historia</h2>
            <p class="mt-4 text-slate-600 leading-7">
              AutoPoint nació en 2023 con la visión de revolucionar el mercado de autos usados en Argentina.
              Fundada por un equipo de apasionados por la tecnología y el automovilismo, nuestra plataforma
              combina la simplicidad de uso con la potencia de la inteligencia artificial para hacer que
              comprar y vender autos sea más confiable y eficiente que nunca.
            </p>
          </div>

          <div>
            <h2 class="text-2xl font-semibold text-slate-900">Nuestra misión</h2>
            <p class="mt-4 text-slate-600 leading-7">
              Democratizar el acceso a información confiable sobre vehículos usados, empoderando tanto a
              compradores como vendedores con herramientas innovadoras que promueven transacciones justas
              y transparentes. Creemos que la tecnología puede eliminar la incertidumbre del mercado de
              autos usados.
            </p>
          </div>
        </div>

        <div class="mt-12">
          <h2 class="text-2xl font-semibold text-slate-900 text-center">Nuestro equipo</h2>
          <div class="mt-8 grid gap-6 md:grid-cols-3">
            <div class="text-center">
              <div class="mx-auto h-24 w-24 rounded-full bg-[#e76e1d]/10 flex items-center justify-center">
                <span class="text-2xl font-bold text-[#e76e1d]">JS</span>
              </div>
              <h3 class="mt-4 font-semibold text-slate-900">Juan Silva</h3>
              <p class="text-sm text-slate-600">CEO & Fundador</p>
              <p class="mt-2 text-sm text-slate-500">Experto en tecnología y emprendimiento</p>
            </div>

            <div class="text-center">
              <div class="mx-auto h-24 w-24 rounded-full bg-[#e76e1d]/10 flex items-center justify-center">
                <span class="text-2xl font-bold text-[#e76e1d]">MR</span>
              </div>
              <h3 class="mt-4 font-semibold text-slate-900">María Rodríguez</h3>
              <p class="text-sm text-slate-600">CTO</p>
              <p class="mt-2 text-sm text-slate-500">Especialista en IA y machine learning</p>
            </div>

            <div class="text-center">
              <div class="mx-auto h-24 w-24 rounded-full bg-[#e76e1d]/10 flex items-center justify-center">
                <span class="text-2xl font-bold text-[#e76e1d]">CL</span>
              </div>
              <h3 class="mt-4 font-semibold text-slate-900">Carlos López</h3>
              <p class="text-sm text-slate-600">Head of Product</p>
              <p class="mt-2 text-sm text-slate-500">Experto en UX/UI y producto digital</p>
            </div>
          </div>
        </div>

        <div class="mt-12 text-center">
          <h2 class="text-2xl font-semibold text-slate-900">Únete a nosotros</h2>
          <p class="mt-4 text-slate-600">
            ¿Estás interesado en formar parte de nuestro equipo? Envíanos tu CV a
            <a href="mailto:careers@autopoint.com" class="text-[#e76e1d] hover:underline">careers@autopoint.com</a>
          </p>
        </div>
      </section>
    </main>
  `;

  document.querySelector("#go-home")?.addEventListener("click", () => {
    if (isLoggedIn) {
      navigateTo(ROUTES.home);
    } else {
      navigateTo(ROUTES.landing);
    }
  });

  if (!isLoggedIn) {
    document.querySelector("#go-login")?.addEventListener("click", () => {
      window.open("/login", "_blank");
    });

    document.querySelector("#go-register")?.addEventListener("click", () => {
      window.open("/register", "_blank");
    });
  }
}