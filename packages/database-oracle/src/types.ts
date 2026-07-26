export interface OracleConnectionConfig {
  driver: 'oracle';
  host: string;
  port?: number;
  database: string;
  username: string;
  password: string;
}
