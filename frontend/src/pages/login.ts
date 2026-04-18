import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ErrorMessage } from "../components/ErrorMessage";
import { Input } from "../components/Input";
import { ThemeToggle } from "../components/ThemeToggle";
import { Icons } from "../utils/icons";
import { login } from "../services/auth";
import { navigateTo, ROUTES } from "../utils/router";

export function renderLoginPage(container: HTMLElement): void {
  container.innerHTML = `
    <main class="min-h-screen app-bg px-5 py-10 text-slate-900 sm:px-8 pt-20">
      <div class="fixed right-5 top-5 z-50">
        ${ThemeToggle()}
      </div>
      <div class="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl items-center justify-center">
        <div class="w-full max-w-xl">
          <div class="mb-6">
            <button id="back-btn" class="flex items-center gap-2 text-[#e76e1d] transition-colors font-medium hover:text-[#d45a0a]">
              ${Icons.chevronLeft(5)}
              Volver al inicio
            </button>
          </div>
          ${Card({
            className: "p-8 sm:p-10",
            children: `
              <div class="mb-8">
                <p class="text-sm uppercase tracking-[0.3em] text-[#e76e1d]">AutoPoint</p>
                <h1 class="mt-4 text-5xl font-bold tracking-tight text-slate-900">Bienvenido de nuevo</h1>
              </div>

              <form id="login-form" class="space-y-5">
                ${Input({
                  id: "email",
                  label: "Correo electrónico",
                  type: "email",
                  placeholder: "buyer@autopoint.com",
                  hint: "Usá alguna de las cuentas mock indicadas abajo.",
                })}

                ${Input({
                  id: "password",
                  label: "Contraseña",
                  type: "password",
                  placeholder: "1234",
                })}

                ${ErrorMessage({
                  id: "login-error",
                  hidden: true,
                  message: "",
                })}

                ${Button({
                  id: "login-submit",
                  text: "Iniciar sesión",
                  type: "submit",
                  variant: "primary",
                  fullWidth: true,
                })}
              </form>

              <div class="mt-6 grid gap-3 sm:grid-cols-2">
                ${Button({
                  id: "fill-buyer",
                  text: "Usar buyer demo",
                  variant: "secondary",
                  fullWidth: true,
                })}
                ${Button({
                  id: "fill-seller",
                  text: "Usar seller demo",
                  variant: "secondary",
                  fullWidth: true,
                })}
              </div>

              <div class="mt-6 text-center text-sm text-slate-600">
                ¿Todavía no tenés cuenta?
                <button id="go-register" class="ml-1 font-medium text-[#e76e1d] hover:text-[#e76e1d]">
                  Crear cuenta
                </button>
              </div>
            `,
          })}
        </div>
      </div>
    </main>
  `;

  const form = document.querySelector<HTMLFormElement>("#login-form");
  const emailInput = document.querySelector<HTMLInputElement>("#email");
  const passwordInput = document.querySelector<HTMLInputElement>("#password");
  const errorBox = document.querySelector<HTMLDivElement>("#login-error");
  const errorText = errorBox?.querySelector("p");

  if (!form || !emailInput || !passwordInput || !errorBox || !errorText) {
    return;
  }

  document.querySelector("#back-btn")?.addEventListener("click", () => {
    navigateTo(ROUTES.landing);
  });

  document.querySelector("#fill-buyer")?.addEventListener("click", () => {
    emailInput.value = "buyer@autopoint.com";
    passwordInput.value = "1234";
    errorBox.classList.add("hidden");
  });

  document.querySelector("#fill-seller")?.addEventListener("click", () => {
    emailInput.value = "seller@autopoint.com";
    passwordInput.value = "1234";
    errorBox.classList.add("hidden");
  });

  document.querySelector("#go-register")?.addEventListener("click", () => {
    navigateTo(ROUTES.register);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const result = login(emailInput.value, passwordInput.value);

    if (!result.ok) {
      errorText.textContent = result.message;
      errorBox.classList.remove("hidden");
      return;
    }

    errorBox.classList.add("hidden");
    navigateTo(ROUTES.home);
  });
}
