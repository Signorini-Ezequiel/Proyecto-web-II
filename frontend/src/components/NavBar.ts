import { Button } from "./Button";
import { isAuthenticated, getSessionUser } from "../services/auth";

interface NavBarOptions {
  showAbout?: boolean;
  isFavoritesPage?: boolean;
  isLandingPage?: boolean;
}

export function NavBar(options: NavBarOptions = {}): string {
  const { showAbout = true, isFavoritesPage = false, isLandingPage = false } = options;
  const isLoggedIn = isAuthenticated();
  const user = isLoggedIn ? getSessionUser() : null;

  return `
    <header class="sticky top-0 z-20 border-b border-slate-200 app-bg/90 backdrop-blur">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <a href="#" id="navbar-brand" class="no-underline">
          <p class="text-xs uppercase tracking-[0.35em] text-[#e76e1d]">AutoPoint</p>
          <h1 class="mt-1 text-lg font-semibold text-slate-900">Marketplace de autos usados</h1>
        </a>

        <nav class="flex items-center gap-3">
          ${
            showAbout
              ? `<a href="#" id="nav-about" class="text-sm text-slate-600 hover:text-[#e76e1d] transition-colors">Sobre nosotros</a>`
              : ""
          }
          <a href="#" id="nav-home-link" class="text-sm text-slate-600 hover:text-[#e76e1d] transition-colors">Buscar</a>
          <a href="#" id="nav-favorites" class="text-sm text-slate-600 hover:text-[#e76e1d] transition-colors ${isFavoritesPage ? 'text-[#e76e1d] font-medium' : ''}">Guardados</a>
          ${
            isLoggedIn
              ? `
                <div class="hidden rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-600 md:block">
                  ${user?.name} · ${user?.role === "seller" ? "Vendedor" : "Comprador"}
                </div>
                ${
                  isLandingPage
                    ? Button({ id: "nav-home", text: "Ir al panel", variant: "primary" })
                    : Button({ id: "nav-logout", text: "Cerrar sesión", variant: "ghost" })
                }
              `
              : `
                ${Button({ id: "nav-login", text: "Iniciar sesión", variant: "ghost" })}
                ${Button({ id: "nav-register", text: "Crear cuenta", variant: "primary" })}
              `
          }
        </nav>
      </div>
    </header>
  `;
}
