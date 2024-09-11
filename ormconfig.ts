import { env } from './src/common/utils/envConfig';


export default {
  type: 'mysql',
  host: process.env.NODE_ENV === 'production' ? process.env.DEV_AWS_HOST : process.env.DEV_AWS_HOST,
  port: 3306,
  username: process.env.NODE_ENV === 'production' ? process.env.DEV_AWS_USERNAME : process.env.DEV_AWS_USERNAME,
  password: process.env.NODE_ENV === 'production' ? process.env.DEV_AWS_PASSWORD : process.env.DEV_AWS_PASSWORD,
  database: process.env.NODE_ENV === 'production' ? process.env.DEV_AWS_DB_NAME : process.env.DEV_AWS_DB_NAME,
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
