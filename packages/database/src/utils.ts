export function snakeCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

export function singularSnakeCase(modelName: string): string {
  const snake = snakeCase(modelName);
  if (snake.endsWith('s')) {
    return snake.slice(0, -1);
  }
  return snake;
}