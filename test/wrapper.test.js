// Prueba SOLO el wrapper (sin la mini app) contra el servidor en SESSION_SERVICE_ADDR.
// Es el equivalente a test_client.py, pero del lado del cliente.
import assert from 'node:assert/strict';
import { SessionClient, status } from '../sessionClient.js';

const address = process.env.SESSION_SERVICE_ADDR || 'localhost:50051';
const client = new SessionClient(address);
const username = `test_${Date.now()}`;   // usuario nuevo en cada corrida
const password = 'clave1234';

// Espera que la promesa falle con un status de gRPC concreto
async function expectStatus(promise, code) {
  try {
    await promise;
  } catch (err) {
    assert.equal(err.code, code, `se esperaba ${code} y llegó ${err.code} (${err.details})`);
    return err;
  }
  assert.fail(`se esperaba el error ${code} y la llamada salió bien`);
}

let paso = 0;
async function step(nombre, fn) {
  paso += 1;
  await fn();
  console.log(`  ok ${paso}. ${nombre}`);
}

console.log(`Probando el wrapper contra ${address}\n`);

try {
  let token;

  await step('createUser devuelve el usuario sin contraseña', async () => {
    const user = await client.createUser(username, password, 'Usuario de prueba');
    assert.equal(user.username, username);
    assert.equal(user.display_name, 'Usuario de prueba');
    assert.ok(!('password' in user) && !('password_hash' in user));
  });

  await step('login devuelve token, expires_at y user', async () => {
    const login = await client.login(username, password);
    assert.ok(login.token.length > 20);
    assert.ok(login.expires_at > Date.now() / 1000);
    assert.equal(login.user.username, username);
    token = login.token;
  });

  await step('validateSession reconoce el token', async () => {
    const { user } = await client.validateSession(token);
    assert.equal(user.username, username);
  });

  await step('logout responde ok', async () => {
    const { ok } = await client.logout(token);
    assert.equal(ok, true);
  });

  await step('validateSession después de logout -> UNAUTHENTICATED', () =>
    expectStatus(client.validateSession(token), status.UNAUTHENTICATED));

  await step('createUser repetido -> ALREADY_EXISTS', () =>
    expectStatus(client.createUser(username, password, 'Otra vez'), status.ALREADY_EXISTS));

  await step('login con contraseña incorrecta -> UNAUTHENTICATED', () =>
    expectStatus(client.login(username, 'incorrecta'), status.UNAUTHENTICATED));

  console.log(`\nTodo bien: ${paso} pasos.`);
} catch (err) {
  console.error(`\nFalló el paso ${paso + 1}: ${err.message}`);
  if (err.code === status.UNAVAILABLE || err.code === status.DEADLINE_EXCEEDED) {
    console.error(`¿Está corriendo el servidor en ${address}?`);
  }
  process.exitCode = 1;
}
