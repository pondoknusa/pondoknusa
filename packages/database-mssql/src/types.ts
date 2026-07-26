export interface MssqlConnectionConfig {
  driver: 'mssql';
  host: string;
  port?: number;
  database: string;
  username: string;
  password: string;
  encrypt?: boolean;
  trustServerCertificate?: boolean;
}
