# session-client

Wrapper de **SessionService**, el microservicio de sesiones por gRPC. La clase `SessionClient` esconde gRPC detrás de 4 métodos que devuelven Promesas. Quien la usa no ve canales, stubs, callbacks ni deadlines.

El servidor (Python + PostgreSQL) vive en el repo `session-server`. Este repo solo tiene el cliente.

## Requisitos

- Node.js 20 o superior
- pnpm
- Un `session-server` corriendo (por defecto en `localhost:50051`)

## Instalación

```powershell
pnpm install
```

pnpm ignora el script de build de `protobufjs` (está en `pnpm-workspace.yaml`); no hace falta.

Para usarlo desde otro proyecto en la misma máquina, como la `mini-app`:

```powershell
pnpm add link:../micro-session-cli
```

## Uso

```js
import { SessionClient, status } from 'session-client';

const sessions = new SessionClient();          // usa SESSION_SERVICE_ADDR o localhost:50051

const user  = await sessions.createUser('marie', 'clave1234', 'Marie');
const login = await sessions.login('marie', 'clave1234');      // { token, expires_at, user }
const { user: actual } = await sessions.validateSession(login.token);
await sessions.logout(login.token);                             // { ok: true }
```

| Método | RPC | Devuelve | Errores (`err.code`) |
|---|---|---|---|
| `createUser(username, password, displayName)` | `UserService/CreateUser` | `{ id, username, display_name }` | `ALREADY_EXISTS`, `INVALID_ARGUMENT` |
| `login(username, password)` | `SessionService/Login` | `{ token, expires_at, user }` | `UNAUTHENTICATED` |
| `validateSession(token)` | `SessionService/ValidateSession` | `{ user, expires_at }` | `UNAUTHENTICATED` |
| `logout(token)` | `SessionService/Logout` | `{ ok }` | — |

El servidor guarda el `username` en minúsculas y exige contraseñas de 6 caracteres o más. Si no se cumplen, responde `INVALID_ARGUMENT`.

Si el servidor no responde en 3 segundos, la llamada falla con `DEADLINE_EXCEEDED`, y si está apagado, con `UNAVAILABLE`. Para comparar los códigos usa `status`, por ejemplo `err.code === status.UNAUTHENTICATED`.

## Variables de entorno

| Variable | Por defecto | Para qué |
|---|---|---|
| `SESSION_SERVICE_ADDR` | `localhost:50051` | Dirección `IP:puerto` del servidor |

## Probar el wrapper solo

Con el servidor corriendo:

```powershell
pnpm test
# contra otra máquina:
$env:SESSION_SERVICE_ADDR = "192.168.1.20:50051"; pnpm test
```

El test registra un usuario nuevo y recorre login, validate y logout, más los casos de error. Imprime un `ok` por cada paso.

## Contrato

`proto/session.proto` es una **copia** del original en `session-server`, y aquí no se edita. Las reglas están en [CONTRIBUTING.md](CONTRIBUTING.md).
