# Cómo contribuir a session-client

## Reglas del contrato

1. El original de `session.proto` vive en `session-server`. En este repo es una copia que nunca se edita.
2. Ningún cambio al contrato sin acordarlo entre las dos.
3. Nunca cambiar ni reutilizar el número de un campo. Los campos eliminados se marcan `reserved`.
4. No quitar `package auth;` ni renombrar servicios o métodos.
5. Cada cambio sube la versión en la primera línea del `.proto` (y en `CONTRACT.md` del servidor).

Para actualizar la copia: copia el archivo de `session-server/proto/` a `proto/` y comprueba que la primera línea dice la misma versión.

## Reglas del wrapper

1. `sessionClient.js` es el **único** archivo que importa gRPC. Esta es la regla que lo hace un wrapper. Si la app necesita un código de error, lo toma de `status`, que exporta el wrapper.
2. Un método por RPC. Cada uno tiene deadline de 3 segundos y devuelve una Promesa.
3. La dirección del servidor sale de `SESSION_SERVICE_ADDR` y nunca se escribe en el código.

## Reglas de Git

1. `main` siempre funciona. Se trabaja en ramas `feature/<tema>`.
2. Los commits llevan prefijo: `feat:`, `fix:`, `docs:` o `chore:`.
3. Nunca subir contraseñas, `.env` ni `node_modules/`.

## Antes de cada push

- [ ] Con el servidor corriendo, `pnpm test` termina en "Todo bien".
- [ ] Si cambió el `.proto`, la primera línea coincide con la del servidor.
