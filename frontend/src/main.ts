import "./style.css" with { type: "css" };
import { renderHomePage } from "./pages/home";
import { renderLandingPage } from "./pages/landing";
import { renderLoginPage } from "./pages/login";
import { renderRegisterPage } from "./pages/register";
import { renderAboutPage } from "./pages/about";
import { renderCarDetailPage } from "./pages/car-detail";
import { renderFavoritesPage } from "./pages/favorites";
import { renderComparatorPage } from "./pages/comparator-page-v2";
import { renderPublishPage } from "./pages/publish-v2";
import { renderProfilePage } from "./pages/profile";
import { renderChangePasswordPage } from "./pages/change-password";
import { getSessionUser, isAuthenticated, logout, restoreSession } from "./services/auth";
import { ROUTES, navigateTo } from "./utils/router";
import { bindThemeToggleButtons, initializeTheme } from "./utils/theme";

const app = document.querySelector<HTMLDivElement>("#app")!;

type UserRole = "buyer" | "seller";

declare global {
  interface Window {
    navigateTo: typeof navigateTo;
    logout: typeof logout;
  }
}

type RouteAccess = {
  auth?: boolean;
  guestOnly?: boolean;
  roles?: UserRole[];
};

const ROUTE_ACCESS: Record<string, RouteAccess> = {
  [ROUTES.landing]: {},
  [ROUTES.login]: { guestOnly: true },
  [ROUTES.register]: { guestOnly: true },
  [ROUTES.home]: { auth: true },
  [ROUTES.about]: {},
  [ROUTES.carDetail]: {},
  [ROUTES.favorites]: { auth: true, roles: ["buyer"] },
  [ROUTES.comparator]: { auth: true, roles: ["buyer"] },
  [ROUTES.publish]: { auth: true, roles: ["seller"] },
  [ROUTES.editCar]: { auth: true, roles: ["seller"] },
  [ROUTES.profile]: { auth: true },
  [ROUTES.changePassword]: { auth: true },
};

let didValidateStoredSession = false;

initializeTheme();

function renderPageLoader(): void {
  app.innerHTML = `
    <div class="page-loader" role="status" aria-live="polite" aria-label="Cargando pagina">
      <div class="page-loader__spinner" aria-hidden="true"></div>
      <span class="sr-only">Cargando...</span>
    </div>
  `;
}

async function validateStoredSessionOnce(): Promise<void> {
  if (didValidateStoredSession) return;
  didValidateStoredSession = true;

  if (isAuthenticated()) {
    await restoreSession();
  }
}

function guardRoute(path: string): boolean {
  const access = ROUTE_ACCESS[path] ?? {};
  const user = getSessionUser();

  if (access.guestOnly && user) {
    navigateTo(ROUTES.home);
    return false;
  }

  if (access.auth && !user) {
    navigateTo(ROUTES.login);
    return false;
  }

  if (access.roles && user && !access.roles.includes(user.role)) {
    navigateTo(ROUTES.home);
    return false;
  }

  return true;
}

async function renderRoute(): Promise<void> {
  renderPageLoader();
  await validateStoredSessionOnce();

  const currentPath = window.location.pathname || "/";

  if (!guardRoute(currentPath)) {
    return;
  }

  switch (currentPath) {
    case ROUTES.landing:
      renderLandingPage(app);
      break;

    case ROUTES.login:
      renderLoginPage(app);
      break;

    case ROUTES.register:
      renderRegisterPage(app);
      break;

    case ROUTES.home:
      await renderHomePage(app);
      break;

    case ROUTES.about:
      renderAboutPage(app);
      break;

    case ROUTES.carDetail:
      await renderCarDetailPage(app);
      break;

    case ROUTES.favorites:
      await renderFavoritesPage(app);
      break;

    case ROUTES.comparator:
      await renderComparatorPage(app);
      break;

    case ROUTES.publish:
      await renderPublishPage(app);
      break;

    case ROUTES.profile:
      renderProfilePage(app);
      break;

    case ROUTES.changePassword:
      renderChangePasswordPage(app);
      break;

    case ROUTES.editCar:
      await renderPublishPage(app, true);
      break;

    default:
      navigateTo(ROUTES.landing);
  }

  initializeTheme();
  bindThemeToggleButtons();
}

window.addEventListener("popstate", () => {
  void renderRoute();
});

window.addEventListener("load", () => {
  void renderRoute();
});

window.addEventListener("auth:unauthorized", () => {
  const currentPath = window.location.pathname || "/";

  if (ROUTE_ACCESS[currentPath]?.auth) {
    navigateTo(ROUTES.login);
  }
});

window.navigateTo = navigateTo;
window.logout = logout;
