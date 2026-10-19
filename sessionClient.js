// EL WRAPPER: esconde gRPC detrás de métodos simples que devuelven Promesas.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROTO_PATH = path.join(__dirname, 'proto', 'session.proto');

// Lee el .proto en tiempo de ejecución y crea las clases de los stubs (no hace falta protoc en Node)
const definition = protoLoader.loadSync(PROTO_PATH, { keepCase: true, longs: Number, defaults: true });
const auth = grpc.loadPackageDefinition(definition).auth;

// Códigos de error de gRPC (status.UNAUTHENTICATED, etc.), para que la app no tenga que importar gRPC
export const status = grpc.status;

export class SessionClient {
  constructor(address = process.env.SESSION_SERVICE_ADDR || 'localhost:50051') {
    const credentials = grpc.credentials.createInsecure();
    this.users = new auth.UserService(address, credentials);       // stub de UserService
    this.sessions = new auth.SessionService(address, credentials); // stub de SessionService
  }

  // Convierte una llamada gRPC con callback en una Promesa, con 3 segundos de deadline
  #call(stub, method, request) {
    return new Promise((resolve, reject) => {
      const deadline = new Date(Date.now() + 3000);
      stub[method](request, { deadline }, (err, response) => (err ? reject(err) : resolve(response)));
    });
  }

  createUser(username, password, displayName) {
    return this.#call(this.users, 'CreateUser', { username, password, display_name: displayName });
  }

  login(username, password) {
    return this.#call(this.sessions, 'Login', { username, password });
  }

  validateSession(token) {
    return this.#call(this.sessions, 'ValidateSession', { token });
  }

  logout(token) {
    return this.#call(this.sessions, 'Logout', { token });
  }
}