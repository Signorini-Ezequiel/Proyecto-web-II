export const ROUTES = {
  landing: "/",
  login: "/login",
  register: "/register",
  home: "/home",
} as const;

export function navigateTo(route: string): void {
  window.history.pushState({}, "", route);
  window.dispatchEvent(new Event("popstate"));
}