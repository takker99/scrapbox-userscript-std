// this file is copied from https://cdn.esm.sh/v54/socket.io-client@4.2.0/build/index.d.ts
import { ManagerOptions } from "./manager.ts";
import { Socket, SocketOptions } from "./socket.ts";
/**
 * Looks up an existing `Manager` for multiplexing.
 * If the user summons:
 *
 *   `io('http://localhost/a');`
 *   `io('http://localhost/b');`
 *
 * We reuse the existing instance based on same scheme/port/host,
 * and we initialize sockets for each namespace.
 *
 * @public
 */
declare function lookup(opts?: Partial<ManagerOptions & SocketOptions>): Socket;
declare function lookup(
  uri: string,
  opts?: Partial<ManagerOptions & SocketOptions>,
): Socket;
declare function lookup(
  uri: string | Partial<ManagerOptions & SocketOptions>,
  opts?: Partial<ManagerOptions & SocketOptions>,
): Socket;
/**
 * Protocol version.
 *
 * @public
 */
export { protocol } from "./parser.ts";
/**
 * Expose constructors for standalone build.
 *
 * @public
 */
export type { Manager, ManagerOptions } from "./manager.ts";
export { Socket } from "./socket.ts";
export type { lookup as io, SocketOptions };
export default lookup;
