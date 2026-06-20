import { RouteNotFoundException } from '@tyravel/http';
import { Response } from '@tyravel/http';
import { ValidationException } from '@tyravel/validation';
import type { Application } from './application.js';

export class HttpKernel {
  constructor(private readonly app: Application) {}

  async handle(request: Request): Promise<Response> {
    try {
      return await this.app.router().dispatch(request);
    } catch (error) {
      if (error instanceof RouteNotFoundException) {
        return Response.json({ message: error.message }, { status: 404 });
      }

      if (error instanceof ValidationException) {
        const validationError = error as ValidationException;
        return Response.json(
          {
            message: validationError.message,
            errors: validationError.errors,
          },
          { status: 422 },
        );
      }

      console.error(error);
      return Response.json({ message: 'Server Error' }, { status: 500 });
    }
  }
}