import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ErrorMessage } from "../components/ErrorMessage";
import { Input } from "../components/Input";
import { NavBar, NavBarListeners } from "../components/NavBar";
import {
  getSessionUser,
  updateProfile,
} from "../services/auth";
import { navigateTo, ROUTES } from "../utils/router";

export function renderProfilePage(container: HTMLElement): void {
  const user = getSessionUser();

  if (!user) {
    navigateTo(ROUTES.login);
    return;
  }

  let avatarUrl = user.avatarUrl;

  container.innerHTML = `
    <main class="min-h-screen app-bg pt-20 text-slate-900">
      ${NavBar({ currentPath: ROUTES.profile })}

      <div class="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <section class="grid gap-6 lg:grid-cols-[1fr]">
          ${Card({
            className: "p-8",
            children: `
              <div class="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p class="text-sm uppercase tracking-[0.3em] text-[#e76e1d]">Perfil</p>
                  <h1 class="mt-3 text-4xl font-bold tracking-tight text-slate-900">Gestionar cuenta</h1>
                  <p class="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                    Actualiza tu nombre de usuario, reemplaza tu foto de perfil y mantén segura tu cuenta.
                  </p>
                </div>
                <div class="rounded-3xl border border-[#e76e1d]/20 bg-surface px-5 py-4 text-sm text-white">
                  <p class="font-semibold text-white">${
                    user.role === "seller" ? "Perfil de vendedor" : "Perfil de comprador"
                  }</p>
                  <p class="mt-1 text-white">${user.email}</p>
                </div>
              </div>

              <form id="profile-form" class="space-y-6">
                <div class="flex flex-col gap-4 rounded-3xl border border-[#e76e1d]/20 bg-surface p-5 sm:flex-row sm:items-center">
                  <div id="profile-avatar-preview" class="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#e76e1d]/25 bg-[#fff1e6] text-2xl font-bold text-[#e76e1d]">
                    ${user.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div class="flex-1 space-y-3">
                    <div>
                      <p class="text-sm font-medium text-slate-700">Foto de perfil</p>
                      <p class="mt-1 text-xs leading-5 text-slate-500">
                        Sube una nueva imagen para reemplazar la actual.
                      </p>
                    </div>
                    <input id="profile-avatar" type="file" accept="image/*" class="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-[#fff1e6] file:px-4 file:py-2 file:font-semibold file:text-[#e76e1d] hover:file:bg-[#ffe6d1]" />
                    <button id="remove-avatar" type="button" class="text-sm font-medium text-slate-500 transition hover:text-[#e76e1d]">
                      Quitar foto actual
                    </button>
                  </div>
                </div>

                ${Input({
                  id: "profile-name",
                  label: "Nombre de usuario",
                  value: user.name,
                  placeholder: "Tu nombre visible",
                })}

                ${ErrorMessage({
                  id: "profile-error",
                  hidden: true,
                  message: "",
                })}

                <div class="flex justify-end gap-4">
                  ${Button({
                    id: "change-password-btn",
                    text: "Cambiar contraseña",
                    type: "button",
                    variant: "secondary",
                  })}
                  ${Button({
                    id: "profile-submit",
                    text: "Guardar perfil",
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

  const profileForm = document.querySelector<HTMLFormElement>("#profile-form");
  const profileNameInput = document.querySelector<HTMLInputElement>("#profile-name");
  const profileAvatarInput = document.querySelector<HTMLInputElement>("#profile-avatar");
  const profileAvatarPreview = document.querySelector<HTMLDivElement>("#profile-avatar-preview");
  const removeAvatarButton = document.querySelector<HTMLButtonElement>("#remove-avatar");
  const profileErrorBox = document.querySelector<HTMLDivElement>("#profile-error");
  const profileErrorText = profileErrorBox?.querySelector("p");
  const changePasswordBtn = document.querySelector<HTMLButtonElement>("#change-password-btn");

  if (
    !profileForm ||
    !profileNameInput ||
    !profileAvatarInput ||
    !profileAvatarPreview ||
    !removeAvatarButton ||
    !profileErrorBox ||
    !profileErrorText ||
    !changePasswordBtn
  ) {
    return;
  }

  const renderAvatarPreview = () => {
    if (avatarUrl) {
      profileAvatarPreview.innerHTML = `<img src="${avatarUrl}" alt="Foto de perfil" class="h-full w-full object-cover" />`;
      return;
    }

    profileAvatarPreview.textContent =
      profileNameInput.value.trim().slice(0, 1).toUpperCase() ||
      user.name.slice(0, 1).toUpperCase();
  };

  renderAvatarPreview();

  profileNameInput.addEventListener("input", renderAvatarPreview);

  profileAvatarInput.addEventListener("change", () => {
    const file = profileAvatarInput.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      profileErrorText.textContent = "Selecciona un archivo de imagen válido.";
      profileErrorBox.classList.remove("hidden");
      profileAvatarInput.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      avatarUrl = typeof reader.result === "string" ? reader.result : null;
      profileErrorBox.classList.add("hidden");
      renderAvatarPreview();
    };
    reader.readAsDataURL(file);
  });

  removeAvatarButton.addEventListener("click", () => {
    avatarUrl = null;
    profileAvatarInput.value = "";
    renderAvatarPreview();
  });

  profileForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const result = updateProfile(user.id, {
      name: profileNameInput.value,
      avatarUrl,
    });

    if (!result.ok) {
      profileErrorText.textContent = result.message;
      profileErrorBox.classList.remove("hidden");
      return;
    }

    profileErrorBox.classList.add("hidden");
    navigateTo(ROUTES.profile);
  });

  changePasswordBtn.addEventListener("click", () => {
    navigateTo(ROUTES.changePassword);
  });
}
