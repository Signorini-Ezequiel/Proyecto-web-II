import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ErrorMessage } from "../components/ErrorMessage";
import { Input } from "../components/Input";
import { NavBar, NavBarListeners } from "../components/NavBar";
import {
  getPasswordRequirements,
  getSessionUser,
  updatePassword,
} from "../services/auth";
import { navigateTo, ROUTES } from "../utils/router";

export function renderChangePasswordPage(container: HTMLElement): void {
  const user = getSessionUser();

  if (!user) {
    navigateTo(ROUTES.login);
    return;
  }

  container.innerHTML = `
    <main class="min-h-screen app-bg pt-20 text-slate-900">
      ${NavBar({ currentPath: ROUTES.changePassword })}

      <div class="mx-auto max-w-2xl px-5 py-8 sm:px-8">
        <section>
          ${Card({
            className: "p-8",
            children: `
              <div class="mb-8">
                <p class="text-sm uppercase tracking-[0.3em] text-[#e76e1d]">Seguridad</p>
                <h1 class="mt-3 text-4xl font-bold tracking-tight text-slate-900">Cambiar contraseña</h1>
                <p class="mt-3 text-sm leading-7 text-slate-600">${getPasswordRequirements()}</p>
              </div>

              <form id="password-form" class="space-y-6">
                ${Input({
                  id: "current-password",
                  label: "Contraseña actual",
                  type: "password",
                  placeholder: "Ingresa tu contraseña actual",
                })}

                ${Input({
                  id: "new-password",
                  label: "Nueva contraseña",
                  type: "password",
                  placeholder: "Elige una nueva contraseña",
                })}

                ${Input({
                  id: "confirm-password",
                  label: "Confirmar nueva contraseña",
                  type: "password",
                  placeholder: "Repite la nueva contraseña",
                })}

                <div class="rounded-2xl border border-slate-200 bg-surface px-4 py-3 text-sm text-slate-500">
                  Controles activos:
                  <span id="password-checks" class="mt-2 block leading-7">
                    Mínimo 6 caracteres, una letra, un número y confirmación igual.
                  </span>
                </div>

                ${ErrorMessage({
                  id: "password-error",
                  hidden: true,
                  message: "",
                })}

                <div class="flex justify-end gap-4">
                  ${Button({
                    id: "cancel-btn",
                    text: "Cancelar",
                    type: "button",
                    variant: "secondary",
                  })}
                  ${Button({
                    id: "password-submit",
                    text: "Actualizar contraseña",
                    type: "submit",
                    variant: "primary",
                  })}
                </div>
              </form>
            `,
          })}
        </section>
      </div>
    </main>
  `;

  NavBarListeners();

  const passwordForm = document.querySelector<HTMLFormElement>("#password-form");
  const currentPasswordInput = document.querySelector<HTMLInputElement>("#current-password");
  const newPasswordInput = document.querySelector<HTMLInputElement>("#new-password");
  const confirmPasswordInput = document.querySelector<HTMLInputElement>("#confirm-password");
  const passwordChecks = document.querySelector<HTMLSpanElement>("#password-checks");
  const passwordErrorBox = document.querySelector<HTMLDivElement>("#password-error");
  const passwordErrorText = passwordErrorBox?.querySelector("p");
  const cancelBtn = document.querySelector<HTMLButtonElement>("#cancel-btn");

  if (
    !passwordForm ||
    !currentPasswordInput ||
    !newPasswordInput ||
    !confirmPasswordInput ||
    !passwordChecks ||
    !passwordErrorBox ||
    !passwordErrorText ||
    !cancelBtn
  ) {
    return;
  }

  const renderPasswordChecks = () => {
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    const checks = [
      newPassword.length >= 6 ? "✅ Mínimo 6 caracteres" : "❌ Mínimo 6 caracteres",
      /[a-zA-Z]/.test(newPassword) ? "✅ Al menos una letra" : "❌ Al menos una letra",
      /\d/.test(newPassword) ? "✅ Al menos un número" : "❌ Al menos un número",
      newPassword === confirmPassword && newPassword ? "✅ Contraseñas coinciden" : "❌ Contraseñas coinciden",
    ];

    passwordChecks.innerHTML = checks.join("<br>");
  };

  newPasswordInput.addEventListener("input", renderPasswordChecks);
  confirmPasswordInput.addEventListener("input", renderPasswordChecks);

  cancelBtn.addEventListener("click", () => {
    navigateTo(ROUTES.profile);
  });

  passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const currentPassword = currentPasswordInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      passwordErrorText.textContent = "Todos los campos son obligatorios.";
      passwordErrorBox.classList.remove("hidden");
      return;
    }

    if (newPassword !== confirmPassword) {
      passwordErrorText.textContent = "Las nuevas contraseñas no coinciden.";
      passwordErrorBox.classList.remove("hidden");
      return;
    }

    if (newPassword.length < 6 || !/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      passwordErrorText.textContent = "La nueva contraseña no cumple con los requisitos.";
      passwordErrorBox.classList.remove("hidden");
      return;
    }

    try {
      await updatePassword(user.id, currentPassword, newPassword, confirmPassword);
      navigateTo(ROUTES.profile);
    } catch (error) {
      passwordErrorText.textContent = error instanceof Error ? error.message : "Error al actualizar la contraseña.";
      passwordErrorBox.classList.remove("hidden");
    }
  });
}