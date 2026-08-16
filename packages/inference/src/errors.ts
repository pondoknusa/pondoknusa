export class InferenceError extends Error {
  constructor(
    message: string,
    readonly provider: string,
    readonly status?: number,
    readonly body?: string,
  ) {
    super(message);
    this.name = 'InferenceError';
  }
}
