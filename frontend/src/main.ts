import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('No se encontró el elemento #app')
}

app.innerHTML = `
  <main class="min-h-screen p-6">
    <div class="mx-auto max-w-6xl">
      <header class="mb-8 rounded-2xl bg-white p-4 shadow">
        <h1 class="text-2xl font-bold text-slate-800">Mock del proyecto</h1>
        <p class="mt-2 text-sm text-slate-600">
          Base inicial con TypeScript + Tailwind
        </p>
      </header>

      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article class="rounded-2xl bg-white p-4 shadow">
          <h2 class="text-lg font-semibold text-slate-800">Home</h2>
          <p class="mt-2 text-sm text-slate-600">Listado principal o landing.</p>
        </article>

        <article class="rounded-2xl bg-white p-4 shadow">
          <h2 class="text-lg font-semibold text-slate-800">Login</h2>
          <p class="mt-2 text-sm text-slate-600">Pantalla de inicio de sesión.</p>
        </article>

        <article class="rounded-2xl bg-white p-4 shadow">
          <h2 class="text-lg font-semibold text-slate-800">Publicar</h2>
          <p class="mt-2 text-sm text-slate-600">Formulario de publicación.</p>
        </article>
      </section>
    </main>
`
