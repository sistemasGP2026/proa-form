# PROA — Formulario de Autorización de Antimicrobianos

Aplicación monolítica **NestJS + Handlebars + MongoDB** para el Programa de
Optimización de Antimicrobianos (PROA).

```
Usuario
   ↓
NestJS
   ├── Controllers
   ├── Services
   ├── Auth / JWT (cookie httpOnly)
   ├── Mongoose
   ├── MongoDB
   └── Vistas Handlebars
```

---

## Requisitos

- Node.js 20 o superior
- MongoDB 6 o superior (local o Atlas)
- MongoDB Compass (opcional, para inspeccionar los datos)

## Puesta en marcha

```powershell
npm install
Copy-Item .env.example .env    # y ajuste los valores
npm run seed -- --catalogos    # usuario administrador + catálogos base
npm run start:dev
```

La aplicación queda en `http://localhost:3000`.
El ingreso es `/auth/sign-in`; el formulario clínico es `/form`.

### Variables de entorno

| Variable | Descripción |
|---|---|
| `PORT` | Puerto HTTP. Por defecto `3000`. |
| `MONGODB_URI` | Cadena de conexión. Local: `mongodb://127.0.0.1:27017/proa`. Atlas: `mongodb+srv://...` |
| `JWT_SECRET` | Secreto de firma del token. **Cámbielo en producción.** |
| `JWT_EXPIRES` | Vigencia del token, p. ej. `8h`. |
| `NODE_ENV` | `development` o `production`. En producción se desactiva `autoIndex`. |

El archivo `.env` no se versiona. Use `.env.example` como plantilla.

---

## Base de datos

Base: **`proa`**. Colecciones:

| Colección | Contenido |
|---|---|
| `usuarios` | Credenciales y rol (`ADMINISTRADOR`, `AUX_FARMACIA`, `SOLICITANTE`). Contraseñas con bcrypt. |
| `sedes` | Catálogo de sedes. |
| `servicios` | Catálogo de servicios / áreas. |
| `diagnosticos_infecciosos` | Catálogo de diagnósticos. |
| `especialidades_tratantes` | Catálogo de especialidades. |
| `antibioticos` | Catálogo, con tipo `RESTRINGIDO` o `VIGILADO`. |
| `solicitudes` | Solicitud con `evaluacion`, `profilaxis` e `items[]` **embebidos**. |
| `revisiones` | Dictámenes sobre solicitudes; referencia a solicitud y usuario. |

### Criterios de modelado

- **Embebido** lo que no tiene sentido fuera de su documento padre: la evaluación
  del paciente, la condición de profilaxis y los ítems formulados viven dentro de
  la solicitud. Cada ítem conserva su propio `_id`, que es el identificador que usa
  el dictamen en lote.
- **Referenciado** lo que se consulta y administra por separado: sedes,
  antibióticos y usuarios.
- El **estado de un antibiótico prescrito vive en el ítem**, no en el catálogo.
  En el modelo SQL Server anterior el estado se guardaba en la tabla `antibioticos`,
  de modo que suspender un medicamento en una solicitud lo suspendía en todas.
- `FINALIZADO` no se almacena: se calcula comparando `fechaFin` con la fecha
  actual, igual que hacía el `CASE ... GETDATE()` de SQL Server.

---

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run start:dev` | Desarrollo con recarga automática. |
| `npm run build` | Compila a `dist/`. |
| `npm run start:prod` | Ejecuta `dist/main`. |
| `npm run seed` | Crea el usuario administrador. Idempotente. |
| `npm run seed -- --catalogos` | Además carga sedes, servicios, diagnósticos, especialidades y antibióticos base. |
| `npm run migrate` | Migración SQL Server → MongoDB en **simulación**. |
| `npm run migrate -- --aplicar` | Ejecuta la migración escribiendo en MongoDB. |

### Usuario inicial

`npm run seed` crea `admin` / `Proa2026*` si no existe.
Cámbielo desde `/usuarios` después del primer ingreso, o defina
`SEED_ADMIN_USER`, `SEED_ADMIN_PASSWORD` y `SEED_ADMIN_NOMBRE` antes de ejecutarlo.

### Migración de datos desde SQL Server

El script lee `Proa_Form`, transforma los registros y los inserta en MongoDB.
No borra nada y, sin `--aplicar`, no escribe: solo informa estadísticas e
incidencias. Requiere el paquete `mssql`, que ya no es dependencia de la
aplicación:

```powershell
npm install --no-save mssql
# complete las variables SQLSERVER_* en .env
npm run migrate                 # revise el informe
npm run migrate -- --aplicar    # ejecute
```

---

## Estructura

```
proa-form/
├── src/
│   ├── admin/          antibiotico/     auth/
│   ├── catalogos/      diagnostico_infeccioso · especialidad_tratante · sedes · servicios
│   ├── common/pipes/   ParseObjectIdPipe (sustituye a ParseIntPipe)
│   ├── form/           jwt/             revisiones/
│   ├── solicitudes/    usuarios/        utils/
│   ├── app.module.ts
│   └── main.ts
├── views/              plantillas .hbs, CSS y JS del navegador
├── scripts/            seed.ts · migrate-sqlserver-to-mongodb.ts
├── .env.example
└── package.json
```

### Nota sobre Handlebars y Mongoose

Handlebars bloquea el acceso a propiedades heredadas del prototipo, y los
documentos hidratados de Mongoose exponen sus campos precisamente así. Por eso
las consultas usan `.lean()` y pasan por `toPlain()` (`src/utils/mongo.util.ts`),
que convierte `ObjectId` a cadena y agrega `id` junto a `_id`. Sin esa
conversión las vistas se renderizarían vacías.

---

## Rutas

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/form` | Formulario clínico (público). |
| `POST` | `/solicitudes` | Registra una solicitud (público). |
| `GET`/`POST` | `/auth/sign-in`, `POST /auth/logout` | Sesión. |
| `GET` | `/admin` | Tablero de solicitudes. |
| `GET` | `/solicitudes`, `/solicitudes/:id`, `/solicitudes/download` | Listado, detalle y exportación a Excel. |
| `PATCH` | `/solicitudes/:id/items/estado` | Dictamen en lote; genera una revisión. |
| `GET` | `/revisiones`, `/revisiones/:id` | Historial de dictámenes. |
| — | `/sedes`, `/servicios`, `/diagnosticos`, `/especialidades`, `/antibioticos`, `/usuarios` | CRUD de catálogos y usuarios. |

---

## Pendientes conocidos

- Los catálogos `/sedes`, `/servicios`, `/diagnosticos` y `/especialidades` están
  marcados `@Public()` con CRUD completo: cualquiera sin autenticar puede crear o
  eliminar registros. Conviene protegerlos con `JwtAuthGuard`.
- Tras enviar el formulario, `POST /solicitudes` devuelve JSON en crudo en lugar
  de una página de confirmación.
- `views/partials/layout/main.hbs` y `views/partials/components/card-antibiotico.hbs`
  no los incluye ninguna vista.
