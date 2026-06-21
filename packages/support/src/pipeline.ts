/**
 * A pipe handler: either a function or an object with a `handle` method.
 */
export type PipeHandler<TInput, TOutput = TInput> =
  | ((passable: TInput, next: (passable: TInput) => TOutput) => TOutput)
  | {
      handle(passable: TInput, next: (passable: TInput) => TOutput): TOutput;
    };

/**
 * The Pipeline pattern — send data through a series of pipes.
 *
 * Usage:
 *   Pipeline
 *     .send(request)
 *     .through([TrimStrings, HandleCors])
 *     .via('handle')
 *     .then((req) => controller.handle(req))
 */
export class Pipeline<TInput = unknown, TOutput = TInput> {
  private passable: TInput | undefined;
  private pipes: PipeHandler<TInput, TOutput>[] = [];
  private method = 'handle';

  /** Set the value to send through the pipeline. */
  send(passable: TInput): this {
    this.passable = passable;
    return this;
  }

  /** Set the array of pipe handlers. */
  through(pipes: PipeHandler<TInput, TOutput>[]): this {
    this.pipes = pipes;
    return this;
  }

  /** Set the method name to call on class-based pipes (default: 'handle'). */
  via(method: string): this {
    this.method = method;
    return this;
  }

  /** Run the pipeline and return the final result. */
  then(destination: (passable: TInput) => TOutput): TOutput {
    if (this.passable === undefined) {
      throw new Error('Pipeline.send() must be called before .then()');
    }

    // Build the pipe stack from right to left
    const stack = [...this.pipes].reverse();

    // Start with the destination
    let next: (passable: TInput) => TOutput = destination;

    // Wrap each pipe around the previous
    for (const pipe of stack) {
      const currentNext = next;
      if (typeof pipe === 'function') {
        next = (passable: TInput) => pipe(passable, currentNext);
      } else {
        const handler = pipe as Record<string, (passable: TInput, next: (passable: TInput) => TOutput) => TOutput>;
        const pipeFn = handler[this.method];
        if (!pipeFn) {
          throw new Error(`Pipe method [${this.method}] not found on pipe.`);
        }
        next = (passable: TInput) => pipeFn(passable, currentNext);
      }
    }

    return next(this.passable);
  }

  /** Run the pipeline and return the last value (identity destination). */
  thenReturn(): TOutput {
    return this.then((passable) => passable as unknown as TOutput);
  }
}
