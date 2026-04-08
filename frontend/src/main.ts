import "./style.css";
import { renderHomePage } from "./pages/home";
import { renderLandingPage } from "./pages/landing";
import { renderLoginPage } from "./pages/login";
import { renderRegisterPage } from "./pages/register";
import { renderAboutPage } from "./pages/about";
import { renderCarDetailPage } from "./pages/car-detail";
import { renderFavoritesPage } from "./pages/favorites";
import { isAuthenticated } from "./services/auth";
import { ROUTES, navigateTo } from "./utils/router";

const app = document.querySelector<HTMLDivElement>("#app")!;

function renderRoute(): void {
  const currentPath = window.location.pathname || "/";

  switch (currentPath) {
    case ROUTES.landing:
      renderLandingPage(app);
      break;

    case ROUTES.login:
      if (isAuthenticated()) {
        navigateTo(ROUTES.home);
        return;
      }
      renderLoginPage(app);
      break;

    case ROUTES.register:
      if (isAuthenticated()) {
        navigateTo(ROUTES.home);
        return;
      }
      renderRegisterPage(app);
      break;

    case ROUTES.home:
      if (!isAuthenticated()) {
        navigateTo(ROUTES.login);
        return;
      }
      renderHomePage(app);
      break;

    case ROUTES.about:
      renderAboutPage(app);
      break;

    case ROUTES.carDetail:
      renderCarDetailPage(app);
      break;

    case ROUTES.favorites:
      renderFavoritesPage(app);
      break;

    default:
      navigateTo(ROUTES.landing);
  }
}

window.addEventListener("popstate", renderRoute);
window.addEventListener("load", renderRoute);