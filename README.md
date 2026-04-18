# AutoPoint - Marketplace de autos usados

AutoPoint es una aplicacion web tipo marketplace para buscar, comparar, guardar y publicar autos usados. El proyecto esta armado como una SPA de frontend con Vite, TypeScript y Tailwind CSS. La persistencia actual es local, usando `localStorage` y `sessionStorage`, por lo que no requiere una base de datos ni un backend corriendo para probar sus flujos principales.

## Funcionalidades principales

- Landing publica con navegacion hacia login, registro y seccion informativa.
- Registro e inicio de sesion con usuarios compradores y vendedores.
- Panel de comprador con busqueda, filtros, favoritos y detalle de vehiculos.
- Comparador de hasta 4 autos con scoring por precio, kilometraje, año, potencia y equipamiento.
- Panel de vendedor con creacion, edicion y eliminacion de publicaciones.
- Preguntas publicas sobre autos publicados y respuestas del vendedor.
- Perfil de usuario, carga de avatar y cambio de contraseña.
- Tema claro/oscuro persistente.

## Tecnologias

- Vite 8
- TypeScript
- Tailwind CSS 4
- Lucide, para iconografia
- Netlify, como configuracion de deploy del frontend

## Requisitos

- Node.js 20 o superior recomendado
- npm

## Instalacion

Desde la raiz del repositorio:

```bash
cd frontend
npm install
```

El `package.json` de la raiz solo contiene dependencias auxiliares de Tailwind. La aplicacion que se ejecuta esta dentro de `frontend/`, por eso los comandos principales se corren desde esa carpeta.

## Uso en desarrollo

```bash
cd frontend
npm run dev
```

Vite levanta el servidor en:

```text
http://localhost:5173
```

Si el puerto esta ocupado, Vite puede ofrecer otro puerto automaticamente.

## Build de produccion

```bash
cd frontend
npm run build
```

Este comando ejecuta primero `tsc` y despues genera el build en:

```text
frontend/dist
```

Para revisar el build localmente:

```bash
cd frontend
npm run preview
```

## Usuarios demo

La app inicializa usuarios de prueba en `localStorage` cuando no encuentra usuarios guardados:

| Rol | Email | Contraseña |
| --- | --- | --- |
| Comprador | `buyer@autopoint.com` | `1234` |
| Vendedor | `seller@autopoint.com` | `1234` |

Nota: las cuentas demo tienen contraseña corta porque vienen precargadas. Las cuentas nuevas requieren al menos 6 caracteres, una letra y un numero.

## Estructura del proyecto

```text
.
├── backend/
│   └── main.ts
├── frontend/
│   ├── public/
│   │   ├── _redirects
│   │   ├── favicon.svg
│   │   ├── icons.svg
│   │   └── images/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── data/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── main.ts
│   │   └── style.css
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── docs/
├── netlify.toml
├── package.json
└── README.md
```

### Carpetas importantes

- `frontend/src/main.ts`: punto de entrada de la SPA. Inicializa el tema, resuelve la ruta actual y renderiza la pagina correspondiente.
- `frontend/src/pages/`: pantallas completas de la aplicacion.
- `frontend/src/components/`: componentes reutilizables que devuelven markup HTML como strings.
- `frontend/src/services/`: reglas de negocio y persistencia local.
- `frontend/src/data/`: datos semilla de autos y marcas.
- `frontend/src/utils/`: router, tema, validaciones, scoring, formateo, iconos y toasts.
- `frontend/src/style.css`: Tailwind y estilos globales, incluyendo soporte para tema oscuro.
- `frontend/public/_redirects`: fallback para que Netlify sirva `index.html` en rutas SPA.
- `backend/main.ts`: placeholder actual. El proyecto no depende de backend para funcionar en desarrollo.

## Rutas principales

| Ruta | Descripcion | Acceso |
| --- | --- | --- |
| `/` | Landing publica | Publico |
| `/login` | Inicio de sesion | Publico, redirige si ya hay sesion |
| `/register` | Registro | Publico, redirige si ya hay sesion |
| `/home` | Busqueda o publicaciones propias segun rol | Requiere sesion |
| `/about` | Sobre el proyecto | Publico |
| `/car-detail` | Detalle de vehiculo seleccionado | Segun navegacion interna |
| `/favorites` | Autos guardados | Comprador |
| `/comparator` | Comparador de autos | Comprador |
| `/publish` | Publicar nuevo vehiculo | Vendedor autenticado |
| `/edit-car` | Editar publicacion existente | Vendedor autenticado |
| `/profile` | Perfil de usuario | Requiere sesion |
| `/change-password` | Cambio de contraseña | Requiere sesion |

La navegacion interna usa History API mediante `navigateTo()` en `frontend/src/utils/router.ts`.

## Persistencia

El proyecto no usa API real todavia. Los datos editables se guardan en el navegador:

- `auto_market_session`: usuario autenticado.
- `auto_market_users`: usuarios registrados.
- `published_cars`: publicaciones creadas por vendedores.
- `autopoint_favorites`: favoritos del comprador.
- `autopoint_comparison`: autos seleccionados para comparar.
- `autopoint_car_questions`: preguntas y respuestas en publicaciones.
- `autopoint-theme`: preferencia de tema claro/oscuro.

Para resetear el estado, borrar el `localStorage` del sitio desde DevTools o ejecutar:

```js
localStorage.clear()
sessionStorage.clear()
```

## Deploy

El deploy esta preparado para Netlify con `netlify.toml`:

```toml
[build]
  command = "cd frontend && npm install && npm run build"
  publish = "frontend/dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

El redirect es necesario porque la aplicacion maneja rutas del lado del cliente.

## Documentacion adicional

- [Guia del frontend](docs/FRONTEND.md)
- [Persistencia local y datos mock](docs/PERSISTENCIA_LOCAL.md)

## Notas de desarrollo

- El proyecto renderiza vistas con TypeScript y templates HTML, sin framework de componentes.
- Los componentes son funciones que devuelven strings; despues cada pagina registra sus listeners.
- Las publicaciones creadas por vendedores se normalizan al formato `Car` para poder mostrarse junto con los autos semilla.
- Las imagenes cargadas desde formularios se guardan como Data URLs en `localStorage`; esto sirve para prototipo, pero no es ideal para produccion.
- `frontend/src/types/car.ts` contiene un tipo `Car` legacy distinto del modelo principal definido en `frontend/src/data/cars.ts`. Para nuevas funcionalidades de autos conviene usar el tipo exportado desde `data/cars`.
