# Guia del frontend

Esta guia resume como esta organizado el frontend de AutoPoint y que patrones conviene seguir al extenderlo.

## Stack

- Vite como bundler y servidor de desarrollo.
- TypeScript para tipado.
- Tailwind CSS 4 para utilidades de estilo.
- CSS global propio en `src/style.css`.
- SPA sin framework: las paginas y componentes generan HTML como strings y luego conectan eventos del DOM.

## Punto de entrada

El archivo `frontend/src/main.ts` hace tres cosas centrales:

1. Importa estilos globales.
2. Inicializa el tema con `initializeTheme()`.
3. Renderiza la pagina segun `window.location.pathname`.

El router esta definido en `frontend/src/utils/router.ts`. No hay libreria de routing: `navigateTo(route)` usa `history.pushState()` y dispara un evento `popstate` para volver a ejecutar el render.

## Flujo de render

Cada pagina exporta una funcion `render...Page(container: HTMLElement)`.

Ejemplo conceptual:

```ts
export function renderExamplePage(container: HTMLElement): void {
  container.innerHTML = `
    <main>
      ...
    </main>
  `;

  // Despues de insertar HTML, registrar listeners.
  document.getElementById("example-button")?.addEventListener("click", () => {
    ...
  });
}
```

Como se reemplaza `container.innerHTML` en cada cambio de ruta, los listeners deben registrarse despues de cada render.

## Rutas y proteccion

Las rutas declaradas estan en `ROUTES`:

```ts
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
  profile: "/profile",
  changePassword: "/change-password",
} as const;
```

La proteccion se hace en `main.ts` consultando `isAuthenticated()`. Las rutas `/home`, `/publish`, `/edit-car`, `/profile` y `/change-password` redirigen a `/login` si no hay sesion. Login y registro redirigen a `/home` si el usuario ya esta autenticado.

## Roles

El modelo de usuario usa dos roles:

- `buyer`: comprador. Puede buscar autos, marcar favoritos, comparar y hacer preguntas.
- `seller`: vendedor. Puede ver sus publicaciones, crear autos, editarlos, eliminarlos y responder preguntas.

La barra de navegacion adapta links y etiquetas segun el rol actual.

## Paginas

- `landing.ts`: portada publica.
- `login.ts`: formulario de inicio de sesion y acceso a cuentas demo.
- `register.ts`: alta de usuario, rol y avatar opcional.
- `home.ts`: listado principal. Para compradores muestra buscador y filtros; para vendedores muestra sus publicaciones.
- `car-detail.ts`: detalle del auto seleccionado, galeria, opinion generada y preguntas.
- `favorites.ts`: listado de favoritos guardados.
- `comparator-page-v2.ts`: comparador activo importado por `main.ts`.
- `publish-v2.ts`: formulario activo para publicar y editar autos.
- `profile.ts`: edicion de perfil y avatar.
- `change-password.ts`: cambio de contraseña.
- `about.ts`: informacion institucional del proyecto.

Hay versiones anteriores como `publish.ts`, `comparator.ts` y `comparator-page.ts`; actualmente `main.ts` usa las variantes `publish-v2.ts` y `comparator-page-v2.ts`.

## Componentes

Los componentes de `src/components/` son funciones que devuelven markup:

- `NavBar`: navegacion principal, responsive y dependiente del rol.
- `Button`, `Input`, `Select`, `Card`, `StatCard`: piezas UI reutilizables.
- `ThemeToggle`: boton de cambio de tema.
- `Toast`: notificaciones de exito/error.
- `CarComparisonCard`, `ComparisonTable`, `RecommendationSummary`: piezas del comparador.
- `ErrorMessage`: mensajes de validacion.

Patron recomendado:

- Mantener los componentes sin estado interno persistente.
- Pasar datos por parametros.
- Registrar eventos desde la pagina que inserta el componente, salvo componentes muy especificos.

## Servicios

Los servicios encapsulan reglas de negocio y persistencia:

