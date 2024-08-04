import { env } from './src/common/utils/envConfig';

export default {
  type: 'mysql',
  host: env.NODE_ENV === 'production' ? env.AWS_HOST : 'localhost',
  port: 3306,
  username: env.NODE_ENV === 'production' ? env.AWS_USERNAME : env.LOCAL_DB_USERNAME,
  password: env.NODE_ENV === 'production' ? env.AWS_PASSWORD : env.LOCAL_DB_PASSWORD,
  database: env.NODE_ENV === 'production' ? env.AWS_DB_NAME : env.LOCAL_DB_NAME,
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
