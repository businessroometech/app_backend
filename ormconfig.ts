import { env } from './src/common/utils/envConfig';

//-------------- for production env

// export default {
//   type: "mysql",
//   host: env.AWS_HOST,
//   port: 3306,
//   username: env.AWS_USERNAME,
//   password: env.AWS_PASSWORD,
//   database: env.AWS_DB_NAME,
//   synchronize: true,
//   logging: false,
//   entities: ["src/api/entity/**/*.ts"],
//   migrations: ["src/migration/**/*.ts"],
//   subscribers: ["src/subscriber/**/*.ts"],
//   cli: {
//     entitiesDir: "src/api/entity",
//     migrationsDir: "src/migration",
//     subscribersDir: "src/subscriber"
//   }
// };

export default {
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: "adkood",
  password: "Adkood@1234",
  database: "connect",
  synchronize: true,
  logging: false,
  entities: ["src/api/entity/**/*.ts"],
  migrations: ["src/migration/**/*.ts"],
  subscribers: ["src/subscriber/**/*.ts"],
  cli: {
    entitiesDir: "src/api/entity",
    migrationsDir: "src/migration",
    subscribersDir: "src/subscriber"
  }
};