import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ErrorMessage } from "../components/ErrorMessage";
import { Input } from "../components/Input";
import { Select } from "../components/Select";
import { ThemeToggle } from "../components/ThemeToggle";
import { getPasswordRequirements, register } from "../services/auth";
import type { UserRole } from "../types/auth";
import { Icons } from "../utils/icons";
import { navigateTo, ROUTES } from "../utils/router";

export function renderRegisterPage(container: HTMLElement): void {
  container.innerHTML = `
    <main class="min-h-screen app-bg px-5 py-10 pt-20 text-slate-900 sm:px-8">
      <div class="fixed right-5 top-5 z-50">
        ${ThemeToggle()}
      </div>
      <div class="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl items-center justify-center">
        <div class="w-full max-w-xl">
          <div class="mb-6">
            <button id="back-btn" class="flex items-center gap-2 font-medium text-[#e76e1d] transition-colors hover:text-[#d45a0a]">
              ${Icons.chevronLeft(5)}
              Volver al inicio
            </button>
          </div>
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
                  label: "Correo electronico",
                  type: "email",
                  placeholder: "tuemail@ejemplo.com",
                })}

                ${Input({
                  id: "password",
                  label: "Contrasena",
                  type: "password",
                  placeholder: "Elige una contrasena",
                  hint: getPasswordRequirements(),
                })}

                ${Select({
                  id: "role",
                  label: "Tipo de cuenta",
                  options: [
                    { value: "buyer", label: "Buyer" },
                    { value: "seller", label: "Seller" },
                  ],
                })}

                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <label for="avatar" class="text-sm font-medium text-slate-700">Foto de perfil</label>
                    <span class="text-xs text-slate-400">Opcional</span>
                  </div>
                  <div class="flex items-center gap-4 rounded-3xl border border-dashed border-[#e76e1d]/30 bg-surface p-4">
                    <div id="avatar-preview" class="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#fff1e6] text-xl font-bold text-[#e76e1d]">
                      ?
                    </div>
                    <div class="flex-1">
                      <input id="avatar" type="file" accept="image/*" class="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-[#fff1e6] file:px-4 file:py-2 file:font-semibold file:text-[#e76e1d] hover:file:bg-[#ffe6d1]" />
                      <p class="mt-2 text-xs leading-5 text-slate-400">
                        Se guarda una sola foto por cuenta y podras cambiarla despues desde tu perfil.
                      </p>
                    </div>
                  </div>
                </div>

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
                Ya tenes cuenta?
                <button id="go-login" class="ml-1 font-medium text-[#e76e1d] hover:text-[#d45a0a]">
                  Iniciar sesion
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
  const avatarInput = document.querySelector<HTMLInputElement>("#avatar");
  const avatarPreview = document.querySelector<HTMLDivElement>("#avatar-preview");
  const errorBox = document.querySelector<HTMLDivElement>("#register-error");
  const errorText = errorBox?.querySelector("p");
  let avatarUrl: string | null = null;

  if (
    !form ||
    !nameInput ||
    !emailInput ||
    !passwordInput ||
    !roleInput ||
    !avatarInput ||
    !avatarPreview ||
    !errorBox ||
    !errorText
  ) {
    return;
  }

  const updateAvatarPreview = () => {
    if (avatarUrl) {
      avatarPreview.innerHTML = `<img src="${avatarUrl}" alt="Vista previa de foto de perfil" class="h-full w-full object-cover" />`;
      return;
    }

    avatarPreview.textContent = nameInput.value.trim().slice(0, 1).toUpperCase() || "?";
  };

  nameInput.addEventListener("input", updateAvatarPreview);

  avatarInput.addEventListener("change", () => {
    const file = avatarInput.files?.[0];

    if (!file) {
      avatarUrl = null;
      updateAvatarPreview();
      return;
    }

    if (!file.type.startsWith("image/")) {
      errorText.textContent = "Selecciona un archivo de imagen valido.";
      errorBox.classList.remove("hidden");
      avatarInput.value = "";
      avatarUrl = null;
      updateAvatarPreview();
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      avatarUrl = typeof reader.result === "string" ? reader.result : null;
      errorBox.classList.add("hidden");
      updateAvatarPreview();
    };
    reader.readAsDataURL(file);
  });

  updateAvatarPreview();

  document.querySelector("#back-btn")?.addEventListener("click", () => {
    navigateTo(ROUTES.landing);
  });

  document.querySelector("#go-login")?.addEventListener("click", () => {
    navigateTo(ROUTES.login);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const result = register(
      nameInput.value,
      emailInput.value,
      passwordInput.value,
      roleInput.value as UserRole,
      avatarUrl
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
