export class AppServiceProvider {
  register(app: { middleware: (name: string, fn: unknown) => void }): void {
    app.middleware('json', () => undefined);
  }
}
