import type { ConnectionOptions } from 'node:tls';

export interface PgConnectionConfig {
  driver: 'postgres';
  host: string;
  port?: number;
  database: string;
  username: string;
  password: string;
  /**
   * TLS for the connection. `true` enables TLS with server certificate
   * verification (the secure default). Pass an object to customize TLS —
   * for example to pin a `ca` certificate. Setting
   * `rejectUnauthorized: false` explicitly opts out of certificate
   * verification and is vulnerable to man-in-the-middle attacks.
   */
  ssl?: boolean | ConnectionOptions;
}