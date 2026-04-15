export const ROUTES = {
  landing: "/",
  login: "/login",
  register: "/register",
  home: "/home",
  about: "/about",
  carDetail: "/car-detail",
  favorites: "/favorites",
  comparator: "/comparator",
  publish: "/publish",
  editCar: "/edit-car",
} as const;

export function navigateTo(route: string): void {
  window.history.pushState({}, "", route);
  window.dispatchEvent(new Event("popstate"));
}