- `auth.ts`: usuarios mock, login, registro, perfil, contraseña, sesion.
- `published-cars.ts`: publicaciones creadas por vendedores y conversion a `Car`.
- `favorites.ts`: alta/baja de favoritos.
- `comparison.ts`: seleccion de autos para comparar, con limite de 4.
- `car-questions.ts`: preguntas de compradores y respuestas de vendedores.
- `cars.ts`: ejemplo simple legacy de autos; no es el origen principal de datos del marketplace.
- `api.ts`: helper generico `apiFetch`, preparado para futuras llamadas HTTP.

## Datos

El modelo principal de autos esta en `frontend/src/data/cars.ts`:

- `CarSpecs`: ficha tecnica.
- `Car`: entidad de vehiculo usada en listados, detalle y comparador.
- `CARS`: autos semilla.
- `filterCars()`: filtrado por marca, precio, combustible, transmision, ubicacion, año y busqueda textual.

Las marcas disponibles para formularios estan en `frontend/src/data/makes.ts`.

## Comparador

La seleccion se guarda en `autopoint_comparison` y esta limitada a 4 autos.

El scoring esta en `frontend/src/utils/scoring.ts`:

- precio: menor es mejor.
- kilometraje: menor es mejor.
- año: mas nuevo es mejor.
- potencia: mayor es mejor, extraida desde strings como `"140 CV"`.
- equipamiento: mayor cantidad de features es mejor.

Cada categoria se normaliza a una escala de 0 a 20. El puntaje total es la suma de las categorias.

`summary-generator.ts` arma textos de recomendacion y opiniones para detalle/comparacion. No llama a un servicio externo de IA; genera frases localmente.

## Tema claro/oscuro

El tema se administra en `frontend/src/utils/theme.ts`.

Funcionamiento:

- Lee `autopoint-theme` desde `localStorage`.
- Si no existe, usa `prefers-color-scheme`.
- Aplica el tema con `document.documentElement.dataset.theme`.
- Sincroniza todos los botones con `data-theme-toggle`.

Los estilos del tema oscuro estan centralizados en `frontend/src/style.css` usando selectores como:

```css
:root[data-theme="dark"] .bg-white {
  ...
}
```

## Estilos

El proyecto combina utilidades Tailwind en los templates con estilos globales para:

- variables de marca,
- tema oscuro,
- fondos,
- animaciones,
- navbar mobile,
- ajustes de componentes compartidos.

Conviene usar las variables CSS globales cuando un color representa identidad o tema:

```css
var(--brand)
var(--text)
var(--text-muted)
var(--surface)
```

## Como agregar una pagina

1. Crear `frontend/src/pages/nueva-pagina.ts`.
2. Exportar `renderNuevaPagina(container: HTMLElement): void`.
3. Agregar la ruta en `ROUTES`.
4. Importar el render en `main.ts`.
5. Agregar un `case` en `renderRoute()`.
6. Si corresponde, agregar el acceso en `NavBar`.
7. Registrar listeners despues de asignar `container.innerHTML`.

## Como agregar estado persistente

1. Crear o extender un servicio en `src/services/`.
2. Definir una clave de `localStorage` clara y prefijada.
3. Encapsular lectura, parseo, fallback y escritura.
4. Evitar que las paginas lean/escriban JSON directamente.

Ejemplo recomendado:

```ts
const FEATURE_KEY = "autopoint_feature";

export function getFeatureState(): FeatureState {
  const stored = localStorage.getItem(FEATURE_KEY);

  if (!stored) return defaultState;

  try {
    return JSON.parse(stored) as FeatureState;
  } catch {
    return defaultState;
  }
}
```

## Consideraciones para evolucionar el proyecto

- Mover autenticacion y publicaciones a una API real cuando se necesiten multiples dispositivos o usuarios reales.
- Reemplazar Data URLs de imagenes por subida a storage externo.
- Unificar tipos legacy de `src/types/car.ts` y `src/data/cars.ts`.
- Agregar tests unitarios para servicios (`auth`, `comparison`, `published-cars`) antes de cambiar reglas de negocio.
- Evitar duplicar paginas antiguas cuando se consoliden las variantes `v2`.
