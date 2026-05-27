# Guia del frontend

Esta guia explica como moverse dentro del frontend de AutoPoint y que patrones conviene seguir al agregar pantallas, servicios o componentes.

## Stack

- Vite como bundler y servidor de desarrollo.
- TypeScript para tipado.
- Tailwind CSS 4 para utilidades de estilo.
- CSS global propio en `src/style.css`.
- Axios para consumir la API.
- SPA sin framework: las paginas y componentes generan HTML como strings y luego conectan eventos del DOM.

## Comandos

```bash
cd frontend
npm install
npm run dev
npm run build
npm run preview
```

Variable local recomendada:

```env
VITE_API_URL=http://localhost:3000/api
```

`frontend/src/services/api.ts` normaliza la URL para que termine en `/api`.

## Punto de entrada y router

`frontend/src/main.ts` hace el bootstrap de la SPA:

1. Importa `style.css`.
2. Inicializa el tema.
3. Decide que pagina renderizar segun `window.location.pathname`.
4. Aplica redirecciones basicas por autenticacion.

El router esta en `frontend/src/utils/router.ts`. No hay libreria externa: `navigateTo(route)` usa History API y dispara el render de la ruta nueva.

Para agregar una ruta:

1. Agregar la constante en `ROUTES`.
2. Crear la pagina en `frontend/src/pages/`.
3. Importar el renderer en `main.ts`.
4. Agregar el `case` correspondiente.
5. Agregar links en `NavBar` si corresponde.

## Patron de paginas

Cada pagina exporta una funcion que recibe el contenedor principal:

```ts
export function renderExamplePage(container: HTMLElement): void {
  container.innerHTML = `
    <main>
      ...
    </main>
  `;

  document.getElementById("save-button")?.addEventListener("click", () => {
    ...
  });
}
```

Regla importante: como cada navegacion reemplaza `container.innerHTML`, los listeners se registran siempre despues de insertar el HTML.

## Componentes

Los componentes de `frontend/src/components/` son funciones que devuelven markup HTML como string.

Convenciones:

- Mantenerlos lo mas puros posible.
- Pasar datos por parametros.
- No guardar estado interno persistente dentro del componente.
- Registrar eventos desde la pagina que inserta el componente, salvo casos muy puntuales.
- Escapar texto dinamico con helpers como `escapeHtml` cuando venga de usuarios o de la API.

Componentes destacados:

- `NavBar`: navegacion principal segun rol.
- `Button`, `Input`, `Select`, `Card`, `StatCard`: piezas UI reutilizables.
- `ThemeToggle`: cambio de tema.
- `Toast`: notificaciones.
- `CarComparisonCard`, `ComparisonTable`, `RecommendationSummary`: comparador.
- `ErrorMessage`: mensajes de error/validacion.

## Servicios HTTP

La entrada para llamadas a la API es `frontend/src/services/api.ts`.

Ese archivo:

- Define `API_BASE_URL`.
- Crea `apiClient` de Axios.
- Inyecta el JWT guardado en la sesion.
- Limpia la sesion ante respuestas `401`.
- Convierte errores HTTP en `ApiError`.
- Expone helpers como `apiGet`, `apiPost`, `apiPatch` y `apiDelete`.

Patron recomendado para un servicio nuevo:

```ts
import { apiGet, apiPost } from "./api";
import type { Example } from "../types/example";

export function getExamples(): Promise<Example[]> {
  return apiGet<Example[]>("examples");
}

export function createExample(body: CreateExampleBody): Promise<Example> {
  return apiPost<Example>("examples", body);
}
```

Las paginas no deberian usar Axios directo. Crear o extender un servicio en `src/services/`.

## Autenticacion en frontend

Archivos principales:

- `frontend/src/services/auth.ts`
- `frontend/src/services/api.ts`
- `frontend/src/types/auth.ts`
- `frontend/src/types/user.ts`

La sesion se guarda con la clave `auto_market_session` en `localStorage` y `sessionStorage`. El token se lee en el interceptor de Axios y se envia como:

```http
Authorization: Bearer <token>
```

