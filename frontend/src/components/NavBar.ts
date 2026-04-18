import { Button } from "./Button";
import { ThemeToggle } from "./ThemeToggle";
import { getSessionUser, isAuthenticated } from "../services/auth";

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
  const {
    showAbout = false,
    isLandingPage = false,
    currentPath = window.location.pathname,
  } = options;
  const isLoggedIn = isAuthenticated();
  const user = isLoggedIn ? getSessionUser() : null;
  const isSeller = user?.role === "seller";

  const isActive = (path: string) => currentPath === path;
  const activeClass = "text-[#e76e1d] font-semibold is-active";
  const inactiveClass = "text-slate-600";
  const navUnderlineClass =
    "nav-underline-link inline-flex relative !transform-none pb-1 text-sm";
  const hamburgerButtonClass =
    "hamburger-button inline-flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-[14px] border border-[#e76e1d]/20 bg-white/80 p-0 text-[var(--text)] transition duration-200 hover:-translate-y-px hover:border-[#e76e1d]/50 hover:shadow-[0_10px_24px_rgba(231,110,29,0.14)]";
  const hamburgerLineClass =
    "block h-0.5 w-[18px] rounded-full bg-current transition duration-200";
  const mobilePanelClass =
    "mobile-nav-panel grid grid-rows-[0fr] overflow-hidden opacity-0 -translate-y-2 transition-[grid-template-rows,opacity,transform] duration-[240ms] ease-out lg:hidden";
  const mobileLinkClass =
    "rounded-[18px] border border-[#e76e1d]/15 bg-white/80 px-4 py-3 text-left text-[0.95rem] font-semibold text-[var(--text)] transition duration-200 hover:translate-x-[3px] hover:border-[#e76e1d]/50 hover:text-[var(--brand)]";
  const mobileLinkActiveClass =
    "translate-x-[3px] border-[#e76e1d]/50 text-[var(--brand)]";
  const mobileActionClass =
    "rounded-[18px] border border-[#e76e1d]/15 bg-white/80 px-4 py-3 text-left text-[0.95rem] font-semibold text-[var(--text)] transition duration-200 hover:translate-x-[3px] hover:border-[#e76e1d]/50 hover:text-[var(--brand)]";
  const mobilePrimaryActionClass =
    "rounded-[18px] border border-[var(--brand)] bg-[var(--brand)] px-4 py-3 text-center text-[0.95rem] font-semibold text-white transition duration-200 hover:translate-x-[3px]";
  const avatarMarkup = user?.avatarUrl
    ? `<img src="${user.avatarUrl}" alt="Foto de perfil de ${user.name}" class="h-10 w-10 rounded-full border border-[#e76e1d]/30 object-cover">`
    : `<div class="flex h-10 w-10 items-center justify-center rounded-full border border-[#e76e1d]/30 bg-[#fff1e6] text-sm font-bold text-[#e76e1d]">${
        user?.name.slice(0, 1).toUpperCase() ?? "U"
      }</div>`;

  return `
    <header class="fixed left-0 right-0 top-0 z-50 border-b border-slate-200 app-bg/90 backdrop-blur">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <a href="#" id="navbar-brand" class="no-underline">
          <p class="text-xs uppercase tracking-[0.35em] text-[#e76e1d]">AutoPoint</p>
          <h1 class="mt-1 text-lg font-semibold text-slate-900">Marketplace de autos usados</h1>
        </a>

        <nav class="hidden items-center gap-3 lg:flex">
          ${
            showAbout
              ? `<a href="#" id="nav-about" class="${navUnderlineClass} ${
                  isActive("/about") ? activeClass : inactiveClass
                }">Sobre nosotros</a>`
              : ""
          }
          <a href="#" id="nav-home-link" class="${navUnderlineClass} ${
            isActive("/home") ? activeClass : inactiveClass
          }">${isSeller ? "Mis publicaciones" : "Buscar"}</a>
          ${
            !isSeller
              ? `<a href="#" id="nav-comparator" class="${navUnderlineClass} ${
                  isActive("/comparator") ? activeClass : inactiveClass
                }">Comparador</a>`
              : ""
          }
          ${
            !isSeller
              ? `<a href="#" id="nav-favorites" class="${navUnderlineClass} ${
                  isActive("/favorites") ? activeClass : inactiveClass
                }">Guardados</a>`
              : ""
          }
          ${ThemeToggle({ showLabel: false })}
          ${
            isLoggedIn
              ? `
                <button id="nav-profile" type="button" class="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-left transition hover:border-[#e76e1d]/40 hover:bg-white md:inline-flex">
                  ${avatarMarkup}
                  <span class="leading-tight">
                    <span class="block text-sm font-semibold text-slate-900">${user?.name}</span>
                    <span class="block text-xs text-slate-500">${
                      user?.role === "seller" ? "Vendedor" : "Comprador"
                    }</span>
                  </span>
                </button>
                ${
                  isLandingPage
                    ? Button({
                        id: "nav-home",
                        text: "Ir al panel",
                        variant: "primary",
                      })
                    : Button({
                        id: "nav-logout",
                        text: "Cerrar sesion",
                        variant: "ghost",
                      })
                }
              `
              : `
                ${Button({ id: "nav-login", text: "Iniciar sesion", variant: "ghost" })}
                ${Button({ id: "nav-register", text: "Crear cuenta", variant: "primary" })}
              `
          }
        </nav>

        <div class="flex items-center gap-2 lg:hidden">
          ${ThemeToggle({ showLabel: false })}
          <button
            id="nav-menu-toggle"
            type="button"
            class="${hamburgerButtonClass}"
            aria-label="Abrir menu"
            aria-controls="nav-mobile-menu"
            aria-expanded="false"
            data-mobile-menu-toggle
          >
            <span class="${hamburgerLineClass}"></span>
            <span class="${hamburgerLineClass}"></span>
            <span class="${hamburgerLineClass}"></span>
          </button>
        </div>
      </div>

      <div id="nav-mobile-menu" class="${mobilePanelClass}">
        <div class="mx-auto grid min-h-0 max-w-7xl gap-3 px-5 pb-5 sm:px-8">
          ${
            showAbout
              ? `<button type="button" data-nav-route="/about" class="${mobileLinkClass} ${
                  isActive("/about") ? mobileLinkActiveClass : ""
                }">Sobre nosotros</button>`
              : ""
          }
          <button type="button" data-nav-route="/home" class="${mobileLinkClass} ${
            isActive("/home") ? mobileLinkActiveClass : ""
          }">${isSeller ? "Mis publicaciones" : "Buscar"}</button>
          ${
            !isSeller
              ? `<button type="button" data-nav-route="/comparator" class="${mobileLinkClass} ${
                  isActive("/comparator") ? mobileLinkActiveClass : ""
                }">Comparador</button>`
              : ""
          }
          ${
            !isSeller
              ? `<button type="button" data-nav-route="/favorites" class="${mobileLinkClass} ${
                  isActive("/favorites") ? mobileLinkActiveClass : ""
                }">Guardados</button>`
              : ""
          }
          ${
            isLoggedIn
              ? `
                <button type="button" data-nav-route="/profile" class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-left transition hover:border-[#e76e1d]/40 hover:bg-white">
                  ${avatarMarkup}
                  <span class="leading-tight">
                    <span class="block text-sm font-semibold text-slate-900">${user?.name}</span>
                    <span class="block text-xs text-slate-500">${
                      user?.role === "seller" ? "Vendedor" : "Comprador"
                    }</span>
                  </span>
                </button>
                ${
                  isLandingPage
                    ? `<button type="button" data-nav-route="/home" class="${mobilePrimaryActionClass}">Ir al panel</button>`
                    : `<button type="button" data-nav-logout class="${mobileActionClass}">Cerrar sesion</button>`
                }
              `
              : `
                <button type="button" data-nav-open="/login" class="${mobileActionClass}">Iniciar sesion</button>
                <button type="button" data-nav-open="/register" class="${mobilePrimaryActionClass}">Crear cuenta</button>
              `
          }
        </div>
      </div>
    </header>
  `;
}

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
    comparator: "/comparator",
    profile: "/profile",
  };

  const closeMobileMenu = () => {
    document
      .querySelectorAll<HTMLElement>(".mobile-nav-panel.is-open")
      .forEach((panel) => {
        panel.classList.remove("is-open");
      });

    document
      .querySelectorAll<HTMLButtonElement>("[data-mobile-menu-toggle].is-open")
      .forEach((button) => {
        button.classList.remove("is-open");
        button.setAttribute("aria-expanded", "false");
        button.setAttribute("aria-label", "Abrir menu");
      });
  };

  document
    .querySelectorAll<HTMLButtonElement>("[data-mobile-menu-toggle]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const menuId = button.getAttribute("aria-controls");
        const menu = menuId ? document.getElementById(menuId) : null;
        const isOpen = menu?.classList.toggle("is-open") ?? false;

        button.classList.toggle("is-open", isOpen);
        button.setAttribute("aria-expanded", String(isOpen));
        button.setAttribute("aria-label", isOpen ? "Cerrar menu" : "Abrir menu");
      });
    });

  document.querySelectorAll<HTMLButtonElement>("[data-nav-route]").forEach((button) => {
    button.addEventListener("click", () => {
      const route = button.dataset.navRoute;

      if (!route) return;
      closeMobileMenu();
      navigateTo ? navigateTo(route) : (window.location.href = route);
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-nav-open]").forEach((button) => {
    button.addEventListener("click", () => {
      const route = button.dataset.navOpen;

      if (!route) return;
      closeMobileMenu();
      window.open(route, "_blank");
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-nav-logout]").forEach((logoutButton) => {
    logoutButton.addEventListener("click", () => {
      closeMobileMenu();
      logout && logout();
      navigateTo ? navigateTo(ROUTES.landing) : (window.location.href = ROUTES.landing);
    });
  });

  document.querySelector("#navbar-brand")?.addEventListener("click", (event) => {
    event.preventDefault();
    closeMobileMenu();
    navigateTo ? navigateTo(ROUTES.landing) : (window.location.href = ROUTES.landing);
  });

  document.querySelector("#nav-about")?.addEventListener("click", (event) => {
    event.preventDefault();
    navigateTo ? navigateTo(ROUTES.about) : (window.location.href = ROUTES.about);
  });

  document.querySelector("#nav-home-link")?.addEventListener("click", (event) => {
    event.preventDefault();
    navigateTo ? navigateTo(ROUTES.home) : (window.location.href = ROUTES.home);
  });

  document.querySelector("#nav-comparator")?.addEventListener("click", (event) => {
    event.preventDefault();
    navigateTo
      ? navigateTo(ROUTES.comparator)
      : (window.location.href = ROUTES.comparator);
  });

  document.querySelector("#nav-favorites")?.addEventListener("click", (event) => {
    event.preventDefault();
    navigateTo ? navigateTo(ROUTES.favorites) : (window.location.href = ROUTES.favorites);
  });

  document.querySelector("#nav-profile")?.addEventListener("click", () => {
    navigateTo ? navigateTo(ROUTES.profile) : (window.location.href = ROUTES.profile);
  });

  document.querySelector("#nav-logout")?.addEventListener("click", () => {
    logout && logout();
    navigateTo ? navigateTo(ROUTES.landing) : (window.location.href = ROUTES.landing);
  });

  document.querySelector("#nav-login")?.addEventListener("click", () => {
    navigateTo(ROUTES.login);
  });

  document.querySelector("#nav-register")?.addEventListener("click", () => {
    navigateTo(ROUTES.register);
  });
}
