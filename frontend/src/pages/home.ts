import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { StatCard } from "../components/StatCard";
import { getSessionUser, logout } from "../services/auth";
import { navigateTo, ROUTES } from "../utils/router";

export function renderHomePage(container: HTMLElement): void {
  const user = getSessionUser();

  if (!user) {
    navigateTo(ROUTES.login);
    return;
  }

  const isSeller = user.role === "seller";

  container.innerHTML = `
    <main class="min-h-screen bg-slate-950 text-slate-100">
      <header class="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div class="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div>
            <p class="text-xs uppercase tracking-[0.3em] text-sky-400">AutoPoint</p>
            <h1 class="mt-1 text-xl font-semibold text-white">
              ${isSeller ? "Panel del seller" : "Panel del buyer"}
            </h1>
          </div>

          <div class="flex items-center gap-3">
            <div class="hidden rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-300 md:block">
              ${user.name} · ${isSeller ? "Seller" : "Buyer"}
            </div>
            ${Button({
              id: "logout-button",
              text: "Cerrar sesión",
              variant: "secondary",
            })}
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <section class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          ${Card({
            children: `
              <p class="text-sm uppercase tracking-[0.25em] text-sky-400">
                ${isSeller ? "Gestión comercial" : "Exploración y comparación"}
              </p>
              <h2 class="mt-3 text-3xl font-bold tracking-tight text-white">
                Bienvenido, ${user.name}
              </h2>
              <p class="mt-4 text-sm leading-7 text-slate-300">
                ${
                  isSeller
                    ? "Desde acá vas a poder administrar publicaciones, consultas recibidas, métricas y estado de tus vehículos."
                    : "Desde acá vas a poder explorar vehículos, comparar opciones, guardar favoritos y consultar análisis orientativos."
                }
              </p>

              <div class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                ${
                  isSeller
                    ? `
                      ${StatCard({ title: "Publicaciones activas", value: "12", subtitle: "3 destacadas" })}
                      ${StatCard({ title: "Consultas recibidas", value: "34", subtitle: "7 sin responder" })}
                      ${StatCard({ title: "Vehículos reservados", value: "4", subtitle: "1 con entrega próxima" })}
                      ${StatCard({ title: "Precio estimado IA", value: "18 análisis", subtitle: "últimos 30 días" })}
                    `
                    : `
                      ${StatCard({ title: "Autos vistos", value: "24", subtitle: "últimos 7 días" })}
                      ${StatCard({ title: "Favoritos", value: "8", subtitle: "3 con baja de precio" })}
                      ${StatCard({ title: "Comparaciones", value: "5", subtitle: "2 activas" })}
                      ${StatCard({ title: "Análisis IA consultados", value: "11", subtitle: "referencias guardadas" })}
                    `
                }
              </div>
            `,
          })}

          ${Card({
            children: `
              <p class="text-sm uppercase tracking-[0.25em] text-sky-400">Usuario actual</p>
              <div class="mt-5 space-y-4">
                <div class="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Nombre</p>
                  <p class="mt-2 text-base font-medium text-white">${user.name}</p>
                </div>
                <div class="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Correo</p>
                  <p class="mt-2 text-base font-medium text-white">${user.email}</p>
                </div>
                <div class="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Rol</p>
                  <p class="mt-2 text-base font-medium text-white">${isSeller ? "Seller" : "Buyer"}</p>
                </div>
              </div>
            `,
          })}
        </section>

        <section class="mt-6 grid gap-6 lg:grid-cols-3">
          ${
            isSeller
              ? `
                ${Card({
                  children: `
                    <p class="text-lg font-semibold text-white">Tus publicaciones</p>
                    <div class="mt-5 space-y-3">
                      <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p class="font-medium text-slate-100">Toyota Corolla 2020</p>
                        <p class="mt-2 text-sm text-slate-400">Publicado · US$ 19.800</p>
                      </div>
                      <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p class="font-medium text-slate-100">Peugeot 208 2022</p>
                        <p class="mt-2 text-sm text-slate-400">Con 3 consultas activas</p>
                      </div>
                    </div>
                  `,
                })}
                ${Card({
                  children: `
                    <p class="text-lg font-semibold text-white">Actividad reciente</p>
                    <div class="mt-5 space-y-4">
                      <div class="border-l-2 border-sky-500 pl-4">
                        <p class="font-medium text-white">Nueva consulta recibida</p>
                        <p class="mt-1 text-sm text-slate-400">Volkswagen Amarok 2021</p>
                      </div>
                      <div class="border-l-2 border-emerald-500 pl-4">
                        <p class="font-medium text-white">Análisis IA generado</p>
                        <p class="mt-1 text-sm text-slate-400">Rango sugerido: US$ 25.000 - 27.000</p>
                      </div>
                    </div>
                  `,
                })}
                ${Card({
                  children: `
                    <p class="text-lg font-semibold text-white">Próximo paso</p>
                    <p class="mt-3 text-sm leading-6 text-slate-400">
                      Después podemos sumar alta de publicación, carga de fotos y módulo de análisis IA.
                    </p>
                  `,
                })}
              `
              : `
                ${Card({
                  children: `
                    <p class="text-lg font-semibold text-white">Favoritos</p>
                    <div class="mt-5 space-y-3">
                      <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p class="font-medium text-slate-100">Toyota Corolla Cross 2022</p>
                        <p class="mt-2 text-sm text-slate-400">US$ 27.800 · guardado hace 2 días</p>
                      </div>
                      <div class="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p class="font-medium text-slate-100">Peugeot 208 Allure 2023</p>
                        <p class="mt-2 text-sm text-slate-400">US$ 20.900 · comparado 3 veces</p>
                      </div>
                    </div>
                  `,
                })}
                ${Card({
                  children: `
                    <p class="text-lg font-semibold text-white">Comparaciones recientes</p>
                    <div class="mt-5 space-y-4">
                      <div class="border-l-2 border-sky-500 pl-4">
                        <p class="font-medium text-white">Corolla vs Civic</p>
                        <p class="mt-1 text-sm text-slate-400">Precio, kilometraje y caja comparados.</p>
                      </div>
                      <div class="border-l-2 border-emerald-500 pl-4">
                        <p class="font-medium text-white">208 vs Yaris</p>
                        <p class="mt-1 text-sm text-slate-400">Equipamiento y rango estimado revisados.</p>
                      </div>
                    </div>
                  `,
                })}
                ${Card({
                  children: `
                    <p class="text-lg font-semibold text-white">Próximo paso</p>
                    <p class="mt-3 text-sm leading-6 text-slate-400">
                      Después podemos sumar listado real de autos, comparador y detalle de vehículo.
                    </p>
                  `,
                })}
              `
          }
        </section>
      </div>
    </main>
  `;

  document.querySelector("#logout-button")?.addEventListener("click", () => {
    logout();
    navigateTo(ROUTES.login);
  });
}