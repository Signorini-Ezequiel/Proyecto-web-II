import { Button } from "./Button";
import { isAuthenticated, getSessionUser } from "../services/auth";

declare global {
  interface Window {
    navigateTo: (path: string) => void;
    logout: () => void;
  }
}

interface NavBarOptions {
  showAbout?: boolean;
  isLandingPage?: boolean;
  currentPath?: string;
}

export function NavBar(options: NavBarOptions = {}): string {
  const { showAbout = false, isLandingPage = false, currentPath = window.location.pathname } = options;
  const isLoggedIn = isAuthenticated();
  const user = isLoggedIn ? getSessionUser() : null;

  // Helper para determinar si un link está activo
  const isActive = (path: string) => currentPath === path;
  const activeClass = "text-[#e76e1d] font-semibold";
  const inactiveClass = "text-slate-600 hover:text-[#e76e1d]";

  return `
    <header class="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 app-bg/90 backdrop-blur">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <a href="#" id="navbar-brand" class="no-underline">
          <p class="text-xs uppercase tracking-[0.35em] text-[#e76e1d]">AutoPoint</p>
          <h1 class="mt-1 text-lg font-semibold text-slate-900">Marketplace de autos usados</h1>
        </a>

        <nav class="flex items-center gap-3">
          ${
            showAbout
              ? `<a href="#" id="nav-about" class="text-sm transition-colors ${isActive("/about") ? activeClass : inactiveClass}">Sobre nosotros</a>`
              : ""
          }
          <a href="#" id="nav-home-link" class="text-sm transition-colors ${isActive("/home") ? activeClass : inactiveClass}">Buscar</a>
          <a href="#" id="nav-comparator" class="text-sm transition-colors ${isActive("/comparator") ? activeClass : inactiveClass}">Comparador</a>
          <a href="#" id="nav-favorites" class="text-sm transition-colors ${isActive("/favorites") ? activeClass : inactiveClass}">Guardados</a>
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

// Lógica de listeners para navegación SPA y logout
export function NavBarListeners() {
  const navigateTo = window.navigateTo;
  const logout = window.logout;
  const ROUTES = {
    landing: "/",
    login: "/login",
    register: "/register",
    home: "/home",
    about: "/about",
    carDetail: "/car-detail",
    favorites: "/favorites",
    comparator: "/comparator"
  };
  document.querySelector("#navbar-brand")?.addEventListener("click", (e) => {
    e.preventDefault();
    navigateTo ? navigateTo(ROUTES.landing) : window.location.href = ROUTES.landing;
  });
  document.querySelector("#nav-about")?.addEventListener("click", (e) => {
    e.preventDefault();
    navigateTo ? navigateTo(ROUTES.about) : window.location.href = ROUTES.about;
  });
  document.querySelector("#nav-home-link")?.addEventListener("click", (e) => {
    e.preventDefault();
    navigateTo ? navigateTo(ROUTES.home) : window.location.href = ROUTES.home;
  });
  document.querySelector("#nav-comparator")?.addEventListener("click", (e) => {
    e.preventDefault();
    navigateTo ? navigateTo(ROUTES.comparator) : window.location.href = ROUTES.comparator;
  });
  document.querySelector("#nav-favorites")?.addEventListener("click", (e) => {
    e.preventDefault();
    navigateTo ? navigateTo(ROUTES.favorites) : window.location.href = ROUTES.favorites;
  });
  document.querySelector("#nav-logout")?.addEventListener("click", () => {
    logout && logout();
    navigateTo ? navigateTo(ROUTES.landing) : window.location.href = ROUTES.landing;
  });
  document.querySelector("#nav-login")?.addEventListener("click", () => {
    window.open(ROUTES.login, "_blank");
  });
  document.querySelector("#nav-register")?.addEventListener("click", () => {
    window.open(ROUTES.register, "_blank");
  });
}
