import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ErrorMessage } from "../components/ErrorMessage";
import { Input } from "../components/Input";
import { Select } from "../components/Select";
import { ThemeToggle } from "../components/ThemeToggle";
import { register } from "../services/auth";
import type { UserRole } from "../types/auth";
import { navigateTo, ROUTES } from "../utils/router";

export function renderRegisterPage(container: HTMLElement): void {
  container.innerHTML = `
    <main class="min-h-screen app-bg px-5 py-10 text-slate-900 sm:px-8 pt-20">
      <div class="fixed right-5 top-5 z-50">
        ${ThemeToggle()}
      </div>
      <div class="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl items-center justify-center">
        <div class="w-full max-w-xl">
          ${Card({
            className: "p-8 sm:p-10",
            children: `
              <div class="mb-8">
                <p class="text-sm uppercase tracking-[0.3em] text-[#e76e1d]">AutoPoint</p>
                <h1 class="mt-4 text-4xl font-bold tracking-tight text-slate-900">Crear cuenta</h1>
                <p class="mt-4 text-sm leading-7 text-slate-600">
                  Registrate como buyer para buscar y comparar autos, o como seller para publicarlos.
                </p>
              </div>

              <form id="register-form" class="space-y-5">
                ${Input({
                  id: "name",
                  label: "Nombre",
                  placeholder: "Tu nombre completo",
                })}

                ${Input({
                  id: "email",
                  label: "Correo electrónico",
                  type: "email",
                  placeholder: "tuemail@ejemplo.com",
                })}

                ${Input({
                  id: "password",
                  label: "Contraseña",
                  type: "password",
                  placeholder: "Elegí una contraseña",
                })}

                ${Select({
                  id: "role",
                  label: "Tipo de cuenta",
                  options: [
                    { value: "buyer", label: "Buyer" },
                    { value: "seller", label: "Seller" },
                  ],
                })}

                ${ErrorMessage({
                  id: "register-error",
                  hidden: true,
                  message: "",
                })}

                ${Button({
                  id: "register-submit",
                  text: "Crear cuenta",
                  type: "submit",
                  variant: "primary",
                  fullWidth: true,
                })}
              </form>

              <div class="mt-6 text-center text-sm text-slate-600">
                ¿Ya tenés cuenta?
                <button id="go-login" class="ml-1 font-medium text-[#e76e1d] hover:text-[#e76e1d]">
                  Iniciar sesión
                </button>
              </div>
            `,
          })}
        </div>
      </div>
    </main>
  `;

  const form = document.querySelector<HTMLFormElement>("#register-form");
  const nameInput = document.querySelector<HTMLInputElement>("#name");
  const emailInput = document.querySelector<HTMLInputElement>("#email");
  const passwordInput = document.querySelector<HTMLInputElement>("#password");
  const roleInput = document.querySelector<HTMLSelectElement>("#role");
  const errorBox = document.querySelector<HTMLDivElement>("#register-error");
  const errorText = errorBox?.querySelector("p");

  if (
    !form ||
    !nameInput ||
    !emailInput ||
    !passwordInput ||
    !roleInput ||
    !errorBox ||
    !errorText
  ) {
    return;
  }

  document.querySelector("#go-login")?.addEventListener("click", () => {
    navigateTo(ROUTES.login);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const result = register(
      nameInput.value,
      emailInput.value,
      passwordInput.value,
      roleInput.value as UserRole
    );

    if (!result.ok) {
      errorText.textContent = result.message;
      errorBox.classList.remove("hidden");
      return;
    }

    errorBox.classList.add("hidden");
    navigateTo(ROUTES.home);
  });
}
