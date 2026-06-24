export interface EchoClientConfig {
  broadcaster: 'socketio' | 'pusher';
  key?: string;
  cluster?: string;
  host?: string;
  authEndpoint: string;
}