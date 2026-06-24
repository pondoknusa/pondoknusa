export interface EchoClientConfig {
  broadcaster: 'websocket';
  host?: string;
  path?: string;
  authEndpoint: string;
}