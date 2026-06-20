export type ViewContext = Record<string, unknown>;

export interface ViewConfig {
  path: string;
  extension?: string;
}

export interface CompiledTemplate {
  layout?: string;
  ops: TemplateOp[];
}

export type TemplateOp =
  | { type: 'text'; value: string }
  | { type: 'echo'; expression: string; raw: boolean }
  | { type: 'if'; expression: string; body: TemplateOp[]; elseBody?: TemplateOp[] }
  | { type: 'foreach'; expression: string; body: TemplateOp[] }
  | { type: 'section'; name: string; body: TemplateOp[] }
  | { type: 'yield'; name: string; defaultValue?: string }
  | { type: 'include'; name: string; dataExpression?: string }
  | { type: 'component'; name: string; dataExpression?: string };