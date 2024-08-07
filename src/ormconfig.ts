import { env } from './common/utils/envConfig';

export default {
  type: 'mysql',
  host: env.NODE_ENV === 'production' ? env.DEV_AWS_HOST : env.DEV_AWS_HOST,
  port: 3306,
  username: env.NODE_ENV === 'production' ? env.DEV_AWS_USERNAME : env.DEV_AWS_USERNAME,
  password: env.NODE_ENV === 'production' ? env.DEV_AWS_PASSWORD : env.DEV_AWS_PASSWORD,
  database: env.NODE_ENV === 'production' ? env.DEV_AWS_DB_NAME : env.DEV_AWS_DB_NAME,
  synchronize: true,
  logging: false,
  entities: ['src/api/entity/**/*.ts'],
  migrations: ['src/migration/**/*.ts'],
  subscribers: ['src/subscriber/**/*.ts'],
  cli: {
    entitiesDir: 'src/api/entity',
    migrationsDir: 'src/migration',
    subscribersDir: 'src/subscriber',
  },
};
