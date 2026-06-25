export interface RouteEntry {
  method: string;
  uri: string;
  name?: string;
  middleware: string[];
  action: string;
}

export interface ModelEntry {
  name: string;
  file: string;
  table?: string;
}

export interface DocEntry {
  path: string;
  title: string;
}

export interface CapabilityManifest {
  name: string;
  version: string;
  packages: string[];
  facades: string[];
  commands: string[];
  routes?: RouteEntry[];
  models?: ModelEntry[];
  configKeys?: string[];
  docs?: DocEntry[];
}

export interface AppMcpContext {
  manifest: CapabilityManifest;
  routes: RouteEntry[];
  models: ModelEntry[];
  configKeys: string[];
  commands: string[];
  docs: DocEntry[];
  getConfig?: (key: string) => unknown;
}