Si la API responde `401`, `api.ts` limpia la sesion y dispara `auth:unauthorized`.

## Roles y permisos UI

Roles usados:

- `buyer`: busca autos, guarda favoritos, compara y pregunta.
- `seller`: publica, edita, elimina y responde preguntas.

El backend es la fuente real de permisos. El frontend solo adapta la UI para evitar acciones que no correspondan al rol actual.

## Paginas principales

- `landing.ts`: portada publica.
- `login.ts`: inicio de sesion.
- `register.ts`: alta de usuario.
- `home.ts`: listado principal; cambia segun comprador/vendedor.
- `car-detail.ts`: detalle, galeria, favoritos, preguntas y analisis IA.
- `favorites.ts`: favoritos del comprador.
- `comparator-page-v2.ts`: comparador activo.
- `publish-v2.ts`: publicacion y edicion de autos.
- `profile.ts`: perfil.
- `change-password.ts`: cambio de contrasena.
- `about.ts`: informacion institucional.

## Uploads e imagenes

Flujo esperado:

1. La pagina arma un `FormData`.
2. El servicio de uploads envia el archivo a la API.
3. El backend devuelve rutas como `/uploads/archivo.jpg`.
4. El frontend guarda/renderiza esas rutas.
5. Para mostrar imagenes, usar la URL tal como llega del backend o resolverla contra `VITE_API_URL` si el contexto lo necesita.

No convertir imagenes nuevas a Data URLs en frontend para persistencia de negocio. La fuente real debe ser backend/uploads o un storage externo.

## IA en frontend

Archivos:

- `frontend/src/services/ai.ts`
- `frontend/src/types/ai.ts`
- `frontend/src/pages/car-detail.ts`
- `frontend/src/pages/comparator-page-v2.ts`

El servicio mantiene cache de promesas en memoria para evitar requests duplicados mientras una solicitud esta en curso. Tambien aplica cooldown del lado cliente.

La UI debe:

- Mostrar loading antes de llamar.
- Deshabilitar botones mientras espera.
- Usar `getAIErrorMessage` para errores.
- No inventar resultados si la API falla.

El shape esperado del analisis visual sigue siendo:

```ts
{
  visualCondition: string;
  detectedIssues: string[];
  positiveAspects: string[];
  confidence: number;
}
```

## Tema y estilos

El tema esta en `frontend/src/utils/theme.ts`.

Funcionamiento:

- Lee `autopoint-theme`.
- Si no existe, usa `prefers-color-scheme`.
- Aplica `document.documentElement.dataset.theme`.
- Sincroniza botones con `data-theme-toggle`.

`frontend/src/style.css` contiene Tailwind, estilos globales, tema oscuro, navbar mobile, animaciones y ajustes de componentes compartidos.

## Checklist para agregar una pantalla

1. Crear tipo(s) en `src/types/` si hacen falta.
2. Crear servicio en `src/services/` si consume API.
3. Crear pagina en `src/pages/`.
4. Agregar ruta en `ROUTES`.
5. Registrar renderer en `main.ts`.
6. Agregar link en `NavBar` si corresponde.
7. Manejar loading, error y empty state.
8. Escapar texto dinamico.
9. Probar comprador/vendedor si la pantalla depende del rol.
10. Correr `npm run build`.

## Checklist para tocar un servicio

1. No llamar Axios directo desde paginas.
2. Tipar request y response.
3. Usar `ApiError` para mensajes de usuario.
4. Evitar requests duplicados si el flujo puede dispararse varias veces.
5. Mantener nombres de endpoints sin `/api`, porque `API_BASE_URL` ya lo incluye.

## Problemas comunes

- Si aparecen `401`, revisar token guardado y que el backend este usando el mismo `JWT_SECRET`.
- Si no cargan imagenes, revisar que el backend sirva `/uploads` y que la URL no apunte al frontend.
- Si falla CORS, revisar `CORS_ORIGIN` en backend/Railway.
- Si Netlify devuelve 404 en rutas internas, revisar `frontend/public/_redirects` y `netlify.toml`.
