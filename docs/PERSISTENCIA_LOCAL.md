# Persistencia local y datos mock

AutoPoint funciona como prototipo frontend-first. En vez de consultar un backend, guarda los datos editables en el navegador.

## Donde se guardan los datos

La app usa:

- `localStorage`: datos persistentes entre recargas y reaperturas del navegador.
- `sessionStorage`: datos temporales de navegacion, como la pagina anterior antes de abrir un detalle.

Esto significa que cada navegador tiene su propio estado. Si se abre la app en otro navegador, modo incognito u otra maquina, los datos no aparecen.

## Claves de localStorage

| Clave | Servicio | Contenido |
| --- | --- | --- |
| `auto_market_session` | `services/auth.ts` | Usuario autenticado actual, sin contraseña |
| `auto_market_users` | `services/auth.ts` | Usuarios registrados, incluyendo usuarios demo |
| `published_cars` | `services/published-cars.ts` | Autos publicados por vendedores |
| `autopoint_favorites` | `services/favorites.ts` | IDs de autos favoritos |
| `autopoint_comparison` | `services/comparison.ts` | IDs de autos seleccionados para comparar |
| `autopoint_car_questions` | `services/car-questions.ts` | Preguntas y respuestas por publicacion |
| `autopoint-theme` | `utils/theme.ts` | Tema elegido: `light` o `dark` |

## Usuarios

Si `auto_market_users` no existe o esta corrupto, `auth.ts` restaura estos usuarios:

```ts
[
  {
    id: 1,
    name: "Bruno Lopez",
    email: "buyer@autopoint.com",
    password: "1234",
    role: "buyer",
    avatarUrl: null,
  },
  {
    id: 2,
    name: "Lucia Fernandez",
    email: "seller@autopoint.com",
    password: "1234",
    role: "seller",
    avatarUrl: null,
  },
]
```

La sesion guardada en `auto_market_session` no incluye contraseña. Contiene:

```ts
{
  id: number;
  name: string;
  email: string;
  role: "buyer" | "seller";
  avatarUrl: string | null;
}
```

## Publicaciones

Los autos semilla viven en `src/data/cars.ts`. Los autos creados desde el formulario de vendedor se guardan aparte en `published_cars`.

`published-cars.ts` convierte publicaciones al formato principal `Car` con `publishedCarToCar()` para que puedan aparecer en:

- listado de comprador,
- detalle,
- favoritos,
- comparador.

Cada publicacion agrega:

```ts
{
  sellerId: number;
  publishedAt: string;
}
```

El `id` se genera con timestamp y un sufijo aleatorio:

```text
published_...
```

## Imagenes

Los autos semilla usan rutas de `frontend/public/images/`.

Las imagenes cargadas por usuarios se leen con `FileReader` y se guardan como Data URLs. Este enfoque es simple para un trabajo practico o prototipo, pero tiene limites:

- puede ocupar mucho espacio en `localStorage`,
- no sirve para compartir imagenes entre dispositivos,
- no reemplaza un storage real de archivos.

Para produccion convendria subir imagenes a un backend o servicio externo y guardar solo URLs.

## Favoritos

`autopoint_favorites` guarda un array de IDs:

```ts
["1", "published_..."]
```

El servicio expone:

- `getFavorites()`
- `isFavorite(carId)`
- `toggleFavorite(carId)`
- `addFavorite(carId)`
- `removeFavorite(carId)`

## Comparador

`autopoint_comparison` guarda IDs de autos seleccionados. El limite esta definido en `services/comparison.ts`:

```ts
const MAX_COMPARISON_CARS = 4;
```

El servicio evita duplicados y devuelve razones cuando no puede agregar un auto:

- `duplicate`
- `limit`

## Preguntas y respuestas

`autopoint_car_questions` guarda preguntas publicas asociadas a un auto:

```ts
{
  id: string;
  carId: string;
  buyerId: number;
  sellerId: number;
  question: string;
  createdAt: string;
  answer?: string;
  answeredAt?: string;
}
```

Solo el vendedor dueño de la publicacion puede responder una pregunta, porque `answerPublicQuestion()` valida `sellerId`.

## Resetear datos

Desde DevTools, en la consola:

```js
localStorage.clear()
sessionStorage.clear()
location.reload()
```

Tambien se puede borrar solo una clave:

```js
localStorage.removeItem("published_cars")
```

## Recomendaciones si se conecta un backend

- Mantener los servicios como capa de acceso a datos y reemplazar internamente `localStorage` por `fetch`.
- Conservar los tipos principales (`Car`, `SessionUser`, `PublishedCar`) como contrato entre UI y API.
- No leer `localStorage` directamente desde paginas nuevas; usar servicios para facilitar la migracion.
- Mover validaciones sensibles al backend, especialmente autenticacion, roles y propiedad de publicaciones.
