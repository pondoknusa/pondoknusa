export default {
  default: 'sqlite',
  connections: {
    sqlite: {
      driver: 'sqlite',
      database: 'database/database.sqlite',
    },
    postgres: {
      driver: 'postgres',
      host: '127.0.0.1',
      port: 5432,
      database: 'tyravel',
      username: 'postgres',
      password: '',
    },
    mysql: {
      driver: 'mysql',
      host: '127.0.0.1',
      port: 3306,
      database: 'tyravel',
      username: 'root',
      password: '',
    },
  },
} as const;